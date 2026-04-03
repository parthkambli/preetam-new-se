// controllers/healthRecordController.js
const HealthRecord = require('../models/HealthRecord');
const path = require('path');

// Common error handler
const handleError = (res, err, customMessage = 'Server error') => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate record' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  res.status(500).json({
    message: customMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Get all health records
exports.getAllHealthRecords = async (req, res) => {
  try {
    const { name, date } = req.query;

    const query = { organizationId: req.organizationId };

    if (name) query.name = { $regex: name, $options: 'i' };
    if (date) query.date = new Date(date);

    const records = await HealthRecord.find(query)
      .sort({ date: -1, time: -1 })
      .lean();

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch health records');
  }
};

// Create / Update Health Record
exports.saveHealthRecord = async (req, res) => {
  try {
    const { name, date, time, doctor, diagnosis, medications, status } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    if (!time) return res.status(400).json({ success: false, message: 'Time is required' });
    if (!doctor?.trim()) return res.status(400).json({ success: false, message: 'Doctor/Clinic is required' });
    if (!status) return res.status(400).json({ success: false, message: 'Health status is required' });

    let reportFile = '';
    if (req.file) {
      reportFile = `/uploads/health/${req.file.filename}`;
    }

    const recordData = {
      name: name.trim(),
      date: new Date(date),
      time,
      doctor: doctor.trim(),
      diagnosis: diagnosis ? diagnosis.trim() : '',
      medications: medications ? medications.trim() : '',
      status,
      reportFile,
      organizationId: req.organizationId
    };

    // If we have an ID, it's update, else create
    if (req.params.id) {
      const record = await HealthRecord.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
      });

      if (!record) {
        return res.status(404).json({ success: false, message: 'Health record not found' });
      }

      Object.assign(record, recordData);
      await record.save();

      res.json({
        success: true,
        message: 'Health record updated successfully',
        data: record
      });
    } else {
      const record = new HealthRecord(recordData);
      await record.save();

      res.status(201).json({
        success: true,
        message: 'Health record created successfully',
        data: record
      });
    }
  } catch (err) {
    handleError(res, err, 'Failed to save health record');
  }
};

// Delete health record
exports.deleteHealthRecord = async (req, res) => {
  try {
    const record = await HealthRecord.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Health record not found' });
    }

    res.json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (err) {
    handleError(res, err, 'Failed to delete health record');
  }
};