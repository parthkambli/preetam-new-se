const AccessRole = require('../models/AccessRole');

const PROTECTED_ROLES = [
  'ADMIN',
  'FITNESS_STAFF',
  'PARTICIPANT',
  'SCHOOL_STAFF',
  'STUDENT'
];

// ================= GET ROLES =================
exports.getRoles = async (req, res) => {
  try {
    const roles = await AccessRole.find({
      organizationId: req.organizationId
    }).lean();

    res.json({ success: true, data: roles });
  } catch (err) {
    console.error('getRoles error:', err.message);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

// ================= CREATE ROLE =================
exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const roleKey = name.toUpperCase().replace(/\s+/g, '_');

    // 🚫 Prevent duplicate roleKey
    const existing = await AccessRole.findOne({
      roleKey,
      organizationId: req.organizationId
    });

    if (existing) {
      return res.status(400).json({
        message: 'Role already exists'
      });
    }

    const role = await AccessRole.create({
      name,
      roleKey,
      permissions: permissions || [],
      organizationId: req.organizationId
    });

    res.json({ success: true, data: role });

  } catch (err) {
    console.error('createRole error:', err.message);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

// ================= UPDATE ROLE =================
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const role = await AccessRole.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const isProtected = PROTECTED_ROLES.includes(role.roleKey);

    // 🚫 Prevent renaming protected roles
    if (isProtected && name && name !== role.name) {
      return res.status(400).json({
        message: `Cannot rename protected role: ${role.roleKey}`
      });
    }

    // 🚫 Prevent removing all permissions from protected roles
    if (isProtected && Array.isArray(permissions) && permissions.length === 0) {
      return res.status(400).json({
        message: `Protected role must have permissions: ${role.roleKey}`
      });
    }

    role.name = name || role.name;
    role.permissions = permissions ?? role.permissions;

    await role.save();

    res.json({ success: true, data: role });

  } catch (err) {
    console.error('updateRole error:', err.message);
    res.status(500).json({ message: 'Failed to update role' });
  }
};

// ================= DELETE ROLE =================
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await AccessRole.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // 🚫 Prevent deleting protected roles
    if (PROTECTED_ROLES.includes(role.roleKey)) {
      return res.status(400).json({
        message: `Cannot delete protected role: ${role.roleKey}`
      });
    }

    await role.deleteOne();

    res.json({ success: true, message: 'Role deleted' });

  } catch (err) {
    console.error('deleteRole error:', err.message);
    res.status(500).json({ message: 'Failed to delete role' });
  }
};