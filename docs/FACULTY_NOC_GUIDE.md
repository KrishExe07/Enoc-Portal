# 📋 Faculty NOC Review - Quick Guide

## Where to See NOC Requests?

You have **TWO OPTIONS** to view and manage NOC requests:

---

### ✅ **OPTION 1: Faculty NOC Review Panel** (RECOMMENDED)
**Direct Link:** [faculty-noc-review.html](faculty-noc-review.html)

**Features:**
- ✅ Dedicated page just for NOC requests
- ✅ Clean, focused interface
- ✅ Quick approve/reject buttons
- ✅ Filter by status
- ✅ Search functionality

**How to Access:**
1. Login as Faculty
2. Open browser and go to: `http://localhost:8080/faculty-noc-review.html`
3. OR from Faculty Dashboard → Click **"NOC Review Panel"** in sidebar

---

### ✅ **OPTION 2: Faculty Dashboard - Pending Section**
**Direct Link:** [faculty-dashboard.html](faculty-dashboard.html)

**How to Access:**
1. Login as Faculty
2. Go to Faculty Dashboard
3. Click **"Pending Approvals"** in the sidebar
4. View all pending NOC requests

---

## 🎯 Quick Workflow

### For Faculty:
1. **Open NOC Review Panel** (Option 1 or 2 above)
2. **View Pending Requests** - See list of student NOC submissions
3. **Review Details** - Click "View Details" to see full information
4. **Take Action:**
   - ✅ Click **"Approve"** → Student can download PDF
   - ❌ Click **"Reject"** → Enter reason → Student sees why it was rejected

---

## 🔍 What You'll See

Each NOC request shows:
- ✅ **Student Name**
- ✅ **Enrollment Number**
- ✅ **Department**
- ✅ **Email**
- ✅ **Semester**
- ✅ **Company Name & Location**
- ✅ **Internship Duration**
- ✅ **Submission Date**
- ✅ **Current Status**

---

## 🚨 Troubleshooting

### "No NOC Requests Yet" Message?

**Possible Reasons:**
1. ❌ Students haven't submitted any requests yet
2. ❌ Backend server is not running
3. ❌ All requests have been approved/rejected (check "All Status" filter)

**Solutions:**
1. ✅ Ask a student to submit a test NOC request
2. ✅ Make sure backend is running: `cd backend && node server.js`
3. ✅ Change filter to "All Status" to see all requests
4. ✅ Click "🔄 Refresh" button

---

### Backend Not Running?

**Error Message:** "Error Loading Requests - Could not connect to backend server"

**Solution:**
```powershell
# Terminal 1 - Start Backend
cd backend
node server.js

# Terminal 2 - Start Frontend
node frontend-server.js
```

Then refresh the page.

---

## 📊 Filter Options

Use the dropdown to filter requests by status:
- **All Status** - Show everything
- **Submitted (Pending)** - Only new requests (DEFAULT)
- **Under Review** - Requests being reviewed
- **Approved** - Already approved
- **Rejected** - Already rejected

---

## 💡 Tips

1. **Default Filter:** Page opens with "Submitted (Pending)" filter to show only new requests
2. **Refresh:** Click 🔄 Refresh button to reload latest data
3. **Search:** Type student name or company name to filter results
4. **Quick Actions:** Approve/Reject buttons appear directly on each card

---

## 🔗 Quick Links

1. **Faculty NOC Review Panel:** `http://localhost:8080/faculty-noc-review.html`
2. **Faculty Dashboard:** `http://localhost:8080/faculty-dashboard.html`
3. **Student Portal:** `http://localhost:8080/student-dashboard.html`

---

## ✅ Test It Now!

### Quick Test Steps:
1. **As Student:**
   - Login → Go to NOC Request
   - Fill form → Submit
   
2. **As Faculty:**
   - Open: `http://localhost:8080/faculty-noc-review.html`
   - You should see the submitted request
   - Click "Approve" or "Reject"

3. **Back as Student:**
   - Refresh dashboard
   - If approved → See "Download PDF" button
   - If rejected → See rejection reason

---

## 🎉 That's It!

You're all set! NOC requests will appear automatically when students submit them.

**Need Help?** Check the console (F12) for error messages.
