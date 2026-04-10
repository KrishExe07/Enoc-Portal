/**
 * FACULTY NOC REVIEW JAVASCRIPT
 * Handles faculty approval workflow for NOC requests
 */

let currentNOCId = null;
let signatureData = null;

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    const currentUser = portalUtils.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'faculty' && currentUser.role !== 'admin')) {
        portalUtils.showNotification('Access denied. Faculty/Admin privileges required.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // Set user name
    document.getElementById('userName').textContent = currentUser.name;

    // Load stats and NOC requests
    await Promise.all([loadNOCRequests(), loadStats()]);

    // Setup filter
    document.getElementById('statusFilter')?.addEventListener('change', loadNOCRequests);
});

/**
 * Load and display dashboard stats
 */
async function loadStats() {
    try {
        const response = await apiService.getStats();
        if (response.success) {
            const s = response.stats;
            const statsEl = document.getElementById('nocStatsBar');
            if (statsEl) {
                statsEl.innerHTML = `
                    <span class="stat-chip stat-pending">⏳ Pending: <strong>${s.pending}</strong></span>
                    <span class="stat-chip stat-approved">✅ Approved: <strong>${s.approved}</strong></span>
                    <span class="stat-chip stat-rejected">❌ Rejected: <strong>${s.rejected}</strong></span>
                    <span class="stat-chip stat-total">📋 Total: <strong>${s.total}</strong></span>
                    ${s.pendingCompanies > 0 ? `<span class="stat-chip stat-companies">🏢 Pending Companies: <strong>${s.pendingCompanies}</strong></span>` : ''}
                `;
            }
        }
    } catch (e) {
        console.warn('[Stats] Could not load stats:', e.message);
    }
}

/**
 * Load NOC requests from API
 */
