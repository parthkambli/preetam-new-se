// // controllers/healthRecordController.js
// const HealthRecord = require('../models/HealthRecord');
// const path = require('path');

// // Common error handler
// const handleError = (res, err, customMessage = 'Server error') => {
//   console.error(err);

//   if (err.name === 'ValidationError') {
//     const errors = Object.values(err.errors).map(e => e.message);
//     return res.status(400).json({ message: 'Validation failed', errors });
//   }

//   if (err.code === 11000) {
//     return res.status(409).json({ message: 'Duplicate record' });
//   }

//   if (err.name === 'CastError') {
//     return res.status(400).json({ message: 'Invalid ID format' });
//   }

//   res.status(500).json({
//     message: customMessage,
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// };

// // Get all health records
// exports.getAllHealthRecords = async (req, res) => {
//   try {
//     const { name, date } = req.query;

//     const query = { organizationId: req.organizationId };

//     if (name) query.name = { $regex: name, $options: 'i' };
//     if (date) query.date = new Date(date);

//     const records = await HealthRecord.find(query)
//       .sort({ date: -1, time: -1 })
//       .lean();

//     res.json({
//       success: true,
//       count: records.length,
//       data: records
//     });
//   } catch (err) {
//     handleError(res, err, 'Failed to fetch health records');
//   }
// };

// // Create / Update Health Record
// exports.saveHealthRecord = async (req, res) => {
//   try {
//     const { name, date, time, doctor, diagnosis, medications, status } = req.body;

//     if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
//     if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
//     if (!time) return res.status(400).json({ success: false, message: 'Time is required' });
//     if (!doctor?.trim()) return res.status(400).json({ success: false, message: 'Doctor/Clinic is required' });
//     if (!status) return res.status(400).json({ success: false, message: 'Health status is required' });

//     let reportFile = '';
//     if (req.file) {
//       reportFile = `/uploads/health/${req.file.filename}`;
//     }

//     const recordData = {
//       name: name.trim(),
//       date: new Date(date),
//       time,
//       doctor: doctor.trim(),
//       diagnosis: diagnosis ? diagnosis.trim() : '',
//       medications: medications ? medications.trim() : '',
//       status,
//       reportFile,
//       organizationId: req.organizationId
//     };

//     // If we have an ID, it's update, else create
//     if (req.params.id) {
//       const record = await HealthRecord.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!record) {
//         return res.status(404).json({ success: false, message: 'Health record not found' });
//       }

//       Object.assign(record, recordData);
//       await record.save();

//       res.json({
//         success: true,
//         message: 'Health record updated successfully',
//         data: record
//       });
//     } else {
//       const record = new HealthRecord(recordData);
//       await record.save();

//       res.status(201).json({
//         success: true,
//         message: 'Health record created successfully',
//         data: record
//       });
//     }
//   } catch (err) {
//     handleError(res, err, 'Failed to save health record');
//   }
// };

// // Delete health record
// exports.deleteHealthRecord = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!record) {
//       return res.status(404).json({ success: false, message: 'Health record not found' });
//     }

//     res.json({
//       success: true,
//       message: 'Health record deleted successfully'
//     });
//   } catch (err) {
//     handleError(res, err, 'Failed to delete health record');
//   }
// };


























// // controllers/healthRecordController.js
// const HealthRecord = require('../models/HealthRecord');
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');

// // ─────────────────────────────────────────────────────────────────────────────
// // Multer configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-reports');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'health-report-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { 
//     fileSize: 5 * 1024 * 1024,   // 5MB
//     fieldSize: 10 * 1024 * 1024  // Increase field size limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|webp|pdf/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = /image\/(jpeg|jpg|png|webp)|application\/pdf/.test(file.mimetype);

//     if (extname && mimetype) return cb(null, true);
//     cb(new Error('Only JPG, PNG, WebP images and PDF files are allowed!'));
//   }
// }).single('reportFile');

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper to delete old report
// const deleteOldReport = (reportPath) => {
//   if (reportPath && reportPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', reportPath);
//     if (fs.existsSync(fullPath)) {
//       fs.unlinkSync(fullPath);
//       console.log('✅ Deleted old report:', fullPath);
//     }
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Common error handler
// const handleError = (res, err, customMessage = 'Server error') => {
//   console.error('=== HANDLE ERROR ===', err.message);
//   if (err.name === 'ValidationError') {
//     return res.status(400).json({ message: 'Validation failed', errors: Object.values(err.errors).map(e => e.message) });
//   }
//   res.status(500).json({
//     success: false,
//     message: customMessage,
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Get all health records (unchanged)
// exports.getAllHealthRecords = async (req, res) => {
//   try {
//     const { name, date } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (name) query.name = { $regex: name, $options: 'i' };
//     if (date) query.date = new Date(date);

//     const records = await HealthRecord.find(query)
//       .sort({ date: -1, time: -1 })
//       .lean();

