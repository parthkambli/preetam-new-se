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






// controllers/healthRecordController.js
const HealthRecord = require('../models/HealthRecord');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ─────────────────────────────────────────────────────────────────────────────
// Multer configuration for health report upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'student', 'health-reports');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'health-report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png|webp)|application\/pdf/.test(file.mimetype);

    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only JPG, PNG, WebP images and PDF files are allowed!'));
  }
}).single('reportFile');

// ─────────────────────────────────────────────────────────────────────────────
// Helper to delete old report from disk
const deleteOldReport = (reportPath) => {
  if (reportPath && reportPath.startsWith('/uploads/')) {
    const fullPath = path.join(__dirname, '..', reportPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Common error handler
const handleError = (res, err, customMessage = 'Server error') => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate record' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  res.status(500).json({
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all health records
exports.getAllHealthRecords = async (req, res) => {
  try {
    const { name, date } = req.query;

    const query = { organizationId: req.organizationId };

    if (name) query.name = { $regex: name, $options: 'i' };
    if (date) query.date = new Date(date);

    const records = await HealthRecord.find(query)
      .sort({ date: -1, time: -1 })
      .lean();

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch health records');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Create / Update Health Record
exports.saveHealthRecord = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Report file size cannot exceed 5MB' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }

    try {
      const { name, date, time, doctor, diagnosis, medications, status } = req.body;

      if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
      if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
      if (!time) return res.status(400).json({ success: false, message: 'Time is required' });
      if (!doctor?.trim()) return res.status(400).json({ success: false, message: 'Doctor/Clinic is required' });
      if (!status) return res.status(400).json({ success: false, message: 'Health status is required' });

      const recordData = {
        name: name.trim(),
        date: new Date(date),
        time,
        doctor: doctor.trim(),
        diagnosis: diagnosis ? diagnosis.trim() : '',
        medications: medications ? medications.trim() : '',
        status,
        organizationId: req.organizationId
      };

      if (req.file) {
        recordData.reportFile = `/uploads/student/health-reports/${req.file.filename}`;
      }

      // ── UPDATE ──────────────────────────────────────────────────────────────
      if (req.params.id) {
        const record = await HealthRecord.findOne({
          _id: req.params.id,
          organizationId: req.organizationId
        });

        if (!record) {
          if (req.file) deleteOldReport(recordData.reportFile);
          return res.status(404).json({ success: false, message: 'Health record not found' });
        }

        // Delete old report file before replacing
        if (req.file && record.reportFile) deleteOldReport(record.reportFile);

        Object.assign(record, recordData);
        await record.save();

        return res.json({
          success: true,
          message: 'Health record updated successfully',
          data: record
        });
      }

      // ── CREATE ──────────────────────────────────────────────────────────────
      const record = new HealthRecord(recordData);
      await record.save();

      res.status(201).json({
        success: true,
        message: 'Health record created successfully',
        data: record
      });
    } catch (err) {
      if (req.file) deleteOldReport(`/uploads/student/health-reports/${req.file.filename}`);
      handleError(res, err, 'Failed to save health record');
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete health record
exports.deleteHealthRecord = async (req, res) => {
  try {
    const record = await HealthRecord.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Health record not found' });
    }

    // Delete report file from disk if it exists
    if (record.reportFile) deleteOldReport(record.reportFile);

    res.json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete health record');
  }
};