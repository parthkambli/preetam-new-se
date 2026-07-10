# Student Panel API Documentation

> **For Flutter Developer** — Complete reference for building the Android app.

---

## Base Info

| Item | Value |
|------|-------|
| **Base URL** | `https://<your-server>/api/school/student-panel` |
| **Auth** | JWT Bearer Token |
| **Content-Type** | `application/json` |

### Required Headers (for every request)

```
Authorization: Bearer <jwt_token>
X-Organization-ID: school
```

---

## 1. Authentication — Login (OTP via Firebase)

### POST `/api/auth/student-mobile-login`

Login using mobile number. **No password needed** — OTP verification is handled by Firebase on the Flutter side. After OTP is verified on Flutter, call this endpoint to get the JWT token.

**Request Body:**
```json
{
  "mobile": "9876543210"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobile` | String | Yes | Student's mobile number (10-15 digits) |

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "664f...",
    "userId": "9876543210",
    "fullName": "Ramesh Kumar",
    "role": "Student",
    "mobile": "9876543210",
    "organizationId": "school"
  }
}
```

**Error Responses:**
```json
// Mobile not found
{ "message": "Student not found" }    // 404

// Invalid mobile format
{ "message": "Invalid mobile number" }  // 400
```

> **Flutter Flow:** Enter mobile → Firebase sends OTP → User enters OTP → Firebase verifies → Call this endpoint with mobile → Save token → Use token for all APIs.

---

### POST `/api/auth/login` (Legacy — Password based)

> **Deprecated for students.** Use `/student-mobile-login` instead. This endpoint is kept for admin/staff web login only.

---

## 2. Dashboard

### GET `/dashboard`

Get combined dashboard data: membership status, today's attendance, reminders, today's schedule, this week's events.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "membership": {
    "plan": "Monthly",
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-02-15T00:00:00.000Z",
    "status": "Active",
    "daysRemaining": 5,
    "pendingAmount": 0
  },
  "attendance": {
    "month": "January",
    "present": 18,
    "total": 22,
    "percentage": 81.82
  },
  "reminders": [
    {
      "_id": "665a...",
      "title": "Take medicines",
      "description": "Blood pressure medicine",
      "type": "Daily",
      "time": "09:00"
    }
  ],
  "todaySchedule": [
    {
      "periodName": "09:00",
      "activityName": "Yoga",
      "staffName": "Suresh Sir"
    }
  ],
  "weekEvents": [
    {
      "_id": "665b...",
      "name": "Annual Day",
      "date": "2025-01-20T00:00:00.000Z",
      "description": "Annual day celebration"
    }
  ]
}
```

---

## 3. Profile

### GET `/profile`

Get logged-in student's full profile.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "profile": {
    "fullName": "Ramesh Kumar",
    "admissionId": "ADM-001",
    "mobile": "9876543210",
    "age": 68,
    "gender": "Male",
    "dob": "1957-05-15",
    "bloodGroup": "B+",
    "fullAddress": "123 MG Road, Pune",
    "status": "Active",
    "photo": "https://server/uploads/photo.jpg",
    "qrCode": "https://server/uploads/qr.png",
    "registrationDate": "2025-01-15T00:00:00.000Z",
    "physicalDisability": "None",
    "mainIllness": "Diabetes",
    "seriousDisease": "",
    "regularMedication": "Metformin 500mg",
    "healthDetails": "Mild sugar",
    "education": "B.Sc",
    "educationPlace": "Pune University",
    "yearsOfService": "35",
    "servicePlace": "Tata Motors",
    "occupationType": "Retired",
    "primaryContact": {
      "name": "Sunita Kumar",
      "relation": "Wife",
      "phone": "9876543211"
    },
    "secondaryContact": {
      "name": "Amit Kumar",
      "relation": "Son",
      "phone": "9876543212"
    }
  }
}
```

---

## 4. Timetable

### GET `/timetable`

Get the student's weekly timetable (periods mapped to activities for each day).

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "timetable": [
    {
      "periodId": "666a...",
      "periodName": "Morning Yoga",
      "startTime": "07:00",
      "endTime": "08:00",
      "monday": { "activityId": "667a...", "activityName": "Yoga" },
      "tuesday": { "activityId": "667b...", "activityName": "Walking" },
      "wednesday": { "activityId": "667a...", "activityName": "Yoga" },
      "thursday": { "activityId": "667c...", "activityName": "Meditation" },
      "friday": { "activityId": "667a...", "activityName": "Yoga" },
      "saturday": { "activityId": "667d...", "activityName": "Exercises" },
      "sunday": { "activityId": "", "activityName": "" }
    }
  ]
}
```

