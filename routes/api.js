const express = require('express');
const router = express.Router();
const axios = require('axios')
require("dotenv").config();
const { Client } = require('@googlemaps/google-maps-services-js');
const mongoose = require('mongoose')
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const Shipment = require('../models/Shipment');
const Account = require('../models/Account');
const Document = require('../models/Document');
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
// const generateRateConfirmationPDF = require('../utilities/generateRateConfirmation');
const path = require('path');
const fs = require('fs');


const { body, validationResult } = require('express-validator');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;


router.get('/shipments/id/:id', async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

        console.log(shipment);
        res.json(shipment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve shipment' });
    }
});
router.get('/shipments/distance', async (req, res) => {
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

router.get('/shipments/ratePerMile', async (req, res) => {
    const { rate, distance } = req.query;

    const calculation = rate / distance;
    console.log(`Rate Per Mile: ${calculation}`);

    res.json({ ratePerMile: calculation });
})

router.get('/autocomplete-dot-number', async (req, res) => {
    const WEB_KEY = '8d6c374517079ee43050b50fa8b43b6a57c090d3';
    const {query} = req.query;

    if (!query) {
        return res.json([]);
    }

    try {
        // Corrected URL format
        const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${query}?webKey=${WEB_KEY}`;
        const response = await axios.get(url);

        console.log('Full API Response:', response.data); // 🕵️ Log full response

        // Accessing nested data properly
        if (response.data && response.data.content && response.data.content.carrier) {
            const carrier = response.data.content.carrier;

            const result = {
                dotNumber: carrier.dotNumber || 'N/A',
                legalName: carrier.legalName || 'N/A',
                dbaName: carrier.dbaName || 'N/A',
                address: `${carrier.phyStreet || ''}, ${carrier.phyCity || ''}, ${carrier.phyState || ''} ${carrier.phyZipcode || ''}`.trim(),
                safetyRating: carrier.safetyRating || 'N/A',
                statusCode: carrier.statusCode || 'N/A',
                crashTotal: carrier.crashTotal || 'N/A',
                fatalCrash: carrier.fatalCrash || 'N/A',
                injCrash: carrier.injCrash || 'N/A'
            };

            return res.json([result]); // Return as an array to match frontend expectations
        } else {
            console.warn('No valid data found in the response.');
            return res.json([]);
        }
    } catch (error) {
        console.error('Error fetching data from FMCSA API:', error.message);
        return res.status(500).json({error: 'Failed to fetch data'});
    }
});










router.get('/address/autocomplete', async (req, res) => {
    const input = req.query.input;

    if (!input) {
        return res.status(400).json({ error: 'Missing input parameter' });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
            params: {
                input,
                key: GOOGLE_API_KEY,
                types: 'address',
                components: 'country:us'
            }
        });

        const predictions = response.data.predictions.map(prediction => ({
            description: prediction.description,
            placeId: prediction.place_id
        }));

        res.json(predictions);
    } catch (err) {
        console.error('Autocomplete error:', err.message);
        res.status(500).json({ error: 'Failed to fetch autocomplete data' });
    }
});

// PLACE DETAILS endpoint
router.get('/address/details', async (req, res) => {
    const placeId = req.query.placeId;

    // Validate presence of placeId
    if (!placeId || placeId === 'undefined') {
        return res.status(400).json({ error: "Missing or invalid placeId in request" });
    }

    try {
        const googleRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                place_id: placeId,
                key: GOOGLE_API_KEY,
                fields: 'address_component,formatted_address'
            }
        });

        const result = googleRes.data?.result;

        // Defensive checks
        if (!result || !result.address_components) {
            console.warn(`⚠️ Google returned no address components for placeId: ${placeId}`);
            return res.status(404).json({ error: "No address data found for placeId" });
        }

        const components = result.address_components;

        const getComponent = (type, nameType = 'short_name') =>
            components.find(c => c.types.includes(type))?.[nameType] || '';

        const streetNumber = getComponent('street_number');
        const route = getComponent('route');
        const street = `${streetNumber} ${route}`.trim();

        const city = getComponent('locality') ||
            getComponent('sublocality') ||
            getComponent('postal_town');

        const state = getComponent('administrative_area_level_1');
        const zip = getComponent('postal_code');

        res.json({
            street,
            city,
            state,
            zip,
            fullAddress: result.formatted_address || ''
        });
    } catch (err) {
        console.error('❌ Google Place Details Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to fetch address details from Google Places API' });
    }
});




router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const s3 = new AWS.S3();

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const data = await s3.upload(params).promise();
        res.json({ url: data.Location });
    } catch (err) {
        console.error('Upload failed:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});



// GET /api/documents/download/:id
// /routes/documents.js
router.get('/documents/view/:id', async (req, res) => {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).send('Document not found');

    const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET,
        Key: doc.downloadUrl,
        Expires: 5 * 60, // 5 min
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: 'inline' // <--- KEY PART
    });

    res.redirect(signedUrl);
});


router.get('/download/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc || !doc.downloadUrl) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.S3_BUCKET,
            Key: doc.downloadUrl,
            Expires: 600,
            ResponseContentDisposition: 'inline', // or 'attachment' if download
            ResponseContentType: 'application/pdf'
        });

        // DO NOT redirect or embed this
        return res.json({ signedUrl });
    } catch (err) {
        console.error('Error generating signed URL:', err);
        res.status(500).json({ error: 'Failed to get document' });
    }
});


module.exports = router;
