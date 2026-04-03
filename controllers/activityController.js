// const Activity = require('../models/Activity');

// // ─────────────────────────────────────────────────────────────────────────────
// // Common error handler (same as Staff controller)
// const handleError = (res, err, customMessage = 'Server error') => {
//   console.error(err);

//   if (err.name === 'ValidationError') {
//     const errors = Object.values(err.errors).map(e => e.message);
//     return res.status(400).json({ message: 'Validation failed', errors });
//   }

//   if (err.code === 11000) {
//     return res.status(409).json({ message: 'Activity name already exists' });
//   }

//   if (err.name === 'CastError') {
//     return res.status(400).json({ message: 'Invalid ID format' });
//   }

//   res.status(500).json({
//     message: customMessage,
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// };

// // Get all master activities
// exports.getAllActivities = async (req, res) => {
//   try {
//     const activities = await Activity.find({ organizationId: req.organizationId })
//       .sort({ name: 1 })
//       .lean();

//     res.json({
//       success: true,
//       count: activities.length,
//       data: activities
//     });
//   } catch (err) {
//     handleError(res, err, 'Failed to fetch activities');
//   }
// };

// // Create master activity
// exports.createActivity = async (req, res) => {
//   try {
//     const { name } = req.body;
//     if (!name?.trim()) {
//       return res.status(400).json({ success: false, message: 'Activity name is required' });
//     }

//     const activity = new Activity({
//       name: name.trim(),
//       organizationId: req.organizationId
//     });

//     await activity.save();

//     res.status(201).json({
//       success: true,
//       message: 'Activity created successfully',
//       data: activity
//     });
//   } catch (err) {
//     handleError(res, err, 'Failed to create activity');
//   }
// };

// // Update master activity
// exports.updateActivity = async (req, res) => {
//   try {
//     const activity = await Activity.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     activity.name = req.body.name?.trim() || activity.name;
//     await activity.save();

//     res.json({
//       success: true,
//       message: 'Activity updated successfully',
//       data: activity
//     });
//   } catch (err) {
//     handleError(res, err, 'Failed to update activity');
//   }
// };

// // Delete master activity
// exports.deleteActivity = async (req, res) => {
//   try {
//     const activity = await Activity.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     res.json({
//       success: true,
//       message: 'Activity deleted successfully'
//     });
//   } catch (err) {
//     handleError(res, err, 'Failed to delete activity');
//   }
// };






// controllers/activityController.js
const Activity = require('../models/Activity');
const ScheduledActivity = require('../models/ScheduledActivity'); // adjust path if different
 
// ─────────────────────────────────────────────────────────────────────────────
// Common error handler
const handleError = (res, err, customMessage = 'Server error') => {
  console.error('[ActivityController Error]', err);
 
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors
    });
  }
 
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    let friendlyMessage = 'This value already exists.';
    if (field === 'name') {
      friendlyMessage = 'An activity with this name already exists. Please use a different name.';
    }
    return res.status(409).json({
      success: false,
      message: friendlyMessage,
      field
    });
  }
 
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format. Please check the request.'
    });
  }
 
  res.status(500).json({
    success: false,
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
 
// ─────────────────────────────────────────────────────────────────────────────
// Server-side validation for master activity
const validateActivityData = (data) => {
  const errors = [];
 
  if (!data.name?.trim()) {
    errors.push('Activity name is required.');
  } else if (data.name.trim().length < 2) {
    errors.push('Activity name must be at least 2 characters.');
  } else if (data.name.trim().length > 100) {
    errors.push('Activity name must not exceed 100 characters.');
  }
 
  return errors;
};
 
// ─────────────────────────────────────────────────────────────────────────────
// Server-side validation for scheduled activity
const validateScheduledData = (data) => {
  const errors = [];
 
  if (!data.activity) {
    errors.push('Activity selection is required.');
  }
 
  if (!data.date) {
    errors.push('Date is required.');
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) {
      errors.push('Invalid date format.');
    }
  }
 
  if (!data.time?.trim()) {
    errors.push('Time is required.');
  } else if (!/^\d{2}:\d{2}$/.test(data.time.trim())) {
    errors.push('Time must be in HH:MM format.');
  }
 
  if (!data.place?.trim()) {
    errors.push('Place is required.');
  } else if (data.place.trim().length > 200) {
    errors.push('Place name must not exceed 200 characters.');
  }
 
  if (!data.instructorName?.trim()) {
    errors.push('Instructor name is required.');
  } else if (data.instructorName.trim().length < 2) {
    errors.push('Instructor name must be at least 2 characters.');
  } else if (data.instructorName.trim().length > 100) {
    errors.push('Instructor name must not exceed 100 characters.');
  }
 
  return errors;
};
 
// ─────────────────────────────────────────────────────────────────────────────
// MASTER ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────
 
// Get all master activities
exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ organizationId: req.organizationId })
      .sort({ name: 1 })
      .lean();
 
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch activities. Please try again.');
  }
};
 