---

## 5. Activities

### GET `/activities`

Get all available activities in the organization.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "activities": [
    {
      "_id": "667a...",
      "name": "Yoga",
      "staffName": "Suresh Sir",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "_id": "667b...",
      "name": "Walking",
      "staffName": "Anita Ma'am",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 6. Health Records

### GET `/health-records`

Get latest health record + list of all records (summary).

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "latestRecord": {
    "_id": "668a...",
    "recordDate": "2025-01-10",
    "recordType": "Checkup",
    "bloodPressure": "130/85",
    "weight": "72",
    "temperature": "98.6",
    "notes": "Sugar slightly high",
    "reportFile": "https://server/uploads/report.pdf"
  },
  "history": [
    {
      "_id": "668a...",
      "recordDate": "2025-01-10",
      "recordType": "Checkup",
      "hasReport": true
    },
    {
      "_id": "668b...",
      "recordDate": "2024-12-05",
      "recordType": "Blood Test",
      "hasReport": false
    }
  ]
}
```

---

### GET `/health-records/:id`

Get full details of a specific health record.

**URL Params:** `id` — the `_id` from history list

**Response (200):**
```json
{
  "success": true,
  "record": {
    "_id": "668a...",
    "recordDate": "2025-01-10",
    "recordType": "Checkup",
    "bloodPressure": "130/85",
    "weight": "72",
    "temperature": "98.6",
    "notes": "Sugar slightly high",
    "reportFile": "https://server/uploads/report.pdf",
    "reportFileName": "report.pdf"
  }
}
```

---

## 7. Fees

### GET `/fees`

Get complete fee history — allotments with payments.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "feeHistory": [
    {
      "allotmentId": "669a...",
      "feePlan": "Monthly",
      "description": "Monthly Admission Fee",
      "totalFee": 5000,
      "paidAmount": 3000,
      "pendingAmount": 2000,
      "dueDate": "2025-02-01",
      "status": "Pending",
      "payments": [
        {
          "_id": "670a...",
          "amount": 3000,
          "paymentDate": "2025-01-15T00:00:00.000Z",
          "paymentMode": "Bank Transfer",
          "transactionId": "pay_xxxx"
        }
      ]
    }
  ]
}
```

> **status** is either `"Paid"` (pendingAmount == 0) or `"Pending"`.

---

## 8. Pending Fee Payment (Pay Remaining Admission Fee)

This is a **3-step Razorpay flow**: Create Order -> Razorpay Payment -> Verify Payment.

### Step 1: POST `/fees/pending/create-order`

**Request Body:**
```json
{
  "payNow": 2000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payNow` | Number | Yes | Amount to pay right now (must be <= pending amount, minimum 1) |

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderId": "order_xxxx",
    "amount": 2000,
    "currency": "INR",
    "key": "rzp_test_xxxx"
  },
  "summary": {
    "totalFee": 5000,
    "paidAmount": 3000,
    "pendingAmount": 2000,
    "payNow": 2000
  }
}
```

> **Flutter:** Use `order.orderId`, `order.amount`, `order.currency`, and `order.key` with the Razorpay Flutter SDK to open the payment screen.

---

### Step 2: POST `/fees/pending/verify-payment`

After Razorpay payment succeeds, call this to verify and record.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxx",
  "razorpay_payment_id": "pay_xxxx",
  "razorpay_signature": "xxxx",
  "payNow": 2000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `razorpay_order_id` | String | Yes | From Razorpay success callback |
| `razorpay_payment_id` | String | Yes | From Razorpay success callback |
| `razorpay_signature` | String | Yes | From Razorpay success callback |
| `payNow` | Number | Yes | Same amount as in create-order |

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "summary": {
    "totalFee": 5000,
    "paidAmount": 5000,
    "pendingAmount": 0,
    "paidNow": 2000
  }
}
```

---

## 9. Attendance

### GET `/attendance`

Get all attendance records + summary.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "present": 18,
    "absent": 2,
    "total": 20,
    "percentage": 90.00
  },
  "attendance": [
    {
      "_id": "671a...",
      "attendanceDate": "2025-01-15",
      "attendanceDay": "Wednesday",
      "status": "Present",
      "markedBy": "Suresh Sir"
    },
    {
      "_id": "671b...",
      "attendanceDate": "2025-01-14",
      "attendanceDay": "Tuesday",
      "status": "Absent",
      "markedBy": "Suresh Sir"
    }
  ]
}
```

---

## 10. Membership

### GET `/membership`

Get current membership status.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "membership": {
    "plan": "Monthly",
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-02-15T00:00:00.000Z",
    "status": "Active",
    "daysRemaining": 5,
    "canRenew": true
  }
}
```

