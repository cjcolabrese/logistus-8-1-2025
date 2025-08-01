// noinspection JSFileReferences

const mongoose = require('mongoose');
const Shipment = require('../models/SHipment');
const User = require('../models/User');
const Bid = require('../models/Bid');
const { Schema } = mongoose;


const accountSchema = new mongoose.Schema({
    accountName: { type: String, required: true, trim: true },

    operationsContact: {
        firstName: { type: String, trim: true },
        lastName:  { type: String, trim: true },
        phone:     { type: String, trim: true },
        email:     { type: String, trim: true, lowercase: true },
        address:   { type: String, required: true, trim: true },
        city:      { type: String, trim: true },
        state:     { type: String, trim: true },
        zip:       { type: String, trim: true },
        country:   { type: String, default: 'USA', trim: true },
    },

    billingContact: {
        firstName: { type: String, trim: true },
        lastName:  { type: String, trim: true },
        phone:     { type: String, trim: true },
        email:     { type: String, trim: true, lowercase: true },
        address:   { type: String, required: true, trim: true },
        city:      { type: String, trim: true },
        state:     { type: String, trim: true },
        zip:       { type: String, trim: true },
        country:   { type: String, default: 'USA', trim: true },
    },

    companyWebsite: { type: String, trim: true },

    locations: [{
        _id: mongoose.Schema.Types.ObjectId,
        name:     { type: String, trim: true },
        address:  { type: String, trim: true },
        city:     { type: String, trim: true },
        state:    { type: String, trim: true },
        zip:      { type: String, trim: true },
        country:  { type: String, trim: true, default: 'USA' },
        locationContact: {
            name:     { type: String},
            email:     { type: String, trim: true},
            phoneNumber: { type: String, trim: true },
        }
    }],

    bidHistory:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }],
    loadHistory:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Load' }],
    paymentHistory: [{
        amount: Number,
        currency: String,
        date: Date,
        method: String,   // e.g. 'ACH', 'Credit Card'
        status: { type: String, enum: ['Pending','Completed','Failed'] }
    }],

    taxId:        { type: String, trim: true },
    paymentTerms: { type: String, enum: ['Prepaid','Net 15','Net 30','Net 45','Net 60'], default: 'Net 30' },
    creditLimit:  { type: Number, default: 0 },
    currency:     { type: String, default: 'USD' },
    notes:        { type: String, trim: true },
    tags:         [{ type: String, trim: true }],

    // NEW FIELD ADDED: Accessorial Pricing
    accessorialPricing: {
        shipment: {
            hazmat:           { type: Number, default: 0 },
            overdimension:    { type: Number, default: 0 },
            prepaidAndAdd:    { type: Number, default: 0 }, // Often 0, as it's a billing term
            freezeProtection: { type: Number, default: 0 }
        },
        pickup: {
            inside:             { type: Number, default: 0 },
            liftgate:           { type: Number, default: 0 },
            limitedAccess:      { type: Number, default: 0 },
            notifyConsignee:    { type: Number, default: 0 },
            militaryAccess:     { type: Number, default: 0 },
            residential:        { type: Number, default: 0 },
            airport:            { type: Number, default: 0 },
            groceryWarehouse:   { type: Number, default: 0 }
        },
        delivery: {
            inside:             { type: Number, default: 0 },
            liftgate:           { type: Number, default: 0 },
            limitedAccess:      { type: Number, default: 0 },
            notifyConsignee:    { type: Number, default: 0 },
            militaryAccess:     { type: Number, default: 0 },
            residential:        { type: Number, default: 0 },
            appointment:        { type: Number, default: 0 },
            airport:            { type: Number, default: 0 },
            groceryWarehouse:   { type: Number, default: 0 }
        },
        other: { // Using an object for common 'other' fees for structured data
            detentionPerHr: { type: Number, default: 0 }, // Per hour rate
            redelivery:     { type: Number, default: 0 },
            reconsignment:  { type: Number, default: 0 }
            // You can add more specific 'other' accessorials here if they become common enough
        }
    },

    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });


module.exports = mongoose.model('Account', accountSchema);