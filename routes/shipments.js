require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios')


const { Client } = require('@googlemaps/google-maps-services-js');
const mongoose = require('mongoose')
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Account = require('../models/Account');
const Document = require('../models/Document');
const nodemailer = require('nodemailer');
const generateRateConfirmationPDF = require('../utilities/generateRateConfirmation');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AWS = require('aws-sdk');
const getTermsJson = require('../controllers/GetTerms');


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
function getTermsAndConditions() {
    const termsPath = path.join(__dirname, '..', 'data', 'terms.json');

    try {
        const raw = fs.readFileSync(termsPath, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed.terms_and_conditions || [];
    } catch (err) {
        console.error('Failed to load terms.json:', err);
        return [];
    }
}

const { body, validationResult } = require('express-validator');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;


router.get('/id/:id', async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

        console.log(shipment);
        res.json(shipment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve shipment' });
    }
});
router.get('/distance', async (req, res) => {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
        return res.status(400).json({ error: 'origin and destination required' });
    }

    try {
        const { data } = await axios.get(
            'https://maps.googleapis.com/maps/api/distancematrix/json',
            {
                params: {
                    origins: origin,
                    destinations: destination,
                    key: GOOGLE_API_KEY,
                    units: 'imperial'
                }
            }
        );

        if (data.status !== 'OK') {
            return res.status(502).json({ error: `Matrix error: ${data.status}` });
        }

        const elem = data.rows?.[0]?.elements?.[0];
        if (!elem || elem.status !== 'OK') {
            return res.status(502).json({ error: `Route error: ${elem?.status || 'NO_DATA'}` });
        }

        // value is always in meters
        const miles = elem.distance.value * 0.000621371;
        console.log("Distance Calculated:", miles);



        res.json({ distance: miles });



    } catch (err) {
        console.error('Distance API error:', err.message);
        res.status(500).json({ error: 'Could not calculate distance' });
    }
});

router.get('/ratePerMile', async (req, res) => {
    const { rate, distance } = req.query;

    const calculation = rate / distance;
    console.log(`Rate Per Mile: ${calculation}`);

    res.json({ ratePerMile: calculation });
})







const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);








function sumCheckedAccessorials(pricing, selected) {
    let total = 0;

    for (const section of ['shipment', 'pickup', 'delivery']) {
        const selectedSection = selected[section] || {};
        const pricingSection = pricing[section] || {};

        for (const key in selectedSection) {
            if (selectedSection[key]) {
                const price = parseFloat(pricingSection[key]) || 0;
                total += price;
            }
        }
    }

    return total;
}

