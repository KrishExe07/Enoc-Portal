# College eNOC Portal - Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Google Cloud Project with OAuth 2.0 credentials

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create MySQL Database

```sql
CREATE DATABASE college_portal;
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=college_portal
DB_USER=root
DB_PASSWORD=your_mysql_password

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=eNOC Portal <noreply@charusat.edu.in>

# Frontend
FRONTEND_URL=http://localhost:3000

# Optional: company Excel import file path (auto-import on server start)
COMPANY_LIST_EXCEL_PATH=C:\\Users\\<your-user>\\Downloads\\Company List for reference (1).xlsx

# Domain Validation
STUDENT_DOMAIN=edu
FACULTY_DOMAIN=ac
ADMIN_DOMAIN=ac
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google Identity Services API"
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost`, `http://localhost:3000`
   - Authorized redirect URIs: (leave empty for client-side flow)
5. Copy Client ID and Client Secret to `.env`

### 5. Gmail App Password (for Email)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App passwords
3. Generate app password for "Mail"
4. Copy password to `.env` as `EMAIL_PASSWORD`

### 6. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will:
- Connect to MySQL database
- Create all tables automatically (Sequelize sync)
- Start on port 5000 (or your configured PORT)

### 7. Verify Installation

Visit: `http://localhost:5000/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "College Portal API is running",
  "timestamp": "2026-02-17T..."
}
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Sequelize MySQL configuration
├── middleware/
│   └── auth.js              # JWT authentication & authorization
├── models/
│   ├── index.js             # Model associations
│   ├── User.js              # User model (Google OAuth)
│   ├── Company.js           # Company model
│   ├── NOCRequest.js        # NOC request model
│   ├── Signature.js         # E-signature model
│   └── EmailLog.js          # Email tracking model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User profile routes
│   ├── companies.js         # Company management routes
│   ├── noc.js               # NOC request routes
│   ├── signatures.js        # E-signature routes
│   └── email.js             # Email sending routes
├── .env.example             # Environment variables template
├── package.json             # Dependencies
└── server.js                # Main server file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google` - Google Sign-In verification
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Companies
- `GET /api/companies` - Get approved companies
- `POST /api/companies` - Add new company (pending)
- `GET /api/companies/pending` - Get pending companies (Admin)
- `PUT /api/companies/:id/approve` - Approve company (Admin)
- `POST /api/companies/upload-list` - Upload Excel and import company list (Admin)

### NOC Requests
- `POST /api/noc/submit` - Submit NOC request (Student)
- `GET /api/noc/my-requests` - Get student's requests (Student)
- `GET /api/noc/pending` - Get pending requests (Faculty/Admin)
- `GET /api/noc/:id` - Get single NOC request
- `PUT /api/noc/:id/approve` - Approve NOC (Faculty/Admin)
- `PUT /api/noc/:id/reject` - Reject NOC (Faculty/Admin)
- `PUT /api/noc/:id/sign` - Sign NOC with e-signature (Faculty/Admin)

### Signatures
- `POST /api/signatures` - Upload/create signature (Faculty/Admin)
- `GET /api/signatures/my-signature` - Get active signature (Faculty/Admin)

### Email
- `POST /api/email/send-noc/:nocId` - Send signed NOC via email (Faculty/Admin)

## 🔒 Authentication

All protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🗄️ Database Tables

The following tables are automatically created:

1. **users** - User accounts with Google OAuth
2. **companies** - Approved and pending companies
3. **noc_requests** - NOC requests with approval workflow
4. **signatures** - Faculty/Admin e-signatures
5. **email_logs** - Email delivery tracking

## 🚨 Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `college_portal` exists

### Google OAuth Error
- Verify Client ID in both frontend and backend
- Check authorized origins in Google Cloud Console
- Ensure frontend URL matches CORS configuration

### Email Sending Error
- Verify Gmail app password
- Enable "Less secure app access" if needed
- Check email service configuration

## 📝 Notes

- Database tables are created automatically on first run
- Set `syncDatabase(true)` in `server.js` to drop and recreate tables
- Use environment-specific `.env` files for production
- Never commit `.env` file to version control

## 🔄 Next Steps

1. Update frontend `google-auth.js` with your Google Client ID
2. Configure frontend to call backend API endpoints
3. Test complete workflow: Sign in → Submit NOC → Approve → Sign → Email
4. Deploy backend to production server (Heroku, AWS, etc.)
5. Set up production MySQL database
6. Configure production environment variables
