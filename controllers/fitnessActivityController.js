

























const FitnessActivity = require('../models/FitnessActivity');
const FitnessBooking  = require('../models/FitnessBooking');
const FeeAllotment    = require('../models/FitnessFeeAllotment');
const FeePayment      = require('../models/FitnessFeePayment');
const mongoose        = require('mongoose');

/* =========================
   HELPER: CHECK OVERLAP
========================= */
function isOverlapping(slot1, slot2) {
  return (
    slot1.startTime < slot2.endTime &&
    slot2.startTime < slot1.endTime
  );
}

/* =========================
   HELPER: Generate dates between start and end (inclusive)
========================= */
function getDatesInRange(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/* =========================
   HELPER: PAGINATION LIMIT
========================= */
function getValidatedPageAndLimit(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  let limit = parseInt(query.limit, 10) || 5;
  if (limit < 5) limit = 5;
  if (limit > 100) limit = 100;

  return { page, limit };
}

/* =========================
   HELPER: Generate recurring bookings for a member
========================= */
exports.generateRecurringBookings = async (memberId, activityFeeIndex, activityId, slotId, startDate, endDate, customerName, phone) => {
  const dates = getDatesInRange(startDate, endDate);
  const bookings = [];

  for (const date of dates) {
    bookings.push({
      activityId,
      slotId,
      date,
      memberId: memberId || null,
      activityFeeIndex,
      isRecurring: true,
      isException: false,
      customerName: customerName || "Walk-in",
      phone
    });
  }

  if (bookings.length > 0) {
    await FitnessBooking.insertMany(bookings);
  }

  return bookings.length;
};

/* =========================
   ➕ CREATE ACTIVITY
========================= */
exports.createActivity = async (req, res) => {
  try {
    const { name, capacity, slots } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'Name is required' });

    if (!capacity || Number(capacity) <= 0)
      return res.status(400).json({ success: false, message: 'Valid capacity is required' });

    if (!Array.isArray(slots) || slots.length === 0)
      return res.status(400).json({ success: false, message: 'At least one slot is required' });

    for (let slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
      }
      if (!slot.staffId) {
        return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
      }
    }

    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlapping(slots[i], slots[j])) {
          return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
        }
      }
    }

    const existing = await FitnessActivity.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Activity with this name already exists' });

    const activity = await FitnessActivity.create({
      name: name.trim(),
      capacity: Number(capacity),
      slots
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });

  } catch (err) {
    console.error("Create Activity Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   📄 GET ALL ACTIVITIES
   PAGINATION + FILTER
========================= */
exports.getActivities = async (req, res) => {
  try {
    const { page, limit } = getValidatedPageAndLimit(req.query);
    const { search, name, minCapacity, maxCapacity, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const filter = {};

    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (name?.trim()) {
      filter.name = { $regex: name.trim(), $options: 'i' };
    }

    if (minCapacity || maxCapacity) {
      filter.capacity = {};
      if (minCapacity && !isNaN(Number(minCapacity))) {
        filter.capacity.$gte = Number(minCapacity);
      }
      if (maxCapacity && !isNaN(Number(maxCapacity))) {
        filter.capacity.$lte = Number(maxCapacity);
      }
      if (Object.keys(filter.capacity).length === 0) {
        delete filter.capacity;
      }
    }

    const allowedSortFields = ['name', 'capacity', 'createdAt', 'updatedAt'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const finalSortOrder = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      FitnessActivity.find(filter)
        .sort({ [finalSortBy]: finalSortOrder })
        .skip(skip)
        .limit(limit),
      FitnessActivity.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: activities.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      data: activities
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   🔍 GET ACTIVITY BY ID
========================= */
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid ID' });

    const activity = await FitnessActivity.findById(id);
    if (!activity)
      return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   ✏️ UPDATE ACTIVITY
========================= */
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, slots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Activity ID' });
    }

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!capacity || Number(capacity) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid capacity is required' });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one slot is required' });
    }

    // Validate slots
    for (let slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time and end time are required for all slots'
        });
      }
      if (!slot.staffId) {
        return res.status(400).json({
          success: false,
          message: 'Instructor (staff) is required for all slots'
        });
      }
    }

    // Overlap check
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (
          slots[i].startTime < slots[j].endTime &&
          slots[j].startTime < slots[i].endTime
        ) {
          return res.status(400).json({
            success: false,
            message: 'Slots cannot overlap'
          });
        }
      }
    }

    const existingActivity = await FitnessActivity.findById(id);
    if (!existingActivity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // ✅ PRESERVE SLOT IDs
    const updatedSlots = slots.map((newSlot) => {
      if (newSlot._id) return newSlot;

      const matched = existingActivity.slots.find(
        (oldSlot) =>
          oldSlot.startTime === newSlot.startTime &&
          oldSlot.endTime === newSlot.endTime
      );

      return matched
        ? { ...newSlot, _id: matched._id }
        : newSlot;
    });

    existingActivity.name = name.trim();
    existingActivity.capacity = Number(capacity);
    existingActivity.slots = updatedSlots;
    existingActivity.updatedAt = Date.now();

    await existingActivity.save();

    return res.json({
      success: true,
      message: 'Activity updated successfully',
      data: existingActivity
    });

  } catch (err) {
    console.error("Update Activity Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// exports.updateActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, capacity, slots } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id))
//       return res.status(400).json({ success: false, message: 'Invalid Activity ID' });

//     if (!name?.trim())
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0)
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0)
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//     }

//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
//         }
//       }
//     }

//     const existing = await FitnessActivity.findOne({
//       _id: { $ne: id },
//       name: name.trim()
//     });
//     if (existing)
//       return res.status(409).json({ success: false, message: 'Duplicate activity name' });

//     const updated = await FitnessActivity.findByIdAndUpdate(
//       id,
//       {
//         name: name.trim(),
//         capacity: Number(capacity),
//         slots,
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     // if (!updated)
//     //   return res.status(404).json({ success: false, message: 'Activity not found' });

