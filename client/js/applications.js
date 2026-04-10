/* Applications: student status view and admin review view */

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'application-status.html') initStatusPage();
    if (currentPage === 'application-review.html') initReviewPage();
});

function formatTime(ts) {
    return portalUtils.formatDate(ts);
}

function renderApplicationCard(app, actionsHtml = '') {
    const badgeClass = app.status === 'pending' ? 'pending' : (app.status === 'approved' ? 'approved' : (app.status === 'rejected' ? 'rejected' : 'withdrawn'));

    return `
        <article class="application-card">
            <div class="app-meta">
                <div>
                    <div style="font-weight:700">${app.title}</div>
                    <div style="font-size:0.9rem;color:var(--gray-600)">${app.studentName} · ${app.department || ''}</div>
                </div>
                <div>
                    <div class="badge ${badgeClass}">${app.status}</div>
                    <div style="font-size:0.8rem;color:var(--gray-400);margin-top:6px">${formatTime(app.submittedAt)}</div>
                </div>
            </div>
            <div class="application-files">
                ${ (app.data && app.data.organization) ? `<div><strong>Organization:</strong> ${app.data.organization}</div>` : '' }
                ${ (app.data && app.data.company) ? `<div><strong>Company:</strong> ${app.data.company}</div>` : '' }
            </div>
            <div class="application-actions">
                ${actionsHtml}
                <button class="btn btn-sm btn-secondary" onclick="viewApplication('${app.id}')">View</button>
            </div>
        </article>
    `;
}

// Student status page
function initStatusPage() {
    const currentUser = portalUtils.getCurrentUser();
    if (!currentUser) { window.location.href = 'index.html'; return; }
    const listEl = document.getElementById('appsList') || document.getElementById('statusList');
    const apps = portalUtils.getApplications(a => a.studentEmail && a.studentEmail.toLowerCase() === currentUser.email.toLowerCase());
    if (!listEl) return;
    if (!apps.length) { listEl.innerHTML = '<p>No applications found. Create one from the dashboard.</p>'; return; }
    listEl.innerHTML = apps.map(app => renderApplicationCard(app, app.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="withdrawApplication('${app.id}')">Withdraw</button>` : '')).join('');
}

function withdrawApplication(id) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    const app = portalUtils.updateApplication(id, { status: 'withdrawn' });
    if (app) {
        portalUtils.addNotification({ to: app.studentEmail, title: 'Application withdrawn', message: `Your application ${app.id} was withdrawn.` });
        portalUtils.showNotification('Application withdrawn', 'info');
        initStatusPage();
    }
}

function viewApplication(id) {
    const app = portalUtils.getApplicationById(id);
    if (!app) return portalUtils.showNotification('Application not found', 'error');
    // Simple view modal (alert for now)
    const details = [];
    details.push(`ID: ${app.id}`);
    details.push(`Type: ${app.type}`);
    details.push(`Status: ${app.status}`);
    details.push(`Submitted: ${formatTime(app.submittedAt)}`);
    if (app.data) {
        for (const k in app.data) {
            if (['id','submittedDate','lastUpdated'].includes(k)) continue;
            if (typeof app.data[k] === 'string' && app.data[k].length < 250) details.push(`${k}: ${app.data[k]}`);
        }
    }
    alert(details.join('\n'));
}

// Admin/Faculty review page
function initReviewPage() {
    const currentUser = portalUtils.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'faculty' && currentUser.role !== 'admin')) {
        portalUtils.showNotification('Access denied: reviewers only', 'error');
        setTimeout(() => window.location.href = 'index.html', 1000);
        return;
    }

    const listEl = document.getElementById('reviewList');
    const apps = portalUtils.getApplications().filter(a => a.status === 'pending');
    if (!listEl) return;
    if (!apps.length) { listEl.innerHTML = '<p>No pending applications at the moment.</p>'; return; }

    listEl.innerHTML = apps.map(app => renderApplicationCard(app, `<button class="btn btn-sm btn-success" onclick="approveApplication('${app.id}')">Approve</button><button class="btn btn-sm btn-danger" onclick="rejectApplication('${app.id}')">Reject</button>`)).join('');
}

function approveApplication(id) {
    const app = portalUtils.getApplicationById(id);
    if (!app) return portalUtils.showNotification('Application not found', 'error');
    if (!confirm(`Approve application ${id}?`)) return;
    portalUtils.updateApplication(id, { status: 'approved', reviewedBy: portalUtils.getCurrentUser().email, reviewedAt: new Date().toISOString() });
    portalUtils.addNotification({ to: app.studentEmail, title: 'Application approved', message: `Your application ${app.id} has been approved.` });
    portalUtils.showNotification('Application approved', 'success');
    initReviewPage();
}

function rejectApplication(id) {
    const reason = prompt('Provide a short reason for rejection (optional):');
    if (reason === null) return; // cancelled
    portalUtils.updateApplication(id, { status: 'rejected', reviewedBy: portalUtils.getCurrentUser().email, reviewedAt: new Date().toISOString(), reviewComment: reason });
    const app = portalUtils.getApplicationById(id);
    portalUtils.addNotification({ to: app.studentEmail, title: 'Application rejected', message: `Your application ${app.id} has been rejected. ${reason ? 'Reason: '+reason : ''}` });
    portalUtils.showNotification('Application rejected', 'info');
    initReviewPage();
}
