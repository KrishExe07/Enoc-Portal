#!/usr/bin/env node
/**
 * CONFIGURATION VERIFICATION SCRIPT
 * Checks if Google OAuth and backend configuration is correct
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        CONFIGURATION VERIFICATION SCRIPT                  ║');
console.log('║        Checking Google OAuth & Backend Setup              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

let errors = 0;
let warnings = 0;

// ═══════════════════════════════════════════════════════════════
// 1. Check backend/.env file
// ═══════════════════════════════════════════════════════════════
console.log('📋 [1/5] Checking backend/.env file...');
const envPath = path.join(process.cwd(), 'backend', '.env');
if (!fs.existsSync(envPath)) {
    console.log('   ❌ ERROR: backend/.env file not found!');
    console.log('   💡 Solution: Copy backend/.env.example to backend/.env');
    errors++;
} else {
    console.log('   ✅ backend/.env exists');
    
    // Read .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check GOOGLE_CLIENT_ID
    const clientIdMatch = envContent.match(/GOOGLE_CLIENT_ID=(.+)/);
    if (!clientIdMatch || !clientIdMatch[1] || clientIdMatch[1].includes('your-client-id')) {
        console.log('   ❌ ERROR: GOOGLE_CLIENT_ID not configured in backend/.env');
        console.log('   💡 Get it from: https://console.cloud.google.com/apis/credentials');
        errors++;
    } else {
        const backendClientId = clientIdMatch[1].trim();
        console.log('   ✅ GOOGLE_CLIENT_ID configured');
        console.log('      Backend Client ID:', backendClientId);
        
        // Store for later comparison
        global.backendClientId = backendClientId;
    }
    
    // Check PORT
    const portMatch = envContent.match(/PORT=(\d+)/);
    const backendPort = portMatch ? portMatch[1] : '5000';
    console.log('   ✅ Backend PORT:', backendPort);
    global.backendPort = backendPort;
    
    // Check JWT_SECRET
    const jwtMatch = envContent.match(/JWT_SECRET=(.+)/);
    if (!jwtMatch || !jwtMatch[1] || jwtMatch[1].includes('your-secret')) {
        console.log('   ⚠️  WARNING: JWT_SECRET appears to be default/weak');
        console.log('   💡 Use a strong random secret for production');
        warnings++;
    } else {
        console.log('   ✅ JWT_SECRET configured');
    }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 2. Check js/google-auth.js
// ═══════════════════════════════════════════════════════════════
console.log('📋 [2/5] Checking js/google-auth.js...');
const googleAuthPath = path.join(process.cwd(), 'client', 'js', 'google-auth.js');
if (!fs.existsSync(googleAuthPath)) {
    console.log('   ❌ ERROR: js/google-auth.js not found!');
    errors++;
} else {
    const googleAuthContent = fs.readFileSync(googleAuthPath, 'utf8');
    
    // Extract clientId
    const clientIdMatch = googleAuthContent.match(/clientId:\s*['"]([^'"]+)['"]/);
    if (!clientIdMatch || !clientIdMatch[1]) {
        console.log('   ❌ ERROR: clientId not found in js/google-auth.js');
        errors++;
    } else {
        const frontendClientId = clientIdMatch[1];
        console.log('   ✅ clientId found');
        console.log('      Frontend Client ID:', frontendClientId);
        
        // Compare with backend
        if (global.backendClientId && frontendClientId !== global.backendClientId) {
            console.log('   ❌ ERROR: Client ID MISMATCH!');
            console.log('      Backend:  ' + global.backendClientId);
            console.log('      Frontend: ' + frontendClientId);
            console.log('   💡 They must be EXACTLY the same!');
            errors++;
        } else if (global.backendClientId) {
            console.log('   ✅ Client IDs match! ✅');
        }
    }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 3. Check js/config.js
// ═══════════════════════════════════════════════════════════════
console.log('📋 [3/5] Checking js/config.js...');
const configPath = path.join(process.cwd(), 'client', 'js', 'config.js');
if (!fs.existsSync(configPath)) {
    console.log('   ❌ ERROR: js/config.js not found!');
    errors++;
} else {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Extract API_BASE_URL
    const apiBaseMatch = configContent.match(/localhost:(\d+)/);
    if (!apiBaseMatch) {
        console.log('   ⚠️  WARNING: Could not extract port from API_BASE_URL');
        warnings++;
    } else {
        const frontendPort = apiBaseMatch[1];
        console.log('   ✅ API_BASE_URL port:', frontendPort);
        
        // Compare with backend
        if (global.backendPort && frontendPort !== global.backendPort) {
            console.log('   ❌ ERROR: Port MISMATCH!');
            console.log('      backend/.env PORT:      ' + global.backendPort);
            console.log('      js/config.js API port:  ' + frontendPort);
            console.log('   💡 Update js/config.js to use port ' + global.backendPort);
            errors++;
        } else if (global.backendPort) {
            console.log('   ✅ Ports match! ✅');
        }
    }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 4. Check backend routes
// ═══════════════════════════════════════════════════════════════
console.log('📋 [4/5] Checking backend/routes/auth.js...');
const authRoutePath = path.join(process.cwd(), 'backend', 'routes', 'auth.js');
if (!fs.existsSync(authRoutePath)) {
    console.log('   ❌ ERROR: backend/routes/auth.js not found!');
    errors++;
} else {
    const authContent = fs.readFileSync(authRoutePath, 'utf8');
    
    // Check for OAuth2Client
    if (authContent.includes('OAuth2Client')) {
        console.log('   ✅ OAuth2Client import found');
    } else {
        console.log('   ❌ ERROR: OAuth2Client not imported');
        errors++;
    }
    
    // Check for domain validation functions
    if (authContent.includes('isValidCHARUSATEmail')) {
        console.log('   ✅ Domain validation function exists');
    } else {
        console.log('   ⚠️  WARNING: isValidCHARUSATEmail function not found');
        warnings++;
    }
    
    // Check for proper domain validation (charusat.edu.in and charusat.ac.in)
    if (authContent.includes('charusat.edu.in') && authContent.includes('charusat.ac.in')) {
        console.log('   ✅ CHARUSAT domain validation configured');
    } else {
        console.log('   ⚠️  WARNING: CHARUSAT domain validation may be incomplete');
        warnings++;
    }
}

console.log('');

// ═══════════════════════════════════════════════════════════════
// 5. Check package.json and dependencies
// ═══════════════════════════════════════════════════════════════
console.log('📋 [5/5] Checking dependencies...');
const backendPackagePath = path.join(process.cwd(), 'backend', 'package.json');
if (!fs.existsSync(backendPackagePath)) {
    console.log('   ❌ ERROR: backend/package.json not found!');
    errors++;
} else {
    const packageJson = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    
    const requiredDeps = [
        'express',
        'google-auth-library',
        'jsonwebtoken',
        'dotenv',
        'cors',
        'sequelize',
        'mysql2'
    ];
    
    const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missing.length > 0) {
        console.log('   ❌ ERROR: Missing dependencies:', missing.join(', '));
        console.log('   💡 Run: cd backend && npm install');
        errors++;
    } else {
        console.log('   ✅ All required dependencies installed');
    }
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'backend', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('   ⚠️  WARNING: backend/node_modules not found');
    console.log('   💡 Run: cd backend && npm install');
    warnings++;
}

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    VERIFICATION SUMMARY                    ║');
console.log('╠════════════════════════════════════════════════════════════╣');

if (errors === 0 && warnings === 0) {
    console.log('║  🎉 PERFECT! All checks passed                            ║');
    console.log('║                                                            ║');
    console.log('║  ✅ Google OAuth Client ID matches                        ║');
    console.log('║  ✅ Backend port configuration correct                    ║');
    console.log('║  ✅ Domain validation configured                          ║');
    console.log('║  ✅ All dependencies installed                            ║');
    console.log('║                                                            ║');
    console.log('║  🚀 Ready to start: npm start                             ║');
} else {
    console.log(`║  Errors:   ${errors.toString().padEnd(48)} ║`);
    console.log(`║  Warnings: ${warnings.toString().padEnd(48)} ║`);
    console.log('║                                                            ║');
    
    if (errors > 0) {
        console.log('║  ⚠️  Please fix the errors above before starting         ║');
    } else {
        console.log('║  ⚠️  Warnings should be reviewed but app may still work  ║');
    }
}

console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Exit with error code if there are errors
process.exit(errors > 0 ? 1 : 0);