//     // res.json({
//     //   success: true,
//     //   message: 'Activity updated successfully',
//     //   data: updated
//     // });

//   } catch (err) {
//     console.error("Update Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

/* =========================
   ❌ DELETE ACTIVITY
========================= */
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FitnessActivity.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   📊 GET AVAILABILITY
========================= */
exports.getAvailability = async (req, res) => {
  try {
    const { activityId, startDate, endDate, date } = req.query;

    if (!activityId) {
      return res.status(400).json({ success: false, message: 'activityId is required' });
    }

    const activity = await FitnessActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    let dates = [];

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      dates = [date];
    } else if (startDate && endDate) {
      dates = getDatesInRange(startDate, endDate);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either "date" or both "startDate" and "endDate" are required'
      });
    }

    if (dates.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const result = [];

    for (let slot of activity.slots) {
      let fullyAvailableDays = 0;

      let bookedCountForSingleDate = 0; 

      for (let d of dates) {
        const count = await FitnessBooking.countDocuments({ slotId: slot._id, date: d });

        if (dates.length === 1) {
      bookedCountForSingleDate = count;
    }

        const isAvailable = count < activity.capacity;
        if (isAvailable) fullyAvailableDays++;
      }

      const percentage = Math.round((fullyAvailableDays / dates.length) * 100);

      result.push({
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: activity.capacity,
        totalDays: dates.length,
        fullyAvailableDays,
        availabilityPercentage: percentage,

            booked: bookedCountForSingleDate,

    totalDays: dates.length,
    fullyAvailableDays,
    availabilityPercentage: percentage,
      });
    }

  

    res.json({
      success: true,
      data: result,
      range: { startDate: dates[0], endDate: dates[dates.length - 1], totalDays: dates.length }
    });

  } catch (err) {
    console.error("getAvailability error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   🎯 BOOK SLOT - FIXED FOR STRING DATE
========================= */
exports.bookSlot = async (req, res) => {
  try {
    const {
      activityId,
      slotId,
      date,
      customerName,
      phone = "0000000000",
      memberId,
      feeTypeId,
      plan = "Daily",
      amount,
      paymentStatus = "Paid",
      paymentMode = "Cash",
      paymentDate
    } = req.body;

    if (!activityId || !slotId || !date || !customerName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'activityId, slotId, date, and customerName are required'
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid fee amount is required'
      });
    }

    const organizationId = req.organizationId || req.headers['x-organization-id'];

    if (!organizationId) {
      console.error("Missing organizationId - Headers:", req.headers);
      return res.status(400).json({
        success: false,
        message: 'Organization ID is missing from request'
      });
    }

    const activity = await FitnessActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const slot = activity.slots.id(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Capacity check - Using string date
    const existingCount = await FitnessBooking.countDocuments({
      slotId,
      date
    });
    if (existingCount >= activity.capacity) {
      return res.status(400).json({ success: false, message: 'Slot is full' });
    }

    if (memberId) {
      const existingBooking = await FitnessBooking.findOne({
        memberId,
        activityId,
        date
      });

      if (existingBooking) {
        existingBooking.slotId = slotId;
        await existingBooking.save();
        return res.json({
          success: true,
          message: 'Member slot updated successfully (no extra charge)',
          booking: existingBooking
        });
      }
    }

    const booking = await FitnessBooking.create({
      activityId,
      slotId,
      date,                                 // Stored as String YYYY-MM-DD
      memberId: memberId || null,
      staffId: req.body.staffId || null,
      customerName: customerName.trim(),
      phone,
      isRecurring: false,
      isException: true,
      activityFeeIndex: null
    });

    const numAmount = Number(amount);
    const finalPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

    const allotment = await FeeAllotment.create({
      memberId: memberId || null,
      feeTypeId: feeTypeId || null,
      responsibleStaff: req.body.staffId || null,
      description: `Ad-hoc Booking - ${activity.name} (${plan})`,
      feePlan: plan,
      amount: numAmount,
      dueDate: new Date(date),
      status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
      organizationId,
    });

    if (paymentStatus === 'Paid') {
      await FeePayment.create({
        memberId: memberId || null,
        allotmentId: allotment._id,
        amount: numAmount,
        paymentMode,
        paymentDate: finalPaymentDate,
        description: `Booking: ${activity.name} - ${plan}`,
        customerName: customerName,
        organizationId,
      });

      allotment.status = 'Paid';
      await allotment.save();
    }

    res.json({
      success: true,
      message: memberId ? 'Extra session booked' : 'Walk-in booking created',
      booking,
      allotmentId: allotment._id
    });

  } catch (err) {
    console.error("Book Slot Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to book slot'
    });
  }
};

