// // middleware/upload.js
// const multer = require('multer');
// const path = require('path');

// // Ensure uploads/staff folder exists (create it manually or via code)
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/staff');   // Your uploads folder is at project root
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
//   }
// });
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadPath = path.join(__dirname, "../uploads/staff");

// create folder if not exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, "staff-" + Date.now() + "-" + file.originalname);
  }
});

const uploads = multer({ storage });

module.exports = uploads;

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

module.exports = upload;    