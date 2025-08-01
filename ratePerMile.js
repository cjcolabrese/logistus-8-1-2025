// updateRatePerMile.js

require('dotenv').config();
const mongoose = require('mongoose');
const Shipment = require('./models/Shipment'); // adjust path to match your project

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/logistusio')
    .then(async () => {
        console.log('MongoDB connected');

        const shipments = await Shipment.find({});

        console.log(`Found ${shipments.length} shipments`);

        let updatedCount = 0;

        for (const shipment of shipments) {
            const { totalRate, distance } = shipment;

            if (typeof totalRate === 'number' && typeof distance === 'number' && distance > 0) {
                const ratePerMile = +(totalRate / distance).toFixed(2);

                // Only update if value changed or missing
                if (shipment.ratePerMile !== ratePerMile) {
                    shipment.ratePerMile = ratePerMile;
                    await shipment.save();
                    updatedCount++;
                }
            } else {
                console.warn(`Skipping shipment ${shipment.shipmentNumber} — invalid totalRate or distance`);
            }
        }

        console.log(`✅ Updated ${updatedCount} shipments`);
        mongoose.disconnect();
    })
    .catch(err => {
        console.error('❌ Error:', err);
        mongoose.disconnect();
    });
