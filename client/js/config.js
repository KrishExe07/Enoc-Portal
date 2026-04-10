/**
 * ╔══════════════════════════════════════════════════════════╗
 *  APP CONFIG — eNOC Portal
 *  Single source of truth for API URL and global settings.
 *
 *  ✅ AUTO-DETECTS environment:
 *    - Local dev  → http://localhost:5000/api
 *    - Production → https://enoc-portal-backend.onrender.com/api
 *
 *  To change the production URL, update PRODUCTION_API_URL below.
 * ╚══════════════════════════════════════════════════════════╝
 */

(function () {
    'use strict';

    // ── Production backend URL (update after Render deploy) ──────
    // Replace this with your actual Render URL once deployed
    const PRODUCTION_API_URL = 'https://enoc-portal.onrender.com/api';

    // ── Auto-detect environment ───────────────────────────────────
    // Priority order:
    //   1. <meta name="api-base-url"> tag in the page's <head>
    //   2. Auto-detect: localhost → dev URL, otherwise → prod URL
    const metaTag = document.querySelector('meta[name="api-base-url"]');

    let API_BASE;
    if (metaTag && metaTag.content) {
        // Explicitly set via meta tag (highest priority)
        API_BASE = metaTag.content.replace(/\/$/, '');
    } else if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === ''
    ) {
        // Running locally
        API_BASE = 'http://localhost:5000/api';
    } else {
        // Deployed on Vercel or any other host → use production backend
        API_BASE = PRODUCTION_API_URL;
    }

    // Validate configuration
    if (API_BASE.includes('undefined') || !API_BASE.startsWith('http')) {
        console.error('❌ [Config] Invalid API_BASE_URL:', API_BASE);
    }

    // ── Global config object ─────────────────────────────────────
    window.APP_CONFIG = Object.freeze({
        /** Backend REST API base — no trailing slash */
        API_BASE_URL: API_BASE,

        /** How long (ms) to wait for a single API request before timing out */
        REQUEST_TIMEOUT_MS: 10000,

        /** How long (ms) between automatic reconnect attempts when offline */
        RECONNECT_INTERVAL_MS: 15000,

        /** Max silent retries for health-check before giving up */
        HEALTH_MAX_RETRIES: 3,

        /** App name shown in notifications */
        APP_NAME: 'eNOC Portal',

        /** Version */
        VERSION: '2.0.0',
    });

    console.log(`[Config] Environment: ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'development' : 'production'}`);
    console.log(`[Config] API base: ${window.APP_CONFIG.API_BASE_URL}`);
}());
