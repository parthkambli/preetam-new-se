// const FitnessActivity = require('../models/FitnessActivity');

// exports.getMySchedule = async (req, res) => {
//   try {
//     const staffId = req.admin?.id;

//     const activities = await FitnessActivity.find({
//       'slots.staffId': staffId
//     });

//     const data = [];

//     activities.forEach(activity => {
//       activity.slots.forEach(slot => {
//         if (String(slot.staffId) === String(staffId)) {
//           data.push({
//             activityId: activity._id,
//             activityName: activity.name,
//             capacity: activity.capacity,
//             startTime: slot.startTime,
//             endTime: slot.endTime
//           });
//         }
//       });
//     });

//     return res.json({
//       success: true,
//       data
//     });

//   } catch (error) {
//     console.error('getMySchedule error:', error);
//     console.log("LOGGED IN STAFF ID 👉", req.admin?.id);
// console.log("MATCHED DATA 👉", data);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch schedule'
//     });
//   }
// };

// exports.getAvailableActivities = async (req, res) => {
//   try {
//     const staffId = req.admin?.id;

//     const activities = await FitnessActivity.find({
//       'slots.staffId': staffId
//     });

//     const data = [];

//     activities.forEach(activity => {
//       activity.slots.forEach(slot => {
//         if (String(slot.staffId) === String(staffId)) {
//           data.push({
//             activityId: activity._id,
//             activityName: activity.name,
//             capacity: activity.capacity,
//             startTime: slot.startTime,
//             endTime: slot.endTime
//           });
//         }
//       });
//     });

//     return res.json({
//       success: true,
//       data
//     });

//   } catch (error) {
//     console.error('getAvailableActivities error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch activities'
//     });
//   }
// };


///////////////








/////////////////////////

// // 
// const mongoose = require('mongoose');
// const FitnessActivity = require('../models/FitnessActivity');

// function getLoggedInStaffId(req) {
//   return (
//     req.admin?.staffId ||
//     req.admin?._id ||
//     req.admin?.id ||
//     req.admin?.userId ||
//     null
//   );
// }

// exports.getMySchedule = async (req, res) => {
//   try {
//     const rawStaffId = getLoggedInStaffId(req);

