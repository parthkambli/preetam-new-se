# Backend Setup & Running Guide

## Prerequisites
- MongoDB installed and running locally (or use MongoDB Atlas)
- Node.js installed

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Edit `backend/.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/preetam-school-club
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
```

### 3. Create First Admin User
Run this one-time script to create the admin user:
```bash
npm run create-admin
```

**Default Credentials:**
- User ID: `admin123`
- Password: `admin@preetam2025`

### 4. Start the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with userId and password
- `GET /api/auth/me` - Get current admin info (protected)

### Login Request Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin123","password":"admin@preetam2025"}'
```

### Login Response Example
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizations": [
    {
      "id": "school",
      "name": "Preetam Senior Citizen School",
      "label": "Senior Citizen School"
    },
    {
      "id": "fitness",
      "name": "Sport Fitness Club",
      "label": "Sport Fitness Club"
    }
  ],
  "defaultOrg": {
    "id": "school",
    "name": "Preetam Senior Citizen School",
    "label": "Senior Citizen School"
  },
  "user": {
    "id": "...",
    "userId": "admin123",
    "fullName": "Super Admin",
    "role": "superadmin"
  }
}
```

## Protected Routes

All protected routes require:
- `Authorization: Bearer <token>` header
- `X-Organization-ID: <org-id>` header

The middleware automatically validates the token and checks if the user has access to the requested organization.

## Database Structure

The backend uses a single-table approach with `organizationId` field for multi-tenancy:

- All data models should include `organizationId` field
- Queries are filtered by organization using the `X-Organization-ID` header
- Users can switch between organizations they have access to
