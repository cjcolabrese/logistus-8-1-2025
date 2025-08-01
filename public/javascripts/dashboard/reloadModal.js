// Listen for *any* Bootstrap modal being fully hidden
document.addEventListener('hidden.bs.modal', function () {
    // Force cleanup in case Bootstrap bails mid-flight
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Remove lingering backdrop(s)
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

    // Refresh the page
    location.reload();
});