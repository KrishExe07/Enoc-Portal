# 🔧 Quick Fix for Google OAuth Error

## The Issue
You're seeing: **"The server cannot process the request because it is malformed"**

## The Cause
The Google Client ID in `js/google-auth.js` is still set to the placeholder value.

## ✅ QUICK FIX (5 Minutes)

### Step 1: Get Your Google Client ID

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. If you don't have a project:
   - Click "Create Project"
   - Name it "eNOC Portal"
   - Click "Create"

3. Click **"+ Create Credentials"** → **"OAuth client ID"**
4. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: `eNOC Portal`
   - User support email: Your email
   - Add authorized domain: `charusat.edu.in` and `charusat.ac.in`
   - Add test users (your email addresses)
   - Click "Save and Continue" through all steps

5. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `eNOC Portal Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:5173
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000
   http://localhost:5000/api/auth/google
   ```
   
6. Click **"Create"**
7. **COPY** the Client ID (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)

---

### Step 2: Update Frontend

Edit: `js/google-auth.js`

**Find line 12** (approximately):
```javascript
clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
```

**Replace with your Client ID**:
```javascript
clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
```

**⚠️ Important**: Keep the full Client ID including `.apps.googleusercontent.com`

---

### Step 3: Update Backend

Edit: `backend/.env`

If the file doesn't exist, copy from `.env.example`:
```bash
cd backend
copy .env.example .env
```

**Add these lines**:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here
JWT_SECRET=change_this_to_random_32_character_string
STUDENT_DOMAIN=edu
FACULTY_DOMAIN=ac
```

**Replace**:
- `GOOGLE_CLIENT_ID` with your Client ID
- `GOOGLE_CLIENT_SECRET` with your Client Secret (from Google Cloud Console)
- `JWT_SECRET` with a random string

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

---

### Step 5: Test

1. Open: `http://localhost:3000`
2. Click "Sign in with Google" under Student
3. Login with a `.edu` email (or test user you added)
4. Should redirect to student dashboard

---

## 🐛 Still Not Working?

### Error: "Access blocked: This app's request is invalid"
**Fix**: Add your email as a test user in OAuth consent screen

### Error: "redirect_uri_mismatch"
**Fix**: Add exact redirect URI shown in error to Google Cloud Console

### Error: "Invalid token"
**Fix**: Make sure Client ID in frontend matches Client ID in backend `.env`

### Error: CORS error
**Fix**: Verify backend is running on port 5000 and CORS is configured

---

## 📚 Need More Help?

See the complete guide: **`GOOGLE_OAUTH_SETUP.md`**

It includes:
- Detailed Google Cloud Console setup
- OAuth consent screen configuration
- Troubleshooting for all error types
- Testing scenarios
- Security best practices
