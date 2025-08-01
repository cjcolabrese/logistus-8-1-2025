document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cancel-edit-btn').addEventListener('click', function () {
        if (lastShipmentData) {
            // Wipe any lingering input fields before restoring
            document.querySelectorAll('[data-editable]').forEach(el => {
                if (el.querySelector('input')) el.innerHTML = '';
            });

            // Re-render with original data
            populateShipmentModal(lastShipmentData);
        }

        // Reset buttons
        document.getElementById('edit-shipment-btn').style.display = 'inline-block';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('save-shipment-btn').style.display = 'none';
    });

    let lastShipmentData = null;


    // Initialize modal
    const shipmentDetailsModal = new bootstrap.Modal(document.getElementById('shipmentDetailsModal'));
    let currentShipmentId = null;

    // Helper functions
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

    function formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCurrency(amount) {
        if (amount === null || amount === undefined) return 'N/A';
        return '$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    function getStatusColor(status) {
        const statusColors = {
            'Available': 'success',
            'Booked': 'warning',
            'In Transit': 'info',
            'Delivered': 'primary',
            'Invoiced': 'secondary',
            'Paid': 'success',
            'Cancelled': 'danger'
        };
        return statusColors[status] || 'secondary';
    }

    function formatBoolean(value) {
        return value ? 'Yes' : 'No';
    }

    function formatDimensions(dimensions) {
        if (!dimensions) return 'N/A';
        return `${dimensions.length || 0}L × ${dimensions.width || 0}W × ${dimensions.height || 0}H`;
    }

    function formatWindow(start, end) {
        if (!start && !end) return 'N/A';
        return `${formatTime(start)} - ${formatTime(end)}`;
    }

    function updateProgressSteps(status) {
        const steps = document.querySelectorAll('.progress-steps .step');
        let activeIndex = 0;

        switch(status) {
            case 'Booked': activeIndex = 0; break;
            case 'In Transit': activeIndex = 1; break;
            case 'Delivered': activeIndex = 2; break;
            case 'Invoiced': activeIndex = 3; break;
            case 'Paid': activeIndex = 4; break;
            default: activeIndex = -1;
        }

        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index < activeIndex) {
                step.classList.add('completed');
            } else if (index === activeIndex) {
                step.classList.add('active');
            }
        });
    }

    // Function to populate modal with shipment data
    function populateShipmentModal(shipmentData) {

        lastShipmentData = JSON.parse(JSON.stringify(shipmentData)); // Deep clone



        currentShipmentId = shipmentData._id;

        // Basic info
        document.getElementById('modal-shipment-number').textContent = shipmentData.shipmentNumber || 'N/A';
        document.getElementById('modal-status').innerHTML =
            `<span class="badge bg-${getStatusColor(shipmentData.status)}">${shipmentData.status || 'N/A'}</span>`;

        // Route information

        const mapOrigin = [
            shipmentData.origin?.address,
            shipmentData.origin?.city,
            shipmentData.origin?.state,
            shipmentData.origin?.zipcode
        ].filter(Boolean).join(', ');

        const mapDestination = [
            shipmentData.destination?.address,
            shipmentData.destination?.city,
            shipmentData.destination?.state,
            shipmentData.destination?.zipcode
        ].filter(Boolean).join(', ');

// Optional: debug log
        console.log("Map Origin:", mapOrigin);
        console.log("Map Destination:", mapDestination);

// Only call if both are non-empty
        if (mapOrigin && mapDestination) {
            initMapWithRoute(mapOrigin, mapDestination);
        }


        // Shipment details
        document.getElementById('modal-shipment-type').textContent = shipmentData.shipmentType || 'N/A';
        document.getElementById('modal-equipment').innerHTML =
            `<span class="badge bg-secondary">${shipmentData.equipmentType || 'N/A'}</span>`;
        document.getElementById('modal-commodity').textContent = shipmentData.commodity || 'N/A';
        document.getElementById('modal-quantity').textContent = shipmentData.quantity || 'N/A';
        document.getElementById('modal-weight').textContent = shipmentData.weight ? `${shipmentData.weight} lbs` : 'N/A';
        document.getElementById('modal-pallets').textContent = shipmentData.pallets || 'N/A';
        document.getElementById('modal-dimensions').textContent = formatDimensions(shipmentData.dimensions);
        document.getElementById('modal-hazmat-class').textContent = shipmentData.hazmatClass || 'N/A';
        document.getElementById('modal-temperature-control').textContent = formatBoolean(shipmentData.temperatureControl);
        document.getElementById('modal-distance').textContent = shipmentData.distance ? `${shipmentData.distance} mi` : 'N/A';

        // Calculate rate per mile
        const rate = shipmentData.baseRate?.amount || 0;
        const distance = shipmentData.distance || 0;
        const ratePerMile = distance ? (rate / distance).toFixed(2) : '0.00';
        document.getElementById('modal-rate-per-mile').textContent = `$${ratePerMile}/mi`;

        // Dates and windows
        document.getElementById('modal-pickup-date').textContent = formatDate(shipmentData.pickupDate);
        document.getElementById('modal-delivery-date').textContent = formatDate(shipmentData.deliveryDate);
        document.getElementById('modal-pickup-window').textContent = formatWindow(shipmentData.pickupWindowStart, shipmentData.pickupWindowEnd);
        document.getElementById('modal-delivery-window').textContent = formatWindow(shipmentData.deliveryWindowStart, shipmentData.deliveryWindowEnd);

        // Financials
        document.getElementById('modal-base-rate').textContent = formatCurrency(shipmentData.baseRate?.amount);
        document.getElementById('modal-rate-type').textContent = shipmentData.baseRate?.rateType || 'flat';
        document.getElementById('modal-accessorials-total').textContent = formatCurrency(shipmentData.accessorialsTotal);
        document.getElementById('modal-fuel-surcharge').textContent = formatCurrency(shipmentData.fuelSurcharge);
        document.getElementById('modal-reserve-price').textContent = formatCurrency(shipmentData.reservePrice);
        document.getElementById('modal-total-rate').textContent = formatCurrency(shipmentData.totalRate);
        document.getElementById('modal-total-rate-summary').textContent = formatCurrency(shipmentData.totalRate);
        document.getElementById('modal-payment-terms').textContent = shipmentData.paymentTerms || 'N/A';
        document.getElementById('modal-payment-status').innerHTML =
            `<span class="badge bg-${getStatusColor(shipmentData.paymentStatus || 'Unpaid')}">${shipmentData.paymentStatus || 'Unpaid'}</span>`;
        document.getElementById('modal-shipment-value').textContent = formatCurrency(shipmentData.shipmentValue);
        document.getElementById('modal-insurance-amount').textContent = formatCurrency(shipmentData.insuranceAmount);
        document.getElementById('modal-bidding-enabled').textContent = formatBoolean(shipmentData.biddingEnabled);
        document.getElementById('modal-bidding-end-date').textContent = shipmentData.biddingEndDate ? formatDate(shipmentData.biddingEndDate) : 'N/A';

        // Addresses
        document.getElementById('modal-origin-address').textContent = shipmentData.origin?.address || 'N/A';
        document.getElementById('modal-destination-address').textContent = shipmentData.destination?.address || 'N/A';
        document.getElementById('modal-origin-city').textContent = shipmentData.origin?.city || 'N/A';
        document.getElementById('modal-origin-state').textContent = shipmentData.origin?.state || 'N/A';
        document.getElementById('modal-origin-zip').textContent = shipmentData.origin?.zipcode || 'N/A';
        document.getElementById('modal-destination-city').textContent = shipmentData.destination?.city || 'N/A';
        document.getElementById('modal-destination-state').textContent = shipmentData.destination?.state || 'N/A';
        document.getElementById('modal-destination-zip').textContent = shipmentData.destination?.zipcode || 'N/A';

        // Accessorials
        document.getElementById('modal-accessorial-hazmat').textContent = formatBoolean(shipmentData.accessorials?.shipment?.hazmat);
        document.getElementById('modal-accessorial-overdimension').textContent = formatBoolean(shipmentData.accessorials?.shipment?.overdimension);
        document.getElementById('modal-accessorial-prepaid').textContent = formatBoolean(shipmentData.accessorials?.shipment?.prepaidAndAdd);
        document.getElementById('modal-accessorial-freeze').textContent = formatBoolean(shipmentData.accessorials?.shipment?.freezeProtection);

        document.getElementById('modal-accessorial-pickup-inside').textContent = formatBoolean(shipmentData.accessorials?.pickup?.inside);
        document.getElementById('modal-accessorial-pickup-liftgate').textContent = formatBoolean(shipmentData.accessorials?.pickup?.liftgate);
        document.getElementById('modal-accessorial-pickup-limited').textContent = formatBoolean(shipmentData.accessorials?.pickup?.limitedAccess);
        document.getElementById('modal-accessorial-pickup-notify').textContent = formatBoolean(shipmentData.accessorials?.pickup?.notifyConsignee);
        document.getElementById('modal-accessorial-pickup-military').textContent = formatBoolean(shipmentData.accessorials?.pickup?.militaryAccess);
        document.getElementById('modal-accessorial-pickup-residential').textContent = formatBoolean(shipmentData.accessorials?.pickup?.residential);
        document.getElementById('modal-accessorial-pickup-airport').textContent = formatBoolean(shipmentData.accessorials?.pickup?.airport);
        document.getElementById('modal-accessorial-pickup-grocery').textContent = formatBoolean(shipmentData.accessorials?.pickup?.groceryWarehouse);

        document.getElementById('modal-accessorial-delivery-inside').textContent = formatBoolean(shipmentData.accessorials?.delivery?.inside);
        document.getElementById('modal-accessorial-delivery-liftgate').textContent = formatBoolean(shipmentData.accessorials?.delivery?.liftgate);
        document.getElementById('modal-accessorial-delivery-limited').textContent = formatBoolean(shipmentData.accessorials?.delivery?.limitedAccess);
        document.getElementById('modal-accessorial-delivery-notify').textContent = formatBoolean(shipmentData.accessorials?.delivery?.notifyConsignee);
        document.getElementById('modal-accessorial-delivery-military').textContent = formatBoolean(shipmentData.accessorials?.delivery?.militaryAccess);
        document.getElementById('modal-accessorial-delivery-residential').textContent = formatBoolean(shipmentData.accessorials?.delivery?.residential);
        document.getElementById('modal-accessorial-delivery-appointment').textContent = formatBoolean(shipmentData.accessorials?.delivery?.appointment);
        document.getElementById('modal-accessorial-delivery-airport').textContent = formatBoolean(shipmentData.accessorials?.delivery?.airport);
        document.getElementById('modal-accessorial-delivery-grocery').textContent = formatBoolean(shipmentData.accessorials?.delivery?.groceryWarehouse);

        // Contacts
        document.getElementById('modal-shipper-name').textContent = shipmentData.shipperContact?.name || 'N/A';
        document.getElementById('modal-shipper-phone').textContent = shipmentData.shipperContact?.phone || 'N/A';
        document.getElementById('modal-shipper-email').textContent = shipmentData.shipperContact?.email || 'N/A';

        document.getElementById('modal-consignee-name').textContent = shipmentData.consigneeContact?.name || 'N/A';
        document.getElementById('modal-consignee-phone').textContent = shipmentData.consigneeContact?.phone || 'N/A';
        document.getElementById('modal-consignee-email').textContent = shipmentData.consigneeContact?.email || 'N/A';

        document.getElementById('modal-emergency-name').textContent = shipmentData.emergencyContact?.name || 'N/A';
        document.getElementById('modal-emergency-phone').textContent = shipmentData.emergencyContact?.phone || 'N/A';
        document.getElementById('modal-emergency-email').textContent = shipmentData.emergencyContact?.email || 'N/A';

        // Documents & Notes
        document.getElementById('modal-special-instructions').textContent = shipmentData.specialInstructions || 'No special instructions.';
        document.getElementById('modal-notes').textContent = shipmentData.notes || 'No notes.';
        document.getElementById('modal-tags').innerHTML = shipmentData.tags?.length ?
            shipmentData.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('') :
            'No tags';

        // Update progress steps
        updateProgressSteps(shipmentData.status);
    }

    // Event delegation for table row clicks
    document.getElementById('shipments-tbody').addEventListener('click', function(e) {
        const row = e.target.closest('.shipment-row');
        if (!row) return;

        // Don't trigger if clicking on a link or button inside the row
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

        // Get shipment data from row attributes
        const originParts = row.dataset.origin.split(',');
        const destinationParts = row.dataset.destination.split(',');

        const shipmentData = {
            _id: row.dataset.id,
            shipmentNumber: row.dataset.shipmentNumber,
            status: row.dataset.status,
            origin: {
                city: originParts[0].trim(),
                state: originParts[1].trim(),
                address: row.querySelector('td:nth-child(2) small')?.textContent || 'N/A'
            },
            destination: {
                city: destinationParts[0].trim(),
                state: destinationParts[1].trim(),
                address: row.querySelector('td:nth-child(3) small')?.textContent || 'N/A'
            },
            distance: row.dataset.distance,
            pickupDate: row.dataset.pickup,
            deliveryDate: row.dataset.delivery,
            equipmentType: row.dataset.equipment,
            weight: row.dataset.weight,
            rate: {
                amount: row.dataset.rate
            },
            // Calculate rate per mile
            ratePerMile: row.dataset.rate && row.dataset.distance ?
                (row.dataset.rate / row.dataset.distance).toFixed(2) : null,
            // Default values for fields not in the table
            shipmentType: 'Full Truckload',
            dimensions: {
                length: 48,
                width: 48,
                height: 96
            },
            accessorials: {
                shipment: {
                    hazmat: false,
                    overdimension: false,
                    prepaidAndAdd: false,
                    freezeProtection: false
                },
                pickup: {
                    inside: false,
                    liftgate: false,
                    limitedAccess: false,
                    notifyConsignee: false,
                    militaryAccess: false,
                    residential: false,
                    airport: false,
                    groceryWarehouse: false
                },
                delivery: {
                    inside: false,
                    liftgate: false,
                    limitedAccess: false,
                    notifyConsignee: false,
                    militaryAccess: false,
                    residential: false,
                    appointment: false,
                    airport: false,
                    groceryWarehouse: false
                }
            },
            totalRate: row.dataset.rate,
            reservePrice: (row.dataset.rate * 0.9).toFixed(2),
            biddingEnabled: false
        };

        // Populate the modal with the shipment data
        populateShipmentModal(shipmentData);

        // Show the modal
        shipmentDetailsModal.show();
    });

    // Edit/Save functionality
    document.getElementById('edit-shipment-btn').addEventListener('click', function () {
        document.getElementById('edit-shipment-btn').style.display = 'none';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';
        document.getElementById('save-shipment-btn').style.display = 'inline-block';

        document.querySelectorAll('[data-editable]').forEach(element => {
            // Skip if it's already editable (double-click safeguard)
            if (element.querySelector('input, textarea, select')) return;

            const originalText = element.textContent.trim();
            const fieldName = element.getAttribute('data-editable');
            const inputType = element.getAttribute('type') || 'text';

            const input = document.createElement('input');
            input.type = inputType === 'currency' ? 'text' : inputType;
            input.className = 'form-control form-control-sm';
            input.value = originalText;

            // Clear and replace content
            element.innerHTML = '';
            element.appendChild(input);
        });
    });





    document.getElementById('save-shipment-btn').addEventListener('click', function() {
        // Implement save functionality here
        alert('Changes saved!'); // Replace with actual save logic

        // Reset buttons
        document.getElementById('edit-shipment-btn').style.display = 'inline-block';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('save-shipment-btn').style.display = 'none';
    });
});
document.addEventListener('DOMContentLoaded', function() {


    // Initialize modal
    const shipmentDetailsModal = new bootstrap.Modal(document.getElementById('shipmentDetailsModal'));
    let currentShipmentId = null;

    // Helper functions
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

    function formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCurrency(amount) {
        if (amount === null || amount === undefined) return 'N/A';
        return '$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    function getStatusColor(status) {
        const statusColors = {
            'Available': 'success',
            'Booked': 'warning',
            'In Transit': 'info',
            'Delivered': 'primary',
            'Invoiced': 'secondary',
            'Paid': 'success',
            'Cancelled': 'danger'
        };
        return statusColors[status] || 'secondary';
    }

    function formatBoolean(value) {
        return value ? 'Yes' : 'No';
    }

    function formatDimensions(dimensions) {
        if (!dimensions) return 'N/A';
        return `${dimensions.length || 0}L × ${dimensions.width || 0}W × ${dimensions.height || 0}H`;
    }

    function formatWindow(start, end) {
        if (!start && !end) return 'N/A';
        return `${formatTime(start)} - ${formatTime(end)}`;
    }

    function updateProgressSteps(status) {
        const steps = document.querySelectorAll('.progress-steps .step');
        if (!steps.length) return;

        let activeIndex = 0;

        switch(status) {
            case 'Booked': activeIndex = 0; break;
            case 'In Transit': activeIndex = 1; break;
            case 'Delivered': activeIndex = 2; break;
            case 'Invoiced': activeIndex = 3; break;
            case 'Paid': activeIndex = 4; break;
            default: activeIndex = -1;
        }

        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index < activeIndex) {
                step.classList.add('completed');
            } else if (index === activeIndex) {
                step.classList.add('active');
            }
        });
    }

    // Safe element query with null check
    function getElementSafely(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID ${id} not found`);
        }
        return element;
    }

    // Function to fetch and populate shipment data
    async function fetchAndPopulateShipment(shipmentNumber) {
        try {

            let lastShipmentData = null; // At top

            async function fetchAndPopulateShipment(shipmentNumber) {

                const shipmentData = await response.json();
                lastShipmentData = JSON.parse(JSON.stringify(shipmentData)); // Deep copy

            }

            // Show loading state
            const shipmentNumberEl = getElementSafely('modal-shipment-number');
            const statusEl = getElementSafely('modal-status');

            if (shipmentNumberEl) shipmentNumberEl.textContent = 'Loading...';
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-secondary">Loading</span>';

            const response = await fetch(`/api/shipments/number/${shipmentNumber}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const shipmentData = await response.json();
            const accessorialTotal = shipmentData.accessorialPricingTotal;
            const totalRate = shipmentData.totalRate;
            console.log(accessorialTotal);
            populateShipmentModal(shipmentData);
            shipmentDetailsModal.show();



        } catch (error) {
            console.error('Error fetching shipment:', error);
            alert('Failed to load shipment details. Please try again.');
            shipmentDetailsModal.hide();
        }
    }

    // Function to populate modal with shipment data
    function populateShipmentModal(shipmentData) {
        if (!shipmentData) return;

        currentShipmentId = shipmentData._id;

        // Helper function to safely set content
        function setContent(id, content) {
            const element = getElementSafely(id);
            if (element) element.textContent = content;
        }

        function setHTML(id, html) {
            const element = getElementSafely(id);
            if (element) element.innerHTML = html;
        }

        // Basic info
        setContent('modal-shipment-number', shipmentData.shipmentNumber || 'N/A');
        setHTML('modal-status', `<span class="badge bg-${getStatusColor(shipmentData.status)}">${shipmentData.status || 'N/A'}</span>`);

        // Route information
        setContent('modal-origin', shipmentData.origin?.city ?
            `${shipmentData.origin.city}, ${shipmentData.origin.state}` : 'N/A');
        setContent('modal-destination', shipmentData.destination?.city ?
            `${shipmentData.destination.city}, ${shipmentData.destination.state}` : 'N/A');

        // Shipment details
        setContent('modal-shipment-type', shipmentData.shipmentType || 'N/A');
        setHTML('modal-equipment', `<span class="badge bg-secondary">${shipmentData.equipmentType || 'N/A'}</span>`);
        setContent('modal-commodity', shipmentData.commodity || 'N/A');
        setContent('modal-quantity', shipmentData.quantity || 'N/A');
        setContent('modal-weight', shipmentData.weight ? `${shipmentData.weight} lbs` : 'N/A');
        setContent('modal-pallets', shipmentData.pallets || 'N/A');
        setContent('modal-dimensions', formatDimensions(shipmentData.dimensions));
        setContent('modal-hazmat-class', shipmentData.hazmatClass || 'N/A');
        setContent('modal-temperature-control', formatBoolean(shipmentData.temperatureControl));
        setContent('modal-distance', shipmentData.distance ? `${shipmentData.distance} mi` : 'N/A');
        const accessorialTotal = shipmentData.accessorialPricingTotal;

        setContent('accessorial-total',
            typeof accessorialTotal === 'number'
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(accessorialTotal)
                : 'N/A'
        );


        const totalRate = shipmentData.totalRate || 0;
        const formattedTotalRate = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(totalRate);

        setContent('total-rate', formattedTotalRate);

        // Calculate rate per mile
        const rate = shipmentData.baseRate?.amount || 0;
        const distance = shipmentData.distance || 0;
        const ratePerMile = distance ? (rate / distance).toFixed(2) : '0.00';
        setContent('modal-rate-per-mile', `$${ratePerMile}/mi`);

        // Dates and windows
        setContent('modal-pickup-date', formatDate(shipmentData.pickupDate));
        setContent('modal-delivery-date', formatDate(shipmentData.deliveryDate));
        setContent('modal-pickup-window', formatWindow(shipmentData.pickupWindowStart, shipmentData.pickupWindowEnd));
        setContent('modal-delivery-window', formatWindow(shipmentData.deliveryWindowStart, shipmentData.deliveryWindowEnd));

        // Financials
        setContent('modal-base-rate', formatCurrency(shipmentData.baseRate?.amount));
        setContent('modal-rate-type', shipmentData.baseRate?.rateType || 'flat');
        setContent('modal-accessorials-total', formatCurrency(shipmentData.accessorialsTotal));
        setContent('modal-fuel-surcharge', formatCurrency(shipmentData.fuelSurcharge));
        setContent('modal-reserve-price', formatCurrency(shipmentData.reservePrice));
        setContent('modal-total-rate', formatCurrency(shipmentData.totalRate));
        setContent('modal-total-rate-summary', formatCurrency(shipmentData.totalRate));
        setContent('modal-payment-terms', shipmentData.paymentTerms || 'N/A');
        setHTML('modal-payment-status', `<span class="badge bg-${getStatusColor(shipmentData.paymentStatus || 'Unpaid')}">${shipmentData.paymentStatus || 'Unpaid'}</span>`);
        setContent('modal-shipment-value', formatCurrency(shipmentData.shipmentValue));
        setContent('modal-insurance-amount', formatCurrency(shipmentData.insuranceAmount));
        setContent('modal-bidding-enabled', formatBoolean(shipmentData.biddingEnabled));
        setContent('modal-bidding-end-date', shipmentData.biddingEndDate ? formatDate(shipmentData.biddingEndDate) : 'N/A');

        // Addresses
        setContent('modal-origin-address', shipmentData.origin?.address || 'N/A');
        setContent('modal-destination-address', shipmentData.destination?.address || 'N/A');
        setContent('modal-origin-city', shipmentData.origin?.city || 'N/A');
        setContent('modal-origin-state', shipmentData.origin?.state || 'N/A');
        setContent('modal-origin-zip', shipmentData.origin?.zipcode || 'N/A');
        setContent('modal-destination-city', shipmentData.destination?.city || 'N/A');
        setContent('modal-destination-state', shipmentData.destination?.state || 'N/A');
        setContent('modal-destination-zip', shipmentData.destination?.zipcode || 'N/A');


        function initMapWithRoute(origin, destination) {
            if (!window.google || !google.maps) {
                console.error("Google Maps not loaded");
                return;
            }

            const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 6, // Initial fallback zoom
                center: { lat: 39.5, lng: -98.35 } // US fallback center
            });

            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: false
            });

            const request = {
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, (response, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(response);

                    // Auto-center and zoom the map to fit the route
                    const bounds = new google.maps.LatLngBounds();
                    const route = response.routes[0];

                    route.legs.forEach(leg => {
                        bounds.extend(leg.start_location);
                        bounds.extend(leg.end_location);
                    });

                    map.fitBounds(bounds);
                } else {
                    console.error("Could not display route due to:", status);
                }
            });
        }


        // Accessorials
        setContent('modal-accessorial-hazmat', formatBoolean(shipmentData.accessorials?.shipment?.hazmat));
        setContent('modal-accessorial-overdimension', formatBoolean(shipmentData.accessorials?.shipment?.overdimension));
        setContent('modal-accessorial-prepaid', formatBoolean(shipmentData.accessorials?.shipment?.prepaidAndAdd));
        setContent('modal-accessorial-freeze', formatBoolean(shipmentData.accessorials?.shipment?.freezeProtection));

        setContent('modal-accessorial-pickup-inside', formatBoolean(shipmentData.accessorials?.pickup?.inside));
        setContent('modal-accessorial-pickup-liftgate', formatBoolean(shipmentData.accessorials?.pickup?.liftgate));
        setContent('modal-accessorial-pickup-limited', formatBoolean(shipmentData.accessorials?.pickup?.limitedAccess));
        setContent('modal-accessorial-pickup-notify', formatBoolean(shipmentData.accessorials?.pickup?.notifyConsignee));
        setContent('modal-accessorial-pickup-military', formatBoolean(shipmentData.accessorials?.pickup?.militaryAccess));
        setContent('modal-accessorial-pickup-residential', formatBoolean(shipmentData.accessorials?.pickup?.residential));
        setContent('modal-accessorial-pickup-airport', formatBoolean(shipmentData.accessorials?.pickup?.airport));
        setContent('modal-accessorial-pickup-grocery', formatBoolean(shipmentData.accessorials?.pickup?.groceryWarehouse));

        setContent('modal-accessorial-delivery-inside', formatBoolean(shipmentData.accessorials?.delivery?.inside));
        setContent('modal-accessorial-delivery-liftgate', formatBoolean(shipmentData.accessorials?.delivery?.liftgate));
        setContent('modal-accessorial-delivery-limited', formatBoolean(shipmentData.accessorials?.delivery?.limitedAccess));
        setContent('modal-accessorial-delivery-notify', formatBoolean(shipmentData.accessorials?.delivery?.notifyConsignee));
        setContent('modal-accessorial-delivery-military', formatBoolean(shipmentData.accessorials?.delivery?.militaryAccess));
        setContent('modal-accessorial-delivery-residential', formatBoolean(shipmentData.accessorials?.delivery?.residential));
        setContent('modal-accessorial-delivery-appointment', formatBoolean(shipmentData.accessorials?.delivery?.appointment));
        setContent('modal-accessorial-delivery-airport', formatBoolean(shipmentData.accessorials?.delivery?.airport));
        setContent('modal-accessorial-delivery-grocery', formatBoolean(shipmentData.accessorials?.delivery?.groceryWarehouse));

        // Contacts
        setContent('modal-shipper-name', shipmentData.shipperContact?.name || 'N/A');
        setContent('modal-shipper-phone', shipmentData.shipperContact?.phone || 'N/A');
        setContent('modal-shipper-email', shipmentData.shipperContact?.email || 'N/A');

        setContent('modal-consignee-name', shipmentData.consigneeContact?.name || 'N/A');
        setContent('modal-consignee-phone', shipmentData.consigneeContact?.phone || 'N/A');
        setContent('modal-consignee-email', shipmentData.consigneeContact?.email || 'N/A');

        setContent('modal-emergency-name', shipmentData.emergencyContact?.name || 'N/A');
        setContent('modal-emergency-phone', shipmentData.emergencyContact?.phone || 'N/A');
        setContent('modal-emergency-email', shipmentData.emergencyContact?.email || 'N/A');

        // Documents & Notes
        setContent('modal-special-instructions', shipmentData.specialInstructions || 'No special instructions.');
        setContent('modal-notes', shipmentData.notes || 'No notes.');
        setHTML('modal-tags', shipmentData.tags?.length ?
            shipmentData.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('') :
            'No tags');

        // Update progress steps
        updateProgressSteps(shipmentData.status);
    }

    // Event delegation for table row clicks
    document.getElementById('shipments-tbody').addEventListener('click', function(e) {
        const row = e.target.closest('.shipment-row');
        if (!row) return;

        // Don't trigger if clicking on a link or button inside the row
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

        // Get shipment number from data attribute
        const shipmentNumber = row.dataset.shipmentNumber;

        // Fetch and populate the modal with data from API
        fetchAndPopulateShipment(shipmentNumber);
    });

    // Edit/Save functionality
    const editBtn = getElementSafely('edit-shipment-btn');
    const cancelBtn = getElementSafely('cancel-edit-btn');
    const saveBtn = getElementSafely('save-shipment-btn');

    if (editBtn && cancelBtn && saveBtn) {
        editBtn.addEventListener('click', function() {
            editBtn.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
            saveBtn.style.display = 'inline-block';

            document.querySelectorAll('[data-editable]').forEach(element => {
                const fieldName = element.getAttribute('data-editable');
                const rawValue = getNestedValue(lastShipmentData, fieldName);
                const safeValue = rawValue !== undefined && rawValue !== null ? rawValue : '';

                element.innerHTML = `<input type="text" class="form-control form-control-sm" value="${safeValue}">`;
            });
        });
        function getNestedValue(obj, path) {
            return path.split('.').reduce((acc, key) => acc && acc[key], obj);
        }


        saveBtn.addEventListener('click', async function() {
            try {
                const shipmentNumber = getElementSafely('modal-shipment-number')?.textContent;
                if (!shipmentNumber) throw new Error('No shipment number found');

                const response = await fetch(`/api/shipments/number/${shipmentNumber}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(collectEditedData())
                });

                if (!response.ok) throw new Error('Failed to update shipment');

                await fetchAndPopulateShipment(shipmentNumber);

                editBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'none';
                saveBtn.style.display = 'none';

            } catch (error) {
                console.error('Error updating shipment:', error);
                alert('Failed to update shipment. Please try again.');
            }
        });
    }

    function collectEditedData() {
        const editedData = {};
        document.querySelectorAll('[data-editable]').forEach(element => {
            const fieldName = element.getAttribute('data-editable');
            const value = element.querySelector('input')?.value;
            if (fieldName && value !== undefined) {
                editedData[fieldName] = value;
            }
        });
        return editedData;
    }

});
const shipmentDetailsModal = new bootstrap.Modal(document.getElementById('shipmentDetailsModal'));

// Make sure the close button works
document.querySelector('#shipmentDetailsModal .btn-close').addEventListener('click', function() {
    shipmentDetailsModal.hide();
});

// Also make sure the close button in footer works
document.getElementById('close-modal-btn').addEventListener('click', function() {
    shipmentDetailsModal.hide();
});
///////////////////////////////////////////////////////////////////////////////////












