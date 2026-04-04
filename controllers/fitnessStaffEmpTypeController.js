// controllers/employmentType.controller.js

const EmploymentType = require("../models/FitnessStaffEmpType");

exports.createType = async (req, res) => {
  const { name } = req.body;

  const exists = await EmploymentType.findOne({ name });
  if (exists) return res.status(400).json({ message: "Already exists" });

  const type = await EmploymentType.create({ name });

  res.status(201).json(type);
};

exports.getTypes = async (req, res) => {
  const types = await EmploymentType.find();
  res.json(types);
};

exports.deleteType = async (req, res) => {
  await EmploymentType.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};