/**
 * MAIN JAVASCRIPT - Global Functions
 * College e-Governance Portal
 */

// Global utility functions
const utils = {
    /**
     * Format date to readable string
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate: function (date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
    },

    /**
     * Show notification message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info, warning)
     */
    showNotification: function (message, type = 'info') {
        // Inline color map — avoids `this` context issues when called as a callback
        const colorMap = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        const bgColor = colorMap[type] || colorMap.info;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        notification.style.cssText = [
            'position: fixed',
            'top: 20px',
            'right: 20px',
            'padding: 1rem 1.5rem',
            `background: ${bgColor}`,
            'color: white',
            'border-radius: 8px',
            'box-shadow: 0 4px 6px rgba(0,0,0,0.15)',
            'z-index: 10000',
            'font-family: Inter, sans-serif',
            'font-size: 0.9rem',
            'font-weight: 500',
            'max-width: 380px',
            'animation: slideIn 0.3s ease-in-out'
        ].join(';');

        document.body.appendChild(notification);

        // Auto-remove after 3.5 s
        setTimeout(function () {
            notification.style.animation = 'slideOut 0.3s ease-in-out';
            setTimeout(function () { notification.remove(); }, 300);
        }, 3500);
    },

    /**
     * Get notification background color based on type
     * @param {string} type - Notification type
     * @returns {string} Color code
     */
    getNotificationColor: function (type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    },

    /**
     * Validate email format
     * @param {string} email - Email address
     * @returns {boolean} True if valid
     */
    validateEmail: function (email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Generate unique application ID
     * @param {string} prefix - ID prefix (NOC, INT)
     * @returns {string} Generated ID
     */
    generateApplicationId: function (prefix) {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${year}-${random}`;
    },

    /**
     * Store data in localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    saveToStorage: function (key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    /**
     * Retrieve data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Retrieved data or null
     */
    getFromStorage: function (key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    removeFromStorage: function (key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    /**
     * Check if user is logged in
     * @returns {boolean} True if logged in
     */
    isLoggedIn: function () {
        return this.getFromStorage('currentUser') !== null;
    },

    /**
     * Get current user data
     * @returns {object|null} User data or null
     */
    getCurrentUser: function () {
        return this.getFromStorage('currentUser');
    },

    /**
     * Logout user — clears both session and JWT token
     */
    logout: function () {
        this.removeFromStorage('currentUser');
        // Also clear JWT token so stale tokens don't persist
        localStorage.removeItem('jwt_token');
        // Notify API service if available
        if (window.apiService && typeof window.apiService.removeToken === 'function') {
            window.apiService.removeToken();
        }
        window.location.href = 'index.html';
    }
};

// ── Global alias ─────────────────────────────────────────────────
// Many pages call `portalUtils.*` — make it an alias for `utils`
// so both names always work.
const portalUtils = utils;
window.utils = utils;
window.portalUtils = utils;

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('College e-Governance Portal - Loaded');

    // Check authentication for protected pages
    const protectedPages = ['student-dashboard.html', 'faculty-dashboard.html', 'admin-dashboard.html', 'application-status.html', 'upload-documents.html', 'application-review.html', 'records-reports.html', 'noc-request.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && !utils.isLoggedIn()) {
        utils.showNotification('Please login to access this page', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
});

// Export utils for use in other scripts
window.portalUtils = utils;

/* UI Enhancements: reveal on scroll, button ripple, tilt effect, smooth nav */
document.addEventListener('DOMContentLoaded', function () {
    // Respect users who prefer reduced motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reveal on scroll (IntersectionObserver)
    if (!reduced) {
        const ro = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    ro.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
    } else {
        // If reduced motion requested, show immediate state
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    }

    // Button ripple effect
    document.body.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const size = Math.max(rect.width, rect.height) * 1.2;
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });

    // Tilt effect for elements with .tilt
    document.querySelectorAll('.tilt').forEach(el => {
        el.addEventListener('mousemove', (ev) => {
            const rect = el.getBoundingClientRect();
            const x = (ev.clientX - rect.left) / rect.width;
            const y = (ev.clientY - rect.top) / rect.height;
            const rx = (y - 0.5) * 6;
            const ry = (x - 0.5) * -6;
            el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });

    // Smooth scroll for nav links within page
    document.querySelectorAll('.main-nav a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const id = this.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Parallax hero layers (scroll + pointer)
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    if (parallaxLayers.length && !reduced) {
        let ticking = false;
        const updateLayers = () => {
            const sc = window.scrollY;
            parallaxLayers.forEach(layer => {
                const depth = parseFloat(layer.dataset.depth) || 0;
                const y = sc * depth;
                layer.style.transform = `translate3d(0, ${-y}px, 0)`;
            });
            ticking = false;
        };
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; window.requestAnimationFrame(updateLayers); }
        }, { passive: true });

        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.addEventListener('mousemove', (e) => {
                const rect = hero.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                parallaxLayers.forEach(layer => {
                    const depth = parseFloat(layer.dataset.depth) || 0;
                    const tx = x * depth * 12;
                    const ty = y * depth * 12;
                    const sc = window.scrollY;
                    layer.style.transform = `translate3d(${tx}px, ${-sc * depth + ty}px, 0)`;
                });
            });
            hero.addEventListener('mouseleave', () => parallaxLayers.forEach(layer => layer.style.transform = ''));
        }
    } else {
        parallaxLayers.forEach(layer => layer.style.transform = '');
    }

    /* =========================================
       MOBILE MENU TOGGLE
       ========================================= */
    function initMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const overlay = document.getElementById('sidebarOverlay');
        const sidebar = document.getElementById('mainSidebar') || document.getElementById('facSidebar');
        
        if (btn && sidebar && overlay) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const isShowing = sidebar.classList.contains('show');
                if (isShowing) {
                    sidebar.classList.remove('show');
                    overlay.classList.remove('show');
                } else {
                    sidebar.classList.add('show');
                    overlay.classList.add('show');
                }
            });

            // Close when clicking overlay
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            });

            // Close when clicking a nav link on mobile
            const navLinks = sidebar.querySelectorAll('a[data-section]');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('show');
                        overlay.classList.remove('show');
                    }
                });
            });
        }
    }
    
    initMobileMenu();

});
