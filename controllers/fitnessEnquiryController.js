// const FitnessEnquiry = require('../models/FitnessEnquiry');

// /**
//  * @desc    Get all fitness enquiries with filtering
//  * @route   GET /api/fitness/enquiry
//  * @access  Private (Requires JWT token)
//  * @query   { status, source, search, date }
//  * @returns Array of fitness enquiries
//  */
// exports.getAllEnquiries = async (req, res) => {
//   try {
//     const { status, source, search, date } = req.query;

//     let query = { organizationId: req.organizationId };

//     if (status) {
//       query.status = status;
//     }
//     if (source) {
//       query.source = source;
//     }
//     if (search) {
//       query.$or = [
//         { fullName: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } }
//       ];
//     }
//     if (date) {
//       query.enquiryDate = { $gte: new Date(date), $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };
//     }

//     const enquiries = await FitnessEnquiry.find(query)
//   .populate('interestedActivity', 'name activityName')
//   .populate('responsibleStaff', 'name fullName')
//   .sort({ createdAt: -1 });
//     res.json(enquiries);
//   } catch (err) {
//     console.error('Error fetching fitness enquiries:', err.message);
//     res.status(500).json({ message: 'Server error while fetching enquiries' });
//   }
// };

// /**
//  * @desc    Get single fitness enquiry by ID
//  * @route   GET /api/fitness/enquiry/:id
//  * @access  Private (Requires JWT token)
//  * @returns Single enquiry object
//  */
// exports.getEnquiryById = async (req, res) => {
//   try {
//     const enquiry = await FitnessEnquiry.findOne({
//   _id: req.params.id,
//   organizationId: req.organizationId
// })
//   .populate('interestedActivity', 'name activityName')
//   .populate('responsibleStaff', 'name fullName');
//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     res.json(enquiry);
//   } catch (err) {
//     console.error('Error fetching fitness enquiry:', err.message);
//     res.status(500).json({ message: 'Server error while fetching enquiry' });
//   }
// };

// /**
//  * @desc    Create new fitness enquiry
//  * @route   POST /api/fitness/enquiry
//  * @access  Private (Requires JWT token)
//  * @body    { fullName, age, gender, mobile, interestedActivity, source, enquiryDate, notes }
//  * @returns Created enquiry object
//  */
// exports.createEnquiry = async (req, res) => {
//   try {
//   //  const { fullName, age, gender, mobile, interestedActivity, source, enquiryDate, notes } = req.body;
//   const { fullName, age, gender, mobile, interestedActivity, responsibleStaff, source, enquiryDate, notes } = req.body;

//     // Validate required fields
//     if (!fullName || !mobile || !gender) {
//       return res.status(400).json({ message: 'Full name, mobile, and gender are required' });
//     }

//     // Generate unique enquiryId
//     const count = await FitnessEnquiry.countDocuments({ organizationId: req.organizationId });
//     const enquiryIdNum = (count + 1).toString().padStart(4, '0');
//     const enquiryId = `ENQ-CLUB-${enquiryIdNum}`;

//     const enquiry = new FitnessEnquiry({
//       enquiryId,
//       fullName,
//       age,
//       gender,
//       mobile,
//       interestedActivity,
//       source,
//       interestedActivity,
//       responsibleStaff,
//       enquiryDate: enquiryDate || Date.now(),
//       notes,
//       organizationId: req.organizationId
//     });

//     await enquiry.save();
//     res.status(201).json(enquiry);
//   } catch (err) {
//     console.error('Error creating fitness enquiry:', err.message);
//     if (err.code === 11000) {
//       return res.status(400).json({ message: 'Enquiry ID already exists. Please try again.' });
//     }
//     res.status(500).json({ message: 'Server error while creating enquiry' });
//   }
// };

