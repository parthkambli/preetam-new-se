//   const express = require('express');
//   const cors = require('cors');
//   const dotenv = require('dotenv');
//   const connectDB = require('./config/db');
//   const { startMembershipCron } = require('./utils/updateMembershipStatuses');
//   const { startBackupCron } = require('./scripts/dbBackup');

//   const authRoutes = require('./routes/auth');
//   const schoolDashboardRoutes = require('./routes/schoolDashboardRoutes');
//   const schoolEnquiryRoutes = require('./routes/school-enquiry');
//   const schoolAdmissionRoutes = require('./routes/school-admission');
//   const followupRoutes = require('./routes/followups');
//   const studentRoutes = require('./routes/students');
//   const staffRoutes = require('./routes/Staffroutes');
//   const activityRoutes = require('./routes/activityRoutes');
//   const staffPanelRoutes = require('./routes/fitnessStaffPanelRoutes');//// staff
  

  
  
  
//   const dashboardRoutes = require('./routes/dashboardRoutes');
//   const fitnessEnquiryRoutes = require('./routes/fitness-enquiry');
//   const feeRoutes = require('./routes/fees');
//   const healthRecordRoutes = require('./routes/healthRecordRoutes');
//   const eventRoutes = require('./routes/eventRoutes');
//   const fitnessMemberRoutes = require('./routes/fitness-member');
//   const fitnessStaffRoutes = require("./routes/fitness-staff");
//   const fitnessStaffRoleRoutes = require("./routes/fitness-staffRole");
//   const fitnessEmpTypeRoutes = require("./routes/fitness-staffEmpType");
//   const fitnessActivity = require('./routes/fitness-Activity');
//   const fitnessAttendance = require('./routes/fitnessAttendanceRoutes');
//   const fitnessSchedule = require('./routes/fitness-Schedule');
//   const fitnessFeeRoutes = require('./routes/fitnessFeeRoutes');
//   const fitnessEventRoutes = require('./routes/fitnessEventRoutes');

//   const fitnessReportsRoutes = require('./routes/fitnessReportsRoutes');


//   const path = require('path');

//   // Load environment variables
//   dotenv.config();

//   // Connect to MongoDB
//   connectDB();

//   startMembershipCron();
//   startBackupCron();

//   const app = express();

//   // Middleware - Allow all origins
//   app.use(cors({
//     origin: (origin, callback) => {
//       // Allow all origins (including no origin for mobile/postman)
//       callback(null, true);
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
//     credentials: true,
//     optionsSuccessStatus: 200
//   }));
//   app.use(express.json());
//   app.use(express.urlencoded({ extended: true }));


//   // School routes...
// app.use('/api/auth', authRoutes);
// app.use('/api/school/dashboard', schoolDashboardRoutes);
// app.use('/api/school/enquiry', schoolEnquiryRoutes);
// app.use('/api/school/admission', schoolAdmissionRoutes);
// app.use('/api/followups', followupRoutes);
// app.use('/api/students', studentRoutes);
// app.use('/api/staff', staffRoutes);
// app.use('/api/activities', activityRoutes);
// app.use('/api/fees', feeRoutes);                    // School fees
// app.use('/api/health-records', healthRecordRoutes);
// app.use('/api/events', eventRoutes);

// // fitness staff routes
// app.use('/api/fitness/staff-panel', staffPanelRoutes);/// staff-panel
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Fitness routes - ONE CLEAR SECTION
// app.use('/api/fitness/enquiry', fitnessEnquiryRoutes);
// app.use('/api/fitness/member', fitnessMemberRoutes);
// app.use('/api/fitness/events', fitnessEventRoutes);

// // Fitness Fees - ONLY ONCE
// app.use('/api/fitness/fees', fitnessFeeRoutes);     // ← Keep this

// // Fitness Staff related
// app.use("/api/fitness/roles", fitnessStaffRoleRoutes);
// app.use("/api/fitness/types", fitnessEmpTypeRoutes);   // employment types
// app.use("/api/fitness/staff", fitnessStaffRoutes);

// // Fitness Activities & Schedules - ONLY ONCE
// app.use('/api/fitness/activities', fitnessActivity);
// app.use('/api/fitness/schedules', fitnessSchedule);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/school/dashboard', schoolDashboardRoutes);
// app.use('/api/fees', feeRoutes);
// app.use('/api', fitnessReportsRoutes);


// app.use('/api/attendance', fitnessAttendance)



