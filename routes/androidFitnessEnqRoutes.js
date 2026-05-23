const express = require("express");

const router = express.Router();

const {
  getFitnessActivities,
  createFitnessEnquiry
} = require("../controllers/androidFitnessEnqController");


// ===============================
// GET FITNESS ACTIVITIES
// ===============================

router.get(
  "/activities",
  getFitnessActivities
);


// ===============================
// CREATE FITNESS ENQUIRY
// ===============================

router.post(
  "/enquiry",
  createFitnessEnquiry
);

module.exports = router;