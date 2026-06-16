const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    bookedCount: {
      type: Number,
      default: 0,
    },

    oneDayFee: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Service", serviceSchema);