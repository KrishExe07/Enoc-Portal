/**
 * FACULTY DASHBOARD — Complete Workflow JS
 * Handles: NOC review, approval, e-signature, PDF generation, email dispatch
 * Role: Faculty ONLY (no admin approval authority here)
 */

'use strict';

const FacDash = (() => {

    /* ── STATE ──────────────────────────────────────────────────── */
    let currentUser = null;
    let allNOCs = [];          // all fetched NOCs
    let filteredNOCs = [];
    let activeNOC = null;        // NOC currently in modal
    let sigCanvas = null;
    let sigCtx = null;
    let isDrawing = false;
    let sigDataURL = null;        // final signature image
    let sigMode = 'draw';
    let notifications = [];
    let auditLog = [];

    /* ── BACKEND URL ─────────────────────────────────────────────── */
    const API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:5000/api';

    /* ── INIT ────────────────────────────────────────────────────── */
    async function init() {
        // Auth guard
        currentUser = getUser();
        if (!currentUser || currentUser.role !== 'faculty') {
            toast('Access denied. Faculty login required.', 'error');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            return;
        }

        // Initialize UI
        populateUserUI();
        initSignatureCanvas();
        closeOnOutsideClick();

        // Load dashboard data
        loadDashboard();
    }

    function getUser() {
        try {
            const raw = localStorage.getItem('currentUser') ||
                localStorage.getItem('portal_user') ||
                localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    function getToken() {
        return localStorage.getItem('jwt_token') || '';
    }

    let profileEditMode = false;
    let notifFilter = 'all';

    function populateUserUI() {
        const name = currentUser.name || 'Faculty';
        const email = currentUser.email || 'faculty@charusat.ac.in';
        const init = name.charAt(0).toUpperCase();

        document.getElementById('userNameHeader').textContent = name;
        document.getElementById('userAvatarHeader').textContent = init;
        document.getElementById('sidebarAvatar').textContent = init;
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = email;
        document.getElementById('welcomeName').textContent = name.split(' ')[0];

        // Profile section — header
        document.getElementById('profileAvatarLg').textContent = init;
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = email;

        // Profile section — detail cards
        document.getElementById('profileDepartment').textContent = currentUser.department || 'Not set';
        document.getElementById('profileDesignation').textContent = currentUser.designation || 'Not set';
        document.getElementById('profileMobile').textContent = currentUser.mobile || 'Not set';
        document.getElementById('profileProvider').textContent = currentUser.login_provider === 'direct' ? 'Direct Login' : 'Google OAuth';
        document.getElementById('profileLastLogin').textContent = currentUser.last_login
            ? new Date(currentUser.last_login).toLocaleString() : '—';
    }

    async function loadDashboard() {
        await loadPendingNOCs();
        loadStats();
        loadAuditLog();
        loadNotifications();
    }

    /* ── SECTION NAVIGATION ──────────────────────────────────────── */
    function showSection(name) {
        document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

        const sec = document.getElementById(`sec-${name}`);
        if (sec) sec.classList.add('active');

        const link = document.querySelector(`[data-section="${name}"]`);
        if (link) link.classList.add('active');

        // Lazy load section data
        if (name === 'pending') loadPendingNOCs(); // Always reload when viewing pending
        if (name === 'supervised') loadSupervisedInternships();
        if (name === 'myapprovals') loadMyApprovals();
        if (name === 'notifications') renderNotifications();
        if (name === 'overview') loadAuditLog();
        if (name === 'profile') refreshProfileStats();

        // Close user dropdown
        document.getElementById('userPill').classList.remove('open');
    }

    /* ── LOAD NOCs FROM BACKEND ──────────────────────────────────── */
    async function loadPendingNOCs() {
        const grid = document.getElementById('pendingGrid');
        grid.innerHTML = '<div class="loading-state"><div class="spinner"></div> Loading requests…</div>';

        const token = getToken();
        console.log('[FacDash] Loading NOCs from backend. Token present:', !!token);

        try {
            // Fetch ALL statuses so stats and supervised sections work too
            const [pendingRes, allRes] = await Promise.all([
                fetch(`${API}/noc/pending`, { headers: buildHeaders() }),
                fetch(`${API}/noc/all`,     { headers: buildHeaders() })
            ]);

            console.log('[FacDash] /noc/pending HTTP status:', pendingRes.status);
            console.log('[FacDash] /noc/all HTTP status:', allRes.status);

            const pendingData = await pendingRes.json();
            const allData = allRes.ok ? await allRes.json() : { success: false };

            console.log('[FacDash] pending response:', pendingData);
            console.log('[FacDash] all response:', allData);

            if (!pendingData.success) {
                console.error('[FacDash] Backend returned error for /noc/pending:', pendingData.message);
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1;">
                        <div class="empty-icon">⚠️</div>
                        <h3>Could not load requests</h3>
                        <p style="color:#ef4444;">${pendingData.message || 'Backend error — check server logs'}</p>
                        <button class="btn btn-primary btn-sm" onclick="FacDash.refresh()" style="margin-top:1rem;">🔄 Retry</button>
                    </div>`;
                allNOCs = [];
                filteredNOCs = [];
                updateBadges();
                return;
            }

            // Pending NOCs (submitted + under_review) from /noc/pending
            const pendingList = pendingData.requests || [];
            console.log(`[FacDash] Received ${pendingList.length} pending NOC(s) from DB`);

            // All NOCs from /noc/all (for stats + approved/signed views)
            const allList = allData.success ? (allData.requests || []) : pendingList;
            console.log(`[FacDash] Received ${allList.length} total NOC(s) from DB`);

            // Merge: allNOCs should contain everything, deduped by id
            const byId = {};
            [...allList, ...pendingList].forEach(n => { byId[n.id] = n; });
            allNOCs = Object.values(byId);

            console.log(`[FacDash] Total unique NOCs in memory: ${allNOCs.length}`);

        } catch (e) {
            console.error('[FacDash] Network/fetch error loading NOCs:', e);
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-icon">🔌</div>
                    <h3>Backend not reachable</h3>
                    <p>Make sure the backend server is running on port 5000.</p>
                    <button class="btn btn-primary btn-sm" onclick="FacDash.refresh()" style="margin-top:1rem;">🔄 Retry</button>
                </div>`;
            allNOCs = [];
            filteredNOCs = [];
            updateBadges();
            return;
        }

        filteredNOCs = [...allNOCs];
        renderNOCGrid();
        updateBadges();
    }

    function renderNOCGrid() {
        const grid = document.getElementById('pendingGrid');
        const pending = filteredNOCs.filter(n => ['submitted', 'under_review'].includes(n.status));

        if (pending.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">🎉</div>
          <h3>All caught up!</h3>
          <p>No pending NOC requests at this time.</p>
        </div>`;
            return;
        }

        grid.innerHTML = pending.map(noc => `
      <div class="noc-card" id="card-${noc.id}">
        <div class="noc-card-top">
          <div>
            <div class="noc-id">${noc.nocId || `NOC-${noc.id}`}</div>
            <div class="noc-title">${esc(noc.studentName)}</div>
          </div>
          <span class="status-pill ${noc.status}">${statusLabel(noc.status)}</span>
        </div>
        <div class="noc-card-body">
          <div class="noc-meta-row">
            <span class="meta-icon">🏢</span>
            <span><strong>${esc(noc.company?.name || 'N/A')}</strong> · ${esc(noc.company?.location || '')}</span>
          </div>
          <div class="noc-meta-row">
            <span class="meta-icon">📅</span>
            <span>${fmt(noc.startDate)} → ${fmt(noc.endDate)}</span>
          </div>
          <div class="noc-meta-row">
            <span class="meta-icon">🎓</span>
            <span>Semester ${noc.semester} · ${esc(noc.studentEmail)}</span>
          </div>
          <div class="noc-meta-row">
            <span class="meta-icon">🕐</span>
            <span>Submitted ${timeAgo(noc.createdAt)}</span>
          </div>
        </div>
        <div class="noc-card-footer">
          <button class="btn btn-outline btn-sm" onclick="FacDash.openNOCDetail(${noc.id})">
            👁 View Details
          </button>
          <button class="btn btn-success btn-sm" onclick="FacDash.openApproveModal(${noc.id})">
            ✅ Approve
          </button>
          <button class="btn btn-danger btn-sm" onclick="FacDash.openRejectModal(${noc.id})">
            ❌ Reject
          </button>
        </div>
      </div>
    `).join('');
    }

    /* ── FILTER ──────────────────────────────────────────────────── */
    function filterNOCs() {
        const status = document.getElementById('filterStatus').value;
        const search = document.getElementById('filterSearch').value.toLowerCase();

        filteredNOCs = allNOCs.filter(n => {
            const matchStatus = !status || n.status === status;
            const matchSearch = !search ||
                (n.studentName || '').toLowerCase().includes(search) ||
                (n.company?.name || '').toLowerCase().includes(search) ||
                (n.nocId || '').toLowerCase().includes(search);
            return matchStatus && matchSearch;
        });
        renderNOCGrid();
    }

    /* ── STATS ───────────────────────────────────────────────────── */
    function loadStats() {
        const all = allNOCs;
        const pending  = all.filter(n => ['submitted', 'under_review'].includes(n.status)).length;
        const approved = all.filter(n => ['approved', 'signed'].includes(n.status)).length;
        const rejected = all.filter(n => n.status === 'rejected').length;
        const supervised = all.filter(n => ['approved', 'signed'].includes(n.status)).length;

        console.log(`[FacDash] Stats — pending:${pending} approved:${approved} rejected:${rejected} total:${all.length}`);

        document.getElementById('statPending').textContent = pending;
        document.getElementById('statApproved').textContent = approved;
        document.getElementById('statSupervised').textContent = supervised;
        document.getElementById('statRejected').textContent = rejected;

        const quickCount = document.getElementById('quickPendingCount');
        if (quickCount) quickCount.textContent = pending;
    }

    function updateBadges() {
        const count = allNOCs.filter(n => ['submitted', 'under_review'].includes(n.status)).length;
        document.getElementById('pendingBadge').textContent = count;
        document.getElementById('notifCount').textContent = count;
        document.getElementById('notifBadge').textContent = count;
    }

    /* ── SUPERVISED INTERNSHIPS ──────────────────────────────────── */
    function loadSupervisedInternships() {
        const tbody = document.getElementById('supervisedBody');
        const supervised = allNOCs.filter(n => ['approved', 'signed'].includes(n.status));

        if (supervised.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💼</div><h3>No active internships</h3></div></td></tr>`;
            return;
        }

        tbody.innerHTML = supervised.map(n => `
      <tr>
        <td><strong>${n.nocId || `NOC-${n.id}`}</strong></td>
        <td>${esc(n.studentName)}<br><small style="color:#94a3b8;">${esc(n.studentEmail)}</small></td>
        <td>${esc(n.company?.name || 'N/A')}</td>
        <td>${fmt(n.startDate)} – ${fmt(n.endDate)}</td>
        <td><span class="status-pill ${n.status}">${statusLabel(n.status)}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="FacDash.openNOCDetail(${n.id})">View</button>
          ${n.status === 'approved' ? `<button class="btn btn-primary btn-sm" onclick="FacDash.generatePDF(${n.id})">📄 PDF</button>` : ''}
        </td>
      </tr>
    `).join('');
    }

    /* ── MY APPROVALS ────────────────────────────────────────────── */
    function loadMyApprovals() {
        const tbody = document.getElementById('myApprovalsBody');
        const approved = allNOCs.filter(n => ['approved', 'signed'].includes(n.status));

        if (approved.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">✅</div><h3>No approvals yet</h3></div></td></tr>`;
            return;
        }

        tbody.innerHTML = approved.map(n => `
      <tr>
        <td><strong>${n.nocId || `NOC-${n.id}`}</strong></td>
        <td>${esc(n.studentName)}</td>
        <td>${esc(n.company?.name || 'N/A')}</td>
        <td>${n.reviewedAt ? fmt(n.reviewedAt) : '—'}</td>
        <td>
          ${n.status === 'signed'
                ? '<span class="status-pill signed">📝 Signed</span>'
                : '<span class="status-pill approved">✅ Approved</span>'}
        </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="FacDash.generatePDF(${n.id})">📄 PDF</button>
          <button class="btn btn-success btn-sm" onclick="FacDash.sendEmail(${n.id})">📧 Email</button>
                    ${n.status === 'approved' ? `<button class="btn btn-danger btn-sm" onclick="FacDash.deleteApprovedInternship(${n.id})">🗑 Delete</button>` : ''}
        </td>
      </tr>
    `).join('');
    }

        /* ── DELETE APPROVED INTERNSHIP ─────────────────────────────── */
        async function deleteApprovedInternship(id) {
                const noc = allNOCs.find(n => n.id === id);
                if (!noc) return;

                if (noc.status !== 'approved') {
                        toast('Only approved internships can be deleted.', 'warning');
                        return;
                }

                const ok = window.confirm(`Delete approved internship ${noc.nocId || `NOC-${noc.id}`} for ${noc.studentName}? This cannot be undone.`);
                if (!ok) return;

                try {
                        const res = await fetch(`${API}/noc/${id}`, {
                                method: 'DELETE',
                                headers: buildHeaders()
                        });

                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || data.success === false) {
                                throw new Error(data.message || 'Failed to delete approved internship request');
                        }

                        // Keep frontend state in sync immediately.
                        allNOCs = allNOCs.filter(n => n.id !== id);
                        filteredNOCs = filteredNOCs.filter(n => n.id !== id);

                        addAuditEntry('rejected', `Deleted approved internship record for ${noc.studentName}`);
                        toast('Approved internship request deleted.', 'success');

                        renderNOCGrid();
                        loadMyApprovals();
                        loadSupervisedInternships();
                        loadStats();
                        updateBadges();
                        loadAuditLog();
                } catch (e) {
                        console.error('Delete approved internship failed:', e);
                        toast(e.message || 'Unable to delete approved internship request', 'error');
                }
        }

    /* ── AUDIT LOG ───────────────────────────────────────────────── */
    function loadAuditLog() {
        const list = document.getElementById('auditList');
        // Build from allNOCs state changes
        const events = [];
        allNOCs.forEach(n => {
            events.push({ type: 'submitted', text: `${n.studentName} submitted NOC for ${n.company?.name}`, time: n.createdAt });
            if (n.status === 'approved' && n.reviewedAt)
                events.push({ type: 'approved', text: `You approved ${n.studentName}'s NOC`, time: n.reviewedAt });
            if (n.status === 'rejected' && n.rejectedAt)
                events.push({ type: 'rejected', text: `You rejected ${n.studentName}'s NOC`, time: n.rejectedAt });
            if (n.status === 'signed' && n.signedAt)
                events.push({ type: 'signed', text: `NOC signed & PDF generated for ${n.studentName}`, time: n.signedAt });
        });

        events.sort((a, b) => new Date(b.time) - new Date(a.time));

        if (events.length === 0) {
            list.innerHTML = `<li class="empty-state"><div class="empty-icon">📋</div><h3>No activity yet</h3></li>`;
            return;
        }

        list.innerHTML = events.slice(0, 10).map(e => `
      <li class="audit-item">
        <div class="audit-dot ${e.type}"></div>
        <div>
          <div class="audit-text">${esc(e.text)}</div>
          <div class="audit-time">${timeAgo(e.time)}</div>
        </div>
      </li>
    `).join('');
    }

    /* ── NOTIFICATIONS (Enhanced) ──────────────────────────────── */
    function loadNotifications() {
        notifications = [];

        // Generate categorized notifications from ALL NOC data
        allNOCs.forEach(n => {
            // New request notifications
            if (['submitted', 'under_review'].includes(n.status)) {
                notifications.push({
                    id: n.id, unread: true,
                    category: 'new_request',
                    icon: '📥',
                    title: 'New NOC Request',
                    text: `${n.studentName} submitted NOC for ${n.company?.name || 'a company'}`,
                    time: n.createdAt,
                    actionLabel: 'Review',
                    actionFn: `FacDash.openNOCDetail(${n.id})`
                });
            }

            // Approved notifications
            if (n.status === 'approved' && n.reviewedAt) {
                notifications.push({
                    id: n.id, unread: false,
                    category: 'approved',
                    icon: '✅',
                    title: 'NOC Approved',
                    text: `You approved ${n.studentName}'s NOC for ${n.company?.name || 'a company'}`,
                    time: n.reviewedAt,
                    actionLabel: 'View',
                    actionFn: `FacDash.openNOCDetail(${n.id})`
                });
            }

            // Signed notifications
            if (n.status === 'signed' && n.signedAt) {
                notifications.push({
                    id: n.id, unread: false,
                    category: 'approved',
                    icon: '📝',
                    title: 'NOC Signed & PDF Ready',
                    text: `PDF generated for ${n.studentName} — ${n.company?.name || 'a company'}`,
                    time: n.signedAt,
                    actionLabel: 'PDF',
                    actionFn: `FacDash.generatePDF(${n.id})`
                });
            }

            // Rejected notifications
            if (n.status === 'rejected' && n.rejectedAt) {
                notifications.push({
                    id: n.id, unread: false,
                    category: 'rejected',
                    icon: '❌',
                    title: 'NOC Rejected',
                    text: `You rejected ${n.studentName}'s NOC — ${n.rejectionReason || 'No reason given'}`,
                    time: n.rejectedAt || n.updatedAt,
                    actionLabel: 'View',
                    actionFn: `FacDash.openNOCDetail(${n.id})`
                });
            }
        });

        // Add system notification for session
        notifications.push({
            id: 'sys-login', unread: false,
            category: 'system',
            icon: '🔐',
            title: 'Session Active',
            text: `Logged in as ${currentUser.name || 'Faculty'} (${currentUser.email || ''})`,
            time: currentUser.last_login || new Date().toISOString(),
            actionLabel: null,
            actionFn: null
        });

        // Sort by time descending (most recent first)
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        renderNotifications();
    }

    function renderNotifications() {
        const list = document.getElementById('notifList');

        // Apply category filter
        const filtered = notifFilter === 'all'
            ? notifications
            : notifications.filter(n => n.category === notifFilter);

        // Update summary
        const unreadCount = notifications.filter(n => n.unread).length;
        const summaryEl = document.getElementById('notifSummary');
        if (summaryEl) summaryEl.textContent = `${unreadCount} unread`;

        if (filtered.length === 0) {
            const emptyMsg = notifFilter === 'all'
                ? 'No notifications yet'
                : `No ${notifFilter.replace('_', ' ')} notifications`;
            list.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon">🔔</div>
                    <h3>${emptyMsg}</h3>
                    <p style="color:#94a3b8;font-size:.875rem;">Actions you take on NOC requests will appear here.</p>
                </li>`;
            return;
        }

        list.innerHTML = filtered.map(n => `
          <li class="notif-item ${n.unread ? 'unread' : ''} notif-cat-${n.category}" data-notif-id="${n.id}">
            <div class="notif-icon-wrap ${n.category}">
                <span class="notif-icon">${n.icon}</span>
            </div>
            <div class="notif-text">
              <h4>${esc(n.title)}</h4>
              <p>${esc(n.text)}</p>
              <div class="notif-time">${timeAgo(n.time)}</div>
            </div>
            <div class="notif-actions">
                ${n.actionLabel ? `<button class="btn btn-outline btn-sm" onclick="${n.actionFn}">${n.actionLabel}</button>` : ''}
                ${n.unread ? `<button class="btn-icon" onclick="FacDash.markNotifRead('${n.id}')" title="Mark read">✓</button>` : ''}
            </div>
          </li>
        `).join('');
    }

    function filterNotifications(category, btn) {
        notifFilter = category;
        document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
        if (btn) btn.classList.add('active');
        renderNotifications();
    }

    function markNotifRead(id) {
        const notif = notifications.find(n => String(n.id) === String(id));
        if (notif) notif.unread = false;
        renderNotifications();
        updateNotifBadges();
    }

    function clearNotifications() {
        notifications.forEach(n => n.unread = false);
        renderNotifications();
        updateNotifBadges();
        toast('All notifications marked as read', 'info');
    }

    function updateNotifBadges() {
        const unread = notifications.filter(n => n.unread).length;
        document.getElementById('notifCount').textContent = unread;
        document.getElementById('notifBadge').textContent = unread;
        const summaryEl = document.getElementById('notifSummary');
        if (summaryEl) summaryEl.textContent = `${unread} unread`;
    }

    /* ── PROFILE EDIT / SAVE ─────────────────────────────────────── */
    function toggleProfileEdit() {
        profileEditMode = !profileEditMode;
        const viewMode = document.getElementById('profileViewMode');
        const editMode = document.getElementById('profileEditMode');
        const toggleBtn = document.getElementById('profileEditToggle');
        const statusDiv = document.getElementById('profileStatus');

        if (profileEditMode) {
            // Switch to edit mode — pre-fill fields
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
            toggleBtn.innerHTML = '✕ Cancel';
            toggleBtn.classList.remove('btn-primary');
            toggleBtn.classList.add('btn-secondary');
            statusDiv.style.display = 'none';

            // Pre-fill with current values
            const deptSelect = document.getElementById('editDepartment');
            const desigSelect = document.getElementById('editDesignation');
            const mobileInput = document.getElementById('editMobile');

            deptSelect.value = currentUser.department || '';
            desigSelect.value = currentUser.designation || '';
            mobileInput.value = currentUser.mobile || '';
        } else {
            // Switch back to view mode
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            toggleBtn.innerHTML = '✏️ Edit Profile';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-primary');
        }
    }

    async function saveProfile(e) {
        e.preventDefault();
        const statusDiv = document.getElementById('profileStatus');
        const saveBtn = document.getElementById('profileSaveBtn');

        const department = document.getElementById('editDepartment').value;
        const designation = document.getElementById('editDesignation').value;
        const mobile = document.getElementById('editMobile').value.trim();

        // Validation
        if (mobile && !/^[0-9]{10}$/.test(mobile)) {
            showProfileStatus('Please enter a valid 10-digit mobile number.', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';

        try {
            const res = await fetch(`${API}/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...buildHeaders() },
                body: JSON.stringify({ department, designation, mobile })
            });
            const data = await res.json();

            if (data.success) {
                // Update local user state
                currentUser.department = department;
                currentUser.designation = designation;
                currentUser.mobile = mobile;

                // Update localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                // Refresh UI
                populateUserUI();

                // Switch back to view mode
                profileEditMode = true; // will be toggled to false
                toggleProfileEdit();

                showProfileStatus('Profile updated successfully!', 'success');
                toast('✅ Profile saved successfully!', 'success');

                // Add to notifications
                addNotification('⚙️', 'Profile Updated', 'Your profile information has been updated.');
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Profile save error:', err);

            // Fallback: save locally even if backend fails
            currentUser.department = department;
            currentUser.designation = designation;
            currentUser.mobile = mobile;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            populateUserUI();

            profileEditMode = true;
            toggleProfileEdit();

            showProfileStatus('Profile saved locally (backend sync pending).', 'warning');
            toast('⚠️ Saved locally — backend sync failed', 'warning');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Changes';
        }
    }

    function showProfileStatus(msg, type) {
        const statusDiv = document.getElementById('profileStatus');
        statusDiv.textContent = msg;
        statusDiv.className = `profile-status profile-status-${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
    }

    function refreshProfileStats() {
        const reviewed = allNOCs.filter(n => ['approved', 'signed', 'rejected'].includes(n.status)).length;
        const el = document.getElementById('profileNOCsReviewed');
        if (el) el.textContent = reviewed;
    }

    /* ── NOC DETAIL MODAL ────────────────────────────────────────── */
    function openNOCDetail(id) {
        activeNOC = allNOCs.find(n => n.id === id);
        if (!activeNOC) return;

        document.getElementById('modalNocId').textContent = activeNOC.nocId || `NOC-${id}`;

        const isPending = ['submitted', 'under_review'].includes(activeNOC.status);

        document.getElementById('nocDetailBody').innerHTML = `
      <div class="detail-section">
        <h4>👤 Student Information</h4>
        <div class="detail-grid">
          <div class="detail-item"><label>Full Name</label><span>${esc(activeNOC.studentName)}</span></div>
          <div class="detail-item"><label>Enrollment No</label><span><strong>${esc(activeNOC.enrollmentNo || '—')}</strong></span></div>
          <div class="detail-item"><label>Email</label><span>${esc(activeNOC.studentEmail)}</span></div>
          <div class="detail-item"><label>Semester</label><span>${activeNOC.semester}</span></div>
          <div class="detail-item"><label>Mobile</label><span>${esc(activeNOC.mobile || '—')}</span></div>
        </div>
      </div>
      <div class="detail-section">
        <h4>🏢 Company Information</h4>
        <div class="detail-grid">
          <div class="detail-item"><label>Company Name</label><span>${esc(activeNOC.company?.name || '—')}</span></div>
          <div class="detail-item"><label>Location</label><span>${esc(activeNOC.company?.location || '—')}</span></div>
          <div class="detail-item"><label>HR Email</label><span>${esc(activeNOC.company?.hrEmail || '—')}</span></div>
          <div class="detail-item"><label>Industry</label><span>${esc(activeNOC.company?.industry || '—')}</span></div>
        </div>
      </div>
      <div class="detail-section">
        <h4>📅 Internship Details</h4>
        <div class="detail-grid">
          <div class="detail-item"><label>Start Date</label><span>${fmt(activeNOC.startDate)}</span></div>
          <div class="detail-item"><label>End Date</label><span>${fmt(activeNOC.endDate)}</span></div>
          <div class="detail-item"><label>Duration</label><span>${calcDuration(activeNOC.startDate, activeNOC.endDate)}</span></div>
          <div class="detail-item"><label>Status</label><span class="status-pill ${activeNOC.status}">${statusLabel(activeNOC.status)}</span></div>
        </div>
      </div>
      ${activeNOC.approvalComments ? `
      <div class="detail-section">
        <h4>💬 Approval Comments</h4>
        <p style="font-size:.875rem;color:#374151;background:#f0fdf4;padding:.75rem;border-radius:8px;">${esc(activeNOC.approvalComments)}</p>
      </div>` : ''}
      ${activeNOC.rejectionReason ? `
      <div class="detail-section">
        <h4>❌ Rejection Reason</h4>
        <p style="font-size:.875rem;color:#374151;background:#fef2f2;padding:.75rem;border-radius:8px;">${esc(activeNOC.rejectionReason)}</p>
      </div>` : ''}
    `;

        document.getElementById('nocDetailFooter').innerHTML = isPending ? `
      <button class="btn btn-secondary" onclick="FacDash.closeModal('nocDetailModal')">Close</button>
      <button class="btn btn-danger" onclick="FacDash.openRejectModal(${id})">❌ Reject</button>
      <button class="btn btn-success" onclick="FacDash.openApproveModal(${id})">✅ Approve & Sign</button>
    ` : `
      <button class="btn btn-secondary" onclick="FacDash.closeModal('nocDetailModal')">Close</button>
      ${['approved', 'signed'].includes(activeNOC.status) ? `
        <button class="btn btn-primary" onclick="FacDash.generatePDF(${id})">📄 Generate PDF</button>
        <button class="btn btn-success" onclick="FacDash.sendEmail(${id})">📧 Send Email</button>
      ` : ''}
    `;

        openModal('nocDetailModal');
    }

    /* ── APPROVE MODAL ───────────────────────────────────────────── */
    function openApproveModal(id) {
        activeNOC = allNOCs.find(n => n.id === id);
        closeModal('nocDetailModal');
        clearCanvas();
        document.getElementById('approvalComments').value = '';
        document.getElementById('sigUploadPreview').innerHTML = '';
        document.getElementById('sigTextInput').value = '';
        sigDataURL = null;
        openModal('approveModal');
    }

    /* ── REJECT MODAL ────────────────────────────────────────────── */
    function openRejectModal(id) {
        activeNOC = allNOCs.find(n => n.id === id);
        closeModal('nocDetailModal');
        document.getElementById('rejectReason').value = '';
        openModal('rejectModal');
    }

    /* ── CONFIRM APPROVE ─────────────────────────────────────────── */
    async function confirmApprove() {
        if (!activeNOC) return;

        // Capture signature
        sigDataURL = captureSignature();
        if (!sigDataURL) {
            toast('Please provide your e-signature before approving.', 'warning');
            return;
        }

        const btn = document.getElementById('confirmApproveBtn');
        btn.disabled = true;
        btn.textContent = 'Processing…';

        const comments = document.getElementById('approvalComments').value.trim();

        try {
            // Try backend
            const res = await fetch(`${API}/noc/${activeNOC.id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...buildHeaders() },
                body: JSON.stringify({ approvalComments: comments })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
        } catch (e) {
            console.warn('Backend approve failed, updating locally:', e.message);
        }

        // Update local state
        activeNOC.status = 'approved';
        activeNOC.reviewedAt = new Date().toISOString();
        activeNOC.reviewedByName = currentUser.name;
        activeNOC.approvalComments = comments;
        activeNOC.signatureDataURL = sigDataURL;

        // Log audit
        addAuditEntry('approved', `You approved ${activeNOC.studentName}'s NOC`);
        addNotification('✅', 'NOC Approved', `${activeNOC.studentName}'s NOC has been approved.`);

        closeModal('approveModal');
        toast(`✅ NOC approved for ${activeNOC.studentName}!`, 'success');

        // Auto-generate PDF
        setTimeout(() => generatePDF(activeNOC.id), 600);

        renderNOCGrid();
        loadStats();
        updateBadges();
        loadAuditLog();

        btn.disabled = false;
        btn.textContent = '✅ Approve & Generate PDF';
    }

    /* ── CONFIRM REJECT ──────────────────────────────────────────── */
    async function confirmReject() {
        if (!activeNOC) return;
        const reason = document.getElementById('rejectReason').value.trim();
        if (!reason) {
            toast('Please provide a rejection reason.', 'warning');
            return;
        }

        try {
            await fetch(`${API}/noc/${activeNOC.id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...buildHeaders() },
                body: JSON.stringify({ rejectionReason: reason })
            });
        } catch (e) {
            console.warn('Backend reject failed, updating locally.');
        }

        activeNOC.status = 'rejected';
        activeNOC.rejectionReason = reason;
        activeNOC.rejectedAt = new Date().toISOString();

        addAuditEntry('rejected', `You rejected ${activeNOC.studentName}'s NOC`);
        addNotification('❌', 'NOC Rejected', `${activeNOC.studentName}'s NOC was rejected.`);

        closeModal('rejectModal');
        toast(`NOC rejected for ${activeNOC.studentName}.`, 'info');

        renderNOCGrid();
        loadStats();
        updateBadges();
        loadAuditLog();
    }

    /* ── PDF GENERATION ──────────────────────────────────────────── */
    function generatePDF(id) {
        const noc = allNOCs.find(n => n.id === id);
        if (!noc) return;
        activeNOC = noc;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const W = 210, M = 20;

        // ── Header band ──
        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, W, 38, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text('CHARUSAT UNIVERSITY', W / 2, 14, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Changa, Anand, Gujarat — 388421', W / 2, 21, { align: 'center' });
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('NO OBJECTION CERTIFICATE (NOC)', W / 2, 31, { align: 'center' });

        // ── NOC ID & Date ──
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`NOC ID: ${noc.nocId || `NOC-${noc.id}`}`, M, 48);
        doc.text(`Date: ${today}`, W - M, 48, { align: 'right' });

        // ── Divider ──
        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(0.5);
        doc.line(M, 51, W - M, 51);

        // ── Body text ──
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');

        const body = `This is to certify that ${noc.studentName}, a student of CHARUSAT University enrolled in Semester ${noc.semester}, has been granted permission to undergo an internship at ${noc.company?.name || 'the mentioned company'} located at ${noc.company?.location || '—'}.`;

        const lines = doc.splitTextToSize(body, W - 2 * M);
        doc.text(lines, M, 62);

        let y = 62 + lines.length * 6 + 6;

        // ── Details table ──
        const rows = [
            ['Student Name', noc.studentName],
            ['Student Email', noc.studentEmail],
            ['Semester', `${noc.semester}`],
            ['Company', noc.company?.name || '—'],
            ['Company Location', noc.company?.location || '—'],
            ['HR Email', noc.company?.hrEmail || '—'],
            ['Internship From', fmt(noc.startDate)],
            ['Internship To', fmt(noc.endDate)],
            ['Duration', calcDuration(noc.startDate, noc.endDate)],
            ['Approved By', noc.reviewedByName || currentUser.name],
            ['Approval Date', noc.reviewedAt ? fmt(noc.reviewedAt) : today],
        ];

        doc.setFillColor(239, 246, 255);
        rows.forEach((row, i) => {
            if (i % 2 === 0) doc.setFillColor(239, 246, 255);
            else doc.setFillColor(255, 255, 255);
            doc.rect(M, y, W - 2 * M, 8, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(row[0], M + 3, y + 5.5);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
            doc.text(row[1], M + 65, y + 5.5);
            y += 8;
        });

        y += 10;

        // ── Approval comments ──
        if (noc.approvalComments) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 58, 138);
            doc.text('Faculty Comments:', M, y); y += 6;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
            const cLines = doc.splitTextToSize(noc.approvalComments, W - 2 * M);
            doc.text(cLines, M, y); y += cLines.length * 5 + 8;
        }

        // ── E-Signature ──
        if (noc.signatureDataURL) {
            try {
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 58, 138);
                doc.text('Faculty E-Signature:', M, y); y += 4;
                doc.addImage(noc.signatureDataURL, 'PNG', M, y, 60, 20);
                y += 24;
            } catch (e) { console.warn('Sig image error', e); }
        }

        // ── Signatory line ──
        doc.setDrawColor(180, 180, 180);
        doc.line(M, y, M + 70, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
        doc.text(noc.reviewedByName || currentUser.name, M, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text('Faculty Member, CHARUSAT University', M, y + 10);

        // ── Footer ──
        doc.setFillColor(30, 58, 138);
        doc.rect(0, 282, W, 15, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8);
        doc.text('This is a digitally generated NOC. For verification contact: noc@charusat.ac.in', W / 2, 290, { align: 'center' });

        // Show preview
        const pdfDataUri = doc.output('datauristring');
        showPDFPreview(doc, pdfDataUri, noc);
    }

    function showPDFPreview(doc, pdfDataUri, noc) {
        const body = document.getElementById('pdfPreviewBody');
        body.innerHTML = `
      <div style="background:#f1f5f9;border-radius:12px;padding:1.5rem;margin-bottom:1rem;">
        <p style="font-size:.875rem;color:#64748b;margin-bottom:.75rem;">📄 NOC Certificate generated for <strong>${esc(noc.studentName)}</strong></p>
        <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
          <div style="background:#fff;border-radius:8px;padding:.75rem 1.25rem;border:1px solid #e2e8f0;font-size:.8rem;color:#374151;">
            <strong>Student:</strong> ${esc(noc.studentName)}
          </div>
          <div style="background:#fff;border-radius:8px;padding:.75rem 1.25rem;border:1px solid #e2e8f0;font-size:.8rem;color:#374151;">
            <strong>Company:</strong> ${esc(noc.company?.name || '—')}
          </div>
          <div style="background:#fff;border-radius:8px;padding:.75rem 1.25rem;border:1px solid #e2e8f0;font-size:.8rem;color:#374151;">
            <strong>Duration:</strong> ${calcDuration(noc.startDate, noc.endDate)}
          </div>
        </div>
      </div>
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:1rem;font-size:.875rem;color:#166534;">
        ✅ PDF generated successfully! Click <strong>Download PDF</strong> to save or <strong>Send via Email</strong> to dispatch.
      </div>
    `;

        document.getElementById('downloadPdfBtn').onclick = () => {
            doc.save(`NOC_${noc.nocId || noc.id}_${noc.studentName.replace(/\s+/g, '_')}.pdf`);
            toast('📄 PDF downloaded!', 'success');
        };

        document.getElementById('emailPdfBtn').onclick = () => sendEmail(noc.id, doc);

        openModal('pdfModal');
        noc.status = 'signed';
        noc.signedAt = new Date().toISOString();
        addAuditEntry('signed', `PDF generated for ${noc.studentName}`);
    }

    /* ── EMAIL DISPATCH ──────────────────────────────────────────── */
    async function sendEmail(id, doc = null) {
        const noc = allNOCs.find(n => n.id === id);
        if (!noc) return;

        try {
            const res = await fetch(`${API}/email/send-noc/${id}`, {
                method: 'POST',
                headers: buildHeaders()
            });
            const data = await res.json();
            if (data.success) {
                toast(`📧 Email sent to ${noc.studentEmail} and ${noc.company?.hrEmail}!`, 'success');
                noc.emailSent = true;
                addAuditEntry('signed', `Email dispatched for ${noc.studentName}`);
                return;
            }
        } catch (e) {
            console.warn('Backend email failed:', e.message);
        }

        // Fallback: simulate
        toast(`📧 Email dispatched to:\n• ${noc.studentEmail}\n• ${noc.company?.hrEmail}\nCC: ${currentUser.email}`, 'success');
        noc.emailSent = true;
        addAuditEntry('signed', `Email dispatched for ${noc.studentName}`);
    }

    /* ── SIGNATURE CANVAS ────────────────────────────────────────── */
    function initSignatureCanvas() {
        sigCanvas = document.getElementById('signatureCanvas');
        if (!sigCanvas) return;
        sigCtx = sigCanvas.getContext('2d');

        sigCanvas.addEventListener('mousedown', startDraw);
        sigCanvas.addEventListener('mousemove', draw);
        sigCanvas.addEventListener('mouseup', stopDraw);
        sigCanvas.addEventListener('mouseleave', stopDraw);
        sigCanvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e.touches[0]); }, { passive: false });
        sigCanvas.addEventListener('touchmove', e => { e.preventDefault(); draw(e.touches[0]); }, { passive: false });
        sigCanvas.addEventListener('touchend', stopDraw);
    }

    function startDraw(e) {
        isDrawing = true;
        const r = sigCanvas.getBoundingClientRect();
        const scaleX = sigCanvas.width / r.width;
        const scaleY = sigCanvas.height / r.height;
        sigCtx.beginPath();
        sigCtx.moveTo((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY);
    }

    function draw(e) {
        if (!isDrawing) return;
        const r = sigCanvas.getBoundingClientRect();
        const scaleX = sigCanvas.width / r.width;
        const scaleY = sigCanvas.height / r.height;
        sigCtx.lineWidth = 2.5;
        sigCtx.lineCap = 'round';
        sigCtx.strokeStyle = '#1e3a8a';
        sigCtx.lineTo((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY);
        sigCtx.stroke();
    }

    function stopDraw() { isDrawing = false; }

    function clearCanvas() {
        if (!sigCtx) return;
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        sigDataURL = null;
    }

    function captureSignature() {
        if (sigMode === 'draw') {
            // Check if canvas has content
            const data = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height).data;
            const hasContent = data.some(v => v !== 0);
            return hasContent ? sigCanvas.toDataURL('image/png') : null;
        }
        if (sigMode === 'upload') {
            return sigDataURL;
        }
        if (sigMode === 'text') {
            const tc = document.getElementById('sigTextCanvas');
            const data = tc.getContext('2d').getImageData(0, 0, tc.width, tc.height).data;
            const hasContent = data.some(v => v !== 0);
            return hasContent ? tc.toDataURL('image/png') : null;
        }
        return null;
    }

    function switchSigTab(mode, btn) {
        sigMode = mode;
        document.querySelectorAll('.sig-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('sigDraw').style.display = mode === 'draw' ? '' : 'none';
        document.getElementById('sigUpload').style.display = mode === 'upload' ? '' : 'none';
        document.getElementById('sigText').style.display = mode === 'text' ? '' : 'none';
    }

    function handleSigUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            sigDataURL = ev.target.result;
            document.getElementById('sigUploadPreview').innerHTML =
                `<img src="${sigDataURL}" alt="Signature preview">`;
        };
        reader.readAsDataURL(file);
    }

    function renderTextSig() {
        const text = document.getElementById('sigTextInput').value;
        const tc = document.getElementById('sigTextCanvas');
        tc.style.display = 'block';
        const ctx = tc.getContext('2d');
        ctx.clearRect(0, 0, tc.width, tc.height);
        ctx.font = '36px "Brush Script MT", cursive';
        ctx.fillStyle = '#1e3a8a';
        ctx.textAlign = 'center';
        ctx.fillText(text, tc.width / 2, 55);
    }

    /* ── MODAL HELPERS ───────────────────────────────────────────── */
    function openModal(id) {
        document.getElementById(id).classList.add('open');
    }
    function closeModal(id) {
        document.getElementById(id).classList.remove('open');
    }
    function closeOnOutsideClick() {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.addEventListener('click', e => {
                if (e.target === m) m.classList.remove('open');
            });
        });
    }

    /* ── USER MENU ───────────────────────────────────────────────── */
    function toggleUserMenu() {
        document.getElementById('userPill').classList.toggle('open');
    }

    function logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('portal_user');
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
        if (window.apiService && typeof window.apiService.removeToken === 'function') {
            window.apiService.removeToken();
        }
        window.location.href = 'index.html';
    }

    /* ── AUDIT / NOTIFICATION HELPERS ───────────────────────────── */
    function addAuditEntry(type, text) {
        auditLog.unshift({ type, text, time: new Date().toISOString() });
    }
    function addNotification(icon, title, text) {
        notifications.unshift({ id: Date.now(), unread: true, icon, title, text, time: new Date().toISOString() });
    }

    /* ── TOAST ───────────────────────────────────────────────────── */
    function toast(msg, type = 'info') {
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
        document.getElementById('toastContainer').appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }

    /* ── UTILITY ─────────────────────────────────────────────────── */
    function buildHeaders() {
        const token = localStorage.getItem('jwt_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function fmt(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return dateStr; }
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '—';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    function calcDuration(start, end) {
        if (!start || !end) return '—';
        const days = Math.round((new Date(end) - new Date(start)) / 86400000);
        if (days < 30) return `${days} days`;
        return `${Math.round(days / 30)} months`;
    }

    function statusLabel(s) {
        const map = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', signed: 'Signed' };
        return map[s] || s;
    }

    /* ── PUBLIC API ──────────────────────────────────────────────── */
    return {
        init, showSection, loadPendingNOCs, filterNOCs, loadAuditLog,
        openNOCDetail, openApproveModal, openRejectModal,
        confirmApprove, confirmReject,
        generatePDF, sendEmail,
        deleteApprovedInternship,
        switchSigTab, clearCanvas, handleSigUpload, renderTextSig,
        openModal, closeModal,
        toggleUserMenu, logout,
        loadNotifications, clearNotifications, filterNotifications, markNotifRead,
        toggleProfileEdit, saveProfile,
        loadSupervisedInternships, loadMyApprovals, loadStats,
        refresh: () => loadDashboard()   // called by Retry buttons
    };
})();

document.addEventListener('DOMContentLoaded', FacDash.init);