/* =========================
   📋 GET ALL BOOKINGS
   PAGINATION + FILTER
========================= */
exports.getBookings = async (req, res) => {
  try {
    const { page, limit } = getValidatedPageAndLimit(req.query);
    const { search, activityName, customerName, date, fromDate, toDate } = req.query;

    const bookingFilter = {};

    if (date) {
      const selectedDate = new Date(date);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      bookingFilter.date = {
        $gte: selectedDate,
        $lt: nextDate
      };
    } else if (fromDate || toDate) {
      bookingFilter.date = {};
      if (fromDate) {
        bookingFilter.date.$gte = new Date(fromDate);
      }
      if (toDate) {
        const nextToDate = new Date(toDate);
        nextToDate.setDate(nextToDate.getDate() + 1);
        bookingFilter.date.$lt = nextToDate;
      }
      if (Object.keys(bookingFilter.date).length === 0) {
        delete bookingFilter.date;
      }
    }

    if (customerName?.trim()) {
      bookingFilter.customerName = { $regex: customerName.trim(), $options: 'i' };
    } else if (search?.trim()) {
      bookingFilter.customerName = { $regex: search.trim(), $options: 'i' };
    }

    const activityFilter = {};
    if (activityName?.trim()) {
      activityFilter.name = { $regex: activityName.trim(), $options: 'i' };
    }

    const skip = (page - 1) * limit;

    let activityIds = null;
    if (activityName?.trim()) {
      const matchedActivities = await FitnessActivity.find(activityFilter).select('_id');
      activityIds = matchedActivities.map(a => a._id);
      bookingFilter.activityId = { $in: activityIds };

      if (activityIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0,
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: page > 1
        });
      }
    }

    const [bookings, total] = await Promise.all([
      FitnessBooking.find(bookingFilter)
        .populate('activityId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FitnessBooking.countDocuments(bookingFilter)
    ]);

    const formatted = bookings.map(b => {
      let finalActivityName = 'N/A';
      let slotTime = 'N/A';

      if (b.activityId && b.activityId.slots) {
        finalActivityName = b.activityId.name;
        const slot = b.activityId.slots.id(b.slotId);
        if (slot) slotTime = `${slot.startTime} - ${slot.endTime}`;
      }

      return {
        _id: b._id,
        memberId: b.memberId?.name || b.customerName,
        customerName: b.customerName,
        activityName: finalActivityName,
        slotTime,
        staffName: b.staffId?.fullName || '—',
        date:        b.date,                    // Already string YYYY-MM-DD
        isRecurring: b.isRecurring,
        isException: b.isException
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      data: formatted
    });
  } catch (err) {
    console.error("getBookings error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   📋 CANCEL BOOKING
========================= */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await FitnessBooking.findById(id);
    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found' });

    await FitnessBooking.findByIdAndDelete(id);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = exports;









// const FitnessActivity = require('../models/FitnessActivity');
// const FitnessBooking  = require('../models/FitnessBooking');
// const FeeAllotment    = require('../models/FitnessFeeAllotment');
// const FeePayment      = require('../models/FitnessFeePayment');
// const mongoose        = require('mongoose');

// /* =========================
//    HELPER: CHECK OVERLAP
// ========================= */
// function isOverlapping(slot1, slot2) {
//   return (
//     slot1.startTime < slot2.endTime &&
//     slot2.startTime < slot1.endTime
//   );
// }

// /* =========================
//    HELPER: Generate dates between start and end (inclusive)
// ========================= */
// function getDatesInRange(startDate, endDate) {
//   const dates = [];
//   let current = new Date(startDate);
//   const end = new Date(endDate);

//   while (current <= end) {
//     dates.push(current.toISOString().split('T')[0]);
//     current.setDate(current.getDate() + 1);
//   }
//   return dates;
// }

// /* =========================
//    HELPER: Generate recurring bookings for a member
// ========================= */
// exports.generateRecurringBookings = async (memberId, activityFeeIndex, activityId, slotId, startDate, endDate, customerName, phone) => {
//   const dates = getDatesInRange(startDate, endDate);
//   const bookings = [];

//   for (const date of dates) {
//     bookings.push({
//       activityId,
//       slotId,
//       date,
//       memberId: memberId || null,
//       activityFeeIndex,
//       isRecurring: true,
//       isException: false,
//       customerName: customerName || "Walk-in",
//       phone
//     });
//   }

//   if (bookings.length > 0) {
//     await FitnessBooking.insertMany(bookings);
//   }

//   return bookings.length;
// };

// /* =========================
//    ➕ CREATE ACTIVITY
// ========================= */
// exports.createActivity = async (req, res) => {
//   try {
//     const { name, capacity, slots } = req.body;

//     if (!name?.trim())
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0)
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0)
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     // Slot validation
//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//     }

//     // Overlap check — all slots checked equally, no membersOnly distinction
//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
//         }
//       }
//     }

//     const existing = await FitnessActivity.findOne({ name: name.trim() });
//     if (existing)
//       return res.status(409).json({ success: false, message: 'Activity with this name already exists' });

//     const activity = await FitnessActivity.create({
//       name: name.trim(),
//       capacity: Number(capacity),
//       slots
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Activity created successfully',
//       data: activity
//     });

//   } catch (err) {
//     console.error("Create Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📄 GET ALL ACTIVITIES
// ========================= */
// exports.getActivities = async (req, res) => {
//   try {
//     const activities = await FitnessActivity.find().sort({ name: 1 });
//     res.json({ success: true, count: activities.length, data: activities });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    🔍 GET ACTIVITY BY ID
// ========================= */
// exports.getActivityById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id))
//       return res.status(400).json({ success: false, message: 'Invalid ID' });

//     const activity = await FitnessActivity.findById(id);
//     if (!activity)
//       return res.status(404).json({ success: false, message: 'Not found' });

//     res.json({ success: true, data: activity });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    ✏️ UPDATE ACTIVITY
// ========================= */
// exports.updateActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, capacity, slots } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id))
//       return res.status(400).json({ success: false, message: 'Invalid Activity ID' });

//     if (!name?.trim())
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0)
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0)
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     // Slot validation
//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//     }

//     // Overlap check — all slots checked equally, no membersOnly distinction
//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
//         }
//       }
//     }

//     // Check for duplicate name (excluding current activity)
//     const existing = await FitnessActivity.findOne({
//       _id: { $ne: id },
//       name: name.trim()
//     });
//     if (existing)
//       return res.status(409).json({ success: false, message: 'Duplicate activity name' });

//     const updated = await FitnessActivity.findByIdAndUpdate(
//       id,
//       {
//         name: name.trim(),
//         capacity: Number(capacity),
//         slots,
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updated)
//       return res.status(404).json({ success: false, message: 'Activity not found' });

//     res.json({
//       success: true,
//       message: 'Activity updated successfully',
//       data: updated
//     });

//   } catch (err) {
//     console.error("Update Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    ❌ DELETE ACTIVITY
// ========================= */
// exports.deleteActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await FitnessActivity.findByIdAndDelete(id);
//     if (!deleted)
//       return res.status(404).json({ success: false, message: 'Not found' });
//     res.json({ success: true, message: 'Deleted' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📊 GET AVAILABILITY — Supports BOTH single date and date range
// ========================= */
// exports.getAvailability = async (req, res) => {
//   try {
//     const { activityId, startDate, endDate, date } = req.query;

