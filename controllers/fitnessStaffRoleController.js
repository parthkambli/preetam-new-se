
// const Role = require("../models/FitnessStaffRole");

// exports.createRole = async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name) return res.status(400).json({ message: "Name required" });

//     const exists = await Role.findOne({ name });
//     if (exists) return res.status(400).json({ message: "Role exists" });

//     const role = await Role.create({ name });

//     res.status(201).json(role);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getRoles = async (req, res) => {
//   const roles = await Role.find().sort({ createdAt: -1 });
//   res.json(roles);
// };

// exports.deleteRole = async (req, res) => {
//   await Role.findByIdAndDelete(req.params.id);
//   res.json({ message: "Deleted" });
// };










const Role = require("../models/FitnessStaffRole");
const AccessRole = require("../models/AccessRole"); // ✅ NEW

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await Role.findOne({ name });
    if (exists) return res.status(400).json({ message: "Role exists" });

    // ✅ 1. Create Fitness Role (UNCHANGED)
    const role = await Role.create({ name });

    // ✅ 2. Auto-create AccessRole (NEW - SAFE)
    try {
      const roleKey = name.toUpperCase().replace(/\s+/g, "_");

      const existingAccessRole = await AccessRole.findOne({
        roleKey,
        organizationId: req.organizationId
      });

      if (!existingAccessRole) {
        await AccessRole.create({
          name,
          roleKey,
          organizationId: req.organizationId,
          permissions: [
            'VIEW_OWN_SCHEDULE',
            'VIEW_ACTIVITIES',
            'VIEW_ATTENDANCE',
            'VIEW_EVENTS',
            'VIEW_STAFF',
            'VIEW_PARTICIPANTS'
          ],
          isDefault: false
        });
      }
    } catch (err) {
      console.error("AccessRole creation failed:", err.message);
      // ❗ DO NOT break main flow
    }

    // ✅ RESPONSE UNCHANGED
    res.status(201).json(role);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoles = async (req, res) => {
  const roles = await Role.find().sort({ createdAt: -1 });
  res.json(roles);
};

exports.deleteRole = async (req, res) => {
  await Role.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};