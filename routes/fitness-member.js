// const express = require('express');
// const {
//   getAllMembers,
//   getMemberById,
//   createMember,
//   updateMember,
//   deleteMember,
//   renewMember   
// } = require('../controllers/fitnessMemberController');

// const auth = require('../middleware/auth');

// const router = express.Router();

// // All routes are protected
// router.get('/', auth, getAllMembers);
// router.post('/', auth, createMember);

// // Renew route
// router.post('/:id/renew', auth, renewMember);  

// router.get('/:id', auth, getMemberById);
// router.put('/:id', auth, updateMember);
// router.delete('/:id', auth, deleteMember);

// module.exports = router;













// // routes/fitness-member.js
// const express = require('express');
// const router = express.Router();
// const upload = require('../middleware/upload');   // ← Centralized upload
// const auth = require('../middleware/auth');

// const {
//   getAllMembers,
//   getMemberById,
//   createMember,
//   updateMember,
//   deleteMember,
//   renewMember
// } = require('../controllers/fitnessMemberController');

// // Apply upload middleware + auth
// router.post('/', auth, upload.fitnessMember, createMember);           // ← Important
// router.put('/:id', auth, upload.fitnessMember, updateMember);         // ← Important

// router.get('/', auth, getAllMembers);
// router.get('/:id', auth, getMemberById);
// router.post('/:id/renew', auth, renewMember);
// router.delete('/:id', auth, deleteMember);

// module.exports = router;















// routes/fitness-member.js
const express             = require('express');
const router              = express.Router();
const { upload, handleUpload } = require('../middleware/upload');   // ← destructure both
const auth                = require('../middleware/auth');

const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  renewMember,
} = require('../controllers/fitnessMemberController');

// ── Write routes (need file upload) ──────────────────────────────────────────
// handleUpload wraps upload.fitnessMember so multer errors become clean JSON
// responses rather than unhandled exceptions.
router.post('/',    auth, handleUpload(upload.fitnessMember), createMember);
router.put('/:id',  auth, handleUpload(upload.fitnessMember), updateMember);

// ── Read / delete routes ──────────────────────────────────────────────────────
router.get('/',         auth, getAllMembers);
router.get('/:id',      auth, getMemberById);
router.post('/:id/renew', auth, renewMember);
router.delete('/:id',   auth, deleteMember);

module.exports = router;