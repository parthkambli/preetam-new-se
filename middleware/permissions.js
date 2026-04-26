// const AccessRole = require('../models/AccessRole');
// const { PERMISSIONS } = require('../utils/permissions');

// const allowPermissions = (...requiredPermissions) => {
//   return async (req, res, next) => {
//     try {
//       if (!req.identity) {
//         return res.status(403).json({ message: 'No identity found' });
//       }

//       // Admin override
//       if (req.identity.isAdmin) {
//         return next();
//       }

//       let userPermissions = [];

//       // 🔥 Try DB-based role first
//       if (req.user?.id) {
//         const user = await require('../models/User')
//           .findById(req.user.id)
//           .populate('accessRoleId')
//           .lean();

//         if (user?.accessRoleId?.permissions) {
//           userPermissions = user.accessRoleId.permissions;
//         }
//       }

//       // 🔁 Fallback to static role permissions
//       if (userPermissions.length === 0) {
//         const role = req.identity.role;
//         userPermissions = PERMISSIONS[role] || [];
//       }

//       const hasPermission = requiredPermissions.every(p =>
//         userPermissions.includes(p)
//       );

//       if (!hasPermission) {
//         return res.status(403).json({
//           message: 'Permission denied',
//         });
//       }

//       next();

//     } catch (err) {
//       console.error('Permission error:', err.message);
//       res.status(500).json({ message: 'Permission check failed' });
//     }
//   };
// };

// module.exports = { allowPermissions };







// const AccessRole = require('../models/AccessRole');
// const User = require('../models/User');
// const { PERMISSIONS } = require('../utils/permissions');

// const allowPermissions = (...requiredPermissions) => {
//   return async (req, res, next) => {
//     try {
//       if (!req.identity) {
//         return res.status(403).json({ message: 'No identity found' });
//       }

//       // Admin override
//       if (req.identity.isAdmin) {
//         return next();
//       }

//       let finalPermissions = [];

//       if (req.user?.id) {
//         const user = await User.findById(req.user.id)
//           .populate('accessRoleId')
//           .lean();

//         let rolePermissions = [];

//         // 🔹 Role permissions
//         if (user?.accessRoleId?.permissions) {
//           rolePermissions = user.accessRoleId.permissions;
//         } else {
//           rolePermissions = PERMISSIONS[req.identity.role] || [];
//         }

//         // 🔹 Apply overrides
//         const added = user.customPermissions || [];
//         const removed = user.removedPermissions || [];

//         finalPermissions = [
//           ...new Set([
//             ...rolePermissions.filter(p => !removed.includes(p)),
//             ...added
//           ])
//         ];
//       }

//       const hasPermission = requiredPermissions.every(p =>
//         finalPermissions.includes(p)
//       );

//       if (!hasPermission) {
//         return res.status(403).json({
//           message: 'Permission denied'
//         });
//       }

//       next();

//     } catch (err) {
//       console.error('Permission error:', err.message);
//       res.status(500).json({ message: 'Permission check failed' });
//     }
//   };
// };

// module.exports = { allowPermissions };







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

        let rolePermissions = [];

        if (user?.accessRoleId?.permissions) {
          rolePermissions = user.accessRoleId.permissions;
        } else {
          rolePermissions = PERMISSIONS[req.identity.role] || [];
        }

        const added = user?.customPermissions || [];
        const removed = user?.removedPermissions || [];

        finalPermissions = [
          ...new Set([
            ...rolePermissions.filter(p => !removed.includes(p)),
            ...added
          ])
        ];
      }

      // ======================================
      // DEBUG
      // ======================================
      console.log("========== PERMISSION DEBUG ==========");
      console.log("req.identity:", req.identity);
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