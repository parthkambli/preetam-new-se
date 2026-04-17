/**
 * Fitness Staff Routes
 * Mounts all CRUD endpoints under /api/fitness-staff.
 *
 * POST   /api/fitness-staff          → createFitnessStaff  (multipart/form-data)
 * GET    /api/fitness-staff          → getFitnessStaff
 * GET    /api/fitness-staff/:id      → getFitnessStaffById
 * PUT    /api/fitness-staff/:id      → updateFitnessStaff  (multipart/form-data)
 * DELETE /api/fitness-staff/:id      → deleteFitnessStaff
 */

// const express = require("express");
// const router  = express.Router();

// const {
//   createFitnessStaff,
//   getFitnessStaff,
//   getFitnessStaffById,
//   updateFitnessStaff,
//   deleteFitnessStaff,
//   upload,                        // multer instance from controller
// } = require("../controllers/fitnessStaffController");

// // ─── Multer error handler (wraps multer middleware) ───────────────────────────
// /**
//  * Wraps a multer middleware so that multer-specific errors (file type, size)
//  * are returned as clean JSON instead of crashing the request.
//  */
// const multerSingle = (fieldName) => (req, res, next) => {
//   upload.single(fieldName)(req, res, (err) => {
//     if (!err) return next();

//     // Multer-specific errors
//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(413).json({
//         success: false,
//         message: "Profile photo must be smaller than 5 MB",
//       });
//     }
//     // fileFilter rejection or other multer errors
//     return res.status(400).json({
//       success: false,
//       message: err.message || "File upload error",
//     });
//   });
// };

// // ─── Routes ───────────────────────────────────────────────────────────────────

// // Create a new staff member  (accepts an optional profilePhoto file)
// router.post(
//   "/create",
//   multerSingle("profilePhoto"),
//   createFitnessStaff
// );

// // List all staff members  (supports ?page, ?limit, ?status, ?role, ?search)
// router.get("/", getFitnessStaff);

// // Get a single staff member by MongoDB ObjectId
// router.get("/:id", getFitnessStaffById);

// // Update a staff member  (also accepts an optional profilePhoto file)
// router.put('/:id', auth, updateStaff);

// // Delete a staff member (also removes their profile photo from disk)
// router.delete("/:id", deleteFitnessStaff);

// module.exports = router;





// const express = require("express");
// const router = express.Router();
// const auth = require("../middleware/auth");

// const {
//   createFitnessStaff,
//   getFitnessStaff,
//   getFitnessStaffById,
//   updateFitnessStaff,
//   deleteFitnessStaff,
//   upload,
// } = require("../controllers/fitnessStaffController");

// // Create a new staff member
// router.post("/create", auth, upload.single("photo"), createFitnessStaff);

// // List all staff members
// router.get("/", auth, getFitnessStaff);

// // Get a single staff member by MongoDB ObjectId
// router.get("/:id", auth, getFitnessStaffById);

// // Update a staff member
// router.put("/:id", auth, upload.single("photo"), updateFitnessStaff);

// // Delete a staff member
// router.delete("/:id", auth, deleteFitnessStaff);

// module.exports = router;





// // routes/fitness-staff.js
// const express = require('express');
// const router = express.Router();
// const upload = require('../middleware/upload');           // ← single upload
// const {
//   createFitnessStaff,
//   getFitnessStaff,
//   getFitnessStaffById,
//   updateFitnessStaff,
//   deleteFitnessStaff
// } = require('../controllers/fitnessStaffController');

// router.post('/create', upload.fitnessStaff, createFitnessStaff);
// router.get('/', getFitnessStaff);
// router.get('/:id', getFitnessStaffById);
// router.put('/:id', upload.fitnessStaff, updateFitnessStaff);
// router.delete('/:id', deleteFitnessStaff);

// module.exports = router;












// routes/fitness-staff.js
const express = require('express');
const router = express.Router();

const { upload, handleUpload } = require('../middleware/upload');   // ← Destructure properly
const {
  createFitnessStaff,
  getFitnessStaff,
  getFitnessStaffById,
  updateFitnessStaff,
  deleteFitnessStaff
} = require('../controllers/fitnessStaffController');

// Use handleUpload wrapper (strongly recommended - it gives nice JSON errors)
router.post('/create', handleUpload(upload.fitnessStaff), createFitnessStaff);

router.get('/', getFitnessStaff);
router.get('/:id', getFitnessStaffById);

// For update - also wrap with handleUpload
router.put('/:id', handleUpload(upload.fitnessStaff), updateFitnessStaff);

router.delete('/:id', deleteFitnessStaff);

module.exports = router;