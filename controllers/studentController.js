const Student = require('../models/Student');

/**
 * @desc    Get all students with filtering
 * @route   GET /api/students
 * @access  Private (Requires JWT token)
 * @query   { searchName, searchMobile, feePlan, status, studentId }
 * @returns Array of students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const { searchName, searchMobile, feePlan, status, studentId } = req.query;

    let query = { organizationId: req.organizationId };

    if (searchName) {
      query.fullName = { $regex: searchName, $options: 'i' };
    }
    if (searchMobile) {
      query.mobile = { $regex: searchMobile, $options: 'i' };
    }
    if (feePlan && feePlan !== 'all') {
      query.feePlan = feePlan;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (studentId) {
      query.studentId = { $regex: studentId, $options: 'i' };
    }

    const students = await Student.find(query)
      .populate('admissionId', 'admissionId')
      .sort({ createdAt: -1 });
    
    // Add admissionId string to each student
    const studentsWithAdmission = students.map(s => ({
      ...s.toObject(),
      admissionIdStr: s.admissionId?.admissionId || 'N/A'
    }));
    
    res.json(studentsWithAdmission);
  } catch (err) {
    console.error('Error fetching students:', err.message);
    res.status(500).json({ message: 'Server error while fetching students' });
  }
};

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private (Requires JWT token)
 * @returns Single student object
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (err) {
    console.error('Error fetching student:', err.message);
    res.status(500).json({ message: 'Server error while fetching student' });
  }
};

/**
 * @desc    Update student by ID
 * @route   PUT /api/students/:id
 * @access  Private (Requires JWT token)
 * @body    Fields to update (partial data)
 * @returns Updated student object
 */
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update fields
    const updateFields = { ...req.body, updatedAt: Date.now() };
    delete updateFields._id;
    delete updateFields.organizationId;
    delete updateFields.createdAt;
    delete updateFields.studentId;
    delete updateFields.admissionId;

    Object.assign(student, updateFields);
    await student.save();

    res.json(student);
  } catch (err) {
    console.error('Error updating student:', err.message);
    res.status(500).json({ message: 'Server error while updating student' });
  }
};

/**
 * @desc    Delete student by ID
 * @route   DELETE /api/students/:id
 * @access  Private (Requires JWT token)
 * @returns Success message
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err.message);
    res.status(500).json({ message: 'Server error while deleting student' });
  }
};

/**
 * @desc    Update Emergency Contact of a student
 * @route   PUT /api/students/:id/emergency-contact
 * @access  Private
 */
exports.updateEmergencyContact = async (req, res) => {
  try {
    const {
      primaryContactName,
      primaryRelation,
      primaryPhone,
      secondaryContactName,
      secondaryRelation,
      secondaryPhone
    } = req.body;

    const student = await Student.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Validation
    if (!primaryContactName?.trim()) {
      return res.status(400).json({ success: false, message: 'Primary contact name is required' });
    }
    if (!primaryPhone?.trim() || !/^\d{10}$/.test(primaryPhone.trim())) {
      return res.status(400).json({ success: false, message: 'Primary phone must be exactly 10 digits' });
    }
    if (secondaryPhone && !/^\d{10}$/.test(secondaryPhone.trim())) {
      return res.status(400).json({ success: false, message: 'Secondary phone must be exactly 10 digits' });
    }

    student.primaryContactName = primaryContactName.trim();
    student.primaryRelation = primaryRelation?.trim() || '';
    student.primaryPhone = primaryPhone.trim();
    student.secondaryContactName = secondaryContactName?.trim() || '';
    student.secondaryRelation = secondaryRelation?.trim() || '';
    student.secondaryPhone = secondaryPhone?.trim() || '';

    await student.save();

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: {
        primaryContactName: student.primaryContactName,
        primaryRelation: student.primaryRelation,
        primaryPhone: student.primaryPhone,
        secondaryContactName: student.secondaryContactName,
        secondaryRelation: student.secondaryRelation,
        secondaryPhone: student.secondaryPhone,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error while updating emergency contact' });
  }
};

/**
 * @desc    Clear / Delete Emergency Contact (set to null)
 * @route   DELETE /api/students/:id/emergency-contact
 * @access  Private
 */
exports.clearEmergencyContact = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.primaryContactName = null;
    student.primaryRelation = null;
    student.primaryPhone = null;
    student.secondaryContactName = null;
    student.secondaryRelation = null;
    student.secondaryPhone = null;

    await student.save();

    res.json({ success: true, message: 'Emergency contact cleared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};