const TimeTable = require('../models/schoolPeriod');

const handleError = (res, err, customMessage = 'Server error') => {
  console.error('[TimeTableController Error]', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry.',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format.',
    });
  }

  res.status(500).json({
    success: false,
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

const timeToMinutes = (timeStr) => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const timesOverlap = (startA, endA, startB, endB) => {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return null;
  }
  return aStart < bEnd && bStart < aEnd;
};

const validatePeriodData = (data) => {
  const errors = [];

  if (!data.name?.trim()) {
    errors.push('Period name is required.');
  }

  if (!data.startTime?.trim()) {
    errors.push('Start time is required.');
  }

  if (!data.endTime?.trim()) {
    errors.push('End time is required.');
  }

  if (data.startTime && data.endTime) {
    const s = timeToMinutes(data.startTime);
    const e = timeToMinutes(data.endTime);
    if (s === null) {
      errors.push('Invalid start time format.');
    }
    if (e === null) {
      errors.push('Invalid end time format.');
    }
    if (s !== null && e !== null && s >= e) {
      errors.push('End time must be after start time.');
    }
  }

  if (data.capacity === undefined || data.capacity === '' || data.capacity === null) {
    errors.push('Capacity is required.');
  } else {
    const cap = Number(data.capacity);
    if (isNaN(cap) || !Number.isInteger(cap) || cap < 1) {
      errors.push('Capacity must be a positive integer.');
    }
  }

  return errors;
};

const checkOverlap = async (organizationId, startTime, endTime, excludeId = null) => {
  const periods = await TimeTable.find({ organizationId }).lean();
  for (const period of periods) {
    if (excludeId && String(period._id) === String(excludeId)) continue;
    const overlap = timesOverlap(startTime, endTime, period.startTime, period.endTime);
    if (overlap === null) continue;
    if (overlap) {
      return `Time overlaps with "${period.name}" (${period.startTime} - ${period.endTime}).`;
    }
  }
  return null;
};

exports.getAllPeriods = async (req, res) => {
  try {
    const periods = await TimeTable.find({ organizationId: req.organizationId })
      .sort({ _id: 1 })
      .lean();

    res.json({
      success: true,
      count: periods.length,
      data: periods,
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch periods.');
  }
};

exports.createPeriod = async (req, res) => {
  try {
    const validationErrors = validatePeriodData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors,
      });
    }

    const overlapError = await checkOverlap(
      req.organizationId,
      req.body.startTime.trim(),
      req.body.endTime.trim()
    );
    if (overlapError) {
      return res.status(409).json({
        success: false,
        message: overlapError,
      });
    }

    const period = new TimeTable({
      name: req.body.name.trim(),
      startTime: req.body.startTime.trim(),
      endTime: req.body.endTime.trim(),
      capacity: Number(req.body.capacity),
      organizationId: req.organizationId,
    });

    await period.save();

    res.status(201).json({
      success: true,
      message: 'Period created successfully.',
      data: period,
    });
  } catch (err) {
    handleError(res, err, 'Failed to create period.');
  }
};

exports.updatePeriod = async (req, res) => {
  try {
    const period = await TimeTable.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period not found.',
      });
    }

    const dataToValidate = {
      name: req.body.name ?? period.name,
      startTime: req.body.startTime ?? period.startTime,
      endTime: req.body.endTime ?? period.endTime,
      capacity: req.body.capacity ?? period.capacity,
    };

    const validationErrors = validatePeriodData(dataToValidate);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors,
      });
    }

    const newStartTime = (req.body.startTime || period.startTime).trim();
    const newEndTime = (req.body.endTime || period.endTime).trim();

    const overlapError = await checkOverlap(
      req.organizationId,
      newStartTime,
      newEndTime,
      period._id
    );
    if (overlapError) {
      return res.status(409).json({
        success: false,
        message: overlapError,
      });
    }

    if (req.body.name !== undefined) period.name = req.body.name.trim();
    if (req.body.startTime !== undefined) period.startTime = req.body.startTime.trim();
    if (req.body.endTime !== undefined) period.endTime = req.body.endTime.trim();
    if (req.body.capacity !== undefined) period.capacity = Number(req.body.capacity);

    await period.save();

    res.json({
      success: true,
      message: 'Period updated successfully.',
      data: period,
    });
  } catch (err) {
    handleError(res, err, 'Failed to update period.');
  }
};

exports.deletePeriod = async (req, res) => {
  try {
    const period = await TimeTable.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period not found.',
      });
    }

    res.json({
      success: true,
      message: 'Period deleted successfully.',
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete period.');
  }
};
