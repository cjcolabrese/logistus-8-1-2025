require('dotenv').config();
const mongoose = require('mongoose');
const Shipment = require('./models/Shipment');
const Document = require('./models/Document');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/logistusio');

async function deleteMongoDocumentsOnly() {
    try {
        const shipments = await Shipment.find({}).populate('documents');

        for (const shipment of shipments) {
            if (!shipment.documents || shipment.documents.length === 0) continue;

            console.log(`Clearing ${shipment.documents.length} docs from ${shipment.shipmentNumber}`);

            for (const doc of shipment.documents) {
                try {
                    await Document.findByIdAndDelete(doc._id);
                    console.log(`Deleted Document ${doc._id}`);
                } catch (err) {
                    console.error(`Error deleting document ${doc._id}:`, err.message);
                }
            }

            shipment.documents = [];
            await shipment.save();
            console.log(`Updated Shipment ${shipment.shipmentNumber}`);
        }

        console.log('✅ MongoDB document cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

deleteMongoDocumentsOnly();
