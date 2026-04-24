const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');

const {
  getRoles,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/accessRoleController');

// 🔐 Only admin
router.use(auth, allowPermissions('USER_MANAGE'));

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;