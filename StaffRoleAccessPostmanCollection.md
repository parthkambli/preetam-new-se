# Staff Role Access - Postman Collection Documentation

## Overview

This document provides comprehensive API documentation for testing the Staff Role Access system. The system supports two main staff roles: `SchoolStaff` and `FitnessStaff`, each with organization-specific access controls.

## Base URL
```
{{BASE_URL}}/api
```

## Environment Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| BASE_URL | http://localhost:5000 | Backend server URL |

---

## Authentication Endpoints

### 1. Staff Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticate staff users and get JWT token with organization access.

**Request Body:**
```json
{
  "userId": "SCHSTF1234",
  "password": "staff123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizations": [
    {
      "id": "school",
      "name": "Preetam Senior Citizen School",
      "label": "Senior Citizen School"
    }
  ],
  "defaultOrg": {
    "id": "school",
    "name": "Preetam Senior Citizen School",
    "label": "Senior Citizen School"
  },
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "SCHSTF1234",
    "fullName": "John Doe",
    "role": "SchoolStaff",
    "userType": "staff",
    "organizationId": "school",
    "staffId": "64f8a1b2c3d4e5f6a7b8c9d1"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing userId or password

**Test Cases:**
```json
// School Staff Login
{
  "userId": "SCHSTF1234",
  "password": "staff123"
}

// Fitness Staff Login
{
  "userId": "FITSTF5678",
  "password": "staff123"
}

// Invalid Credentials
{
  "userId": "INVALID123",
  "password": "wrongpass"
}
```

---

### 2. Get Current User Info
**Endpoint:** `GET /auth/me`

**Description:** Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "SCHSTF1234",
    "fullName": "John Doe",
    "role": "SchoolStaff",
    "userType": "staff",
    "organizationId": "school",
    "staffId": "64f8a1b2c3d4e5f6a7b8c9d1"
  },
  "organizations": [
    {
      "id": "school",
      "name": "Preetam Senior Citizen School",
      "label": "Senior Citizen School"
    }
  ]
}
```

---

## Staff Management Endpoints

### 3. Create Staff Member
**Endpoint:** `POST /staff`

**Description:** Create a new staff member. Automatically generates user account with login credentials.

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
fullName: "Jane Smith"
mobile: "9876543210"
email: "jane@school.com"
role: "Teacher"
employmentType: "Full-time"
gender: "Female"
dob: "1990-01-15"
joiningDate: "2024-01-01"
status: "Active"
salary: "50000"
fullAddress: "123 Main St, City, State"
emergencyContactName: "Emergency Contact"
emergencyContactRelation: "Spouse"
emergencyContactMobile: "9876543211"
photo: [file upload - optional]
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Staff member created successfully with login credentials.",
  "data": {
    "staff": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "fullName": "Jane Smith",
      "mobile": "9876543210",
      "email": "jane@school.com",
      "role": "Teacher",
      "organizationId": "school",
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "userCredentials": {
      "userId": "SCHSTF2345",
      "password": "staff123"
    }
  }
}
```

**Test Cases:**
```javascript
// School Staff Creation
const formData = new FormData();
formData.append('fullName', 'John Teacher');
formData.append('mobile', '9876543210');
formData.append('email', 'john@school.com');
formData.append('role', 'Teacher');
formData.append('employmentType', 'Full-time');
formData.append('gender', 'Male');
formData.append('joiningDate', '2024-01-01');
formData.append('status', 'Active');

// Fitness Staff Creation
const formData = new FormData();
formData.append('fullName', 'Mike Trainer');
formData.append('mobile', '9876543211');
formData.append('email', 'mike@fitness.com');
formData.append('role', 'Trainer');
formData.append('employmentType', 'Part-time');
formData.append('gender', 'Male');
formData.append('joiningDate', '2024-01-01');
formData.append('status', 'Active');
```

---

### 4. Get All Staff Members
**Endpoint:** `GET /staff`

**Description:** Get all staff members for the current organization.

**Headers:**
```
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `name`: Filter by staff name (optional)
- `mobile`: Filter by mobile number (optional)
- `role`: Filter by role (optional)
- `employmentType`: Filter by employment type (optional)
- `status`: Filter by status (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "fullName": "John Doe",
      "mobile": "9876543210",
      "email": "john@school.com",
      "role": "Teacher",
      "organizationId": "school",
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "fullName": "Jane Smith",
      "mobile": "9876543211",
      "email": "jane@school.com",
      "role": "Admin",
      "organizationId": "school",
      "status": "Active",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Test Cases:**
```bash
# Get all staff
GET /staff

# Filter by name
GET /staff?name=John

# Filter by role
GET /staff?role=Teacher

# Filter by status
GET /staff?status=Active
```

---

### 5. Get Staff Member by ID
**Endpoint:** `GET /staff/:id`

**Description:** Get a specific staff member by ID.

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "fullName": "John Doe",
    "mobile": "9876543210",
    "email": "john@school.com",
    "role": "Teacher",
    "organizationId": "school",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Staff member not found

---

### 6. Update Staff Member
**Endpoint:** `PUT /staff/:id`

**Description:** Update an existing staff member.

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
fullName: "John Doe Updated"
mobile: "9876543210"
email: "john.updated@school.com"
role: "Senior Teacher"
employmentType: "Full-time"
status: "Active"
salary: "55000"
photo: [file upload - optional]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Staff updated successfully.",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "fullName": "John Doe Updated",
    "mobile": "9876543210",
    "email": "john.updated@school.com",
    "role": "Senior Teacher",
    "organizationId": "school",
    "status": "Active",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 7. Delete Staff Member
**Endpoint:** `DELETE /staff/:id`

**Description:** Delete a staff member and their associated user account.

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Staff member and their login account deleted successfully."
}
```

**Error Responses:**
- `404 Not Found`: Staff member not found

---

## Role-Based Access Examples

### School Staff Access
```bash
# Login as School Staff
POST /auth/login
{
  "userId": "SCHSTF1234",
  "password": "staff123"
}