//     res.json({ success: true, count: records.length, data: records });
//   } catch (err) {
//     handleError(res, err, 'Failed to fetch health records');
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SAVE HEALTH RECORD - with heavy debugging
// exports.saveHealthRecord = async (req, res) => {
//   console.log('\n🚀 === NEW HEALTH RECORD REQUEST ===');
//   console.log('Method:', req.method);
//   console.log('URL:', req.originalUrl);
//   console.log('Content-Type:', req.headers['content-type']);
//   console.log('Content-Length:', req.headers['content-length']);

//   upload(req, res, async (err) => {
//     if (err) {
//       console.error('❌ MULTER ERROR:', err.message);
//       console.error('Error Code:', err.code);
//       console.error('Full Error:', err);

//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ success: false, message: 'File size cannot exceed 5MB' });
//       }
//       return res.status(400).json({ 
//         success: false, 
//         message: err.message || 'File upload failed' 
//       });
//     }

//     // Multer succeeded
//     console.log('✅ MULTER PARSED SUCCESSFULLY');
//     console.log('Body received:', Object.keys(req.body));
//     console.log('Body details:', {
//       name: req.body.name,
//       date: req.body.date,
//       time: req.body.time,
//       doctor: req.body.doctor,
//       status: req.body.status,
//       diagnosis: req.body.diagnosis ? '✅ Present' : 'Empty',
//       medications: req.body.medications ? '✅ Present' : 'Empty',
//     });
//     console.log('File:', req.file ? `${req.file.originalname} (${(req.file.size/1024).toFixed(2)} KB)` : 'No file');

//     try {
//       const { name, date, time, doctor, diagnosis = '', medications = '', status } = req.body;

//       // Validation
//       if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
//       if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
//       if (!time) return res.status(400).json({ success: false, message: 'Time is required' });
//       if (!doctor?.trim()) return res.status(400).json({ success: false, message: 'Doctor/Clinic is required' });
//       if (!status) return res.status(400).json({ success: false, message: 'Health status is required' });

//       const recordData = {
//         name: name.trim(),
//         date: new Date(date),
//         time: time.trim(),
//         doctor: doctor.trim(),
//         diagnosis: diagnosis.trim(),
//         medications: medications.trim(),
//         status,
//         organizationId: req.organizationId
//       };

//       if (req.file) {
//         recordData.reportFile = `/uploads/student/health-reports/${req.file.filename}`;
//       }

//       let record;
//       if (req.params.id) {
//         // Update
//         record = await HealthRecord.findOne({ _id: req.params.id, organizationId: req.organizationId });
//         if (!record) {
//           if (req.file) deleteOldReport(recordData.reportFile);
//           return res.status(404).json({ success: false, message: 'Health record not found' });
//         }

//         if (req.file && record.reportFile) deleteOldReport(record.reportFile);
//         Object.assign(record, recordData);
//         await record.save();
//         console.log('✅ Record UPDATED');
//       } else {
//         // Create
//         record = new HealthRecord(recordData);
//         await record.save();
//         console.log('✅ Record CREATED with ID:', record._id);
//       }

//       res.status(req.params.id ? 200 : 201).json({
//         success: true,
//         message: req.params.id ? 'Health record updated successfully' : 'Health record created successfully',
//         data: record
//       });

//     } catch (err) {
//       console.error('❌ ERROR AFTER MULTER:', err.message);
//       if (req.file) deleteOldReport(`/uploads/student/health-reports/${req.file.filename}`);
//       handleError(res, err, 'Failed to save health record');
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Delete (unchanged)
// exports.deleteHealthRecord = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!record) {
//       return res.status(404).json({ success: false, message: 'Health record not found' });
//     }

//     if (record.reportFile) deleteOldReport(record.reportFile);

//     res.json({ success: true, message: 'Health record deleted successfully' });
//   } catch (err) {
//     handleError(res, err, 'Failed to delete health record');
//   }
// };











// // controllers/healthRecordController.js
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const HealthRecord = require('../models/HealthRecord');

// // ─────────────────────────────────────────────────────────────────────────────
// // Multer — saves to uploads/student/health-report/
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-report');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'report-' + unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|webp|pdf/;
//     const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
//     const mimeOk = allowed.test(file.mimetype);
//     if (extOk && mimeOk) return cb(null, true);
//     cb(new Error('Only JPG, PNG, WebP and PDF files are allowed'));
//   }
// }).single('reportFile');

// // ─────────────────────────────────────────────────────────────────────────────
// const deleteFile = (filePath) => {
//   if (filePath?.startsWith('/uploads/')) {
//     const full = path.join(__dirname, '..', filePath);
//     if (fs.existsSync(full)) fs.unlinkSync(full);
//   }
// };

// // Fields accepted from frontend + mapping support
// const ALLOWED_FIELDS = [
//   'studentId', 'studentName', 'recordType', 'recordDate', 'time',
//   'doctorName', 'hospitalName', 'height', 'weight', 'bloodPressure',
//   'temperature', 'pulseRate', 'diagnosis', 'treatment', 'prescription',
//   'status', 'followUpDate', 'notes'
// ];

// const pickFields = (body) => ALLOWED_FIELDS.reduce((acc, key) => {
//   if (body[key] !== undefined && body[key] !== '') {
//     acc[key] = body[key];
//   }
//   return acc;
// }, {});