router.post('/newShipment',
    asyncHandler(async (req, res) => {
        console.log('New Shipment:', JSON.stringify(req.body, null, 2));

        function get(path, fallback = undefined) {
            const parts = path.split('.');
            let obj = req.body;
            for (let p of parts) {
                if (obj == null) break;
                obj = obj[p];
            }
            if (obj !== undefined) return obj;
            const flat = parts
                .map((p, i) => (i === 0 ? p : `[${p}]`))
                .join('');
            return req.body[flat] ?? fallback;
        }

        // Helper: convert 'on' to boolean
        function isChecked(path) {
            const val = get(path);
            return val === 'on' || val === true;
        }

        function sumAccessorials(pricing = {}, selected = {}) {
            let total = 0;
            for (const section in selected) {
                const selectedItems = selected[section] || {};
                const priceItems = pricing[section] || {};

                for (const key in selectedItems) {
                    if (selectedItems[key]) {
                        const val = parseFloat(priceItems[key]);
                        if (!isNaN(val)) total += val;
                    }
                }
            }
            return total;
        }

        // Extract basic shipment info
        const account = get('account');
        const shipmentType = get('shipmentType');
        const equipmentType = get('equipmentType');
        const pickupDateRaw = get('pickupDate');
        const deliveryDateRaw = get('deliveryDate');

        // Extract address information
        const { origin, destination } = req.body;
        const resolvedOrigin = {
            address: origin.address || '',
            city: origin.city || '',
            state: origin.state || '',
            zipcode: origin.zipcode || '',
            accountId: origin.accountId,
            locationId: origin.locationId,
        };

        const resolvedDest = {
            address: destination.address || '',
            city: destination.city || '',
            state: destination.state || '',
            zipcode: destination.zipcode || '',
            accountId: destination.accountId,
            locationId: destination.locationId,
        };

        // Extract shipment details
        const weight = parseFloat(get('weight')) || undefined;
        const dims = {
            length: parseFloat(get('dimensions.length')) || undefined,
            width: parseFloat(get('dimensions.width')) || undefined,
            height: parseFloat(get('dimensions.height')) || undefined
        };

        // Extract rate information
        const ratePerMileAmt = parseFloat(get('ratePerMile')) || undefined;
        const reservePrice = parseFloat(get('reservePrice')) || 0;
        const biddingEnabled = Boolean(get('biddingEnabled'));
        const paymentTerms = get('paymentTerms');
        const distance = parseFloat(get('distance')) || undefined;
        const shipmentValue = req.body.shipmentValue;
        const accessorialPricing = get('accessorialPricing') || {};

        // Extract requirements
        const reqRaw = req.body.requirements || {};
        const baseRate = {
            amount: parseFloat(get('rate.amount')) || 0,
            currency: get('rate.currency') || 'USD',
            rateType: get('rate.rateType') || 'flat'
        };

        // Extract tags
        let tags = get('tags', '');
        if (typeof tags === 'string') {
            tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        // Process contacts
        const shipperContact = {
            name: get('shipperContact.name') || '',
            phone: get('shipperContact.phone') || '',
            email: get('shipperContact.email') || ''
        };

        const consigneeContact = {
            name: get('consigneeContact.name') || '',
            phone: get('consigneeContact.phone') || '',
            email: get('consigneeContact.email') || ''
        };

        const emergencyContact = {
            name: get('emergencyContact.name'),
            phone: get('emergencyContact.phone'),
            email: get('emergencyContact.email')
        };

        const accessorials = {
            shipment: {
                hazmat: isChecked('accessorials.shipment.hazmat'),
                overdimension: isChecked('accessorials.shipment.overdimension'),
                prepaidAndAdd: isChecked('accessorials.shipment.prepaidAndAdd'),
                freezeProtection: isChecked('accessorials.shipment.freezeProtection')
            },
            pickup: {
                inside: isChecked('accessorials.pickup.inside'),
                liftgate: isChecked('accessorials.pickup.liftgate'),
                limitedAccess: isChecked('accessorials.pickup.limitedAccess'),
                notifyConsignee: isChecked('accessorials.pickup.notifyConsignee'),
                militaryAccess: isChecked('accessorials.pickup.militaryAccess'),
                residential: isChecked('accessorials.pickup.residential'),
                airport: isChecked('accessorials.pickup.airport'),
                groceryWarehouse: isChecked('accessorials.pickup.groceryWarehouse')
            },
            delivery: {
                inside: isChecked('accessorials.delivery.inside'),
                liftgate: isChecked('accessorials.delivery.liftgate'),
                limitedAccess: isChecked('accessorials.delivery.limitedAccess'),
                notifyConsignee: isChecked('accessorials.delivery.notifyConsignee'),
                militaryAccess: isChecked('accessorials.delivery.militaryAccess'),
                residential: isChecked('accessorials.delivery.residential'),
                appointment: isChecked('accessorials.delivery.appointment'),
                airport: isChecked('accessorials.delivery.airport'),
                groceryWarehouse: isChecked('accessorials.delivery.groceryWarehouse')
            }
        };

        const baseRateAmount = parseFloat(get('rate.amount')) || 0;
        const totalAccessorials = sumAccessorials(accessorialPricing, accessorials);
        const totalRate = baseRateAmount + totalAccessorials;

        // Extract additional info
        const specialInstructions = get('specialInstructions');
        const notes = get('notes');

        // Validation
        if (!shipmentType) return res.status(400).json({ error: 'shipmentType is required' });
        if (!equipmentType) return res.status(400).json({ error: 'equipmentType is required' });
        if (!pickupDateRaw) return res.status(400).json({ error: 'pickupDate is required' });
        if (!deliveryDateRaw) return res.status(400).json({ error: 'deliveryDate is required' });
        if (!resolvedOrigin.address) return res.status(400).json({ error: 'origin.address is required' });
        if (!resolvedDest.address) return res.status(400).json({ error: 'destination.address is required' });
        if (isNaN(baseRate.amount)) return res.status(400).json({ error: 'rate.amount is required' });

        // Generate shipment number
        const generateShipmentNumber = () => {
            const randomNumber = Math.floor(100000 + Math.random() * 900000);
            return `F-${randomNumber}`;
        };

        // Prepare shipment data
        const shipmentData = {
            shipmentNumber: generateShipmentNumber(),
            shipmentType,
            account,
            status: 'Available',
            pickupDate: new Date(pickupDateRaw),
            deliveryDate: new Date(deliveryDateRaw),

            origin: resolvedOrigin,
            destination: resolvedDest,

            equipmentType,
            weight,
            dimensions: dims,
            baseRate: {
                amount: baseRateAmount,
                currency: get('rate.currency', 'USD'),
                rateType: get('rate.rateType', 'flat')
            },
            totalRate,
            accessorials,
            accessorialPricing,
            ratePerMile: ratePerMileAmt || 0,
            reservePrice,
            biddingEnabled,
            paymentTerms,
            distance,
            tags,
            shipperContact,
            consigneeContact,
            emergencyContact,
            shipmentValue,
            specialInstructions,
            notes,

            shipper: req.user?._id,
            postedBy: req.user?._id
        };

        console.log('📦 Final shipment data:', JSON.stringify(shipmentData, null, 2));

        try {
            const shipment = new Shipment(shipmentData);
            await shipment.save();

            console.log('✅ Shipment created:', shipment.shipmentNumber);
            res.status(201).json(shipment);

        } catch (saveError) {
            console.error('❌ Error saving shipment:', saveError);

            if (saveError.name === 'ValidationError') {
                const validationErrors = Object.keys(saveError.errors).map(key => ({
                    field: key,
                    message: saveError.errors[key].message
                }));
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validationErrors
                });
            }

            if (saveError.code === 11000) {
                return res.status(400).json({
                    error: 'Duplicate entry',
                    details: saveError.keyValue
                });
            }

            return res.status(500).json({
                error: 'Failed to save shipment',
                message: saveError.message
            });
        }
    })
);














