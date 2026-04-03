const StaffAttendance = require('../models/StaffAttendance');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: calculate "9h 09m" from "09:02 AM" and "06:11 PM"
// ─────────────────────────────────────────────────────────────────────────────
function calcWorkingHours(inTime, outTime) {
  if (!inTime || !outTime) return '0h';

  const toMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, mins] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const diff = toMinutes(outTime) - toMinutes(inTime);
  if (diff <= 0) return '0h';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get all attendance records with filters
 * @route   GET /api/staff/attendance
 * @access  Private
 * @query   staffName, date (YYYY-MM-DD), status
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, status, staffId } = req.query;

    let query = { organizationId: req.organizationId };

    if (staffId) query.staff = staffId;
    if (status)  query.status = status;

    // Filter by exact calendar day
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const records = await StaffAttendance.find(query)
      .populate('staff', 'fullName employeeId photo')  // bring in name & ID for the table
      .sort({ date: -1, createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error('Error fetching attendance:', err.message);
    res.status(500).json({ message: 'Server error while fetching attendance' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get single attendance record by ID
 * @route   GET /api/staff/attendance/:id
 * @access  Private
 */
exports.getAttendanceById = async (req, res) => {
  try {
    const record = await StaffAttendance.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    }).populate('staff', 'fullName employeeId photo');

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(record);
  } catch (err) {
    console.error('Error fetching attendance:', err.message);
    res.status(500).json({ message: 'Server error while fetching attendance' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create an attendance record
 * @route   POST /api/staff/attendance
 * @access  Private
 * @body    { staff (ObjectId), date, inTime, outTime, status, remarks }
 */
exports.createAttendance = async (req, res) => {
  try {
    const { staff, date, inTime, outTime, status, remarks } = req.body;

    if (!staff || !date) {
      return res.status(400).json({ message: 'Staff ID and date are required' });
    }

    // Auto-calculate working hours if both times are provided
    const workingHours = calcWorkingHours(inTime, outTime);

    const record = new StaffAttendance({
      staff,
      date:         new Date(date),
      inTime,
      outTime,
      workingHours,
      status:       status || 'Absent',
      remarks:      remarks || '',
      organizationId: req.organizationId
    });

    await record.save();
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating attendance:', err.message);
    // Unique index violation = record already exists for that staff+date
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Attendance for this staff member on this date already exists'
      });
    }
    res.status(500).json({ message: 'Server error while creating attendance' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Update an attendance record (e.g. add out-time later in the day)
 * @route   PUT /api/staff/attendance/:id
 * @access  Private
 */
exports.updateAttendance = async (req, res) => {
  try {
    const record = await StaffAttendance.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.organizationId;
    delete updates.staff;   // staff cannot be changed after creation
    delete updates.date;    // date cannot be changed after creation

    Object.assign(record, updates);

    // Recalculate working hours whenever in/out time changes
    record.workingHours = calcWorkingHours(record.inTime, record.outTime);

    await record.save();
    res.json(record);
  } catch (err) {
    console.error('Error updating attendance:', err.message);
    res.status(500).json({ message: 'Server error while updating attendance' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Delete an attendance record
 * @route   DELETE /api/staff/attendance/:id
 * @access  Private
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const record = await StaffAttendance.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error('Error deleting attendance:', err.message);
    res.status(500).json({ message: 'Server error while deleting attendance' });
  }
};