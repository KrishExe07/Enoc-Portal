/**
 * LOGIN PAGE JAVASCRIPT
 * Handles user authentication and role-based redirection
 */

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    // Demo users database (simulated) - removed for production
    const demoUsers = {};

    /**
     * Handle form submission
     */
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const userRole = document.getElementById('userRole').value;
            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            // Validation
            if (!userRole) {
                portalUtils.showNotification('Please select a role', 'warning');
                return;
            }

            if (!userId) {
                portalUtils.showNotification('Please enter your user ID or email', 'warning');
                return;
            }
            // Require college email
            if (!portalUtils.validateEmail(userId) || !userId.toLowerCase().endsWith('@charusat.edu.in')) {
                portalUtils.showNotification('Please use your college email (ending with @charusat.edu.in)', 'warning');
                return;
            }

            if (!password) {
                portalUtils.showNotification('Please enter your password', 'warning');
                return;
            }

            // Authenticate user
            authenticateUser(userId, password, userRole, rememberMe);
        });
    }

    /**
     * Authenticate user credentials
     * @param {string} userId - User email or ID
     * @param {string} password - User password
     * @param {string} role - Selected role
     * @param {boolean} rememberMe - Remember login status
     */
    function authenticateUser(userId, password, role, rememberMe) {
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            // Check if user exists (demo users first, then seeded users)
            let user = demoUsers[userId.toLowerCase()];

            if (!user) {
                const seeded = portalUtils.getFromStorage('users') || [];
                user = seeded.find(u => u.email && u.email.toLowerCase() === userId.toLowerCase());
            }

            if (!user) {
                portalUtils.showNotification('Invalid credentials. Please try again.', 'error');
                resetButton();
                return;
            }

            // Verify password
            if (user.password !== password) {
                portalUtils.showNotification('Incorrect password. Please try again.', 'error');
                resetButton();
                return;
            }

            // Verify role matches
            if (user.role !== role) {
                portalUtils.showNotification(`This account is registered as ${user.role}, not ${role}`, 'error');
                resetButton();
                return;
            }

            // Authentication successful
            const userData = {
                email: userId.toLowerCase(),
                name: user.name,
                id: user.id,
                role: user.role,
                department: user.department,
                year: user.year || null,
                designation: user.designation || null,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };

            // Store user data
            portalUtils.saveToStorage('currentUser', userData);

            // Show success message
            portalUtils.showNotification('Login successful! Redirecting...', 'success');

            // Redirect based on role
            setTimeout(() => {
                redirectToDashboard(user.role);
            }, 1000);
        }, 1000);

        function resetButton() {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Redirect to appropriate dashboard based on role
     * @param {string} role - User role
     */
    function redirectToDashboard(role) {
        const dashboards = {
            student: 'student-dashboard.html',
            faculty: 'faculty-dashboard.html',
            admin: 'admin-dashboard.html'
        };

        window.location.href = dashboards[role] || 'index.html';
    }

    /**
     * Handle forgot password link
     */
    const forgotPasswordLink = document.querySelector('a[href="forgot-password.html"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            portalUtils.showNotification('Password reset functionality will be available soon', 'info');
        });
    }

    /**
     * Handle register link
     */
    const registerLink = document.querySelector('a[href="register.html"]');
    if (registerLink) {
        registerLink.addEventListener('click', function (e) {
            e.preventDefault();
            portalUtils.showNotification('Registration is currently managed by the administration office', 'info');
        });
    }

    /**
     * Auto-fill demo credentials on role selection
     */
    const userRoleSelect = document.getElementById('userRole');
    // Auto-fill removed for production
    if (userRoleSelect) {
        userRoleSelect.addEventListener('change', function () {
            // Role selection handler - auto-fill disabled
        });
    }

    /**
     * Toggle between Login and Signup forms
     */
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const loginFormElement = document.getElementById('loginForm');
    const signupFormElement = document.getElementById('signupForm');
    const demoCredentials = document.getElementById('demoCredentials');

    let isLoginMode = true;

    if (toggleLink) {
        toggleLink.addEventListener('click', function (e) {
            e.preventDefault();

            if (isLoginMode) {
                // Switch to Signup mode
                loginFormElement.style.display = 'none';
                signupFormElement.style.display = 'block';
                demoCredentials.style.display = 'none';
                formTitle.textContent = 'Create Account';
                formSubtitle.textContent = 'Register to access the portal';
                toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleLink">Login here</a>';
                isLoginMode = false;
            } else {
                // Switch to Login mode
                loginFormElement.style.display = 'block';
                signupFormElement.style.display = 'none';
                demoCredentials.style.display = 'block';
                formTitle.textContent = 'Portal Login';
                formSubtitle.textContent = 'Select your role and login to continue';
                toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleLink">Sign up here</a>';
                isLoginMode = true;
            }

            // Re-attach event listener to the new toggle link
            const newToggleLink = document.getElementById('toggleLink');
            if (newToggleLink) {
                newToggleLink.addEventListener('click', arguments.callee);
            }
        });
    }

    /**
     * Handle Signup Form Submission
     */
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const role = document.getElementById('signupRole').value;
            const name = document.getElementById('signupName').value.trim();
            const mobile = document.getElementById('signupMobile').value.trim();

            // Validation
            if (!role) {
                portalUtils.showNotification('Please select a role', 'warning');
                return;
            }

            if (!name) {
                portalUtils.showNotification('Please enter your full name', 'warning');
                return;
            }

            if (!mobile) {
                portalUtils.showNotification('Please enter your mobile number', 'warning');
                return;
            }

            // Validate mobile number format (10 digits)
            const mobilePattern = /^[0-9]{10}$/;
            if (!mobilePattern.test(mobile)) {
                portalUtils.showNotification('Please enter a valid 10-digit mobile number', 'warning');
                return;
            }

            // Show loading state
            const submitBtn = signupFormElement.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            // Simulate API call delay
            setTimeout(() => {
                // Generate user ID and email
                const timestamp = Date.now();
                const userId = role === 'student' ? `STU-${timestamp}` : `FAC-${timestamp}`;
                const email = `${name.toLowerCase().replace(/\s+/g, '.')}@charusat.edu.in`;
                const defaultPassword = 'password123'; // In real app, this would be set by user

                // Create new user object
                const newUser = {
                    email: email,
                    password: defaultPassword,
                    role: role,
                    name: name,
                    mobile: mobile,
                    id: userId,
                    department: role === 'student' ? 'Not Assigned' : 'Not Assigned',
                    year: role === 'student' ? 'Not Assigned' : null,
                    designation: role === 'faculty' ? 'Not Assigned' : null,
                    createdAt: new Date().toISOString()
                };

                // Get existing users from storage
                let users = portalUtils.getFromStorage('users') || [];

                // Check if email already exists
                const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
                if (emailExists) {
                    portalUtils.showNotification('An account with this name already exists. Please use a different name.', 'error');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    return;
                }

                // Add new user to storage
                users.push(newUser);
                portalUtils.saveToStorage('users', users);

                // Show success message
                portalUtils.showNotification(`Account created successfully! Your email is: ${email}. Default password: ${defaultPassword}`, 'success');

                // Reset form
                signupFormElement.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                // Switch back to login form after 3 seconds
                setTimeout(() => {
                    toggleLink.click();
                }, 3000);
            }, 1000);
        });
    }
});
