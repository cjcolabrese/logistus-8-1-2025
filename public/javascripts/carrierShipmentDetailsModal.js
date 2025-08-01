document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all shipment rows
    document.querySelectorAll('.shipment-row').forEach(row => {

        row.addEventListener('click', function () {
            const shipmentNumber = this.dataset.shipmentNumber;
            const tableType = this.dataset.context || 'posted-shipment';
            fetchShipmentDetails(shipmentNumber, tableType);
        });
    });

    // Function to fetch shipment details and populate modal
    function fetchShipmentDetails(shipmentNumber, tableType) {
        fetch(`/api/shipments/number/${shipmentNumber}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })

            .then(shipment => {
                if (!shipment || typeof shipment !== 'object') {
                    console.error('Shipment data is invalid:', shipment);
                    alert('Shipment data is missing or malformed.');
                    return;
                }
                const bookBtn = document.getElementById('bookButton');
                if (bookBtn) {
                    if (tableType === 'active-shipment') {
                        bookBtn.classList.add('d-none'); // Hide for active
                    } else {
                        bookBtn.classList.remove('d-none'); // Show for posted
                    }
                }
                populateModal(shipment);
                // Show the modal
                const modal = new bootstrap.Modal(document.getElementById('carrierShipmentDetailsModal'));
                modal.show();
                const modalEl = document.getElementById('carrierShipmentDetailsModal');
                modalEl.addEventListener('hidden.bs.modal', function () {
                    // Clean up Bootstrap modal state
                    document.body.classList.remove('modal-open');
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                });

            })
            .catch(error => {
                console.error('Error fetching shipment details:', error);
                alert('Failed to load shipment details. Please try again.');
            });
    }
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    // Function to populate all modal fields with shipment data
    function populateModal(shipment) {


        // Basic shipment info
        document.getElementById('modal-shipment-number').textContent = shipment.shipmentNumber;
        document.getElementById('modal-status').textContent = shipment.status;
        document.getElementById('modal-status').className = `badge rounded-pill align-middle bg-${statusColor(shipment.status)}`;

        // Route information
        document.getElementById('modal-origin').textContent = `${shipment.origin.city}, ${shipment.origin.state}`;
        document.getElementById('modal-destination').textContent = `${shipment.destination.city}, ${shipment.destination.state}`;

        // Origin details
        document.getElementById('modal-origin-address').textContent = shipment.origin.address || 'N/A';
        document.getElementById('modal-origin-city').textContent = shipment.origin.city;
        document.getElementById('modal-origin-state').textContent = shipment.origin.state;
        document.getElementById('modal-origin-zip').textContent = shipment.origin.zipcode;
        document.getElementById('modal-pickup-date').textContent = formatDate(shipment.pickupDate);

        // Destination details
        document.getElementById('modal-destination-address').textContent = shipment.destination.address || 'N/A';
        document.getElementById('modal-destination-city').textContent = shipment.destination.city;
        document.getElementById('modal-destination-state').textContent = shipment.destination.state;
        document.getElementById('modal-destination-zip').textContent = shipment.destination.zipcode;
        document.getElementById('modal-delivery-date').textContent = formatDate(shipment.deliveryDate);

        // Shipment details
        document.getElementById('modal-shipment-type').textContent = shipment.shipmentType || 'N/A';
        document.getElementById('modal-equipment').textContent = shipment.equipmentType || 'N/A';
        document.getElementById('modal-commodity').textContent = shipment.commodity || 'N/A';
        document.getElementById('modal-quantity').textContent = shipment.quantity || 'N/A';
        document.getElementById('modal-weight').textContent = shipment.weight ? `${formatNumber(shipment.weight)} lbs` : 'N/A';
        document.getElementById('modal-pallets').textContent = shipment.pallets || 'N/A';
        document.getElementById('modal-dimensions').textContent = shipment.dimensions || 'N/A';
        document.getElementById('modal-hazmat-class').textContent = shipment.hazmatClass || 'N/A';
        document.getElementById('modal-temperature-control').textContent = shipment.temperatureControl || 'N/A';
        document.getElementById('modal-distance').textContent = shipment.distance ? `${shipment.distance} mi` : 'N/A';
        document.getElementById('modal-rate-per-mile').textContent = shipment.ratePerMile ? `$${formatCurrency(shipment.ratePerMile)}/mi` : 'N/A';

        // Financial information
        document.getElementById('modal-total-rate').textContent = shipment.baseRate?.amount ? `$${formatCurrency(shipment.baseRate.amount)}` : 'N/A';
        document.getElementById('modal-payment-status').textContent = shipment.paymentStatus || 'N/A';
        document.getElementById('modal-payment-status').className = `badge bg-${statusColor(shipment.paymentStatus)}`;
        document.getElementById('modal-base-rate').textContent = shipment.baseRate?.amount ? `$${formatCurrency(shipment.baseRate.amount)}` : 'N/A';
        document.getElementById('accessorial-total').textContent = shipment.accessorialsTotal ? `$${formatCurrency(shipment.accessorialsTotal)}` : '$0.00';
        document.getElementById('total-rate').textContent = shipment.totalRate ? `$${formatCurrency(shipment.totalRate)}` : 'N/A';
        document.getElementById('modal-payment-terms').textContent = shipment.paymentTerms || 'N/A';
        document.getElementById('modal-shipment-value').textContent = shipment.shipmentValue ? `$${formatCurrency(shipment.shipmentValue)}` : 'N/A';
        document.getElementById('modal-insurance-amount').textContent = shipment.insuranceAmount ? `$${formatCurrency(shipment.insuranceAmount)}` : 'N/A';

        // Contacts
        if (shipment.shipperContact) {
            document.getElementById('modal-shipper-name').textContent = shipment.shipperContact.name || 'N/A';
            document.getElementById('modal-shipper-phone').textContent = shipment.shipperContact.phone || 'N/A';
            document.getElementById('modal-shipper-email').textContent = shipment.shipperContact.email || 'N/A';
        }

        if (shipment.consigneeContact) {
            document.getElementById('modal-consignee-name').textContent = shipment.consigneeContact.name || 'N/A';
            document.getElementById('modal-consignee-phone').textContent = shipment.consigneeContact.phone || 'N/A';
            document.getElementById('modal-consignee-email').textContent = shipment.consigneeContact.email || 'N/A';
        }

        if (shipment.emergencyContact) {
            document.getElementById('modal-emergency-name').textContent = shipment.emergencyContact.name || 'N/A';
            document.getElementById('modal-emergency-phone').textContent = shipment.emergencyContact.phone || 'N/A';
            document.getElementById('modal-emergency-email').textContent = shipment.emergencyContact.email || 'N/A';
        }

        // Accessorials
        if (shipment.accessorials) {
            // Shipment accessorials
            document.querySelector('[data-editable="accessorials.shipment.hazmat"]').checked = shipment.accessorials.shipment?.hazmat || false;
            document.querySelector('[data-editable="accessorials.shipment.overdimension"]').checked = shipment.accessorials.shipment?.overdimension || false;
            document.querySelector('[data-editable="accessorials.shipment.prepaidAndAdd"]').checked = shipment.accessorials.shipment?.prepaidAndAdd || false;
            document.querySelector('[data-editable="accessorials.shipment.freezeProtection"]').checked = shipment.accessorials.shipment?.freezeProtection || false;

            // Pickup accessorials
            document.querySelector('[data-editable="accessorials.pickup.inside"]').checked = shipment.accessorials.pickup?.inside || false;
            document.querySelector('[data-editable="accessorials.pickup.liftgate"]').checked = shipment.accessorials.pickup?.liftgate || false;
            document.querySelector('[data-editable="accessorials.pickup.limitedAccess"]').checked = shipment.accessorials.pickup?.limitedAccess || false;
            document.querySelector('[data-editable="accessorials.pickup.notifyConsignee"]').checked = shipment.accessorials.pickup?.notifyConsignee || false;
            document.querySelector('[data-editable="accessorials.pickup.militaryAccess"]').checked = shipment.accessorials.pickup?.militaryAccess || false;
            document.querySelector('[data-editable="accessorials.pickup.residential"]').checked = shipment.accessorials.pickup?.residential || false;
            document.querySelector('[data-editable="accessorials.pickup.airport"]').checked = shipment.accessorials.pickup?.airport || false;
            document.querySelector('[data-editable="accessorials.pickup.groceryWarehouse"]').checked = shipment.accessorials.pickup?.groceryWarehouse || false;

            // Delivery accessorials
            document.querySelector('[data-editable="accessorials.delivery.inside"]').checked = shipment.accessorials.delivery?.inside || false;
            document.querySelector('[data-editable="accessorials.delivery.liftgate"]').checked = shipment.accessorials.delivery?.liftgate || false;
            document.querySelector('[data-editable="accessorials.delivery.limitedAccess"]').checked = shipment.accessorials.delivery?.limitedAccess || false;
            document.querySelector('[data-editable="accessorials.delivery.notifyConsignee"]').checked = shipment.accessorials.delivery?.notifyConsignee || false;
            document.querySelector('[data-editable="accessorials.delivery.militaryAccess"]').checked = shipment.accessorials.delivery?.militaryAccess || false;
            document.querySelector('[data-editable="accessorials.delivery.residential"]').checked = shipment.accessorials.delivery?.residential || false;
            document.querySelector('[data-editable="accessorials.delivery.appointment"]').checked = shipment.accessorials.delivery?.appointment || false;
            document.querySelector('[data-editable="accessorials.delivery.airport"]').checked = shipment.accessorials.delivery?.airport || false;
            document.querySelector('[data-editable="accessorials.delivery.groceryWarehouse"]').checked = shipment.accessorials.delivery?.groceryWarehouse || false;
        }

        // Update progress steps based on status
        updateProgressSteps(shipment.status);
    }

    // Helper function to update progress steps based on shipment status
    function updateProgressSteps(status) {
        const steps = document.querySelectorAll('.progress-steps .step');

        // Reset all steps
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
        function statusColor(status) {
            if (!status || typeof status !== 'string') return 'secondary'; // fallback badge color
            switch(status.toLowerCase()) {
                case 'booked': return 'primary';
                case 'in transit': return 'info';
                case 'delivered': return 'success';
                case 'invoiced': return 'warning';
                case 'paid': return 'success';
                case 'cancelled': return 'dark';
                default: return 'secondary';
            }
        }



        // Activate steps based on status
        switch(status.toLowerCase()) {
            case 'booked':
                steps[0].classList.add('active');
                break;
            case 'in transit':
                steps[0].classList.add('completed');
                steps[1].classList.add('active');
                break;
            case 'delivered':
                steps[0].classList.add('completed');
                steps[1].classList.add('completed');
                steps[2].classList.add('active');
                break;
            case 'invoiced':
                steps[0].classList.add('completed');
                steps[1].classList.add('completed');
                steps[2].classList.add('completed');
                steps[3].classList.add('active');
                break;
            case 'paid':
                steps.forEach(step => step.classList.add('completed'));
                break;
        }
    }

    // Helper function to format currency (you may already have this)
    function formatCurrency(amount) {
        return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // Helper function to format numbers (you may already have this)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Helper function to determine status color (you may already have this)
    function statusColor(status) {
        if (typeof status !== 'string') return 'secondary';
        switch (status.toLowerCase()) {
            case 'booked': return 'primary';
            case 'in transit': return 'info';
            case 'delivered': return 'success';
            case 'invoiced': return 'warning';
            case 'paid': return 'success';
            case 'cancelled': return 'dark';
            default: return 'secondary';
        }
    }

});