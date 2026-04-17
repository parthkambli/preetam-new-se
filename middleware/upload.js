
// const fs = require("fs");
// const path = require("path");
// const multer = require("multer");

// const uploadPath = path.join(__dirname, "../uploads/staff");

// // create folder if not exists
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, "staff-" + Date.now() + "-" + file.originalname);
//   }
// });

// const uploads = multer({ storage });

// module.exports = uploads;

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   }
//   cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed!'));
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
//   fileFilter: fileFilter
// });

// module.exports = upload;    





// // middleware/upload.js
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');

// const createUploader = (folderPath, fieldName = 'profilePhoto') => {
//   const fullPath = path.join(__dirname, '../uploads', folderPath);

//   // Create folder if not exists
//   if (!fs.existsSync(fullPath)) {
//     fs.mkdirSync(fullPath, { recursive: true });
//   }

//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, fullPath);
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       cb(null, `${folderPath.replace(/\//g, '-')}-${uniqueSuffix}${path.extname(file.originalname)}`);
//     }
//   });

//   const fileFilter = (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|webp|pdf/i;
//     if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPG, JPEG, PNG, WEBP and PDF files are allowed!'), false);
//     }
//   };

//   return multer({
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//     fileFilter
//   });
// };

// // Single centralized upload object
// const upload = {
//   // Fitness
//   fitnessStaff: createUploader('fitness/staff').single('profilePhoto'),
//   fitnessMember: createUploader('fitness/members').single('profilePhoto'),

//   // School
//   schoolProfile: createUploader('school/profiles').single('photo'),
//   schoolStaff: createUploader('school/profiles').single('photo'),
//   schoolHealthRecord: createUploader('school/health-records').single('healthRecord'),

//   // Multiple files (Admission)
//   schoolAdmission: createUploader('school').fields([
//     { name: 'photo', maxCount: 1 },
//     { name: 'healthRecord', maxCount: 5 }
//   ])
// };

// module.exports = upload;













// middleware/upload.js
const multer = require('multer');
const fs     = require('fs');
const path   = require('path');

const createUploader = (folderPath, fieldName = 'profilePhoto') => {
  const fullPath = path.join(__dirname, '../uploads', folderPath);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, fullPath),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${folderPath.replace(/\//g, '-')}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedExts  = /jpeg|jpg|png|webp|pdf/i;
    const allowedMimes = /image\/(jpeg|jpg|png|webp)|application\/pdf/i;

    const extValid  = allowedExts.test(path.extname(file.originalname));
    const mimeValid = allowedMimes.test(file.mimetype);

    if (extValid && mimeValid) {
      cb(null, true);
    } else {
      // Pass a typed error so the error-handler middleware can distinguish it
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', fieldName);
      err.message = 'Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.';
      err.code    = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  };

  return multer({
    storage,
    limits: {
      fileSize:  5 * 1024 * 1024, // 5 MB
      files:     1,                // single file only
    },
    fileFilter,
  });
};

// ─── Centralized upload object ────────────────────────────────────────────────
const upload = {
  fitnessStaff:      createUploader('fitness/staff').single('profilePhoto'),
  fitnessMember:     createUploader('fitness/members').single('profilePhoto'),
  schoolProfile:     createUploader('school/profiles').single('photo'),
  schoolStaff:       createUploader('school/profiles').single('photo'),
  schoolHealthRecord:createUploader('school/health-records').single('healthRecord'),
  schoolAdmission:   createUploader('school').fields([
    { name: 'photo',         maxCount: 1 },
    { name: 'healthRecord',  maxCount: 5 },
  ]),
};

// ─── Multer error-handler middleware factory ──────────────────────────────────
// Wrap any upload middleware so multer errors are caught and returned as clean
// JSON responses instead of crashing the request.
//
// Usage in routes:
//   router.post('/', auth, handleUpload(upload.fitnessMember), createMember);
//
const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next(); // ✅ no error — continue

    // ── Multer-specific errors ────────────────────────────────────────────
    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(413).json({
            message: 'File is too large. Maximum allowed size is 5 MB.',
            field:   err.field || 'profilePhoto',
            code:    'FILE_TOO_LARGE',
          });

        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            message: 'Too many files uploaded. Only one file is allowed.',
            code:    'TOO_MANY_FILES',
          });

        case 'LIMIT_UNEXPECTED_FILE':
          // Re-used by our custom fileFilter for wrong mime/ext
          if (err.code === 'INVALID_FILE_TYPE') {
            return res.status(415).json({
              message: err.message || 'Invalid file type.',
              code:    'INVALID_FILE_TYPE',
            });
          }
          return res.status(400).json({
            message: `Unexpected file field: "${err.field}". Check the field name.`,
            code:    'UNEXPECTED_FIELD',
          });

        case 'LIMIT_PART_COUNT':
          return res.status(400).json({
            message: 'Too many form parts in the request.',
            code:    'TOO_MANY_PARTS',
          });

        case 'LIMIT_FIELD_KEY':
          return res.status(400).json({
            message: 'A form field name is too long.',
            code:    'FIELD_NAME_TOO_LONG',
          });

        case 'LIMIT_FIELD_VALUE':
          return res.status(400).json({
            message: 'A form field value is too long.',
            code:    'FIELD_VALUE_TOO_LONG',
          });

        case 'LIMIT_FIELD_COUNT':
          return res.status(400).json({
            message: 'Too many form fields in the request.',
            code:    'TOO_MANY_FIELDS',
          });

        default:
          return res.status(400).json({
            message: `Upload error: ${err.message}`,
            code:    err.code || 'UPLOAD_ERROR',
          });
      }
    }

    // ── Custom fileFilter errors (INVALID_FILE_TYPE bubbled up) ──────────
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(415).json({
        message: err.message || 'Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.',
        code:    'INVALID_FILE_TYPE',
      });
    }

    // ── Generic / unexpected errors ───────────────────────────────────────
    console.error('Upload middleware unexpected error:', err);
    return res.status(500).json({
      message: 'An unexpected error occurred during file upload. Please try again.',
      code:    'UPLOAD_UNEXPECTED_ERROR',
    });
  });
};

module.exports = { upload, handleUpload };