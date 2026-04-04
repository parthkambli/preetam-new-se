const mongoose = require('mongoose');
const FitnessSchedule = require('../models/FitnessSchedule');
const FitnessActivity = require('../models/FitnessActivity');

// ➕ Create schedule
exports.createSchedule = async (req, res) => {
  try {
    const {
      activityId,
      scheduleDate,
      startTime,
      endTime,
      place,
      instructor
    } = req.body;

    if (
      !activityId ||
      !scheduleDate ||
      !startTime ||
      !endTime ||
      !place ||
      !instructor
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
    }

    // 🔥 Check activity exists
    const activity = await FitnessActivity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Selected activity not found'
      });
    }

    const schedule = await FitnessSchedule.create({
      activityId,
      scheduleDate,
      startTime,
      endTime,
      place,
      instructor
    });

    return res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });

  } catch (error) {
    console.error('createSchedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
};

// 📄 Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await FitnessSchedule.find()
      .populate('activityId', 'name')
      .sort({ scheduleDate: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });

  } catch (error) {
    console.error('getSchedules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
};

// 🔍 Get schedule by id
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID'
      });
    }

    const schedule = await FitnessSchedule.findById(id)
      .populate('activityId', 'name');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('getScheduleById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule',
      error: error.message
    });
  }
};

// ✏️ Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      activityId,
      scheduleDate,
      startTime,
      endTime,
      place,
      instructor
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID'
      });
    }

    if (
      !activityId ||
      !scheduleDate ||
      !startTime ||
      !endTime ||
      !place ||
      !instructor
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
    }

    const activity = await FitnessActivity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Selected activity not found'
      });
    }

    const updatedSchedule = await FitnessSchedule.findByIdAndUpdate(
      id,
      {
        activityId,
        scheduleDate,
        startTime,
        endTime,
        place,
        instructor,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('activityId', 'name');

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('updateSchedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
};

// ❌ Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID'
      });
    }

    const deletedSchedule = await FitnessSchedule.findByIdAndDelete(id);

    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('deleteSchedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
};