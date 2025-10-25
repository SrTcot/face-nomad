# FaceNomad v1.6.0

### Overview
FaceNomad is an offline-first, biometric facial recognition system designed for secure and rapid worker attendance tracking (in/out). It targets rural environments with limited internet access, operating fully offline using OpenCV's LBPH technology. The system is a Progressive Web Application (PWA) built with React and Flask, optimized for Android tablets and touchscreens. Its core purpose is to provide robust attendance tracking with automatic data synchronization when connectivity becomes available, addressing the critical need for reliable operation in challenging conditions. The project aims to provide a reliable, easy-to-use, and maintainable system for workforce management.

### User Preferences
- Diseño minimalista y funcional
- Optimizado para bajo nivel técnico
- Prioridad en usabilidad sobre estética
- Funcionamiento offline esencial
- Interfaz en español por defecto
- Reconocimiento facial real con OpenCV

### System Architecture
FaceNomad employs a client-server architecture consisting of a React PWA frontend and a Python Flask backend.

**UI/UX Decisions:**
- Designed for touchscreens with large buttons (min 80x80px), high contrast (green/brown/white palette), agricultural iconography, and immediate visual feedback.
- Minimalist and functional design, prioritizing usability over aesthetics.
- Default interface in Spanish.

**Technical Implementations:**
- **Frontend (PWA):**
    - **Technology:** React 18, Vite 5, TailwindCSS, React Router, i18next (ES/EN), IndexedDB (`idb`) for offline storage, Lucide React for icons, Vite PWA Plugin.
    - **Core Features:** Real-time camera access, six primary screens (Welcome, Capture, Validation, History, Configuration, Worker Registration/Management), offline data storage via IndexedDB, internationalization, installable as a native app on Android.
    - **Authentication:** JWT-based authentication with role-based access control (Admin, Supervisor, Operator).
    - **Data Integrity:** Strict duplicate record prevention for attendance entries.
    - **Synchronization:** Modular cloud sync API with a supervisor/admin approval system for operator-initiated synchronizations.
    - **Local Data Security:** Local data encryption using Web Crypto API (AES-GCM 256-bit).
- **Backend (Flask):**
    - **Technology:** Python 3.11, Flask 3.0.0, Flask-CORS 4.0.0, OpenCV Contrib 4.8.1.78 (LBPH facial recognition), NumPy, Pillow.
    - **Facial Recognition:** Utilizes LBPH with Haar Cascade for face detection, with automatic model training upon worker registration or server startup. Worker photos are stored as JPEG files in `backend/dataset/`.
    - **Worker Management:** Manages worker data (name, photo path, registration timestamp, registered by user, active status) in an SQLite database.
    - **API Endpoints:** Provides RESTful APIs for health checks, facial recognition, worker registration/management (CRUD), and synchronization with MongoDB Atlas.

**Feature Specifications:**
- **Offline-First:** All data, including attendance records, is stored locally in IndexedDB, ensuring full functionality without internet.
- **Role-Based Access Control:**
    - **Admin:** Full CRUD for users, workers, attendance, and MongoDB data management.
    - **Supervisor:** View attendance history, approve operator sync requests, and synchronize attendance data to the cloud. Limited attendance registration.
    - **Operator:** Register attendance (entry/exit) only. Requires supervisor/admin approval for cloud synchronization.
- **Comprehensive Data Management:**
    - Admin panel for user management (CRUD).
    - Batch deletion for attendance records and workers with checkbox selection.
    - MongoDB management panel for Admins to view and delete workers/attendance in the cloud.
- **Traceability:** Worker registration includes timestamps and tracks the registering admin user.

**System Design Choices:**
- **Dual Workflow:** Frontend and Backend run as separate processes, communicating via a REST API.
- **Data Storage:** SQLite for backend worker metadata, IndexedDB for frontend offline attendance, and MongoDB Atlas for optional cloud synchronization.
- **Security:** JWT authentication, role-based access, and secure handling of sensitive credentials via Replit Secrets.

### External Dependencies
- **OpenCV Contrib:** Core library for LBPH facial recognition and Haar Cascade for face detection.
- **IndexedDB (via `idb` library):** Used by the frontend for persistent offline storage of attendance records.
- **Vite PWA Plugin:** Enables Progressive Web App features, including service workers and manifest generation.
- **Flask-CORS:** Manages Cross-Origin Resource Sharing for frontend-backend communication.
- **pymongo:** Python driver for MongoDB Atlas cloud database integration.
- **MongoDB Atlas:** Cloud database for optional storage and synchronization of worker and attendance data.
### Recent Changes

**October 25, 2025 - Production Deployment Configuration v2**
- **Reserved VM Deployment (Single-Port Architecture):**
  - Changed from Autoscale to Reserved VM (optimal for production deployment)
  - **Unified Server:** Flask now serves both frontend and backend from a single port
  - **Build Process:** `start.sh` compiles React frontend with `npm run build`, then Flask serves static files from `dist/`
  - **Production Mode:** Flask auto-detects production mode when `dist/` exists and serves React app
  - **Development Mode:** Frontend on port 5000 (Vite), Backend on port 8000 (Flask) - Vite proxy redirects `/api` to backend
- **Port Configuration:**
  - **Production:** Single Flask server on port 5000 → External Port 80
  - **Development:** Frontend (5000) with proxy + Backend (8000)
- **Deployment Script:**
  - `start.sh` builds frontend and starts Flask on PORT=5000
  - Flask serves index.html for all non-API routes (React Router support)
  - API routes accessible at `/api/*`

### Version Information
**Current Version:** v1.6.0
**Deployment Type:** Reserved VM
**Production Ready:** Yes
