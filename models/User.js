const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { Schema } = mongoose;
const Document = require('../models/Document');

const UserSchema = new Schema({
    googleId: String,
    microsoftId: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: String,
    firstName: String,
    lastName: String,
    profileImageUrl: String,                  // Google profile picture URL
    profilePicture: String,          // Microsoft profile picture URL
    address: String,
    phoneNumber: String,
    userType: {
        type: String,
        enum: ['Shipper', 'Carrier', 'Employee', 'Carrier/Shipper']
    },
    industry: {
        type: String,
        enum: ['Freight', 'Autos', 'Freight/Autos']
    },
    notifications: [
        {
            type: { type: String },
            message: String,
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
            bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    companyName: String,
    companyWebsite: String,
    isProfileComplete: { type: Boolean, default: false },
    dotNumber: String,
    insuranceCoverage: {
        publicLiability: { type: Number }, // FMCSA min required varies by cargo
        cargo: { type: Number },           // Cargo insurance (e.g., $100K typical)
        hazmat: { type: Boolean, default: false } // True if carrier hauls hazardous materials
    },
    bids: [{
        type: Schema.Types.ObjectId,
        ref: 'Bid'
    }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
});

// Create indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ microsoftId: 1 });
UserSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', UserSchema);


// Apply plugins to the schema
UserSchema.plugin(findOrCreate);
UserSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model('User', UserSchema);