// /**
//  * @desc    Update fitness enquiry (add remark, change status, set next visit)
//  * @route   PUT /api/fitness/enquiry/:id
//  * @access  Private (Requires JWT token)
//  * @body    { remark, status, nextVisit }
//  * @returns Updated enquiry object
//  */
// exports.updateEnquiry = async (req, res) => {
//   try {
//     const { remark, status, nextVisit } = req.body;

//     const enquiry = await FitnessEnquiry.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     if (remark !== undefined) enquiry.remark = remark;
//     if (status !== undefined) enquiry.status = status;
//     if (nextVisit !== undefined) enquiry.nextVisit = nextVisit;

//     await enquiry.save();
//     res.json(enquiry);
//   } catch (err) {
//     console.error('Error updating fitness enquiry:', err.message);
//     res.status(500).json({ message: 'Server error while updating enquiry' });
//   }
// };

// /**
//  * @desc    Delete fitness enquiry
//  * @route   DELETE /api/fitness/enquiry/:id
//  * @access  Private (Requires JWT token)
//  * @returns Success message
//  */
// exports.deleteEnquiry = async (req, res) => {
//   try {
//     const enquiry = await FitnessEnquiry.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     res.json({ message: 'Enquiry deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting fitness enquiry:', err.message);
//     res.status(500).json({ message: 'Server error while deleting enquiry' });
//   }
// };







// const mongoose = require('mongoose');
// const FitnessEnquiry = require('../models/FitnessEnquiry');
// const FitnessActivity = require('../models/FitnessActivity');
// const FitnessStaff = require('../models/FitnessStaff');

// /**
//  * @desc    Get all fitness enquiries with filtering
//  * @route   GET /api/fitness/enquiry
//  * @access  Private
//  */
// exports.getAllEnquiries = async (req, res) => {
//   try {
//     const { status, source, search, date, interestedActivity } = req.query;

//     const query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (source) query.source = source;

//     if (search) {
//       query.$or = [
//         { fullName: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } }
//       ];
//     }

//     if (date) {
//       const start = new Date(date);
//       const end = new Date(date);
//       end.setDate(end.getDate() + 1);
//       query.enquiryDate = { $gte: start, $lt: end };
//     }

//     if (interestedActivity) {
//       if (mongoose.Types.ObjectId.isValid(interestedActivity)) {
//         query.interestedActivity = interestedActivity;
//       } else {
//         query.interestedActivity = interestedActivity;
//       }
//     }

//     const enquiries = await FitnessEnquiry.find(query)
//       .populate('interestedActivity', 'name activityName')
//       .populate('responsibleStaff', 'fullName name')
//       .sort({ createdAt: -1 });

//     const formattedEnquiries = enquiries.map((enq) => ({
//       ...enq.toObject(),
//       interestedActivity:
//         typeof enq.interestedActivity === 'object' && enq.interestedActivity !== null
//           ? enq.interestedActivity.name || enq.interestedActivity.activityName || '-'
//           : enq.interestedActivity || '-',
//       responsibleStaff:
//         typeof enq.responsibleStaff === 'object' && enq.responsibleStaff !== null
//           ? enq.responsibleStaff.fullName || enq.responsibleStaff.name || '-'
//           : enq.responsibleStaff || '-',
//     }));

//     res.json(formattedEnquiries);
//   } catch (err) {
//     console.error('Error fetching fitness enquiries:', err);
//     res.status(500).json({
//       message: 'Server error while fetching enquiries',
//       error: err.message
//     });
//   }
// };

