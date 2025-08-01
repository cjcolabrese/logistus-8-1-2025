// Updated fetchAndDisplayLocationContact function
document.querySelectorAll('input[type="checkbox"][name^="accessorials"]').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
        const accountId = document.getElementById('originAccount')?.value;
        if (!accountId || !checkbox.checked) return;

        const pricing = await fetchAccessorialPricing(accountId);
        if (!pricing) return;

        updateAccessorialPricingFields(pricing);
    });
});

async function fetchAndStoreLocationContact(accountId, locationId, contactType) {
    if (!accountId || !locationId) return null;

    try {
        const res = await fetch(`/accounts/${accountId}/locations/${locationId}/locationContact`);
        if (!res.ok) throw new Error('Failed to fetch location contact');
        const contact = await res.json();

        // Store the contact in hidden fields
        if (contact) {
            updateOrCreateField(`${contactType}[name]`, contact.name || '');
            updateOrCreateField(`${contactType}[phone]`, contact.phoneNumber || '');
            updateOrCreateField(`${contactType}[email]`, contact.email || '');
        }

        return contact;
    } catch (err) {
        console.error('Error fetching location contact:', err);
        return null;
    }
}
async function fetchAccessorialPricing(accountId) {
    try {
        const res = await fetch(`/accounts/${accountId}/accessorials`);

        if (!res.ok) throw new Error('Failed to fetch accessorial pricing');
        return await res.json();
    } catch (err) {
        console.error('❌ Error fetching accessorial pricing:', err);
        return null;
    }
}
function updateOrCreateField(name, value) {
    const container = document.getElementById('accessorialPricingFields');
    if (!container) {
        console.error("❌ accessorialPricingFields container not found.");
        return;
    }

    // Create table if it doesn't exist
    let table = container.querySelector('table');
    if (!table) {
        table = document.createElement('table');
        table.className = 'table table-sm table-bordered align-middle mb-0';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width: 70%">Accessorial</th>
                    <th style="width: 30%">Price ($)</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        container.innerHTML = ''; // Clear placeholder message if present
        container.appendChild(table);
    }

    const tbody = table.querySelector('tbody');
    const existingRow = tbody.querySelector(`tr[data-field="${name}"]`);

    const label = labelize(name);

    if (existingRow) {
        const input = existingRow.querySelector('input');
        if (input) input.value = value;
    } else {
        const row = document.createElement('tr');
        row.dataset.field = name;

        const labelCell = document.createElement('td');
        labelCell.textContent = label;

        const inputCell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = name;
        input.readOnly = true;
        input.className = 'form-control form-control-sm';
        input.value = value;

        inputCell.appendChild(input);
        row.appendChild(labelCell);
        row.appendChild(inputCell);
        tbody.appendChild(row);
    }

    function labelize(name) {
        const match = name.match(/\[([^\]]+)\]/g);
        if (!match) return name;
        const parts = match.map(s => s.replace(/[\[\]]/g, ''));
        return parts.map(capitalize).join(' → ');
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}



document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[type="checkbox"][name^="accessorials"]').forEach(checkbox => {
        checkbox.addEventListener('change', async () => {
            const accountId = document.getElementById('originAccount')?.value;
            if (!accountId || !checkbox.checked) return;

            const pricing = await fetchAccessorialPricing(accountId);  // <- this fetches the data
            console.log("🚚 Accessorial pricing received:", pricing);  // <- add this line here

            if (!pricing) return;

            updateAccessorialPricingFields(pricing);  // <- updates the DOM
        });
    });

});

function updateAccessorialPricingFields(pricing) {

    for (const [section, items] of Object.entries(pricing)) {
        if (typeof items !== 'object') continue;

        for (const [key, price] of Object.entries(items)) {
            const checkbox = document.querySelector(`input[name="accessorials[${section}][${key}]"]`);

            if (checkbox?.checked) {
                updateOrCreateField(`accessorialPricing[${section}][${key}]`, price);
            } else {
                updateOrCreateField(`accessorialPricing[${section}][${key}]`, 0);
            }
        }
    }
}


