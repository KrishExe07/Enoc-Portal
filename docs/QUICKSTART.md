# College eNOC Portal - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Create MySQL Database

Open MySQL and run:

```sql
CREATE DATABASE college_portal;
```

### Step 3: Configure Environment

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=college_portal
DB_USER=root
DB_PASSWORD=your_mysql_password

GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

JWT_SECRET=my_super_secret_key_12345
JWT_EXPIRE=7d

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=eNOC Portal <noreply@charusat.edu.in>

FRONTEND_URL=http://localhost:3000

STUDENT_DOMAIN=edu
FACULTY_DOMAIN=ac
ADMIN_DOMAIN=ac
```

### Step 4: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable "Google Identity Services API"
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized origins: `http://localhost`, `http://localhost:3000`
5. Copy Client ID to `.env` and `js/google-auth.js`

### Step 5: Seed Database

```bash
npm run seed
```

### Step 6: Start Backend

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Step 7: Update Frontend

Edit `js/google-auth.js` line 7:

```javascript
clientId: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
```

### Step 8: Serve Frontend

```bash
# In the main project directory
npx http-server -p 3000
```

Frontend runs on `http://localhost:3000`

### Step 9: Test Login

1. Open `http://localhost:3000`
2. Click "Student" → Sign in with `.edu` email
3. Or click "Faculty/Admin" → Sign in with `.ac` email

---

## ✅ Verification Checklist

- [ ] MySQL database created
- [ ] Backend dependencies installed
- [ ] `.env` file configured
- [ ] Google OAuth credentials obtained
- [ ] Database seeded with companies
- [ ] Backend server running (port 5000)
- [ ] Frontend Client ID updated
- [ ] Frontend server running (port 3000)
- [ ] Can sign in with Google

---

## 🔧 Troubleshooting

**"Cannot connect to database"**
- Check MySQL is running
- Verify credentials in `.env`

**"Google Sign-In not loading"**
- Check Client ID in `google-auth.js`
- Verify authorized origins in Google Console

**"Invalid email domain"**
- Students need `.edu` emails
- Faculty/Admin need `.ac` emails

---

## 📚 Full Documentation

- **Backend Setup**: [`backend/README.md`](file:///c:/Users/pares/OneDrive/Desktop/college-portal/backend/README.md)
- **Walkthrough**: [View Complete Walkthrough](file:///C:/Users/pares/.gemini/antigravity/brain/094c5087-506b-480a-8da1-177ddc4692f9/walkthrough.md)
- **API Endpoints**: See backend README

---

## 🎯 What's Next?

After successful setup, you can:
1. Submit NOC requests as a student
2. Review and approve NOCs as faculty
3. Upload e-signatures
4. Send signed NOCs via email

**Need help?** Check the full documentation or review the implementation plan.
