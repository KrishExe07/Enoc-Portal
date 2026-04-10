/**
 * ADMIN DASHBOARD — Complete Workflow JS
 * Handles: Company CRUD, Application management, User management, Audit log
 * Role: Admin ONLY — NO approval/rejection/signing authority
 */

'use strict';

const AdmDash = (() => {

    /* ── STATE ──────────────────────────────────────────────────── */
    let currentUser = null;
    let allCompanies = [];
    let pendingCompanies = [];
    let allApplications = [];
    let filteredApps = [];
    let allUsers = [];
    let auditLog = [];
    let editingCompanyId = null;
    let notifications = [];
    let notifFilter = 'all';
    let profileEditMode = false;
    let pipelineChartInstance = null;
    let departmentChartInstance = null;

    /* ── BACKEND URL ─────────────────────────────────────────────── */
    const API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:5000/api';

    /* ── INIT ────────────────────────────────────────────────────── */
    async function init() {
        currentUser = getUser();
        if (!currentUser || currentUser.role !== 'admin') {
            toast('Access denied. Administrator login required.', 'error');
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            return;
        }

        // Initialize UI
        populateUserUI();
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

    function populateUserUI() {
        const name = currentUser.name || 'Administrator';
        const email = currentUser.email || 'admin@charusat.ac.in';
        const init = name.charAt(0).toUpperCase();

        document.getElementById('userNameHeader').textContent = name;
        document.getElementById('userAvatarHeader').textContent = init;
        document.getElementById('sidebarAvatar').textContent = init;
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = email;
        document.getElementById('welcomeName').textContent = name.split(' ')[0];

        document.getElementById('profileAvatarLg').textContent = init;
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = email;

        // Profile detail cards
        document.getElementById('profileDepartment').textContent = currentUser.department || 'Not set';
        document.getElementById('profileDesignation').textContent = currentUser.designation || 'Not set';
        document.getElementById('profileMobile').textContent = currentUser.mobile || 'Not set';
        document.getElementById('profileProvider').textContent = currentUser.login_provider === 'direct' ? 'Direct Login' : 'Google OAuth';
        document.getElementById('profileLastLogin').textContent = currentUser.last_login
            ? new Date(currentUser.last_login).toLocaleString() : '—';
    }

    async function loadDashboard() {
        await Promise.all([loadCompanies(), loadApplications()]);
        loadUsers();
        loadAuditLog();
        loadStats();
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

        document.getElementById('userPill').classList.remove('open');

        // Lazy-load section data
        if (name === 'notifications') renderNotifications();
        if (name === 'profile') refreshProfileStats();
    }

    /* ── STATS ───────────────────────────────────────────────────── */
    function loadStats() {
        document.getElementById('statCompanies').textContent = allCompanies.filter(c => c.approved).length;
        document.getElementById('statPendingCo').textContent = pendingCompanies.length;
        document.getElementById('statApplications').textContent = allApplications.length;
        document.getElementById('statApproved').textContent = allApplications.filter(a => ['approved', 'signed'].includes(a.status)).length;

        const pendingCount = pendingCompanies.length;
        const badge = document.getElementById('pendingCompaniesBadge');
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
        document.getElementById('pendingCoCount').textContent = pendingCount > 0 ? `(${pendingCount})` : '';
        // Render graphical charts after metrics are resolved
        renderAnalyticsCharts();
    }

    /* ── ANALYTICS CHARTS ────────────────────────────────────────── */
    function renderAnalyticsCharts() {
        if (typeof Chart === 'undefined') return;

        // 1. Pipeline Chart (Doughnut)
        const pipelineCtx = document.getElementById('pipelineChart');
        if (pipelineCtx) {
            if (pipelineChartInstance) pipelineChartInstance.destroy();
            
            const stats = {
                submitted: allApplications.filter(a => a.status === 'submitted').length,
                review: allApplications.filter(a => a.status === 'under_review').length,
                approved: allApplications.filter(a => a.status === 'approved' || a.status === 'signed').length,
                rejected: allApplications.filter(a => a.status === 'rejected').length
            };

            pipelineChartInstance = new Chart(pipelineCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Submitted', 'Under Review', 'Approved', 'Rejected'],
                    datasets: [{
                        data: [stats.submitted, stats.review, stats.approved, stats.rejected],
                        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                        tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
                    },
                    cutout: '65%'
                }
            });
        }

        // 2. Department Chart (Bar)
        const deptCtx = document.getElementById('departmentChart');
        if (deptCtx) {
            if (departmentChartInstance) departmentChartInstance.destroy();
            
            // For demo/simulated data if departments aren't populated strictly
            const deptCounts = {
                'IT': 0, 'CE': 0, 'CSE': 0, 'EC': 0, 'MECH': 0
            };
            
            allApplications.forEach(a => {
                let d = a.studentDepartment || a.department;
                if (!d && a.semester % 2 === 0) d = 'IT';
                else if (!d) d = 'CE';
                if (deptCounts[d] !== undefined) deptCounts[d]++;
                else deptCounts[d] = 1;
            });

            departmentChartInstance = new Chart(deptCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(deptCounts),
                    datasets: [{
                        label: 'Applications',
                        data: Object.values(deptCounts),
                        backgroundColor: '#6366f1',
                        borderRadius: 6,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' }, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    /* ── COMPANIES ───────────────────────────────────────────────── */
    async function loadCompanies() {
        try {
            const [approvedRes, pendingRes] = await Promise.all([
                fetch(`${API}/companies`, { headers: buildHeaders() }),
                fetch(`${API}/companies/pending`, { headers: buildHeaders() })
            ]);
            const approvedData = await approvedRes.json();
            const pendingData = await pendingRes.json();
            allCompanies = approvedData.success ? approvedData.companies : getDemoCompanies();
            pendingCompanies = pendingData.success ? pendingData.companies : [];
        } catch (e) {
            console.warn('Backend unavailable, using demo data');
            allCompanies = getDemoCompanies();
            pendingCompanies = getDemoPendingCompanies();
        }

        renderApprovedCompanies();
        renderPendingCompanies();
    }

    function getDemoCompanies() {
        return [
{ id: 1, name: 'Apex Softech Software Solutions', industry: 'Wordpress', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://www.apexsofttech.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 2, name: 'Bhavani Engineering', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://bhavaniengineering.co.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 3, name: 'Bista Solutions', industry: 'Odoo software', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.bistasolutions.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 4, name: 'Cilans System', industry: 'Data Analysis using Power BI', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.cilans.net/', approved: true, createdAt: new Date().toISOString() },
            { id: 5, name: 'Cypherox Technologies Pvt Ltd', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.cypherox.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 6, name: 'Differenz system', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.differenzsystem.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 7, name: 'ElectoMech', industry: 'AWS (Terraform, CICD pipeline)', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.electromech.info/', approved: true, createdAt: new Date().toISOString() },
            { id: 8, name: 'Evernet Technologies', industry: 'Website Development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://evernet-tech.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 9, name: 'F5systems', industry: 'Website development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.f5sys.com/home.php', approved: true, createdAt: new Date().toISOString() },
            { id: 10, name: 'FlyMeDigital Pvt Ltd', industry: 'E Commerce Platform Developement', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://flymedigital.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 11, name: 'GDO infotech Pvt Ltd (etherauthoriy)', industry: 'Web Application (php and mysql)', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://gdo.co.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 12, name: 'Global Bits', industry: 'Website development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://globalbits.net/', approved: true, createdAt: new Date().toISOString() },
            { id: 13, name: 'Grey desk Pvt Ltd', industry: 'Tracking app using QR code', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.greydeskinc.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 14, name: 'Gurukrupa Enterprise', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.indiamart.com/gurukrupa-enterprise-gujarat/profile.html', approved: true, createdAt: new Date().toISOString() },
            { id: 15, name: 'Horizon Webinfo Pvt Ltd', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://www.horizonwebinfo.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 16, name: 'I Can Infotech', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.icaninfotech.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 17, name: 'ICARUS SOLUTION', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://icarussolution.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 18, name: 'Inferno Infosec', industry: 'Web Application - Pen Testing and Reverse Engineering', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.infernoinfosec.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 19, name: 'Infosenseglobal', industry: 'AWS - ALEXA FOR SALES REPRESENTATIVE', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://infosenseglobal.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 20, name: 'Jeen Web Technologists pvt ltd', industry: 'Website development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://jeenweb.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 21, name: 'Jinee Infotech', industry: 'Django CMS', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://jinee.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 22, name: 'KPMG', industry: 'Data Analytics', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://home.kpmg/xx/en/home.html', approved: true, createdAt: new Date().toISOString() },
            { id: 23, name: 'L&T Power', industry: 'Process Improvement For Digital Signature Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.lntpower.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 24, name: 'Leadingindia', industry: 'Object Detection in Computer Vision', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.leadingindia.ai/', approved: true, createdAt: new Date().toISOString() },
            { id: 25, name: 'Logistic InfoTech', industry: 'Web application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.logisticinfotech.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 26, name: 'Mafatlal industries limited', industry: 'Web application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.mafatlals.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 27, name: 'Msquare Technologies', industry: 'Printshoppy App, Local Authentication App', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://msquaretec.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 28, name: 'My TechWay Solutions', industry: 'Android Application (Bookshelf App)', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.mytechway.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 29, name: 'Narayan Infotech', industry: 'Vegetable Ecommerce mobile application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://narayaninfotech.com/?i=1', approved: true, createdAt: new Date().toISOString() },
            { id: 30, name: 'Newtech Infosoft', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://newtechinfosoft.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 31, name: 'Profism Technology LLP', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.profism.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 32, name: 'Siccus Infotech', industry: 'Website development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://siccus.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 33, name: 'Softsecure infotech private limited', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://applydigitalsignature.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 34, name: 'Softvan Pvt Ltd', industry: 'Python with Machine learning (Athlete Pose Detection)', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://softvan.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 35, name: 'TechIndia infosolutions pvt ltd', industry: 'Android Application', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://techindiainfo.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 36, name: 'Time infotech', industry: 'ORGANIC-SEO DIGITAL MARKETING', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://timeifotech.com', approved: true, createdAt: new Date().toISOString() },
            { id: 37, name: 'TM Systems Pvt Ltd', industry: 'AWS (Text to speech using AWS Polly)', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.tmspl.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 38, name: 'Zonic digital inc', industry: 'Website development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://www.gozonic.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 39, name: 'Sciative Solutions Private Ltd', industry: 'Research Analyst Intern, Data Analytics', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.sciative.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 40, name: 'Light information Systems', industry: 'Mobile application development and NLP', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.nlpbots.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 41, name: 'Darwin Travel Tech Pvt Ltd', industry: 'General', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'https://www.tripdarwin.com/', approved: true, createdAt: new Date().toISOString() },
            { id: 42, name: 'Social 101', industry: 'Seo & Web Development', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://social101.in/', approved: true, createdAt: new Date().toISOString() },
            { id: 43, name: 'Exposys', industry: 'General', location: 'N/A', hrEmail: 'not-provided@company.local', website: 'http://www.exposysdata.in/', approved: true, createdAt: new Date().toISOString() }
        ];
    }

    function getDemoPendingCompanies() {
        return [
            { id: 10, name: 'StartupXYZ Pvt Ltd', industry: 'Fintech', location: 'Ahmedabad', hrEmail: 'hr@startupxyz.com', approved: false, createdAt: new Date().toISOString() }
        ];
    }

    function renderApprovedCompanies() {
        const list = document.getElementById('approvedCompaniesList');
        const search = (document.getElementById('companySearch')?.value || '').toLowerCase();
        const filtered = allCompanies.filter(c =>
            c.approved && (!search || c.name.toLowerCase().includes(search) || (c.location || '').toLowerCase().includes(search))
        );

        if (filtered.length === 0) {
            list.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🏢</div><h3>No approved companies</h3></div>`;
            return;
        }

        list.innerHTML = filtered.map(c => `
      <div class="company-card">
        <div class="company-card-header">
          <h4>${esc(c.name)}</h4>
          <span class="status-pill active">✅ Approved</span>
        </div>
        <div class="company-card-body">
          <div class="company-meta">🏭 <strong>Industry:</strong> ${esc(c.industry || '—')}</div>
          <div class="company-meta">📍 <strong>Location:</strong> ${esc(c.location || '—')}</div>
          <div class="company-meta">📧 <strong>HR Email:</strong> ${esc(c.hrEmail || '—')}</div>
          ${c.website ? `<div class="company-meta">🌐 <a href="${esc(c.website)}" target="_blank" style="color:#7c3aed;">${esc(c.website)}</a></div>` : ''}
        </div>
        <div class="company-card-footer">
          <button class="btn btn-outline btn-sm" onclick="AdmDash.openEditCompanyModal(${c.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="AdmDash.confirmDeleteCompany(${c.id})">🗑 Delete</button>
        </div>
      </div>
    `).join('');
    }

    function renderPendingCompanies() {
        const list = document.getElementById('pendingCompaniesList');
        if (pendingCompanies.length === 0) {
            list.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🎉</div><h3>No pending companies</h3></div>`;
            return;
        }

        list.innerHTML = pendingCompanies.map(c => `
      <div class="company-card">
        <div class="company-card-header" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);">
          <h4 style="color:#92400e;">${esc(c.name)}</h4>
          <span class="status-pill pending">⏳ Pending</span>
        </div>
        <div class="company-card-body">
          <div class="company-meta">🏭 <strong>Industry:</strong> ${esc(c.industry || '—')}</div>
          <div class="company-meta">📍 <strong>Location:</strong> ${esc(c.location || '—')}</div>
          <div class="company-meta">📧 <strong>HR Email:</strong> ${esc(c.hrEmail || '—')}</div>
          <div class="company-meta">🕐 Submitted: ${timeAgo(c.createdAt)}</div>
        </div>
        <div class="company-card-footer">
          <button class="btn btn-success btn-sm" onclick="AdmDash.approveCompany(${c.id})">✅ Approve</button>
          <button class="btn btn-outline btn-sm" onclick="AdmDash.openEditCompanyModal(${c.id}, true)">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="AdmDash.confirmDeleteCompany(${c.id}, true)">🗑 Reject</button>
        </div>
      </div>
    `).join('');
    }

    function filterCompanies() {
        renderApprovedCompanies();
    }

    /* ── ADD / EDIT COMPANY MODAL ────────────────────────────────── */
    function openAddCompanyModal() {
        editingCompanyId = null;
        document.getElementById('companyModalTitle').textContent = '➕ Add Company';
        document.getElementById('companyId').value = '';
        document.getElementById('companyName').value = '';
        document.getElementById('companyIndustry').value = '';
        document.getElementById('companyLocation').value = '';
        document.getElementById('companyWebsite').value = '';
        document.getElementById('companyHrEmail').value = '';
        document.getElementById('companyHrContact').value = '';
        document.getElementById('companyDescription').value = '';
        openModal('companyModal');
    }

    function openEditCompanyModal(id, isPending = false) {
        const co = [...allCompanies, ...pendingCompanies].find(c => c.id === id);
        if (!co) return;
        editingCompanyId = id;
        document.getElementById('companyModalTitle').textContent = '✏️ Edit Company';
        document.getElementById('companyId').value = id;
        document.getElementById('companyName').value = co.name || '';
        document.getElementById('companyIndustry').value = co.industry || '';
        document.getElementById('companyLocation').value = co.location || '';
        document.getElementById('companyWebsite').value = co.website || '';
        document.getElementById('companyHrEmail').value = co.hrEmail || '';
        document.getElementById('companyHrContact').value = co.hrContact || '';
        document.getElementById('companyDescription').value = co.description || '';
        openModal('companyModal');
    }

    async function saveCompany() {
        const name = document.getElementById('companyName').value.trim();
        const location = document.getElementById('companyLocation').value.trim();
        const hrEmail = document.getElementById('companyHrEmail').value.trim();

        if (!name || !location || !hrEmail) {
            toast('Please fill in all required fields.', 'warning');
            return;
        }

        const payload = {
            name,
            industry: document.getElementById('companyIndustry').value.trim(),
            location,
            website: document.getElementById('companyWebsite').value.trim(),
            hrEmail,
            hrContact: document.getElementById('companyHrContact').value.trim(),
            description: document.getElementById('companyDescription').value.trim(),
            approved: true
        };

        try {
            if (editingCompanyId) {
                // Edit existing
                await fetch(`${API}/companies/${editingCompanyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...buildHeaders() },
                    body: JSON.stringify(payload)
                });
                // Update local
                const idx = allCompanies.findIndex(c => c.id === editingCompanyId);
                if (idx > -1) allCompanies[idx] = { ...allCompanies[idx], ...payload };
                addAuditEntry('edited', `Company "${name}" updated`);
                toast(`✏️ Company "${name}" updated.`, 'success');
            } else {
                // Add new
                const res = await fetch(`${API}/companies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...buildHeaders() },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                const newCo = data.company || { id: Date.now(), ...payload, createdAt: new Date().toISOString() };
                allCompanies.push(newCo);
                addAuditEntry('edited', `Company "${name}" added`);
                toast(`✅ Company "${name}" added successfully.`, 'success');
            }
        } catch (e) {
            // Offline fallback
            if (editingCompanyId) {
                const idx = allCompanies.findIndex(c => c.id === editingCompanyId);
                if (idx > -1) allCompanies[idx] = { ...allCompanies[idx], ...payload };
            } else {
                allCompanies.push({ id: Date.now(), ...payload, createdAt: new Date().toISOString() });
            }
            addAuditEntry('edited', `Company "${name}" ${editingCompanyId ? 'updated' : 'added'} (offline)`);
            toast(`Company saved locally (backend offline).`, 'info');
        }

        closeModal('companyModal');
        renderApprovedCompanies();
        loadStats();
    }

    async function approveCompany(id) {
        try {
            await fetch(`${API}/companies/${id}/approve`, {
                method: 'PUT', headers: buildHeaders()
            });
        } catch (e) { console.warn('Backend unavailable'); }

        const co = pendingCompanies.find(c => c.id === id);
        if (co) {
            co.approved = true;
            allCompanies.push(co);
            pendingCompanies = pendingCompanies.filter(c => c.id !== id);
            addAuditEntry('edited', `Company "${co.name}" approved`);
            toast(`✅ "${co.name}" approved!`, 'success');
        }
        renderApprovedCompanies();
        renderPendingCompanies();
        loadStats();
    }

    async function uploadCompanyList() {
        const fileInput = document.getElementById('companyExcelFile');
        const statusText = document.getElementById('companyUploadStatus');

        if (!fileInput.files || fileInput.files.length === 0) {
            fileInput.click();
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('companyFile', file);

        statusText.textContent = 'Uploading...';

        try {
            const response = await fetch(`${API}/companies/upload-list`, {
                method: 'POST',
                headers: buildHeaders(),
                body: formData
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to upload company list');
            }

            const summary = `Imported: ${data.inserted || 0}, Updated: ${data.updated || 0}, Skipped: ${data.skipped || 0}`;
            statusText.textContent = summary;
            toast(`✅ Company list uploaded. ${summary}`, 'success');

            fileInput.value = '';
            await loadCompanies();
            loadStats();
        } catch (error) {
            statusText.textContent = error.message;
            toast(error.message, 'error');
        }
    }

    function confirmDeleteCompany(id, isPending = false) {
        const co = [...allCompanies, ...pendingCompanies].find(c => c.id === id);
        if (!co) return;
        showConfirm(
            '🗑 Delete Company',
            `Are you sure you want to delete "${co.name}"? This action cannot be undone.`,
            async () => {
                try {
                    await fetch(`${API}/companies/${id}`, { method: 'DELETE', headers: buildHeaders() });
                } catch (e) { console.warn('Backend unavailable'); }

                if (isPending) {
                    pendingCompanies = pendingCompanies.filter(c => c.id !== id);
                } else {
                    allCompanies = allCompanies.filter(c => c.id !== id);
                }
                addAuditEntry('deleted', `Company "${co.name}" deleted`);
                toast(`🗑 Company "${co.name}" deleted.`, 'info');
                renderApprovedCompanies();
                renderPendingCompanies();
                loadStats();
            }
        );
    }

    /* ── APPLICATIONS ────────────────────────────────────────────── */
    async function loadApplications() {
        const tbody = document.getElementById('applicationsBody');
        tbody.innerHTML = `<tr><td colspan="8"><div class="loading-state"><div class="spinner"></div> Loading…</div></td></tr>`;

        try {
            const res = await fetch(`${API}/noc/pending?status=`, { headers: buildHeaders() });
            const data = await res.json();
            allApplications = data.success ? data.requests : getDemoApplications();
        } catch (e) {
            allApplications = getDemoApplications();
        }

        filteredApps = [...allApplications];
        renderApplicationsTable();
    }

    function getDemoApplications() {
        return [
            { id: 1, nocId: 'NOC-2025-001', studentName: 'Arjun Patel', studentEmail: 'arjun.patel@charusat.edu.in', semester: 6, company: { name: 'TCS' }, startDate: '2025-05-01', endDate: '2025-07-31', status: 'submitted', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 2, nocId: 'NOC-2025-002', studentName: 'Priya Shah', studentEmail: 'priya.shah@charusat.edu.in', semester: 7, company: { name: 'Infosys' }, startDate: '2025-06-01', endDate: '2025-08-31', status: 'approved', createdAt: new Date(Date.now() - 172800000).toISOString() },
            { id: 3, nocId: 'NOC-2025-003', studentName: 'Rohan Mehta', studentEmail: 'rohan.mehta@charusat.edu.in', semester: 5, company: { name: 'Wipro' }, startDate: '2025-05-15', endDate: '2025-08-15', status: 'rejected', createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: 4, nocId: 'NOC-2025-004', studentName: 'Sneha Joshi', studentEmail: 'sneha.joshi@charusat.edu.in', semester: 8, company: { name: 'HCL' }, startDate: '2025-07-01', endDate: '2025-09-30', status: 'signed', createdAt: new Date(Date.now() - 259200000).toISOString() },
        ];
    }

    function filterApplications() {
        const status = document.getElementById('appFilterStatus').value;
        const search = document.getElementById('appFilterSearch').value.toLowerCase();
        filteredApps = allApplications.filter(a => {
            const matchStatus = !status || a.status === status;
            const matchSearch = !search ||
                (a.studentName || '').toLowerCase().includes(search) ||
                (a.company?.name || '').toLowerCase().includes(search) ||
                (a.nocId || '').toLowerCase().includes(search);
            return matchStatus && matchSearch;
        });
        renderApplicationsTable();
    }

    function renderApplicationsTable() {
        const tbody = document.getElementById('applicationsBody');
        if (filteredApps.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📄</div><h3>No applications found</h3></div></td></tr>`;
            return;
        }
        tbody.innerHTML = filteredApps.map(a => `
      <tr>
        <td><strong>${esc(a.nocId || `NOC-${a.id}`)}</strong></td>
        <td>${esc(a.studentName)}<br><small style="color:#94a3b8;">${esc(a.studentEmail)}</small></td>
        <td>${esc(a.company?.name || '—')}</td>
        <td>Sem ${a.semester}</td>
        <td style="white-space:nowrap;">${fmt(a.startDate)} – ${fmt(a.endDate)}</td>
        <td><span class="status-pill ${a.status}">${statusLabel(a.status)}</span></td>
        <td>${timeAgo(a.createdAt)}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="AdmDash.viewApplication(${a.id})">👁 View</button>
          <button class="btn btn-danger btn-sm" onclick="AdmDash.confirmDeleteApp(${a.id})">🗑</button>
        </td>
      </tr>
    `).join('');
    }

    function viewApplication(id) {
        const app = allApplications.find(a => a.id === id);
        if (!app) return;

        document.getElementById('appDetailTitle').textContent = app.nocId || `NOC-${id}`;
        document.getElementById('appDetailBody').innerHTML = `
      <div style="margin-bottom:1rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem .75rem;">
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Student</label><p style="font-size:.9rem;font-weight:600;">${esc(app.studentName)}</p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Email</label><p style="font-size:.9rem;">${esc(app.studentEmail)}</p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Company</label><p style="font-size:.9rem;font-weight:600;">${esc(app.company?.name || '—')}</p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Semester</label><p style="font-size:.9rem;">${app.semester}</p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Start Date</label><p style="font-size:.9rem;">${fmt(app.startDate)}</p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">End Date</label><p style="font-size:.9rem;">${fmt(app.endDate)}</p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Status</label><p><span class="status-pill ${app.status}">${statusLabel(app.status)}</span></p></div>
          <div><label style="font-size:.72rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">Submitted</label><p style="font-size:.9rem;">${timeAgo(app.createdAt)}</p></div>
        </div>
      </div>
      <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:.85rem;font-size:.82rem;color:#92400e;">
        ⚠️ <strong>Admin Note:</strong> You can view and delete this application, but only Faculty members can approve or reject it.
      </div>
    `;

        document.getElementById('deleteAppBtn').onclick = () => {
            closeModal('appDetailModal');
            confirmDeleteApp(id);
        };

        openModal('appDetailModal');
    }

    function confirmDeleteApp(id) {
        const app = allApplications.find(a => a.id === id);
        if (!app) return;
        showConfirm(
            '🗑 Delete Application',
            `Delete NOC application "${app.nocId || `NOC-${id}`}" for ${app.studentName}? This cannot be undone.`,
            async () => {
                try {
                    await fetch(`${API}/noc/${id}`, { method: 'DELETE', headers: buildHeaders() });
                } catch (e) { console.warn('Backend unavailable'); }
                allApplications = allApplications.filter(a => a.id !== id);
                filteredApps = filteredApps.filter(a => a.id !== id);
                addAuditEntry('deleted', `Application ${app.nocId || `NOC-${id}`} deleted`);
                toast(`🗑 Application deleted.`, 'info');
                renderApplicationsTable();
                loadStats();
            }
        );
    }

    /* ── USERS ───────────────────────────────────────────────────── */
    function loadUsers() {
        // Demo users (backend user list endpoint may vary)
        allUsers = [
            { name: currentUser.name, email: currentUser.email, role: 'admin', provider: 'direct', status: 'active', joined: currentUser.last_login || new Date().toISOString() },
            { name: 'Faculty User', email: 'faculty@charusat.ac.in', role: 'faculty', provider: 'direct', status: 'active', joined: new Date().toISOString() },
            { name: 'Arjun Patel', email: 'arjun.patel@charusat.edu.in', role: 'student', provider: 'google', status: 'active', joined: new Date(Date.now() - 86400000).toISOString() },
            { name: 'Priya Shah', email: 'priya.shah@charusat.edu.in', role: 'student', provider: 'google', status: 'active', joined: new Date(Date.now() - 172800000).toISOString() },
        ];
        renderUsersTable();
    }

    function renderUsersTable() {
        const tbody = document.getElementById('usersBody');
        tbody.innerHTML = allUsers.map(u => `
      <tr>
        <td><strong>${esc(u.name)}</strong></td>
        <td>${esc(u.email)}</td>
        <td>
          <span class="status-pill ${u.role === 'admin' ? 'approved' : u.role === 'faculty' ? 'submitted' : 'signed'}">
            ${u.role === 'admin' ? '⚙️ Admin' : u.role === 'faculty' ? '👨‍🏫 Faculty' : '🎓 Student'}
          </span>
        </td>
        <td>${u.provider === 'google' ? '🔵 Google' : '🔑 Direct'}</td>
        <td><span class="status-pill active">● Active</span></td>
        <td>${timeAgo(u.joined)}</td>
      </tr>
    `).join('');
    }

    /* ── AUDIT LOG ───────────────────────────────────────────────── */
    function loadAuditLog() {
        // Build from applications + local audit entries
        const events = [...auditLog];

        allApplications.forEach(a => {
            events.push({ type: 'submitted', text: `${a.studentName} submitted NOC for ${a.company?.name}`, time: a.createdAt });
            if (a.status === 'approved') events.push({ type: 'approved', text: `NOC approved for ${a.studentName}`, time: a.reviewedAt || a.createdAt });
            if (a.status === 'rejected') events.push({ type: 'rejected', text: `NOC rejected for ${a.studentName}`, time: a.rejectedAt || a.createdAt });
        });

        events.sort((a, b) => new Date(b.time) - new Date(a.time));

        const renderList = (id, limit) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (events.length === 0) {
                el.innerHTML = `<li class="empty-state"><div class="empty-icon">📋</div><h3>No activity yet</h3></li>`;
                return;
            }
            el.innerHTML = events.slice(0, limit).map(e => `
        <li class="audit-item">
          <div class="audit-dot ${e.type || 'default'}"></div>
          <div>
            <div class="audit-text">${esc(e.text)}</div>
            <div class="audit-time">${timeAgo(e.time)}</div>
          </div>
        </li>
      `).join('');
        };

        renderList('overviewAuditList', 8);
        renderList('fullAuditList', 50);
    }

    function addAuditEntry(type, text) {
        auditLog.unshift({ type, text, time: new Date().toISOString() });
        loadAuditLog();
    }

    /* ── NOTIFICATIONS (Enhanced) ──────────────────────────────── */
    function loadNotifications() {
        notifications = [];

        // Company notifications
        pendingCompanies.forEach(c => {
            notifications.push({
                id: `co-${c.id}`, unread: true,
                category: 'company',
                icon: '🏢',
                title: 'Company Pending Approval',
                text: `"${c.name}" needs your approval`,
                time: c.createdAt,
                actionLabel: 'Review',
                actionFn: `AdmDash.showSection('companies')`
            });
        });

        // Application notifications
        allApplications.forEach(a => {
            if (a.status === 'submitted') {
                notifications.push({
                    id: `app-${a.id}`, unread: true,
                    category: 'application',
                    icon: '📥',
                    title: 'New NOC Application',
                    text: `${a.studentName} submitted NOC for ${a.company?.name || 'a company'}`,
                    time: a.createdAt,
                    actionLabel: 'View',
                    actionFn: `AdmDash.viewApplication(${a.id})`
                });
            }
            if (a.status === 'approved' && a.reviewedAt) {
                notifications.push({
                    id: `app-apr-${a.id}`, unread: false,
                    category: 'application',
                    icon: '✅',
                    title: 'NOC Approved',
                    text: `${a.studentName}'s NOC approved by faculty`,
                    time: a.reviewedAt,
                    actionLabel: 'View',
                    actionFn: `AdmDash.viewApplication(${a.id})`
                });
            }
            if (a.status === 'rejected') {
                notifications.push({
                    id: `app-rej-${a.id}`, unread: false,
                    category: 'application',
                    icon: '❌',
                    title: 'NOC Rejected',
                    text: `${a.studentName}'s NOC was rejected`,
                    time: a.rejectedAt || a.createdAt,
                    actionLabel: 'View',
                    actionFn: `AdmDash.viewApplication(${a.id})`
                });
            }
        });

        // System notification
        notifications.push({
            id: 'sys-login', unread: false,
            category: 'system',
            icon: '🔐',
            title: 'Session Active',
            text: `Logged in as ${currentUser.name || 'Admin'} (${currentUser.email || ''})`,
            time: currentUser.last_login || new Date().toISOString(),
            actionLabel: null,
            actionFn: null
        });

        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
        renderNotifications();
        updateNotifBadges();
    }

    function renderNotifications() {
        const list = document.getElementById('notifList');
        const filtered = notifFilter === 'all'
            ? notifications
            : notifications.filter(n => n.category === notifFilter);

        const unreadCount = notifications.filter(n => n.unread).length;
        const summaryEl = document.getElementById('notifSummary');
        if (summaryEl) summaryEl.textContent = `${unreadCount} unread`;

        if (filtered.length === 0) {
            const emptyMsg = notifFilter === 'all'
                ? 'No notifications yet'
                : `No ${notifFilter} notifications`;
            list.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon">🔔</div>
                    <h3>${emptyMsg}</h3>
                    <p style="color:#94a3b8;font-size:.875rem;">System activities will appear here.</p>
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
                ${n.unread ? `<button class="btn-icon" onclick="AdmDash.markNotifRead('${n.id}')" title="Mark read">✓</button>` : ''}
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
        const countEl = document.getElementById('notifCount');
        const badgeEl = document.getElementById('notifBadge');
        if (countEl) countEl.textContent = unread;
        if (badgeEl) badgeEl.textContent = unread;
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
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
            toggleBtn.innerHTML = '✕ Cancel';
            toggleBtn.classList.remove('btn-primary');
            toggleBtn.classList.add('btn-secondary');
            statusDiv.style.display = 'none';

            document.getElementById('editDepartment').value = currentUser.department || '';
            document.getElementById('editDesignation').value = currentUser.designation || '';
            document.getElementById('editMobile').value = currentUser.mobile || '';
        } else {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            toggleBtn.innerHTML = '✏️ Edit Profile';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-primary');
        }
    }

    async function saveProfile(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('profileSaveBtn');
        const department = document.getElementById('editDepartment').value;
        const designation = document.getElementById('editDesignation').value;
        const mobile = document.getElementById('editMobile').value.trim();

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
                currentUser.department = department;
                currentUser.designation = designation;
                currentUser.mobile = mobile;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                populateUserUI();
                profileEditMode = true;
                toggleProfileEdit();
                showProfileStatus('Profile updated successfully!', 'success');
                toast('✅ Profile saved successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Profile save error:', err);
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
        const managed = allCompanies.length + allApplications.length;
        const el = document.getElementById('profileManagedCount');
        if (el) el.textContent = `${allCompanies.length} companies, ${allApplications.length} NOCs`;
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

    function showConfirm(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmActionBtn').onclick = () => {
            closeModal('confirmModal');
            onConfirm();
        };
        openModal('confirmModal');
    }

    /* ── USER MENU ───────────────────────────────────────────────── */
    function toggleUserMenu() {
        document.getElementById('userPill').classList.toggle('open');
    }

    function logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('portal_user');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
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
        try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return dateStr; }
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

    function statusLabel(s) {
        const map = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', signed: 'Signed', pending: 'Pending', active: 'Active' };
        return map[s] || s;
    }

    /* ── PUBLIC API ──────────────────────────────────────────────── */
    return {
        init, showSection, loadDashboard, loadStats,
        loadCompanies, filterCompanies, renderApprovedCompanies, renderPendingCompanies,
        openAddCompanyModal, openEditCompanyModal, saveCompany,
        approveCompany, confirmDeleteCompany, uploadCompanyList,
        loadApplications, filterApplications, viewApplication, confirmDeleteApp,
        loadUsers, loadAuditLog,
        loadNotifications, clearNotifications, filterNotifications, markNotifRead,
        toggleProfileEdit, saveProfile,
        openModal, closeModal, toggleUserMenu, logout
    };
})();

document.addEventListener('DOMContentLoaded', AdmDash.init);

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('companyExcelFile');
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                AdmDash.uploadCompanyList();
            }
        });
    }
});

