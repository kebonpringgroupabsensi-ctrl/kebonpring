# Project Memory: Warung Request (Kebon Pring)

## 📌 Overview
Warung Request is a comprehensive employee management and attendance system built for **Kebon Pring**. The application features role-based access control, face-recognition-based attendance, and automated shift/leave management.

## 🛠 Tech Stack
- **Frontend**: React.js (Vite), Lucide React (Icons), React Query (State management/Caching).
- **Backend**: Node.js (Express.js).
- **Database & Auth**: Supabase (PostgreSQL, Auth, Storage).
- **Styling**: Vanilla CSS with a modern **Glassmorphism** aesthetic.
- **Features**: Face-api.js (Local face recognition), Geolocation API.

## 👥 Role Hierarchy
1. **Owner** (formerly Super Admin): Full access to all branches, global settings, and admin management.
2. **Admin Cabang**: Manages employees, shifts, and attendance specifically for their assigned branch.
3. **Karyawan**: Access to personal dashboard, attendance (Check-in/Out), leave requests, and history.

## 🎨 Design System
- **Primary Color**: `#3d5c34` (Forest Green) - Harmonized across all buttons, icons, and status labels.
- **Theme**: Support for Light and Dark modes (Dark mode is high-contrast dominant black).
- **Visual Style**: Minimalist glassmorphism, rounded corners (12px to 28px), and subtle glowing animations.
- **Login Aesthetic**: Premium dark theme with animated lanterns and fireflies background.

## 🚀 Critical Technical Implementations

### 1. Mobile Responsiveness (Dynamic Viewport)
The application uses `100dvh` and `env(safe-area-inset-bottom)` to prevent the bottom navigation menu from being obscured by mobile browser UI (Chrome/Safari bars).
- **File**: `frontend/src/dashboard.css`
- **Key Class**: `.bottom-nav` (position: fixed, height: 85px, custom padding).

### 2. Face Verification Flow
Face recognition is performed locally using `face-api.js`.
- **Workflow**: 500ms UI-sync delay -> Load Models -> Detect Face -> Compare with stored descriptor (Threshold: 0.5).
- **File**: `frontend/src/pages/Karyawan/KaryawanAbsen.jsx`

### 3. Backend Employee Creation (Upsert Logic)
To prevent race conditions with database triggers during new employee creation, the backend uses an `upsert` strategy for profile records.
- **File**: `backend/src/routes/employees.js`

## 📅 Recent Major Updates (May 2026)
- **Rename**: Successfully transitioned all UI labels from "Super Admin" to "Owner".
- **Color Sync**: Updated global CSS variables to match the Kebon Pring branding green.
- **Fixes**: Resolved the "cannot coerce JSON" error in the admin employee management module.
- **Login Overhaul**: Added atmospheric glowing effects and fixed input alignment for mobile users.

---
*Documented on: 2026-05-04*
