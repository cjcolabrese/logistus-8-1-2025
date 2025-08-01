const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

// Replace this with your actual connection string
const MONGO_URI = 'mongodb://localhost:27017/logistusio';

// Import your Shipment model
const Shipment = require('./models/Shipment'); // adjust path as needed

async function updatePostedByForAllShipments() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

        const newPostedBy = new Types.ObjectId('688a8962f44826b1bb62957c');

        const result = await Shipment.updateMany({}, { $set: { postedBy: newPostedBy } });

        console.log(`Successfully updated ${result.modifiedCount} shipments.`);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error updating shipments:', error);
        process.exit(1);
    }
}

updatePostedByForAllShipments();