//     if (!activityId) {
//       return res.status(400).json({ success: false, message: 'activityId is required' });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     let dates = [];

//     if (date) {
//       if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//         return res.status(400).json({ success: false, message: 'Invalid date format' });
//       }
//       dates = [date];
//     } else if (startDate && endDate) {
//       dates = getDatesInRange(startDate, endDate);
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Either "date" or both "startDate" and "endDate" are required'
//       });
//     }

//     if (dates.length === 0) {
//       return res.status(400).json({ success: false, message: 'Invalid date range' });
//     }

//     const result = [];

//     for (let slot of activity.slots) {
//       let fullyAvailableDays = 0;

//       for (let d of dates) {
//         const count = await FitnessBooking.countDocuments({ slotId: slot._id, date: d });
//         const isAvailable = count < activity.capacity;
//         if (isAvailable) fullyAvailableDays++;
//       }

//       const percentage = Math.round((fullyAvailableDays / dates.length) * 100);

//       // membersOnly removed from response
//       result.push({
//         slotId:                 slot._id,
//         startTime:              slot.startTime,
//         endTime:                slot.endTime,
//         capacity:               activity.capacity,
//         totalDays:              dates.length,
//         fullyAvailableDays,
//         availabilityPercentage: percentage,
//       });
//     }

//     res.json({
//       success: true,
//       data: result,
//       range: { startDate: dates[0], endDate: dates[dates.length - 1], totalDays: dates.length }
//     });

//   } catch (err) {
//     console.error("getAvailability error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    🎯 BOOK SLOT
// ========================= */
// exports.bookSlot = async (req, res) => {
//   try {
//     const {
//       activityId,
//       slotId,
//       date,
//       customerName,
//       phone = "0000000000",
//       memberId,
//       feeTypeId,
//       plan = "Daily",
//       amount,
//       paymentStatus = "Paid",
//       paymentMode = "Cash",
//       paymentDate
//     } = req.body;

//     if (!activityId || !slotId || !date || !customerName?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'activityId, slotId, date, and customerName are required'
//       });
//     }

//     if (!amount || Number(amount) <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid fee amount is required'
//       });
//     }

//     const organizationId = req.organizationId || req.headers['x-organization-id'];

//     if (!organizationId) {
//       console.error("Missing organizationId - Headers:", req.headers);
//       return res.status(400).json({
//         success: false,
//         message: 'Organization ID is missing from request'
//       });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     const slot = activity.slots.id(slotId);
//     if (!slot) {
//       return res.status(404).json({ success: false, message: 'Slot not found' });
//     }

//     // Capacity check
//     const existingCount = await FitnessBooking.countDocuments({
//       slotId,
//       date: new Date(date)
//     });
//     if (existingCount >= activity.capacity) {
//       return res.status(400).json({ success: false, message: 'Slot is full' });
//     }

//     // Case 1: Member changing slot (no extra fee)
//     if (memberId) {
//       const existingBooking = await FitnessBooking.findOne({
//         memberId,
//         activityId,
//         date: new Date(date)
//       });

//       if (existingBooking) {
//         existingBooking.slotId = slotId;
//         await existingBooking.save();
//         return res.json({
//           success: true,
//           message: 'Member slot updated successfully (no extra charge)',
//           booking: existingBooking
//         });
//       }
//     }

//     // Case 2: New booking (walk-in or extra session)
//     const booking = await FitnessBooking.create({
//       activityId,
//       slotId,
//       date: new Date(date),
//       memberId: memberId || null,
//       staffId: req.body.staffId || null,
//       customerName: customerName.trim(),
//       phone,
//       isRecurring: false,
//       isException: true,
//       activityFeeIndex: null
//     });

//     const numAmount = Number(amount);
//     const finalPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

//     const allotment = await FeeAllotment.create({
//       memberId: memberId || null,
//       feeTypeId: feeTypeId || null,
//       responsibleStaff: req.body.staffId || null,
//       description: `Ad-hoc Booking - ${activity.name} (${plan})`,
//       feePlan: plan,
//       amount: numAmount,
//       dueDate: new Date(date),
//       status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//       organizationId,
//     });

//     if (paymentStatus === 'Paid') {
//       await FeePayment.create({
//         memberId: memberId || null,
//         allotmentId: allotment._id,
//         amount: numAmount,
//         paymentMode,
//         paymentDate: finalPaymentDate,
//         description: `Booking: ${activity.name} - ${plan}`,
//         customerName: customerName,
//         organizationId,
//       });

//       allotment.status = 'Paid';
//       await allotment.save();
//     }

//     res.json({
//       success: true,
//       message: memberId ? 'Extra session booked' : 'Walk-in booking created',
//       booking,
//       allotmentId: allotment._id
//     });

//   } catch (err) {
//     console.error("Book Slot Error:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message || 'Failed to book slot'
//     });
//   }
// };

// /* =========================
//    📋 GET ALL BOOKINGS
// ========================= */
// exports.getBookings = async (req, res) => {
//   try {
//     const bookings = await FitnessBooking.find()
//       .populate('activityId')
//       .populate('staffId', 'fullName')
//       .sort({ createdAt: -1 });

//     const formatted = bookings.map(b => {
//       let activityName = 'N/A';
//       let slotTime = 'N/A';

//       if (b.activityId && b.activityId.slots) {
//         activityName = b.activityId.name;
//         const slot = b.activityId.slots.id(b.slotId);
//         if (slot) slotTime = `${slot.startTime} - ${slot.endTime}`;
//       }

//       return {
//         _id:         b._id,
//         memberId:    b.memberId?.name || b.customerName,
//         customerName: b.customerName,
//         activityName,
//         slotTime,
//         staffName: b.staffId?.fullName || '—',
//         date:        b.date,
//         isRecurring: b.isRecurring,
//         isException: b.isException
//       };
//     });