// Update the location change event listeners
if (originLocation) {
    originLocation.addEventListener('change', async () => {
        await calcDistanceIfReady();
        await populateAddressFields();
        await fetchAndStoreLocationContact(originAccount.value, originLocation.value, 'shipperContact');
        // Display logic remains the same
        await fetchAndDisplayLocationContact(originAccount.value, originLocation.value, 'originContactDisplay');
    });
}

if (destLocation) {
    destLocation.addEventListener('change', async () => {
        await calcDistanceIfReady();
        await populateAddressFields();
        await fetchAndStoreLocationContact(destAccount.value, destLocation.value, 'consigneeContact');
        // Display logic remains the same
        await fetchAndDisplayLocationContact(destAccount.value, destLocation.value, 'destContactDisplay');
    });
}

// Update the form submission handler
document.getElementById("newShipmentForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const shipmentValue = parseFloat(get('shipmentValue'));
    if (isNaN(shipmentValue)) delete shipmentData.shipmentValue;

    // Grab values - now includes consigneeContact
    const data = {
        shipmentType: form.shipmentType.value,
        status: form.status.value,
        pickupDate: form.pickupDate.value,
        deliveryDate: form.deliveryDate.value,
        origin: {
            address: form.originAddress.value,
            city: form.originCity.value,
            state: form.originState.value,
        },
        destination: {
            address: form.destinationAddress.value,
            city: form.destinationCity.value,
            state: form.destinationState.value,
        },
        equipmentType: form.equipmentType.value,
        commodity: form.commodity.value,
        distance: parseFloat(form.distance.value),
        quantity: parseInt(form.quantity.value) || undefined,
        weight: parseFloat(form.weight.value) || undefined,
        pallets: parseInt(form.pallets.value) || undefined,
        hazmatClass: form.hazmatClass.value,
        temperatureControl: form.temperatureControl.value === "true",

        baseRate: {
            amount: parseFloat(form.rateAmount.value),
            currency: form.currency.value,
        },
        ratePerMile: parseFloat(form.ratePerMile.value) || 0,
        reservePrice: parseFloat(form.reservePrice.value) || 0,
        biddingEnabled: form.biddingEnabled.value === "true",
        shipmentValue,
        shipperContact: {
            name: form.shipperContactName.value || form.querySelector('input[name="shipperContact[name]"]')?.value || '',
            phone: form.shipperContactPhone.value || form.querySelector('input[name="shipperContact[phone]"]')?.value || '',
            email: form.shipperContactEmail.value || form.querySelector('input[name="shipperContact[email]"]')?.value || '',
        },
        consigneeContact: {
            name: form.querySelector('input[name="consigneeContact[name]"]')?.value || '',
            phone: form.querySelector('input[name="consigneeContact[phone]"]')?.value || '',
            email: form.querySelector('input[name="consigneeContact[email]"]')?.value || '',
        },
        accessorials: {
            shipment: {
                hazmat: form.querySelector('input[name="accessorials[shipment][hazmat]"]')?.checked || false,
                overdimension: form.querySelector('input[name="accessorials[shipment][overdimension]"]')?.checked || false,
                prepaidAndAdd: form.querySelector('input[name="accessorials[shipment][prepaidAndAdd]"]')?.checked || false,
                freezeProtection: form.querySelector('input[name="accessorials[shipment][freezeProtection]"]')?.checked || false
            },
            pickup: {
                inside: form.querySelector('input[name="accessorials[pickup][inside]"]')?.checked || false,
                liftgate: form.querySelector('input[name="accessorials[pickup][liftgate]"]')?.checked || false,
                limitedAccess: form.querySelector('input[name="accessorials[pickup][limitedAccess]"]')?.checked || false,
                notifyConsignee: form.querySelector('input[name="accessorials[pickup][notifyConsignee]"]')?.checked || false,
                militaryAccess: form.querySelector('input[name="accessorials[pickup][militaryAccess]"]')?.checked || false,
                residential: form.querySelector('input[name="accessorials[pickup][residential]"]')?.checked || false,
                airport: form.querySelector('input[name="accessorials[pickup][airport]"]')?.checked || false,
                groceryWarehouse: form.querySelector('input[name="accessorials[pickup][groceryWarehouse]"]')?.checked || false
            },
            delivery: {
                inside: form.querySelector('input[name="accessorials[delivery][inside]"]')?.checked || false,
                liftgate: form.querySelector('input[name="accessorials[delivery][liftgate]"]')?.checked || false,
                limitedAccess: form.querySelector('input[name="accessorials[delivery][limitedAccess]"]')?.checked || false,
                notifyConsignee: form.querySelector('input[name="accessorials[delivery][notifyConsignee]"]')?.checked || false,
                militaryAccess: form.querySelector('input[name="accessorials[delivery][militaryAccess]"]')?.checked || false,
                residential: form.querySelector('input[name="accessorials[delivery][residential]"]')?.checked || false,
                appointment: form.querySelector('input[name="accessorials[delivery][appointment]"]')?.checked || false,
                airport: form.querySelector('input[name="accessorials[delivery][airport]"]')?.checked || false,
                groceryWarehouse: form.querySelector('input[name="accessorials[delivery][groceryWarehouse]"]')?.checked || false
            },
            accessorialPricing: collectAccessorialPricing(),
        }
    };

    try {
        const res = await fetch("/shipments/newShipment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            console.error("❌ Error saving shipment:", result);
            alert("Failed to save shipment: " + (result?.error || "Unknown error"));
            return;
        }

        console.log("✅ Shipment created:", result);
        alert("Shipment created successfully!");

        // Optionally close modal + reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById("newShipmentModal"));
        modal.hide();
        form.reset();

    } catch (err) {
        console.error("❌ Network error:", err);
        alert("Error saving shipment: " + err.message);
    }
});
function collectAccessorialPricing() {
    const pricingInputs = form.querySelectorAll('input[name^="accessorialPricing"]');
    const pricing = {};

    pricingInputs.forEach(input => {
        const match = input.name.match(/^accessorialPricing\[(\w+)\]\[(\w+)\]$/);
        if (!match) return;

        const [_, section, key] = match;
        if (!pricing[section]) pricing[section] = {};
        pricing[section][key] = parseFloat(input.value) || 0;
    });

    return pricing;
}

