/**
 * GOOGLE AUTHENTICATION MODULE
 * Handles Google Sign-In with domain-based role validation
 */

const googleAuth = {
    // ═══════════════════════════════════════════════════════════════════════════════
    // CRITICAL: Google Client ID Configuration
    // ═══════════════════════════════════════════════════════════════════════════════
    // This Client ID MUST MATCH the GOOGLE_CLIENT_ID in backend/.env
    // 
    // To get your Client ID:
    // 1. Go to: https://console.cloud.google.com/apis/credentials
    // 2. Create OAuth 2.0 Client ID (Web application)
    // 3. Copy the Client ID and paste it BOTH here AND in backend/.env
    // 4. See GOOGLE_OAUTH_SETUP.md for detailed instructions
    //
    // Current Client ID: <YOUR_GOOGLE_CLIENT_ID>
    // ═══════════════════════════════════════════════════════════════════════════════
    clientId: '868247521851-cp87aelb3mrkkm33kot9htpflj0ti2ds.apps.googleusercontent.com',

    // Domain validation rules
    // Students: @charusat.edu.in (or subdomains like @it.charusat.edu.in)
    // Faculty/Admin: @charusat.ac.in (or subdomains like @ce.charusat.ac.in)
    domainRules: {
        student: {
            domains: ['edu'],
            fullDomain: 'charusat.edu.in',
            example: '@charusat.edu.in or @it.charusat.edu.in'
        },
        faculty: {
            domains: ['ac'],
            fullDomain: 'charusat.ac.in',
            example: '@charusat.ac.in or @ce.charusat.ac.in'
        },
        admin: {
            domains: ['ac'],
            fullDomain: 'charusat.ac.in',
            example: '@charusat.ac.in'
        }
    },

    /**
     * Initialize Google Authentication
     */
    init: function () {
        // Check if Google Identity Services is loaded
        if (typeof google === 'undefined') {
            console.error('Google Identity Services not loaded');
            return;
        }

        console.log('Google Auth initialized');
    },

    /**
     * Render Google Sign-In button
     * @param {string} elementId - Container element ID
     * @param {string} role - Selected role (student, faculty, admin)
     */
    renderSignInButton: function (elementId, role) {
        if (typeof google === 'undefined') {
            console.error('Google Identity Services not loaded');
            return;
        }

        console.log('🔑 Initializing Google Sign-In with Client ID:', this.clientId);

        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response) => this.handleCredentialResponse(response, role),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
            document.getElementById(elementId),
            {
                theme: 'outline',
                size: 'large',
                width: 300,
                text: 'signin_with',
                shape: 'rectangular'
            }
        );
    },

    /**
     * Handle Google Sign-In response
     * @param {Object} response - Google credential response
     * @param {string} selectedRole - Role selected by user
     */
    handleCredentialResponse: async function (response, selectedRole) {
        try {
            // ✅ STEP 1: Raw response debug
            console.log(response);
            console.log('🔐 Google Sign-In Response:', response);
            console.log('📧 Selected Role:', selectedRole);

            const credential = response.credential;
            console.log('🎫 JWT Token (first 50 chars):', credential.substring(0, 50) + '...');

            // Decode and log token payload for debugging
            const payload = this.parseJwt(credential);
            console.log('👤 Decoded Token Payload:', {
                email: payload.email,
                name: payload.name,
                aud: payload.aud,
                email_verified: payload.email_verified
            });

            // ✅ STEP 3: Verify audience matches CLIENT_ID
            console.log('🔍 Audience Check:');
            console.log('  Frontend CLIENT_ID:', this.clientId);
            console.log('  Token audience (aud):', payload.aud);
            console.log('  Match:', payload.aud === this.clientId ? '✅ YES' : '❌ NO - MISMATCH!');

            // Show loading state
            portalUtils.showNotification('Authenticating...', 'info');

            // Call backend API to verify and authenticate
            console.log('📡 Sending to backend for verification...');
            const result = await apiService.googleAuth(credential, selectedRole);
            console.log('✅ Backend Response:', result);

            if (result.success) {
                // Store user data
                portalUtils.saveToStorage('currentUser', result.user);

                // Show success message
                portalUtils.showNotification('Login successful! Redirecting...', 'success');

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    this.redirectToDashboard(selectedRole);
                }, 1000);
            } else {
                console.error('❌ Authentication Failed:', result.message);
                // Handle authentication failure (domain validation, etc.)
                this.blockInvalidLogin(result.email || payload.email || '', selectedRole, result.message);
            }

        } catch (error) {
            console.error('💥 Error handling Google Sign-In:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            // Check for network/backend errors
            if (error.message.includes('fetch') || 
                error.message.includes('NetworkError') || 
                error.message.includes('Failed to fetch') ||
                error.name === 'TypeError' ||
                error.message.toLowerCase().includes('network') ||
                error.message.toLowerCase().includes('connection') ||
                error.message.toLowerCase().includes('refused')) {
                
                console.error('🚨 BACKEND NOT RESPONDING - This is expected during startup or if backend crashed');
                console.error('   Backend should be running on http://localhost:5000');
                console.error('   If using npm start, backend starts automatically but may take a few seconds');
                
                portalUtils.showNotification(
                    '⚠️ Authentication server temporarily unavailable.\n\n' +
                    'If you just started the application:\n' +
                    '• Wait a few seconds for backend to finish starting\n' +
                    '• Then try signing in again\n\n' +
                    'If backend is not running:\n' +
                    '• Run: npm start (from project root)\n' +
                    '• Or run: cd backend && npm run dev',
                    'warning'
                );
                
                // Don't block the page - just show the error
                return;
            }

            // Check if it's a domain validation error
            if (error.message && error.message.includes('Invalid email domain')) {
                const emailMatch = error.message.match(/[\w.-]+@[\w.-]+\.\w+/);
                const email = emailMatch ? emailMatch[0] : '';
                this.blockInvalidLogin(email, selectedRole, error.message);
            } else {
                // Show the actual error message
                portalUtils.showNotification(
                    `Authentication failed: ${error.message}\n\nCheck console for details.`,
                    'error'
                );
            }
        }
    },

    /**
     * Parse JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded payload
     */
    parseJwt: function (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    },

    /**
     * Validate email domain against role
     * @param {string} email - User email
     * @param {string} role - Selected role
     * @returns {boolean} Is valid
     */
    validateEmailDomain: function (email, role) {
        const domainType = this.extractDomainType(email);
        const allowedDomains = this.domainRules[role] || [];

        // Basic domain type check
        const basicCheck = allowedDomains.includes(domainType);
        
        // CHARUSAT-specific full domain check
        const charusatCheck = this.isValidCHARUSATEmail(email, role);
        
        return basicCheck && charusatCheck;
    },

    /**
     * Validate full email domain for CHARUSAT
     * @param {string} email - Email address
     * @param {string} role - User role (student, faculty, admin)
     * @returns {boolean} Is valid CHARUSAT email
     */
    isValidCHARUSATEmail: function (email, role) {
        const parts = email.split('@');
        if (parts.length !== 2) return false;

        const domain = parts[1].toLowerCase();
        
        // For students: must end with charusat.edu.in (allows subdomains)
        if (role === 'student') {
            return domain.endsWith('charusat.edu.in');
        }
        
        // For faculty/admin: must end with charusat.ac.in (allows subdomains)
        if (role === 'faculty' || role === 'admin') {
            return domain.endsWith('charusat.ac.in');
        }
        
        return false;
    },

    /**
     * Extract domain type from email
     * For multi-level domains like charusat.edu.in, extract 'edu'
     * For charusat.ac.in, extract 'ac'
     * @param {string} email - User email
     * @returns {string} Domain type (edu, ac, com, etc.)
     */
    extractDomainType: function (email) {
        const parts = email.split('@');
        if (parts.length !== 2) return '';

        const domain = parts[1].toLowerCase();
        const domainParts = domain.split('.');

        // For multi-level domains (e.g., charusat.edu.in)
        // Get second-to-last part if it's edu/ac/org/co, otherwise last part
        if (domainParts.length >= 3) {
            const secondLast = domainParts[domainParts.length - 2];
            // Check if second-to-last is an institution type
            if (['edu', 'ac', 'org', 'co', 'gov'].includes(secondLast)) {
                return secondLast;
            }
        }

        // Default: return last part (TLD)
        return domainParts[domainParts.length - 1];
    },

    /**
     * Block invalid login and show error
     * @param {string} email - User email
     * @param {string} role - Selected role
     * @param {string} customMessage - Custom error message from backend
     */
    blockInvalidLogin: function (email, role, customMessage = null) {
        const domainType = this.extractDomainType(email);

        let errorMessage = customMessage;

        if (!errorMessage) {
            if (role === 'student') {
                errorMessage = `Please login using your official CHARUSAT student email.\n\nYou tried to login with: ${email}\n\nStudents must use emails ending with @charusat.edu.in\n(Subdomains like @it.charusat.edu.in are also allowed)`;
            } else if (role === 'faculty' || role === 'admin') {
                errorMessage = `Please login using your official CHARUSAT ${role} email.\n\nYou tried to login with: ${email}\n\n${role.charAt(0).toUpperCase() + role.slice(1)} must use emails ending with @charusat.ac.in\n(Subdomains like @ce.charusat.ac.in are also allowed)`;
            }
        }

        // Show error message
        portalUtils.showNotification(errorMessage, 'error');

        // Display in modal for better visibility
        this.showDomainErrorModal(email, role, domainType);

        // Force logout
        this.logout();
    },

    /**
     * Show domain validation error modal
     * @param {string} email - User email
     * @param {string} role - Selected role
     * @param {string} actualDomain - Actual domain
     */
    showDomainErrorModal: function (email, role, actualDomain) {
        const requiredDomain = role === 'student' ? 'charusat.edu.in' : 'charusat.ac.in';
        const modal = document.createElement('div');
        modal.className = 'domain-error-modal';
        modal.innerHTML = `
            <div class="domain-error-content">
                <div class="error-icon">⚠️</div>
                <h3>Email Domain Mismatch</h3>
                <p class="error-message">
                    You selected <strong>${role.toUpperCase()}</strong> but logged in with an invalid email domain.
                </p>
                <div class="email-info">
                    <p><strong>Your Email:</strong> ${email}</p>
                    <p><strong>Your Domain:</strong> .${actualDomain}</p>
                    <p><strong>Required Domain:</strong> @${requiredDomain} (or subdomains)</p>
                </div>
                <div class="error-instructions">
                    <h4>To login as ${role}:</h4>
                    <p>Please use an email address ending with <strong>@${requiredDomain}</strong></p>
                    <p>Subdomains are also accepted (e.g., ${role === 'student' ? '@it.charusat.edu.in' : '@ce.charusat.ac.in'})</p>
                    <p class="example">Example: ${role === 'student' ? '24it068@charusat.edu.in' : 'john.smith@charusat.ac.in'}</p>
                </div>
                <button class="btn btn-primary" onclick="googleAuth.closeErrorModal()">Try Again</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            this.closeErrorModal();
        }, 10000);
    },

    /**
     * Close error modal
     */
    closeErrorModal: function () {
        const modal = document.querySelector('.domain-error-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Store authenticated user in localStorage
     * @param {Object} userData - User data from Google
     */
    storeAuthenticatedUser: function (userData) {
        const user = {
            id: this.generateUserId(userData.selectedRole),
            google_id: userData.google_id,
            name: userData.name,
            email: userData.email,
            role: userData.selectedRole,
            email_verified: userData.email_verified,
            login_provider: 'google',
            domain_type: this.extractDomainType(userData.email),
            profile_picture: userData.profile_picture,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
        };

        // Store in localStorage
        portalUtils.saveToStorage('currentUser', user);

        // Also add to users collection
        this.addToUsersCollection(user);

        console.log('User authenticated:', user.email);
    },

    /**
     * Generate user ID based on role
     * @param {string} role - User role
     * @returns {string} User ID
     */
    generateUserId: function (role) {
        const prefix = role === 'student' ? 'STU' : role === 'faculty' ? 'FAC' : 'ADM';
        const timestamp = Date.now();
        return `${prefix}-${timestamp}`;
    },

    /**
     * Add user to users collection
     * @param {Object} user - User object
     */
    addToUsersCollection: function (user) {
        let users = portalUtils.getFromStorage('users') || [];

        // Check if user already exists (by google_id)
        const existingIndex = users.findIndex(u => u.google_id === user.google_id);

        if (existingIndex !== -1) {
            // Update existing user
            users[existingIndex] = { ...users[existingIndex], ...user, last_login: new Date().toISOString() };
        } else {
            // Add new user
            users.push(user);
        }

        portalUtils.saveToStorage('users', users);
    },

    /**
     * Redirect to appropriate dashboard
     * @param {string} role - User role
     */
    redirectToDashboard: function (role) {
        const dashboards = {
            student: 'student-dashboard.html',
            faculty: 'faculty-dashboard.html',
            admin: 'admin-dashboard.html'
        };

        const dashboard = dashboards[role] || 'index.html';

        portalUtils.showNotification('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = dashboard;
        }, 1000);
    },

    /**
     * Logout user
     */
    logout: function () {
        // Clear localStorage
        localStorage.removeItem('currentUser');

        // Sign out from Google
        if (typeof google !== 'undefined') {
            google.accounts.id.disableAutoSelect();
        }

        console.log('User logged out');
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} Is authenticated
     */
    isAuthenticated: function () {
        const user = portalUtils.getCurrentUser();
        return user && user.login_provider === 'google' && user.email_verified;
    },

    /**
     * Get current authenticated user
     * @returns {Object|null} User object
     */
    getCurrentUser: function () {
        return portalUtils.getCurrentUser();
    }
};

// Export for global use
window.googleAuth = googleAuth;
