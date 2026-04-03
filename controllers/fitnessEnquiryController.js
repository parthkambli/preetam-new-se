const FitnessEnquiry = require('../models/FitnessEnquiry');

/**
 * @desc    Get all fitness enquiries with filtering
 * @route   GET /api/fitness/enquiry
 * @access  Private (Requires JWT token)
 * @query   { status, source, search, date }
 * @returns Array of fitness enquiries
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
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    if (date) {
      query.enquiryDate = { $gte: new Date(date), $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };
    }

    const enquiries = await FitnessEnquiry.find(query).sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    console.error('Error fetching fitness enquiries:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiries' });
  }
};

/**
 * @desc    Get single fitness enquiry by ID
 * @route   GET /api/fitness/enquiry/:id
 * @access  Private (Requires JWT token)
 * @returns Single enquiry object
 */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await FitnessEnquiry.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (err) {
    console.error('Error fetching fitness enquiry:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiry' });
  }
};

/**
 * @desc    Create new fitness enquiry
 * @route   POST /api/fitness/enquiry
 * @access  Private (Requires JWT token)
 * @body    { fullName, age, gender, mobile, interestedActivity, source, enquiryDate, notes }
 * @returns Created enquiry object
 */
exports.createEnquiry = async (req, res) => {
  try {
    const { fullName, age, gender, mobile, interestedActivity, source, enquiryDate, notes } = req.body;

    // Validate required fields
    if (!fullName || !mobile || !gender) {
      return res.status(400).json({ message: 'Full name, mobile, and gender are required' });
    }

    // Generate unique enquiryId
    const count = await FitnessEnquiry.countDocuments({ organizationId: req.organizationId });
    const enquiryIdNum = (count + 1).toString().padStart(4, '0');
    const enquiryId = `ENQ-CLUB-${enquiryIdNum}`;

    const enquiry = new FitnessEnquiry({
      enquiryId,
      fullName,
      age,
      gender,
      mobile,
      interestedActivity,
      source,
      enquiryDate: enquiryDate || Date.now(),
      notes,
      organizationId: req.organizationId
    });

    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (err) {
    console.error('Error creating fitness enquiry:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Enquiry ID already exists. Please try again.' });
    }
    res.status(500).json({ message: 'Server error while creating enquiry' });
  }
};

/**
 * @desc    Update fitness enquiry (add remark, change status, set next visit)
 * @route   PUT /api/fitness/enquiry/:id
 * @access  Private (Requires JWT token)
 * @body    { remark, status, nextVisit }
 * @returns Updated enquiry object
 */
exports.updateEnquiry = async (req, res) => {
  try {
    const { remark, status, nextVisit } = req.body;

    const enquiry = await FitnessEnquiry.findOne({
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
    console.error('Error updating fitness enquiry:', err.message);
    res.status(500).json({ message: 'Server error while updating enquiry' });
  }
};

/**
 * @desc    Delete fitness enquiry
 * @route   DELETE /api/fitness/enquiry/:id
 * @access  Private (Requires JWT token)
 * @returns Success message
 */
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await FitnessEnquiry.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (err) {
    console.error('Error deleting fitness enquiry:', err.message);
    res.status(500).json({ message: 'Server error while deleting enquiry' });
  }
};