> **canRenew** is `true` when within 3 days of expiry or already expired.

---

### Membership Renewal (3-step Razorpay flow)

#### Step 1: POST `/membership/renew/calculate`

Preview the renewal cost before paying.

**Request Body:**
```json
{
  "feePlan": "Monthly",
  "startDate": "2025-02-15"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `feePlan` | String | Yes | One of: `Daily`, `Weekly`, `Monthly`, `Quarterly`, `HalfYearly`, `Annual` |
| `startDate` | String | No | Start date (YYYY-MM-DD). If omitted, starts day after current membership ends |

**Response (200):**
```json
{
  "success": true,
  "calculation": {
    "feeTypeId": "672a...",
    "plan": "Monthly",
    "startDate": "2025-02-15",
    "endDate": "2025-03-15",
    "totalFee": 5000
  }
}
```

---

#### Step 2: POST `/membership/renew/create-order`

Create Razorpay order for renewal.

**Request Body:**
```json
{
  "feePlan": "Monthly",
  "startDate": "2025-02-15",
  "payNow": 5000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `feePlan` | String | Yes | Same as calculate |
| `startDate` | String | No | Same as calculate |
| `payNow` | Number | Yes | Amount to pay now (<= totalFee, min 1) |

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderId": "order_xxxx",
    "amount": 5000,
    "currency": "INR",
    "key": "rzp_test_xxxx"
  },
  "summary": {
    "plan": "Monthly",
    "startDate": "2025-02-15",
    "endDate": "2025-03-15",
    "totalFee": 5000,
    "paidNow": 5000,
    "pendingAmount": 0
  }
}
```

---

#### Step 3: POST `/membership/renew/verify-payment`

**Request Body:**
```json
{
  "feePlan": "Monthly",
  "startDate": "2025-02-15",
  "payNow": 5000,
  "razorpay_order_id": "order_xxxx",
  "razorpay_payment_id": "pay_xxxx",
  "razorpay_signature": "xxxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Membership renewed successfully",
  "membership": {
    "plan": "Monthly",
    "startDate": "2025-02-15",
    "endDate": "2025-03-15",
    "totalFee": 5000,
    "paidAmount": 5000,
    "pendingAmount": 0,
    "status": "Paid"
  }
}
```

---

## 11. Services (Book Extra Services like Transport, Meals, etc.)

### GET `/services`

Get student's booked services.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "services": [
    {
      "_id": "673a...",
      "serviceId": "674a...",
      "serviceName": "Bus Transport",
      "startDate": "2025-01-15",
      "endDate": "2025-02-15",
      "duration": 31,
      "perDayFee": 100,
      "totalFee": 3100,
      "status": "Active",
      "remainingDays": 5,
      "canRenew": true,
      "paymentStatus": "Paid"
    }
  ]
}
```

> **status**: `"Active"` | `"Expired"` | `"Cancelled"`
> **canRenew**: `true` if within 3 days of expiry or expired
> **paymentStatus**: `"Paid"` | `"Pending"` | `null`

---

### GET `/services/available`

