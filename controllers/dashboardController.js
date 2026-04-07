const Member = require('../models/FitnessMember');

exports.getDashboardData = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();

    const activeMembers = await Member.countDocuments({
      status: { $regex: /^active$/i }
    });

    res.json({
      totalMembers,
      activeMembers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};