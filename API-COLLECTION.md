# Preetam School & Sports Club - API Collection

**Base URL:** `http://localhost:3000/api`

---

## Authentication

### Headers (Required for all protected routes)
```
Authorization: Bearer <your-jwt-token>
X-Organization-ID: <organization-id>
Content-Type: application/json
```

---

## 1. Auth Routes

### 1.1 Login
**POST** `/auth/login`

**Description:** Authenticate admin user and get JWT token

**Request Body:**
```json
{
  "userId": "admin123",
  "password": "admin@preetam2025"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "organizations": [
    {
      "id": "org1",
      "name": "Preetam School",
      "label": "school"
    }
  ],
  "defaultOrg": {
    "id": "org1",
    "name": "Preetam School",
    "label": "school"
  },
  "user": {
    "id": "65abc123...",
    "userId": "admin123",
    "fullName": "Admin User",
    "role": "admin"
  }
}
```

---

### 1.2 Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "65abc123...",
    "userId": "admin123",
    "fullName": "Admin User",
    "role": "admin"
  },
  "organizations": [
    {
      "id": "org1",
      "name": "Preetam School",
      "label": "school"
    }
  ]
}
```

---

## 2. School Enquiry Routes

### 2.1 Get All School Enquiries
**GET** `/school/enquiry`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Query Parameters (Optional):**
- `status` - Filter by status (New, Follow-up, Converted)
- `source` - Filter by source (Walk-in, App, Call, Website, Reference)
- `search` - Search by name or contact
- `date` - Filter by date (YYYY-MM-DD)

**Example:** `GET /school/enquiry?status=New&source=Walk-in`

**Response (200 OK):**
```json
[
  {
    "_id": "65abc456...",
    "name": "Ramesh Patil",
    "contact": "9876543210",
    "age": 62,
    "gender": "Male",
    "activity": "Yoga",
    "source": "Walk-in",
    "date": "2026-01-12T00:00:00.000Z",
    "status": "New",
    "remark": "",
    "nextVisit": null,
    "organizationId": "org1",
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T10:30:00.000Z"
  }
]
```

---

### 2.2 Get Single School Enquiry
**GET** `/school/enquiry/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "_id": "65abc456...",
  "name": "Ramesh Patil",
  "contact": "9876543210",
  "age": 62,
  "gender": "Male",
  "activity": "Yoga",
  "source": "Walk-in",
  "date": "2026-01-12T00:00:00.000Z",
  "status": "New",
  "remark": "",
  "organizationId": "org1"
}
```

---

### 2.3 Create School Enquiry
**POST** `/school/enquiry`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body:**
```json
{
  "name": "Suman Desai",
  "contact": "9123456789",
  "age": 58,
  "gender": "Female",
  "activity": "Music",
  "source": "App",
  "date": "2026-01-13"
}
```

**Response (201 Created):**
```json
{
  "_id": "65abc789...",
  "name": "Suman Desai",
  "contact": "9123456789",
  "age": 58,
  "gender": "Female",
  "activity": "Music",
  "source": "App",
  "date": "2026-01-13T00:00:00.000Z",
  "status": "New",
  "remark": "",
  "organizationId": "org1",
  "createdAt": "2026-01-13T09:00:00.000Z",
  "updatedAt": "2026-01-13T09:00:00.000Z"
}
```

---

### 2.4 Update School Enquiry
**PUT** `/school/enquiry/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body:**
```json
{
  "remark": "Interested, wants demo session",
  "status": "Follow-up",
  "nextVisit": "2026-01-20"
}
```

**Response (200 OK):**
```json
{
  "_id": "65abc456...",
  "name": "Ramesh Patil",
  "contact": "9876543210",
  "age": 62,
  "gender": "Male",
  "activity": "Yoga",
  "source": "Walk-in",
  "date": "2026-01-12T00:00:00.000Z",
  "status": "Follow-up",
  "remark": "Interested, wants demo session",
  "nextVisit": "2026-01-20T00:00:00.000Z",
  "organizationId": "org1",
  "updatedAt": "2026-01-15T14:30:00.000Z"
}
```

---

### 2.5 Delete School Enquiry
**DELETE** `/school/enquiry/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "message": "Enquiry deleted successfully"
}
```

---

## 3. Fitness Enquiry Routes

### 3.1 Get All Fitness Enquiries
**GET** `/fitness/enquiry`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Query Parameters (Optional):**
- `status` - Filter by status (New, Follow-up, Converted)
- `source` - Filter by source (Walk-in, App, Call, Website, Reference)
- `search` - Search by fullName or mobile
- `date` - Filter by date (YYYY-MM-DD)

