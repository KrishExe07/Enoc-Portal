# 🔧 Google OAuth Configuration Guide

## 🚨 ISSUE: "The server cannot process the request because it is malformed"

This error occurs when Google OAuth is not properly configured. Follow this guide to fix it.

---

## ✅ STEP 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create New Project
1. Click "Select a project" → "New Project"
2. **Project Name**: `eNOC Portal` (or your college name)
3. Click "Create"

---

## ✅ STEP 2: Enable Google Identity Services API

### 2.1 Enable Required APIs
1. Go to: **APIs & Services** → **Library**
2. Search for: `Google+ API` (if available) or `Google Identity`
3. Click "Enable"

---

## ✅ STEP 3: Configure OAuth Consent Screen

### 3.1 Navigate to OAuth Consent Screen
Go to: **APIs & Services** → **OAuth consent screen**

### 3.2 Choose User Type
- Select: **External**
- Click "Create"

### 3.3 Fill App Information

**App Information:**
- **App name**: `eNOC Portal` or `CHARUSAT eNOC System`
- **User support email**: Your college email
- **App logo**: Upload college logo (optional)

**App Domain:**
- **Application home page**: `http://localhost:3000` (for testing)
- **Application privacy policy**: `http://localhost:3000/privacy` (optional)
- **Application terms of service**: `http://localhost:3000/terms` (optional)

**Authorized Domains:**
```
charusat.edu.in
charusat.ac.in
localhost
```

**Developer Contact Information:**
- Your email address

Click **"Save and Continue"**

### 3.4 Scopes
Click **"Add or Remove Scopes"**

Select these scopes:
- ✅ `email`
- ✅ `profile`
- ✅ `openid`

Click **"Update"** → **"Save and Continue"**

### 3.5 Test Users (Important!)
If your app is not published, you MUST add test users:

Click **"Add Users"**

Add test email addresses:
```
student@charusat.edu.in
faculty@charusat.ac.in
admin@charusat.ac.in
```

Add your personal Gmail for testing:
```
yourname@gmail.com
```

Click **"Save and Continue"**

---

## ✅ STEP 4: Create OAuth 2.0 Credentials

### 4.1 Navigate to Credentials
Go to: **APIs & Services** → **Credentials**

### 4.2 Create OAuth Client ID
1. Click **"+ Create Credentials"** → **"OAuth client ID"**
2. **Application type**: `Web application`
3. **Name**: `eNOC Portal Web Client`

### 4.3 Configure Authorized JavaScript Origins

Add these URLs (EXACTLY as shown):
```
http://localhost:3000
http://localhost:5173
http://localhost:8080
http://127.0.0.1:3000
```

For production, add:
```
https://yourdomain.com
https://www.yourdomain.com
```

### 4.4 Configure Authorized Redirect URIs

**IMPORTANT**: These must match your backend routes EXACTLY!

Add these URLs:
```
http://localhost:3000
http://localhost:3000/auth/google/callback
http://localhost:5000/api/auth/google
```

For production:
```
https://yourdomain.com
https://yourdomain.com/auth/google/callback
https://api.yourdomain.com/api/auth/google
```

### 4.5 Create and Save Credentials
1. Click **"Create"**
2. **COPY** the Client ID and Client Secret
3. Click "OK"

You'll see something like:
```
Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Client Secret: GOCSPX-abcdefghijklmnopqrstuvwxyz
```

---

## ✅ STEP 5: Update Frontend Configuration

### 5.1 Edit `js/google-auth.js`

Find line 8:
```javascript
clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
```

Replace with your actual Client ID:
```javascript
clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
```

**⚠️ CRITICAL**: Use the FULL Client ID including `.apps.googleusercontent.com`

---

## ✅ STEP 6: Update Backend Configuration

### 6.1 Edit `backend/.env`

If `.env` doesn't exist, copy from `.env.example`:
```bash
cd backend
copy .env.example .env
```

### 6.2 Add Google OAuth Credentials

Edit `.env` file and add:
```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# Domain Validation
STUDENT_DOMAIN=edu
FACULTY_DOMAIN=ac

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

**⚠️ IMPORTANT**: 
- Replace `GOOGLE_CLIENT_ID` with your actual Client ID
- Replace `GOOGLE_CLIENT_SECRET` with your actual Client Secret
- Change `JWT_SECRET` to a random string (at least 32 characters)

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ STEP 7: Verify Implementation

### 7.1 Check Google Sign-In Button Loading

Open `index.html` in browser and check console:

**Expected**: No errors
**If you see errors**: Google Identity Services script not loaded

### 7.2 Verify Script Tag in HTML

Check `index.html` has this script BEFORE other scripts:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### 7.3 Test Authentication Flow

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Serve Frontend**:
```bash
# In project root
python -m http.server 3000
# OR
npx http-server -p 3000
```

3. **Open Browser**:
```
http://localhost:3000
```

4. **Click Google Sign-In Button**
5. **Select Test Account**
6. **Check Console for Errors**

---

## 🐛 TROUBLESHOOTING

### Error: "The server cannot process the request because it is malformed"

**Causes:**
1. ❌ Client ID is still `YOUR_GOOGLE_CLIENT_ID`
2. ❌ Redirect URI mismatch
3. ❌ Authorized JavaScript origins not configured
4. ❌ Using HTTP instead of HTTPS in production
5. ❌ Test user not added (for unpublished apps)

**Solutions:**
1. ✅ Replace Client ID in `google-auth.js`
2. ✅ Verify redirect URIs in Google Cloud Console
3. ✅ Add `http://localhost:3000` to authorized origins
4. ✅ Add your email as test user
5. ✅ Restart backend server after changing `.env`

