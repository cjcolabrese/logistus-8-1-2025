// updateShipper.js

const mongoose = require('mongoose');
const Shipment = require('./models/Shipment'); // Adjust path if different

// Replace with your actual MongoDB URI
const MONGODB_URI = 'mongodb://localhost:27017/logistusio'; // or use your connection string

const updateShipperForAllShipments = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const ObjectId = mongoose.Types.ObjectId;
        const newShipperId = new ObjectId('688a8962f44826b1bb62957c');

        const result = await Shipment.updateMany(
            {}, // match all shipments
            { $set: { shipper: newShipperId } }
        );

        console.log(`✅ Updated ${result.modifiedCount} shipments.`);
    } catch (err) {
        console.error('❌ Error updating shipments:', err);
    } finally {
        await mongoose.disconnect();
    }
};

updateShipperForAllShipments();