**Response (200 OK):**
```json
[
  {
    "_id": "65abc111...",
    "fullName": "Rohit Sharma",
    "age": 35,
    "gender": "Male",
    "mobile": "9876543210",
    "interestedActivity": "Gym Fitness",
    "source": "Walk-in",
    "enquiryDate": "2026-01-20T00:00:00.000Z",
    "notes": "",
    "status": "New",
    "remark": "",
    "organizationId": "org1",
    "createdAt": "2026-01-20T11:00:00.000Z",
    "updatedAt": "2026-01-20T11:00:00.000Z"
  }
]
```

---

### 3.2 Get Single Fitness Enquiry
**GET** `/fitness/enquiry/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "_id": "65abc111...",
  "fullName": "Rohit Sharma",
  "age": 35,
  "gender": "Male",
  "mobile": "9876543210",
  "interestedActivity": "Gym Fitness",
  "source": "Walk-in",
  "enquiryDate": "2026-01-20T00:00:00.000Z",
  "notes": "",
  "status": "New",
  "remark": "",
  "organizationId": "org1"
}
```

---

### 3.3 Create Fitness Enquiry
**POST** `/fitness/enquiry`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body:**
```json
{
  "fullName": "Anjali Mehta",
  "age": 42,
  "gender": "Female",
  "mobile": "9123456789",
  "interestedActivity": "Yoga",
  "source": "App",
  "enquiryDate": "2026-01-19",
  "notes": "Interested in morning batch"
}
```

**Response (201 Created):**
```json
{
  "_id": "65abc222...",
  "fullName": "Anjali Mehta",
  "age": 42,
  "gender": "Female",
  "mobile": "9123456789",
  "interestedActivity": "Yoga",
  "source": "App",
  "enquiryDate": "2026-01-19T00:00:00.000Z",
  "notes": "Interested in morning batch",
  "status": "New",
  "remark": "",
  "organizationId": "org1",
  "createdAt": "2026-01-19T10:00:00.000Z",
  "updatedAt": "2026-01-19T10:00:00.000Z"
}
```

---