// // ─────────────────────────────────────────────────────────────────────────────
// /** GET /api/health-records */
// exports.getAllHealthRecords = async (req, res) => {
//   try {
//     const { search, status, recordType, studentId, from, to } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (recordType) query.recordType = recordType;
//     if (studentId) query.studentId = studentId;
//     if (from || to) {
//       query.recordDate = {};
//       if (from) query.recordDate.$gte = new Date(from);
//       if (to) query.recordDate.$lte = new Date(to);
//     }
//     if (search) {
//       query.$or = [
//         { studentName: { $regex: search, $options: 'i' } },
//         { recordId: { $regex: search, $options: 'i' } },
//         { doctorName: { $regex: search, $options: 'i' } },
//         { diagnosis: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const records = await HealthRecord.find(query)
//       .sort({ recordDate: -1 })
//       .populate('studentId', 'fullName studentId admissionIdStr');

//     res.json(records);
//   } catch (err) {
//     console.error('getAllHealthRecords:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health records' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** GET /api/health-records/:id */
// exports.getHealthRecordById = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     }).populate('studentId', 'fullName studentId admissionIdStr');

//     if (!record) return res.status(404).json({ message: 'Health record not found' });
//     res.json(record);
//   } catch (err) {
//     console.error('getHealthRecordById:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health record' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** POST /api/health-records */
// exports.createHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const data = {
//         ...pickFields(req.body),
//         organizationId: req.organizationId,
//       };

//       // Map frontend field names to backend schema
//       if (req.body.name) data.studentName = req.body.name;
//       if (req.body.date) data.recordDate = req.body.date;
//       if (req.body.doctor) data.doctorName = req.body.doctor;
//       if (req.body.medications) data.prescription = req.body.medications;

//       // Set default recordType if not provided
//       if (!data.recordType) data.recordType = 'General Checkup';

//       if (req.file) {
//         data.reportFile = `/uploads/student/health-report/${req.file.filename}`;
//         data.reportFileName = req.file.originalname;
//       }

//       // Required field check
//       if (!data.studentId || !data.recordType || !data.recordDate) {
//         if (req.file) deleteFile(data.reportFile);
//         return res.status(400).json({ message: 'Student, record type and date are required' });
//       }

//       const record = await HealthRecord.create(data);
//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.status(201).json({
//         ...populated.toObject(),
//         message: 'Health record created successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('createHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while creating health record' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** PUT /api/health-records/:id */
// exports.updateHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const record = await HealthRecord.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!record) {
//         if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//         return res.status(404).json({ message: 'Health record not found' });
//       }

//       const updates = pickFields(req.body);

//       // Map frontend field names to backend schema for update
//       if (req.body.name) updates.studentName = req.body.name;
//       if (req.body.date) updates.recordDate = req.body.date;
//       if (req.body.doctor) updates.doctorName = req.body.doctor;
//       if (req.body.medications) updates.prescription = req.body.medications;

//       if (req.file) {
//         // Delete old file before replacing
//         if (record.reportFile) deleteFile(record.reportFile);
//         updates.reportFile = `/uploads/student/health-report/${req.file.filename}`;
//         updates.reportFileName = req.file.originalname;
//       }

