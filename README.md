<<<<<<< HEAD
# Lost2Found — College Campus Lost & Found Management System

> **Tagline:** Lost it? Found it? Get it back.

Lost2Found is a production-quality, responsive, and secure college campus lost and found web application. Built with Node.js, Express.js, MongoDB (Mongoose), Cloudinary media storage, Bootstrap 5, and JavaScript, it connects students, faculty/staff, security officers, and campus administrators into one digital platform.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**
   - **STUDENT**: Report lost & found items, search directory, submit claims with ownership proof, view personal dashboard & notifications.
   - **STAFF / SECURITY**: Review pending reports, verify hidden ownership answers, approve/reject claims, issue handover codes, confirm physical item returns.
   - **ADMIN**: Complete system access to manage users (role switching, account suspension), configure categories and campus locations, view Chart.js analytics, inspect system audit logs.

2. **Smart Weighted Matching Engine**
   - Automated 6-factor algorithm that matches lost items against active found item reports:
     - Category match = 25%
     - Campus Location similarity = 25%
     - Color match = 15%
     - Brand match = 10%
     - Date proximity = 15%
     - Description keyword token overlap = 10%
     - **Default Threshold:** 70% (Configurable)

3. **Privacy Shield Protection**
   - Sensitive identifying information (cash amounts, ID card numbers, laptop serial suffixes, custom sticker locations) are kept private and hidden from public REST API responses.
   - Only accessible to campus staff during ownership verification.

4. **Secure Handover Verification Code System**
   - When a claim is approved by campus staff, a unique verification code (e.g. `L2F-8492`) is generated.
   - Student presents their physical college ID and handover code at the Security Office to safely collect the item.

5. **In-App & Email Notifications**
   - Automated Nodemailer email dispatch for OTP registration, claim approvals, handover code generation, and return confirmations.
   - Real-time in-app notification center.

6. **Analytics & Audit Log**
   - Chart.js visual metrics (Lost vs Found, Category breakdowns, Campus Location hot-spots, Recovery Rate %).
   - Security audit trail recording user logins, report creations, claim decisions, and admin configuration changes.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Custom Design System + HSL colors), Vanilla JavaScript, Bootstrap 5, Chart.js, FontAwesome
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas / Local MongoDB (Mongoose ODM)
- **Media Storage:** Cloudinary (with local upload fallback)
- **Authentication:** JWT, bcryptjs, 6-digit Email OTP Verification
- **Email:** Nodemailer (with development console fallback)
- **Security:** Helmet, Rate Limiting, CORS, Express Validator

---

## 📁 Folder Structure

```
college lost and found/
├── package.json
├── .env.example
├── .env
├── README.md
├── backend/
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── models/
│   │   ├── User.js
│   │   ├── LostItem.js
│   │   ├── FoundItem.js
│   │   ├── Claim.js
│   │   ├── Notification.js
│   │   ├── Report.js
│   │   ├── Category.js
│   │   ├── Location.js
│   │   ├── AuditLog.js
│   │   └── OTP.js
│   ├── services/
│   │   ├── matchingService.js
│   │   ├── emailService.js
│   │   ├── cloudinaryService.js
│   │   └── notificationService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── lostController.js
│   │   ├── foundController.js
│   │   ├── claimController.js
│   │   ├── matchController.js
│   │   ├── notificationController.js
│   │   ├── reportController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── lostRoutes.js
│   │   ├── foundRoutes.js
│   │   ├── claimRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── reportRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── role.js
│   │   ├── upload.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── generateCode.js
│   ├── seed/
│   │   └── seedData.js
│   └── tests/
│       └── app.test.js
└── frontend/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── verify.html
    ├── dashboard.html
    ├── lost-items.html
    ├── found-items.html
    ├── report-lost.html
    ├── report-found.html
    ├── item.html
    ├── claim.html
    ├── notifications.html
    ├── profile.html
    ├── how-it-works.html
    ├── about.html
    ├── admin/
    │   ├── dashboard.html
    │   ├── users.html
    │   ├── items.html
    │   ├── claims.html
    │   ├── reports.html
    │   ├── analytics.html
    │   ├── settings.html
    │   └── audit-logs.html
    ├── css/
    │   ├── style.css
    │   ├── dashboard.css
    │   └── admin.css
    └── js/
        ├── api.js
        ├── auth.js
        ├── navbar.js
        ├── dashboard.js
        └── admin.js
```

---

## ⚡ Quick Start & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/lost2found.git
cd lost2found
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/lost2found
JWT_SECRET=super_secret_lost2found_jwt_key_2026

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

COLLEGE_EMAIL_DOMAIN=college.edu
MATCH_THRESHOLD=70
```

### 3. Seed Database with Demo Accounts
Populate default categories, campus locations, demo users, sample items, and matching scenarios:
```bash
npm run seed
```

#### Demo User Credentials (Password for all: `Password123!`)
- 🛡️ **ADMIN:** `admin@college.edu`
- 👮 **STAFF / SECURITY:** `staff@college.edu`
- 🎓 **STUDENT:** `student@college.edu`

### 4. Run Development Server
```bash
npm start
```
Open **`http://localhost:5000`** in your web browser.

---

## 🧪 Running Automated Tests

Run the built-in node test suite verifying authentication hashing, OTP generation, smart matching weighted scoring, and security guards:
```bash
npm test
```

---

## 🌐 REST API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user & send OTP | Public |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/lost` | Search & filter lost items | Public |
| `GET` | `/api/found` | Search & filter found items | Public |
| `POST` | `/api/lost` | Report new lost item | Authenticated |
| `POST` | `/api/found` | Report new found item | Authenticated |
| `GET` | `/api/matches/:itemId` | Get smart matches & scores | Public |
| `POST` | `/api/claims` | Submit ownership claim | Authenticated |
| `PUT` | `/api/claims/:id/review` | Approve/Reject claim | Staff / Admin |
| `POST` | `/api/claims/:id/handover` | Verify code & return item | Staff / Admin |
| `GET` | `/api/admin/dashboard` | KPI stats & Chart.js data | Staff / Admin |
| `PUT` | `/api/admin/users/:id/role` | Change user role | Admin Only |
| `GET` | `/api/admin/audit-logs` | View security audit trail | Admin Only |

---

## 🚀 Deployment Guidelines

1. **Database:** Deploy a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and set `MONGO_URI`.
2. **Media:** Create a free account on [Cloudinary](https://cloudinary.com/) and set credentials in `.env`.
3. **Node Server:** Deploy backend to [Render](https://render.com/), [Railway](https://railway.app/), or Vercel Node Serverless.

---

## 📄 License
This project is open source and available under the [ISC License](LICENSE).
=======
# Harshproject
 college lost and find  software
>>>>>>> 32586ce8a2b65129e8276816b42facb882410c1f