//     res.json({ success: true, data: formatted });
//   } catch (err) {
//     console.error("getBookings error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📋 CANCEL BOOKING
// ========================= */
// exports.cancelBooking = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const booking = await FitnessBooking.findById(id);
//     if (!booking)
//       return res.status(404).json({ success: false, message: 'Booking not found' });

//     await FitnessBooking.findByIdAndDelete(id);
//     res.json({ success: true, message: 'Booking cancelled successfully' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };






/////////////////








// const FitnessActivity = require('../models/FitnessActivity');
// const FitnessBooking  = require('../models/FitnessBooking');
// const FeeAllotment    = require('../models/FitnessFeeAllotment');
// const FeePayment      = require('../models/FitnessFeePayment');
// const mongoose        = require('mongoose');

// /* =========================
//    HELPER: CHECK OVERLAP
// ========================= */
// function isOverlapping(slot1, slot2) {
//   return (
//     slot1.startTime < slot2.endTime &&
//     slot2.startTime < slot1.endTime
//   );
// }

// /* =========================
//    HELPER: Generate dates between start and end (inclusive)
// ========================= */
// function getDatesInRange(startDate, endDate) {
//   const dates = [];
//   let current = new Date(startDate);
//   const end = new Date(endDate);

//   while (current <= end) {
//     dates.push(current.toISOString().split('T')[0]);
//     current.setDate(current.getDate() + 1);
//   }
//   return dates;
// }

// /* =========================
//    HELPER: Generate recurring bookings for a member
// ========================= */
// exports.generateRecurringBookings = async (memberId, activityFeeIndex, activityId, slotId, startDate, endDate, customerName, phone) => {
//   const dates = getDatesInRange(startDate, endDate);
//   const bookings = [];

//   for (const date of dates) {
//     bookings.push({
//       activityId,
//       slotId,
//       date,
//       memberId: memberId || null,
//       activityFeeIndex,
//       isRecurring: true,
//       isException: false,
//       customerName: customerName || "Walk-in",
//       phone
//     });
//   }

//   if (bookings.length > 0) {
//     await FitnessBooking.insertMany(bookings);
//   }

//   return bookings.length;
// };

// /* =========================
//    ➕ CREATE ACTIVITY
// ========================= */
// exports.createActivity = async (req, res) => {
//   try {
//     const { name, capacity, slots } = req.body;

//     if (!name?.trim())
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0)
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0)
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     // Slot validation
//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//     }

//     // Overlap check — all slots checked equally, no membersOnly distinction
//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
//         }
//       }
//     }

//     const existing = await FitnessActivity.findOne({ name: name.trim() });
//     if (existing)
//       return res.status(409).json({ success: false, message: 'Activity with this name already exists' });

//     const activity = await FitnessActivity.create({
//       name: name.trim(),
//       capacity: Number(capacity),
//       slots
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Activity created successfully',
//       data: activity
//     });

//   } catch (err) {
//     console.error("Create Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📄 GET ALL ACTIVITIES
// ========================= */
// exports.getActivities = async (req, res) => {
//   try {
//     const activities = await FitnessActivity.find().sort({ name: 1 });
//     res.json({ success: true, count: activities.length, data: activities });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    🔍 GET ACTIVITY BY ID
// ========================= */
// exports.getActivityById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id))
//       return res.status(400).json({ success: false, message: 'Invalid ID' });

//     const activity = await FitnessActivity.findById(id);
//     if (!activity)
//       return res.status(404).json({ success: false, message: 'Not found' });

//     res.json({ success: true, data: activity });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    ✏️ UPDATE ACTIVITY
// ========================= */
// exports.updateActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, capacity, slots } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id))
//       return res.status(400).json({ success: false, message: 'Invalid Activity ID' });

//     if (!name?.trim())
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0)
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0)
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     // Slot validation
//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//     }

//     // Overlap check — all slots checked equally, no membersOnly distinction
//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
//         }
//       }
//     }

//     // Check for duplicate name (excluding current activity)
//     const existing = await FitnessActivity.findOne({
//       _id: { $ne: id },
//       name: name.trim()
//     });
//     if (existing)
//       return res.status(409).json({ success: false, message: 'Duplicate activity name' });

//     const updated = await FitnessActivity.findByIdAndUpdate(
//       id,
//       {
//         name: name.trim(),
//         capacity: Number(capacity),
//         slots,
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updated)
//       return res.status(404).json({ success: false, message: 'Activity not found' });

//     res.json({
//       success: true,
//       message: 'Activity updated successfully',
//       data: updated
//     });

//   } catch (err) {
//     console.error("Update Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    ❌ DELETE ACTIVITY
// ========================= */
// exports.deleteActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await FitnessActivity.findByIdAndDelete(id);
//     if (!deleted)
//       return res.status(404).json({ success: false, message: 'Not found' });
//     res.json({ success: true, message: 'Deleted' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📊 GET AVAILABILITY — Supports BOTH single date and date range
// ========================= */
// exports.getAvailability = async (req, res) => {
//   try {
//     const { activityId, startDate, endDate, date } = req.query;

//     if (!activityId) {
//       return res.status(400).json({ success: false, message: 'activityId is required' });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     let dates = [];

//     if (date) {
//       if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//         return res.status(400).json({ success: false, message: 'Invalid date format' });
//       }
//       dates = [date];
//     } else if (startDate && endDate) {
//       dates = getDatesInRange(startDate, endDate);
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Either "date" or both "startDate" and "endDate" are required'
//       });
//     }

//     if (dates.length === 0) {
//       return res.status(400).json({ success: false, message: 'Invalid date range' });
//     }

//     const result = [];

//     for (let slot of activity.slots) {
//       let fullyAvailableDays = 0;