//   // Health check route
//   app.get('/api/health', (req, res) => {
//     res.json({ status: 'OK', message: 'Server is running' });
//   });

//   // Error handling middleware
//   app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: 'Something went wrong!' });
//   });

//   const PORT = process.env.PORT || 3000;

//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });













const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startMembershipCron } = require('./utils/updateMembershipStatuses');
const { startBackupCron } = require('./scripts/dbBackup');

const auth = require('./middleware/auth');
const { allowPermissions } = require('./middleware/permissions');

const authRoutes = require('./routes/auth');
const schoolDashboardRoutes = require('./routes/schoolDashboardRoutes');
const schoolEnquiryRoutes = require('./routes/school-enquiry');
const schoolAdmissionRoutes = require('./routes/school-admission');
const followupRoutes = require('./routes/followups');
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/Staffroutes');
const activityRoutes = require('./routes/activityRoutes');
const staffPanelRoutes = require('./routes/fitnessStaffPanelRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const fitnessEnquiryRoutes = require('./routes/fitness-enquiry');
const feeRoutes = require('./routes/fees');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const eventRoutes = require('./routes/eventRoutes');
const fitnessMemberRoutes = require('./routes/fitness-member');
const fitnessStaffRoutes = require("./routes/fitness-staff");
const fitnessStaffRoleRoutes = require("./routes/fitness-staffRole");
const fitnessEmpTypeRoutes = require("./routes/fitness-staffEmpType");
const fitnessActivity = require('./routes/fitness-Activity');
const fitnessAttendance = require('./routes/fitnessAttendanceRoutes');
const fitnessSchedule = require('./routes/fitness-Schedule');
const fitnessFeeRoutes = require('./routes/fitnessFeeRoutes');
const fitnessEventRoutes = require('./routes/fitnessEventRoutes');
const fitnessReportsRoutes = require('./routes/fitnessReportsRoutes');

const userManagementRoutes = require('./routes/userManagementRoutes');
const accessRoleRoutes = require('./routes/accessRoleRoutes');


const path = require('path');

dotenv.config();
connectDB();

startMembershipCron();
startBackupCron();

const app = express();

// CORS
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== PUBLIC ROUTES =====================
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public attendance validation (keep open)
app.use('/api/attendance', fitnessAttendance);

// ===================== STAFF PANEL =====================
// Only FitnessStaff allowed
app.use(
  '/api/fitness/staff-panel',
  auth,
  allowPermissions('VIEW_OWN_SCHEDULE'),
  staffPanelRoutes
);

// ===================== ADMIN (SCHOOL) =====================
app.use('/api/school/dashboard', auth, allowPermissions('VIEW_DASHBOARD'), schoolDashboardRoutes);
app.use('/api/school/enquiry', auth, allowPermissions('USER_MANAGE'), schoolEnquiryRoutes);
app.use('/api/school/admission', auth, allowPermissions('USER_MANAGE'), schoolAdmissionRoutes);
app.use('/api/followups', auth, followupRoutes);
app.use('/api/students', auth, studentRoutes);
app.use('/api/staff', auth, staffRoutes);
app.use('/api/activities', auth, activityRoutes);
app.use('/api/fees', auth, feeRoutes);
app.use('/api/health-records', auth, healthRecordRoutes);
app.use('/api/events', auth, eventRoutes);

// ===================== ADMIN (FITNESS) =====================
app.use('/api/fitness/enquiry', auth, fitnessEnquiryRoutes);
app.use('/api/fitness/member', auth, allowPermissions('USER_MANAGE'), fitnessMemberRoutes);
app.use('/api/fitness/events', auth, fitnessEventRoutes);
app.use('/api/fitness/fees', auth, fitnessFeeRoutes);

app.use('/api/fitness/roles', auth, allowPermissions('USER_MANAGE'), fitnessStaffRoleRoutes);
app.use('/api/fitness/types', auth, allowPermissions('USER_MANAGE'), fitnessEmpTypeRoutes);
app.use('/api/fitness/staff', auth, allowPermissions('USER_MANAGE'), fitnessStaffRoutes);

// Mixed routes (leave flexible — don’t over-restrict)
app.use('/api/fitness/activities', auth, fitnessActivity);
app.use('/api/fitness/schedules', auth, fitnessSchedule);

// Reports & dashboards
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api', auth, fitnessReportsRoutes);

// ===================== USER MANAGEMENT =====================
app.use('/api/user-management', userManagementRoutes);
app.use('/api/access-roles', accessRoleRoutes);

// ===================== HEALTH =====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ===================== ERROR =====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});