// /**
//  * @desc    Get single fitness enquiry by ID
//  * @route   GET /api/fitness/enquiry/:id
//  * @access  Private
//  */
// exports.getEnquiryById = async (req, res) => {
//   try {
//     const enquiry = await FitnessEnquiry.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     })
//       .populate('interestedActivity', 'name activityName')
//       .populate('responsibleStaff', 'fullName name');

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     const formattedEnquiry = {
//       ...enquiry.toObject(),
//       interestedActivity:
//         typeof enquiry.interestedActivity === 'object' && enquiry.interestedActivity !== null
//           ? enquiry.interestedActivity.name || enquiry.interestedActivity.activityName || '-'
//           : enquiry.interestedActivity || '-',
//       responsibleStaff:
//         typeof enquiry.responsibleStaff === 'object' && enquiry.responsibleStaff !== null
//           ? enquiry.responsibleStaff.fullName || enquiry.responsibleStaff.name || '-'
//           : enquiry.responsibleStaff || '-',
//     };

//     res.json(formattedEnquiry);
//   } catch (err) {
//     console.error('Error fetching fitness enquiry:', err);
//     res.status(500).json({
//       message: 'Server error while fetching enquiry',
//       error: err.message
//     });
//   }
// };

// /**
//  * @desc    Create new fitness enquiry
//  * @route   POST /api/fitness/enquiry
//  * @access  Private
//  */
// exports.createEnquiry = async (req, res) => {
//   try {
//     const {
//       fullName,
//       age,
//       gender,
//       mobile,
//       interestedActivity,
//       responsibleStaff,
//       source,
//       enquiryDate,
//       notes
//     } = req.body;

//     if (!fullName || !mobile || !gender) {
//       return res.status(400).json({
//         message: 'Full name, mobile, and gender are required'
//       });
//     }

//     const count = await FitnessEnquiry.countDocuments({
//       organizationId: req.organizationId
//     });

//     const enquiryIdNum = (count + 1).toString().padStart(4, '0');
//     const enquiryId = `ENQ-CLUB-${enquiryIdNum}`;

//     let activityValue = null;
//     let staffValue = null;

//     if (
//       interestedActivity &&
//       mongoose.Types.ObjectId.isValid(interestedActivity)
//     ) {
//       activityValue = interestedActivity;
//     }

//     if (
//       responsibleStaff &&
//       mongoose.Types.ObjectId.isValid(responsibleStaff)
//     ) {
//       staffValue = responsibleStaff;
//     }

//     const enquiry = new FitnessEnquiry({
//       enquiryId,
//       fullName: fullName.trim(),
//       age: age !== undefined && age !== '' ? Number(age) : undefined,
//       gender,
//       mobile: mobile.toString().trim(),
//       interestedActivity: activityValue,
//       responsibleStaff: staffValue,
//       source: source || 'Walk-in',
//       enquiryDate: enquiryDate || Date.now(),
//       notes: notes || '',
//       organizationId: req.organizationId
//     });

//     await enquiry.save();

//     res.status(201).json({
//       ...enquiry.toObject(),
//       interestedActivity: '-',
//       responsibleStaff: '-'
//     });
//   } catch (err) {
//     console.error('Error creating fitness enquiry:', err);
//     if (err.code === 11000) {
//       return res.status(400).json({
//         message: 'Enquiry ID already exists. Please try again.'
//       });
//     }
//     res.status(500).json({
//       message: 'Server error while creating enquiry',
//       error: err.message
//     });
//   }
// };

// /**
//  * @desc    Update fitness enquiry
//  * @route   PUT /api/fitness/enquiry/:id
//  * @access  Private
//  */
// exports.updateEnquiry = async (req, res) => {
//   try {
//     const { remark, status, nextVisit } = req.body;

//     const enquiry = await FitnessEnquiry.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     if (remark !== undefined) enquiry.remark = remark;
//     if (status !== undefined) enquiry.status = status;
//     if (nextVisit !== undefined) enquiry.nextVisit = nextVisit;

//     await enquiry.save();
//     res.json(enquiry);
//   } catch (err) {
//     console.error('Error updating fitness enquiry:', err);
//     res.status(500).json({
//       message: 'Server error while updating enquiry',
//       error: err.message
//     });
//   }
// };

// /**
//  * @desc    Delete fitness enquiry
//  * @route   DELETE /api/fitness/enquiry/:id
//  * @access  Private
//  */
// exports.deleteEnquiry = async (req, res) => {
//   try {
//     const enquiry = await FitnessEnquiry.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!enquiry) {
//       return res.status(404).json({ message: 'Enquiry not found' });
//     }

//     res.json({ message: 'Enquiry deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting fitness enquiry:', err);
//     res.status(500).json({
//       message: 'Server error while deleting enquiry',
//       error: err.message
//     });
//   }
// };////////

///old













///////new 


const mongoose = require('mongoose');
const FitnessEnquiry = require('../models/FitnessEnquiry');
const FitnessActivity = require('../models/FitnessActivity');
const FitnessStaff = require('../models/FitnessStaff');

/**
 * @desc    Get all fitness enquiries with filtering
 * @route   GET /api/fitness/enquiry
 * @access  Private
 */
// exports.getAllEnquiries = async (req, res) => {
//   try {
//     const { status, source, search, date, interestedActivity } = req.query;

//     const query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (source) query.source = source;

//     if (search) {
//       query.$or = [
//         { fullName: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } }
//       ];
//     }

//     if (date) {
//       const start = new Date(date);
//       const end = new Date(date);
//       end.setDate(end.getDate() + 1);
//       query.enquiryDate = { $gte: start, $lt: end };
//     }

//     if (interestedActivity) {
//       if (mongoose.Types.ObjectId.isValid(interestedActivity)) {
//         query.interestedActivity = interestedActivity;
//       } else {
//         query.interestedActivity = interestedActivity;
//       }
//     }

//     const enquiries = await FitnessEnquiry.find(query)
//       .populate('interestedActivity', 'name activityName')
//       .populate('responsibleStaff', 'fullName name')
//       .sort({ createdAt: -1 });

//     const formattedEnquiries = enquiries.map((enq) => ({
//       ...enq.toObject(),
//       interestedActivity:
//         typeof enq.interestedActivity === 'object' && enq.interestedActivity !== null
//           ? enq.interestedActivity.name || enq.interestedActivity.activityName || '-'
//           : enq.interestedActivity || '-',
//       responsibleStaff:
//         typeof enq.responsibleStaff === 'object' && enq.responsibleStaff !== null
//           ? enq.responsibleStaff.fullName || enq.responsibleStaff.name || '-'
//           : enq.responsibleStaff || '-',
//     }));

//     res.json(formattedEnquiries);
//   } catch (err) {
//     console.error('Error fetching fitness enquiries:', err);
//     res.status(500).json({
//       message: 'Server error while fetching enquiries',
//       error: err.message
//     });
//   }
// };

  exports.getAllEnquiries = async (req, res) => {
  try {
    const {
      status,
      source,
      search,
      date,
      interestedActivity,
      page = 1,
      limit = 10
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const query = {
      organizationId: req.organizationId
    };

    if (status) query.status = status;
    if (source) query.source = source;

    if (search) {
      query.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i"
          }
        },
        {
          mobile: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);

      query.enquiryDate = {
        $gte: start,
        $lt: end
      };
    }

    if (interestedActivity) {
      query.interestedActivity = interestedActivity;
    }

    // total count BEFORE pagination
    const totalRecords =
      await FitnessEnquiry.countDocuments(query);

    const enquiries = await FitnessEnquiry.find(query)
      .populate("interestedActivity", "name activityName")
      .populate("responsibleStaff", "fullName name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const formattedEnquiries = enquiries.map((enq) => ({
      ...enq.toObject(),
      interestedActivity:
        typeof enq.interestedActivity === "object" &&
        enq.interestedActivity !== null
          ? enq.interestedActivity.name ||
            enq.interestedActivity.activityName ||
            "-"
          : enq.interestedActivity || "-",

      responsibleStaff:
        typeof enq.responsibleStaff === "object" &&
        enq.responsibleStaff !== null
          ? enq.responsibleStaff.fullName ||
            enq.responsibleStaff.name ||
            "-"
          : enq.responsibleStaff || "-"
    }));

    res.json({
      success: true,
      data: formattedEnquiries,
      pagination: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(
          totalRecords / limitNumber
        ),
        limit: limitNumber,
        hasNextPage:
          pageNumber <
          Math.ceil(totalRecords / limitNumber),
        hasPrevPage: pageNumber > 1
      }
    });

  } catch (err) {
    console.error(
      "Error fetching fitness enquiries:",
      err
    );

    res.status(500).json({
      message:
        "Server error while fetching enquiries",
      error: err.message
    });
  }
};


