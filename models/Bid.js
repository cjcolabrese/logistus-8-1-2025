const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * BidSchema: represents a carrier's bid on a Shipment
 */
const BidSchema = new Schema({
    shipment: {
        type: Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true,
        index: true,
        description: 'Reference to the Shipment being bid on'
    },
    carrier: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
        description: 'Carrier (User) who submitted the bid'
    },
    shipper: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bidAmount: {
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'USD' }
    },
    rateType: {
        type: String,
        enum: ['flat', 'per_mile', 'per_pound'],
        default: 'flat',
        description: 'How the bid amount is calculated'
    },
    transitTime: {
        // Optional estimated transit time
        days: { type: Number, min: 0 },
        hours: { type: Number, min: 0 }
    },
    pickupAvailability: {
        earliest: Date,
        latest: Date
    },
    deliveryAvailability: {
        earliest: Date,
        latest: Date
    },
    notes: { type: String, maxlength: 1000 },
    attachments: [
        {
            filename: String,
            url: String,
            uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            uploadedAt: { type: Date, default: Date.now }
        }
    ],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
        index: true,
        description: 'Current status of the bid'
    },
    decisionAt: Date,               // timestamp when approved/rejected
    decidedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Virtual for easy access to bid total
BidSchema.virtual('bidTotal').get(function() {
    return `${this.bidAmount.currency} ${this.bidAmount.amount.toFixed(2)}`;
});

module.exports = mongoose.model('Bid', BidSchema);
