document.addEventListener('DOMContentLoaded', function() {
    // Get all the filter elements
    const searchFilter = document.getElementById('search-filter');
    const statusFilter = document.getElementById('status-filter');
    const equipmentFilter = document.getElementById('equipment-filter');
    const dateFromFilter = document.getElementById('date-from-filter');
    const dateToFilter = document.getElementById('date-to-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const quickFilters = document.querySelectorAll('.quick-filter');
    const shipmentRows = document.querySelectorAll('.shipment-row');
    const visibleCount = document.getElementById('visible-count');
    const totalCount = document.getElementById('total-count');
    const shipmentCount = document.getElementById('shipment-count');

    // Function to apply all filters
    function applyFilters() {
        const searchText = searchFilter.value.toLowerCase();
        const statusValue = statusFilter.value;
        const equipmentValue = equipmentFilter.value;
        const dateFromValue = dateFromFilter.value;
        const dateToValue = dateToFilter.value;

        let visibleRows = 0;

        shipmentRows.forEach(row => {
            const shipmentNumber = row.dataset.shipmentNumber.toLowerCase();
            const origin = row.dataset.origin.toLowerCase();
            const destination = row.dataset.destination.toLowerCase();
            const status = row.dataset.status;
            const equipment = row.dataset.equipment;
            const pickupDate = row.dataset.pickup;
            const formattedPickupDate = new Date(pickupDate).toISOString().split('T')[0];

            // Check if row matches all filters
            const matchesSearch = searchText === '' ||
                shipmentNumber.includes(searchText) ||
                origin.includes(searchText) ||
                destination.includes(searchText);

            const matchesStatus = statusValue === '' || status === statusValue;
            const matchesEquipment = equipmentValue === '' || equipment === equipmentValue;

            let matchesDate = true;
            if (dateFromValue) {
                matchesDate = matchesDate && formattedPickupDate >= dateFromValue;
            }
            if (dateToValue) {
                matchesDate = matchesDate && formattedPickupDate <= dateToValue;
            }

            if (matchesSearch && matchesStatus && matchesEquipment && matchesDate) {
                row.style.display = '';
                visibleRows++;
            } else {
                row.style.display = 'none';
            }
        });

        // Update counts
        visibleCount.textContent = visibleRows;
        shipmentCount.textContent = `${visibleRows} total`;
    }

    // Event listeners for filters
    searchFilter.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    equipmentFilter.addEventListener('change', applyFilters);
    dateFromFilter.addEventListener('change', applyFilters);
    dateToFilter.addEventListener('change', applyFilters);

    // Clear all filters
    clearFiltersBtn.addEventListener('click', function() {
        searchFilter.value = '';
        statusFilter.value = '';
        equipmentFilter.value = '';
        dateFromFilter.value = '';
        dateToFilter.value = '';
        applyFilters();
    });

    // Quick filters
    quickFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;

            // Clear other filters first
            if (filterType !== 'status') statusFilter.value = '';
            if (filterType !== 'equipment') equipmentFilter.value = '';
            if (filterType !== 'date') {
                dateFromFilter.value = '';
                dateToFilter.value = '';
            }

            // Apply the quick filter
            if (filterType === 'status') {
                statusFilter.value = filterValue;
            } else if (filterType === 'equipment') {
                equipmentFilter.value = filterValue;
            } else if (filterType === 'date') {
                const today = new Date();
                const formattedToday = today.toISOString().split('T')[0];

                if (filterValue === 'today') {
                    dateFromFilter.value = formattedToday;
                    dateToFilter.value = formattedToday;
                } else if (filterValue === 'week') {
                    const dayOfWeek = today.getDay();
                    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is Sunday
                    const monday = new Date(today.setDate(diff));
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);

                    dateFromFilter.value = monday.toISOString().split('T')[0];
                    dateToFilter.value = sunday.toISOString().split('T')[0];
                }
            }

            applyFilters();
        });
    });

    // Initialize counts
    if (shipmentRows.length > 0) {
        visibleCount.textContent = shipmentRows.length;
        totalCount.textContent = shipmentRows.length;
        shipmentCount.textContent = `${shipmentRows.length} total`;
    }

    // Sorting functionality
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.dataset.sort;
            const isAscending = !this.classList.contains('asc');

            // Reset all sort icons and classes
            sortableHeaders.forEach(h => {
                h.classList.remove('asc', 'desc');
                const icon = h.querySelector('.sort-icon');
                if (icon) icon.textContent = 'unfold_more';
            });

            // Set current sort direction
            this.classList.add(isAscending ? 'asc' : 'desc');
            const icon = this.querySelector('.sort-icon');
            if (icon) icon.textContent = isAscending ? 'expand_less' : 'expand_more';

            // Sort the rows
            const tbody = document.getElementById('shipments-tbody');
            const rows = Array.from(tbody.querySelectorAll('.shipment-row'));

            rows.sort((a, b) => {
                const aValue = a.dataset[sortField] || '';
                const bValue = b.dataset[sortField] || '';

                // Special handling for dates and numbers
                if (sortField.includes('Date')) {
                    const aDate = new Date(aValue);
                    const bDate = new Date(bValue);
                    return isAscending ? aDate - bDate : bDate - aDate;
                } else if (sortField === 'rate' || sortField === 'distance' || sortField === 'weight') {
                    const aNum = parseFloat(aValue) || 0;
                    const bNum = parseFloat(bValue) || 0;
                    return isAscending ? aNum - bNum : bNum - aNum;
                } else {
                    // Default string comparison
                    return isAscending
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
            });

            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        });
    });
    document.getElementById('export-filtered').addEventListener('click', function() {
        exportToCSV();
    });

    function exportToCSV() {
        // Get all visible rows after filtering
        const visibleRows = Array.from(document.querySelectorAll('.shipment-row')).filter(row =>
            row.style.display !== 'none'
        );

        if (visibleRows.length === 0) {
            alert('No data to export!');
            return;
        }

        // CSV headers
        const headers = [
            'Shipment #',
            'Origin',
            'Origin Address',
            'Destination',
            'Destination Address',
            'Distance (mi)',
            'Pickup Date',
            'Delivery Date',
            'Rate ($)',
            'Rate per Mile ($/mi)',
            'Equipment',
            'Weight (lbs)',
            'Status'
        ];

        // Process each row into CSV data
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        visibleRows.forEach(row => {
            const cells = [
                `"${row.dataset.shipmentNumber}"`,
                `"${row.dataset.origin}"`,
                `"${row.querySelector('td:nth-child(2) small').textContent}"`,
                `"${row.dataset.destination}"`,
                `"${row.querySelector('td:nth-child(3) small').textContent}"`,
                row.dataset.distance,
                `"${row.querySelector('td:nth-child(5) .fw-medium').textContent}"`,
                `"${row.querySelector('td:nth-child(6) .fw-medium').textContent}"`,
                row.dataset.rate || 'N/A',
                row.querySelector('td:nth-child(7) small')?.textContent.replace('$', '').replace('/mi', '') || 'N/A',
                `"${row.dataset.equipment}"`,
                row.dataset.weight,
                `"${row.dataset.status}"`
            ];

            csvRows.push(cells.join(','));
        });

        // Create CSV content
        const csvContent = csvRows.join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `shipments_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper function to escape CSV values (handles quotes and commas)
    function escapeCSV(value) {
        if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
});
