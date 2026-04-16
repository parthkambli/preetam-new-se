
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





// middleware/upload.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const createUploader = (folderPath, fieldName = 'profilePhoto') => {
  const fullPath = path.join(__dirname, '../uploads', folderPath);

  // Create folder if not exists
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${folderPath.replace(/\//g, '-')}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/i;
    if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, WEBP and PDF files are allowed!'), false);
    }
  };

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
  });
};

// Single centralized upload object
const upload = {
  // Fitness
  fitnessStaff: createUploader('fitness/staff').single('profilePhoto'),
  fitnessMember: createUploader('fitness/members').single('profilePhoto'),

  // School
  schoolProfile: createUploader('school/profiles').single('photo'),
  schoolStaff: createUploader('school/profiles').single('photo'),
  schoolHealthRecord: createUploader('school/health-records').single('healthRecord'),

  // Multiple files (Admission)
  schoolAdmission: createUploader('school').fields([
    { name: 'photo', maxCount: 1 },
    { name: 'healthRecord', maxCount: 5 }
  ])
};

module.exports = upload;