// controllers/eventController.js
const Event = require('../models/Event');

const handleError = (res, err, customMessage = 'Server error') => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate event title' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  res.status(500).json({
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const { title, type, date } = req.query;

    const query = { organizationId: req.organizationId };

    if (title) query.title = { $regex: title, $options: 'i' };
    if (type) query.type = type;
    if (date) query.date = new Date(date);

    const events = await Event.find(query)
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch events');
  }
};

// Create new event with proper validation
exports.createEvent = async (req, res) => {
  try {
    const { title, type, date, startTime, endTime, location, description } = req.body;

    // Basic required field validation
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Event title is required' });
    if (!type) return res.status(400).json({ success: false, message: 'Event type is required' });
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    if (!startTime) return res.status(400).json({ success: false, message: 'Start time is required' });
    if (!endTime) return res.status(400).json({ success: false, message: 'End time is required' });
    if (!location?.trim()) return res.status(400).json({ success: false, message: 'Location is required' });

    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Custom business logic validation
    if (eventDate < today) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in the past' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const event = new Event({
      title: title.trim(),
      type,
      date: eventDate,
      startTime,
      endTime,
      location: location.trim(),
      description: description ? description.trim() : '',
      organizationId: req.organizationId
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (err) {
    handleError(res, err, 'Failed to create event');
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { title, type, date, startTime, endTime, location, description } = req.body;

    if (date) {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        return res.status(400).json({ success: false, message: 'Event date cannot be in the past' });
      }
    }

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    Object.assign(event, {
      title: title?.trim() || event.title,
      type: type || event.type,
      date: date ? new Date(date) : event.date,
      startTime: startTime || event.startTime,
      endTime: endTime || event.endTime,
      location: location?.trim() || event.location,
      description: description !== undefined ? description.trim() : event.description,
    });

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (err) {
    handleError(res, err, 'Failed to update event');
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete event');
  }
};