Get services that the student has NOT yet booked (can be booked).

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "services": [
    {
      "_id": "675a...",
      "serviceName": "Meals",
      "oneDayFee": 200
    },
    {
      "_id": "675b...",
      "serviceName": "Laundry",
      "oneDayFee": 50
    }
  ]
}
```

---

### Service Booking (3-step Razorpay flow)

#### Step 1: POST `/services/calculate`

Preview the cost before booking.

**Request Body:**
```json
{
  "serviceId": "675a...",
  "days": 30,
  "startDate": "2025-02-01"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | String | Yes | Service _id from `/services/available` |
| `days` | Number | Yes | Number of days (positive integer) |
| `startDate` | String | Yes | Start date (YYYY-MM-DD, cannot be in past) |

**Response (200):**
```json
{
  "success": true,
  "calculation": {
    "serviceId": "675a...",
    "serviceName": "Meals",
    "perDayFee": 200,
    "days": 30,
    "startDate": "2025-02-01",
    "endDate": "2025-03-03",
    "totalFee": 6000
  }
}
```

---

#### Step 2: POST `/services/create-order`

**Request Body:**
```json
{
  "serviceId": "675a...",
  "days": 30,
  "startDate": "2025-02-01",
  "payNow": 6000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | String | Yes | Same as calculate |
| `days` | Number | Yes | Same as calculate |
| `startDate` | String | Yes | Same as calculate |
| `payNow` | Number | Yes | Amount to pay now (<= totalFee, min 1) |

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderId": "order_xxxx",
    "amount": 6000,
    "currency": "INR",
    "key": "rzp_test_xxxx"
  },
  "summary": {
    "serviceId": "675a...",
    "serviceName": "Meals",
    "perDayFee": 200,
    "days": 30,
    "startDate": "2025-02-01",
    "endDate": "2025-03-03",
    "totalFee": 6000,
    "paidNow": 6000,
    "pendingAmount": 0
  }
}
```

---

#### Step 3: POST `/services/verify-payment`

**Request Body:**
```json
{
  "serviceId": "675a...",
  "days": 30,
  "startDate": "2025-02-01",
  "payNow": 6000,
  "razorpay_order_id": "order_xxxx",
  "razorpay_payment_id": "pay_xxxx",
  "razorpay_signature": "xxxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified and service booked successfully",
  "booking": {
    "_id": "673a...",
    "serviceName": "Meals",
    "startDate": "2025-02-01T00:00:00.000Z",
    "endDate": "2025-03-03T00:00:00.000Z",
    "totalFee": 6000,
    "paidAmount": 6000,
    "pendingAmount": 0,
    "status": "Active"
  }
}
```

---

### Service Renewal (3-step Razorpay flow)

#### Step 1: POST `/services/renew/calculate`

**Request Body:**
```json
{
  "bookingId": "673a...",
  "days": 30,
  "startDate": "2025-03-03"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bookingId` | String | Yes | Existing booking _id from `/services` |
| `days` | Number | Yes | New number of days |
| `startDate` | String | Yes | Must be after current booking's end date |

**Response (200):**
```json
{
  "success": true,
  "calculation": {
    "bookingId": "673a...",
    "serviceId": "675a...",
    "serviceName": "Meals",
    "perDayFee": 200,
    "days": 30,
    "startDate": "2025-03-03",
    "endDate": "2025-04-02",
    "totalFee": 6000
  }
}
```

---

#### Step 2: POST `/services/renew/create-order`

**Request Body:**
```json
{
  "bookingId": "673a...",
  "days": 30,
  "startDate": "2025-03-03",
  "payNow": 6000
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "orderId": "order_xxxx",
    "amount": 6000,
    "currency": "INR",
    "key": "rzp_test_xxxx"
  },
  "summary": {
    "bookingId": "673a...",
    "serviceId": "675a...",
    "serviceName": "Meals",
    "perDayFee": 200,
    "days": 30,
    "startDate": "2025-03-03",
    "endDate": "2025-04-02",
    "totalFee": 6000,
    "paidNow": 6000,
    "pendingAmount": 0
  }
}
```

---

#### Step 3: POST `/services/renew/verify-payment`

**Request Body:**
```json
{
  "bookingId": "673a...",
  "days": 30,
  "startDate": "2025-03-03",
  "payNow": 6000,
  "razorpay_order_id": "order_xxxx",
  "razorpay_payment_id": "pay_xxxx",
  "razorpay_signature": "xxxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Service renewed successfully",
  "booking": {
    "_id": "673a...",
    "serviceName": "Meals",
    "startDate": "2025-03-03T00:00:00.000Z",
    "endDate": "2025-04-02T00:00:00.000Z",
    "totalFee": 6000,
    "paidAmount": 6000,
    "pendingAmount": 0,
    "status": "Active"
  }
}
```

---

## 12. Reminders (CRUD)

### POST `/reminders`

Create a new reminder.

**Request Body:**
```json
{
  "title": "Take medicines",
  "description": "Blood pressure medicine after breakfast",
  "type": "Daily",
  "date": "",
  "time": "09:00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Reminder title |
| `description` | String | No | Details |
| `type` | String | Yes | `"OneTime"` or `"Daily"` |
| `date` | String | Conditional | Required if type is `"OneTime"` (YYYY-MM-DD format) |
| `time` | String | Yes | Time string (e.g. `"09:00"`) |

**Response (201):**
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "reminder": {
    "_id": "676a...",
    "title": "Take medicines",
    "description": "Blood pressure medicine after breakfast",
    "type": "Daily",
    "date": null,
    "time": "09:00",
    "studentId": "664a...",
    "organizationId": "school"
  }
}
```

---

### GET `/reminders`

Get all reminders for the logged-in student.

**No request body needed.**

**Response (200):**
```json
{
  "success": true,
  "reminders": [
    {
      "_id": "676a...",
      "title": "Take medicines",
      "description": "Blood pressure medicine",
      "type": "Daily",
      "date": null,
      "time": "09:00"
    },
    {
      "_id": "676b...",
      "title": "Doctor Appointment",
      "description": "Dr. Sharma clinic",
      "type": "OneTime",
      "date": "2025-01-25T00:00:00.000Z",
      "time": "11:00"
    }
  ]
}
```

---

### PUT `/reminders/:id`

Update an existing reminder.

**URL Params:** `id` — reminder _id

**Request Body:** (same as create)
```json
{
  "title": "Take medicines - updated",
  "description": "After lunch now",
  "type": "Daily",
  "date": "",
  "time": "13:00"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reminder updated successfully",
  "reminder": {
    "_id": "676a...",
    "title": "Take medicines - updated",
    "description": "After lunch now",
    "type": "Daily",
    "date": null,
    "time": "13:00"
  }
}
```

---

### DELETE `/reminders/:id`

Delete a reminder.

**URL Params:** `id` — reminder _id

**Response (200):**
```json
{
  "success": true,
  "message": "Reminder deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad request — missing or invalid fields |
| `401` | Not authenticated — missing or invalid token |
| `403` | Organization mismatch |
| `404` | Resource not found |
| `500` | Server error |

---

## Razorpay Payment Flow Summary

Every payment in this API follows the same **3-step pattern**:

```
Step 1: calculate    →   Preview cost (no payment yet)
Step 2: create-order →   Get Razorpay order ID
Step 3: verify-payment → Confirm payment & create records
```

### Flutter Razorpay Integration Flow:

```
1. Call create-order API  →  Get { orderId, amount, currency, key }
2. Open Razorpay checkout using Razorpay Flutter SDK
3. On success callback, get { razorpay_order_id, razorpay_payment_id, razorpay_signature }
4. Call verify-payment API with these 3 values + original request params
5. Show success screen
```

### Payment APIs Reference:

| Purpose | Calculate | Create Order | Verify Payment |
|---------|-----------|-------------|----------------|
| Pending Fee | — | `POST /fees/pending/create-order` | `POST /fees/pending/verify-payment` |
| Membership Renew | `POST /membership/renew/calculate` | `POST /membership/renew/create-order` | `POST /membership/renew/verify-payment` |
| New Service | `POST /services/calculate` | `POST /services/create-order` | `POST /services/verify-payment` |
| Service Renew | `POST /services/renew/calculate` | `POST /services/renew/create-order` | `POST /services/renew/verify-payment` |

---

## Complete Endpoint List

| # | Method | Endpoint | Auth |
|---|--------|----------|------|
| 1 | POST | `/api/auth/student-mobile-login` | No |
| 2 | GET | `/api/school/student-panel/dashboard` | Yes |
| 3 | GET | `/api/school/student-panel/profile` | Yes |
| 4 | GET | `/api/school/student-panel/timetable` | Yes |
| 5 | GET | `/api/school/student-panel/activities` | Yes |
| 6 | GET | `/api/school/student-panel/health-records` | Yes |
| 7 | GET | `/api/school/student-panel/health-records/:id` | Yes |
| 8 | GET | `/api/school/student-panel/fees` | Yes |
| 9 | POST | `/api/school/student-panel/fees/pending/create-order` | Yes |
| 10 | POST | `/api/school/student-panel/fees/pending/verify-payment` | Yes |
| 11 | GET | `/api/school/student-panel/attendance` | Yes |
| 12 | GET | `/api/school/student-panel/membership` | Yes |
| 13 | POST | `/api/school/student-panel/membership/renew/calculate` | Yes |
| 14 | POST | `/api/school/student-panel/membership/renew/create-order` | Yes |
| 15 | POST | `/api/school/student-panel/membership/renew/verify-payment` | Yes |
| 16 | GET | `/api/school/student-panel/services` | Yes |
| 17 | GET | `/api/school/student-panel/services/available` | Yes |
| 18 | POST | `/api/school/student-panel/services/calculate` | Yes |
| 19 | POST | `/api/school/student-panel/services/create-order` | Yes |
| 20 | POST | `/api/school/student-panel/services/verify-payment` | Yes |
| 21 | POST | `/api/school/student-panel/services/renew/calculate` | Yes |
| 22 | POST | `/api/school/student-panel/services/renew/create-order` | Yes |
| 23 | POST | `/api/school/student-panel/services/renew/verify-payment` | Yes |
| 24 | POST | `/api/school/student-panel/reminders` | Yes |
| 25 | GET | `/api/school/student-panel/reminders` | Yes |
| 26 | PUT | `/api/school/student-panel/reminders/:id` | Yes |
| 27 | DELETE | `/api/school/student-panel/reminders/:id` | Yes |
