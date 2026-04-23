const AccessRole = require('../models/AccessRole');
const { PERMISSIONS } = require('../utils/permissions');

const allowPermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.identity) {
        return res.status(403).json({ message: 'No identity found' });
      }

      // Admin override
      if (req.identity.isAdmin) {
        return next();
      }

      let userPermissions = [];

      // 🔥 Try DB-based role first
      if (req.user?.id) {
        const user = await require('../models/User')
          .findById(req.user.id)
          .populate('accessRoleId')
          .lean();

        if (user?.accessRoleId?.permissions) {
          userPermissions = user.accessRoleId.permissions;
        }
      }

      // 🔁 Fallback to static role permissions
      if (userPermissions.length === 0) {
        const role = req.identity.role;
        userPermissions = PERMISSIONS[role] || [];
      }

      const hasPermission = requiredPermissions.every(p =>
        userPermissions.includes(p)
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Permission denied',
        });
      }

      next();

    } catch (err) {
      console.error('Permission error:', err.message);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

module.exports = { allowPermissions };








// const { PERMISSIONS } = require('../utils/permissions');

// const allowPermissions = (...requiredPermissions) => {
//   return (req, res, next) => {
//     try {
//       if (!req.identity) {
//         return res.status(403).json({ message: 'No identity found' });
//       }

//       // Admin override (super important)
//       if (req.identity.isAdmin) {
//         return next();
//       }

//       const role = req.identity.role;
//       const rolePermissions = PERMISSIONS[role] || [];

//       const hasPermission = requiredPermissions.every(p =>
//         rolePermissions.includes(p)
//       );

//       if (!hasPermission) {
//         return res.status(403).json({
//           message: `Permission denied for role: ${role}`,
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