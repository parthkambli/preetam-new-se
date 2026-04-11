const FitnessActivity = require('../models/FitnessActivity');
const FitnessBooking = require('../models/FitnessBooking');
const mongoose = require('mongoose');

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
      memberId,
      activityFeeIndex,
      isRecurring: true,
      isException: false,
      customerName,
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

    // Enhanced slot validation
    for (let slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
      }
      if (!slot.staffId) {
        return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
      }
      // membersOnly should be boolean
      if (typeof slot.membersOnly !== 'boolean') {
        slot.membersOnly = true; // Default to true if not provided
      }
    }

    // Check for overlapping slots
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
========================= */
exports.getActivities = async (req, res) => {
  try {
    const activities = await FitnessActivity.find().sort({ name: 1 });
    res.json({ success: true, count: activities.length, data: activities });
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
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const activity = await FitnessActivity.findById(id);
    if (!activity) return res.status(404).json({ success: false, message: 'Not found' });

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

    if (!mongoose.Types.ObjectId.isValid(id)) 
      return res.status(400).json({ success: false, message: 'Invalid Activity ID' });

    if (!name?.trim()) 
      return res.status(400).json({ success: false, message: 'Name is required' });

    if (!capacity || Number(capacity) <= 0) 
      return res.status(400).json({ success: false, message: 'Valid capacity is required' });

    if (!Array.isArray(slots) || slots.length === 0) 
      return res.status(400).json({ success: false, message: 'At least one slot is required' });

    // Enhanced slot validation
    for (let slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({ success: false, message: 'Start time and end time are required for all slots' });
      }
      if (!slot.staffId) {
        return res.status(400).json({ success: false, message: 'Instructor (staff) is required for all slots' });
      }
      if (typeof slot.membersOnly !== 'boolean') {
        slot.membersOnly = true; // Default to true
      }
    }

    // Check for overlapping slots
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlapping(slots[i], slots[j])) {
          return res.status(400).json({ success: false, message: 'Slots cannot overlap' });
        }
      }
    }

    // Check for duplicate name (excluding current activity)
    const existing = await FitnessActivity.findOne({ 
      _id: { $ne: id }, 
      name: name.trim() 
    });
    if (existing) 
      return res.status(409).json({ success: false, message: 'Duplicate activity name' });

    const updated = await FitnessActivity.findByIdAndUpdate(
      id,
      { 
        name: name.trim(), 
        capacity: Number(capacity), 
        slots,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    );

    if (!updated) 
      return res.status(404).json({ success: false, message: 'Activity not found' });

    res.json({ 
      success: true, 
      message: 'Activity updated successfully', 
      data: updated 
    });

  } catch (err) {
    console.error("Update Activity Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   ❌ DELETE ACTIVITY
========================= */
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FitnessActivity.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   📊 GET AVAILABILITY — Supports BOTH single date and date range
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
      // Single date mode (used by BookActivity page)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      dates = [date];
    } else if (startDate && endDate) {
      // Date range mode (used by Add Member)
      dates = getDatesInRange(startDate, endDate);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either "date" (for single day) or both "startDate" and "endDate" are required'
      });
    }

    if (dates.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const result = [];

    for (let slot of activity.slots) {
      let fullyAvailableDays = 0;
      const dailyStatus = [];

      for (let d of dates) {
        const count = await FitnessBooking.countDocuments({ slotId: slot._id, date: d });
        const isAvailable = count < activity.capacity;

        if (isAvailable) fullyAvailableDays++;

        dailyStatus.push({ date: d, booked: count, available: isAvailable });
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
        // dailyStatus  // Uncomment if you need detailed per-day info
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
   🎯 BOOK SLOT (Enhanced)
========================= */
exports.bookSlot = async (req, res) => {
  try {
    const { activityId, slotId, date, customerName, phone, memberId, activityFeeIndex = 0, isException = false } = req.body;

    if (!activityId || !slotId || !date || !customerName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'activityId, slotId, date, customerName, phone are required'
      });
    }

    const activity = await FitnessActivity.findById(activityId);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    const slot = activity.slots.id(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    const count = await FitnessBooking.countDocuments({ slotId, date });
    if (count >= activity.capacity) {
      return res.status(400).json({ success: false, message: 'Slot Full' });
    }

    await FitnessBooking.create({
      activityId,
      slotId,
      date,
      memberId: memberId || null,
      activityFeeIndex,
      isRecurring: !isException,
      isException,
      customerName,
      phone
    });

    res.json({ success: true, message: isException ? 'Exception booking created' : 'Booking successful' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   📋 GET ALL BOOKINGS
========================= */
exports.getBookings = async (req, res) => {
  try {
    const bookings = await FitnessBooking.find()
      .populate('activityId')
      .sort({ createdAt: -1 });

    const formatted = bookings.map(b => {
      let activityName = 'N/A';
      let slotTime = 'N/A';

      if (b.activityId && b.activityId.slots) {
        activityName = b.activityId.name;
        const slot = b.activityId.slots.id(b.slotId);
        if (slot) slotTime = `${slot.startTime} - ${slot.endTime}`;
      }

      return {
        _id: b._id,
        memberId: b.memberId,
        customerName: b.customerName,
        activityName,
        slotTime,
        date: b.date,
        isRecurring: b.isRecurring,
        isException: b.isException
      };
    });

    res.json({ success: true, data: formatted });
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
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await FitnessBooking.findByIdAndDelete(id);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};








// const FitnessActivity = require('../models/FitnessActivity');
// const FitnessBooking = require('../models/FitnessBooking');
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
//    (This will be called from Member Controller)
// ========================= */
// exports.generateRecurringBookings = async (memberId, activityFeeIndex, activityId, slotId, startDate, endDate, customerName, phone) => {
//   const dates = getDatesInRange(startDate, endDate);
//   const bookings = [];

//   for (const date of dates) {
//     bookings.push({
//       activityId,
//       slotId,
//       date,
//       memberId,
//       activityFeeIndex,
//       isRecurring: true,
//       isException: false,
//       customerName,
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

//     if (!name) {
//       return res.status(400).json({ success: false, message: 'Name is required' });
//     }

//     if (!capacity || capacity <= 0) {
//       return res.status(400).json({ success: false, message: 'Valid capacity required' });
//     }

//     if (!Array.isArray(slots) || slots.length === 0) {
//       return res.status(400).json({ success: false, message: 'At least one slot required' });
//     }

//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid slot data'
//         });
//       }
//     }

//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({
//             success: false,
//             message: 'Slots cannot overlap'
//           });
//         }
//       }
//     }

//     const existing = await FitnessActivity.findOne({ name: name.trim() });
//     if (existing) {
//       return res.status(409).json({ success: false, message: 'Activity already exists' });
//     }

//     const activity = await FitnessActivity.create({
//       name: name.trim(),
//       capacity,
//       slots
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Activity created',
//       data: activity
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📄 GET ALL ACTIVITIES
// ========================= */
// exports.getActivities = async (req, res) => {
//   try {
//     const activities = await FitnessActivity.find().sort({ name: 1 });
//     res.json({
//       success: true,
//       count: activities.length,
//       data: activities
//     });
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
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ success: false, message: 'Invalid ID' });
//     }

//     const activity = await FitnessActivity.findById(id);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Not found' });
//     }

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

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ success: false, message: 'Invalid ID' });
//     }

//     if (!name) return res.status(400).json({ success: false, message: 'Name required' });
//     if (!capacity || capacity <= 0) {
//       return res.status(400).json({ success: false, message: 'Valid capacity required' });
//     }
//     if (!Array.isArray(slots) || slots.length === 0) {
//       return res.status(400).json({ success: false, message: 'Slots required' });
//     }

//     for (let slot of slots) {
//       if (!slot.startTime || !slot.endTime) {
//         return res.status(400).json({ success: false, message: 'Invalid slot data' });
//       }
//     }

//     for (let i = 0; i < slots.length; i++) {
//       for (let j = i + 1; j < slots.length; j++) {
//         if (isOverlapping(slots[i], slots[j])) {
//           return res.status(400).json({
//             success: false,
//             message: 'Slots cannot overlap'
//           });
//         }
//       }
//     }

//     const existing = await FitnessActivity.findOne({
//       _id: { $ne: id },
//       name: name.trim()
//     });

//     if (existing) {
//       return res.status(409).json({ success: false, message: 'Duplicate activity name' });
//     }

//     const updated = await FitnessActivity.findByIdAndUpdate(
//       id,
//       { name: name.trim(), capacity, slots, updatedAt: Date.now() },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ success: false, message: 'Not found' });
//     }

//     res.json({ success: true, message: 'Updated', data: updated });
//   } catch (err) {
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
//     if (!deleted) {
//       return res.status(404).json({ success: false, message: 'Not found' });
//     }
//     res.json({ success: true, message: 'Deleted' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    📊 GET AVAILABILITY (Updated for Date Range)
// ========================= */
// exports.getAvailability = async (req, res) => {
//   try {
//     const { activityId, startDate, endDate } = req.query;

//     if (!activityId || !startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'activityId, startDate and endDate are required'
//       });
//     }

//     const activity = await FitnessActivity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ success: false, message: 'Activity not found' });
//     }

//     const dates = getDatesInRange(startDate, endDate);
//     if (dates.length === 0) {
//       return res.status(400).json({ success: false, message: 'Invalid date range' });
//     }

//     const result = [];

//     for (let slot of activity.slots) {
//       let fullyAvailableDays = 0;

//       for (let date of dates) {
//         const count = await FitnessBooking.countDocuments({
//           slotId: slot._id,
//           date
//         });
//         if (count < activity.capacity) fullyAvailableDays++;
//       }

//       const percentage = Math.round((fullyAvailableDays / dates.length) * 100);

//       result.push({
//         slotId: slot._id,
//         startTime: slot.startTime,
//         endTime: slot.endTime,
//         capacity: activity.capacity,
//         totalDays: dates.length,
//         fullyAvailableDays,
//         availabilityPercentage: percentage,
//       });
//     }

//     res.json({ 
//       success: true, 
//       data: result,
//       range: { startDate, endDate, totalDays: dates.length }
//     });

//   } catch (err) {
//     console.error("getAvailability error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =========================
//    🎯 BOOK SLOT (Enhanced)
// ========================= */
// exports.bookSlot = async (req, res) => {
//   try {
//     const { activityId, slotId, date, customerName, phone, memberId, activityFeeIndex = 0, isException = false } = req.body;

//     if (!activityId || !slotId || !date || !customerName || !phone || !memberId) {
//       return res.status(400).json({
//         success: false,
//         message: 'activityId, slotId, date, customerName, phone, memberId are required'
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

//     const count = await FitnessBooking.countDocuments({ slotId, date });
//     if (count >= activity.capacity) {
//       return res.status(400).json({ success: false, message: 'Slot Full' });
//     }

//     await FitnessBooking.create({
//       activityId,
//       slotId,
//       date,
//       memberId,
//       activityFeeIndex,
//       isRecurring: !isException,
//       isException,
//       customerName,
//       phone
//     });

//     res.json({ success: true, message: isException ? 'Exception booking created' : 'Booking successful' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
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
//         if (slot) {
//           slotTime = `${slot.startTime} - ${slot.endTime}`;
//         }
//       }

//       return {
//         _id: b._id,
//         memberId: b.memberId,
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

//     if (!booking) {
//       return res.status(404).json({ success: false, message: 'Booking not found' });
//     }

//     await FitnessBooking.findByIdAndDelete(id);
//     res.json({ success: true, message: 'Booking cancelled successfully' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// //working code

// const FitnessActivity = require('../models/FitnessActivity');
// const mongoose = require('mongoose');

// // ➕ Create activity
// exports.createActivity = async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name is required'
//       });
//     }

//     const existingActivity = await FitnessActivity.findOne({
//       name: name.trim()
//     });

//     if (existingActivity) {
//       return res.status(409).json({
//         success: false,
//         message: 'Activity already exists'
//       });
//     }

//     const activity = await FitnessActivity.create({
//       name: name.trim()
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Activity created successfully',
//       data: activity
//     });

//   } catch (error) {
//     console.error('createActivity error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to create activity',
//       error: error.message
//     });
//   }
// };

// // 📄 Get all activities
// exports.getActivities = async (req, res) => {
//   try {
//     const activities = await FitnessActivity.find().sort({ name: 1 });

//     return res.status(200).json({
//       success: true,
//       count: activities.length,
//       data: activities
//     });

//   } catch (error) {
//     console.error('getActivities error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch activities',
//       error: error.message
//     });
//   }
// };

// // 🔍 Get activity by id
// exports.getActivityById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid activity ID'
//       });
//     }

//     const activity = await FitnessActivity.findById(id);

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: 'Activity not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: activity
//     });

//   } catch (error) {
//     console.error('getActivityById error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch activity',
//       error: error.message
//     });
//   }
// };

// // ✏️ Update activity
// exports.updateActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid activity ID'
//       });
//     }

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name is required'
//       });
//     }

//     const existingActivity = await FitnessActivity.findOne({
//       _id: { $ne: id },
//       name: name.trim()
//     });

//     if (existingActivity) {
//       return res.status(409).json({
//         success: false,
//         message: 'Another activity with this name already exists'
//       });
//     }

//     const updatedActivity = await FitnessActivity.findByIdAndUpdate(
//       id,
//       {
//         name: name.trim(),
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedActivity) {
//       return res.status(404).json({
//         success: false,
//         message: 'Activity not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Activity updated successfully',
//       data: updatedActivity
//     });

//   } catch (error) {
//     console.error('updateActivity error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update activity',
//       error: error.message
//     });
//   }
// };

// // ❌ Delete activity
// exports.deleteActivity = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid activity ID'
//       });
//     }

//     const deletedActivity = await FitnessActivity.findByIdAndDelete(id);

//     if (!deletedActivity) {
//       return res.status(404).json({
//         success: false,
//         message: 'Activity not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Activity deleted successfully'
//     });

//   } catch (error) {
//     console.error('deleteActivity error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete activity',
//       error: error.message
//     });
//   }
// };

// // working code


// const FitnessActivity = require('../models/fitnessActivity');
// const mongoose = require('mongoose');

// // Create activity
// exports.createActivity = async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name is required'
//       });
//     }

//     const existingActivity = await FitnessActivity.findOne({
//       name: name.trim()
//     });

//     if (existingActivity) {
//       return res.status(409).json({
//         success: false,
//         message: 'Activity already exists'
//       });
//     }

//     const activity = await FitnessActivity.create({
//       name: name.trim()
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Activity created successfully',
//       data: activity
//     });

//   } catch (error) {
//     console.error('createActivity error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to create activity',
//       error: error.message
//     });
//   }
// };

// // Get all activities
// exports.getActivities = async (req, res) => {
//   try {
//     const activities = await FitnessActivity.find().sort({ name: 1 });

//     return res.status(200).json({
//       success: true,
//       count: activities.length,
//       data: activities
//     });

//   } catch (error) {
//     console.error('getActivities error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch activities',
//       error: error.message
//     });
//   }
// };

// // Get activity by id
// exports.getActivityById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid activity ID'
//       });
//     }

//     const activity = await FitnessActivity.findById(id);

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: 'Activity not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: activity
//     });

//   } catch (error) {
//     console.error('getActivityById error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch activity',
//       error: error.message
//     });
//   }
// };

// // Update activity
// exports.updateActivity = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid activity ID'
//       });
//     }

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name is required'
//       });
//     }

//     const existingActivity = await FitnessActivity.findOne({
//       _id: { $ne: id },
//       name: name.trim()
//     });

//     if (existingActivity) {
//       return res.status(409).json({
//         success: false,
//         message: 'Another activity with this name already exists'
//       });
//     }

//     const updatedActivity = await FitnessActivity.findByIdAndUpdate(
//       id,
//       { name: name.trim() },
//       { new: true, runValidators: true }
//     );

//     if (!updatedActivity) {
//       return res.status(404).json({
//         success: false,
//         message: 'Activity not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Activity updated successfully',
//       data: updatedActivity
//     });

//   } catch (error) {
//     console.error('updateActivity error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update activity',
//       error: error.message
//     });
//   }
// };

// // Delete activity
// exports.deleteActivity = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid activity ID'
//       });
//     }

//     const deletedActivity = await FitnessActivity.findByIdAndDelete(id);

//     if (!deletedActivity) {
//       return res.status(404).json({
//         success: false,
//         message: 'Activity not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Activity deleted successfully'
//     });

//   } catch (error) {
//     console.error('deleteActivity error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete activity',
//       error: error.message
//     });
//   }
// };