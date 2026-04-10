/**
 * ADMIN NOC MANAGEMENT (API VERSION)
 * Handles pending companies and NOC requests with backend API
 */

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    const currentUser = portalUtils.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        portalUtils.showNotification('Access denied. Admin privileges required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // Set user name
    document.getElementById('userName').textContent = currentUser.name;

    // Load data
    await loadPendingCompanies();
    await loadPendingNOCs();

    /**
     * Load pending companies from API
     */
    async function loadPendingCompanies() {
        const container = document.getElementById('pendingCompaniesContainer');

        try {
            const response = await apiService.getPendingCompanies();

            if (response.success && response.companies.length > 0) {
                container.innerHTML = '';

                response.companies.forEach(company => {
                    const companyCard = createCompanyCard(company);
                    container.appendChild(companyCard);
                });
            } else {
                container.innerHTML = '<p class="no-data">No pending companies</p>';
            }
        } catch (error) {
            console.error('Error loading pending companies:', error);
            container.innerHTML = '<p class="error-message">Error loading companies. Please refresh.</p>';
        }
    }

    /**
     * Load pending NOC requests from API
     */
    async function loadPendingNOCs() {
        const container = document.getElementById('pendingNOCsContainer');

        try {
            const response = await apiService.getPendingNOCs();

            if (response.success && response.requests.length > 0) {
                container.innerHTML = '';

                response.requests.forEach(noc => {
                    const nocCard = createNOCCard(noc);
                    container.appendChild(nocCard);
                });
            } else {
                container.innerHTML = '<p class="no-data">No pending NOC requests</p>';
            }
        } catch (error) {
            console.error('Error loading pending NOCs:', error);
            container.innerHTML = '<p class="error-message">Error loading NOC requests. Please refresh.</p>';
        }
    }

    /**
     * Create company card element
     */
    function createCompanyCard(company) {
        const card = document.createElement('div');
        card.className = 'company-card';
        card.innerHTML = `
            <div class="company-header">
                <h4>${company.name}</h4>
                <span class="badge badge-warning">Pending</span>
            </div>
            <div class="company-details">
                <p><strong>Location:</strong> ${company.location}</p>
                <p><strong>Website:</strong> ${company.website || 'N/A'}</p>
                <p><strong>Address:</strong> ${company.address}</p>
                <p><strong>HR Name:</strong> ${company.hrName || company.hr_name}</p>
                <p><strong>HR Email:</strong> ${company.hrEmail || company.hr_email}</p>
                <p><strong>HR Phone:</strong> ${company.hrPhone || company.hr_phone}</p>
                <p><strong>Employees:</strong> ${company.numEmployees || company.num_employees || 'N/A'}</p>
                <p><strong>Technologies:</strong> ${company.technologies || 'N/A'}</p>
            </div>
            <div class="company-actions">
                <button class="btn btn-success btn-sm" onclick="approveCompany(${company.id})">
                    ✓ Approve
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejectCompany(${company.id})">
                    ✗ Reject
                </button>
            </div>
        `;
        return card;
    }

    /**
     * Create NOC card element
     */
    function createNOCCard(noc) {
        const card = document.createElement('div');
        card.className = 'noc-card';

        const statusBadge = noc.status === 'submitted' ? 'badge-info' : 'badge-warning';
        const companyName = noc.company?.name || 'Unknown Company';
        const studentName = noc.student?.name || noc.studentName;

        card.innerHTML = `
            <div class="noc-header">
                <h4>NOC-${noc.nocId || noc.id}</h4>
                <span class="badge ${statusBadge}">${noc.status}</span>
            </div>
            <div class="noc-details">
                <p><strong>Student:</strong> ${studentName}</p>
                <p><strong>Email:</strong> ${noc.studentEmail}</p>
                <p><strong>Semester:</strong> ${noc.semester}th</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Duration:</strong> ${formatDate(noc.startDate)} to ${formatDate(noc.endDate)}</p>
                <p><strong>Submitted:</strong> ${formatDate(noc.createdAt || noc.submittedAt)}</p>
            </div>
            <div class="noc-actions">
                <button class="btn btn-primary btn-sm" onclick="viewNOCDetails(${noc.id})">
                    View Details
                </button>
            </div>
        `;
        return card;
    }

    /**
     * Format date for display
     */
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    /**
     * Approve company
     */
    window.approveCompany = async function (companyId) {
        if (!confirm('Are you sure you want to approve this company?')) {
            return;
        }

        try {
            const response = await apiService.approveCompany(companyId);

            if (response.success) {
                portalUtils.showNotification('Company approved successfully', 'success');
                await loadPendingCompanies();
            } else {
                portalUtils.showNotification(response.message || 'Failed to approve company', 'error');
            }
        } catch (error) {
            console.error('Error approving company:', error);
            portalUtils.showNotification('Error approving company', 'error');
        }
    };

    /**
     * Reject company
     */
    window.rejectCompany = async function (companyId) {
        const reason = prompt('Please enter rejection reason:');
        if (!reason) return;

        try {
            // Note: Need to add reject endpoint to backend
            portalUtils.showNotification('Company rejection functionality coming soon', 'info');
        } catch (error) {
            console.error('Error rejecting company:', error);
            portalUtils.showNotification('Error rejecting company', 'error');
        }
    };

    /**
     * View NOC details
     */
    window.viewNOCDetails = function (nocId) {
        // Redirect to faculty review panel or show modal
        window.location.href = `faculty-noc-review.html?nocId=${nocId}`;
    };

    // Refresh button handlers
    document.getElementById('refreshCompanies')?.addEventListener('click', loadPendingCompanies);
    document.getElementById('refreshNOCs')?.addEventListener('click', loadPendingNOCs);
});
