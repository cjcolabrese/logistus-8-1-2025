const accessorials = {
    shipment: {
        hazmat: true,
        overdimension: false,
        prepaidAndAdd: true,
        freezeProtection: false,
    },
    pickup: {
        inside: true,
        liftgate: false,
        limitedAccess: true,
        notifyConsignee: false,
        militaryAccess: false,
        residential: true,
        airport: false,
        groceryWarehouse: false,
    },
    delivery: {
        inside: false,
        liftgate: true,
        limitedAccess: false,
        notifyConsignee: true,
        militaryAccess: false,
        residential: true,
        appointment: true,
        airport: false,
        groceryWarehouse: true,
    }
};

function updateAccessorialCheckboxes(accessorials) {
    for (const category in accessorials) {
        for (const key in accessorials[category]) {
            const value = accessorials[category][key];
            const selector = `[data-editable="accessorials.${category}.${key}"]`;
            const checkbox = document.querySelector(selector);
            if (checkbox) {
                checkbox.checked = !!value;
            }
        }
    }
}

// Run this when modal loads or data changes
document.addEventListener('DOMContentLoaded', () => {
    updateAccessorialCheckboxes(accessorials);
});



const rawDate = shipment.origin.pickupDate;
const dateOnly = new Date(rawDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
});

document.getElementById('modal-pickup-date').textContent = dateOnly;





const accessorials = {
    shipment: {
        hazmat: true,
        overdimension: false,
        prepaidAndAdd: true,
        freezeProtection: false,
    },
    pickup: {
        inside: true,
        liftgate: false,
        limitedAccess: true,
        notifyConsignee: false,
        militaryAccess: false,
        residential: true,
        airport: false,
        groceryWarehouse: false,
    },
    delivery: {
        inside: false,
        liftgate: true,
        limitedAccess: false,
        notifyConsignee: true,
        militaryAccess: false,
        residential: true,
        appointment: true,
        airport: false,
        groceryWarehouse: true,
    }
};

function updateAccessorialCheckboxes(accessorials) {
    for (const category in accessorials) {
        for (const key in accessorials[category]) {
            const value = accessorials[category][key];
            const selector = `[data-editable="accessorials.${category}.${key}"]`;
            const checkbox = document.querySelector(selector);
            if (checkbox) {
                checkbox.checked = !!value;
            }
        }
    }
}

// Run this when modal loads or data changes
document.addEventListener('DOMContentLoaded', () => {
    updateAccessorialCheckboxes(accessorials);
});