---

### Error: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured

**Solution**:
1. Complete OAuth consent screen setup
2. Add authorized domains
3. Add test users
4. Publish app (or keep in testing mode with test users)

---

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI doesn't match Google Cloud Console configuration

**Solution**:
1. Check exact URL in error message
2. Add that EXACT URL to "Authorized redirect URIs"
3. Remove trailing slashes if present
4. Ensure HTTP vs HTTPS matches

---

### Error: "idpiframe_initialization_failed"

**Cause**: Third-party cookies blocked or browser privacy settings

**Solution**:
1. Enable third-party cookies for `accounts.google.com`
2. Try in incognito mode
3. Disable browser extensions
4. Clear browser cache and cookies

---

### Error: "Invalid token" or "Token verification failed"

**Cause**: Backend can't verify Google token

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` in backend `.env` matches frontend
2. Check `google-auth-library` is installed:
```bash
cd backend
npm install google-auth-library
```
3. Restart backend server

---

### Error: "CORS policy" error

**Cause**: Backend CORS not configured for frontend URL

**Solution**:
Edit `backend/server.js` and verify CORS configuration:
```javascript
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
```

---

## 📋 VERIFICATION CHECKLIST

Before testing, verify:

### Google Cloud Console
- [ ] OAuth consent screen configured
- [ ] Authorized domains added (`charusat.edu.in`, `charusat.ac.in`)
- [ ] Test users added
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins include `http://localhost:3000`
- [ ] Authorized redirect URIs configured

### Frontend (`js/google-auth.js`)
- [ ] Client ID replaced (not `YOUR_GOOGLE_CLIENT_ID`)
- [ ] Client ID includes `.apps.googleusercontent.com`
- [ ] No extra spaces or quotes

### Backend (`backend/.env`)
- [ ] `GOOGLE_CLIENT_ID` set correctly
- [ ] `GOOGLE_CLIENT_SECRET` set correctly
- [ ] `JWT_SECRET` changed from default
- [ ] `STUDENT_DOMAIN=edu`
- [ ] `FACULTY_DOMAIN=ac`

### Servers Running
- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend served on `http://localhost:3000`
- [ ] No port conflicts

---

## 🎯 TESTING SCENARIOS

### Test 1: Student Login with .edu Email
1. Click "Student" Google Sign-In button
2. Login with email ending in `.edu`
3. **Expected**: Redirects to student dashboard
4. **Check**: JWT token stored in localStorage

### Test 2: Faculty Login with .ac Email
1. Click "Faculty" Google Sign-In button
2. Login with email ending in `.ac`
3. **Expected**: Redirects to faculty dashboard

### Test 3: Invalid Domain Rejection
1. Click "Student" Google Sign-In button
2. Login with Gmail account (`.com`)
3. **Expected**: Error message about invalid domain
4. **Check**: Modal shows domain mismatch error

### Test 4: Backend Token Verification
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Copy `auth_token` value
4. Test API endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/auth/verify
```
5. **Expected**: User data returned

---

## 🔒 SECURITY NOTES

### For Development:
- ✅ Use test users in OAuth consent screen
- ✅ Keep app in "Testing" mode
- ✅ Use `http://localhost` for origins

### For Production:
- ✅ Publish OAuth consent screen
- ✅ Use HTTPS for all URLs
- ✅ Change JWT_SECRET to strong random value
- ✅ Set NODE_ENV=production
- ✅ Remove localhost from authorized origins
- ✅ Enable rate limiting
- ✅ Add domain verification

---

## 📞 SUPPORT

If you still face issues:

1. **Check Backend Logs**:
```bash
cd backend
npm run dev
# Watch for errors when clicking sign-in
```

2. **Check Browser Console**:
- Open DevTools (F12)
- Go to Console tab
- Look for errors when clicking sign-in

3. **Verify Network Requests**:
- Open DevTools → Network tab
- Click sign-in button
- Check `/api/auth/google` request
- Verify request payload and response

4. **Common Log Messages**:
```
✅ "Google Auth initialized" - Frontend loaded correctly
✅ "Authenticating..." - Sign-in button clicked
✅ "Authentication successful" - Backend verified token
❌ "Google Identity Services not loaded" - Script tag missing
❌ "Invalid token" - Client ID mismatch
❌ "Invalid email domain" - Domain validation failed
```

---

## 🎓 QUICK REFERENCE

### Google Cloud Console URLs
- **Console**: https://console.cloud.google.com/
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent

### Files to Edit
1. `js/google-auth.js` - Line 8 (Client ID)
2. `backend/.env` - Google credentials
3. `backend/routes/auth.js` - Already configured ✅
4. `index.html` - Already has Google script ✅

### Environment Variables
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
JWT_SECRET=random_32_character_string
STUDENT_DOMAIN=edu
FACULTY_DOMAIN=ac
```

---

**STATUS**: ✅ Implementation is correct. Just needs Google Cloud Console configuration and Client ID replacement!
