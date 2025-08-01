const mongoose = require('mongoose');
const { Schema } = mongoose;
const Account= require('../models/Account');
const User= require('../models/User');
const Document = require('../models/Document');
// Helper to generate unique shipment numbers
const generateShipmentNumber = async () => {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `F-${randomNumber}`;
};

const ShipmentSchema = new Schema({
    shipmentNumber: { type: String, unique: true, index: true },
    shipmentType:   { type: String, enum: ['Full Truckload','Less Than Truckload'], required: true },
    status:         { type: String, enum: ['Available','Booked','In Transit','Delivered','Invoiced','Paid','Cancelled'], default: 'Available' },

    // Dates & Times
    pickupDate:        { type: Date, required: true },
    pickupWindowStart: { type: Date },
    pickupWindowEnd:   { type: Date },
    deliveryDate:      { type: Date, required: true },
    deliveryWindowStart:{ type: Date },
    deliveryWindowEnd: { type: Date },

    // Addresses
    origin: {
        address:    { type: String, required: true },
        city:       { type: String },
        state:      { type: String },
        zipcode:    { type: String },
        country:    { type: String },
        coordinates:{ lat: Number, lng: Number },

    },
    destination: {
        address:    { type: String, required: true },
        city:       { type: String },
        state:      { type: String },
        zipcode:    { type: String },
        country:    { type: String },
        coordinates:{ lat: Number, lng: Number },

    },
    distance:   {type: Number, required: true },
    // Equipment & Goods
    equipmentType:      { type: String },
    commodity:          { type: String },
    quantity:           { type: Number },
    weight:             { type: Number },
    dimensions: {
        length: Number,
        width:  Number,
        height: Number
    },
    pallets:            { type: Number },
    hazmatClass:        { type: String },
    temperatureControl: { type: Boolean },

    // Financials
    baseRate: {
        amount:   { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        rateType: { type: String, default: 'flat' }
    },
    totalRate: { type: Number, required: true },
    ratePerMile: { type: Number, default: 0 },
    reservePrice:    { type: Number, default: 0 },
    biddingEnabled:  { type: Boolean, default: false },
    biddingEndDate:  { type: Date },
    insuranceAmount: { type: Number },
    shipmentValue: { type: Number },
    paymentTerms:    { type: String },

    // Requirements & Tags
    accessorials: {
        shipment: {
            hazmat:           { type: Boolean, default: false },
            overdimension:    { type: Boolean, default: false },
            prepaidAndAdd:    { type: Boolean, default: false },
            freezeProtection: { type: Boolean, default: false }
        },
        pickup: {
            inside:             { type: Boolean, default: false },
            liftgate:           { type: Boolean, default: false },
            limitedAccess:      { type: Boolean, default: false },
            notifyConsignee:    { type: Boolean, default: false },
            militaryAccess:     { type: Boolean, default: false },
            residential:        { type: Boolean, default: false },
            airport:            { type: Boolean, default: false },
            groceryWarehouse:   { type: Boolean, default: false }
        },
        delivery: {
            inside:             { type: Boolean, default: false },
            liftgate:           { type: Boolean, default: false },
            limitedAccess:      { type: Boolean, default: false },
            notifyConsignee:    { type: Boolean, default: false },
            militaryAccess:     { type: Boolean, default: false },
            residential:        { type: Boolean, default: false },
            appointment:        { type: Boolean, default: false },
            airport:            { type: Boolean, default: false },
            groceryWarehouse:   { type: Boolean, default: false }
        },
        other: [String]
    },
    accessorialPricing: {
        shipment: {
            hazmat: {type: Number, default: 0},
            overdimension: {type: Number, default: 0},
            prepaidAndAdd: {type: Number, default: 0}, // Often 0, as it's a billing term
            freezeProtection: {type: Number, default: 0}
        },
        pickup: {
            inside: {type: Number, default: 0},
            liftgate: {type: Number, default: 0},
            limitedAccess: {type: Number, default: 0},
            notifyConsignee: {type: Number, default: 0},
            militaryAccess: {type: Number, default: 0},
            residential: {type: Number, default: 0},
            airport: {type: Number, default: 0},
            groceryWarehouse: {type: Number, default: 0}
        },
        delivery: {
            inside: {type: Number, default: 0},
            liftgate: {type: Number, default: 0},
            limitedAccess: {type: Number, default: 0},
            notifyConsignee: {type: Number, default: 0},
            militaryAccess: {type: Number, default: 0},
            residential: {type: Number, default: 0},
            appointment: {type: Number, default: 0},
            airport: {type: Number, default: 0},
            groceryWarehouse: {type: Number, default: 0}
        },
        other: { // Using an object for common 'other' fees for structured data
            detentionPerHr: {type: Number, default: 0}, // Per hour rate
            redelivery: {type: Number, default: 0},
            reconsignment: {type: Number, default: 0}
            // You can add more specific 'other' accessorials here if they become common enough
        },
    },
    tags: [String],

    // Contacts
    shipperContact: {
        name:  String,
        phone: String,
        email: String
    },
    consigneeContact: {
        name:  String,
        phone: String,
        email: String
    },
    emergencyContact: {
        name:  String,
        phone: String,
        email: String
    },

    // Misc
    specialInstructions: { type: String },
    notes:               { type: String },

    // Audit & Participants
    shipper:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    broker:         { type: Schema.Types.ObjectId, ref: 'User' },
    carrier:        { type: Schema.Types.ObjectId, ref: 'User' },
    postedBy:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
    assignedCarrier:{ type: Schema.Types.ObjectId, ref: 'User' },
    bids:           [{ type: Schema.Types.ObjectId, ref: 'Bid' }],
    bookedAt: {type: Date},
    cancelledBy: {type: mongoose.Schema.ObjectId, ref: 'User' },
    cancelledAt: { type: Date},
    cancellationReason: {type: String},
    rateConfirmationUrl: { type: String },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
}, {
    timestamps: true
});

// Pre-save: generate unique shipmentNumber
ShipmentSchema.pre('save', async function(next) {
    if (!this.shipmentNumber) {
        let unique = false;
        while (!unique) {
            const candidate = await generateShipmentNumber();
            const existing  = await this.constructor.findOne({ shipmentNumber: candidate });
            if (!existing) {
                this.shipmentNumber = candidate;
                unique = true;
            }
        }
    }
    next();
});

// <-- The fix: only create the model if it doesn't already exist -->
module.exports = mongoose.models.Shipment ||
    mongoose.model('Shipment', ShipmentSchema);
