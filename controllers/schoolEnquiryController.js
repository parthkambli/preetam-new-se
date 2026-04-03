const SchoolEnquiry = require('../models/SchoolEnquiry');

/**
 * @desc    Get all school enquiries with filtering
 * @route   GET /api/school/enquiry
 * @access  Private (Requires JWT token)
 * @query   { status, source, search, date }
 * @returns Array of school enquiries
 */
exports.getAllEnquiries = async (req, res) => {
  try {
    const { status, source, search, date } = req.query;

    let query = { organizationId: req.organizationId };

    if (status) {
      query.status = status;
    }
    if (source) {
      query.source = source;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }
    if (date) {
      query.date = { $gte: new Date(date), $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };
    }

    const enquiries = await SchoolEnquiry.find(query).sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    console.error('Error fetching school enquiries:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiries' });
  }
};

/**
 * @desc    Get enquiries for admission dropdown (status != Admitted)
 * @route   GET /api/school/enquiry/admission-list
 * @access  Private (Requires JWT token)
 * @returns Array of enquiries available for admission
 */
exports.getEnquiriesForAdmission = async (req, res) => {
  try {
    const enquiries = await SchoolEnquiry.find({
      organizationId: req.organizationId,
      status: { $ne: 'Admitted' }
    }).sort({ createdAt: -1 });
    
    res.json(enquiries);
  } catch (err) {
    console.error('Error fetching enquiries for admission:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiries for admission' });
  }
};

/**
 * @desc    Get single school enquiry by ID
 * @route   GET /api/school/enquiry/:id
 * @access  Private (Requires JWT token)
 * @returns Single enquiry object
 */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await SchoolEnquiry.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (err) {
    console.error('Error fetching school enquiry:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiry' });
  }
};

/**
 * @desc    Create new school enquiry
 * @route   POST /api/school/enquiry
 * @access  Private (Requires JWT token)
 * @body    { name, contact, age, gender, activity, source, date }
 * @returns Created enquiry object
 */
exports.createEnquiry = async (req, res) => {
  try {
    const { name, contact, age, gender, activity, source, date } = req.body;

    // Validate required fields
    if (!name || !contact) {
      return res.status(400).json({ message: 'Name and contact are required' });
    }

    // Generate unique enquiryId
    const count = await SchoolEnquiry.countDocuments({ organizationId: req.organizationId });
    const enquiryIdNum = (count + 1).toString().padStart(4, '0');
    const enquiryId = `ENQ-School-${enquiryIdNum}`;

    const enquiry = new SchoolEnquiry({
      enquiryId,
      name,
      contact,
      age,
      gender,
      activity,
      source,
      date: date || Date.now(),
      organizationId: req.organizationId
    });

    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (err) {
    console.error('Error creating school enquiry:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Enquiry ID already exists. Please try again.' });
    }
    res.status(500).json({ message: 'Server error while creating enquiry' });
  }
};

/**
 * @desc    Update school enquiry (add remark, change status, set next visit)
 * @route   PUT /api/school/enquiry/:id
 * @access  Private (Requires JWT token)
 * @body    { remark, status, nextVisit }
 * @returns Updated enquiry object
 */
exports.updateEnquiry = async (req, res) => {
  try {
    const { remark, status, nextVisit } = req.body;

    const enquiry = await SchoolEnquiry.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    if (remark !== undefined) enquiry.remark = remark;
    if (status !== undefined) enquiry.status = status;
    if (nextVisit !== undefined) enquiry.nextVisit = nextVisit;

    await enquiry.save();
    res.json(enquiry);
  } catch (err) {
    console.error('Error updating school enquiry:', err.message);
    res.status(500).json({ message: 'Server error while updating enquiry' });
  }
};

/**
 * @desc    Delete school enquiry
 * @route   DELETE /api/school/enquiry/:id
 * @access  Private (Requires JWT token)
 * @returns Success message
 */
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await SchoolEnquiry.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (err) {
    console.error('Error deleting school enquiry:', err.message);
    res.status(500).json({ message: 'Server error while deleting enquiry' });
  }
};
