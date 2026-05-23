const SchoolEnquiry =
require("../models/SchoolEnquiry");

const Activity =
require("../models/Activity");


// =====================================================
// GET SCHOOL ACTIVITIES
// =====================================================

exports.getSchoolActivities =
async (req, res) => {

  try {

    const activities =
      await Activity.find()
      .select("_id name")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: activities
    });

  } catch (err) {

    console.error(
      "getSchoolActivities error:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// =====================================================
// CREATE SCHOOL ENQUIRY
// =====================================================

exports.createSchoolEnquiry =
async (req, res) => {

  try {

    const {
      name,
      contact,
      age,
      gender,
      activity,
      date
    } = req.body;


    // =====================================
    // REQUIRED VALIDATIONS
    // =====================================

    if (!name || !contact) {

      return res.status(400).json({
        success: false,
        message:
          "Name and contact are required"
      });
    }


    // =====================================
    // MOBILE VALIDATION
    // =====================================

    const cleanedContact =
      contact.toString().trim();

    if (!/^[0-9]{10}$/.test(cleanedContact)) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid contact number"
      });
    }


    // =====================================
    // ACTIVITY VALIDATION
    // =====================================

    let activityValue = null;

    if (activity) {

      const activityExists =
        await Activity.findById(activity);

      if (!activityExists) {

        return res.status(400).json({
          success: false,
          message:
            "Activity not found"
        });
      }

      activityValue =
        activityExists.name;
    }


    // =====================================
    // DUPLICATE CHECK
    // =====================================

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const existingEnquiry =
      await SchoolEnquiry.findOne({

        contact: cleanedContact,

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

    if (date) {

      const parsedDate =
        new Date(date);

      if (
        isNaN(parsedDate.getTime())
      ) {

        return res.status(400).json({
          success: false,
          message: "Invalid date"
        });
      }

      finalDate = parsedDate;
    }


    // =====================================
    // CREATE ENQUIRY
    // =====================================

    const enquiry =
      new SchoolEnquiry({

        enquiryId:
          `SCH-ENQ-${Date.now()}`,

        name: name.trim(),

        contact: cleanedContact,

        age:
          age !== undefined &&
          age !== ""
            ? Number(age)
            : undefined,

        gender:
          gender || "Male",

        activity:
          activityValue,

        source: "App",

        date: finalDate,

        organizationId: "school"
      });


    await enquiry.save();


    res.status(201).json({
      success: true,
      message:
        "School enquiry submitted successfully",
      data: enquiry
    });

  } catch (err) {

    console.error(
      "createSchoolEnquiry error:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};