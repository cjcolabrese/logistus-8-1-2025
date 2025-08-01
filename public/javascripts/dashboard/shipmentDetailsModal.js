document.addEventListener('DOMContentLoaded', function () {
    // Global variables
    let lastShipmentData = null;
    let currentShipmentId = null;
    const shipmentDetailsModal = new bootstrap.Modal(document.getElementById('shipmentDetailsModal'));

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

        switch (status) {
            case 'Booked':
                activeIndex = 0;
                break;
            case 'In Transit':
                activeIndex = 1;
                break;
            case 'Delivered':
                activeIndex = 2;
                break;
            case 'Invoiced':
                activeIndex = 3;
                break;
            case 'Paid':
                activeIndex = 4;
                break;
            default:
                activeIndex = -1;
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

    // Helper function to safely set content
    function setContent(id, content) {
        const element = getElementSafely(id);
        if (element) element.textContent = content;
    }

    function setHTML(id, html) {
        const element = getElementSafely(id);
        if (element) element.innerHTML = html;
    }

    // Helper function to get nested object values
    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    // Initialize Google Maps with route
    function initMapWithRoute(origin, destination) {
        if (!window.google || !google.maps) {
            console.error("Google Maps not loaded");
            return;
        }

        const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 6,
            center: {lat: 39.5, lng: -98.35},
            mapTypeControl: false,        // Removes Map/Satellite buttons
            fullscreenControl: false,     // Removes fullscreen button
            streetViewControl: false,     // Removes Pegman / street view
            zoomControl: false,           // Removes +/- zoom buttons
            scaleControl: false,          // Removes the distance scale
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

    // Function to fetch and populate shipment data
    async function fetchAndPopulateShipment(shipmentNumber) {
        try {
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

        // Store a deep copy of the original data
        lastShipmentData = JSON.parse(JSON.stringify(shipmentData));
        currentShipmentId = shipmentData._id;

        // Basic info
        setContent('modal-shipment-number', shipmentData.shipmentNumber || 'N/A');
        setHTML('modal-status', `<span class="badge bg-${getStatusColor(shipmentData.status)}">${shipmentData.status || 'N/A'}</span>`);

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

        // Initialize map if both origin and destination are available
        if (mapOrigin && mapDestination) {
            initMapWithRoute(mapOrigin, mapDestination);
        }

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

        // Handle accessorial total
        const accessorialTotal = shipmentData.accessorialPricingTotal;
        setContent('accessorial-total',
            typeof accessorialTotal === 'number'
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(accessorialTotal)
                : 'N/A'
        );

        // Handle total rate
        const totalRate = shipmentData.totalRate || 0;
        const formattedTotalRate = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(totalRate);
        setContent('total-rate', formattedTotalRate);

        // Addresses
        setContent('modal-origin-address', shipmentData.origin?.address || 'N/A');
        setContent('modal-destination-address', shipmentData.destination?.address || 'N/A');
        setContent('modal-origin-city', shipmentData.origin?.city || 'N/A');
        setContent('modal-origin-state', shipmentData.origin?.state || 'N/A');
        setContent('modal-origin-zip', shipmentData.origin?.zipcode || 'N/A');
        setContent('modal-destination-city', shipmentData.destination?.city || 'N/A');
        setContent('modal-destination-state', shipmentData.destination?.state || 'N/A');
        setContent('modal-destination-zip', shipmentData.destination?.zipcode || 'N/A');

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

    // Function to collect edited data from form inputs
    function collectEditedData() {
        const editedData = {};
        document.querySelectorAll('[data-editable]').forEach(element => {
            const fieldName = element.getAttribute('data-editable');
            const inputElement = element.querySelector('input');
            if (fieldName && inputElement) {
                let value = inputElement.value;

                // Try to parse numeric values
                if (!isNaN(value) && value !== '') {
                    value = parseFloat(value);
                }

                // Handle nested object paths
                if (fieldName.includes('.')) {
                    const keys = fieldName.split('.');
                    let current = editedData;
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!current[keys[i]]) current[keys[i]] = {};
                        current = current[keys[i]];
                    }
                    current[keys[keys.length - 1]] = value;
                } else {
                    editedData[fieldName] = value;
                }
            }
        });
        return editedData;
    }

    // Function to restore original data display
    function restoreOriginalData() {
        if (!lastShipmentData) return;

        // Clear any input fields and restore original content
        document.querySelectorAll('[data-editable]').forEach(element => {
            const fieldName = element.getAttribute('data-editable');
            if (fieldName) {
                const originalValue = getNestedValue(lastShipmentData, fieldName);
                const displayValue = originalValue !== undefined && originalValue !== null ? originalValue : 'N/A';

                // Handle special formatting for certain fields
                if (fieldName.includes('rate') || fieldName.includes('price') || fieldName.includes('amount')) {
                    element.textContent = formatCurrency(originalValue);
                } else if (fieldName.includes('date')) {
                    element.textContent = formatDate(originalValue);
                } else if (fieldName.includes('weight') && originalValue) {
                    element.textContent = `${originalValue} lbs`;
                } else if (fieldName.includes('distance') && originalValue) {
                    element.textContent = `${originalValue} mi`;
                } else {
                    element.textContent = displayValue;
                }
            }
        });
    }

    // Event delegation for table row clicks
    const shipmentsTableBody = document.getElementById('shipments-tbody');
    if (shipmentsTableBody) {
        shipmentsTableBody.addEventListener('click', function (e) {
            const row = e.target.closest('.shipment-row');
            if (!row) return;

            // Don't trigger if clicking on a link or button inside the row
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

            // Get shipment number from data attribute
            const shipmentNumber = row.dataset.shipmentNumber;
            if (shipmentNumber) {
                fetchAndPopulateShipment(shipmentNumber);
            }
        });
    }

    // Edit/Cancel/Save button functionality
    const editBtn = getElementSafely('edit-shipment-btn');
    const cancelBtn = getElementSafely('cancel-edit-btn');
    const saveBtn = getElementSafely('save-shipment-btn');

    // Edit button - enable editing mode
    if (editBtn) {
        editBtn.addEventListener('click', function () {
            // Hide edit button, show cancel and save buttons
            editBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (saveBtn) saveBtn.style.display = 'inline-block';

            // Convert editable elements to input fields
            document.querySelectorAll('[data-editable]').forEach(element => {
                const fieldName = element.getAttribute('data-editable');
                const rawValue = getNestedValue(lastShipmentData, fieldName);
                const safeValue = rawValue !== undefined && rawValue !== null ? rawValue : '';

                element.innerHTML = `<input type="text" class="form-control form-control-sm" value="${safeValue}">`;
            });
        });
    }

    // Cancel button - restore original data and exit edit mode
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            // Restore original data display
            restoreOriginalData();

            // Reset button visibility
            if (editBtn) editBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'none';
        });
    }

    // Save button - save changes and exit edit mode
    if (saveBtn) {
        saveBtn.addEventListener('click', async function () {
            try {
                const shipmentNumber = getElementSafely('modal-shipment-number')?.textContent;
                if (!shipmentNumber || shipmentNumber === 'Loading...') {
                    throw new Error('No valid shipment number found');
                }

                // Collect edited data
                const editedData = collectEditedData();

                // Send update request
                const response = await fetch(`/api/shipments/number/${shipmentNumber}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(editedData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Refresh the modal with updated data
                await fetchAndPopulateShipment(shipmentNumber);

                // Reset button visibility
                editBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'none';
                saveBtn.style.display = 'none';

                // Show success message
                console.log('Shipment updated successfully');

            } catch (error) {
                console.error('Error updating shipment:', error);
                alert('Failed to update shipment. Please try again.');
            }
        });
    }
});