// Create master activity
exports.createActivity = async (req, res) => {
  try {
    const validationErrors = validateActivityData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }
 
    const activity = new Activity({
      name: req.body.name.trim(),
      organizationId: req.organizationId
    });
 
    await activity.save();
 
    res.status(201).json({
      success: true,
      message: 'Activity created successfully.',
      data: activity
    });
  } catch (err) {
    handleError(res, err, 'Failed to create activity. Please try again.');
  }
};
 
// Update master activity
exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });
 
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found. It may have been deleted.'
      });
    }
 
    if (req.body.name !== undefined) {
      const validationErrors = validateActivityData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: validationErrors
        });
      }
      activity.name = req.body.name.trim();
    }
 
    await activity.save();
 
    res.json({
      success: true,
      message: 'Activity updated successfully.',
      data: activity
    });
  } catch (err) {
    handleError(res, err, 'Failed to update activity. Please try again.');
  }
};
 
// Delete master activity
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });
 
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found. It may have already been deleted.'
      });
    }
 
    res.json({
      success: true,
      message: 'Activity deleted successfully.'
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete activity. Please try again.');
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────
 
// Get all scheduled activities
exports.getAllScheduled = async (req, res) => {
  try {
    const scheduled = await ScheduledActivity.find({ organizationId: req.organizationId })
      .populate('activity', 'name')   // get the activity name
      .sort({ date: -1 })
      .lean();
 
    res.json({
      success: true,
      count: scheduled.length,
      data: scheduled
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch scheduled activities. Please try again.');
  }
};
 
// Create scheduled activity
exports.createScheduled = async (req, res) => {
  try {
    const validationErrors = validateScheduledData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }
 
    // Verify the referenced activity actually exists
    const activityExists = await Activity.findOne({
      _id: req.body.activity,
      organizationId: req.organizationId
    });
 
    if (!activityExists) {
      return res.status(404).json({
        success: false,
        message: 'The selected activity does not exist. Please refresh and try again.'
      });
    }
 
    const scheduled = new ScheduledActivity({
      activity: req.body.activity,
      date: req.body.date,
      time: req.body.time.trim(),
      place: req.body.place.trim(),
      instructorName: req.body.instructorName.trim(),
      organizationId: req.organizationId
    });
 
    await scheduled.save();
 
    res.status(201).json({
      success: true,
      message: 'Activity scheduled successfully.',
      data: scheduled
    });
  } catch (err) {
    handleError(res, err, 'Failed to schedule activity. Please try again.');
  }
};
 
// Update scheduled activity
exports.updateScheduled = async (req, res) => {
  try {
    const scheduled = await ScheduledActivity.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });
 
    if (!scheduled) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled activity not found. It may have been deleted.'
      });
    }
 
    // Validate only the fields being updated
    const dataToValidate = {
      activity: req.body.activity ?? scheduled.activity,
      date:     req.body.date     ?? scheduled.date,
      time:     req.body.time     ?? scheduled.time,
      place:    req.body.place    ?? scheduled.place,
      instructorName: req.body.instructorName ?? scheduled.instructorName,
    };
 
    const validationErrors = validateScheduledData(dataToValidate);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }
 
    if (req.body.date)           scheduled.date           = req.body.date;
    if (req.body.time)           scheduled.time           = req.body.time.trim();
    if (req.body.place)          scheduled.place          = req.body.place.trim();
    if (req.body.instructorName) scheduled.instructorName = req.body.instructorName.trim();
 
    await scheduled.save();
 
    res.json({
      success: true,
      message: 'Scheduled activity updated successfully.',
      data: scheduled
    });
  } catch (err) {
    handleError(res, err, 'Failed to update scheduled activity. Please try again.');
  }
};
 
// Delete scheduled activity
exports.deleteScheduled = async (req, res) => {
  try {
    const scheduled = await ScheduledActivity.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });
 
    if (!scheduled) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled activity not found. It may have already been deleted.'
      });
    }
 
    res.json({
      success: true,
      message: 'Scheduled activity deleted successfully.'
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete scheduled activity. Please try again.');
  }
};