// const express = require('express');
// const auth = require('../middleware/auth');
// const upload = require('../middleware/upload');

// // Controllers
// const {
//   getAllStaff,
//   getStaffById,
//   createStaff,
//   updateStaff,
//   deleteStaff
// } = require('../controllers/Staffcontroller');

// const {
//   getAllRoles,
//   createRole,
//   updateRole,
//   deleteRole
// } = require('../controllers/Staffrolecontroller');

// const {
//   getAllEmploymentTypes,
//   createEmploymentType,
//   updateEmploymentType,
//   deleteEmploymentType
// } = require('../controllers/employmentTypeController');

// const {
//   getAllAttendance,
//   getAttendanceById,
//   createAttendance,
//   updateAttendance,
//   deleteAttendance
// } = require('../controllers/staffAttendanceController');

// const router = express.Router();

// // ─────────────────────────────────────────────────────────────────────────────
// // IMPORTANT: Specific routes MUST come before /:id routes.
// // If /:id is defined first, Express treats "roles", "attendance", etc. as IDs.
// // ─────────────────────────────────────────────────────────────────────────────

// // ─────────────────────────────────────────────────────────────────────────────
// // STAFF ROLES  →  /api/staff/roles
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/roles',         auth, getAllRoles);
// router.post('/roles',        auth, createRole);
// router.put('/roles/:id',     auth, updateRole);
// router.delete('/roles/:id',  auth, deleteRole);

// // ─────────────────────────────────────────────────────────────────────────────
// // EMPLOYMENT TYPES  →  /api/staff/employment-types
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/employment-types',         auth, getAllEmploymentTypes);
// router.post('/employment-types',        auth, createEmploymentType);
// router.put('/employment-types/:id',     auth, updateEmploymentType);
// router.delete('/employment-types/:id',  auth, deleteEmploymentType);

// // ─────────────────────────────────────────────────────────────────────────────
// // STAFF ATTENDANCE  →  /api/staff/attendance
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/attendance',          auth, getAllAttendance);
// router.post('/attendance',         auth, createAttendance);
// router.get('/attendance/:id',      auth, getAttendanceById);
// router.put('/attendance/:id',      auth, updateAttendance);
// router.delete('/attendance/:id',   auth, deleteAttendance);

// // ─────────────────────────────────────────────────────────────────────────────
// // STAFF  →  /api/staff   (/:id routes go LAST)
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/',       auth, getAllStaff);
// router.post('/',      auth, upload.single('photo'), createStaff);
// router.get('/:id',    auth, getStaffById);
// router.put('/:id',    auth, upload.single('photo'), updateStaff);
// router.delete('/:id', auth, deleteStaff);

// module.exports = router;


const express = require('express');
const auth = require('../middleware/auth');
const { upload, handleUpload } = require('../middleware/upload');

// Controllers
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/Staffcontroller');

const {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/Staffrolecontroller');

const {
  getAllEmploymentTypes,
  createEmploymentType,
  updateEmploymentType,
  deleteEmploymentType
} = require('../controllers/Employmenttypecontroller');

const {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/Staffattendancecontroller');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before /:id routes.
// If /:id is defined first, Express treats "roles", "attendance", etc. as IDs.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ROLES  →  /api/staff/roles
// ─────────────────────────────────────────────────────────────────────────────
router.get('/roles',         auth, getAllRoles);
router.post('/roles',        auth, createRole);
router.put('/roles/:id',     auth, updateRole);
router.delete('/roles/:id',  auth, deleteRole);

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYMENT TYPES  →  /api/staff/employment-types
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employment-types',         auth, getAllEmploymentTypes);
router.post('/employment-types',        auth, createEmploymentType);
router.put('/employment-types/:id',     auth, updateEmploymentType);
router.delete('/employment-types/:id',  auth, deleteEmploymentType);

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ATTENDANCE  →  /api/staff/attendance
// ─────────────────────────────────────────────────────────────────────────────
router.get('/attendance',          auth, getAllAttendance);
router.post('/attendance',         auth, createAttendance);
router.get('/attendance/:id',      auth, getAttendanceById);
router.put('/attendance/:id',      auth, updateAttendance);
router.delete('/attendance/:id',   auth, deleteAttendance);

// ─────────────────────────────────────────────────────────────────────────────
// STAFF  →  /api/staff   (/:id routes go LAST)
// NOTE: No upload middleware here — multer is handled inside the controller,
// exactly like fitnessMemberController does it.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/',       auth, getAllStaff);
// router.post('/',      auth, createStaff);
router.post(
  '/',
  auth,
  handleUpload(upload.schoolStaff),
  createStaff
);
router.get('/:id',    auth, getStaffById);
// router.put('/:id',    auth, updateStaff);
router.put(
  '/:id',
  auth,
  handleUpload(upload.schoolStaff),
  updateStaff
);
router.delete('/:id', auth, deleteStaff);

module.exports = router;