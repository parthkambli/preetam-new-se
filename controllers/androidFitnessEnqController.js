const mongoose = require("mongoose");

const FitnessEnquiry =
require("../models/FitnessEnquiry");

const FitnessActivity =
require("../models/FitnessActivity");


// =====================================================
// GET FITNESS ACTIVITIES
// =====================================================

exports.getFitnessActivities =
async (req, res) => {

  try {

    const activities =
      await FitnessActivity.find()
      .select("_id name")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: activities
    });

  } catch (err) {

    console.error(
      "getFitnessActivities error:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// =====================================================
// CREATE FITNESS ENQUIRY
// =====================================================

exports.createFitnessEnquiry =
async (req, res) => {

  try {

    const {
      fullName,
      age,
      gender,
      mobile,
      interestedActivity,
      enquiryDate
    } = req.body;


    // =====================================
    // REQUIRED VALIDATIONS
    // =====================================

    if (!fullName || !mobile || !gender) {

      return res.status(400).json({
        success: false,
        message:
          "Full name, mobile and gender are required"
      });
    }


    // =====================================
    // MOBILE VALIDATION
    // =====================================

    const cleanedMobile =
      mobile.toString().trim();

    if (!/^[0-9]{10}$/.test(cleanedMobile)) {

      return res.status(400).json({
        success: false,
        message: "Invalid mobile number"
      });
    }


    // =====================================
    // ACTIVITY VALIDATION
    // =====================================

    let activityValue = null;

    if (interestedActivity) {

      if (
        !mongoose.Types.ObjectId.isValid(
          interestedActivity
        )
      ) {

        return res.status(400).json({
          success: false,
          message: "Invalid activity"
        });
      }

      const activityExists =
        await FitnessActivity.findById(
          interestedActivity
        );

      if (!activityExists) {

        return res.status(400).json({
          success: false,
          message: "Activity not found"
        });
      }

      activityValue = interestedActivity;
    }


    // =====================================
    // DUPLICATE CHECK
    // SAME NUMBER ONLY ONCE DAILY
    // =====================================

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const existingEnquiry =
      await FitnessEnquiry.findOne({
        mobile: cleanedMobile,
        source: "App",
        createdAt: {
          $gte: todayStart
        }
      });

    if (existingEnquiry) {

      return res.status(400).json({
        success: false,
        message:
          "Enquiry already submitted today"
      });
    }


    // =====================================
    // DATE VALIDATION
    // =====================================

    let finalDate = new Date();

    if (enquiryDate) {

      const parsedDate =
        new Date(enquiryDate);

      if (
        isNaN(parsedDate.getTime())
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid enquiry date"
        });
      }

      finalDate = parsedDate;
    }


    // =====================================
    // CREATE ENQUIRY
    // =====================================

    const enquiry =
      new FitnessEnquiry({

        enquiryId:
          `FIT-ENQ-${Date.now()}`,

        fullName: fullName.trim(),

        age:
          age !== undefined &&
          age !== ""
            ? Number(age)
            : undefined,

        gender,

        mobile: cleanedMobile,

        interestedActivity:
          activityValue,

        source: "App",

        enquiryDate: finalDate,

        organizationId: "fitness"
      });


    await enquiry.save();


    res.status(201).json({
      success: true,
      message:
        "Fitness enquiry submitted successfully",
      data: enquiry
    });

  } catch (err) {

    console.error(
      "createFitnessEnquiry error:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};