const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const schoolEnquiryRoutes = require('./routes/school-enquiry');
const fitnessEnquiryRoutes = require('./routes/fitness-enquiry');
const schoolAdmissionRoutes = require('./routes/school-admission');
const followupRoutes = require('./routes/followups');
const studentRoutes = require('./routes/students');
const staffRoutes = require('./routes/staffRoutes');
const activityRoutes = require('./routes/activityRoutes');

const feeRoutes = require('./routes/fees');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const eventRoutes = require('./routes/eventRoutes');

const fitnessMemberRoutes = require('./routes/fitness-member');

const fitnessEventRoutes = require('./routes/fitnessEventRoutes');

const fitnessStaffRoleRoutes = require("./routes/fitness-staffRole");
const fitnessEmpTypeRoutes = require("./routes/fitness-staffEmpType");
const fitnessStaffRoutes = require("./routes/fitness-staff");

const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware - Allow all origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins (including no origin for mobile/postman)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/school/enquiry', schoolEnquiryRoutes);
app.use('/api/fitness/enquiry', fitnessEnquiryRoutes);
app.use('/api/school/admission', schoolAdmissionRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/events', eventRoutes);

app.use('/api/fitness/member', fitnessMemberRoutes);

app.use('/api/fitness/events', fitnessEventRoutes);

app.use("/api/fitness/roles", fitnessStaffRoleRoutes);
app.use("/api/fitness/types", fitnessEmpTypeRoutes);
app.use("/api/fitness/staff", fitnessStaffRoutes);


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