# Access School Endpoints (Allowed)
GET /staff
GET /staff/64f8a1b2c3d4e5f6a7b8c9d0
PUT /staff/64f8a1b2c3d4e5f6a7b8c9d0

# Access Fitness Endpoints (Denied/Empty)
GET /fitness/staff  # Will return empty or unauthorized
```

### Fitness Staff Access
```bash
# Login as Fitness Staff
POST /auth/login
{
  "userId": "FITSTF5678",
  "password": "staff123"
}

# Access Fitness Endpoints (Allowed)
GET /staff  # Returns fitness staff only
GET /staff/64f8a1b2c3d4e5f6a7b8c9d0

# Access School Endpoints (Denied/Empty)
GET /school/staff  # Will return empty or unauthorized
```

---

## Postman Collection Setup

### 1. Environment Setup
Create environment variables:
```
BASE_URL = http://localhost:5000
admin_token = {{admin_login_response.token}}
school_staff_token = {{school_staff_login_response.token}}
fitness_staff_token = {{fitness_staff_login_response.token}}
```

### 2. Collection Structure
```
Staff Role Access System
|
|-- Authentication
|   |-- Login (Admin)
|   |-- Login (School Staff)
|   |-- Login (Fitness Staff)
|   |-- Get Current User
|
|-- Staff Management (Admin Only)
|   |-- Create Staff
|   |-- Get All Staff
|   |-- Get Staff by ID
|   |-- Update Staff
|   |-- Delete Staff
|
|-- Staff Access Tests
|   |-- School Staff Access Test
|   |-- Fitness Staff Access Test
```

### 3. Test Scripts

#### Login Test Script
```javascript
// Tests tab
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.token).to.be.a('string');
    
    // Set environment variable
    if (jsonData.user.role === 'SchoolStaff') {
        pm.environment.set("school_staff_token", jsonData.token);
    } else if (jsonData.user.role === 'FitnessStaff') {
        pm.environment.set("fitness_staff_token", jsonData.token);
    } else if (jsonData.user.role === 'Admin') {
        pm.environment.set("admin_token", jsonData.token);
    }
});

pm.test("User has correct role", function () {
    const jsonData = pm.response.json();
    pm.expect(['SchoolStaff', 'FitnessStaff', 'Admin']).to.include(jsonData.user.role);
});
```

#### Staff Creation Test Script
```javascript
pm.test("Staff created successfully", function () {
    pm.response.to.have.status(201);
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data.userCredentials).to.exist;
    pm.expect(jsonData.data.userCredentials.userId).to.match(/^(SCHSTF|FITSTF)\d{4}$/);
});

// Save generated credentials for testing
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("test_staff_userId", jsonData.data.userCredentials.userId);
    pm.environment.set("test_staff_password", jsonData.data.userCredentials.password);
}
```

---

## Common Test Scenarios

### Scenario 1: Complete Staff Workflow
1. **Admin Login** - Get admin token
2. **Create School Staff** - Generate credentials
3. **Login as School Staff** - Verify access
4. **Access School Resources** - Test permissions
5. **Update Staff Profile** - Modify staff data
6. **Delete Staff** - Clean up test data

### Scenario 2: Role Isolation Test
1. **Create School Staff** - Generate school credentials
2. **Create Fitness Staff** - Generate fitness credentials
3. **Login as School Staff** - Verify only school access
4. **Login as Fitness Staff** - Verify only fitness access
5. **Cross-Access Tests** - Verify isolation

### Scenario 3: Error Handling Tests
1. **Invalid Login** - Wrong credentials
2. **Unauthorized Access** - Access without token
3. **Cross-Organization Access** - School staff accessing fitness
4. **Invalid Staff ID** - Non-existent staff member
5. **Duplicate Creation** - Same mobile number

---

## Response Codes Summary

| Code | Description | Context |
|------|-------------|---------|
| 200 | OK | Successful GET/PUT requests |
| 201 | Created | Staff member created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid/missing credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 413 | Payload Too Large | File size exceeded |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

---

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend allows frontend origin
2. **Token Expired**: Re-authenticate to get new token
3. **File Upload Issues**: Check file size (<2MB) and format
4. **Role Access Denied**: Verify user role and organization
5. **Database Connection**: Ensure MongoDB is running

### Debug Tips
- Check network tab in browser for failed requests
- Verify JWT token format and expiration
- Test with admin credentials first
- Check server logs for detailed error messages
- Use Postman Console for debugging scripts

---

## Security Considerations

1. **JWT Tokens**: Store tokens securely, use HTTPS
2. **Password Security**: Default passwords should be changed on first login
3. **File Uploads**: Validate file types and sizes
4. **Rate Limiting**: Implement for login endpoints
5. **Input Validation**: Server-side validation is required
6. **Role Verification**: Always verify user role on sensitive operations

---

*This documentation covers the complete Staff Role Access API for testing with Postman. For any additional endpoints or modifications, refer to the backend controller files.*