//     if (!rawStaffId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Staff ID not found in token'
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(rawStaffId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid staff ID in token'
//       });
//     }

//     const staffId = new mongoose.Types.ObjectId(rawStaffId);

//     const activities = await FitnessActivity.find({
//       'slots.staffId': staffId
//     });

//     const data = [];

//     activities.forEach((activity) => {
//       activity.slots.forEach((slot) => {
//         if (slot.staffId && String(slot.staffId) === String(staffId)) {
//           data.push({
//             activityId: activity._id,
//             activityName: activity.name,
//             capacity: activity.capacity,
//             startTime: slot.startTime,
//             endTime: slot.endTime,
//             slotId: slot._id
//           });
//         }
//       });
//     });

//     return res.json({
//       success: true,
//       data
//     });
//   } catch (error) {
//     console.error('getMySchedule error:', error);
//     console.log('LOGGED IN STAFF TOKEN DATA 👉', req.admin);

//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch schedule'
//     });
//   }
// };

// exports.getAvailableActivities = async (req, res) => {
//   try {
//     const rawStaffId = getLoggedInStaffId(req);

//     if (!rawStaffId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Staff ID not found in token'
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(rawStaffId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid staff ID in token'
//       });
//     }

//     const staffId = new mongoose.Types.ObjectId(rawStaffId);

//     const activities = await FitnessActivity.find({
//       'slots.staffId': staffId
//     });

//     const data = [];

//     activities.forEach((activity) => {
//       activity.slots.forEach((slot) => {
//         if (slot.staffId && String(slot.staffId) === String(staffId)) {
//           data.push({
//             activityId: activity._id,
//             activityName: activity.name,
//             capacity: activity.capacity,
//             startTime: slot.startTime,
//             endTime: slot.endTime,
//             slotId: slot._id
//           });
//         }
//       });
//     });

//     return res.json({
//       success: true,
//       data
//     });
//   } catch (error) {
//     console.error('getAvailableActivities error:', error);
//     console.log('LOGGED IN STAFF TOKEN DATA 👉', req.admin);

//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch activities'
//     });
//   }
// };



















// const mongoose = require("mongoose");
// const FitnessActivity = require("../models/FitnessActivity");
// const FitnessBooking = require("../models/FitnessBooking");
// const FitnessStaff = require("../models/FitnessStaff"); // <-- add this

// function getTodayDateString() {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, "0");
//   const day = String(today.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// async function resolveLoggedInStaffObjectId(req) {
//   const tokenStaffId = req.admin?.userId;

//   const tokenUserId = req.admin?.userId || null;

//   console.log("REQ.ADMIN 👉", req.admin);
//   console.log("TOKEN STAFF ID 👉", tokenStaffId);
//   console.log("TOKEN USER ID 👉", tokenUserId);

//   // 1) Try direct Mongo ObjectId from token
//   if (tokenStaffId && mongoose.Types.ObjectId.isValid(tokenStaffId)) {
//     const staffById = await FitnessStaff.findById(tokenStaffId).select("_id userId");
//     if (staffById) {
//       console.log("STAFF FOUND BY TOKEN ID 👉", staffById._id.toString());
//       return staffById._id;
//     }
//   }

//   // 2) Fallback: find by userId from token
//   if (tokenUserId) {
//     const staffByUserId = await FitnessStaff.findOne({ userId: tokenUserId }).select("_id userId");
//     if (staffByUserId) {
//       console.log("STAFF FOUND BY USER ID 👉", staffByUserId._id.toString());
//       return staffByUserId._id;
//     }
//   }

//   return null;
// }

// exports.getMySchedule = async (req, res) => {
//   try {
//     const staffObjectId = await resolveLoggedInStaffObjectId(req);

//     if (!staffObjectId) {
//       return res.status(404).json({
//         success: false,
//         message: "Logged in staff not found",
//       });
//     }

//     const selectedDate = req.query.date || getTodayDateString();

//     console.log("ORG ID 👉", req.organizationId);
//     console.log("DB NAME 👉", mongoose.connection.name);
//     console.log("FINAL STAFF OBJECT ID 👉", staffObjectId.toString());
//     console.log("SELECTED DATE 👉", selectedDate);

//     const activities = await FitnessActivity.find({
//       "slots.staffId": staffObjectId,
//     }).lean();

//     console.log("FOUND ACTIVITIES 👉", activities.length);

//     const data = [];

//     for (const activity of activities) {
//       for (const slot of activity.slots || []) {
//         if (slot.staffId && String(slot.staffId) === String(staffObjectId)) {
//           const bookings = await FitnessBooking.find({
//             activityId: activity._id,
//             slotId: slot._id,
//             date: selectedDate,
//           })
//             .populate("memberId", "name")
//             .lean();

//           data.push({
//             activityId: activity._id,
//             activityName: activity.name,
//             capacity: activity.capacity,
//             startTime: slot.startTime,
//             endTime: slot.endTime,
//             slotId: slot._id,
//             participants: bookings.map((booking) => ({
//               bookingId: booking._id,
//               name: booking.memberId?.name || booking.customerName || "Participant",
//               customerName: booking.customerName || "",
//               phone: booking.phone || "",
//             })),
//           });
//         }
//       }
//     }

//     return res.json({
//       success: true,
//       date: selectedDate,
//       count: data.length,
//       data,
//     });
//   } catch (error) {
//     console.error("getMySchedule error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch schedule",
//     });
//   }
// };

// exports.getAvailableActivities = async (req, res) => {
//   try {
//     const staffId = await getLoggedInStaffObjectId(req);

//     if (!staffId) {
//       return res.status(401).json({
//         success: false,
//         message: "Staff not found"
//       });
//     }
//     const selectedDate = req.query.date || getTodayDateString();

//     const activities = await FitnessActivity.find({
//       "slots.staffId": staffObjectId,
//     }).lean();

//     const data = [];

//     for (const activity of activities) {
//       for (const slot of activity.slots || []) {
//         if (slot.staffId && String(slot.staffId) === String(staffObjectId)) {
//           const bookedCount = await FitnessBooking.countDocuments({
//             activityId: activity._id,
//             slotId: slot._id,
//             date: selectedDate,
//           });

//           data.push({
//             activityId: activity._id,
//             activityName: activity.name,
//             capacity: activity.capacity,
//             startTime: slot.startTime,
//             endTime: slot.endTime,
//             slotId: slot._id,
//             bookedCount,
//             remainingSeats: Math.max(activity.capacity - bookedCount, 0),
//           });
//         }
//       }
//     }

//     return res.json({
//       success: true,
//       date: selectedDate,
//       count: data.length,
//       data,
//     });
//   } catch (error) {
//     console.error("getAvailableActivities error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch activities",
//     });
//   }
// };







const mongoose = require("mongoose");
const User = require("../models/User");
const FitnessActivity = require("../models/FitnessActivity");
const FitnessBooking = require("../models/FitnessBooking");
const FitnessStaff = require("../models/FitnessStaff");
const FitnessAttendance = require("../models/FitnessAttendance");
const FitnessMember = require("../models/FitnessMember");

const FitnessEvent = require("../models/FitnessEvent");
const { getTodayIST } = require("../utils/date");

function getTodayDateString() {
  // return new Date().toISOString().split("T")[0];
  return getTodayIST()
}
const resolveLoggedInStaffObjectId = async (req) => {
  try {
    // Support both admin & user tokens
    const currentUser = req.user || req.admin;

    if (!currentUser) return null;

    const userId = currentUser.userId;
    const organizationId = req.organizationId;

    const user = await User.findOne({
      userId,
      organizationId,
      role: "FitnessStaff",
    }).lean();

    if (!user) return null;

    // ✅ PRIMARY: staffId (correct mapping)
    if (user.staffId && mongoose.Types.ObjectId.isValid(user.staffId)) {
      return new mongoose.Types.ObjectId(user.staffId);
    }

    // ⚠️ FALLBACK: linkedId (your existing logic fallback)
    if (user.linkedId && mongoose.Types.ObjectId.isValid(user.linkedId)) {
      return new mongoose.Types.ObjectId(user.linkedId);
    }

    return null;
  } catch (err) {
    console.error("resolveLoggedInStaffObjectId error:", err.message);
    return null;
  }
};


exports.getMySchedule = async (req, res) => {
  try {
    const staffObjectId = await resolveLoggedInStaffObjectId(req);

    if (!staffObjectId) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const selectedDate = req.query.date || getTodayDateString();

    const activities = await FitnessActivity.find({
      "slots.staffId": staffObjectId,
    }).lean();

    const data = [];

    // Current server time
    const now = new Date();

    for (const activity of activities) {
      for (const slot of activity.slots || []) {
        if (String(slot.staffId) === String(staffObjectId)) {

          const bookings = await FitnessBooking.find({
            activityId: activity._id,
            slotId: slot._id,
            date: selectedDate,
          })
            .populate("memberId", "name")
            .lean();

          // Create slot end datetime
          const slotEndDateTime = new Date(
            `${selectedDate}T${slot.endTime || slot.startTime}`
          );

          // Backend status logic
          const status =
            now >= slotEndDateTime ? "Completed" : "Pending";

          data.push({
            activityId: activity._id,
            activityName: activity.name,
            capacity: activity.capacity,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotId: slot._id,

            // ✅ Added status
            status,

            participants: bookings.map((b) => ({
              bookingId: b._id,
              name: b.memberId?.name || b.customerName || "Participant",
              customerName: b.customerName || "",
              phone: b.phone || "",
            })),
          });
        }
      }
    }

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("getMySchedule error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch schedule",
    });
  }
};

exports.getAvailableActivities = async (req, res) => {
  try {
    const staffObjectId = await resolveLoggedInStaffObjectId(req);

    if (!staffObjectId) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const selectedDate = req.query.date || getTodayDateString();

    const activities = await FitnessActivity.find({
      "slots.staffId": staffObjectId,
    }).lean();

    const data = [];

    for (const activity of activities) {
      for (const slot of activity.slots || []) {
        if (String(slot.staffId) === String(staffObjectId)) {
          const bookedCount = await FitnessBooking.countDocuments({
            activityId: activity._id,
            slotId: slot._id,
            date: selectedDate,
          });

          data.push({
            activityId: activity._id,
            activityName: activity.name,
            capacity: activity.capacity,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotId: slot._id,
            bookedCount,
            remainingSeats: Math.max(activity.capacity - bookedCount, 0),
          });
        }
      }
    }

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("getAvailableActivities error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};







exports.getAttendanceByDate = async (req, res) => {
  try {
    const staffObjectId = await resolveLoggedInStaffObjectId(req);

    if (!staffObjectId) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const selectedDate = req.query.date || getTodayDateString();

 

    const activities = await FitnessActivity.find({
      "slots.staffId": staffObjectId,
    }).lean();

    const data = [];

    for (const activity of activities) {
      for (const slot of activity.slots || []) {
        if (String(slot.staffId) !== String(staffObjectId)) continue;

        // 1. Get bookings
        const rawBookings =
  await FitnessBooking.find({
    activityId: activity._id,
    slotId: slot._id,
    date: selectedDate,
  })
  .populate({
    path: "memberId",
    select:
      "name activityFees"
  })
  .lean();

const bookings =
  rawBookings.filter((booking) => {

    const member =
      booking.memberId;

    if (!member) return true;

    const activeMembership =
      member.activityFees?.find((af) => {

      const start =
  af.startDate
    ? new Date(af.startDate)
        .toISOString()
        .split("T")[0]
    : null;

const end =
  af.endDate
    ? new Date(af.endDate)
        .toISOString()
        .split("T")[0]
    : null;

const selected = selectedDate;

        return (
          String(af.activity) ===
          String(activity._id) &&

          start &&
          end &&

          selected >= start &&
          selected <= end
        );
      });

    return !!activeMembership;
  });

        const now = new Date();

        const todayIST = getTodayIST();

// ✅ Can mark attendance ONLY for today
const canMarkAttendance =
  selectedDate === todayIST;


        // 2. Get attendance records
       const attendanceRecords =
  await FitnessAttendance.find({
    activity: activity._id,
    attendanceDate: {
      $gte: new Date(
        `${selectedDate}T00:00:00.000Z`
      ),
      $lt: new Date(
        `${selectedDate}T23:59:59.999Z`
      )
    },
    organizationId:
      req.organizationId,
  }).lean();

        // 3. Create attendance map
        const attendanceMap = {};

        attendanceRecords.forEach((a) => {
          attendanceMap[a.member.toString()] = a.status;
        });

        // 4. Merge participant data
        const participants = bookings.map((b) => {
          const memberId = b.memberId?._id?.toString();
 

          let finalStatus = "Not Marked";

// ✅ Present attendance exists
if (memberId && attendanceMap[memberId]) {

  finalStatus = attendanceMap[memberId];

} else {

  const todayIST = getTodayIST();

  // ✅ Past dates without attendance
  // become Absent dynamically
  if (selectedDate < todayIST) {
    finalStatus = "Absent";
  }
}

          return {
            name: b.memberId?.name || b.customerName || "Participant",
            status: finalStatus,
          };
        });

        // 5. Counts
        const total = participants.length;

        const present = participants.filter(
          (p) => p.status === "Present"
        ).length;

        const absent = participants.filter(
          (p) => p.status === "Absent"
        ).length;

        // 6. Slot status

const status =
  selectedDate < todayIST
    ? "Completed"
    : selectedDate === todayIST
      ? "Ongoing"
      : "Upcoming";

        data.push({
          activityId: activity._id,
          activityName: activity.name,
          slotId: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          total,
          present,
          absent,
          status,
          canMarkAttendance,
          participants,
        });
      }
    }

    return res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {
    console.error("getAttendanceByDate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};

exports.getStaffProfile = async (req, res) => {
  try {
    console.log("USER:", req.user);

    // Find logged-in user with organization check
    const user = await User.findOne({
      userId: req.user.userId,
      organizationId: req.organizationId
    }).lean();

    if (!user || !user.staffId) {
      return res.json({
        success: true,
        data: {
          name: "Staff",
          mobile: "",
          email: "",
          role: "",
          assignedActivities: [],
          profileImage: ""
        }
      });
    }

    // Find linked staff
    const staff = await FitnessStaff.findById(user.staffId).lean();

    console.log("STAFF:", staff);

    if (!staff) {
      return res.json({
        success: true,
        data: {
          name: "Staff",
          mobile: "",
          email: "",
          role: "",
          assignedActivities: [],
          profileImage: "",
        }
      });
    }

    // Fetch assigned activities
    const activities = await FitnessActivity.find({
      "slots.staffId": staff._id
    })
      .select("name")
      .lean();


    return res.json({
      success: true,
      data: {
        name: staff.fullName || "Staff",
        mobile: staff.mobileNumber || "",
        email: staff.emailId || "",
        role: staff.role || "",

        finalPermissions:
          user.finalPermissions || [],

        assignedActivities:
          activities.map(a => a.name),

        profileImage: staff.profilePhoto
          ? `${req.protocol}://${req.get("host")}${staff.profilePhoto}`
          : ""
      }
    });


  } catch (error) {
    console.error("getStaffProfile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};




exports.getStaffEvents = async (req, res) => {
  try {
    console.log("🔥 EVENTS API HIT");
    console.log("ORG ID:", req.organizationId);

    const events = await FitnessEvent.find({})
      .sort({ date: 1, startTime: 1 })
      .lean();

    console.log("EVENTS FOUND:", events);

    return res.json({
      success: true,
      count: events.length,
      data: events,
    });

  } catch (error) {
    console.error("❌ getStaffEvents ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message, // IMPORTANT
    });
  }
};

// ================= GATEKEEPER QR FLOW =================
// working controller --->
// exports.handleQRScan = async (req, res) => {
//   try {
//     const { memberId } = req.body;
//     const organizationId = req.organizationId;

//     if (!memberId) {
//       return res.status(400).json({
//         success: false,
//         message: "memberId required"
//       });
//     }

//     // 🔥 STEP 1: Resolve logged-in staff
//     const staffObjectId = await resolveLoggedInStaffObjectId(req);

//     if (!staffObjectId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized staff"
//       });
//     }

//     // 🔥 STEP 2: Validate member
//     const member = await FitnessMember.findOne({
//       memberId,
//       organizationId
//     }).populate("activityFees.activity", "name slots");

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // 🔥 STEP 3: Get ONLY activities assigned to THIS staff
//     const allowedActivities = member.activityFees.filter((af) => {
//       if (af.membershipStatus !== "Active") return false;

//       const activity = af.activity;

//       if (!activity || !activity.slots) return false;

//       // ✅ Check if this staff is assigned in any slot
//       return activity.slots.some(
//         (slot) => String(slot.staffId) === String(staffObjectId)
//       );
//     });

//     if (allowedActivities.length === 0) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this member's activity"
//       });
//     }

//     // 🔥 STEP 4: AUTO MARK if only one valid activity
//     if (allowedActivities.length === 1) {
//       const af = allowedActivities[0];

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      

//       const attendance = await FitnessAttendance.findOneAndUpdate(
//         {
//           member: member._id,
//           activity: af.activity._id,
//           activityFeeId: af._id,
//           attendanceDate: today
//         },
//         {
//           member: member._id,
//           activity: af.activity._id,
//           activityFeeId: af._id,
//           attendanceDate: today,
//           markedBy: req.user?._id || req.admin?._id,
//           status: "Present",
//           organizationId
//         },
//         { upsert: true, new: true }
//       );

//       return res.json({
//         success: true,
//         autoMarked: true,
//         member: {
//           name: member.name,
//           memberId: member.memberId
//         },
//         activity: af.activity.name,
//         attendance
//       });
//     }

//     // 🔥 STEP 5: MULTIPLE → RETURN ONLY ALLOWED ACTIVITIES
//     return res.json({
//       success: true,
//       autoMarked: false,
//       member: {
//         name: member.name,
//         memberId: member.memberId
//       },
//       activities: allowedActivities.map((af) => ({
//         activityFeeId: af._id,
//         activityId: af.activity?._id,
//         activityName: af.activity?.name
//       }))
//     });

//   } catch (err) {
//     console.error("handleQRScan error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };
// <---

exports.handleQRScan = async (req, res) => {
  try {
    const { memberId } = req.body;
    const organizationId = req.organizationId;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "memberId required"
      });
    }

    // 🔥 STEP 1: Resolve logged-in staff
    const staffObjectId = await resolveLoggedInStaffObjectId(req);

    if (!staffObjectId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized staff"
      });
    }

    // 🔥 STEP 2: Validate member
    const member = await FitnessMember.findOne({
      memberId,
      organizationId
    }).populate("activityFees.activity", "name slots");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // 🔥 STEP 3: Get ONLY activities assigned to THIS staff
    // const allowedActivities = member.activityFees.filter((af) => {
    //   if (af.membershipStatus !== "Active") return false;

    //   const activity = af.activity;

    //   if (!activity || !activity.slots) return false;

    //   // ✅ Check if this staff is assigned in any slot
    //   return activity.slots.some(
    //     (slot) => String(slot.staffId) === String(staffObjectId)
    //   );
    // });

   const allowedActivities =
  member.activityFees.filter((af) => {

    return (
      af.membershipStatus ===
        "Active" &&
      af.activity
    );
}); 

    // if (allowedActivities.length === 0) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "You are not assigned to this member's activity"
    //   });
    // }

    // ======================================
// MEMBERSHIP PASS MEMBER
// ======================================

if (member.membershipPass) {

  const todayIST = getTodayIST();

  const today =
    new Date(
      `${todayIST}T12:00:00.000Z`
    );

  const existing =
    await FitnessAttendance.findOne({
      member: member._id,
      attendanceDate: today
    });

  if (!existing) {

    await FitnessAttendance.create({

      member: member._id,

      activity: null,

      activityFeeId: null,

      attendanceDate: today,

      markedBy: staffObjectId,

      status: "Present",

      organizationId
    });
  }

  return res.json({

    success: true,

    autoMarked: true,

    isMembershipPass: true,

    alreadyMarked: !!existing,

    message: existing
      ? "Attendance already marked"
      : "Membership pass attendance marked",

    member: {
      name: member.name,
      memberId: member.memberId
    },

    numberOfPersons:
      member.numberOfPersons || 1
  });
}

    // 🔥 STEP 4: AUTO MARK if only one valid activity
    if (allowedActivities.length === 1) {
      const af = allowedActivities[0];

const todayIST = getTodayIST();

const today =
  new Date(
    `${todayIST}T12:00:00.000Z`
  );

      // ✅ CHECK IF ALREADY MARKED (ADD THIS)
const existing = await FitnessAttendance.findOne({
  member: member._id,
  activity: af.activity._id,
  activityFeeId: af._id,
  attendanceDate: today
});
      

      const attendance = await FitnessAttendance.findOneAndUpdate(
        {
          member: member._id,
          activity: af.activity._id,
          activityFeeId: af._id,
          attendanceDate: today
        },
        {
          member: member._id,
          activity: af.activity._id,
          activityFeeId: af._id,
          attendanceDate: today,
          markedBy: staffObjectId,
          status: "Present",
          organizationId
        },
        { upsert: true, new: true }
      );

      return res.json({
  success: true,
  autoMarked: true,
  alreadyMarked: !!existing, // ✅ NEW (SAFE)
  message: existing 
    ? "Attendance already marked"
    : "Attendance marked successfully", // ✅ NEW
  member: {
    name: member.name,
    memberId: member.memberId
  },
  activity: af.activity.name,
  attendance
});
    }

    // 🔥 STEP 5: MULTIPLE → RETURN ONLY ALLOWED ACTIVITIES
    return res.json({
  success: true,
  autoMarked: false,
  message: "Multiple activities found", // ✅ ADD THIS
  member: {
    name: member.name,
    memberId: member.memberId
  },
  activities: allowedActivities.map((af) => ({
        activityFeeId: af._id,
        activityId: af.activity?._id,
        activityName: af.activity?.name
      }))
    });

  } catch (err) {
    console.error("handleQRScan error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};





// exports.handleQRScan = async (req, res) => {
//   try {
//     const { memberId } = req.body;
//     const organizationId = req.organizationId;

//     if (!memberId) {
//       return res.status(400).json({ success: false, message: "memberId required" });
//     }

//     // 1️⃣ Validate member
//     const member = await FitnessMember.findOne({
//       memberId,
//       organizationId
//     }).populate("activityFees.activity", "name");

//     if (!member) {
//       return res.status(404).json({ success: false, message: "Member not found" });
//     }

//     // 2️⃣ Get active activities
//     const activeActivities = member.activityFees.filter(
//       (af) => af.membershipStatus === "Active"
//     );

//     if (activeActivities.length === 0) {
//       return res.json({
//         success: false,
//         message: "No active activities"
//       });
//     }

//     // 3️⃣ If only ONE → auto mark attendance
//     if (activeActivities.length === 1) {
//       const af = activeActivities[0];

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const attendance = await FitnessAttendance.findOneAndUpdate(
//         {
//           member: member._id,
//           activity: af.activity,
//           activityFeeId: af._id,
//           attendanceDate: today
//         },
//         {
//           member: member._id,
//           activity: af.activity,
//           activityFeeId: af._id,
//           attendanceDate: today,
//           markedBy: req.user?._id || req.admin?._id,
//           status: "Present",
//           organizationId
//         },
//         { upsert: true, new: true }
//       );

//       return res.json({
//         success: true,
//         autoMarked: true,
//         member: {
//           name: member.name,
//           memberId: member.memberId
//         },
//         activity: af.activity,
//         attendance
//       });
//     }

//     // 4️⃣ Multiple → return selection list
//     return res.json({
//       success: true,
//       autoMarked: false,
//       member: {
//         name: member.name,
//         memberId: member.memberId
//       },
//       activities: activeActivities.map((af) => ({
//         activityFeeId: af._id,
//         activityId: af.activity?._id,
//         activityName: af.activity?.name
//       }))
//     });

//   } catch (err) {
//     console.error("handleQRScan error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.getAllStaffForStaff = async (req, res) => {
  try {
    const staff = await FitnessStaff.find({})
      .select("fullName mobileNumber emailId role")
      .lean();

    return res.json({
      success: true,
      count: staff.length,
      data: staff,
    });

  } catch (err) {
    console.error("getAllStaffForStaff error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
    });
  }
};

exports.getAllMembersForStaff = async (req, res) => {
  try {
    const staffObjectId = await resolveLoggedInStaffObjectId(req);

    if (!staffObjectId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized staff",
      });
    }

    // ✅ Pagination params (defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Base filter (unchanged logic)
    const filter = {
      organizationId: req.organizationId
    };

    // ✅ Total count (for frontend pagination UI)
    const total = await FitnessMember.countDocuments(filter);

    // ✅ Paginated data
    const members = await FitnessMember.find(filter)
      .select("name memberId mobile membershipStatus activityFees")
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      count: members.length,
      data: members,

      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });

  } catch (err) {
    console.error("getAllMembersForStaff error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
};