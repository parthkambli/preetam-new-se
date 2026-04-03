
const mongoose = require("mongoose");

const FitnessStaffEmpTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model("FitnessStaffEmpType", FitnessStaffEmpTypeSchema);