async function loadNOCRequests() {
    const container = document.getElementById('nocRequestsContainer');
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="spinner" style="margin:0 auto 1rem;"></div><p>Loading requests...</p></div>';

    try {
        const response = await apiService.getPendingNOCs(statusFilter);

        console.log('NOC Requests Response:', response);

        if (response.success && response.requests && response.requests.length > 0) {
            const requests = response.requests;

            if (requests.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;background:#f8fafc;border-radius:12px;">
                        <div style="font-size:4rem;margin-bottom:1rem;">🎉</div>
                        <h3 style="color:#64748b;margin-bottom:0.5rem;">No ${statusFilter ? statusFilter : ''} requests found</h3>
                        <p style="color:#94a3b8;">Try changing the filter or refresh the page</p>
                        <button class="btn btn-primary" onclick="loadNOCRequests()" style="margin-top:1rem;">🔄 Refresh</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = requests.map(noc => createNOCCard(noc)).join('');
        } else {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem;background:#fef3c7;border-radius:12px;border:2px solid #fbbf24;">
                    <div style="font-size:4rem;margin-bottom:1rem;">📝</div>
                    <h3 style="color:#92400e;margin-bottom:0.5rem;">No NOC Requests Yet</h3>
                    <p style="color:#78350f;margin-bottom:1rem;">Students haven't submitted any NOC requests yet.</p>
                    <p style="color:#78350f;font-size:0.9rem;">When students submit requests, they will appear here for your review.</p>
                    <button class="btn btn-primary" onclick="loadNOCRequests()" style="margin-top:1rem;">🔄 Refresh</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading NOC requests:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;background:#fee2e2;border-radius:12px;border:2px solid #ef4444;">
                <div style="font-size:4rem;margin-bottom:1rem;">⚠️</div>
                <h3 style="color:#991b1b;margin-bottom:0.5rem;">Error Loading Requests</h3>
                <p style="color:#7f1d1d;margin-bottom:1rem;">Could not connect to the backend server.</p>
                <p style="color:#7f1d1d;font-size:0.9rem;">Please make sure the backend server is running.</p>
                <button class="btn btn-primary" onclick="loadNOCRequests()" style="margin-top:1rem;">🔄 Try Again</button>
            </div>
        `;
    }
}

/**
 * Create NOC card HTML
 */
function createNOCCard(noc) {
    const statusClass = getStatusClass(noc.status);
    const companyName = noc.company?.name || 'Unknown Company';
    const studentName = noc.student?.name || noc.studentName || 'Unknown Student';
    // enrollmentNo is stored directly on the NOC record (e.g. "24IT068")
    const studentEnrollment = noc.enrollmentNo || noc.student?.studentId || 'N/A';
    const studentDepartment = noc.student?.department || 'N/A';

    return `
        <div class="noc-card">
            <div class="noc-card-header">
                <h4>${noc.nocId || `NOC-${noc.id}`}</h4>
                <span class="badge ${statusClass}">${capitalizeFirst(noc.status)}</span>
            </div>
            <div class="noc-card-body">
                <p><strong>Student:</strong> ${studentName}</p>
                <p><strong>Enrollment No:</strong> ${studentEnrollment}</p>
                <p><strong>Department:</strong> ${studentDepartment}</p>
                <p><strong>Email:</strong> ${noc.studentEmail}</p>
                <p><strong>Semester:</strong> ${noc.semester}th</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Duration:</strong> ${formatDate(noc.startDate)} to ${formatDate(noc.endDate)}</p>
                <p><strong>Submitted:</strong> ${formatDate(noc.createdAt || noc.submittedAt)}</p>
            </div>
            <div class="noc-card-footer">
                <button class="btn btn-primary btn-sm" onclick="viewNOCDetails(${noc.id})">
                    View Details
                </button>
                ${noc.status === 'submitted' || noc.status === 'under_review' ? `
                    <button class="btn btn-success btn-sm" onclick="quickApprove(${noc.id})">
                        Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="currentNOCId=${noc.id}; showRejectForm()">
                        Reject
                    </button>
                ` : ''}
                ${noc.status === 'approved' ? `
                    <button class="btn btn-danger btn-sm" onclick="deleteApprovedNOC(${noc.id})">
                        Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Delete approved NOC request (faculty action)
 */
async function deleteApprovedNOC(nocId) {
    const confirmed = window.confirm('Delete this approved internship request? This action cannot be undone.');
    if (!confirmed) return;

    try {
        portalUtils.showNotification('Deleting approved internship request...', 'info');
        const response = await apiService.deleteNOC(nocId);

        if (response.success) {
            portalUtils.showNotification('Approved internship request deleted successfully.', 'success');
            await Promise.all([loadNOCRequests(), loadStats()]);
        } else {
            portalUtils.showNotification(response.message || 'Failed to delete internship request', 'error');
        }
    } catch (error) {
        console.error('Error deleting approved internship request:', error);
        portalUtils.showNotification('Error deleting internship request', 'error');
    }
}

/**
 * View NOC details in modal
 */
async function viewNOCDetails(nocId) {
    try {
        const response = await apiService.getNOCStatus(nocId);

        if (response.success) {
            const noc = response.request;
            currentNOCId = nocId;

            const detailsHTML = `
                <div class="noc-details">
                    <h5>Student Information</h5>
                    <div class="detail-grid">
                        <div><strong>Name:</strong> ${noc.student?.name || noc.studentName}</div>
                        <div><strong>Enrollment No:</strong> ${noc.enrollmentNo || 'N/A'}</div>
                        <div><strong>Email:</strong> ${noc.studentEmail}</div>
                        <div><strong>Semester:</strong> ${noc.semester}th</div>
                        <div><strong>Mobile:</strong> ${noc.mobile || 'N/A'}</div>
                    </div>

                    <h5>Company Information</h5>
                    <div class="detail-grid">
                        <div><strong>Company:</strong> ${noc.company?.name || 'Unknown'}</div>
                        <div><strong>Location:</strong> ${noc.company?.location || 'N/A'}</div>
                    </div>

                    <h5>Internship Details</h5>
                    <div class="detail-grid">
                        <div><strong>Start Date:</strong> ${formatDate(noc.startDate)}</div>
                        <div><strong>End Date:</strong> ${formatDate(noc.endDate)}</div>
                        <div><strong>Duration:</strong> ${calculateDuration(noc.startDate, noc.endDate)}</div>
                    </div>

                    <h5>Request Status</h5>
                    <div class="detail-grid">
                        <div><strong>Status:</strong> <span class="badge ${getStatusClass(noc.status)}">${capitalizeFirst(noc.status)}</span></div>
                        <div><strong>Submitted:</strong> ${formatDate(noc.createdAt || noc.submittedAt)}</div>
                    </div>
                </div>
            `;

            document.getElementById('nocDetailsBody').innerHTML = detailsHTML;

            // Show/hide action buttons based on status
            const approveBtn = document.getElementById('approveBtn');
            const rejectBtn = document.getElementById('rejectBtn');

            if (noc.status === 'submitted' || noc.status === 'under_review') {
                approveBtn.style.display = 'inline-block';
                rejectBtn.style.display = 'inline-block';
            } else {
                approveBtn.style.display = 'none';
                rejectBtn.style.display = 'none';
            }

            document.getElementById('nocDetailsModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading NOC details:', error);
        portalUtils.showNotification('Error loading NOC details', 'error');
    }
}

/**
 * Quick approve NOC — shows comments modal first
 */
function quickApprove(nocId) {
    currentNOCId = nocId;
    showApproveModal();
}

/**
 * Show approve modal (with optional comments)
 */
function showApproveModal() {
    const modal = document.getElementById('approveModal');
    if (modal) {
        document.getElementById('approvalComments').value = '';
        modal.style.display = 'flex';
    } else {
        // Fallback if modal not present — approve without comments
        performApprove('');
    }
}

/**
 * Close approve modal
 */
function closeApproveModal() {
    const modal = document.getElementById('approveModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Confirm approval with comments
 */
async function confirmApproveNOC() {
    const comments = document.getElementById('approvalComments')?.value?.trim() || '';
    closeApproveModal();
    await performApprove(comments);
}

/**
 * Perform the actual approve API call
 */
async function performApprove(comments) {
    if (!currentNOCId) return;
    try {
        portalUtils.showNotification('Approving NOC request...', 'info');
        const response = await apiService.approveNOC(currentNOCId, comments);
        if (response.success) {
            portalUtils.showNotification('✅ NOC request approved successfully!', 'success');
            closeModal();
            await Promise.all([loadNOCRequests(), loadStats()]);
        } else {
            portalUtils.showNotification(response.message || 'Failed to approve NOC', 'error');
        }
    } catch (error) {
        console.error('Error approving NOC:', error);
        portalUtils.showNotification('Error approving NOC', 'error');
    }
}

/**
 * Approve NOC from modal (delegates to showApproveModal)
 */
async function approveNOC() {
    if (!currentNOCId) return;
    closeModal();
    showApproveModal();
}

/**
 * Show reject modal
 */
function showRejectForm() {
    closeModal();
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectModal').style.display = 'flex';
}

/**
 * Close reject modal
 */
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
}

/**
 * Confirm and reject NOC
 */
async function confirmRejectNOC() {
    const reason = document.getElementById('rejectionReason').value.trim();
    
    if (!reason) {
        portalUtils.showNotification('Please provide a rejection reason', 'warning');
        return;
    }

    if (!currentNOCId) return;

    try {
        portalUtils.showNotification('Rejecting NOC request...', 'info');
        
        const response = await apiService.rejectNOC(currentNOCId, reason);

        if (response.success) {
            portalUtils.showNotification('NOC request rejected', 'success');
            closeRejectModal();
            await Promise.all([loadNOCRequests(), loadStats()]);
        } else {
            portalUtils.showNotification(response.message || 'Failed to reject NOC', 'error');
        }
    } catch (error) {
        console.error('Error rejecting NOC:', error);
        portalUtils.showNotification('Error rejecting NOC', 'error');
    }
}

/**
 * Reject NOC (legacy function)
 */
async function rejectNOC(reason) {
    try {
        const response = await apiService.rejectNOC(currentNOCId, reason);

        if (response.success) {
            portalUtils.showNotification('NOC request rejected', 'success');
            closeModal();
            await loadNOCRequests();
        } else {
            portalUtils.showNotification(response.message || 'Failed to reject NOC', 'error');
        }
    } catch (error) {
        console.error('Error rejecting NOC:', error);
        portalUtils.showNotification('Error rejecting NOC', 'error');
    }
}

/**
 * Show signature modal
 */
function showSignatureModal() {
    document.getElementById('signatureModal').style.display = 'flex';
}

/**
 * Close signature modal
 */
function closeSignatureModal() {
    document.getElementById('signatureModal').style.display = 'none';
    signatureData = null;
}

/**
 * Show upload signature section
 */
function showUploadSignature() {
    document.getElementById('uploadSignatureSection').style.display = 'block';
    document.getElementById('drawSignatureSection').style.display = 'none';
}

/**
 * Show draw signature section
 */
function showDrawSignature() {
    document.getElementById('uploadSignatureSection').style.display = 'none';
    document.getElementById('drawSignatureSection').style.display = 'block';
    initializeCanvas();
}

/**
 * Initialize signature canvas
 */
function initializeCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
}

/**
 * Clear canvas
 */
function clearCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Save signature and sign NOC
 */
async function saveSignature() {
    try {
        // Get signature data from canvas or file
        const canvas = document.getElementById('signatureCanvas');
        const fileInput = document.getElementById('signatureFile');

        let signatureBlob;

        if (document.getElementById('drawSignatureSection').style.display === 'block') {
            // Get signature from canvas
            signatureBlob = await new Promise(resolve => canvas.toBlob(resolve));
        } else if (fileInput.files.length > 0) {
            // Get signature from file
            signatureBlob = fileInput.files[0];
        } else {
            portalUtils.showNotification('Please provide a signature', 'warning');
            return;
        }

        // Upload signature
        const formData = new FormData();
        formData.append('signature', signatureBlob);
        formData.append('type', 'upload');

        const signatureResponse = await apiService.uploadSignature(formData);

        if (!signatureResponse.success) {
            throw new Error('Failed to upload signature');
        }

        // Sign NOC
        const signResponse = await apiService.signNOC(currentNOCId, {
            signatureId: signatureResponse.signature.id
        });

        if (signResponse.success) {
            portalUtils.showNotification('NOC signed successfully!', 'success');
            closeSignatureModal();
            closeModal();
            await loadNOCRequests();
        } else {
            throw new Error(signResponse.message || 'Failed to sign NOC');
        }
    } catch (error) {
        console.error('Error signing NOC:', error);
        portalUtils.showNotification(error.message || 'Error signing NOC', 'error');
    }
}

/**
 * Close NOC details modal
 */
function closeModal() {
    document.getElementById('nocDetailsModal').style.display = 'none';
    currentNOCId = null;
}

/**
 * Helper functions
 */
function getStatusClass(status) {
    const statusClasses = {
        'submitted': 'badge-info',
        'under_review': 'badge-warning',
        'approved': 'badge-success',
        'rejected': 'badge-danger',
        'signed': 'badge-success'
    };
    return statusClasses[status] || 'badge-secondary';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    return `${weeks} weeks (${days} days)`;
}

function capitalizeFirst(str) {
    if (!str) return '';
    // Convert 'submitted' to 'Pending' for display
    if (str === 'submitted') return 'Pending';
    if (str === 'under_review') return 'Under Review';
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
}

// Export for global use
window.loadNOCRequests = loadNOCRequests;
window.loadStats = loadStats;
window.viewNOCDetails = viewNOCDetails;
window.quickApprove = quickApprove;
window.deleteApprovedNOC = deleteApprovedNOC;
window.approveNOC = approveNOC;
window.showApproveModal = showApproveModal;
window.closeApproveModal = closeApproveModal;
window.confirmApproveNOC = confirmApproveNOC;
window.showRejectForm = showRejectForm;
window.closeModal = closeModal;
window.closeSignatureModal = closeSignatureModal;
window.closeRejectModal = closeRejectModal;
window.confirmRejectNOC = confirmRejectNOC;
window.showUploadSignature = showUploadSignature;
window.showDrawSignature = showDrawSignature;
window.clearCanvas = clearCanvas;
window.saveSignature = saveSignature;