//       for (let d of dates) {
//         const count = await FitnessBooking.countDocuments({ slotId: slot._id, date: d });
//         const isAvailable = count < activity.capacity;
//         if (isAvailable) fullyAvailableDays++;
//       }

//       const percentage = Math.round((fullyAvailableDays / dates.length) * 100);

//       // membersOnly removed from response
//       result.push({
//         slotId:                 slot._id,
//         startTime:              slot.startTime,
//         endTime:                slot.endTime,
//         capacity:               activity.capacity,
//         totalDays:              dates.length,
//         fullyAvailableDays,
//         availabilityPercentage: percentage,
//       });
//     }

//     res.json({
//       success: true,
//       data: result,
//       range: { startDate: dates[0], endDate: dates[dates.length - 1], totalDays: dates.length }
//     });

//   } catch (err) {
//     console.error("getAvailability error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    🎯 BOOK SLOT
// ========================= */
// exports.bookSlot = async (req, res) => {
//   try {
//     const {
//       activityId,
//       slotId,
//       date,
//       customerName,
//       phone = "0000000000",
//       memberId,
//       feeTypeId,
//       plan = "Daily",
//       amount,
//       paymentStatus = "Paid",
//       paymentMode = "Cash",
//       paymentDate
//     } = req.body;

//     if (!activityId || !slotId || !date || !customerName?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'activityId, slotId, date, and customerName are required'
//       });
//     }

//     if (!amount || Number(amount) <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid fee amount is required'
//       });
//     }

//     const organizationId = req.organizationId || req.headers['x-organization-id'];

//     if (!organizationId) {
//       console.error("Missing organizationId - Headers:", req.headers);
//       return res.status(400).json({
//         success: false,
//         message: 'Organization ID is missing from request'
//       });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     const slot = activity.slots.id(slotId);
//     if (!slot) {
//       return res.status(404).json({ success: false, message: 'Slot not found' });
//     }

//     // Capacity check
//     const existingCount = await FitnessBooking.countDocuments({
//       slotId,
//       date: new Date(date)
//     });
//     if (existingCount >= activity.capacity) {
//       return res.status(400).json({ success: false, message: 'Slot is full' });
//     }

//     // Case 1: Member changing slot (no extra fee)
//     if (memberId) {
//       const existingBooking = await FitnessBooking.findOne({
//         memberId,
//         activityId,
//         date: new Date(date)
//       });

//       if (existingBooking) {
//         existingBooking.slotId = slotId;
//         await existingBooking.save();
//         return res.json({
//           success: true,
//           message: 'Member slot updated successfully (no extra charge)',
//           booking: existingBooking
//         });
//       }
//     }

//     // Case 2: New booking (walk-in or extra session)
//     const booking = await FitnessBooking.create({
//       activityId,
//       slotId,
//       date: new Date(date),
//       memberId: memberId || null,
//       customerName: customerName.trim(),
//       phone,
//       isRecurring: false,
//       isException: true,
//       activityFeeIndex: null
//     });

//     const numAmount = Number(amount);
//     const finalPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

//     const allotment = await FeeAllotment.create({
//       memberId: memberId || null,
//       feeTypeId: feeTypeId || null,
//       description: `Ad-hoc Booking - ${activity.name} (${plan})`,
//       feePlan: plan,
//       amount: numAmount,
//       dueDate: new Date(date),
//       status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//       organizationId,
//     });

//     if (paymentStatus === 'Paid') {
//       await FeePayment.create({
//         memberId: memberId || null,
//         allotmentId: allotment._id,
//         amount: numAmount,
//         paymentMode,
//         paymentDate: finalPaymentDate,
//         description: `Booking: ${activity.name} - ${plan}`,
//         organizationId,
//       });

//       allotment.status = 'Paid';
//       await allotment.save();
//     }

//     res.json({
//       success: true,
//       message: memberId ? 'Extra session booked' : 'Walk-in booking created',
//       booking,
//       allotmentId: allotment._id
//     });

//   } catch (err) {
//     console.error("Book Slot Error:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message || 'Failed to book slot'
//     });
//   }
// };

// /* =========================
//    📋 GET ALL BOOKINGS
// ========================= */
// exports.getBookings = async (req, res) => {
//   try {
//     const bookings = await FitnessBooking.find()
//       .populate('activityId')
//       .sort({ createdAt: -1 });

//     const formatted = bookings.map(b => {
//       let activityName = 'N/A';
//       let slotTime = 'N/A';

//       if (b.activityId && b.activityId.slots) {
//         activityName = b.activityId.name;
//         const slot = b.activityId.slots.id(b.slotId);
//         if (slot) slotTime = `${slot.startTime} - ${slot.endTime}`;
//       }

//       return {
//         _id:         b._id,
//         memberId:    b.memberId?.name || b.customerName,
//         customerName: b.customerName,
//         activityName,
//         slotTime,
//         date:        b.date,
//         isRecurring: b.isRecurring,
//         isException: b.isException
//       };
//     });

//     res.json({ success: true, data: formatted });
//   } catch (err) {
//     console.error("getBookings error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📋 CANCEL BOOKING
// ========================= */
// exports.cancelBooking = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const booking = await FitnessBooking.findById(id);
//     if (!booking)
//       return res.status(404).json({ success: false, message: 'Booking not found' });

//     await FitnessBooking.findByIdAndDelete(id);
//     res.json({ success: true, message: 'Booking cancelled successfully' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };







// _________________ DO NOT Delete ___________
// ____________Members Only Check box ______________



// const FitnessActivity = require('../models/FitnessActivity');
// const FitnessBooking = require('../models/FitnessBooking');
// const FeeAllotment   = require('../models/FitnessFeeAllotment');   
// const FeePayment     = require('../models/FitnessFeePayment');
// const mongoose = require('mongoose');

// /* =========================
//    HELPER: CHECK OVERLAP
// ========================= */
// function isOverlapping(slot1, slot2) {
//   return (
//     slot1.startTime < slot2.endTime &&
//     slot2.startTime < slot1.endTime
//   );
// }

