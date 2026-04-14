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


const mongoose = require('mongoose');
const FitnessActivity = require('../models/FitnessActivity');

function getLoggedInStaffId(req) {
  return (
    req.admin?.staffId ||
    req.admin?._id ||
    req.admin?.id ||
    req.admin?.userId ||
    null
  );
}

exports.getMySchedule = async (req, res) => {
  try {
    const rawStaffId = getLoggedInStaffId(req);

    if (!rawStaffId) {
      return res.status(401).json({
        success: false,
        message: 'Staff ID not found in token'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(rawStaffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID in token'
      });
    }

    const staffId = new mongoose.Types.ObjectId(rawStaffId);

    const activities = await FitnessActivity.find({
      'slots.staffId': staffId
    });

    const data = [];

    activities.forEach((activity) => {
      activity.slots.forEach((slot) => {
        if (slot.staffId && String(slot.staffId) === String(staffId)) {
          data.push({
            activityId: activity._id,
            activityName: activity.name,
            capacity: activity.capacity,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotId: slot._id
          });
        }
      });
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getMySchedule error:', error);
    console.log('LOGGED IN STAFF TOKEN DATA 👉', req.admin);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule'
    });
  }
};

exports.getAvailableActivities = async (req, res) => {
  try {
    const rawStaffId = getLoggedInStaffId(req);

    if (!rawStaffId) {
      return res.status(401).json({
        success: false,
        message: 'Staff ID not found in token'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(rawStaffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID in token'
      });
    }

    const staffId = new mongoose.Types.ObjectId(rawStaffId);

    const activities = await FitnessActivity.find({
      'slots.staffId': staffId
    });

    const data = [];

    activities.forEach((activity) => {
      activity.slots.forEach((slot) => {
        if (slot.staffId && String(slot.staffId) === String(staffId)) {
          data.push({
            activityId: activity._id,
            activityName: activity.name,
            capacity: activity.capacity,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotId: slot._id
          });
        }
      });
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('getAvailableActivities error:', error);
    console.log('LOGGED IN STAFF TOKEN DATA 👉', req.admin);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
};