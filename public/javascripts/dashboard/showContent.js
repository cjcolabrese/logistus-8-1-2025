function showContent(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => {
        sec.style.display = 'none';
    });

    // Show the one we want
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
    }
}

// OPTIONAL: On initial load, show the dashboard by default
document.addEventListener('DOMContentLoaded', () => {
    showContent('dashboardContent');
});