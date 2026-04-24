const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');

const {
  getUsers,
  updateUser,
  deleteUser,
  assignRole,
  updateUserPermissions,
  createUser 
} = require('../controllers/userManagementController');

// 🔐 Only admins
router.use(auth, allowPermissions('USER_MANAGE'));

// GET all users
router.get('/', getUsers);

//create user
router.post('/', createUser);

// UPDATE user permissions
router.put('/permissions', updateUserPermissions);

// ASSIGN ROLE
router.put('/assign-role', assignRole);

// UPDATE user
router.put('/:id', updateUser);

// DELETE user
router.delete('/:id', deleteUser);

module.exports = router;