const Followup = require('../models/Followup');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const FitnessEnquiry = require('../models/FitnessEnquiry');

/**
 * @desc    Get all followups with filtering
 * @route   GET /api/followups
 * @access  Private (Requires JWT token)
 * @query   { status, date, search, enquiryType }
 * @returns Array of followups
 */
// exports.getAllFollowups = async (req, res) => {
//   try {
//     const { status, date, search, enquiryType } = req.query;

//     let query = { organizationId: req.organizationId };

//     if (status) {
//       query.newStatus = status;
//     }
//     if (date) {
//       query.followupDate = { $gte: new Date(date), $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };
//     }
//     if (search) {
//       query.$or = [
//         { personName: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } }
//       ];
//     }
//     if (enquiryType) {
//       query.enquiryType = enquiryType;
//     }

//     const followups = await Followup.find(query).sort({ createdAt: -1 });
//     res.json(followups);
//   } catch (err) {
//     console.error('Error fetching followups:', err.message);
//     res.status(500).json({ message: 'Server error while fetching followups' });
//   }
// };


exports.getAllFollowups = async (req, res) => {
  try {
    const {
      status,
      date,
      search,
      enquiryType,
      page = 1,
      limit = 10
    } = req.query;

    // pagination values
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let query = {
      organizationId: req.organizationId
    };

    // status filter
    if (status) {
      query.newStatus = status;
    }

    // date filter
    if (date) {
      const selectedDate = new Date(date);

      query.followupDate = {
        $gte: selectedDate,
        $lt: new Date(
          new Date(selectedDate).setDate(
            selectedDate.getDate() + 1
          )
        )
      };
    }

    // search filter
    if (search) {
      query.$or = [
        {
          personName: {
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

    // enquiry type filter
    if (enquiryType) {
      query.enquiryType = enquiryType;
    }

    // total count BEFORE skip + limit
    const totalRecords = await Followup.countDocuments(query);

    // paginated data
    const followups = await Followup.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.json({
      success: true,
      data: followups,
      pagination: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
        limit: limitNumber,
        hasNextPage:
          pageNumber < Math.ceil(totalRecords / limitNumber),
        hasPrevPage: pageNumber > 1
      }
    });

  } catch (err) {
    console.error(
      "Error fetching followups:",
      err.message
    );

    res.status(500).json({
      message:
        "Server error while fetching followups"
    });
  }
};


/**
 * @desc    Get upcoming followups (nextVisit >= today)
 * @route   GET /api/followups/upcoming
 * @access  Private (Requires JWT token)
 * @returns Array of upcoming followups (limited to 50)
 */
exports.getUpcomingFollowups = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followups = await Followup.find({
      organizationId: req.organizationId,
      nextVisit: { $gte: today }
    }).sort({ nextVisit: 1 }).limit(50);

    res.json(followups);
  } catch (err) {
    console.error('Error fetching upcoming followups:', err.message);
    res.status(500).json({ message: 'Server error while fetching upcoming followups' });
  }
};

/**
 * @desc    Create new followup (also updates related enquiry status)
 * @route   POST /api/followups
 * @access  Private (Requires JWT token)
 * @body    { enquiryType, enquiryId, personName, mobile, activity, newStatus, remark, nextVisit }
 * @returns Created followup object
 */
exports.createFollowup = async (req, res) => {
  try {
    const { enquiryType, enquiryId, personName, mobile, activity, newStatus, remark, nextVisit } = req.body;

    if (!enquiryType || !enquiryId || !personName || !mobile || !newStatus || !remark) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get previous status from enquiry
    let previousStatus = null;
    if (enquiryType === 'school') {
      const enquiry = await SchoolEnquiry.findById(enquiryId);
      if (enquiry) {
        previousStatus = enquiry.status;
        // Update enquiry with new status, remark and nextVisit
        enquiry.status = newStatus;
        if (remark) enquiry.remark = remark;
        if (nextVisit) enquiry.nextVisit = nextVisit;
        await enquiry.save();
      }
    } else if (enquiryType === 'fitness') {
      const enquiry = await FitnessEnquiry.findById(enquiryId);
      if (enquiry) {
        previousStatus = enquiry.status;
        // Update enquiry with new status, remark and nextVisit
const fixedStatus = newStatus?.replace('-', ' ');

console.log("Incoming status:", newStatus);
console.log("Fixed status:", fixedStatus);

enquiry.status = fixedStatus;        if (remark) enquiry.remark = remark;
        if (nextVisit) enquiry.nextVisit = nextVisit;
        await enquiry.save();
      }
    }

    const followup = new Followup({
      enquiryType,
      enquiryId,
      personName,
      mobile,
      activity,
      previousStatus,
      newStatus,
      remark,
      nextVisit,
      organizationId: req.organizationId,
      createdBy: req.admin.userId
    });

    await followup.save();
    res.status(201).json(followup);
  } catch (err) {
    console.error('Error creating followup:', err.message);
    res.status(500).json({ message: 'Server error while creating followup' });
  }
};

/**
 * @desc    Delete followup by ID
 * @route   DELETE /api/followups/:id
 * @access  Private (Requires JWT token)
 * @returns Success message
 */
exports.deleteFollowup = async (req, res) => {
  try {
    const followup = await Followup.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!followup) {
      return res.status(404).json({ message: 'Followup not found' });
    }

    res.json({ message: 'Followup deleted successfully' });
  } catch (err) {
    console.error('Error deleting followup:', err.message);
    res.status(500).json({ message: 'Server error while deleting followup' });
  }
};