document.addEventListener('DOMContentLoaded', function () {
    // Prevent multiple initializations
    if (window.shipmentModalInitialized) return;
    window.shipmentModalInitialized = true;

    // DOM Elements
    const form = document.getElementById('newShipmentForm');
    const modal = document.getElementById('newShipmentModal');
    const stepIndicator = document.getElementById('stepIndicator');
    const progressBar = document.getElementById('progressBar');
    const originAccount = document.getElementById('originAccount');
    const originLocation = document.getElementById('originLocation');
    const destAccount = document.getElementById('destAccount');
    const destLocation = document.getElementById('destLocation');
    const distanceField = document.getElementById('distance');

    // Early exit if critical elements missing
    if (!form || !modal) return;

    // Dynamic location management for New Account Modal
    let locationIndex = 1;

    // Global function for adding locations (shared with New Account Modal)
    if (!window.addLocation) {
        window.addLocation = function() {
            const container = document.getElementById('locationsContainer');
            if (!container) return;

            const template = document.querySelector('.location-group');
            if (!template) return;

            const newLocation = template.cloneNode(true);
            // Clear inputs and update their name attributes
            newLocation.querySelectorAll('input').forEach(inp => {
                inp.value = '';
                const name = inp.getAttribute('name');
                if (name) {
                    const updatedName = name.replace(/\[0\]/, '[' + locationIndex + ']');
                    inp.setAttribute('name', updatedName);
                }
            });
            container.appendChild(newLocation);
            locationIndex++;
        };
    }

    // Address mode toggle
    function showAddresses(mode) {
        const accountDiv = document.getElementById('accountAddresses');
        const manualDiv = document.getElementById('manualAddresses');

        if (accountDiv) accountDiv.style.display = mode === 'account' ? '' : 'none';
        if (manualDiv) manualDiv.style.display = mode === 'manual' ? '' : 'none';

        // Set required attributes based on mode
        setAddressModeRequirements(mode);
    }

    // Consolidated address mode requirements function
    function setAddressModeRequirements(mode) {
        const toggle = (id, required) => {
            const el = document.getElementById(id);
            if (el) el.required = required;
        };

        const toggleGroup = (prefix, required) => {
            ['address','city','state','zip'].forEach(f => toggle(`${prefix}-${f}`, required));
        };

        // Account/Location fields
        ['originAccount','originLocation','destAccount','destLocation'].forEach(id =>
            toggle(id, mode === 'account')
        );

        // Manual address fields
        ['origin','dest'].forEach(prefix => toggleGroup(prefix, mode === 'manual'));
    }

    // Address utilities
    function getSelectedAddressString(prefix) {
        const addressEl = document.getElementById(`${prefix}-address`);
        const cityEl = document.getElementById(`${prefix}-city`);
        const stateEl = document.getElementById(`${prefix}-state`);
        const zipEl = document.getElementById(`${prefix}-zip`);

        return [
            addressEl?.value,
            cityEl?.value,
            stateEl?.value,
            zipEl?.value
        ].filter(Boolean).join(', ');
    }

    async function getAddressStrings(mode) {
        if (mode === 'account') {
            const oA = originAccount?.value, oL = originLocation?.value;
            const dA = destAccount?.value, dL = destLocation?.value;
            if (!(oA && oL && dA && dL)) return {};

            try {
                const [oRes, dRes] = await Promise.all([
                    fetch(`/accounts/${oA}/locations/${oL}`).then(r => r.ok ? r.json() : null),
                    fetch(`/accounts/${dA}/locations/${dL}`).then(r => r.ok ? r.json() : null)
                ]);

                if (!oRes || !dRes) return {};

                return {
                    origin: `${oRes.address}, ${oRes.city}, ${oRes.state} ${oRes.zip}`,
                    destination: `${dRes.address}, ${dRes.city}, ${dRes.state} ${dRes.zip}`
                };
            } catch (err) {
                console.error('Failed to fetch account locations:', err);
                return {};
            }
        } else {
            return {
                origin: getSelectedAddressString('origin'),
                destination: getSelectedAddressString('dest')
            };
        }
    }

    // NEW: Populate address fields from account locations
    async function populateAddressFields() {
        console.log('🔍 populateAddressFields called');

        const mode = document.querySelector('input[name="addressMode"]:checked')?.value;
        console.log('📋 Address mode:', mode);

        if (mode === 'account') {
            const oA = originAccount?.value, oL = originLocation?.value;
            const dA = destAccount?.value, dL = destLocation?.value;

            console.log('🏢 Account selections:', { oA, oL, dA, dL });

            if (!(oA && oL && dA && dL)) {
                console.warn('⚠️ Missing account/location selections');
                return false;
            }

            try {
                console.log('🌐 Fetching location data...');
                const [oRes, dRes] = await Promise.all([
                    fetch(`/accounts/${oA}/locations/${oL}`).then(r => {
                        console.log('📡 Origin API response status:', r.status);
                        return r.ok ? r.json() : null;
                    }),
                    fetch(`/accounts/${dA}/locations/${dL}`).then(r => {
                        console.log('📡 Destination API response status:', r.status);
                        return r.ok ? r.json() : null;
                    })
                ]);

                console.log('📍 Origin location data:', oRes);
                console.log('📍 Destination location data:', dRes);

                if (!oRes || !dRes) {
                    console.error('❌ Failed to fetch location data');
                    return false;
                }

                // Create or update origin address fields with proper names
                updateOrCreateField('origin[address]', oRes.address || '');
                updateOrCreateField('origin[city]', oRes.city || '');
                updateOrCreateField('origin[state]', oRes.state || '');
                updateOrCreateField('origin[zipcode]', oRes.zip || oRes.zipcode || '');

                // Create or update destination address fields with proper names
                updateOrCreateField('destination[address]', dRes.address || '');
                updateOrCreateField('destination[city]', dRes.city || '');
                updateOrCreateField('destination[state]', dRes.state || '');
                updateOrCreateField('destination[zipcode]', dRes.zip || dRes.zipcode || '');

                console.log('✅ Populated address fields:', {
                    origin: {
                        address: oRes.address,
                        city: oRes.city,
                        state: oRes.state,
                        zipcode: oRes.zip || oRes.zipcode
                    },
                    destination: {
                        address: dRes.address,
                        address: dRes.address,
                        city: dRes.city,
                        state: dRes.state,
                        zipcode: dRes.zip || dRes.zipcode
                    }
                });

                return true;
            } catch (err) {
                console.error('❌ Failed to populate address fields:', err);
                console.error('❌ Error stack:', err.stack);
                return false;
            }
        }

        console.log('ℹ️ Manual mode - no address population needed');
        return true; // Manual mode doesn't need special handling
    }

    // Helper function to create or update form fields
    function updateOrCreateField(name, value) {
        console.log(`🔧 updateOrCreateField: ${name} = "${value}"`);

        let field = form.querySelector(`input[name="${name}"]`);

        if (!field) {
            // Create hidden field if it doesn't exist
            console.log(`➕ Creating new hidden field: ${name}`);
            field = document.createElement('input');
            field.type = 'hidden';
            field.name = name;
            form.appendChild(field);
        } else {
            console.log(`✏️ Updating existing field: ${name}`);
        }

        field.value = value;
        console.log(`✅ Set ${name} = "${value}"`);
    }

    // Distance calculation
    async function calcDistanceIfReady() {
        const mode = document.querySelector('input[name="addressMode"]:checked')?.value;
        if (!mode || !distanceField) return;

        const { origin, destination } = await getAddressStrings(mode);
        if (!origin || !destination || origin.length < 8 || destination.length < 8) {
            distanceField.value = '';
            return;
        }

        try {
            const res = await fetch(`/api/shipments/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
            if (!res.ok) throw new Error('Distance fetch failed');
            const data = await res.json();
            distanceField.value = data.distance.toFixed(1);

            // Trigger change event for other listeners
            distanceField.dispatchEvent(new Event('change'));
        } catch (err) {
            distanceField.value = '';
            console.error('Distance calculation failed:', err);
        }
    }

    // Load accounts and populate dropdowns
    async function loadAccounts() {
        if (!originAccount || !destAccount) return;

        // Set loading state
        originAccount.innerHTML = '<option>Loading…</option>';
        destAccount.innerHTML = '<option>Loading…</option>';

        try {
            const res = await fetch('/accounts');
            if (!res.ok) throw new Error('Failed to fetch accounts');

            const accounts = await res.json();
            const options = accounts.length ?
                `<option value="">Choose Account…</option>` +
                accounts.map(a => `<option value="${a._id}">${a.accountName}</option>`).join('')
                : `<option value="">No accounts found</option>`;

            originAccount.innerHTML = options;
            destAccount.innerHTML = options;
        } catch (e) {
            console.error('Failed loading accounts:', e);
            originAccount.innerHTML = `<option value="">Failed to load accounts</option>`;
            destAccount.innerHTML = `<option value="">Failed to load accounts</option>`;
        }

        // Reset location dropdowns
        if (originLocation) originLocation.innerHTML = `<option value="">Select an account first</option>`;
        if (destLocation) destLocation.innerHTML = `<option value="">Select an account first</option>`;
    }

    // Load locations for selected account
    async function loadLocationsForAccount(accountId, locationSelect) {
        if (!locationSelect) return;

        locationSelect.innerHTML = '<option>Loading…</option>';

        if (!accountId) {
            locationSelect.innerHTML = '<option value="">Select an account first</option>';
            calcDistanceIfReady();
            return;
        }

        try {
            const res = await fetch(`/accounts/${accountId}/locations`);
            if (!res.ok) throw new Error('Failed to fetch locations');

            const locs = await res.json();
            locationSelect.innerHTML = locs.length
                ? `<option value="">Choose Location…</option>` +
                locs.map(l => `<option value="${l._id}">${l.name} - ${l.address}, ${l.city}, ${l.state}</option>`).join('')
                : '<option value="">No locations found</option>';
        } catch (err) {
            console.error('Failed to load locations:', err);
            locationSelect.innerHTML = '<option value="">Failed to load locations</option>';
        }

        calcDistanceIfReady();
    }
    async function fetchAndStoreLocationContact(accountId, locationId, contactType) {
        if (!accountId || !locationId) return null;

        try {
            const res = await fetch(`/accounts/${accountId}/locations/${locationId}/locationContact`);
            if (!res.ok) throw new Error('Failed to fetch location contact');
            const contact = await res.json();

            // Store the contact in hidden form fields
            if (contact) {
                updateOrCreateField(`${contactType}[name]`, contact.name || '');
                updateOrCreateField(`${contactType}[phone]`, contact.phoneNumber || '');
                updateOrCreateField(`${contactType}[email]`, contact.email || '');
            }

            return contact;
        } catch (err) {
            console.error('Error fetching location contact:', err);
            return null;
        }
    }

    async function fetchAndDisplayLocationContact(accountId, locationId, contactType) {
        if (!accountId || !locationId) return;

        try {
            const contact = await fetchAndStoreLocationContact(accountId, locationId, contactType);
            const displayEl = document.getElementById(`${contactType}Display`);

            if (displayEl) {
                // Create a container with both display and hidden form fields
                displayEl.innerHTML = `
                <div class="contact-display">
                    <strong>Contact:</strong><br>
                    ${contact?.name || 'Not specified'}<br>
                    ${contact?.phoneNumber || 'Not specified'}<br>
                    ${contact?.email || 'Not specified'}
                </div>
                <input type="hidden" name="${contactType}[name]" value="${contact?.name || ''}">
                <input type="hidden" name="${contactType}[phone]" value="${contact?.phoneNumber || ''}">
                <input type="hidden" name="${contactType}[email]" value="${contact?.email || ''}">
            `;
            }
        } catch (err) {
            console.error('Error displaying location contact:', err);
            const displayEl = document.getElementById(`${contactType}Display`);
            if (displayEl) {
                displayEl.innerHTML = `
                <em>Failed to load contact info.</em>
                <input type="hidden" name="${contactType}[name]" value="">
                <input type="hidden" name="${contactType}[phone]" value="">
                <input type="hidden" name="${contactType}[email]" value="">
            `;
            }
        }
    }
    if (originLocation) {
        originLocation.addEventListener('change', async () => {
            await calcDistanceIfReady();
            await populateAddressFields();
            await fetchAndDisplayLocationContact(
                originAccount.value,
                originLocation.value,
                'shipperContact'
            );
        });
    }

    if (destLocation) {
        destLocation.addEventListener('change', async () => {
            await calcDistanceIfReady();
            await populateAddressFields();
            await fetchAndDisplayLocationContact(
                destAccount.value,
                destLocation.value,
                'consigneeContact'
            );
        });
    }
    // Autocomplete functionality
    // Autocomplete functionality
    function setupAutocomplete(input) {
        // Prevent duplicate listeners
        if (input._autocompleteInitialized) return;
        input._autocompleteInitialized = true;

        const grp = input.dataset.group;
        if (!grp) return;

        const listEl = document.getElementById(grp + '-list');
        if (!listEl) return;

        // Style the suggestions container
        listEl.style.cssText = `
        position: absolute;
        z-index: 1000;
        width: 100%;
        max-height: 300px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        margin-top: 2px;
        display: none;
    `;

        let suggestions = [], active = -1;

        input.addEventListener('input', () => {
            clearTimeout(input._timer);
            if (input.value.trim().length < 3) {
                listEl.style.display = 'none';
                return;
            }
            input._timer = setTimeout(fetchSuggestions, 300);
        });

        input.addEventListener('focus', () => {
            if (suggestions.length > 0) {
                listEl.style.display = 'block';
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                listEl.style.display = 'none';
            }, 200);
        });

        input.addEventListener('keydown', e => {
            const items = listEl.querySelectorAll('.suggestion-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                active = Math.min(active + 1, items.length - 1);
                highlight();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                active = Math.max(active - 1, 0);
                highlight();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (active > -1) pick(items[active]);
            }

            function highlight() {
                items.forEach(i => i.classList.remove('active'));
                items[active]?.classList.add('active');
                items[active]?.scrollIntoView({ block: 'nearest' });
            }
        });

        listEl.addEventListener('click', e => {
            const item = e.target.closest('.suggestion-item');
            if (item) pick(item);
        });

        async function fetchSuggestions() {
            try {
                const res = await fetch(`/api/address/autocomplete?input=${encodeURIComponent(input.value)}`);
                if (!res.ok) throw new Error('Autocomplete fetch failed');

                suggestions = await res.json();
                active = -1;

                if (suggestions.length > 0) {
                    listEl.innerHTML = suggestions
                        .map((p, i) => `
                        <div class="suggestion-item" data-idx="${i}">
                            <div class="suggestion-main">${p.description}</div>
                            ${p.secondary_text ? `<div class="suggestion-secondary">${p.secondary_text}</div>` : ''}
                        </div>
                    `)
                        .join('');
                    listEl.style.display = 'block';

                    // Add hover styles
                    const items = listEl.querySelectorAll('.suggestion-item');
                    items.forEach(item => {
                        item.style.cssText = `
                        padding: 8px 12px;
                        cursor: pointer;
                        border-bottom: 1px solid #eee;
                    `;
                        item.addEventListener('mouseenter', () => {
                            item.style.backgroundColor = '#f5f5f5';
                        });
                        item.addEventListener('mouseleave', () => {
                            item.style.backgroundColor = '';
                        });
                    });
                } else {
                    listEl.style.display = 'none';
                }
            } catch (err) {
                console.error('Autocomplete fetch failed:', err);
                listEl.style.display = 'none';
            }
        }

        async function pick(item) {
            const idx = +item.dataset.idx;
            const choice = suggestions[idx];
            input.value = choice.description;
            listEl.style.display = 'none';

            const placeId = choice.place_id || choice.placeId;
            if (!placeId) {
                console.error('❌ Missing place_id in choice:', choice);
                return;
            }

            try {
                const resp = await fetch(`/api/address/details?placeId=${placeId}`);
                if (!resp.ok) throw new Error('Address details fetch failed');

                const comps = await resp.json();
                fillFields(grp, comps, choice.description);
                calcDistanceIfReady();
            } catch (err) {
                console.error('Address details fetch failed:', err);
            }
        }

        function fillFields(grp, comps, desc) {
            const addressEl = document.getElementById(`${grp}-address`);
            const cityEl = document.getElementById(`${grp}-city`);
            const stateEl = document.getElementById(`${grp}-state`);
            const zipEl = document.getElementById(`${grp}-zip`);
            const countryEl = document.getElementById(`${grp}-country`);

            if (addressEl) addressEl.value = desc || comps.street || '';
            if (cityEl) cityEl.value = comps.city || '';
            if (stateEl) stateEl.value = comps.state || '';
            if (zipEl) zipEl.value = comps.zip || '';
            if (countryEl) countryEl.value = comps.country || '';
        }
    }

    // Event listeners setup
    function setupEventListeners() {
        // Address input listeners for distance calculation


        // Account dropdown change listeners
        if (originAccount) {
            originAccount.addEventListener('change', function() {
                loadLocationsForAccount(this.value, originLocation);
            });
        }

        if (destAccount) {
            destAccount.addEventListener('change', function() {
                loadLocationsForAccount(this.value, destLocation);
            });
        }

        // Location select triggers - NOW WITH ADDRESS POPULATION
        [originLocation, destLocation].forEach(el => {
            if (el) {
                el.addEventListener('change', async () => {
                    await calcDistanceIfReady();
                    // Populate address fields whenever location changes
                    await populateAddressFields();
                });
            }
        });

        // Mode switch listeners
        const accountModeEl = document.getElementById('addressMode-account');
        const manualModeEl = document.getElementById('addressMode-manual');

        if (accountModeEl) {
            accountModeEl.addEventListener('change', () => {
                if (accountModeEl.checked) {
                    showAddresses('account');
                    if (distanceField) distanceField.value = '';
                    calcDistanceIfReady();
                }
            });
        }

        if (manualModeEl) {
            manualModeEl.addEventListener('change', () => {
                if (manualModeEl.checked) {
                    showAddresses('manual');
                    if (distanceField) distanceField.value = '';
                    calcDistanceIfReady();
                }
            });
        }
    }

    // Stepper functionality
    function setupStepper() {
        const sections = Array.from(form.querySelectorAll('fieldset'));
        if (sections.length === 0) return;

        let currentStep = 0;

        function showSection(i) {
            if (i < 0 || i >= sections.length) return;
            sections[currentStep].style.display = 'none';
            currentStep = i;
            sections[currentStep].style.display = '';
            if (stepIndicator) stepIndicator.textContent = (currentStep + 1);
            if (progressBar) progressBar.style.width = `${100 * (currentStep + 1) / sections.length}%`;
        }

        sections.forEach((fs, i) => {
            fs.style.display = 'none';

            // Remove existing step buttons to prevent duplicates
            const existingNav = fs.querySelector('.step-buttons');
            if (existingNav) existingNav.remove();

            const nav = document.createElement('div');
            nav.className = 'step-buttons';

            // Back button (only if not first step)
            if (i > 0) {
                const back = document.createElement('button');
                back.type = 'button';
                back.textContent = 'Back';
                back.className = 'btn btn-outline-secondary me-2';
                back.addEventListener('click', () => showSection(i - 1));
                nav.appendChild(back);
            }

            // Next/Submit button

        });

        showSection(0);
    }

    // Form submission with conflict prevention
    if (form && !form._submitHandlerAttached) {
        form._submitHandlerAttached = true;
        form.addEventListener('submit', async e => {
            e.preventDefault();

            console.log('🚀 Form submission started...');

            // CRITICAL: Populate address fields before creating FormData
            const addressPopulated = await populateAddressFields();
            if (!addressPopulated) {
                console.error('❌ Failed to populate address fields');
                alert('Unable to retrieve address information. Please check your selections.');
                return;
            }

            // Create FormData AFTER populating hidden fields
            const fd = new FormData(form);

            // Debug FormData
            console.group('📦 New Shipment FormData');
            for (let [key, val] of fd.entries()) {
                console.log(key, ':', val);
            }
            console.groupEnd();

            // Submit form
            const body = new URLSearchParams(fd);
            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });

                if (!res.ok) throw await res.json();
                const data = await res.json();

                form.innerHTML = `
                    <div class="p-4 text-center">
                        <h4>Shipment Created!</h4>
                        <p><strong>${data.shipmentNumber}</strong> saved.</p>
                        <button class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                    </div>`;
            } catch (err) {
                const msg = err.error || 'Error saving shipment';
                let alert = form.querySelector('.alert-danger');
                if (!alert) {
                    form.insertAdjacentHTML('afterbegin', `<div class="alert alert-danger">${msg}</div>`);
                } else {
                    alert.textContent = msg;
                }
            }
        });
    }

    // Modal show event with conflict prevention
    if (modal && !modal._showHandlerAttached) {
        modal._showHandlerAttached = true;
        modal.addEventListener('shown.bs.modal', () => {
            const mode = document.querySelector('input[name="addressMode"]:checked')?.value || 'account';
            showAddresses(mode);
            loadAccounts();
            document.querySelectorAll('.address-input').forEach(setupAutocomplete);
        });
    }

    // Initialize components
    setupEventListeners();
    setupStepper();

    // Set initial address mode if modal is already visible
    const initialMode = document.querySelector('input[name="addressMode"]:checked')?.value;
    if (initialMode) {
        showAddresses(initialMode);
    }

});
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newShipmentForm');
    const sections = Array.from(form.querySelectorAll('fieldset'));
    const stepNavContainer = document.getElementById('stepNavContainer');
    let currentStep = 0;

    function renderFooterButtons() {
        stepNavContainer.innerHTML = '';

        if (currentStep > 0) {
            const backBtn = document.createElement('button');
            backBtn.type = 'button';
            backBtn.className = 'btn btn-outline-secondary';
            backBtn.style.marginRight = '15px'
            backBtn.textContent = 'Back';
            backBtn.onclick = () => showSection(currentStep - 1);
            stepNavContainer.appendChild(backBtn);
        }

        if (currentStep < sections.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-primary ms-auto';
            nextBtn.textContent = 'Next';
            nextBtn.onclick = () => {
                if (sections[currentStep].checkValidity()) {
                    form.classList.remove('was-validated');
                    showSection(currentStep + 1);
                } else {
                    form.classList.add('was-validated');
                }
            };
            stepNavContainer.appendChild(nextBtn);
        } else {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-outline-secondary';
            cancelBtn.setAttribute('data-bs-dismiss', 'modal');
            cancelBtn.textContent = 'Cancel';

            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.className = 'btn btn-primary ms-auto';
            submitBtn.textContent = 'Create Shipment';

            stepNavContainer.appendChild(cancelBtn);
            stepNavContainer.appendChild(submitBtn);
        }
    }

    function showSection(index) {
        sections.forEach((s, i) => {
            s.style.display = i === index ? '' : 'none';
        });
        currentStep = index;
        renderFooterButtons();
        document.getElementById('stepIndicator').textContent = index + 1;
        document.getElementById('progressBar').style.width = ((index + 1) / sections.length) * 100 + '%';
    }

    showSection(0); // Initialize
});