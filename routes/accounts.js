const express = require('express');
const router = express.Router();
const Account = require('../models/Account');


router.get('/', async (req, res) => {
    const userId = req.user._id
    const accounts = await Account.find({createdBy: userId});

    console.log('Accounts information requested by', userId)

    res.json(accounts);
});

// Get locations for a specific account
// /api/accounts/:id/locations (with createdBy filter)
router.get('/:id/locations', async (req, res) => {
    try {
        const userId = req.user?._id; // assumes Passport auth middleware
        if (!userId) return res.status(401).json({ error: 'Not authorized' });

        const account = await Account.findOne({ _id: req.params.id, createdBy: userId }, 'locations');
        if (!account) return res.status(404).json({ error: 'Account not found or not owned by you' });

        res.json(account.locations);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/:accountId/locations/:locationId', async (req, res) => {
    const account = await Account.findById(req.params.accountId, 'locations');
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const location = account.locations.id(req.params.locationId);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
});

router.get('/:accountId/locations/:locationId/locationContact', async (req, res) => {
    try {
        const { accountId, locationId } = req.params;

        const account = await Account.findById(accountId, 'locations');
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const location = account.locations.id(locationId);
        if (!location) return res.status(404).json({ error: 'Location not found' });

        const locationContact = location.locationContact;

        console.log(locationContact)
        res.json(locationContact);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:accountId/accessorials', async (req, res) => {
    const { accountId } = req.params;

    if (!accountId) return res.status(400).json({ error: 'Account ID is required' });

    try {
        const account = await Account.findById(accountId);
        if (!account) return res.status(404).json({ error: 'Account not found' });

        // Disable caching for this response
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
        console.log(account.accessorialPricing || {})
        res.json(account.accessorialPricing || {});
    } catch (err) {
        console.error('Error fetching accessorial pricing:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/newAccount', async (req, res) => {
    try {
        const {
            accountName,
            companyWebsite,
            taxId,
            paymentTerms,
            creditLimit,
            currency,
            notes,
            tags,
            operationsContact,
            billingContact,
            locations,
            accessorialPricing
        } = req.body;

        if (!accountName) {
            return res.status(400).json({ error: 'accountName is required' });
        }
        if (!operationsContact?.address) {
            return res.status(400).json({ error: 'operationsContact.address is required' });
        }
        if (!billingContact?.address) {
            return res.status(400).json({ error: 'billingContact.address is required' });
        }

        const accountData = {
            accountName,
            companyWebsite,
            taxId,
            paymentTerms,
            creditLimit,
            currency,
            notes,
            tags: Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()),

            operationsContact: {
                firstName: operationsContact.firstName,
                lastName:  operationsContact.lastName,
                phone:     operationsContact.phone,
                email:     operationsContact.email,
                address:   operationsContact.address,
                city:      operationsContact.city,
                state:     operationsContact.state,
                zip:       operationsContact.zip,
                country:   operationsContact.country || 'USA'
            },

            billingContact: {
                firstName: billingContact.firstName,
                lastName:  billingContact.lastName,
                phone:     billingContact.phone,
                email:     billingContact.email,
                address:   billingContact.address,
                city:      billingContact.city,
                state:     billingContact.state,
                zip:       billingContact.zip,
                country:   billingContact.country || 'USA'
            },

            locations: Array.isArray(locations)
                ? locations.map(loc => ({
                    name:     loc.name,
                    address:  loc.address,
                    city:     loc.city,
                    state:    loc.state,
                    zip:      loc.zip,
                    country:  loc.country || 'USA',
                    locationContact: loc.locationContact || {}
                }))
                : [],

            accessorialPricing: {
                shipment: accessorialPricing?.shipment || {},
                pickup: accessorialPricing?.pickup || {},
                delivery: accessorialPricing?.delivery || {},
                other: accessorialPricing?.other || {}
            }
        };

        if (req.user) {
            accountData.createdBy = req.user._id;
            accountData.updatedBy = req.user._id;
        }

        const account = new Account(accountData);
        await account.save();

        res.status(201).json(account);
    } catch (err) {
        console.error('Failed to create new account:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;