### 3.4 Update Fitness Enquiry
**PUT** `/fitness/enquiry/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body:**
```json
{
  "remark": "Follow up next week",
  "status": "Follow-up",
  "nextVisit": "2026-01-25"
}
```

**Response (200 OK):**
```json
{
  "_id": "65abc111...",
  "fullName": "Rohit Sharma",
  "age": 35,
  "gender": "Male",
  "mobile": "9876543210",
  "interestedActivity": "Gym Fitness",
  "source": "Walk-in",
  "enquiryDate": "2026-01-20T00:00:00.000Z",
  "notes": "",
  "status": "Follow-up",
  "remark": "Follow up next week",
  "nextVisit": "2026-01-25T00:00:00.000Z",
  "organizationId": "org1",
  "updatedAt": "2026-01-21T09:00:00.000Z"
}
```

---

### 3.5 Delete Fitness Enquiry
**DELETE** `/fitness/enquiry/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "message": "Enquiry deleted successfully"
}
```

---

## 4. School Admission Routes

### 4.1 Get All Admissions
**GET** `/school/admission`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Query Parameters (Optional):**
- `admissionId` - Filter by admission ID
- `name` - Filter by name (search)
- `mobile` - Filter by mobile (search)
- `feePlan` - Filter by fee plan (Daily, Monthly, Quarterly)
- `status` - Filter by status (Active, Inactive)

**Example:** `GET /school/admission?status=Active&feePlan=Monthly`

**Response (200 OK):**
```json
[
  {
    "_id": "65abc333...",
    "admissionId": "PSC20260117-518",
    "fullName": "Ramesh Patil",
    "age": 62,
    "gender": "Male",
    "mobile": "9876543210",
    "feePlan": "Monthly",
    "amount": 3600,
    "status": "Active",
    "paymentStatus": "Paid",
    "organizationId": "org1",
    "createdAt": "2026-01-17T08:00:00.000Z",
    "updatedAt": "2026-01-17T08:00:00.000Z"
  }
]
```

---

### 4.2 Get Single Admission
**GET** `/school/admission/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "_id": "65abc333...",
  "admissionId": "PSC20260117-518",
  "fullName": "Ramesh Patil",
  "age": 62,
  "gender": "Male",
  "dob": "1963-03-15T00:00:00.000Z",
  "aadhaar": "XXXX-XXXX-6789",
  "mobile": "9876543210",
  "fullAddress": "Flat 301, Sunshine Society, Pune - 411028",
  "physicalDisability": "No",
  "mainIllness": "None",
  "bloodGroup": "A+",
  "doctorName": "Dr. Ajay Sharma",
  "doctorVillage": "Hadapsar",
  "doctorMobile": "9823456789",
  "seriousDisease": "No",
  "regularMedication": "No",
  "healthDetails": "Generally fit, no major complaints",
  "education": "B.Com",
  "educationPlace": "Fergusson College, Pune",
  "yearsOfService": "32",
  "servicePlace": "State Bank of India",
  "occupationType": "Government",
  "wakeUpTime": "06:00",
  "breakfastTime": "08:00",
  "lunchTime": "13:00",
  "dinnerTime": "20:00",
  "behaviour": "Calm",
  "hobbies": ["Reading", "Gardening", "Music"],
  "games": ["Chess", "Carrom", "Ludo"],
  "emergencyContactName": "Sunita Patil",
  "relationship": "Wife",
  "emergencyMobile": "9890123456",
  "villageCity": "Pune",
  "alternateContact": "N/A",
  "declarationDate": "2026-01-17T00:00:00.000Z",
  "declarationPlace": "Pune",
  "loginMobile": "9876543210",
  "role": "Participant",
  "registrationDate": "2026-01-17T00:00:00.000Z",
  "assignedCaregiver": "Ms. Priya Deshmukh",
  "feePlan": "Monthly",
  "instituteType": "School",
  "amount": 3600,
  "messFacility": "No",
  "residency": "No",
  "paymentDate": "2026-01-17T00:00:00.000Z",
  "feeDescription": "Senior Citizen Happiness School (Age 55+)",
  "paymentStatus": "Paid",
  "paymentMode": "Cash",
  "nextDueDate": "2026-02-17T00:00:00.000Z",
  "feeRemarks": "First month paid in advance",
  "status": "Active",
  "organizationId": "org1"
}
```

---

### 4.3 Create Admission
**POST** `/school/admission`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body (Full):**
```json
{
  "fullName": "Suman Desai",
  "age": 58,
  "gender": "Female",
  "dob": "1967-05-20",
  "aadhaar": "1234-5678-9012",
  "mobile": "9123456789",
  "fullAddress": "Flat 205, Green Valley, Pune - 411030",
  "physicalDisability": "No",
  "mainIllness": "None",
  "bloodGroup": "B+",
  "doctorName": "Dr. Meera Joshi",
  "doctorVillage": "Kothrud",
  "doctorMobile": "9812345678",
  "seriousDisease": "No",
  "regularMedication": "No",
  "healthDetails": "Healthy",
  "education": "M.A.",
  "educationPlace": "Pune University",
  "yearsOfService": "28",
  "servicePlace": "City College",
  "occupationType": "Private",
  "wakeUpTime": "05:30",
  "breakfastTime": "07:30",
  "lunchTime": "12:30",
  "dinnerTime": "19:30",
  "behaviour": "Calm",
  "hobbies": ["Reading", "Cooking"],
  "games": ["Badminton", "Table Tennis"],
  "emergencyContactName": "Rajesh Desai",
  "relationship": "Husband",
  "emergencyMobile": "9234567890",
  "villageCity": "Pune",
  "alternateContact": "N/A",
  "declarationDate": "2026-01-15",
  "declarationPlace": "Pune",
  "loginMobile": "9123456789",
  "role": "Participant",
  "assignedCaregiver": "Ms. Neha Kulkarni",
  "feePlan": "Monthly",
  "instituteType": "School",
  "amount": 6000,
  "messFacility": "Yes",
  "residency": "No",
  "paymentDate": "2026-01-15",
  "feeDescription": "Senior Citizen Happiness School (Age 55+)",
  "paymentStatus": "Paid",
  "paymentMode": "UPI",
  "nextDueDate": "2026-02-15",
  "feeRemarks": "Paid via UPI"
}
```

**Response (201 Created):**
```json
{
  "_id": "65abc444...",
  "admissionId": "PSC20260115-412",
  "fullName": "Suman Desai",
  "age": 58,
  "gender": "Female",
  "mobile": "9123456789",
  "loginMobile": "9123456789",
  "feePlan": "Monthly",
  "amount": 6000,
  "paymentStatus": "Paid",
  "paymentMode": "UPI",
  "status": "Active",
  "organizationId": "org1",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

---

### 4.4 Update Admission
**PUT** `/school/admission/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body (Partial - only fields to update):**
```json
{
  "paymentStatus": "Pending",
  "feeRemarks": "Payment delayed, follow up scheduled",
  "nextDueDate": "2026-02-28"
}
```

**Response (200 OK):**
```json
{
  "_id": "65abc333...",
  "admissionId": "PSC20260117-518",
  "fullName": "Ramesh Patil",
  "age": 62,
  "gender": "Male",
  "mobile": "9876543210",
  "feePlan": "Monthly",
  "amount": 3600,
  "paymentStatus": "Pending",
  "paymentMode": "Cash",
  "nextDueDate": "2026-02-28T00:00:00.000Z",
  "feeRemarks": "Payment delayed, follow up scheduled",
  "status": "Active",
  "organizationId": "org1",
  "updatedAt": "2026-01-22T11:00:00.000Z"
}
```

---

### 4.5 Delete Admission
**DELETE** `/school/admission/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "message": "Admission deleted successfully"
}
```

---

## 5. Followups Routes

### 5.1 Get All Followups
**GET** `/followups`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Query Parameters (Optional):**
- `status` - Filter by status (New, Follow-up, Converted)
- `date` - Filter by followup date (YYYY-MM-DD)
- `search` - Search by personName or mobile
- `enquiryType` - Filter by type (school, fitness)

**Example:** `GET /followups?status=Follow-up&enquiryType=school`

**Response (200 OK):**
```json
[
  {
    "_id": "65abc555...",
    "enquiryType": "school",
    "enquiryId": "65abc456...",
    "personName": "Ramesh Patil",
    "mobile": "9876543210",
    "activity": "Yoga",
    "previousStatus": "New",
    "newStatus": "Follow-up",
    "remark": "Interested, wants demo session",
    "nextVisit": "2026-01-20T00:00:00.000Z",
    "followupDate": "2026-01-15T10:30:00.000Z",
    "organizationId": "org1",
    "createdBy": "admin123",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
]
```

---

### 5.2 Get Upcoming Followups
**GET** `/followups/upcoming`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
[
  {
    "_id": "65abc555...",
    "enquiryType": "school",
    "enquiryId": "65abc456...",
    "personName": "Ramesh Patil",
    "mobile": "9876543210",
    "activity": "Yoga",
    "newStatus": "Follow-up",
    "remark": "Interested, wants demo session",
    "nextVisit": "2026-01-20T00:00:00.000Z",
    "followupDate": "2026-01-15T10:30:00.000Z",
    "organizationId": "org1",
    "createdBy": "admin123"
  }
]
```

---

### 5.3 Create Followup
**POST** `/followups`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Request Body:**
```json
{
  "enquiryType": "school",
  "enquiryId": "65abc456...",
  "personName": "Ramesh Patil",
  "mobile": "9876543210",
  "activity": "Yoga",
  "newStatus": "Follow-up",
  "remark": "Interested, wants demo session",
  "nextVisit": "2026-01-20"
}
```

**Response (201 Created):**
```json
{
  "_id": "65abc555...",
  "enquiryType": "school",
  "enquiryId": "65abc456...",
  "personName": "Ramesh Patil",
  "mobile": "9876543210",
  "activity": "Yoga",
  "previousStatus": "New",
  "newStatus": "Follow-up",
  "remark": "Interested, wants demo session",
  "nextVisit": "2026-01-20T00:00:00.000Z",
  "followupDate": "2026-01-15T10:30:00.000Z",
  "organizationId": "org1",
  "createdBy": "admin123",
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

**Note:** This endpoint also updates the related enquiry's status, remark, and nextVisit fields automatically.

---

### 5.4 Delete Followup
**DELETE** `/followups/:id`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: org1
```

**Response (200 OK):**
```json
{
  "message": "Followup deleted successfully"
}
```

---

## 6. Health Check

### 5.1 Server Health
**GET** `/health`

**No authentication required**

**Response (200 OK):**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```
or
```json
{
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Organization not allowed"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin123","password":"admin@preetam2025"}'
```

### Get School Enquiries Example
```bash
curl -X GET "http://localhost:3000/api/school/enquiry?status=New" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Organization-ID: org1"
```

### Create Fitness Enquiry Example
```bash
curl -X POST http://localhost:3000/api/fitness/enquiry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Organization-ID: org1" \
  -d '{
    "fullName": "Test User",
    "age": 45,
    "gender": "Male",
    "mobile": "9999999999",
    "interestedActivity": "Swimming",
    "source": "Website"
  }'
```

---

## Notes

1. **Token Expiry:** JWT tokens expire after 24 hours
2. **Organization ID:** Required for all protected routes to ensure data isolation
3. **Auto-generated Fields:** 
   - `admissionId` is auto-generated for admissions
   - `createdAt` and `updatedAt` timestamps are managed automatically
4. **Duplicate Prevention:** Mobile numbers and admission IDs must be unique
