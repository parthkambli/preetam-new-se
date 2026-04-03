const StaffRole = require('../models/StaffRole');

/**
 * @desc    Get all roles for this organization
 * @route   GET /api/staff/roles
 * @access  Private
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await StaffRole.find({ organizationId: req.organizationId })
      .sort({ name: 1 });  // alphabetical order for dropdown

    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err.message);
    res.status(500).json({ message: 'Server error while fetching roles' });
  }
};

/**
 * @desc    Create a new staff role
 * @route   POST /api/staff/roles
 * @access  Private
 * @body    { name }   e.g. "Caregiver"
 */
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const role = new StaffRole({
      name: name.trim(),
      organizationId: req.organizationId
    });

    await role.save();
    res.status(201).json(role);
  } catch (err) {
    console.error('Error creating role:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This role already exists' });
    }
    res.status(500).json({ message: 'Server error while creating role' });
  }
};

/**
 * @desc    Update a staff role
 * @route   PUT /api/staff/roles/:id
 * @access  Private
 */
exports.updateRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const role = await StaffRole.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { name: name.trim() },
      { new: true }   // return the updated document
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(role);
  } catch (err) {
    console.error('Error updating role:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This role already exists' });
    }
    res.status(500).json({ message: 'Server error while updating role' });
  }
};

/**
 * @desc    Delete a staff role
 * @route   DELETE /api/staff/roles/:id
 * @access  Private
 */
exports.deleteRole = async (req, res) => {
  try {
    const role = await StaffRole.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err.message);
    res.status(500).json({ message: 'Server error while deleting role' });
  }
};