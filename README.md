# 🎓 CHARUSAT eNOC Portal

> **College Internship No-Objection Certificate (NOC) Management System**  
> A full-stack web application for CHARUSAT University built with **Express.js**, **MySQL (Sequelize ORM)**, **Google OAuth 2.0**, and Vanilla HTML/CSS/JS.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [Authentication & Roles](#-authentication--roles)
- [NOC Workflow](#-noc-workflow)
- [API Endpoints](#-api-endpoints)
- [Frontend Pages](#-frontend-pages)
- [Scripts & Utilities](#-scripts--utilities)
- [Documentation](#-documentation)

---

## 🔍 Overview

The CHARUSAT eNOC Portal digitizes the end-to-end process of issuing internship No-Objection Certificates. Students apply via Google OAuth, faculty review and approve/reject requests, and admins manage the entire ecosystem — users, companies, email logs, e-signatures, and reports.

**Key Highlights:**
- Google OAuth 2.0 login restricted to CHARUSAT email domains
- Role-based access control: Student / Faculty / Admin
- Multi-step NOC approval workflow with email notifications
- PDF generation for approved NOCs
- E-signature capture and storage
- Excel-based company import
- File upload support (documents/attachments)
- Admin CRUD dashboard for users, NOC requests, companies
- Dashboard analytics and records/reports view
- Responsive dashboard layout with Flexbox

---

## 📁 Project Structure

```
college-portal/
│
├── client/                          # Frontend (HTML + CSS + JS — no framework)
│   ├── index.html                   # Landing page + login entry point
│   ├── register.html                # New user registration
│   ├── forgot-password.html         # Password recovery
│   ├── student-dashboard.html       # Student home — submit & track NOCs
│   ├── noc-request.html             # NOC submission form
│   ├── faculty-dashboard.html       # Faculty home — review pending NOCs
│   ├── faculty-noc-review.html      # Detailed NOC review & approve/reject
│   ├── admin-dashboard.html         # Admin management panel
│   ├── records-reports.html         # Records & reports viewer
│   ├── application-review.html      # Application review page
│   ├── application-status.html      # Application status tracker
│   ├── upload-documents.html        # Document upload page
│   ├── about.html                   # About the portal
│   ├── contact.html                 # Contact / support page
│   ├── access-denied.html           # 403 page
│   ├── logout.html                  # Logout handler
│   │
│   ├── css/                         # Stylesheets
│   │   ├── main.css                 # Global design system & typography
│   │   ├── dashboard.css            # Shared dashboard layout (Flexbox)
│   │   ├── faculty-dashboard.css    # Faculty-specific styles
│   │   ├── admin-dashboard.css      # Admin-specific styles
│   │   ├── noc-request.css          # NOC form styles
│   │   ├── home.css                 # Landing page styles
│   │   ├── login.css                # Login / auth page styles
│   │   ├── login-landing.css        # Login landing variants
│   │   ├── google-auth.css          # Google OAuth button & modal
│   │   ├── forms.css                # General form component styles
│   │   ├── about.css                # About page styles
│   │   └── contact.css              # Contact page styles
│   │
│   ├── js/                          # Client-side JavaScript modules
│   │   ├── config.js                # API_BASE_URL & shared config
│   │   ├── api-service.js           # HTTP client wrapper + offline handling
│   │   ├── main.js                  # Global utilities, UI effects, nav
│   │   ├── google-auth.js           # Google Sign-In SDK integration
│   │   ├── login.js                 # Login form logic
│   │   ├── home.js                  # Landing page interactions
│   │   ├── student-dashboard.js     # Student dashboard — NOC list, status
│   │   ├── faculty-dashboard.js     # Faculty dashboard — pending queue
│   │   ├── faculty-noc.js           # NOC detail review actions
│   │   ├── admin-dashboard.js       # Admin dashboard — full CRUD
│   │   ├── admin-noc.js             # Admin NOC management helpers
│   │   ├── noc-request.js           # NOC form submit + validation
│   │   ├── applications.js          # Application tracking logic
│   │   ├── pdf-generator.js         # Client-side NOC PDF generation
│   │   ├── crud.js                  # Generic admin CRUD helpers
│   │   ├── database.js              # Frontend DB query helpers
│   │   ├── about.js                 # About page JS
│   │   └── _debug/                  # Debug utilities (dev-only)
│   │
│   └── images/                      # Static image assets
│
├── backend/                         # Backend API (Node.js + Express)
│   ├── server.js                    # Entry point — Express app setup
│   ├── seed.js                      # Database seeder (demo data)
│   ├── create-db.js                 # DB creation helper script
│   │
│   ├── config/
│   │   └── database.js              # Sequelize MySQL connection config
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT verification + role-based auth
│   │
│   ├── models/                      # Sequelize data models
│   │   ├── User.js                  # User (student / faculty / admin)
│   │   ├── NOCRequest.js            # NOC request with status workflow
│   │   ├── Company.js               # Internship company records
│   │   ├── Signature.js             # Faculty e-signature storage
│   │   ├── EmailLog.js              # Outbound email audit log
│   │   └── index.js                 # Model associations & Sequelize init
│   │
│   ├── routes/                      # Express route handlers
│   │   ├── auth.js                  # Google OAuth + JWT login/register
│   │   ├── noc.js                   # NOC CRUD, approval, PDF, filters
│   │   ├── companies.js             # Company management + Excel import
│   │   ├── users.js                 # User profile & management
│   │   ├── signatures.js            # E-signature upload & retrieval
│   │   ├── uploads.js               # File upload handling (Multer)
│   │   └── email.js                 # Email trigger & log routes
│   │
│   ├── services/
│   │   └── companyImportService.js  # Excel (.xlsx) → DB company importer
│   │
│   ├── uploads/                     # Uploaded files (gitignored)
│   ├── .env                         # Environment variables (not in git)
│   ├── .env.example                 # ← Copy this to .env to get started
│   └── package.json
│
├── docs/                            # Project documentation (27 files)
│   ├── QUICKSTART.md                # Getting started guide
│   ├── GOOGLE_OAUTH_SETUP.md        # Google Cloud Console setup
│   ├── FEATURES.txt                 # Complete feature list
│   ├── TESTING_GUIDE.md             # Manual testing guide
│   ├── NOC_WORKFLOW_IMPLEMENTATION.md
│   ├── PROJECT_STATUS_REPORT.md
│   └── ...                          # Additional fix summaries & guides
│
├── data/                            # Data files (CSV, Excel imports)
├── scripts/                         # Windows utility scripts
│   ├── start-portal.bat             # Launch full stack (backend + frontend)
│   ├── start.bat                    # Alternative launcher
│   ├── restart-backend.bat          # Restart backend only
│   ├── check-backend.bat            # Backend health check
│   ├── verify-config.bat            # Config validator (bat wrapper)
│   └── verify-config.js             # Node.js config verification script
│
├── Workflow.html                    # NOC workflow visual diagram
├── frontend-server.js               # Express static server for /client
├── package.json                     # Root project — scripts & concurrently
├── .gitignore
└── README.md                        # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS | UI, forms, dashboards |
| **Backend** | Node.js 18+, Express.js 4 | REST API server |
| **Database** | MySQL 8+, Sequelize ORM | Data persistence |
| **Authentication** | Google OAuth 2.0, JWT | Login & session tokens |
| **Email** | Nodemailer (Gmail SMTP) | NOC status notifications |
| **File Handling** | Multer | Document uploads |
| **Data Import** | xlsx | Excel company list import |
| **Security** | Helmet, express-rate-limit, bcryptjs | Headers, rate limiting, password hashing |
| **Dev Tools** | nodemon, concurrently | Hot reload, parallel servers |

---

## 📦 Prerequisites

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **MySQL** 8.0+ via XAMPP, WAMP, or standalone
- **Google Cloud Project** with OAuth 2.0 credentials (see `docs/GOOGLE_OAUTH_SETUP.md`)
- A **Gmail account** with App Password enabled (for email notifications)

---

## 🚀 Quick Start

### 1. Install All Dependencies
```bash
npm run install-all
```
This runs `npm install` in the root **and** `backend/`.

### 2. Configure Environment
```bash
# Windows
copy backend\.env.example backend\.env

# Then open backend/.env and fill in:
#  - DB credentials
#  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
#  - JWT_SECRET
#  - EMAIL_USER / EMAIL_PASSWORD
```

### 3. Set Up the Database
```bash
# Make sure MySQL is running (start XAMPP first), then:
cd backend
node create-db.js      # Creates the 'college_portal' database
npm run seed           # Seeds demo users, companies, NOC requests
```

### 4. Start the Application
```bash
# From the project root:
npm run dev

# Or use the Windows batch script:
scripts\start-portal.bat
```

### 5. Open in Browser

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

---

## ⚙️ Environment Configuration

All variables are in `backend/.env`. Copy from `backend/.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=college_portal
DB_USER=root
DB_PASSWORD=your_mysql_password

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# JWT
JWT_SECRET=your_random_secret_here
JWT_EXPIRE=7d

# Email (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=eNOC Portal <noreply@charusat.edu.in>

# CORS
FRONTEND_URL=http://localhost:8080

# File Upload
MAX_FILE_SIZE=5242880   # 5 MB

# Domain Validation
STUDENT_DOMAIN=edu      # @charusat.edu.in
FACULTY_DOMAIN=ac       # @charusat.ac.in
ADMIN_DOMAIN=ac
```

> ⚠️ **Never commit `.env` to git.** It is already listed in `.gitignore`.

---

## 🔐 Authentication & Roles

| Role | Login Method | Email Domain | Access |
|---|---|---|---|
| **Student** | Google OAuth 2.0 | `@charusat.edu.in` | Submit NOC, track status |
| **Faculty** | Direct login (JWT) | `@charusat.ac.in` | Review & approve/reject NOCs |
| **Admin** | Direct login (JWT) | `@charusat.ac.in` | Full system management |

- **JWT tokens** are stored in `localStorage` and sent as `Authorization: Bearer <token>` headers.
- **Role guards** are enforced both on the frontend (page redirect) and backend (`middleware/auth.js`).

---

## 📋 NOC Workflow

```
┌──────────────┐    Submit     ┌──────────────┐   Review    ┌──────────────┐
│   Student    │ ────────────► │   Faculty    │ ──────────► │    Admin     │
│  Dashboard   │               │  Dashboard   │             │  Dashboard   │
└──────────────┘               └──────────────┘             └──────────────┘
       │                              │                            │
  Fill NOC Form               Approve / Reject              Override / Manage
  Upload Docs                 Add Comments                  Generate Reports
       │                              │
       ▼                              ▼
  Status: Pending           Status: Approved / Rejected
                                      │
                             ┌────────┴────────┐
                             │  PDF Generated  │
                             │  Email Sent     │
                             └─────────────────┘
```

**NOC Status Values:** `pending` → `under_review` → `approved` / `rejected`

---

## 🔌 API Endpoints

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/google` | Google OAuth token verification → JWT |
| POST | `/login` | Direct login (faculty/admin) |
| POST | `/register` | New user registration |
| GET | `/me` | Get current user profile |
| POST | `/logout` | Invalidate session |

### NOC Requests — `/api/noc`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List NOC requests (filtered by role) |
| POST | `/` | Submit a new NOC request |
| GET | `/:id` | Get NOC request details |
| PUT | `/:id` | Update NOC request |
| DELETE | `/:id` | Delete NOC request |
| PUT | `/:id/approve` | Faculty/Admin approve |
| PUT | `/:id/reject` | Faculty/Admin reject |
| GET | `/:id/pdf` | Generate & download NOC PDF |

### Users — `/api/users`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all users (admin) |
| GET | `/:id` | Get user by ID |
| PUT | `/:id` | Update user profile |
| DELETE | `/:id` | Delete user (admin) |

### Companies — `/api/companies`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all companies |
| POST | `/` | Add company |
| PUT | `/:id` | Update company |
| DELETE | `/:id` | Delete company |
| POST | `/import` | Bulk import from Excel (.xlsx) |

### Signatures — `/api/signatures`
| Method | Route | Description |
|---|---|---|
| GET | `/` | Get current user's signature |
| POST | `/` | Upload/save e-signature |

### Uploads — `/api/uploads`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Upload document file (Multer) |

### Email — `/api/email`
| Method | Route | Description |
|---|---|---|
| POST | `/send` | Trigger manual email |
| GET | `/logs` | View email audit logs |

---

## 🖥️ Frontend Pages

| Page | File | Role |
|---|---|---|
| Landing / Login | `index.html` | All |
| Register | `register.html` | New users |
| Forgot Password | `forgot-password.html` | All |
| Student Dashboard | `student-dashboard.html` | Student |
| NOC Request Form | `noc-request.html` | Student |
| Application Status | `application-status.html` | Student |
| Faculty Dashboard | `faculty-dashboard.html` | Faculty |
| NOC Review | `faculty-noc-review.html` | Faculty |
| Admin Dashboard | `admin-dashboard.html` | Admin |
| Records & Reports | `records-reports.html` | Admin |
| Upload Documents | `upload-documents.html` | Student/Admin |
| About | `about.html` | Public |
| Contact | `contact.html` | Public |
| Access Denied | `access-denied.html` | All |

---

## 🖱️ Scripts & Utilities

Run from the **project root**:

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend concurrently (dev mode) |
| `npm run start` | Start backend + frontend (production mode) |
| `npm run backend` | Start backend only |
| `npm run frontend` | Start frontend static server only |
| `npm run install-all` | Install root + backend dependencies |
| `npm run verify` | Run config verification script |

**Windows Batch Scripts** (in `scripts/`):

| Script | Description |
|---|---|
| `start-portal.bat` | Full stack launcher (recommended for Windows) |
| `restart-backend.bat` | Restart backend without stopping frontend |
| `check-backend.bat` | Ping backend health endpoint |
| `verify-config.bat` | Validate `.env` and DB connection |

---

## 📖 Documentation

All docs are in the `docs/` directory:

| File | Description |
|---|---|
| `QUICKSTART.md` | Step-by-step getting started guide |
| `GOOGLE_OAUTH_SETUP.md` | Google Cloud Console OAuth setup |
| `FEATURES.txt` | Complete feature inventory |
| `TESTING_GUIDE.md` | Manual + API testing instructions |
| `TESTING_QUICK_GUIDE.md` | Quick smoke-test checklist |
| `NOC_WORKFLOW_IMPLEMENTATION.md` | Workflow technical details |
| `PROJECT_STATUS_REPORT.md` | Current project status & known issues |
| `AUTHENTICATION_CONFIG_GUIDE.md` | Auth architecture deep-dive |
| `BACKEND_CONNECTION_FIX.md` | Common connection troubleshooting |
| `FRONTEND_INDEPENDENCE.md` | How frontend handles offline/backend-down |

---

## 🔒 Security Features

- **Helmet.js** — Sets secure HTTP headers
- **express-rate-limit** — Prevents brute-force attacks on auth endpoints
- **bcryptjs** — Password hashing for direct-login accounts
- **JWT** — Stateless, signed auth tokens (7-day expiry)
- **Domain Validation** — Only `@charusat.edu.in` / `@charusat.ac.in` emails accepted
- **CORS Whitelist** — Only the configured `FRONTEND_URL` is allowed
- **.gitignore** — `.env` and `uploads/` excluded from version control

---

## 📌 Known Limitations / Future Work

- Email delivery requires Gmail App Password (no OAuth2 mail flow yet)
- No automated tests (Jest/Supertest) — manual testing only
- PDF generation is client-side (browser print API); no server-side PDF yet
- No Docker / containerization support yet

---

*Last updated: April 2026 — v2.0.0*