/**
 * @desc    Get single fitness enquiry by ID
 * @route   GET /api/fitness/enquiry/:id
 * @access  Private
 */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await FitnessEnquiry.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    })
      .populate('interestedActivity', 'name activityName')
      .populate('responsibleStaff', 'fullName name');

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    const formattedEnquiry = {
      ...enquiry.toObject(),
      interestedActivity:
        typeof enquiry.interestedActivity === 'object' && enquiry.interestedActivity !== null
          ? enquiry.interestedActivity.name || enquiry.interestedActivity.activityName || '-'
          : enquiry.interestedActivity || '-',
      responsibleStaff:
        typeof enquiry.responsibleStaff === 'object' && enquiry.responsibleStaff !== null
          ? enquiry.responsibleStaff.fullName || enquiry.responsibleStaff.name || '-'
          : enquiry.responsibleStaff || '-',
    };

    res.json(formattedEnquiry);
  } catch (err) {
    console.error('Error fetching fitness enquiry:', err);
    res.status(500).json({
      message: 'Server error while fetching enquiry',
      error: err.message
    });
  }
};

/**
 * @desc    Create new fitness enquiry
 * @route   POST /api/fitness/enquiry
 * @access  Private
 */
exports.createEnquiry = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      mobile,
      interestedActivity,
      responsibleStaff,
      source,
      enquiryDate,
      notes
    } = req.body;

    if (!fullName || !mobile || !gender) {
      return res.status(400).json({
        message: 'Full name, mobile, and gender are required'
      });
    }

    const count = await FitnessEnquiry.countDocuments({
      organizationId: req.organizationId
    });

    const enquiryIdNum = (count + 1).toString().padStart(4, '0');
    const enquiryId = `ENQ-CLUB-${enquiryIdNum}`;

    let activityValue = null;
    let staffValue = null;

    if (
      interestedActivity &&
      mongoose.Types.ObjectId.isValid(interestedActivity)
    ) {
      activityValue = interestedActivity;
    }

    if (
      responsibleStaff &&
      mongoose.Types.ObjectId.isValid(responsibleStaff)
    ) {
      staffValue = responsibleStaff;
    }

    const enquiry = new FitnessEnquiry({
      enquiryId,
      fullName: fullName.trim(),
      age: age !== undefined && age !== '' ? Number(age) : undefined,
      gender,
      mobile: mobile.toString().trim(),
      interestedActivity: activityValue,
      responsibleStaff: staffValue,
      source: source || 'Walk-in',
      enquiryDate: enquiryDate || Date.now(),
      notes: notes || '',
      organizationId: req.organizationId
    });

    await enquiry.save();

    res.status(201).json({
      ...enquiry.toObject(),
      interestedActivity: '-',
      responsibleStaff: '-'
    });
  } catch (err) {
    console.error('Error creating fitness enquiry:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Enquiry ID already exists. Please try again.'
      });
    }
    res.status(500).json({
      message: 'Server error while creating enquiry',
      error: err.message
    });
  }
};

/**
 * @desc    Update fitness enquiry
 * @route   PUT /api/fitness/enquiry/:id
 * @access  Private
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
    console.error('Error updating fitness enquiry:', err);
    res.status(500).json({
      message: 'Server error while updating enquiry',
      error: err.message
    });
  }
};

/**
 * @desc    Delete fitness enquiry
 * @route   DELETE /api/fitness/enquiry/:id
 * @access  Private
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
    console.error('Error deleting fitness enquiry:', err);
    res.status(500).json({
      message: 'Server error while deleting enquiry',
      error: err.message
    });
  }
};