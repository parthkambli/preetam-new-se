const FitnessActivity = require('../models/FitnessActivity');
const mongoose = require('mongoose');

// ➕ Create activity
exports.createActivity = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const existingActivity = await FitnessActivity.findOne({
      name: name.trim()
    });

    if (existingActivity) {
      return res.status(409).json({
        success: false,
        message: 'Activity already exists'
      });
    }

    const activity = await FitnessActivity.create({
      name: name.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });

  } catch (error) {
    console.error('createActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  }
};

// 📄 Get all activities
exports.getActivities = async (req, res) => {
  try {
    const activities = await FitnessActivity.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error('getActivities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// 🔍 Get activity by id
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
    }

    const activity = await FitnessActivity.findById(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('getActivityById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

// ✏️ Update activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const existingActivity = await FitnessActivity.findOne({
      _id: { $ne: id },
      name: name.trim()
    });

    if (existingActivity) {
      return res.status(409).json({
        success: false,
        message: 'Another activity with this name already exists'
      });
    }

    const updatedActivity = await FitnessActivity.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: updatedActivity
    });

  } catch (error) {
    console.error('updateActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

// ❌ Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
    }

    const deletedActivity = await FitnessActivity.findByIdAndDelete(id);

    if (!deletedActivity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('deleteActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
};




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