/*
 * CRUD MODULE - Frontend-only storage and UI helpers
 * Provides: applications CRUD, users CRUD (for admin), and dashboard init helpers
 */
(function(window, document){
    const STORAGE_APPS = 'applications';
    const STORAGE_USERS = 'users';

    // Seed sample users if not present
    function seedUsers() {
        // Dummy credentials removed for production
        // Users must register or use Google OAuth to create accounts
        const existing = localStorage.getItem(STORAGE_USERS);
        if (existing) return;
        localStorage.setItem(STORAGE_USERS, JSON.stringify([]));
    }

    // Seed sample applications if not present
    function seedApplications() {
        const existing = localStorage.getItem(STORAGE_APPS);
        if (existing) return;
        const now = new Date().toISOString();
        const apps = [
            {
                id: 'NOC-2026-001', type: 'NOC', title: 'NOC for Internship', studentEmail: '24it068@charusat.edu.in', studentName: 'John Doe', department: 'Computer Science', status: 'pending', submittedAt: now, updatedAt: now, data: {}
            },
            {
                id: 'INT-2026-002', type: 'INTERNSHIP', title: 'Internship at Acme Corp', studentEmail: '24it068@charusat.edu.in', studentName: 'John Doe', department: 'Computer Science', status: 'approved', submittedAt: now, updatedAt: now, data: {}
            }
        ];
        localStorage.setItem(STORAGE_APPS, JSON.stringify(apps));
    }

    // Utility: get all apps
    function getAllApplications() {
        const data = localStorage.getItem(STORAGE_APPS);
        return data ? JSON.parse(data) : [];
    }

    function saveAllApplications(apps) {
        localStorage.setItem(STORAGE_APPS, JSON.stringify(apps));
    }

    function createApplication(app) {
        const apps = getAllApplications();
        apps.unshift(app);
        saveAllApplications(apps);
        return app;
    }

    function updateApplication(id, changes) {
        const apps = getAllApplications();
        const idx = apps.findIndex(a => a.id === id);
        if (idx === -1) return null;
        apps[idx] = Object.assign({}, apps[idx], changes, { updatedAt: new Date().toISOString() });
        saveAllApplications(apps);
        return apps[idx];
    }

    function deleteApplication(id) {
        let apps = getAllApplications();
        apps = apps.filter(a => a.id !== id);
        saveAllApplications(apps);
        return true;
    }

    function getApplicationsByFilter(filter) {
        const apps = getAllApplications();
        return apps.filter(filter);
    }

    // Users CRUD for admin
    function getAllUsers() {
        const data = localStorage.getItem(STORAGE_USERS);
        return data ? JSON.parse(data) : [];
    }

    function saveAllUsers(users) {
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }

    function createUser(user) {
        const users = getAllUsers();
        users.push(user);
        saveAllUsers(users);
        return user;
    }

    function updateUser(email, changes) {
        const users = getAllUsers();
        const idx = users.findIndex(u => u.email === email);
        if (idx === -1) return null;
        users[idx] = Object.assign({}, users[idx], changes);
        saveAllUsers(users);
        return users[idx];
    }

    function deleteUser(email) {
        let users = getAllUsers();
        users = users.filter(u => u.email !== email);
        saveAllUsers(users);
        return true;
    }

    // Rendering helpers
    function renderApplications(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const { role, currentUser } = options;
        let apps = [];
        if (role === 'student') {
            apps = getApplicationsByFilter(a => a.studentEmail === currentUser.email);
        } else if (role === 'faculty') {
            apps = getApplicationsByFilter(a => a.status === 'pending');
        } else {
            apps = getAllApplications();
        }

        if (apps.length === 0) {
            container.innerHTML = '<p class="muted">No applications to show.</p>';
            return;
        }

        let html = '<table class="apps-table">';
        html += '<thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Student</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>';
        html += '<tbody>';
        apps.forEach(a => {
            html += `<tr data-id="${a.id}" class="animate-slide-up">
                <td>${a.id}</td>
                <td>${a.type}</td>
                <td>${a.title || '-'}</td>
                <td>${a.studentName} <br><small>${a.studentEmail}</small></td>
                <td><strong class="status status-${a.status}">${a.status}</strong></td>
                <td>${new Date(a.submittedAt).toLocaleString()}</td>
                <td class="actions">`;
            if (role === 'student') {
                html += `<button class="btn btn-sm btn-secondary edit-btn">Edit</button> <button class="btn btn-sm btn-danger delete-btn">Delete</button>`;
            } else if (role === 'faculty') {
                html += `<button class="btn btn-sm btn-success approve-btn">Approve</button> <button class="btn btn-sm btn-danger reject-btn">Reject</button>`;
            } else { // admin
                html += `<button class="btn btn-sm btn-secondary view-btn">View</button> <button class="btn btn-sm btn-danger delete-btn">Delete</button>`;
            }
            html += '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        // Bind buttons
        container.querySelectorAll('.approve-btn').forEach(btn => btn.addEventListener('click', onApprove));
        container.querySelectorAll('.reject-btn').forEach(btn => btn.addEventListener('click', onReject));
        container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', onDelete));
        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', onEdit));
        container.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', onView));
    }

    function onApprove(e) {
        const id = e.target.closest('tr').dataset.id;
        updateApplication(id, { status: 'approved' });
        portalUtils.showNotification('Application approved', 'success');
        refreshDashboards();
    }

    function onReject(e) {
        const id = e.target.closest('tr').dataset.id;
        updateApplication(id, { status: 'rejected' });
        portalUtils.showNotification('Application rejected', 'warning');
        refreshDashboards();
    }

    function onDelete(e) {
        const id = e.target.closest('tr').dataset.id;
        if (!confirm('Delete this application? This cannot be undone.')) return;
        deleteApplication(id);
        portalUtils.showNotification('Application deleted', 'success');
        refreshDashboards();
    }

    function onEdit(e) {
        const id = e.target.closest('tr').dataset.id;
        const app = getAllApplications().find(a => a.id === id);
        if (!app) return;
        const newTitle = prompt('Edit application title', app.title || '');
        if (newTitle === null) return; // cancelled
        updateApplication(id, { title: newTitle });
        portalUtils.showNotification('Application updated', 'success');
        refreshDashboards();
    }

    function onView(e) {
        const id = e.target.closest('tr').dataset.id;
        const app = getAllApplications().find(a => a.id === id);
        if (!app) return;
        alert(`Application ${app.id}\nType: ${app.type}\nStudent: ${app.studentName}\nStatus: ${app.status}`);
    }

    // Small helper to refresh current page dashboards
    function refreshDashboards() {
        const page = window.location.pathname.split('/').pop();
        if (page === 'student-dashboard.html') initStudentDashboard();
        if (page === 'faculty-dashboard.html') initFacultyDashboard();
        if (page === 'admin-dashboard.html') initAdminDashboard();
    }

    /** Initializers **/
    function initStudentDashboard() {
        seedUsers(); seedApplications();
        const user = portalUtils.getCurrentUser();
        if (!user) return;
        // Render my applications
        renderApplications('applicationsList', { role: 'student', currentUser: user });

        const newBtn = document.getElementById('newApplicationBtn');
        if (newBtn) newBtn.addEventListener('click', function() {
            // Simple create via prompt for demo
            const type = prompt('Application type (NOC / INTERNSHIP)');
            if (!type) return;
            const title = prompt('Title / Purpose');
            if (!title) return;
            const app = {
                id: portalUtils.generateApplicationId(type.startsWith('N') ? 'NOC' : 'INT'),
                type: type.toUpperCase(),
                title: title,
                studentEmail: user.email,
                studentName: user.name || '',
                department: user.department || '',
                status: 'pending',
                submittedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: {}
            };
            createApplication(app);
            portalUtils.showNotification('Application submitted', 'success');
            renderApplications('applicationsList', { role: 'student', currentUser: user });
        });
    }

    function initFacultyDashboard() {
        seedUsers(); seedApplications();
        const user = portalUtils.getCurrentUser();
        if (!user || user.role !== 'faculty') {
            portalUtils.showNotification('Unauthorized', 'error');
            setTimeout(() => window.location.href = 'index.html', 800);
            return;
        }
        renderApplications('pendingList', { role: 'faculty', currentUser: user });
    }

    function initAdminDashboard() {
        seedUsers(); seedApplications();
        const user = portalUtils.getCurrentUser();
        if (!user || user.role !== 'admin') {
            portalUtils.showNotification('Unauthorized', 'error');
            setTimeout(() => window.location.href = 'index.html', 800);
            return;
        }
        renderApplications('adminAppsList', { role: 'admin', currentUser: user });
        renderUserManagement();
    }

    function renderUserManagement() {
        const container = document.getElementById('adminUsers');
        if (!container) return;
        const users = getAllUsers();
        let html = '<table class="apps-table"><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Actions</th></tr></thead><tbody>';
        users.forEach(u => {
            html += `<tr><td>${u.email}</td><td>${u.name || '-'}</td><td>${u.role}</td><td><button class="btn btn-sm edit-user">Edit</button> <button class="btn btn-sm btn-danger delete-user">Delete</button></td></tr>`;
        });
        html += '</tbody></table>';
        html += '<div class="mt-2"><button id="createUserBtn" class="btn btn-primary">Create User</button></div>';
        container.innerHTML = html;
        container.querySelectorAll('.edit-user').forEach((btn, i) => btn.addEventListener('click', function(){
            const u = users[i];
            const newName = prompt('Edit name', u.name || '');
            if (newName === null) return;
            updateUser(u.email, { name: newName });
            portalUtils.showNotification('User updated', 'success');
            renderUserManagement();
        }));
        container.querySelectorAll('.delete-user').forEach((btn, i) => btn.addEventListener('click', function(){
            const u = users[i];
            if (!confirm('Delete user ' + u.email + '?')) return;
            deleteUser(u.email);
            portalUtils.showNotification('User deleted', 'success');
            renderUserManagement();
        }));
        const createBtn = document.getElementById('createUserBtn');
        if (createBtn) createBtn.addEventListener('click', function(){
            const email = prompt('Email'); if (!email) return; const name = prompt('Full name'); if (name === null) return; const role = prompt('Role (student/faculty/admin)'); if (!role) return;
            createUser({ email, name, role, password: 'password123' });
            portalUtils.showNotification('User created', 'success');
            renderUserManagement();
        });
    }

    // Dropdown toggle helper for header
    function setupHeaderDropdown() {
        document.querySelectorAll('.user-dropdown-toggle').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const menu = this.nextElementSibling;
                menu.classList.toggle('open');
            });
        });
        // Close on outside click
        document.addEventListener('click', function(e) {
            document.querySelectorAll('.user-dropdown-menu.open').forEach(menu => {
                if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
                    menu.classList.remove('open');
                }
            });
        });
    }

    /* ===== Additional utilities for documents, remarks, NOC and export ===== */
    function getApplicationById(id) {
        return getAllApplications().find(a => a.id === id) || null;
    }

    function attachDocument(appId, fileObj) {
        const apps = getAllApplications();
        const idx = apps.findIndex(a => a.id === appId);
        if (idx === -1) return false;
        if (!apps[idx].data) apps[idx].data = {};
        if (!apps[idx].data.documents) apps[idx].data.documents = [];
        apps[idx].data.documents.push({ name: fileObj.name, type: fileObj.type, dataUrl: fileObj.dataUrl, uploadedAt: new Date().toISOString() });
        saveAllApplications(apps);
        return true;
    }

    function addRemark(appId, role, by, text) {
        const apps = getAllApplications();
        const idx = apps.findIndex(a => a.id === appId);
        if (idx === -1) return false;
        if (!apps[idx].data) apps[idx].data = {};
        if (!apps[idx].data.remarks) apps[idx].data.remarks = [];
        apps[idx].data.remarks.push({ role, by, text, time: new Date().toISOString() });
        saveAllApplications(apps);
        return true;
    }

    function generateNOC(appId, cb) {
        const app = getApplicationById(appId);
        if (!app) return cb && cb(null);
        // Create simple NOC HTML
        const nocHtml = `<!doctype html><html><head><meta charset="utf-8"><title>NOC - ${app.id}</title><style>body{font-family:Segoe UI,Arial;padding:2rem;color:#0f172a}h1{color:#0e66b3} .meta{margin-top:1rem;color:#374151}</style></head><body><h1>NO OBJECTION CERTIFICATE</h1><p>This certifies that <strong>${app.studentName}</strong> (${app.studentEmail}) from <strong>${app.department || 'N/A'}</strong> has been granted permission for <strong>${app.title}</strong>.</p><p class="meta">Application ID: ${app.id}<br>Generated: ${new Date().toLocaleString()}</p></body></html>`;
        const apps = getAllApplications();
        const idx = apps.findIndex(a => a.id === appId);
        if (idx === -1) return cb && cb(null);
        apps[idx].noc = { generated: true, generatedAt: new Date().toISOString(), content: nocHtml };
        saveAllApplications(apps);
        // Create object URL for immediate download/view
        const blob = new Blob([nocHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        // store url transiently (won't persist between sessions)
        apps[idx].noc.url = url;
        saveAllApplications(apps);
        if (cb) cb(url);
        return url;
    }

    function openNOC(appId) {
        const app = getApplicationById(appId);
        if (!app || !app.noc) return;
        const content = app.noc.content || '';
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    function exportApplicationsCSV() {
        const apps = getAllApplications();
        if (!apps || apps.length === 0) { portalUtils.showNotification('No applications to export', 'warning'); return; }
        const headers = ['ID','Type','Title','StudentName','StudentEmail','Department','Status','SubmittedAt','UpdatedAt'];
        const rows = apps.map(a => [a.id, a.type, (a.title||''), (a.studentName||''), (a.studentEmail||''), (a.department||''), a.status, a.submittedAt || '', a.updatedAt || '']);
        const csv = [headers.join(','), ...rows.map(r => r.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'applications_export.csv'; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 1000);
        portalUtils.showNotification('Export started', 'success');
    }

    // Updated renderApplications to include admin NOC actions
    const originalRenderApplications = renderApplications;
    function renderApplications(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const { role, currentUser } = options;
        let apps = [];
        if (role === 'student') {
            apps = getApplicationsByFilter(a => a.studentEmail === currentUser.email);
        } else if (role === 'faculty') {
            apps = getApplicationsByFilter(a => a.status === 'pending');
        } else {
            apps = getAllApplications();
        }

        if (apps.length === 0) {
            container.innerHTML = '<p class="muted">No applications to show.</p>';
            return;
        }

        let html = '<table class="apps-table">';
        html += '<thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Student</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>';
        html += '<tbody>';
        apps.forEach(a => {
            html += `<tr data-id="${a.id}" class="animate-slide-up">
                <td>${a.id}</td>
                <td>${a.type}</td>
                <td>${a.title || '-'}</td>
                <td>${a.studentName} <br><small>${a.studentEmail}</small></td>
                <td><strong class="status status-${a.status}">${a.status}</strong></td>
                <td>${new Date(a.submittedAt).toLocaleString()}</td>
                <td class="actions">`;
            if (role === 'student') {
                html += `<button class="btn btn-sm btn-secondary edit-btn">Edit</button> <button class="btn btn-sm btn-danger delete-btn">Delete</button> <a class="btn btn-sm" href="application-review.html?id=${a.id}">View</a>`;
            } else if (role === 'faculty') {
                html += `<button class="btn btn-sm btn-success approve-btn">Approve</button> <button class="btn btn-sm btn-danger reject-btn">Reject</button> <a class="btn btn-sm" href="application-review.html?id=${a.id}">View</a>`;
            } else { // admin
                html += `<button class="btn btn-sm btn-secondary view-btn">View</button> <button class="btn btn-sm btn-danger delete-btn">Delete</button>`;
                if (a.status === 'approved' && !(a.noc && a.noc.generated)) {
                    html += ` <button class="btn btn-sm btn-primary generate-noc-btn">Generate NOC</button>`;
                }
                if (a.noc && a.noc.generated) {
                    html += ` <button class="btn btn-sm btn-secondary view-noc-btn">View NOC</button>`;
                }
            }
            html += '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        // Bind buttons
        container.querySelectorAll('.approve-btn').forEach(btn => btn.addEventListener('click', onApprove));
        container.querySelectorAll('.reject-btn').forEach(btn => btn.addEventListener('click', onReject));
        container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', onDelete));
        container.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', onEdit));
        container.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', onView));
        container.querySelectorAll('.generate-noc-btn').forEach(btn => btn.addEventListener('click', onGenerateNOC));
        container.querySelectorAll('.view-noc-btn').forEach(btn => btn.addEventListener('click', onViewNOC));
    }

    function onGenerateNOC(e) {
        const id = e.target.closest('tr').dataset.id;
        generateNOC(id, function(url){
            portalUtils.showNotification('NOC generated', 'success');
            refreshDashboards();
        });
    }

    function onViewNOC(e) {
        const id = e.target.closest('tr').dataset.id;
        openNOC(id);
    }

    // Expose functions
    window.portalCRUD = {
        initStudentDashboard,
        initFacultyDashboard,
        initAdminDashboard,
        createApplication,
        updateApplication,
        deleteApplication,
        createUser,
        updateUser,
        deleteUser,
        setupHeaderDropdown,
        getApplicationById,
        attachDocument,
        addRemark,
        generateNOC,
        openNOC,
        exportApplicationsCSV,
        renderApplications // override
    };

    // Auto-seed on script load
    seedUsers(); seedApplications();

})(window, document);
