const ScheduledActivity = require('../models/ScheduledActivity');
const Activity = require('../models/Activity');

const handleError = (res, err, customMessage = 'Server error') => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  res.status(500).json({
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Get all scheduled activities (with populated activity name)
exports.getAllScheduled = async (req, res) => {
  try {
    const scheduled = await ScheduledActivity.find({ organizationId: req.organizationId })
      .populate('activity', 'name')
      .sort({ date: 1, time: 1 })
      .lean();

    res.json({
      success: true,
      count: scheduled.length,
      data: scheduled
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch scheduled activities');
  }
};

// Create scheduled activity
exports.createScheduled = async (req, res) => {
  try {
    const { activity, date, time, place, instructorName } = req.body;

    if (!activity || !date || !time || !place || !instructorName) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const scheduled = new ScheduledActivity({
      activity,
      date,
      time,
      place,
      instructorName,
      organizationId: req.organizationId
    });

    await scheduled.save();

    const populated = await ScheduledActivity.findById(scheduled._id)
      .populate('activity', 'name')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Activity scheduled successfully',
      data: populated
    });
  } catch (err) {
    handleError(res, err, 'Failed to schedule activity');
  }
};

// Get single scheduled activity
exports.getScheduledById = async (req, res) => {
  try {
    const scheduled = await ScheduledActivity.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    }).populate('activity', 'name').lean();

    if (!scheduled) {
      return res.status(404).json({ success: false, message: 'Scheduled activity not found' });
    }

    res.json({ success: true, data: scheduled });
  } catch (err) {
    handleError(res, err, 'Failed to fetch scheduled activity');
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
      return res.status(404).json({ success: false, message: 'Scheduled activity not found' });
    }

    Object.assign(scheduled, req.body);
    await scheduled.save();

    const updated = await ScheduledActivity.findById(scheduled._id)
      .populate('activity', 'name')
      .lean();

    res.json({
      success: true,
      message: 'Scheduled activity updated successfully',
      data: updated
    });
  } catch (err) {
    handleError(res, err, 'Failed to update scheduled activity');
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
      return res.status(404).json({ success: false, message: 'Scheduled activity not found' });
    }

    res.json({
      success: true,
      message: 'Scheduled activity deleted successfully'
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete scheduled activity');
  }
};