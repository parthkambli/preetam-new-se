// // routes/healthRecordRoutes.js
// const express = require('express');
// const auth = require('../middleware/auth');
// const upload = require('../middleware/upload');   // your existing multer setup

// const {
//   getAllHealthRecords,
//   saveHealthRecord,
//   deleteHealthRecord
// } = require('../controllers/healthRecordController');

// const router = express.Router();

// // Health Records
// router.get('/', auth, getAllHealthRecords);
// router.post('/', auth, upload.single('reportFile'), saveHealthRecord);
// router.put('/:id', auth, upload.single('reportFile'), saveHealthRecord);
// router.delete('/:id', auth, deleteHealthRecord);

// module.exports = router;









// routes/healthRecordRoutes.js
const express = require('express');
const {
  getAllHealthRecords,
  getHealthRecordById,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord
} = require('../controllers/healthRecordController');
const auth = require('../middleware/auth');
const { upload, handleUpload } = require('../middleware/upload');

const router = express.Router();

// All routes are protected
router.get('/',     auth, getAllHealthRecords);
router.get('/:id',  auth, getHealthRecordById);
// router.post('/',    auth, createHealthRecord);
router.post(
  '/',
  auth,
  handleUpload(upload.schoolHealthRecord),
  createHealthRecord
);
// router.put('/:id',  auth, updateHealthRecord);
router.put(
  '/:id',
  auth,
  handleUpload(upload.schoolHealthRecord),
  updateHealthRecord
);
router.delete('/:id', auth, deleteHealthRecord);

module.exports = router;