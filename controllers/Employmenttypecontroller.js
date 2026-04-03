const EmploymentType = require('../models/EmploymentType');

/**
 * @desc    Get all employment types for this organization
 * @route   GET /api/staff/employment-types
 * @access  Private
 */
exports.getAllEmploymentTypes = async (req, res) => {
  try {
    const types = await EmploymentType.find({ organizationId: req.organizationId })
      .sort({ name: 1 });

    res.json(types);
  } catch (err) {
    console.error('Error fetching employment types:', err.message);
    res.status(500).json({ message: 'Server error while fetching employment types' });
  }
};

/**
 * @desc    Create a new employment type
 * @route   POST /api/staff/employment-types
 * @access  Private
 * @body    { name }  e.g. "Full Time"
 */
exports.createEmploymentType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Employment type name is required' });
    }

    const type = new EmploymentType({
      name: name.trim(),
      organizationId: req.organizationId
    });

    await type.save();
    res.status(201).json(type);
  } catch (err) {
    console.error('Error creating employment type:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This employment type already exists' });
    }
    res.status(500).json({ message: 'Server error while creating employment type' });
  }
};

/**
 * @desc    Update an employment type
 * @route   PUT /api/staff/employment-types/:id
 * @access  Private
 */
exports.updateEmploymentType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Employment type name is required' });
    }

    const type = await EmploymentType.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { name: name.trim() },
      { new: true }
    );

    if (!type) {
      return res.status(404).json({ message: 'Employment type not found' });
    }

    res.json(type);
  } catch (err) {
    console.error('Error updating employment type:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This employment type already exists' });
    }
    res.status(500).json({ message: 'Server error while updating employment type' });
  }
};

/**
 * @desc    Delete an employment type
 * @route   DELETE /api/staff/employment-types/:id
 * @access  Private
 */
exports.deleteEmploymentType = async (req, res) => {
  try {
    const type = await EmploymentType.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!type) {
      return res.status(404).json({ message: 'Employment type not found' });
    }

    res.json({ message: 'Employment type deleted successfully' });
  } catch (err) {
    console.error('Error deleting employment type:', err.message);
    res.status(500).json({ message: 'Server error while deleting employment type' });
  }
};