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
   ➕ CREATE ACTIVITY
========================= */
exports.createActivity = async (req, res) => {
  try {
    const { name, capacity, slots } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!capacity || capacity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid capacity required' });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one slot required' });
    }

    // validate slots
    for (let slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Invalid slot data'
        });
      }
    }

    // overlap check
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlapping(slots[i], slots[j])) {
          return res.status(400).json({
            success: false,
            message: 'Slots cannot overlap'
          });
        }
      }
    }

    const existing = await FitnessActivity.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Activity already exists' });
    }

    const activity = await FitnessActivity.create({
      name: name.trim(),
      capacity,
      slots
    });

    res.status(201).json({
      success: true,
      message: 'Activity created',
      data: activity
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   📄 GET ALL
========================= */
exports.getActivities = async (req, res) => {
  try {
    const activities = await FitnessActivity.find().sort({ name: 1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   🔍 GET BY ID
========================= */
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const activity = await FitnessActivity.findById(id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

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
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name required' });
    }

    if (!capacity || capacity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid capacity required' });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'Slots required' });
    }

    // validate slots
    for (let slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({ success: false, message: 'Invalid slot data' });
      }
    }

    // overlap check
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlapping(slots[i], slots[j])) {
          return res.status(400).json({
            success: false,
            message: 'Slots cannot overlap'
          });
        }
      }
    }

    const existing = await FitnessActivity.findOne({
      _id: { $ne: id },
      name: name.trim()
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate activity name'
      });
    }

    const updated = await FitnessActivity.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        capacity,
        slots,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({
      success: true,
      message: 'Updated',
      data: updated
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   ❌ DELETE
========================= */
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await FitnessActivity.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

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
    const { activityId, date } = req.query;

    if (!activityId || !date) {
      return res.status(400).json({
        success: false,
        message: 'activityId and date required'
      });
    }

    const activity = await FitnessActivity.findById(activityId);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const result = [];

    for (let slot of activity.slots) {
      const count = await FitnessBooking.countDocuments({
        slotId: slot._id,
        date
      });

      result.push({
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: activity.capacity, // 🔥 FIXED
        booked: count
      });
    }

    res.json({ success: true, data: result });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   🎯 BOOK SLOT
========================= */
exports.bookSlot = async (req, res) => {
  try {
    const { activityId, slotId, date, customerName, phone } = req.body;

    if (!activityId || !slotId || !date || !customerName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields required'
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

    // ✅ COUNT BOOKINGS
    const count = await FitnessBooking.countDocuments({ slotId, date });

    if (count >= activity.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Slot Full'
      });
    }

    // ✅ OPTIONAL: prevent SAME user duplicate booking
    const alreadyBooked = await FitnessBooking.findOne({
      slotId,
      date,
      customerName
    });

    if (alreadyBooked) {
      return res.status(400).json({
        success: false,
        message: 'Member already booked this slot'
      });
    }

    await FitnessBooking.create({
      activityId,
      slotId,
      date,
      customerName,
      phone
    });

    res.json({
      success: true,
      message: 'Booking successful'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 📋 GET ALL BOOKINGS
// =========================
exports.getBookings = async (req, res) => {
  try {
    const bookings = await FitnessBooking.find()
      .populate('activityId')
      .sort({ createdAt: -1 });

    const formatted = bookings.map(b => {

      let activityName = 'N/A';
      let slotTime = 'N/A';

      if (b.activityId) {
        activityName = b.activityId.name;

        if (b.activityId.slots) {
          const slot = b.activityId.slots.id(b.slotId);
          if (slot) {
            slotTime = `${slot.startTime} - ${slot.endTime}`;
          }
        }
      }

      return {
        _id: b._id,
        customerName: b.customerName,
        activityName,
        slotTime,
        date: b.date
      };
    });

    res.json({
      success: true,
      data: formatted
    });

  } catch (err) {
    console.error("🔥 getBookings error:", err); // VERY IMPORTANT
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



// =========================
// 📋 CANCEL BOOKINGS
// =========================
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await FitnessBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await FitnessBooking.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

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