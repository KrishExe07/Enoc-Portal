/**
 * ╔══════════════════════════════════════════════════════════╗
 *  API SERVICE — eNOC Portal
 *
 *  Features:
 *   • Reads base URL from window.APP_CONFIG (js/config.js)
 *   • Offline-mode: never crashes the page when backend is down
 *   • Safe wrappers: every call returns { success, data, offline }
 *   • Auto-reconnect: polls /api/health every 15 s when offline
 *   • Status banner: subtle top bar, not a blocking red popup
 *   • file:// warning: tells user to use http://localhost:8080
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

(function () {

    // ── Config ────────────────────────────────────────────────────
    const CFG = window.APP_CONFIG || {};
    const API_BASE = (CFG.API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    const TIMEOUT_MS = CFG.REQUEST_TIMEOUT_MS || 10000;
    const RECONNECT_MS = CFG.RECONNECT_INTERVAL_MS || 15000;

    // ── State ─────────────────────────────────────────────────────
    let _isOnline = false;   // backend reachable?
    let _reconnectTimer = null;
    let _statusBanner = null;

    // ── file:// warning (once) ────────────────────────────────────
    if (window.location.protocol === 'file:') {
        console.warn(
            '[API] ⚠️  Page opened via file:// — API calls will fail.\n' +
            '     → Run start-portal.bat and open http://localhost:8080'
        );
    }

    // ─────────────────────────────────────────────────────────────
    //  STATUS BANNER  (non-blocking, top of page)
    // ─────────────────────────────────────────────────────────────
    function _ensureBanner() {
        if (_statusBanner) return;
        _statusBanner = document.createElement('div');
        _statusBanner.id = 'api-status-banner';
        _statusBanner.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'right:0',
            'z-index:99999', 'padding:6px 16px',
            'font-family:Inter,sans-serif', 'font-size:13px',
            'font-weight:600', 'text-align:center',
            'transition:transform .3s ease,opacity .3s ease',
            'transform:translateY(-100%)', 'opacity:0',
            'pointer-events:none'
        ].join(';');
        document.body.appendChild(_statusBanner);
    }

    function _showBanner(msg, type) {
        // type: 'offline' | 'online' | 'hidden'
        _ensureBanner();
        const styles = {
            offline: { bg: '#f59e0b', color: '#1c1917' },
            online: { bg: '#10b981', color: '#fff' },
        };
        const s = styles[type] || styles.offline;
        _statusBanner.textContent = msg;
        _statusBanner.style.background = s.bg;
        _statusBanner.style.color = s.color;
        _statusBanner.style.transform = 'translateY(0)';
        _statusBanner.style.opacity = '1';

        if (type === 'online') {
            setTimeout(() => _hideBanner(), 3000);
        }
    }

    function _hideBanner() {
        if (!_statusBanner) return;
        _statusBanner.style.transform = 'translateY(-100%)';
        _statusBanner.style.opacity = '0';
    }

    // ─────────────────────────────────────────────────────────────
    //  RECONNECT LOOP
    // ─────────────────────────────────────────────────────────────
    function _startReconnectLoop() {
        if (_reconnectTimer) return;
        _reconnectTimer = setInterval(async () => {
            const ok = await apiService.checkHealth();
            if (ok && !_isOnline) {
                _isOnline = true;
                _showBanner('✅ Backend reconnected — you\'re back online!', 'online');
                clearInterval(_reconnectTimer);
                _reconnectTimer = null;
                // Fire a custom event so pages can refresh their data
                window.dispatchEvent(new CustomEvent('api:online'));
            }
        }, RECONNECT_MS);
    }

    function _markOffline() {
        if (_isOnline) {
            _isOnline = false;
            _showBanner(
                '⚠️  Backend offline — working in offline mode. Data will sync when reconnected.',
                'offline'
            );
            _startReconnectLoop();
            window.dispatchEvent(new CustomEvent('api:offline'));
        }
    }

    function _markOnline() {
        _isOnline = true;
        _hideBanner();
    }

    // ─────────────────────────────────────────────────────────────
    //  TIMEOUT HELPER
    // ─────────────────────────────────────────────────────────────
    function _timeoutSignal(ms) {
        if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), ms);
        return ctrl.signal;
    }

    // ─────────────────────────────────────────────────────────────
    //  CORE REQUEST
    // ─────────────────────────────────────────────────────────────
    /**
     * Make an API request.
     * NEVER throws — always returns { success, data?, message?, offline? }
     * so callers don't need try/catch for connection failures.
     */
    async function _request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const token = localStorage.getItem('jwt_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        };

        let response;
        try {
            response = await fetch(url, {
                ...options,
                headers,
                signal: options.signal || _timeoutSignal(TIMEOUT_MS),
            });
        } catch (netErr) {
            // Network failure (server down, CORS, timeout)
            const isTimeout = netErr.name === 'AbortError' || netErr.name === 'TimeoutError';
            console.warn(`[API] ${isTimeout ? 'Timeout' : 'Network error'}: ${url}`, netErr.message);
            _markOffline();
            return {
                success: false,
                offline: true,
                message: isTimeout
                    ? `Request timed out — backend may be starting up`
                    : `Backend unreachable at ${API_BASE}`,
            };
        }

        // Parse body
        let data;
        const text = await response.text().catch(() => '');
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            console.error('[API] Non-JSON response:', text.slice(0, 200));
            return {
                success: false,
                message: `Server returned unexpected response (status ${response.status})`,
            };
        }

        if (!response.ok) {
            const msg = data.message || data.error || `HTTP ${response.status}`;
            console.warn(`[API] ${response.status} ${url}:`, msg);
            return { success: false, message: msg, status: response.status, data };
        }

        _markOnline();
        return data;
    }

    // ─────────────────────────────────────────────────────────────
    //  PUBLIC API SERVICE
    // ─────────────────────────────────────────────────────────────
    const apiService = {

        // ── State accessors ───────────────────────────────────────
        isOnline() { return _isOnline; },

        // ── Token ─────────────────────────────────────────────────
        getToken() { return localStorage.getItem('jwt_token'); },
        setToken(t) { localStorage.setItem('jwt_token', t); },
        removeToken() { localStorage.removeItem('jwt_token'); },

        // ── Health check ──────────────────────────────────────────
        /**
         * Ping /api/health silently.
         * Returns true/false — never throws.
         */
        async checkHealth() {
            try {
                const res = await fetch(`${API_BASE}/health`, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: _timeoutSignal(5000),
                });
                if (!res.ok) return false;
                const d = await res.json().catch(() => ({}));
                const ok = d.status === 'OK' || d.success === true;
                if (ok) _markOnline();
                return ok;
            } catch {
                return false;
            }
        },

        /**
         * Run a silent background health check on page load.
         * Shows the offline banner only if backend is unreachable.
         * Does NOT block the page or show a red error popup.
         */
        async silentHealthCheck() {
            const ok = await this.checkHealth();
            if (!ok) {
                _markOffline();
            }
            return ok;
        },

        /**
         * Wait for backend to be ready with retry logic.
         * Retries with exponential backoff until backend responds or maxAttempts is reached.
         * @param {Object} options - Configuration options
         * @param {number} options.maxAttempts - Maximum retry attempts (default: 10)
         * @param {number} options.initialDelay - Initial retry delay in ms (default: 500)
         * @param {number} options.maxDelay - Maximum retry delay in ms (default: 5000)
         * @param {Function} options.onRetry - Callback on each retry (optional)
         * @returns {Promise<boolean>} true if backend is ready, false if max attempts reached
         */
        async waitForBackend(options = {}) {
            const {
                maxAttempts = 10,
                initialDelay = 500,
                maxDelay = 5000,
                onRetry = null
            } = options;

            let attempt = 0;
            let delay = initialDelay;

            while (attempt < maxAttempts) {
                attempt++;
                
                const ok = await this.checkHealth();
                if (ok) {
                    _markOnline();
                    console.log(`✅ Backend ready after ${attempt} attempt(s)`);
                    return true;
                }

                if (attempt < maxAttempts) {
                    if (onRetry) onRetry(attempt, maxAttempts, delay);
                    console.log(`⏳ Backend not ready. Retry ${attempt}/${maxAttempts} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    // Exponential backoff with cap
                    delay = Math.min(delay * 1.5, maxDelay);
                }
            }

            console.warn(`⚠️  Backend not ready after ${maxAttempts} attempts`);
            _markOffline();
            return false;
        },

        // ── Auth ──────────────────────────────────────────────────
        async googleAuth(credential, role) {
            const data = await _request('/auth/google', {
                method: 'POST',
                body: JSON.stringify({ credential, role }),
            });
            if (data.success && data.token) this.setToken(data.token);
            return data;
        },

        async staffLogin(email, password, role) {
            const data = await _request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password, role }),
            });
            if (data.success && data.token) this.setToken(data.token);
            return data;
        },

        async verifyToken() {
            return _request('/auth/verify', { method: 'POST' });
        },

        async logout() {
            await _request('/auth/logout', { method: 'POST' }).catch(() => { });
            this.removeToken();
        },

        // ── Users ─────────────────────────────────────────────────
        getProfile() { return _request('/users/profile'); },
        updateProfile(d) { return _request('/users/profile', { method: 'PUT', body: JSON.stringify(d) }); },
        getAllUsers() { return _request('/users'); },

        // ── Companies ─────────────────────────────────────────────
        getCompanies() { return _request('/companies'); },
        addCompany(d) { return _request('/companies', { method: 'POST', body: JSON.stringify(d) }); },
        updateCompany(id, d) { return _request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
        deleteCompany(id) { return _request(`/companies/${id}`, { method: 'DELETE' }); },
        getPendingCompanies() { return _request('/companies/pending'); },
        approveCompany(id) { return _request(`/companies/${id}/approve`, { method: 'PUT' }); },

        // ── NOC ───────────────────────────────────────────────────
        submitNOC(d) { return _request('/noc/submit', { method: 'POST', body: JSON.stringify(d) }); },
        getMyNOCRequests() { return _request('/noc/my-requests'); },
        getMyNOCs() { return _request('/noc/my-requests'); },
        getPendingNOCs(status) { return _request(`/noc/pending${status ? `?status=${status}` : ''}`); },
        getAllNOCs(status) { return _request(`/noc/all${status ? `?status=${status}` : ''}`); },
        getNOCById(id) { return _request(`/noc/${id}`); },
        getNOCStatus(id) { return _request(`/noc/${id}`); },
        /** Fetch approved NOC data for PDF generation. Backend returns 403 if not yet approved. */
        downloadNOCPDF(id) { return _request(`/noc/${id}/download-pdf`); },
        approveNOC(id, comments) { return _request(`/noc/${id}/approve`, { method: 'PUT', body: JSON.stringify({ approvalComments: comments || '' }) }); },
        rejectNOC(id, reason) { return _request(`/noc/${id}/reject`, { method: 'PUT', body: JSON.stringify({ rejectionReason: reason }) }); },
        signNOC(id, sigId) { return _request(`/noc/${id}/sign`, { method: 'PUT', body: JSON.stringify({ signatureId: sigId }) }); },
        deleteNOC(id) { return _request(`/noc/${id}`, { method: 'DELETE' }); },
        /** Faculty/Admin dashboard stats: pending, approved, rejected, total counts */
        getStats() { return _request('/noc/stats'); },

        // ── Signatures ────────────────────────────────────────────
        saveSignature(d) { return _request('/signatures', { method: 'POST', body: JSON.stringify(d) }); },
        uploadSignature(d) { return _request('/signatures', { method: 'POST', body: JSON.stringify(d) }); },
        getMySignature() { return _request('/signatures/my-signature'); },

        // ── Email ─────────────────────────────────────────────────
        sendNOCEmail(nocId) { return _request(`/email/send-noc/${nocId}`, { method: 'POST' }); },
    };

    // ── Expose globally ───────────────────────────────────────────
    window.apiService = apiService;

    // ── NO automatic health checks on page load ───────────────────
    // Frontend loads independently without calling backend.
    // Health checks only happen when user makes an API call.
    // This ensures the app works offline and doesn't fail on startup.

}());
