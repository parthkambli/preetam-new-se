const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');

const {
  createUser,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/userManagementController');

// 🔐 Only admins (USER_MANAGE)
router.use(auth, allowPermissions('USER_MANAGE'));

router.post('/', createUser);
router.get('/', getUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;