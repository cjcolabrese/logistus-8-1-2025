const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true }, // Which client/account owns this SKU

    sku:       { type: String, required: true, trim: true, unique: false },  // SKU number or code
    name:      { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Physical characteristics
    weightLbs:   { type: Number, required: true },            // Default single-unit weight (lbs)
    lengthIn:    { type: Number, required: true },            // Default dimensions (inches)
    widthIn:     { type: Number, required: true },
    heightIn:    { type: Number, required: true },

    // Package types (case, pallet, each, etc)
    packageType: { type: String, enum: ['Each', 'Case', 'Pallet', 'Carton', 'Bag', 'Drum', 'Other'], default: 'Case' },
    unitsPerPackage: { type: Number }, // e.g. 24 cans per case

    // Freight/LTL specific
    freightClass: { type: String, trim: true },      // e.g. '70', '92.5'
    nmfcCode:     { type: String, trim: true },      // NMFC code for LTL

    // Offered shipping rate (optional: for quoting or contracts)
    shippingRateUSD: { type: Number },               // Offered price per shipment or per unit
    currency:        { type: String, default: 'USD' },

    // Extra fields
    notes:     { type: String, trim: true },
    tags:      [{ type: String, trim: true }],

    active:    { type: Boolean, default: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