function sumAccessorialPricing(accessorialPricing = {}) {
    let total = 0;

    for (const category of ['shipment', 'pickup', 'delivery', 'other']) {
        const section = accessorialPricing[category];
        if (section && typeof section === 'object') {
            for (const key in section) {
                const val = section[key];
                if (typeof val === 'number') {
                    total += val;
                }
            }
        }
    }

    return total;
}

router.get('/number/:shipmentNumber', async (req, res) => {
    try {
        const shipmentNumber = req.params.shipmentNumber;
        const shipment = await Shipment.findOne({ shipmentNumber })
            .populate('shipper broker carrier assignedCarrier bookedBy postedBy')
            .populate({
                path: 'documents',
                model: 'Document'
            });


        const user = await User.findById(shipment.carrier).populate('documents');

        let rateConfirmationDocs = [];

        if (shipment.carrier) {
            const user = await User.findById(shipment.carrier).populate('documents');
            if (user && user.documents) {
                rateConfirmationDocs = user.documents.filter(doc =>
                    doc.description && doc.description.includes(shipment.shipmentNumber)
                );
            }
        }


        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        const accessorialPricing = shipment.accessorialPricing || {};
        const accessorialPricingTotal = sumAccessorialPricing(accessorialPricing);

        const baseRate = shipment.baseRate.amount;
        const totalRate = accessorialPricingTotal + baseRate;

        console.log("Accessorial Pricing Total:", accessorialPricingTotal);
        console.log("Base Rate:", baseRate);
        console.log("Total Rate:", totalRate);

        const shipmentWithDocs = {
            ...shipment.toObject(),
            documents: rateConfirmationDocs
        };
        console.log('Final shipment response:', {
            documents: rateConfirmationDocs.map(d => ({ id: d._id, description: d.description, url: d.downloadUrl }))
        });

        res.json({
            ...shipment.toObject(),
            accessorialPricingTotal,
            totalRate,
            documents: rateConfirmationDocs // ← directly included
        });



    } catch (err) {
        console.error('Error fetching shipment:', err);
        res.status(500).json({ error: 'Failed to fetch shipment' });
    }
});


router.post('/:shipmentNumber/cancel', async (req, res) => {
    const { shipmentNumber } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    try {
        const shipment = await Shipment.findOne({ shipmentNumber });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        if (shipment.status === 'Cancelled') {
            return res.status(400).json({ error: 'Shipment is already cancelled' });
        }

        shipment.status = 'Cancelled';
        shipment.cancelledBy = userId;
        shipment.cancelledAt = new Date();
        shipment.carrier = null;
        shipment.assignedCarrier = null;

        await shipment.save();

        return res.status(200).json({ message: 'Shipment cancelled successfully', shipment });
    } catch (err) {
        console.error('Cancellation error:', err);
        return res.status(500).json({ error: 'Server error while cancelling shipment' });
    }
});

