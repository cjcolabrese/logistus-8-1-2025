const mongoose = require('mongoose');
const Shipment = require('./models/Shipment'); // adjust path if needed

mongoose.connect('mongodb://localhost:27017/logistusio', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            const shipments = await Shipment.find({ status: 'Booked' });

            if (shipments.length === 0) {
                console.log('No booked shipments found.');
                return;
            }

            for (const shipment of shipments) {
                shipment.status = 'Available';
                shipment.carrier = undefined;
                shipment.bookedBy = undefined;
                shipment.bookedAt = undefined;
                shipment.assignedCarrier = undefined;
                shipment.documents = undefined;

                await shipment.save();
                console.log(`Reset shipment: ${shipment.shipmentNumber}`);
            }

            console.log('All applicable shipments have been reset.');
        } catch (error) {
            console.error('Error updating shipments:', error);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
    });
