const SchoolEnquiry = require('../models/SchoolEnquiry');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given date string is strictly in the past
 * (before today's calendar date in local time).
 */
const isDateInPast = (dateStr) => {
  const input = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return input < today;
};

const VALID_GENDERS  = ['Male', 'Female', 'Other'];
const VALID_SOURCES  = ['Walk-in', 'App', 'Call', 'Website', 'Reference'];
// Must match SchoolEnquiry model enum exactly
const VALID_STATUSES = ['New', 'Follow Up', 'Converted', 'Admitted'];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all school enquiries with filtering
 * @route   GET /api/school/enquiry
 * @access  Private (Requires JWT token)
 * @query   { status, source, search, date }
 */
exports.getAllEnquiries = async (req, res) => {
  try {
    const { status, source, search, date } = req.query;

    let query = { organizationId: req.organizationId };

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      query.status = status;
    }

    if (source) {
      if (!VALID_SOURCES.includes(source)) {
        return res.status(400).json({ message: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` });
      }
      query.source = source;
    }

    if (search) {
      const trimmed = search.trim();
      if (trimmed.length < 1) {
        return res.status(400).json({ message: 'Search query cannot be empty.' });
      }
      query.$or = [
        { name:    { $regex: trimmed, $options: 'i' } },
        { contact: { $regex: trimmed, $options: 'i' } }
      ];
    }

    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      const nextDay = new Date(parsed);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: parsed, $lt: nextDay };
    }

    const enquiries = await SchoolEnquiry.find(query).sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    console.error('Error fetching school enquiries:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiries.' });
  }
};

/**
 * @desc    Get enquiries for admission dropdown (status != Admitted)
 * @route   GET /api/school/enquiry/admission-list
 * @access  Private (Requires JWT token)
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
    res.status(500).json({ message: 'Server error while fetching enquiries for admission.' });
  }
};

/**
 * @desc    Get single school enquiry by ID
 * @route   GET /api/school/enquiry/:id
 * @access  Private (Requires JWT token)
 */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await SchoolEnquiry.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }

    res.json(enquiry);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid enquiry ID format.' });
    }
    console.error('Error fetching school enquiry:', err.message);
    res.status(500).json({ message: 'Server error while fetching enquiry.' });
  }
};

/**
 * @desc    Create new school enquiry
 * @route   POST /api/school/enquiry
 * @access  Private (Requires JWT token)
 * @body    { name, contact, age, gender, activity, source, date }
 */
exports.createEnquiry = async (req, res) => {
  try {
    const { name, contact, age, gender, activity, source, date } = req.body;

    // ── Required fields ────────────────────────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }
    if (!contact) {
      return res.status(400).json({ message: 'Contact number is required.' });
    }

    // ── Name validation ────────────────────────────────────────────────────
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    }
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: 'Name cannot exceed 100 characters.' });
    }
    if (!/^[a-zA-Z\s'.,-]+$/.test(trimmedName)) {
      return res.status(400).json({ message: 'Name can only contain letters, spaces, and basic punctuation.' });
    }

    // ── Contact validation ─────────────────────────────────────────────────
    const contactStr = contact.toString().trim();
    if (!/^\d{10}$/.test(contactStr)) {
      return res.status(400).json({ message: 'Contact number must be exactly 10 digits.' });
    }

    // ── Age validation ─────────────────────────────────────────────────────
    if (age !== undefined && age !== '') {
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || isNaN(ageNum)) {
        return res.status(400).json({ message: 'Age must be a whole number.' });
      }
      if (ageNum < 1 || ageNum > 100) {
        return res.status(400).json({ message: 'Age must be between 1 and 100.' });
      }
    }

    // ── Gender validation ──────────────────────────────────────────────────
    if (gender && !VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ message: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}.` });
    }

    // ── Source validation ──────────────────────────────────────────────────
    if (source && !VALID_SOURCES.includes(source)) {
      return res.status(400).json({ message: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}.` });
    }

    // ── Activity validation ────────────────────────────────────────────────
    if (activity !== undefined && activity !== '') {
      if (activity.trim().length < 2) {
        return res.status(400).json({ message: 'Activity name must be at least 2 characters.' });
      }
      if (activity.trim().length > 100) {
        return res.status(400).json({ message: 'Activity name cannot exceed 100 characters.' });
      }
    }

    // ── Date validation ────────────────────────────────────────────────────
    let enquiryDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid enquiry date format. Use YYYY-MM-DD.' });
      }
      if (isDateInPast(date)) {
        return res.status(400).json({ message: 'Enquiry date cannot be in the past.' });
      }
      enquiryDate = parsedDate;
    }

    // ── Duplicate contact check (within same org) ──────────────────────────
    const existing = await SchoolEnquiry.findOne({
      organizationId: req.organizationId,
      contact: contactStr
    });
    if (existing) {
      return res.status(409).json({ message: `An enquiry with contact number ${contactStr} already exists (ID: ${existing.enquiryId}).` });
    }

    // ── Generate unique enquiryId ──────────────────────────────────────────
    const count = await SchoolEnquiry.countDocuments({ organizationId: req.organizationId });
    const enquiryIdNum = (count + 1).toString().padStart(4, '0');
    const enquiryId = `ENQ-School-${enquiryIdNum}`;

    const enquiry = new SchoolEnquiry({
      enquiryId,
      name: trimmedName,
      contact: contactStr,
      age:      age !== undefined && age !== '' ? Number(age) : undefined,
      gender:   gender   || 'Male',
      activity: activity ? activity.trim() : undefined,
      source:   source   || 'Walk-in',
      date:     enquiryDate,
      organizationId: req.organizationId
    });

    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (err) {
    console.error('Error creating school enquiry:', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      if (field === 'contact') {
        return res.status(409).json({ message: 'An enquiry with this contact number already exists.' });
      }
      return res.status(400).json({ message: 'Duplicate entry detected. Please try again.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while creating enquiry.' });
  }
};

/**
 * @desc    Update school enquiry (add remark, change status, set next visit)
 * @route   PUT /api/school/enquiry/:id
 * @access  Private (Requires JWT token)
 * @body    { remark, status, nextVisit }
 */
exports.updateEnquiry = async (req, res) => {
  try {
    const { remark, status, nextVisit } = req.body;

    if (remark === undefined && status === undefined && nextVisit === undefined) {
      return res.status(400).json({ message: 'At least one field (remark, status, or nextVisit) must be provided.' });
    }

    // ── Status validation ──────────────────────────────────────────────────
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    // ── Remark validation ──────────────────────────────────────────────────
    if (remark !== undefined) {
      if (typeof remark !== 'string') {
        return res.status(400).json({ message: 'Remark must be a string.' });
      }
      if (remark.trim().length > 500) {
        return res.status(400).json({ message: 'Remark cannot exceed 500 characters.' });
      }
    }

    // ── Next visit validation ──────────────────────────────────────────────
    if (nextVisit !== undefined && nextVisit !== '' && nextVisit !== null) {
      const parsedNextVisit = new Date(nextVisit);
      if (isNaN(parsedNextVisit.getTime())) {
        return res.status(400).json({ message: 'Invalid next visit date format. Use YYYY-MM-DD.' });
      }
      if (isDateInPast(nextVisit)) {
        return res.status(400).json({ message: 'Next visit date cannot be in the past.' });
      }
    }

    const enquiry = await SchoolEnquiry.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }

    // ── Prevent changing status of an already admitted enquiry ─────────────
    if (enquiry.status === 'Admitted' && status && status !== 'Admitted') {
      return res.status(400).json({ message: 'Cannot change status of an already admitted enquiry.' });
    }

    if (remark    !== undefined) enquiry.remark    = remark.trim();
    if (status    !== undefined) enquiry.status    = status;
    if (nextVisit !== undefined) enquiry.nextVisit = nextVisit || null;

    await enquiry.save();
    res.json(enquiry);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid enquiry ID format.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error updating school enquiry:', err.message);
    res.status(500).json({ message: 'Server error while updating enquiry.' });
  }
};

/**
 * @desc    Delete school enquiry
 * @route   DELETE /api/school/enquiry/:id
 * @access  Private (Requires JWT token)
 */
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await SchoolEnquiry.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }

    res.json({ message: 'Enquiry deleted successfully.' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid enquiry ID format.' });
    }
    console.error('Error deleting school enquiry:', err.message);
    res.status(500).json({ message: 'Server error while deleting enquiry.' });
  }
};







// const SchoolEnquiry = require('../models/SchoolEnquiry');

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /**
//  * Returns true if the given date string is strictly in the past
//  * (before today's calendar date in local time).
//  */
// const isDateInPast = (dateStr) => {
//   const input = new Date(dateStr);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   return input < today;
// };

// const VALID_GENDERS  = ['Male', 'Female', 'Other'];
// const VALID_SOURCES  = ['Walk-in', 'App', 'Call', 'Website', 'Reference'];
// const VALID_STATUSES = ['Pending', 'Interested', 'Not Interested', 'Admitted', 'Cancelled'];

// // ─── Controllers ──────────────────────────────────────────────────────────────

// /**
//  * @desc    Get all school enquiries with filtering
//  * @route   GET /api/school/enquiry
//  * @access  Private (Requires JWT token)
//  * @query   { status, source, search, date }
//  */
// exports.getAllEnquiries = async (req, res) => {
//   try {
//     const { status, source, search, date } = req.query;

//     let query = { organizationId: req.organizationId };

//     if (status) {
//       if (!VALID_STATUSES.includes(status)) {
//         return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
//       }
//       query.status = status;
//     }

//     if (source) {
//       if (!VALID_SOURCES.includes(source)) {
//         return res.status(400).json({ message: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` });
//       }
//       query.source = source;
//     }

//     if (search) {
//       const trimmed = search.trim();
//       if (trimmed.length < 1) {
//         return res.status(400).json({ message: 'Search query cannot be empty.' });
//       }
//       query.$or = [
//         { name:    { $regex: trimmed, $options: 'i' } },
//         { contact: { $regex: trimmed, $options: 'i' } }
//       ];
//     }

//     if (date) {
//       const parsed = new Date(date);
//       if (isNaN(parsed.getTime())) {
//         return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
//       }
//       const nextDay = new Date(parsed);
//       nextDay.setDate(nextDay.getDate() + 1);
//       query.date = { $gte: parsed, $lt: nextDay };
//     }

//     const enquiries = await SchoolEnquiry.find(query).sort({ createdAt: -1 });
//     res.json(enquiries);
//   } catch (err) {
//     console.error('Error fetching school enquiries:', err.message);
//     res.status(500).json({ message: 'Server error while fetching enquiries.' });
//   }
// };

// /**
//  * @desc    Get enquiries for admission dropdown (status != Admitted)
//  * @route   GET /api/school/enquiry/admission-list
//  * @access  Private (Requires JWT token)
//  */
// exports.getEnquiriesForAdmission = async (req, res) => {
//   try {
//     const enquiries = await SchoolEnquiry.find({
//       organizationId: req.organizationId,
//       status: { $ne: 'Admitted' }
//     }).sort({ createdAt: -1 });

//     res.json(enquiries);
//   } catch (err) {
//     console.error('Error fetching enquiries for admission:', err.message);
//     res.status(500).json({ message: 'Server error while fetching enquiries for admission.' });
//   }
// };

// /**
//  * @desc    Get single school enquiry by ID
//  * @route   GET /api/school/enquiry/:id
//  * @access  Private (Requires JWT token)
//  */
// exports.getEnquiryById = async (req, res) => {
//   try {
//     const enquiry = await SchoolEnquiry.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found.' });
//     }

//     res.json(enquiry);
//   } catch (err) {
//     // Invalid ObjectId format
//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ message: 'Invalid enquiry ID format.' });
//     }
//     console.error('Error fetching school enquiry:', err.message);
//     res.status(500).json({ message: 'Server error while fetching enquiry.' });
//   }
// };

// /**
//  * @desc    Create new school enquiry
//  * @route   POST /api/school/enquiry
//  * @access  Private (Requires JWT token)
//  * @body    { name, contact, age, gender, activity, source, date }
//  */
// exports.createEnquiry = async (req, res) => {
//   try {
//     const { name, contact, age, gender, activity, source, date } = req.body;

//     // ── Required fields ────────────────────────────────────────────────────
//     if (!name || !name.trim()) {
//       return res.status(400).json({ message: 'Full name is required.' });
//     }
//     if (!contact) {
//       return res.status(400).json({ message: 'Contact number is required.' });
//     }

//     // ── Name validation ────────────────────────────────────────────────────
//     const trimmedName = name.trim();
//     if (trimmedName.length < 2) {
//       return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
//     }
//     if (trimmedName.length > 100) {
//       return res.status(400).json({ message: 'Name cannot exceed 100 characters.' });
//     }
//     if (!/^[a-zA-Z\s'.,-]+$/.test(trimmedName)) {
//       return res.status(400).json({ message: 'Name can only contain letters, spaces, and basic punctuation.' });
//     }

//     // ── Contact validation ─────────────────────────────────────────────────
//     const contactStr = contact.toString().trim();
//     if (!/^\d{10}$/.test(contactStr)) {
//       return res.status(400).json({ message: 'Contact number must be exactly 10 digits.' });
//     }

//     // ── Age validation ─────────────────────────────────────────────────────
//     if (age !== undefined && age !== '') {
//       const ageNum = Number(age);
//       if (!Number.isInteger(ageNum) || isNaN(ageNum)) {
//         return res.status(400).json({ message: 'Age must be a whole number.' });
//       }
//       if (ageNum < 1 || ageNum > 100) {
//         return res.status(400).json({ message: 'Age must be between 1 and 100.' });
//       }
//     }

//     // ── Gender validation ──────────────────────────────────────────────────
//     if (gender && !VALID_GENDERS.includes(gender)) {
//       return res.status(400).json({ message: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}.` });
//     }

//     // ── Source validation ──────────────────────────────────────────────────
//     if (source && !VALID_SOURCES.includes(source)) {
//       return res.status(400).json({ message: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}.` });
//     }

//     // ── Activity validation ────────────────────────────────────────────────
//     if (activity !== undefined && activity !== '') {
//       if (activity.trim().length < 2) {
//         return res.status(400).json({ message: 'Activity name must be at least 2 characters.' });
//       }
//       if (activity.trim().length > 100) {
//         return res.status(400).json({ message: 'Activity name cannot exceed 100 characters.' });
//       }
//     }

//     // ── Date validation ────────────────────────────────────────────────────
//     let enquiryDate = new Date();
//     if (date) {
//       const parsedDate = new Date(date);
//       if (isNaN(parsedDate.getTime())) {
//         return res.status(400).json({ message: 'Invalid enquiry date format. Use YYYY-MM-DD.' });
//       }
//       if (isDateInPast(date)) {
//         return res.status(400).json({ message: 'Enquiry date cannot be in the past.' });
//       }
//       enquiryDate = parsedDate;
//     }

//     // ── Duplicate contact check (within same org) ──────────────────────────
//     const existing = await SchoolEnquiry.findOne({
//       organizationId: req.organizationId,
//       contact: contactStr
//     });
//     if (existing) {
//       return res.status(409).json({ message: `An enquiry with contact number ${contactStr} already exists (ID: ${existing.enquiryId}).` });
//     }

//     // ── Generate unique enquiryId ──────────────────────────────────────────
//     const count = await SchoolEnquiry.countDocuments({ organizationId: req.organizationId });
//     const enquiryIdNum = (count + 1).toString().padStart(4, '0');
//     const enquiryId = `ENQ-School-${enquiryIdNum}`;

//     const enquiry = new SchoolEnquiry({
//       enquiryId,
//       name: trimmedName,
//       contact: contactStr,
//       age:    age !== undefined && age !== '' ? Number(age) : undefined,
//       gender: gender || 'Male',
//       activity: activity ? activity.trim() : undefined,
//       source:   source   || 'Walk-in',
//       date:     enquiryDate,
//       organizationId: req.organizationId
//     });

//     await enquiry.save();
//     res.status(201).json(enquiry);
//   } catch (err) {
//     console.error('Error creating school enquiry:', err.message);
//     if (err.code === 11000) {
//       // Could be duplicate enquiryId (race condition) or duplicate contact
//       const field = Object.keys(err.keyValue || {})[0];
//       if (field === 'contact') {
//         return res.status(409).json({ message: 'An enquiry with this contact number already exists.' });
//       }
//       return res.status(400).json({ message: 'Duplicate entry detected. Please try again.' });
//     }
//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ message: messages.join(', ') });
//     }
//     res.status(500).json({ message: 'Server error while creating enquiry.' });
//   }
// };

// /**
//  * @desc    Update school enquiry (add remark, change status, set next visit)
//  * @route   PUT /api/school/enquiry/:id
//  * @access  Private (Requires JWT token)
//  * @body    { remark, status, nextVisit }
//  */
// exports.updateEnquiry = async (req, res) => {
//   try {
//     const { remark, status, nextVisit } = req.body;

//     // At least one field must be provided
//     if (remark === undefined && status === undefined && nextVisit === undefined) {
//       return res.status(400).json({ message: 'At least one field (remark, status, or nextVisit) must be provided.' });
//     }

//     // ── Status validation ──────────────────────────────────────────────────
//     if (status !== undefined && !VALID_STATUSES.includes(status)) {
//       return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
//     }

//     // ── Remark validation ──────────────────────────────────────────────────
//     if (remark !== undefined) {
//       if (typeof remark !== 'string') {
//         return res.status(400).json({ message: 'Remark must be a string.' });
//       }
//       if (remark.trim().length > 500) {
//         return res.status(400).json({ message: 'Remark cannot exceed 500 characters.' });
//       }
//     }

//     // ── Next visit validation ──────────────────────────────────────────────
//     if (nextVisit !== undefined && nextVisit !== '' && nextVisit !== null) {
//       const parsedNextVisit = new Date(nextVisit);
//       if (isNaN(parsedNextVisit.getTime())) {
//         return res.status(400).json({ message: 'Invalid next visit date format. Use YYYY-MM-DD.' });
//       }
//       if (isDateInPast(nextVisit)) {
//         return res.status(400).json({ message: 'Next visit date cannot be in the past.' });
//       }
//     }

//     const enquiry = await SchoolEnquiry.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found.' });
//     }

//     // ── Prevent re-admitting an already admitted enquiry ───────────────────
//     if (enquiry.status === 'Admitted' && status && status !== 'Admitted') {
//       return res.status(400).json({ message: 'Cannot change status of an already admitted enquiry.' });
//     }

//     if (remark   !== undefined) enquiry.remark    = remark.trim();
//     if (status   !== undefined) enquiry.status    = status;
//     if (nextVisit !== undefined) enquiry.nextVisit = nextVisit || null;

//     await enquiry.save();
//     res.json(enquiry);
//   } catch (err) {
//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ message: 'Invalid enquiry ID format.' });
//     }
//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ message: messages.join(', ') });
//     }
//     console.error('Error updating school enquiry:', err.message);
//     res.status(500).json({ message: 'Server error while updating enquiry.' });
//   }
// };

// /**
//  * @desc    Delete school enquiry
//  * @route   DELETE /api/school/enquiry/:id
//  * @access  Private (Requires JWT token)
//  */
// exports.deleteEnquiry = async (req, res) => {
//   try {
//     const enquiry = await SchoolEnquiry.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found.' });
//     }

//     // Prevent deleting an admitted enquiry
//     // (Uncomment if business logic requires it)
//     // if (enquiry.status === 'Admitted') {
//     //   return res.status(400).json({ message: 'Cannot delete an admitted enquiry.' });
//     // }

//     res.json({ message: 'Enquiry deleted successfully.' });
//   } catch (err) {
//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ message: 'Invalid enquiry ID format.' });
//     }
//     console.error('Error deleting school enquiry:', err.message);
//     res.status(500).json({ message: 'Server error while deleting enquiry.' });
//   }
// };