router.post('/:shipmentNumber/book', async (req, res) => {
    const { shipmentNumber } = req.params;
    const userId = req.user?._id;
    const userName = req.user?.lastName;



    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        let shipment = await Shipment.findOne({ shipmentNumber })
            .populate('shipper broker carrier assignedCarrier bookedBy postedBy');

        if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
        if (shipment.status === 'Booked' || shipment.assignedCarrier)
            return res.status(400).json({ error: 'Shipment is already booked' });

        shipment.status = 'Booked';
        shipment.bookedAt = new Date();
        shipment.bookedBy = userId;
        shipment.carrier = userId;
        shipment.assignedCarrier = userId;

        if (shipment.distance && shipment.rate?.amount) {
            shipment.ratePerMile = Number((shipment.baseRate.amount / shipment.distance).toFixed(2));
        }

        await shipment.save();

        const populatedShipment = await Shipment.findOne({ shipmentNumber })
            .populate('shipper broker carrier assignedCarrier bookedBy postedBy');

        const extractAccessorialPricing = (pricing = {}) => {
            const pricingList = [];
            let total = 0;
            const formatLabel = key => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

            for (const category of ['shipment', 'pickup', 'delivery']) {
                const group = pricing[category] || {};
                for (const key in group) {
                    const amount = group[key];
                    if (typeof amount === 'number' && amount > 0) {
                        total += amount;
                        pricingList.push({ label: `${formatLabel(key)} (${category})`, price: `$${amount.toFixed(2)}` });
                    }
                }
            }

            if (pricing.other) {
                for (const key in pricing.other) {
                    const amount = pricing.other[key];
                    if (typeof amount === 'number' && amount > 0) {
                        total += amount;
                        pricingList.push({ label: formatLabel(key), price: `$${amount.toFixed(2)}` });
                    }
                }
            }

            return { pricingList, total };
        };

        const { pricingList: accessorialPricingList, total: accessorialTotal } =
            extractAccessorialPricing(populatedShipment.accessorialPricing);

        const totalRate = shipment.baseRate.amount + accessorialTotal;

        const outputDir = path.join(__dirname, '..', 'rate-confirmations');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const fileName = `${shipment.shipmentNumber}_RateConfirmation.pdf`;
        const outputPath = path.join(outputDir, fileName);
        const logoPath = path.join(__dirname, '..', 'public', 'images', 'llogo.png');
        const templatePath = path.join(__dirname, '..', 'views', 'rate-confirmation.hbs');




        const terms = getTermsJson();

        await generateRateConfirmationPDF(templatePath, {
            ...populatedShipment.toObject(),
            accessorialPricingList,
            accessorialTotal,
            logoPath,
            totalRate,
            terms: terms.terms_and_conditions,
            termsVersion: terms.version,
            termsUpdated: terms.lastUpdated
        }, outputPath);


        if (!fs.existsSync(outputPath)) {
            throw new Error('PDF generation failed: file not found');
        }

        const fileStream = fs.createReadStream(outputPath);
        const s3Key = `rate-confirmations/${fileName}`;

        await s3.upload({
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            Body: fileStream,
            ContentType: 'application/pdf',
            ACL: 'private'
        }).promise();

        const doc = await Document.create({
            downloadUrl: s3Key,
            description: `Rate Confirmation For ${shipmentNumber}`,
            uploadDate: new Date()
        });



        shipment.rateConfirmationUrl = s3Key;
        await shipment.save();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.documents.push(doc._id);
        await user.save();

        fs.unlinkSync(outputPath);

        return res.status(200).json({
            message: 'Shipment booked and rate confirmation uploaded to S3.',
            shipment: populatedShipment,
            accessorialPricingList,
            s3Key,
            terms
        });

    } catch (error) {
        console.error('Error booking shipment:', error);
        return res.status(500).json({ error: 'Server error while booking shipment' });
    }
});














