const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    type: {
        type: String,
        enum: ['BidSubmitted', 'BidApproved', 'BidRejected', 'ShipmentUpdated', 'General'],
        default: 'General',
        index: true
    },
    entity: {
        kind: { type: String, enum: ['Bid','Shipment','Invoice','Other'], required: true },
        item: { type: Schema.Types.ObjectId, required: true, refPath: 'entity.kind' }
    },
    readAt: Date,
    expiresAt: Date,
    carrierId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shipperId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    bidId: {  // Add this field to reference a bid
        type: Schema.Types.ObjectId,
        ref: 'Bid'
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

