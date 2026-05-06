const AccessRole = require('../models/AccessRole');

const buildFinalPermissions = async (user) => {
  let rolePermissions = [];

  if (user.accessRoleId) {
    const role = await AccessRole.findById(user.accessRoleId)
      .select('permissions')
      .lean();

    rolePermissions = role?.permissions || [];
  }

  const custom = user.customPermissions || [];
  const removed = user.removedPermissions || [];

  return [
    ...new Set(
      [...rolePermissions, ...custom].filter(
        (p) => !removed.includes(p)
      )
    )
  ];
};

module.exports = buildFinalPermissions;