//       Object.assign(record, updates);
//       await record.save();

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.json({
//         ...populated.toObject(),
//         message: 'Health record updated successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('updateHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while updating health record' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** DELETE /api/health-records/:id */
// exports.deleteHealthRecord = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!record) return res.status(404).json({ message: 'Health record not found' });
//     if (record.reportFile) deleteFile(record.reportFile);

//     res.json({ message: 'Health record deleted successfully' });
//   } catch (err) {
//     console.error('deleteHealthRecord:', err.message);
//     res.status(500).json({ message: 'Server error while deleting health record' });
//   }
// };










// // controllers/healthRecordController.js
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const HealthRecord = require('../models/HealthRecord');
// const Student = require('../models/Student');   // Required for updating last health checkup

// // ─────────────────────────────────────────────────────────────────────────────
// // Multer — saves to uploads/student/health-report/
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-report');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'report-' + unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|webp|pdf/;
//     const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
//     const mimeOk = allowed.test(file.mimetype);
//     if (extOk && mimeOk) return cb(null, true);
//     cb(new Error('Only JPG, PNG, WebP and PDF files are allowed'));
//   }
// }).single('reportFile');

// // ─────────────────────────────────────────────────────────────────────────────
// const deleteFile = (filePath) => {
//   if (filePath?.startsWith('/uploads/')) {
//     const full = path.join(__dirname, '..', filePath);
//     if (fs.existsSync(full)) fs.unlinkSync(full);
//   }
// };

// // Fields accepted from frontend + mapping support
// const ALLOWED_FIELDS = [
//   'studentId', 'studentName', 'recordType', 'recordDate', 'time',
//   'doctorName', 'hospitalName', 'height', 'weight', 'bloodPressure',
//   'temperature', 'pulseRate', 'diagnosis', 'treatment', 'prescription',
//   'status', 'followUpDate', 'notes'
// ];

// const pickFields = (body) => ALLOWED_FIELDS.reduce((acc, key) => {
//   if (body[key] !== undefined && body[key] !== '') {
//     acc[key] = body[key];
//   }
//   return acc;
// }, {});

// // ─────────────────────────────────────────────────────────────────────────────
// /** GET /api/health-records */
// exports.getAllHealthRecords = async (req, res) => {
//   try {
//     const { search, status, recordType, studentId, from, to } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (recordType) query.recordType = recordType;
//     if (studentId) query.studentId = studentId;
//     if (from || to) {
//       query.recordDate = {};
//       if (from) query.recordDate.$gte = new Date(from);
//       if (to) query.recordDate.$lte = new Date(to);
//     }
//     if (search) {
//       query.$or = [
//         { studentName: { $regex: search, $options: 'i' } },
//         { recordId: { $regex: search, $options: 'i' } },
//         { doctorName: { $regex: search, $options: 'i' } },
//         { diagnosis: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const records = await HealthRecord.find(query)
//       .sort({ recordDate: -1 })
//       .populate('studentId', 'fullName studentId admissionIdStr');

//     res.json(records);
//   } catch (err) {
//     console.error('getAllHealthRecords:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health records' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** GET /api/health-records/:id */
// exports.getHealthRecordById = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     }).populate('studentId', 'fullName studentId admissionIdStr');

//     if (!record) return res.status(404).json({ message: 'Health record not found' });
//     res.json(record);
//   } catch (err) {
//     console.error('getHealthRecordById:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health record' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** POST /api/health-records */
// exports.createHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const data = {
//         ...pickFields(req.body),
//         organizationId: req.organizationId,
//       };

//       // Map frontend field names to backend schema
//       if (req.body.name) data.studentName = req.body.name;
//       if (req.body.date) data.recordDate = req.body.date;
//       if (req.body.doctor) data.doctorName = req.body.doctor;
//       if (req.body.medications) data.prescription = req.body.medications;

//       // Set default recordType if not provided
//       if (!data.recordType) data.recordType = 'General Checkup';

//       if (req.file) {
//         data.reportFile = `/uploads/student/health-report/${req.file.filename}`;
//         data.reportFileName = req.file.originalname;
//       }

//       // Required field check
//       if (!data.studentId || !data.recordType || !data.recordDate) {
//         if (req.file) deleteFile(data.reportFile);
//         return res.status(400).json({ message: 'Student, record type and date are required' });
//       }

//       // Create the health record
//       const record = await HealthRecord.create(data);

//       // ─────── AUTO UPDATE STUDENT'S "LAST HEALTH CHECKUP" ───────
//       await Student.findByIdAndUpdate(
//         data.studentId,
//         {
//           lastCheckupDate: data.recordDate,
//           lastCheckupDoctor: data.doctorName || '',
//           lastCheckupStatus: data.status || 'Normal',
//           lastCheckupNotes: data.diagnosis || data.notes || '',
//         },
//         { new: true }
//       );
//       // ───────────────────────────────────────────────────────────

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.status(201).json({
//         ...populated.toObject(),
//         message: 'Health record created successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('createHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while creating health record' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // /** PUT /api/health-records/:id */
// // exports.updateHealthRecord = async (req, res) => {
// //   upload(req, res, async (err) => {
// //     if (err) {
// //       return res.status(400).json({
// //         message: err.code === 'LIMIT_FILE_SIZE'
// //           ? 'Report file size cannot exceed 5 MB'
// //           : err.message || 'File upload failed'
// //       });
// //     }

// //     try {
// //       const record = await HealthRecord.findOne({
// //         _id: req.params.id,
// //         organizationId: req.organizationId
// //       });

// //       if (!record) {
// //         if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
// //         return res.status(404).json({ message: 'Health record not found' });
// //       }

// //       const updates = pickFields(req.body);

// //       // Map frontend field names to backend schema for update
// //       if (req.body.name) updates.studentName = req.body.name;
// //       if (req.body.date) updates.recordDate = req.body.date;
// //       if (req.body.doctor) updates.doctorName = req.body.doctor;
// //       if (req.body.medications) updates.prescription = req.body.medications;

// //       if (req.file) {
// //         // Delete old file before replacing
// //         if (record.reportFile) deleteFile(record.reportFile);
// //         updates.reportFile = `/uploads/student/health-report/${req.file.filename}`;
// //         updates.reportFileName = req.file.originalname;
// //       }

// //       Object.assign(record, updates);
// //       await record.save();

// //       const populated = await HealthRecord.findById(record._id)
// //         .populate('studentId', 'fullName studentId admissionIdStr');

// //       res.json({
// //         ...populated.toObject(),
// //         message: 'Health record updated successfully'
// //       });
// //     } catch (err) {
// //       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
// //       console.error('updateHealthRecord:', err.message);
// //       res.status(500).json({ message: 'Server error while updating health record' });
// //     }
// //   });
// // };

// /** PUT /api/health-records/:id */
// exports.updateHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const record = await HealthRecord.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!record) {
//         if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//         return res.status(404).json({ message: 'Health record not found' });
//       }

//       const updates = pickFields(req.body);

//       // Map frontend field names to backend schema
//       if (req.body.name) updates.studentName = req.body.name;
//       if (req.body.date) updates.recordDate = req.body.date;
//       if (req.body.doctor) updates.doctorName = req.body.doctor;
//       if (req.body.medications) updates.prescription = req.body.medications;

//       if (req.file) {
//         if (record.reportFile) deleteFile(record.reportFile);
//         updates.reportFile = `/uploads/student/health-report/${req.file.filename}`;
//         updates.reportFileName = req.file.originalname;
//       }

//       Object.assign(record, updates);
//       await record.save();

//       // ─────── AUTO UPDATE STUDENT'S "LAST HEALTH CHECKUP" ───────
//       // Only update if we have the necessary fields
//       if (record.studentId) {
//         await Student.findByIdAndUpdate(
//           record.studentId,
//           {
//             lastCheckupDate: record.recordDate,
//             lastCheckupDoctor: record.doctorName || '',
//             lastCheckupStatus: record.status || 'Normal',
//             lastCheckupNotes: record.diagnosis || record.notes || '',
//           },
//           { new: true }
//         );
//       }
//       // ───────────────────────────────────────────────────────────

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.json({
//         ...populated.toObject(),
//         message: 'Health record updated successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('updateHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while updating health record' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /** DELETE /api/health-records/:id */
// exports.deleteHealthRecord = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!record) return res.status(404).json({ message: 'Health record not found' });
//     if (record.reportFile) deleteFile(record.reportFile);

//     res.json({ message: 'Health record deleted successfully' });
//   } catch (err) {
//     console.error('deleteHealthRecord:', err.message);
//     res.status(500).json({ message: 'Server error while deleting health record' });
//   }
// };














// // controllers/healthRecordController.js
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const HealthRecord = require('../models/HealthRecord');
// const Student = require('../models/Student');

// // Multer setup (unchanged)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-report');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'report-' + unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|webp|pdf/;
//     const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
//     const mimeOk = allowed.test(file.mimetype);
//     if (extOk && mimeOk) return cb(null, true);
//     cb(new Error('Only JPG, PNG, WebP and PDF files are allowed'));
//   }
// }).single('reportFile');

// const deleteFile = (filePath) => {
//   if (filePath?.startsWith('/uploads/')) {
//     const full = path.join(__dirname, '..', filePath);
//     if (fs.existsSync(full)) fs.unlinkSync(full);
//   }
// };

// const ALLOWED_FIELDS = [
//   'studentId', 'studentName', 'recordType', 'recordDate', 'time',
//   'doctorName', 'hospitalName', 'height', 'weight', 'bloodPressure',
//   'temperature', 'pulseRate', 'diagnosis', 'treatment', 'prescription',
//   'status', 'followUpDate', 'notes'
// ];

// const pickFields = (body) => ALLOWED_FIELDS.reduce((acc, key) => {
//   if (body[key] !== undefined && body[key] !== '') {
//     acc[key] = body[key];
//   }
//   return acc;
// }, {});

// // GET ALL
// exports.getAllHealthRecords = async (req, res) => {
//   try {
//     const { search, status, recordType, studentId, from, to } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (recordType) query.recordType = recordType;
//     if (studentId) query.studentId = studentId;
//     if (from || to) {
//       query.recordDate = {};
//       if (from) query.recordDate.$gte = new Date(from);
//       if (to) query.recordDate.$lte = new Date(to);
//     }
//     if (search) {
//       query.$or = [
//         { studentName: { $regex: search, $options: 'i' } },
//         { recordId: { $regex: search, $options: 'i' } },
//         { doctorName: { $regex: search, $options: 'i' } },
//         { diagnosis: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const records = await HealthRecord.find(query)
//       .sort({ recordDate: -1 })
//       .populate('studentId', 'fullName studentId admissionIdStr');

//     res.json(records);
//   } catch (err) {
//     console.error('getAllHealthRecords:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health records' });
//   }
// };

// // GET BY ID
// exports.getHealthRecordById = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     }).populate('studentId', 'fullName studentId admissionIdStr');

//     if (!record) return res.status(404).json({ message: 'Health record not found' });
//     res.json(record);
//   } catch (err) {
//     console.error('getHealthRecordById:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health record' });
//   }
// };

// // CREATE (unchanged)
// exports.createHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const data = {
//         ...pickFields(req.body),
//         organizationId: req.organizationId,
//       };

//       if (req.body.name) data.studentName = req.body.name;
//       if (req.body.date) data.recordDate = req.body.date;
//       if (req.body.doctor) data.doctorName = req.body.doctor;
//       if (req.body.medications) data.prescription = req.body.medications;

//       if (!data.recordType) data.recordType = 'General Checkup';

//       if (req.file) {
//         data.reportFile = `/uploads/student/health-report/${req.file.filename}`;
//         data.reportFileName = req.file.originalname;
//       }

//       if (!data.studentId || !data.recordType || !data.recordDate) {
//         if (req.file) deleteFile(data.reportFile);
//         return res.status(400).json({ message: 'Student, record type and date are required' });
//       }

//       const record = await HealthRecord.create(data);

//       await Student.findByIdAndUpdate(
//         data.studentId,
//         {
//           lastCheckupDate: data.recordDate,
//           lastCheckupDoctor: data.doctorName || '',
//           lastCheckupStatus: data.status || 'Normal',
//           lastCheckupNotes: data.diagnosis || data.notes || '',
//         },
//         { new: true }
//       );

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.status(201).json({
//         ...populated.toObject(),
//         message: 'Health record created successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('createHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while creating health record' });
//     }
//   });
// };

// // UPDATED FUNCTION - THIS IS THE IMPORTANT PART
// exports.updateHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       let record = await HealthRecord.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!record) {
//         if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//         return res.status(404).json({ message: 'Health record not found' });
//       }

//       const updates = pickFields(req.body);

//       if (req.body.name) updates.studentName = req.body.name;
//       if (req.body.date) updates.recordDate = req.body.date;
//       if (req.body.doctor) updates.doctorName = req.body.doctor;
//       if (req.body.medications) updates.prescription = req.body.medications;

//       if (req.file) {
//         if (record.reportFile) deleteFile(record.reportFile);
//         updates.reportFile = `/uploads/student/health-report/${req.file.filename}`;
//         updates.reportFileName = req.file.originalname;
//       }

//       Object.assign(record, updates);
//       await record.save();

//       // Re-fetch to get fresh data
//       record = await HealthRecord.findById(record._id);

//       // Update student's last checkup fields
//       if (record.studentId) {
//         await Student.findByIdAndUpdate(
//           record.studentId,
//           {
//             lastCheckupDate: record.recordDate,
//             lastCheckupDoctor: record.doctorName || '',
//             lastCheckupStatus: record.status || 'Normal',
//             lastCheckupNotes: record.diagnosis || record.notes || '',
//           },
//           { new: true }
//         );
//       }

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.json({
//         ...populated.toObject(),
//         message: 'Health record updated successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('updateHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while updating health record' });
//     }
//   });
// };

// // DELETE (unchanged)
// exports.deleteHealthRecord = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!record) return res.status(404).json({ message: 'Health record not found' });
//     if (record.reportFile) deleteFile(record.reportFile);

//     res.json({ message: 'Health record deleted successfully' });
//   } catch (err) {
//     console.error('deleteHealthRecord:', err.message);
//     res.status(500).json({ message: 'Server error while deleting health record' });
//   }
// };













// controllers/healthRecordController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const HealthRecord = require('../models/HealthRecord');
const Student = require('../models/Student');

// ─────────────────────────────────────────────────────────────────────────────
// Multer — saves to uploads/student/health-report/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-report');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'report-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only JPG, PNG, WebP and PDF files are allowed'));
  }
}).single('reportFile');

// ─────────────────────────────────────────────────────────────────────────────
const deleteFile = (filePath) => {
  if (filePath?.startsWith('/uploads/')) {
    const full = path.join(__dirname, '..', filePath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
};

// Fields accepted from frontend
const ALLOWED_FIELDS = [
  'studentId', 'studentName', 'recordType', 'recordDate', 'time',
  'doctorName', 'hospitalName', 'height', 'weight', 'bloodPressure',
  'temperature', 'pulseRate', 'diagnosis', 'treatment', 'prescription',
  'status', 'followUpDate', 'notes'
];

const pickFields = (body) => ALLOWED_FIELDS.reduce((acc, key) => {
  if (body[key] !== undefined && body[key] !== '') {
    acc[key] = body[key];
  }
  return acc;
}, {});

// ─────────────────────────────────────────────────────────────────────────────
/** GET /api/health-records */
exports.getAllHealthRecords = async (req, res) => {
  try {
    const { search, status, recordType, studentId, from, to } = req.query;
    const query = { organizationId: req.organizationId };

    if (status) query.status = status;
    if (recordType) query.recordType = recordType;
    if (studentId) query.studentId = studentId;
    if (from || to) {
      query.recordDate = {};
      if (from) query.recordDate.$gte = new Date(from);
      if (to) query.recordDate.$lte = new Date(to);
    }
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { recordId: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
      ];
    }

    const records = await HealthRecord.find(query)
      .sort({ recordDate: -1 })
      .populate('studentId', 'fullName studentId admissionIdStr');

    res.json(records);
  } catch (err) {
    console.error('getAllHealthRecords:', err.message);
    res.status(500).json({ message: 'Server error while fetching health records' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** GET /api/health-records/:id */
exports.getHealthRecordById = async (req, res) => {
  try {
    const record = await HealthRecord.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    }).populate('studentId', 'fullName studentId admissionIdStr');

    if (!record) return res.status(404).json({ message: 'Health record not found' });
    res.json(record);
  } catch (err) {
    console.error('getHealthRecordById:', err.message);
    res.status(500).json({ message: 'Server error while fetching health record' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/** POST /api/health-records */
exports.createHealthRecord = async (req, res) => {
  try {
      const data = {
        ...pickFields(req.body),
        organizationId: req.organizationId,
      };

      // Map frontend field names to backend schema
      if (req.body.name) data.studentName = req.body.name;
      if (req.body.date) data.recordDate = req.body.date;
      if (req.body.doctor) data.doctorName = req.body.doctor;
      if (req.body.medications) data.prescription = req.body.medications;

      if (!data.recordType) data.recordType = 'General Checkup';

      if (req.file) {
        data.reportFile = `/uploads/student/health-records/${req.file.filename}`;
        data.reportFileName = req.file.originalname;
      }

      if (!data.studentId || !data.recordType || !data.recordDate) {
        if (req.file) deleteFile(data.reportFile);
        return res.status(400).json({ message: 'Student, record type and date are required' });
      }

      const record = await HealthRecord.create(data);

      // AUTO UPDATE STUDENT'S LAST HEALTH CHECKUP
      await Student.findByIdAndUpdate(
        data.studentId,
        {
          lastCheckupDate: data.recordDate,
          lastCheckupDoctor: data.doctorName || '',
          lastCheckupStatus: data.status || 'Normal',
          lastCheckupNotes: data.diagnosis || data.notes || '',
        },
        { new: true }
      );

      const populated = await HealthRecord.findById(record._id)
        .populate('studentId', 'fullName studentId admissionIdStr');

      res.status(201).json({
        ...populated.toObject(),
        message: 'Health record created successfully'
      });
    } catch (err) {
      if (req.file) deleteFile(`/uploads/student/health-records/${req.file.filename}`);
      console.error('createHealthRecord:', err.message);
      res.status(500).json({ message: 'Server error while creating health record' });
    }

};

// ─────────────────────────────────────────────────────────────────────────────
/** PUT /api/health-records/:id - FIXED VERSION */
exports.updateHealthRecord = async (req, res) => {

    try {
      // 1. Fetch existing record
      let record = await HealthRecord.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
      });

      if (!record) {
        if (req.file) deleteFile(`/uploads/student/health-records/${req.file.filename}`);
        return res.status(404).json({ message: 'Health record not found' });
      }

      // 2. Prepare updates
      const updates = pickFields(req.body);

      // Map frontend field names (important!)
      if (req.body.name) updates.studentName = req.body.name;
      if (req.body.date) updates.recordDate = req.body.date;
      if (req.body.doctor) updates.doctorName = req.body.doctor;
      if (req.body.medications) updates.prescription = req.body.medications;

      // Handle file upload
      if (req.file) {
        if (record.reportFile) deleteFile(record.reportFile);
        updates.reportFile = `/uploads/student/health-records/${req.file.filename}`;
        updates.reportFileName = req.file.originalname;
      }

      // 3. Apply updates and save HealthRecord
      Object.assign(record, updates);
      await record.save();

      // 4. Re-fetch fresh record to ensure all fields are updated
      record = await HealthRecord.findById(record._id);

      // 5. Update Student's Last Health Checkup fields
      if (record && record.studentId) {
        const studentUpdatePayload = {
          lastCheckupDate: record.recordDate || null,
          lastCheckupDoctor: record.doctorName || '',
          lastCheckupStatus: record.status || 'Normal',
          lastCheckupNotes: (record.diagnosis || record.notes || '').trim(),
        };

        await Student.findByIdAndUpdate(
          record.studentId,
          studentUpdatePayload,
          { new: true }
        );

        // Debugging log - remove after testing if you want
        console.log(`✅ Student lastCheckup updated for studentId: ${record.studentId}`, studentUpdatePayload);
      } else {
        console.warn('⚠️ Could not update student lastCheckup - studentId missing in health record');
      }

      // 6. Return populated response
      const populated = await HealthRecord.findById(record._id)
        .populate('studentId', 'fullName studentId admissionIdStr');

      res.json({
        ...populated.toObject(),
        message: 'Health record updated successfully'
      });
    } catch (err) {
      if (req.file) deleteFile(`/uploads/student/health-records/${req.file.filename}`);
      console.error('updateHealthRecord:', err.message);
      res.status(500).json({ message: 'Server error while updating health record' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
/** DELETE /api/health-records/:id */
exports.deleteHealthRecord = async (req, res) => {
  try {
    const record = await HealthRecord.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!record) return res.status(404).json({ message: 'Health record not found' });
    if (record.reportFile) deleteFile(record.reportFile);

    res.json({ message: 'Health record deleted successfully' });
  } catch (err) {
    console.error('deleteHealthRecord:', err.message);
    res.status(500).json({ message: 'Server error while deleting health record' });
  }
};








// // controllers/healthRecordController.js
// const fs   = require('fs');
// const path = require('path');
// const multer = require('multer');
// const HealthRecord = require('../models/HealthRecord');

// // ─────────────────────────────────────────────────────────────────────────────
// // Multer — saves to uploads/student/health-report/
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-report');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'report-' + unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|webp|pdf/;
//     const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
//     const mimeOk = allowed.test(file.mimetype);
//     if (extOk && mimeOk) return cb(null, true);
//     cb(new Error('Only JPG, PNG, WebP and PDF files are allowed'));
//   }
// }).single('reportFile');

// // ─────────────────────────────────────────────────────────────────────────────
// const deleteFile = (filePath) => {
//   if (filePath?.startsWith('/uploads/')) {
//     const full = path.join(__dirname, '..', filePath);
//     if (fs.existsSync(full)) fs.unlinkSync(full);
//   }
// };

// // Fields accepted from the frontend form
// const ALLOWED_FIELDS = [
//   'studentId', 'studentName',
//   'recordType', 'recordDate', 'time',
//   'doctorName', 'hospitalName',
//   'height', 'weight', 'bloodPressure', 'temperature', 'pulseRate',
//   'diagnosis', 'treatment', 'prescription',
//   'status', 'followUpDate', 'notes',
// ];

// const pickFields = (body) =>
//   ALLOWED_FIELDS.reduce((acc, key) => {
//     if (body[key] !== undefined && body[key] !== '') acc[key] = body[key];
//     return acc;
//   }, {});

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * GET /api/health-records
//  * Query params: search, status, recordType, studentId, from, to
//  */
// exports.getAllHealthRecords = async (req, res) => {
//   try {
//     const { search, status, recordType, studentId, from, to } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status)     query.status     = status;
//     if (recordType) query.recordType = recordType;
//     if (studentId)  query.studentId  = studentId;

//     if (from || to) {
//       query.recordDate = {};
//       if (from) query.recordDate.$gte = new Date(from);
//       if (to)   query.recordDate.$lte = new Date(to);
//     }

//     if (search) {
//       query.$or = [
//         { studentName: { $regex: search, $options: 'i' } },
//         { recordId:    { $regex: search, $options: 'i' } },
//         { doctorName:  { $regex: search, $options: 'i' } },
//         { diagnosis:   { $regex: search, $options: 'i' } },
//       ];
//     }

//     const records = await HealthRecord.find(query)
//       .sort({ recordDate: -1 })
//       .populate('studentId', 'fullName studentId admissionIdStr');

//     res.json(records);
//   } catch (err) {
//     console.error('getAllHealthRecords:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health records' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * GET /api/health-records/:id
//  */
// exports.getHealthRecordById = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     }).populate('studentId', 'fullName studentId admissionIdStr');

//     if (!record) return res.status(404).json({ message: 'Health record not found' });

//     res.json(record);
//   } catch (err) {
//     console.error('getHealthRecordById:', err.message);
//     res.status(500).json({ message: 'Server error while fetching health record' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * POST /api/health-records
//  */
// exports.createHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const data = {
//         ...pickFields(req.body),
//         organizationId: req.organizationId,
//       };

//       if (req.file) {
//         data.reportFile     = `/uploads/student/health-report/${req.file.filename}`;
//         data.reportFileName = req.file.originalname;
//       }

//       // Required field check
//       if (!data.studentId || !data.recordType || !data.recordDate) {
//         if (req.file) deleteFile(data.reportFile);
//         return res.status(400).json({ message: 'Student, record type and date are required' });
//       }

//       const record = await HealthRecord.create(data);

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.status(201).json({ ...populated.toObject(), message: 'Health record created successfully' });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('createHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while creating health record' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * PUT /api/health-records/:id
//  */
// exports.updateHealthRecord = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({
//         message: err.code === 'LIMIT_FILE_SIZE'
//           ? 'Report file size cannot exceed 5 MB'
//           : err.message || 'File upload failed'
//       });
//     }

//     try {
//       const record = await HealthRecord.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!record) {
//         if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//         return res.status(404).json({ message: 'Health record not found' });
//       }

//       const updates = pickFields(req.body);

//       if (req.file) {
//         // Delete old file before replacing
//         if (record.reportFile) deleteFile(record.reportFile);
//         updates.reportFile     = `/uploads/student/health-report/${req.file.filename}`;
//         updates.reportFileName = req.file.originalname;
//       }

//       Object.assign(record, updates);
//       await record.save();

//       const populated = await HealthRecord.findById(record._id)
//         .populate('studentId', 'fullName studentId admissionIdStr');

//       res.json({ ...populated.toObject(), message: 'Health record updated successfully' });
//     } catch (err) {
//       if (req.file) deleteFile(`/uploads/student/health-report/${req.file.filename}`);
//       console.error('updateHealthRecord:', err.message);
//       res.status(500).json({ message: 'Server error while updating health record' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * DELETE /api/health-records/:id
//  */
// exports.deleteHealthRecord = async (req, res) => {
//   try {
//     const record = await HealthRecord.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!record) return res.status(404).json({ message: 'Health record not found' });

//     if (record.reportFile) deleteFile(record.reportFile);

//     res.json({ message: 'Health record deleted successfully' });
//   } catch (err) {
//     console.error('deleteHealthRecord:', err.message);
//     res.status(500).json({ message: 'Server error while deleting health record' });
//   }
// };