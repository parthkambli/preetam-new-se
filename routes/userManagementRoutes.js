const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');

const {
  getUsers,
  updateUser,
  deleteUser,
  assignRole,
  updateUserPermissions
} = require('../controllers/userManagementController');

// 🔐 Only admins
router.use(auth, allowPermissions('USER_MANAGE'));

// GET all users
router.get('/', getUsers);

// ASSIGN ROLE
router.put('/assign-role', assignRole);

// UPDATE user
router.put('/:id', updateUser);

// DELETE user
router.delete('/:id', deleteUser);

// UPDATE user permissions
router.put('/permissions', updateUserPermissions);

module.exports = router;