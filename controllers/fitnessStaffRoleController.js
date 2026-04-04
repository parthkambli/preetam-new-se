
const Role = require("../models/FitnessStaffRole");

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await Role.findOne({ name });
    if (exists) return res.status(400).json({ message: "Role exists" });

    const role = await Role.create({ name });

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