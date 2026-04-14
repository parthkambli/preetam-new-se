const mongoose = require('mongoose');
const FitnessSchedule = require('../models/FitnessSchedule');
const FitnessActivity = require('../models/FitnessActivity');

exports.createSchedule = async (req, res) => {
  try {
    const activityId = req.body.activityId || req.body.activity;
    const scheduleDate = req.body.scheduleDate || req.body.date;
    const startTime = req.body.startTime || req.body.time;
    const place = req.body.place;
    const instructor = req.body.instructor;

    if (!activityId || !scheduleDate || !startTime || !place || !instructor) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const schedule = await FitnessSchedule.create({
      activityId,
      scheduleDate,
      startTime,
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

exports.getSchedules = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const schedules = await FitnessSchedule.find({
      scheduleDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('activityId');

    res.json(schedules);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID'
      });
    }

    const schedule = await FitnessSchedule.findById(id).populate('activityId', 'name');

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

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const activityId = req.body.activityId || req.body.activity;
    const scheduleDate = req.body.scheduleDate || req.body.date;
    const startTime = req.body.startTime || req.body.time;
    const place = req.body.place;
    const instructor = req.body.instructor || req.body.instructorName;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule ID'
      });
    }

    if (!activityId || !scheduleDate || !startTime || !place || !instructor) {
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