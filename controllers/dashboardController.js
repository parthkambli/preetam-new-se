const Member = require('../models/FitnessMember');

exports.getDashboardData = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();

    const activeMembers = await Member.countDocuments({
  membershipStatus: "Active"

    });

    res.json({
      totalMembers,
      activeMembers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};