





const User = require("../models/User");
const { PERMISSIONS } = require("../utils/permissions");

const allowPermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.identity) {
        return res.status(403).json({
          message: "No identity found"
        });
      }

      // ======================================
      // ADMIN OVERRIDE
      // ======================================
      if (req.identity.isAdmin) {
        return next();
      }

      let finalPermissions = [];

      // ======================================
      // PARTICIPANT (Fitness Member)
      // DO NOT CHECK User MODEL
      // ======================================
      if (req.identity.role === "Participant") {
        finalPermissions = PERMISSIONS["Participant"] || [];
      }

      // ======================================
      // STAFF / NORMAL USERS
      // CHECK User MODEL + ACCESS ROLE
      // ======================================
      // else if (req.user?.id) {
      //   const user = await User.findById(req.user.id)
      //     .populate("accessRoleId")
      //     .lean();

        else if (req.user?._id || req.user?.id) {
          const userId = req.user._id || req.user.id;

          const user = await User.findById(userId)
            .populate("accessRoleId")
            .lean();      

        finalPermissions = user?.finalPermissions || [];
      }

      // ======================================
      // DEBUG
      // ======================================
      console.log("========== PERMISSION DEBUG ==========");
      console.log("req.identity:", req.identity);
      console.log("req.user:", req.user);
      console.log("requiredPermissions:", requiredPermissions);
      console.log("finalPermissions:", finalPermissions);
      console.log("=====================================");

      const hasPermission = requiredPermissions.every(permission =>
        finalPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: "Permission denied"
        });
      }

      next();

    } catch (err) {
      console.error("Permission error:", err.message);

      return res.status(500).json({
        message: "Permission check failed"
      });
    }
  };
};

module.exports = { allowPermissions };