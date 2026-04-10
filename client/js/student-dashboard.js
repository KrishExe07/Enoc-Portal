/**
 * STUDENT DASHBOARD JAVASCRIPT
 * Handles student dashboard functionality
 */

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication first
    const currentUser = portalUtils.getCurrentUser();
    const notificationReadStorageKey = `student_notification_reads_${currentUser?.id || 'unknown'}`;

    if (!currentUser || currentUser.role !== 'student') {
        portalUtils.showNotification('Unauthorized access', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // Initialize UI immediately
    initializeDashboard();
    setupNavigation();
    setupEventHandlers();

    // Load applications from API
    loadApplications();

    /**
     * Initialize dashboard with user data
     */
    function initializeDashboard() {
        // Set user name in header and sections
        const userNameElements = document.querySelectorAll('.user-name, #userName');
        userNameElements.forEach(el => {
            el.textContent = currentUser.name;
        });

        const studentNameElements = document.querySelectorAll('#studentName');
        studentNameElements.forEach(el => {
            el.textContent = currentUser.name.split(' ')[0];
        });

        // Populate profile form
        populateProfile();
        loadProfileFromAPI();
        loadNotifications();
    }

    /**
     * Setup sidebar navigation
     */
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        const sections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Remove active class from all links and sections
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                // Add active class to clicked link
                this.classList.add('active');

                // Show corresponding section
                const sectionId = this.getAttribute('data-section');
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');

                    // Load section-specific data
                    if (sectionId === 'my-applications') {
                        loadAllApplications();
                    } else if (sectionId === 'application-status') {
                        loadApplicationStatus();
                    } else if (sectionId === 'upload-documents') {
                        loadUploadDocuments();
                    } else if (sectionId === 'internship-list') {
                        loadInternships();
                    } else if (sectionId === 'notifications') {
                        loadNotifications();
                        updateNotificationBadge();
                    }
                }
            });
        });
    }

    /**
     * Setup event handlers
     */
    function setupEventHandlers() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (confirm('Are you sure you want to logout?')) {
                    portalUtils.logout();
                }
            });
        }

        // Application type button - NOC Request
        const nocBtn = document.getElementById('nocApplicationBtn');

        if (nocBtn) {
            nocBtn.addEventListener('click', function () {
                window.location.href = 'noc-request.html';
            });
        }

        // Mark all notifications as read
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async function () {
                try {
                    const response = await apiService.getMyNOCs();
                    if (!response.success || !Array.isArray(response.requests) || response.requests.length === 0) {
                        portalUtils.showNotification('No notifications to mark as read', 'info');
                        return;
                    }

                    const notificationIds = response.requests.map(buildNotificationId);
                    portalUtils.saveToStorage(notificationReadStorageKey, notificationIds);
                    loadNotifications();
                    portalUtils.showNotification('All notifications marked as read', 'success');
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
                    portalUtils.showNotification('Unable to update notifications right now', 'error');
                }
            });
        }

        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                const mobile = (profileForm.querySelector('[name="mobile"]')?.value || '').trim();
                const semesterValue = (profileForm.querySelector('[name="semester"]')?.value || '').trim();
                const department = (profileForm.querySelector('[name="department"]')?.value || '').trim();

                if (mobile && !/^\d{10}$/.test(mobile)) {
                    portalUtils.showNotification('Please enter a valid 10-digit mobile number', 'warning');
                    return;
                }

                if (semesterValue && (Number(semesterValue) < 1 || Number(semesterValue) > 8)) {
                    portalUtils.showNotification('Semester must be between 1 and 8', 'warning');
                    return;
                }

                const payload = {
                    mobile,
                    semester: semesterValue ? Number(semesterValue) : null,
                    department
                };

                const response = await apiService.updateProfile(payload);
                if (!response.success) {
                    portalUtils.showNotification(response.message || 'Failed to update profile', 'error');
                    return;
                }

                if (response.user) {
                    const mergedUser = { ...currentUser, ...response.user };
                    portalUtils.saveToStorage('currentUser', mergedUser);
                }

                portalUtils.showNotification('Profile updated successfully', 'success');
                populateProfile(response.user || null);
            });
        }
    }

    /**
     * Load recent applications for dashboard
     */
    async function loadApplications() {
        const tbody = document.querySelector('#overview .data-table tbody');

        if (!tbody) return;

        try {
            const response = await apiService.getMyNOCs();

            if (response.success) {
                const requests = response.requests || [];
                
                // Update stats cards
                const statTotal = document.getElementById('statTotal');
                const statPending = document.getElementById('statPending');
                const statApproved = document.getElementById('statApproved');
                const statRejected = document.getElementById('statRejected');
                
                if (statTotal) statTotal.textContent = requests.length;
                if (statPending) statPending.textContent = requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length;
                if (statApproved) statApproved.textContent = requests.filter(r => ['approved', 'signed'].includes(r.status)).length;
                if (statRejected) statRejected.textContent = requests.filter(r => r.status === 'rejected').length;

                if (requests.length > 0) {
                    // Show only recent 3 applications
                    const recentApplications = requests.slice(0, 3);
                    tbody.innerHTML = recentApplications.map(app => {
                        const actionButton = app.status === 'approved' || app.status === 'signed'
                            ? `<button class="btn btn-sm btn-success" onclick="downloadNOCPDF('${app.id}')">Download PDF</button>`
                            : `<button class="btn btn-sm btn-secondary" onclick="viewApplication('${app.id}')">View</button>`;
                        
                        return `
                            <tr>
                                <td>${app.nocId || app.id}</td>
                                <td>NOC Request</td>
                                <td>${portalUtils.formatDate(app.createdAt || app.submittedAt)}</td>
                                <td><span class="status-badge status-${app.status}">${capitalizeStatus(app.status)}</span></td>
                                <td>${actionButton}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No applications found</td></tr>';
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No applications found</td></tr>';
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:#f59e0b;">Unable to load applications. Please try again.</td></tr>';
        }
    }

    /**
     * Load all applications for My Applications section
     */
    async function loadAllApplications() {
        const tbody = document.getElementById('applicationsTableBody');

        if (!tbody) return;

        try {
            const response = await apiService.getMyNOCs();

            if (response.success && response.requests.length > 0) {
                tbody.innerHTML = response.requests.map(app => {
                    // Show Download PDF button only for approved NOCs
                    const actionButton = app.status === 'approved' || app.status === 'signed'
                        ? `<button class="btn btn-sm btn-success" onclick="downloadNOCPDF('${app.id}')">Download PDF</button>`
                        : `<button class="btn btn-sm btn-secondary" onclick="viewApplication('${app.id}')">View</button>`;
                    
                    return `
                        <tr>
                            <td>${app.nocId || app.id}</td>
                            <td>NOC Request</td>
                            <td>${app.company?.name || 'Unknown Company'}</td>
                            <td>${portalUtils.formatDate(app.createdAt || app.submittedAt)}</td>
                            <td><span class="status-badge status-${app.status}">${capitalizeStatus(app.status)}</span></td>
                            <td>${actionButton}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No applications submitted yet</td></tr>';
            }
        } catch (error) {
            console.error('Error loading all applications:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading applications</td></tr>';
        }
    }

    /**
     * Get stored applications from localStorage
     * @returns {Array} Array of applications
     */
    function getStoredApplications() {
        let applications = portalUtils.getFromStorage('applications') || [];

        // Filter applications for current user
        applications = applications.filter(app => app.userId === currentUser.id);

        // Sort by date (newest first)
        applications.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

        return applications;
    }

    /**
     * Populate profile form with user data
     */
    function populateProfile(profileUser = null) {
        const form = document.getElementById('profileForm');
        if (!form) return;

        const source = profileUser || currentUser;

        // Set form values
        const fields = {
            fullName: source.name,
            studentId: source.studentId || source.id,
            email: source.email,
            department: source.department,
            semester: source.semester,
            mobile: source.mobile
        };

        Object.keys(fields).forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.value = fields[fieldName] || '';
            }
        });
    }

    async function loadProfileFromAPI() {
        const response = await apiService.getProfile();
        if (!response.success || !response.user) {
            return;
        }

        const mergedUser = { ...currentUser, ...response.user };
        portalUtils.saveToStorage('currentUser', mergedUser);
        populateProfile(response.user);
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - Input string
     * @returns {string} Capitalized string
     */
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Capitalize and format status for display
     * @param {string} status - Status string
     * @returns {string} Formatted status
     */
    function capitalizeStatus(status) {
        if (status === 'submitted') return 'Pending';
        if (status === 'under_review') return 'Under Review';
        return capitalizeFirst(status);
    }

    function getNotificationMeta(status) {
        if (status === 'approved' || status === 'signed') {
            return { icon: '✅', iconClass: 'success', title: 'Application Approved' };
        }
        if (status === 'rejected') {
            return { icon: '❌', iconClass: 'danger', title: 'Application Rejected' };
        }
        if (status === 'under_review') {
            return { icon: '⏳', iconClass: 'warning', title: 'Under Faculty Review' };
        }
        return { icon: 'ℹ️', iconClass: 'info', title: 'Application Submitted' };
    }

    function buildNotificationId(app) {
        return `${app.id}-${app.status}-${app.updatedAt || app.createdAt || ''}`;
    }

    function toRelativeTime(dateValue) {
        if (!dateValue) return 'Just now';

        const deltaMs = Date.now() - new Date(dateValue).getTime();
        const minutes = Math.floor(deltaMs / 60000);
        const hours = Math.floor(deltaMs / 3600000);
        const days = Math.floor(deltaMs / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    function escapeHtml(value) {
        if (!value) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadNotifications() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        list.innerHTML = '<p class="text-muted">Loading notifications...</p>';

        try {
            const response = await apiService.getMyNOCs();
            if (!response.success || !Array.isArray(response.requests) || response.requests.length === 0) {
                list.innerHTML = '<p class="text-muted">No notifications yet. Submit a NOC request to start receiving updates.</p>';
                updateNotificationBadge();
                return;
            }

            const readIds = portalUtils.getFromStorage(notificationReadStorageKey) || [];

            list.innerHTML = response.requests
                .slice()
                .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                .map(app => {
                    const meta = getNotificationMeta(app.status);
                    const notifId = buildNotificationId(app);
                    const isUnread = !readIds.includes(notifId);
                    const appRef = app.nocId || app.id;
                    const companyName = app.company?.name || 'your selected company';

                    return `
                        <div class="notification-item ${isUnread ? 'unread' : ''}">
                            <div class="notification-icon ${meta.iconClass}">${meta.icon}</div>
                            <div class="notification-content">
                                <h5>${meta.title}</h5>
                                <p>Your NOC request ${escapeHtml(appRef)} for ${escapeHtml(companyName)} is currently ${escapeHtml(capitalizeStatus(app.status).toLowerCase())}.</p>
                                <span class="notification-time">${toRelativeTime(app.updatedAt || app.createdAt)}</span>
                            </div>
                        </div>
                    `;
                })
                .join('');

            updateNotificationBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
            list.innerHTML = '<p class="text-danger">Unable to load notifications right now.</p>';
        }
    }

    /**
     * Load application status timeline
     */
    async function loadApplicationStatus() {
        const container = document.getElementById('statusListDashboard');
        if (!container) return;

        try {
            const response = await apiService.getMyNOCs();
            
            if (response.success && response.requests.length > 0) {
                let html = '';
                response.requests.forEach(app => {
                    const statusClass = app.status === 'approved' ? 'success' : 
                                      app.status === 'rejected' ? 'danger' : 
                                      app.status === 'under_review' ? 'warning' : 'info';
                    
                    html += `
                        <div class="status-card">
                            <div class="status-header">
                                <div>
                                    <h4>${app.nocId || app.id}</h4>
                                    <p>${app.company?.name || 'Unknown Company'}</p>
                                </div>
                                <span class="status-badge status-${app.status}">${capitalizeStatus(app.status)}</span>
                            </div>
                            <div class="status-timeline">
                                <div class="timeline-item active">
                                    <div class="timeline-icon">✓</div>
                                    <div class="timeline-content">
                                        <h5>Application Submitted</h5>
                                        <p>${portalUtils.formatDate(app.createdAt)}</p>
                                    </div>
                                </div>
                                <div class="timeline-item ${app.status !== 'submitted' ? 'active' : ''}">
                                    <div class="timeline-icon">${app.status !== 'submitted' ? '✓' : '⏱'}</div>
                                    <div class="timeline-content">
                                        <h5>Under Review</h5>
                                        <p>${app.status !== 'submitted' ? 'Reviewed by faculty' : 'Awaiting review'}</p>
                                    </div>
                                </div>
                                <div class="timeline-item ${app.status === 'approved' || app.status === 'signed' ? 'active' : ''}">
                                    <div class="timeline-icon">${app.status === 'approved' || app.status === 'signed' ? '✓' : app.status === 'rejected' ? '✗' : '○'}</div>
                                    <div class="timeline-content">
                                        <h5>${app.status === 'approved' || app.status === 'signed' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Final Decision'}</h5>
                                        <p>${app.status === 'approved' || app.status === 'rejected' || app.status === 'signed' ? portalUtils.formatDate(app.updatedAt) : 'Pending'}</p>
                                    </div>
                                </div>
                            </div>
                            ${app.approvalComments ? `<div class="comments-box"><strong>Faculty Comments:</strong> ${app.approvalComments}</div>` : ''}
                            ${app.rejectionReason ? `<div class="comments-box" style="background-color: #fee2e2; border-left-color: #dc2626;"><strong>Rejection Reason:</strong> ${app.rejectionReason}</div>` : ''}
                            ${app.status === 'approved' || app.status === 'signed' ? `
                                <div style="margin-top: 1rem;">
                                    <button class="btn btn-success" onclick="downloadNOCPDF('${app.id}')">📄 Download PDF</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p class="text-muted">No applications found. Submit a new NOC request to get started.</p>';
            }
        } catch (error) {
            console.error('Error loading application status:', error);
            container.innerHTML = '<p class="text-danger">Error loading application status. Please try again.</p>';
        }
    }

    /**
     * Load upload documents interface
     */
    async function loadUploadDocuments() {
        const container = document.getElementById('uploadListDashboard');
        if (!container) return;

        try {
            const response = await apiService.getMyNOCs();
            
            if (response.success && response.requests.length > 0) {
                let html = '';
                response.requests.forEach(app => {
                    const docs = (app.data && app.data.documents) ? app.data.documents : [];
                    
                    html += `
                        <div class="upload-card">
                            <div class="upload-header">
                                <div>
                                    <h4>${app.nocId || app.id}</h4>
                                    <p>${app.company?.name || 'Unknown Company'}</p>
                                </div>
                                <span class="status-badge status-${app.status}">${capitalizeFirst(app.status)}</span>
                            </div>
                            <div class="document-list">
                                ${docs.length > 0 ? 
                                    docs.map(doc => `
                                        <div class="document-item">
                                            <span class="doc-icon">📄</span>
                                            <a href="${doc.dataUrl}" target="_blank">${doc.name}</a>
                                        </div>
                                    `).join('') : 
                                    '<p class="text-muted">No documents uploaded yet</p>'
                                }
                            </div>
                            ${app.status !== 'approved' && app.status !== 'rejected' ? `
                                <div class="upload-actions">
                                    <input type="file" accept="application/pdf" id="file-${app.id}" style="display: none;">
                                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('file-${app.id}').click()">
                                        📎 Choose File
                                    </button>
                                    <button class="btn btn-success btn-sm" onclick="uploadDocument('${app.id}')">
                                        ⬆️ Upload
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p class="text-muted">No applications found. Submit a new NOC request first.</p>';
            }
        } catch (error) {
            console.error('Error loading upload documents:', error);
            container.innerHTML = '<p class="text-danger">Error loading documents. Please try again.</p>';
        }
    }

    /**
     * Load internships list
     */
    async function loadInternships() {
        const container = document.getElementById('internshipGrid');
        if (!container) return;

        // Sample internship data - in production, this would come from API
        const internships = [
            {
                id: 1,
                company: 'Google India',
                position: 'Software Engineering Intern',
                location: 'Bangalore, India',
                duration: '3 months',
                stipend: '₹50,000/month',
                description: 'Work on real-world projects with Google Cloud Platform team.'
            },
            {
                id: 2,
                company: 'Microsoft',
                position: 'Data Science Intern',
                location: 'Hyderabad, India',
                duration: '6 months',
                stipend: '₹45,000/month',
                description: 'Analyze large datasets and build ML models for Azure services.'
            },
            {
                id: 3,
                company: 'Amazon',
                position: 'Frontend Developer Intern',
                location: 'Mumbai, India',
                duration: '4 months',
                stipend: '₹40,000/month',
                description: 'Build responsive web interfaces for Amazon Prime Video.'
            },
            {
                id: 4,
                company: 'Infosys',
                position: 'Full Stack Developer Intern',
                location: 'Pune, India',
                duration: '6 months',
                stipend: '₹25,000/month',
                description: 'Develop enterprise applications using modern web technologies.'
            },
            {
                id: 5,
                company: 'TCS',
                position: 'AI/ML Intern',
                location: 'Chennai, India',
                duration: '3 months',
                stipend: '₹20,000/month',
                description: 'Research and implement AI solutions for business problems.'
            },
            {
                id: 6,
                company: 'Wipro',
                position: 'Cloud Computing Intern',
                location: 'Bangalore, India',
                duration: '5 months',
                stipend: '₹22,000/month',
                description: 'Deploy and manage cloud infrastructure on AWS and Azure.'
            }
        ];

        let html = '';
        internships.forEach(intern => {
            html += `
                <div class="internship-card">
                    <div class="internship-header">
                        <h4>${intern.position}</h4>
                        <span class="company-name">${intern.company}</span>
                    </div>
                    <div class="internship-details">
                        <p><strong>📍 Location:</strong> ${intern.location}</p>
                        <p><strong>⏱️ Duration:</strong> ${intern.duration}</p>
                        <p><strong>💰 Stipend:</strong> ${intern.stipend}</p>
                        <p class="description">${intern.description}</p>
                    </div>
                    <div class="internship-actions">
                        <button class="btn btn-primary" onclick="applyForInternship(${intern.id})">Apply Now</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    /**
     * Update notification badge count
     */
    function updateNotificationBadge() {
        const unreadItems = document.querySelectorAll('#notificationsList .notification-item.unread');
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = unreadItems.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // Expose functions to window for onclick handlers
    window.uploadDocument = function(appId) {
        const input = document.getElementById('file-' + appId);
        if (!input.files || !input.files[0]) {
            portalUtils.showNotification('Please select a PDF file to upload', 'warning');
            return;
        }
        const file = input.files[0];
        if (file.type !== 'application/pdf') {
            portalUtils.showNotification('Only PDF files are allowed', 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            // Here you would normally upload to server via API
            portalUtils.showNotification('Document uploaded successfully', 'success');
            loadUploadDocuments(); // Reload the section
        };
        reader.readAsDataURL(file);
    };

    window.applyForInternship = function(internshipId) {
        portalUtils.showNotification('Redirecting to NOC request form...', 'info');
        setTimeout(() => {
            window.location.href = 'noc-request.html?internship=' + internshipId;
        }, 1000);
    };

    /**
     * Download NOC PDF for approved requests
     * @param {string} nocId - NOC request ID
     */
    window.downloadNOCPDF = async function(nocId) {
        try {
            portalUtils.showNotification('Checking approval status...', 'info');

            // Use the dedicated endpoint — backend enforces "approved only" rule
            const response = await apiService.downloadNOCPDF(nocId);

            if (!response.success) {
                // Backend returned 403 if not approved yet
                if (response.status === 403) {
                    const displayStatus = response.status?.replace('_', ' ') || 'pending';
                    portalUtils.showNotification(
                        `PDF not available yet — your NOC is still ${displayStatus}. Please wait for faculty approval.`,
                        'warning'
                    );
                } else {
                    portalUtils.showNotification(response.message || 'Failed to fetch NOC details', 'error');
                }
                return;
            }

            const nocRequest = response.nocRequest;
            portalUtils.showNotification('Generating PDF...', 'info');

            // Generate PDF with approved data
            const studentData = {
                name: nocRequest.studentName || currentUser.name,
                // Prefer enrollmentNo stored on the NOC record (e.g. "24IT068"),
                // fall back to studentId returned from auth (also full format).
                id: nocRequest.enrollmentNo || currentUser.studentId || currentUser.id,
                department: nocRequest.student?.department || currentUser.department || 'Computer Science'
            };

            const pdf = pdfGenerator.generateNOCPDF(nocRequest, nocRequest.company, studentData);
            if (pdf) {
                const filename = `NOC_${nocRequest.nocId}_${(nocRequest.studentName || currentUser.name).replace(/\s+/g, '_')}.pdf`;
                pdfGenerator.downloadPDF(pdf, filename);
                portalUtils.showNotification('✅ PDF downloaded successfully!', 'success');
            } else {
                throw new Error('PDF generation failed. Is jsPDF loaded?');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            portalUtils.showNotification(error.message || 'Error downloading PDF', 'error');
        }
    };
});

/**
 * View application details (global function)
 * @param {string} applicationId - Application ID
 */
function viewApplication(applicationId) {
    const applications = portalUtils.getFromStorage('applications') || [];
    const application = applications.find(app => app.id === applicationId);

    if (!application) {
        portalUtils.showNotification('Application not found', 'error');
        return;
    }

    // Create modal or redirect to details page
    alert(`Application Details:\n\nID: ${application.id}\nType: ${application.type}\nStatus: ${application.status}\nSubmitted: ${portalUtils.formatDate(application.submittedDate)}`);
}