router.get('/test/rate-confirmation', async (req, res) => {
    const rateAmount = 2491.84;
    const distance = 252;

    const testShipment = {
        shipmentNumber: 'F-48589',
        pickupDate: new Date(),
        deliveryDate: new Date(Date.now() + 5 * 86400000),
        origin: { city: 'Bentonville', state: 'AR' },
        destination: { city: 'Paris', state: 'TX' },
        rate: {
            amount: rateAmount,
            ratePerMile: parseFloat((rateAmount / distance).toFixed(2)),
        },
        equipmentType: 'Dry Van',
        weight: 7000,
        distance: distance,
        carrier: {
            carrierName: 'Demo Carrier LLC',
            address: '2 International Place',
            city: 'Boston',
            state: 'MA',
            zip: '02110',
            phone: '(617) 672-6000',
            email: 'john.smith@democarrier.com',
            dotNumber: '352585'
        },
        shipper: {
            shipperName: 'Logistus Corporation',
            address: '21 Hartford Avenue',
            city: 'Newington',
            state: 'CT',
            zip: '06074',
            phone: '(860) 810-4913',
            contact: {
                contactName: 'Chris Colabrese',
                contactPhone: '(860) 810-4913',
                contactEmail: 'Chris Colabrese@logistus.co',
            }
        },
        bookedAt: new Date(),
        terms: {
            agreement: `This Rate Confirmation ("Agreement") is made and entered into by and between the Broker and Carrier as identified in this document. By accepting this Rate Confirmation, Carrier agrees to the terms and conditions herein, as well as those set forth in any Master Transportation Agreement between the parties. If no such agreement exists, this Rate Confirmation shall govern the relationship for the specific shipment referenced.`,

            paymentTerms: `Payment will be made within 30 days of receipt of a clean, signed Proof of Delivery (POD), invoice, and all required documentation. Any deductions for missing paperwork or accessorial charges will be clearly documented. Carrier waives any right to payment if documentation is not submitted within 90 days of delivery.`,

            carrierResponsibilities: `Carrier shall provide safe, lawful, and timely transport of goods. Carrier represents that it is duly authorized and licensed to operate as a motor carrier by the U.S. Department of Transportation (USDOT) and that it will comply with all applicable laws and regulations. Carrier shall not co-broker, re-broker, assign, or otherwise transfer this shipment to another carrier without prior written consent from Broker.`,

            cargoLiability: `Carrier assumes full liability for loss, damage, or delay of cargo in accordance with 49 U.S.C. §14706 (Carmack Amendment). The Carrier shall carry cargo insurance in an amount not less than $100,000 per shipment. Carrier shall notify Broker of any exceptions or cargo issues at time of delivery or risk denial of claims.`,

            accessorials: `All accessorial charges (e.g., detention, layover, lumper fees, driver assist) must be approved in writing by Broker prior to being incurred. Carrier must provide supporting receipts and documentation within 48 hours of delivery to be eligible for reimbursement.`,

            insurance: `Carrier shall maintain all necessary and legally required insurance including, but not limited to, auto liability ($1,000,000 minimum), cargo liability ($100,000 minimum), and worker’s compensation coverage as required by law. Proof of insurance must be provided upon request.`,

            doubleBrokering: `Double brokering is strictly prohibited. Any unauthorized brokering, subcontracting, or assignment will result in non-payment for services and may be grounds for legal action and revocation of Carrier’s authority with the Broker.`,

            documentation: `Carrier must submit the following documents to receive payment: signed Bill of Lading (BOL), signed Proof of Delivery (POD), this Rate Confirmation, and invoice. Documents must be clear, legible, and submitted electronically to the Broker’s billing department.`,

            governingLaw: `This Agreement shall be governed by and construed in accordance with the laws of the State of [YourStateHere], without regard to its conflict of laws principles. Any disputes shall be resolved in the courts located within [County], [YourStateHere].`,

            entireAgreement: `This Rate Confirmation, along with any referenced agreements, constitutes the entire understanding between the parties with respect to the subject matter hereof. No modifications shall be valid unless made in writing and signed by both parties.`
        },



        status: 'Booked'
    };

    res.render('rate-confirmation', { shipment: testShipment });
});








const flatAllowedFields = [
    'pickupDate',
    'deliveryDate',
    'shipmentType',
    'equipmentType',
    'weight',
    'specialInstructions',
    'notes',
    'status',
    'origin.address',
    'destination.address'
];

const updateShipmentById = async (shipmentId, updates) => {
    const updateDoc = {};

    for (const field of flatAllowedFields) {
        const keys = field.split('.');
        const value = keys.length === 1 ? updates[keys[0]] : updates[keys[0]]?.[keys[1]];

        if (value !== undefined) {
            // Build nested structure for $set
            if (keys.length === 1) {
                updateDoc[keys[0]] = value;
            } else {
                updateDoc[`${keys[0]}.${keys[1]}`] = value;
            }
        }
    }

    if (Object.keys(updateDoc).length === 0) {
        throw new Error('No valid fields provided');
    }

    const updated = await Shipment.findByIdAndUpdate(
        shipmentId,
        { $set: updateDoc },
        { new: true, runValidators: true }
    );

    if (!updated) throw new Error('Shipment not found');
    return updated;
};

router.patch('/shipments/updateShipment/:id', async (req, res) => {
    const shipmentId = req.params.id;

    if (!shipmentId) {
        return res.status(400).json({ error: 'Shipment ID is required' });
    }

    try {
        const updatedShipment = await updateShipmentById(shipmentId, req.body);
        return res.status(200).json(updatedShipment);
    } catch (err) {
        console.error('PATCH error:', err.message);
        const code = err.message === 'Shipment not found' ? 404 : 400;
        return res.status(code).json({ error: err.message });
    }
});

module.exports = router;
