const express = require("express");

const router = express.Router();

const {
  getSchoolActivities,
  createSchoolEnquiry
} = require("../controllers/androidSchoolEnqController");


// ===============================
// GET SCHOOL ACTIVITIES
// ===============================

router.get(
  "/activities",
  getSchoolActivities
);


// ===============================
// CREATE SCHOOL ENQUIRY
// ===============================

router.post(
  "/enquiry",
  createSchoolEnquiry
);

module.exports = router;