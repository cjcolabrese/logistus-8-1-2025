document.addEventListener('DOMContentLoaded', () => {
    const bookButton = document.getElementById('bookButton');
    const modal = document.getElementById('shipmentDetailsModal');
    const modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);

    // Create toast container (centered)
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-50 start-50 translate-middle';
    toastContainer.style.zIndex = '1100';
    document.body.appendChild(toastContainer);

    // Create loading overlay (now properly managed)
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'bookingOverlay'; // Add ID for easy reference
    loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center d-none';
    loadingOverlay.style.zIndex = '1090';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.pointerEvents = 'none'; // Allow clicks to pass through
    document.body.appendChild(loadingOverlay);

    function showToast(message, isSuccess) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast show align-items-center text-white bg-${isSuccess ? 'success' : 'danger'}`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.innerHTML = '';
        toastContainer.appendChild(toastEl);

        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        }, 5000);
    }

    function showLoadingMessage(shipmentNumber) {
        const origin = document.getElementById('modal-origin')?.textContent || 'Unknown origin';
        const destination = document.getElementById('modal-destination')?.textContent || 'Unknown destination';

        loadingOverlay.innerHTML = `
            <div class="text-center text-white" style="pointer-events: auto;">
                <div class="spinner-border mb-3" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4 class="mb-1">Booking Shipment #${shipmentNumber}</h4>
                <p class="mb-0">${origin} → ${destination}</p>
            </div>
        `;
        loadingOverlay.classList.remove('d-none');
    }

    function hideLoadingMessage() {
        const overlay = document.getElementById('bookingOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
        }
    }

    // Ensure loading overlay is hidden when modal closes
    modal.addEventListener('hidden.bs.modal', hideLoadingMessage);

    bookButton.addEventListener('click', async () => {
        const shipmentNumber = document.getElementById('modal-shipment-number')?.textContent?.trim();

        if (!shipmentNumber) {
            showToast('Shipment number is missing', false);
            return;
        }

        try {
            // Show loading state
            showLoadingMessage(shipmentNumber);
            const originalText = bookButton.innerHTML;
            bookButton.disabled = true;
            bookButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Booking...
            `;

            const response = await fetch(`/api/shipments/${encodeURIComponent(shipmentNumber)}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Booking failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Shipment booked:', result);

            // Update status badge if exists
            const statusBadge = document.getElementById('modal-status');
            if (statusBadge) {
                statusBadge.textContent = 'Booked';
                statusBadge.className = 'badge bg-success';
            }

            showToast('Shipment successfully booked!', true);

            // Close the modal after successful booking
            modalInstance.hide();

        } catch (error) {
            console.error('Error booking shipment:', error);
            showToast(error.message || 'Error booking shipment. Please try again.', false);
        } finally {
            hideLoadingMessage();
            // Restore button state
            if (bookButton) {
                bookButton.disabled = false;
                bookButton.innerHTML = 'Book';
            }
        }
    });
});