// /* =========================
//    HELPER: Generate dates between start and end (inclusive)
// ========================= */
// function getDatesInRange(startDate, endDate) {
//   const dates = [];
//   let current = new Date(startDate);
//   const end = new Date(endDate);

//   while (current <= end) {
//     dates.push(current.toISOString().split('T')[0]);
//     current.setDate(current.getDate() + 1);
//   }
//   return dates;
// }

// /* =========================
//    HELPER: Generate recurring bookings for a member
// ========================= */
// exports.generateRecurringBookings = async (memberId, activityFeeIndex, activityId, slotId, startDate, endDate, customerName, phone) => {
//   const dates = getDatesInRange(startDate, endDate);
//   const bookings = [];

//   for (const date of dates) {
//     bookings.push({
//       activityId,
//       slotId,
//       date,
//       memberId: memberId || null,      activityFeeIndex,
//       isRecurring: true,
//       isException: false,
//       customerName: customerName || "Walk-in",      phone
//     });
//   }

//   if (bookings.length > 0) {
//     await FitnessBooking.insertMany(bookings);
//   }

//   return bookings.length;
// };

// /* =========================
//    ➕ CREATE ACTIVITY
// ========================= */
// exports.createActivity = async (req, res) => {
//   try {
//     const { name, capacity, slots } = req.body;

//     if (!name?.trim()) 
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0) 
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0) 
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     // Enhanced slot validation
//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//       // membersOnly should be boolean
//       if (typeof slot.membersOnly !== 'boolean') {
//         slot.membersOnly = true; // Default to true if not provided
//       }
//     }

//        // Check for overlapping slots
// for (let i = 0; i < slots.length; i++) {
//   for (let j = i + 1; j < slots.length; j++) {

//     const slotA = slots[i];
//     const slotB = slots[j];

//     // 🚨 Block ONLY if both are membersOnly
//     if (
//       slotA.membersOnly &&
//       slotB.membersOnly &&
//       isOverlapping(slotA, slotB)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Member slots cannot overlap'
//       });
//     }

//   }
// }

//     const existing = await FitnessActivity.findOne({ name: name.trim() });
//     if (existing) 
//       return res.status(409).json({ success: false, message: 'Activity with this name already exists' });

//     const activity = await FitnessActivity.create({ 
//       name: name.trim(), 
//       capacity: Number(capacity), 
//       slots 
//     });

//     res.status(201).json({ 
//       success: true, 
//       message: 'Activity created successfully', 
//       data: activity 
//     });

//   } catch (err) {
//     console.error("Create Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📄 GET ALL ACTIVITIES
// ========================= */
// exports.getActivities = async (req, res) => {
//   try {
//     const activities = await FitnessActivity.find().sort({ name: 1 });
//     res.json({ success: true, count: activities.length, data: activities });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    🔍 GET ACTIVITY BY ID
// ========================= */
// exports.getActivityById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

//     const activity = await FitnessActivity.findById(id);
//     if (!activity) return res.status(404).json({ success: false, message: 'Not found' });

//     res.json({ success: true, data: activity });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    ✏️ UPDATE ACTIVITY
// ========================= */
// exports.updateActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, capacity, slots } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) 
//       return res.status(400).json({ success: false, message: 'Invalid Activity ID' });

//     if (!name?.trim()) 
//       return res.status(400).json({ success: false, message: 'Name is required' });

//     if (!capacity || Number(capacity) <= 0) 
//       return res.status(400).json({ success: false, message: 'Valid capacity is required' });

//     if (!Array.isArray(slots) || slots.length === 0) 
//       return res.status(400).json({ success: false, message: 'At least one slot is required' });

//     // Enhanced slot validation
//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
//       }
//       if (!slot.staffId) {
//         return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
//       }
//       if (typeof slot.membersOnly !== 'boolean') {
//         slot.membersOnly = true; // Default to true
//       }
//     }

//         // Check for overlapping slots
// for (let i = 0; i < slots.length; i++) {
//   for (let j = i + 1; j < slots.length; j++) {

//     const slotA = slots[i];
//     const slotB = slots[j];

//     // 🚨 Block ONLY if both are membersOnly
//     if (
//       slotA.membersOnly &&
//       slotB.membersOnly &&
//       isOverlapping(slotA, slotB)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Member slots cannot overlap'
//       });
//     }

//   }
// }

//     // Check for duplicate name (excluding current activity)
//     const existing = await FitnessActivity.findOne({ 
//       _id: { $ne: id }, 
//       name: name.trim() 
//     });
//     if (existing) 
//       return res.status(409).json({ success: false, message: 'Duplicate activity name' });

//     const updated = await FitnessActivity.findByIdAndUpdate(
//       id,
//       { 
//         name: name.trim(), 
//         capacity: Number(capacity), 
//         slots,
//         updatedAt: Date.now() 
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updated) 
//       return res.status(404).json({ success: false, message: 'Activity not found' });

//     res.json({ 
//       success: true, 
//       message: 'Activity updated successfully', 
//       data: updated 
//     });

//   } catch (err) {
//     console.error("Update Activity Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    ❌ DELETE ACTIVITY
// ========================= */
// exports.deleteActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await FitnessActivity.findByIdAndDelete(id);
//     if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
//     res.json({ success: true, message: 'Deleted' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📊 GET AVAILABILITY — Supports BOTH single date and date range
// ========================= */
// exports.getAvailability = async (req, res) => {
//   try {
//     const { activityId, startDate, endDate, date } = req.query;

//     if (!activityId) {
//       return res.status(400).json({ success: false, message: 'activityId is required' });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     let dates = [];

//     if (date) {
//       if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//         return res.status(400).json({ success: false, message: 'Invalid date format' });
//       }
//       dates = [date];
//     } else if (startDate && endDate) {
//       dates = getDatesInRange(startDate, endDate);
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Either "date" or both "startDate" and "endDate" are required'
//       });
//     }

