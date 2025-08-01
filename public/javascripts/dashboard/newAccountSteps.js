let currentStep = 1;
const totalSteps = 5;

function updateStepNavigation() {
    // Update progress bar
    const progressPercentage = (currentStep / totalSteps) * 100;
    document.getElementById('formProgress').style.width = `${progressPercentage}%`;
    document.getElementById('formProgress').textContent = `Step ${currentStep} of ${totalSteps}`;

    // Update buttons
    document.getElementById('prevBtn').disabled = currentStep === 1;

    if (currentStep === totalSteps) {
        document.getElementById('nextBtn').textContent = 'Submit';
        document.getElementById('nextBtn').onclick = submitForm;
    } else {
        document.getElementById('nextBtn').textContent = 'Next';
        document.getElementById('nextBtn').onclick = nextStep;
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(el => el.classList.add('d-none'));

    // Show current step
    document.querySelector(`.step-${step}`).classList.remove('d-none');

    // Update navigation
    updateStepNavigation();
}

function nextStep() {
    if (validateStep(currentStep)) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
}

function validateStep(step) {
    // Basic validation example - expand this for each step
    if (step === 1 && !document.getElementById('accountName').value) {
        alert('Account name is required');
        return false;
    }
    return true;
}

function copyOpsToBilling() {
    if (document.getElementById('sameAsOps').checked) {
        const fieldsToCopy = [
            'FirstName', 'LastName', 'Email', 'Phone',
            'Address', 'City', 'State', 'Zip', 'Country'
        ];

        fieldsToCopy.forEach(field => {
            document.getElementById(`bill${field}`).value =
                document.getElementById(`ops${field}`).value;
        });
    }
}

function addLocationField() {
    const locationFields = document.getElementById('locationFields');
    const newIndex = locationFields.children.length;

    const newLocation = document.createElement('div');
    newLocation.className = 'location-entry card mb-3 p-3';
    newLocation.innerHTML = `
   <div class="row g-3">
     <div class="col-md-12">
       <label for="locationName${newIndex}" class="form-label">Location Name</label>
       <input type="text" class="form-control" id="locationName${newIndex}" name="locations[${newIndex}].name">
     </div>
     <div class="col-12">
       <label for="locationAddress${newIndex}" class="form-label">Address</label>
       <input type="text" class="form-control" id="locationAddress${newIndex}" name="locations[${newIndex}].address">
     </div>
     <div class="col-md-6">
       <label for="locationCity${newIndex}" class="form-label">City</label>
       <input type="text" class="form-control" id="locationCity${newIndex}" name="locations[${newIndex}].city">
     </div>
     <div class="col-md-4">
       <label for="locationState${newIndex}" class="form-label">State</label>
       <input type="text" class="form-control" id="locationState${newIndex}" name="locations[${newIndex}].state">
     </div>
     <div class="col-md-2">
       <label for="locationZip${newIndex}" class="form-label">Zip</label>
       <input type="text" class="form-control" id="locationZip${newIndex}" name="locations[${newIndex}].zip">
     </div>
     <div class="col-md-12">
       <label for="locationCountry${newIndex}" class="form-label">Country</label>
       <input type="text" class="form-control" id="locationCountry${newIndex}" name="locations[${newIndex}].country" value="USA">
     </div>
     <h6 class="mt-3">Location Contact</h6>
     <div class="col-md-6">
       <label for="locationContactName${newIndex}" class="form-label">Contact Name</label>
       <input type="text" class="form-control" id="locationContactName${newIndex}" name="locations[${newIndex}].locationContact.name">
     </div>
     <div class="col-md-6">
       <label for="locationContactEmail${newIndex}" class="form-label">Contact Email</label>
       <input type="email" class="form-control" id="locationContactEmail${newIndex}" name="locations[${newIndex}].locationContact.email">
     </div>
     <div class="col-md-6">
       <label for="locationContactPhone${newIndex}" class="form-label">Contact Phone</label>
       <input type="tel" class="form-control" id="locationContactPhone${newIndex}" name="locations[${newIndex}].locationContact.phoneNumber">
     </div>
   </div>
   `;

    locationFields.appendChild(newLocation);
}

function submitForm() {
    // Collect form data
    const formData = new FormData(document.getElementById('accountForm'));
    const data = {};

    formData.forEach((value, key) => {
        // Handle nested objects (like operationsContact.firstName)
        const keys = key.split('.');
        let current = data;

        for (let i = 0; i < keys.length; i++) {
            if (i === keys.length - 1) {
                current[keys[i]] = value;
            } else {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
        }
    });

    // Handle arrays (like locations)
    // This would need to be expanded based on your specific needs

    // Submit to server
    fetch('/api/accounts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            // Close modal on success
            const modal = bootstrap.Modal.getInstance(document.getElementById('accountCreationModal'));
            modal.hide();

            // Show success message or refresh data
            alert('Account created successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating account');
        });
}

// Initialize modal
document.addEventListener('DOMContentLoaded', function () {
    const modal = new bootstrap.Modal(document.getElementById('accountCreationModal'));

    // When modal is shown, reset form and show first step
    document.getElementById('accountCreationModal').addEventListener('show.bs.modal', function () {
        currentStep = 1;
        showStep(currentStep);
        document.getElementById('accountForm').reset();
    });
});