//     if (dates.length === 0) {
//       return res.status(400).json({ success: false, message: 'Invalid date range' });
//     }

//     const result = [];

//     for (let slot of activity.slots) {
//       let fullyAvailableDays = 0;

//       for (let d of dates) {
//         const count = await FitnessBooking.countDocuments({ slotId: slot._id, date: d });
//         const isAvailable = count < activity.capacity;

//         if (isAvailable) fullyAvailableDays++;
//       }

//       const percentage = Math.round((fullyAvailableDays / dates.length) * 100);

//       result.push({
//         slotId: slot._id,
//         startTime: slot.startTime,
//         endTime: slot.endTime,
//         capacity: activity.capacity,
//         membersOnly: slot.membersOnly,           // ✅ NEW - Important
//         totalDays: dates.length,
//         fullyAvailableDays,
//         availabilityPercentage: percentage,
//       });
//     }

//     res.json({
//       success: true,
//       data: result,
//       range: { startDate: dates[0], endDate: dates[dates.length - 1], totalDays: dates.length }
//     });

//   } catch (err) {
//     console.error("getAvailability error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// /* =========================
//    🎯 BOOK SLOT - FINAL WORKING VERSION
// ========================= */
// exports.bookSlot = async (req, res) => {
//   try {
//     const {
//       activityId,
//       slotId,
//       date,
//       customerName,
//       phone = "0000000000",
//       memberId,
//       feeTypeId,
//       plan = "Daily",
//       amount,
//       paymentStatus = "Paid",
//       paymentMode = "Cash",
//       paymentDate
//     } = req.body;

//     // Basic validation
//     if (!activityId || !slotId || !date || !customerName?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'activityId, slotId, date, and customerName are required'
//       });
//     }

//     if (!amount || Number(amount) <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid fee amount is required'
//       });
//     }

//     // Get organizationId safely from header (your apiClient sends X-Organization-ID)
//     const organizationId = req.organizationId || req.headers['x-organization-id'];
    
//     if (!organizationId) {
//       console.error("Missing organizationId - Headers:", req.headers);
//       return res.status(400).json({
//         success: false,
//         message: 'Organization ID is missing from request'
//       });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     const slot = activity.slots.id(slotId);
//     if (!slot) {
//       return res.status(404).json({ success: false, message: 'Slot not found' });
//     }

//     // Capacity check
//     const existingCount = await FitnessBooking.countDocuments({
//       slotId,
//       date: new Date(date)
//     });
//     if (existingCount >= activity.capacity) {
//       return res.status(400).json({ success: false, message: 'Slot is full' });
//     }

//     // Case 1: Member changing slot (no extra fee)
//     if (memberId) {
//       const existingBooking = await FitnessBooking.findOne({
//         memberId,
//         activityId,
//         date: new Date(date)
//       });

//       if (existingBooking) {
//         existingBooking.slotId = slotId;
//         await existingBooking.save();
//         return res.json({
//           success: true,
//           message: 'Member slot updated successfully (no extra charge)',
//           booking: existingBooking
//         });
//       }
//     }

//     // Case 2: New booking (walk-in or extra session)
//     const booking = await FitnessBooking.create({
//       activityId,
//       slotId,
//       date: new Date(date),
//       memberId: memberId || null,
//       customerName: customerName.trim(),
//       phone,
//       isRecurring: false,
//       isException: true,
//       activityFeeIndex: null
//     });

//     // Create Fee Allotment + Payment
//     const numAmount = Number(amount);
//     const finalPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

//     const allotment = await FeeAllotment.create({
//       memberId: memberId || null,
//       feeTypeId: feeTypeId || null,
//       description: `Ad-hoc Booking - ${activity.name} (${plan})`,
//       feePlan: plan,
//       amount: numAmount,
//       dueDate: new Date(date),
//       status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//       organizationId: organizationId,        // ← Fixed
//     });

//     if (paymentStatus === 'Paid') {
//       await FeePayment.create({
//         memberId: memberId || null,
//         allotmentId: allotment._id,
//         amount: numAmount,
//         paymentMode,
//         paymentDate: finalPaymentDate,
//         description: `Booking: ${activity.name} - ${plan}`,
//         organizationId: organizationId,       // ← Fixed
//       });

//       allotment.status = 'Paid';
//       await allotment.save();
//     }

//     res.json({
//       success: true,
//       message: memberId ? 'Extra session booked' : 'Walk-in booking created',
//       booking,
//       allotmentId: allotment._id
//     });

//   } catch (err) {
//     console.error("Book Slot Error:", err);
//     res.status(500).json({ 
//       success: false, 
//       message: err.message || 'Failed to book slot' 
//     });
//   }
// };

// /* =========================
//    📋 GET ALL BOOKINGS
// ========================= */
// exports.getBookings = async (req, res) => {
//   try {
//     const bookings = await FitnessBooking.find()
//       .populate('activityId')
//       .sort({ createdAt: -1 });

//     const formatted = bookings.map(b => {
//       let activityName = 'N/A';
//       let slotTime = 'N/A';

//       if (b.activityId && b.activityId.slots) {
//         activityName = b.activityId.name;
//         const slot = b.activityId.slots.id(b.slotId);
//         if (slot) slotTime = `${slot.startTime} - ${slot.endTime}`;
//       }

//       return {
//         _id: b._id,
//         memberId: b.memberId?.name || b.customerName,
//         customerName: b.customerName,
//         activityName,
//         slotTime,
//         date: b.date,
//         isRecurring: b.isRecurring,
//         isException: b.isException
//       };
//     });

//     res.json({ success: true, data: formatted });
//   } catch (err) {
//     console.error("getBookings error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📋 CANCEL BOOKING
// ========================= */
// exports.cancelBooking = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const booking = await FitnessBooking.findById(id);
//     if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

//     await FitnessBooking.findByIdAndDelete(id);
//     res.json({ success: true, message: 'Booking cancelled successfully' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };







