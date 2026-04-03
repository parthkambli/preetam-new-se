const SchoolAdmission = require('../models/SchoolAdmission');
const Student = require('../models/Student');
const User = require('../models/User');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const FeeAllotment = require('../models/FeeAllotment');

/**
 * @desc    Get all school admissions with filtering
 * @route   GET /api/school/admission
 * @access  Private (Requires JWT token)
 * @query   { admissionId, name, mobile, feePlan, status }
 * @returns Array of admissions
 */
exports.getAllAdmissions = async (req, res) => {
  try {
    const { admissionId, name, mobile, feePlan, status } = req.query;

    let query = { organizationId: req.organizationId };

    if (admissionId) {
      query.admissionId = { $regex: admissionId, $options: 'i' };
    }
    if (name) {
      query.fullName = { $regex: name, $options: 'i' };
    }
    if (mobile) {
      query.mobile = { $regex: mobile, $options: 'i' };
    }
    if (feePlan) {
      query.feePlan = feePlan;
    }
    if (status) {
      query.status = status;
    }

    const admissions = await SchoolAdmission.find(query).sort({ createdAt: -1 });
    res.json(admissions);
  } catch (err) {
    console.error('Error fetching admissions:', err.message);
    res.status(500).json({ message: 'Server error while fetching admissions' });
  }
};

/**
 * @desc    Get single admission by ID
 * @route   GET /api/school/admission/:id
 * @access  Private (Requires JWT token)
 * @returns Single admission object
 */
exports.getAdmissionById = async (req, res) => {
  try {
    const admission = await SchoolAdmission.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    res.json(admission);
  } catch (err) {
    console.error('Error fetching admission:', err.message);
    res.status(500).json({ message: 'Server error while fetching admission' });
  }
};

/**
 * @desc    Create new admission (also creates Student and User records)
 * @route   POST /api/school/admission
 * @access  Private (Requires JWT token)
 * @body    Full admission data including personal, health, education, fee details
 * @returns Created admission with studentId
 */
/**
 * @desc    Create new admission (also creates Student and User records)
 * @route   POST /api/school/admission
 */
exports.createAdmission = async (req, res) => {
  try {
    const admissionData = req.body;

    // Validate required fields
    if (!admissionData.fullName || !admissionData.mobile || !admissionData.age) {
      return res.status(400).json({ message: 'Full name, mobile, and age are required' });
    }

    const admission = new SchoolAdmission({
      ...admissionData,
      organizationId: req.organizationId
    });

    await admission.save();

    // Update enquiry status if applicable
    if (admissionData.enquiryId) {
      await SchoolEnquiry.findByIdAndUpdate(admissionData.enquiryId, { status: 'Admitted' });
    }

    // Create Student record with emergency contact fields
    const student = new Student({
      admissionId: admission._id,
      fullName: admission.fullName,
      age: admission.age,
      gender: admission.gender,
      dob: admission.dob,
      aadhaar: admission.aadhaar,
      mobile: admission.mobile,
      fullAddress: admission.fullAddress,
      photo: admission.photo,
      bloodGroup: admission.bloodGroup,
      physicalDisability: admission.physicalDisability,
      seriousDisease: admission.seriousDisease,
      regularMedication: admission.regularMedication,
      doctorName: admission.doctorName,
      doctorMobile: admission.doctorMobile,

      // Emergency Contact Fields (flat structure)
      primaryContactName: admission.primaryContactName,
      primaryRelation: admission.primaryRelation,
      primaryPhone: admission.primaryPhone,
      secondaryContactName: admission.secondaryContactName,
      secondaryRelation: admission.secondaryRelation,
      secondaryPhone: admission.secondaryPhone,

      feePlan: admission.feePlan,
      amount: admission.amount || 0,
      assignedCaregiver: admission.assignedCaregiver,
      hobbies: admission.hobbies || [],
      games: admission.games || [],
      behaviour: admission.behaviour,
      status: admission.status,
      organizationId: req.organizationId
    });

    await student.save();

    // === AUTO CREATE FEE ALLOTMENT ===
    if (admission.feePlan && admission.amount && admission.amount > 0) {
      try {
        const feeAllotment = new FeeAllotment({
          studentId: student._id,
          admissionId: admission._id,
          description: admission.feeDescription || 'Fee Allotted at Admission',
          feePlan: admission.feePlan,
          amount: admission.amount,
          dueDate: admission.nextDueDate || null,
          status: admission.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
          organizationId: req.organizationId
        });

        await feeAllotment.save();
        console.log(`✅ Fee Allotment auto-created for student: ${student._id}`);
      } catch (allotmentErr) {
        console.error('⚠️ Failed to create Fee Allotment:', allotmentErr.message);
        // We don't fail the admission if allotment creation fails
      }
    }

    // Create User record for login
    if (admissionData.loginMobile && admissionData.password) {
      const user = new User({
        userId: admission.loginMobile,
        password: admissionData.password,
        role: 'Student',
        mobile: admission.mobile,
        fullName: admission.fullName,
        userType: 'school',
        linkedId: student._id,
        isActive: 'Yes',
        organizationId: req.organizationId
      });

      await user.save();
    }

    res.status(201).json({
      ...admission.toObject(),
      studentId: student.studentId,
      message: 'Admission, Student, and User created successfully'
    });
  } catch (err) {
    console.error('Error creating admission:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Admission ID or Mobile already exists' });
    }
    res.status(500).json({ message: 'Server error while creating admission' });
  }
};
// exports.createAdmission = async (req, res) => {
//   try {
//     const admissionData = req.body;

//     // Validate required fields
//     if (!admissionData.fullName || !admissionData.mobile || !admissionData.age) {
//       return res.status(400).json({ message: 'Full name, mobile, and age are required' });
//     }

//     // Handle empty objects for string fields (e.g., from frontend form)
//     if (admissionData.photo && typeof admissionData.photo === 'object' && Object.keys(admissionData.photo).length === 0) {
//       admissionData.photo = '';
//     }
//     if (admissionData.medicalReports && typeof admissionData.medicalReports === 'object' && Object.keys(admissionData.medicalReports).length === 0) {
//       admissionData.medicalReports = '';
//     }
//     if (admissionData.signature && typeof admissionData.signature === 'object' && Object.keys(admissionData.signature).length === 0) {
//       admissionData.signature = '';
//     }

//     const admission = new SchoolAdmission({
//       ...admissionData,
//       organizationId: req.organizationId
//     });

//     await admission.save();

//     // Update enquiry status to Admitted if enquiryId is provided
//     if (admissionData.enquiryId) {
//       await SchoolEnquiry.findByIdAndUpdate(
//         admissionData.enquiryId,
//         { status: 'Admitted' }
//       );
//     }

//     // Create Student record
//     const student = new Student({
//       admissionId: admission._id,
//       fullName: admission.fullName,
//       age: admission.age,
//       gender: admission.gender,
//       dob: admission.dob,
//       aadhaar: admission.aadhaar,
//       mobile: admission.mobile,
//       fullAddress: admission.fullAddress,
//       photo: admission.photo,
//       bloodGroup: admission.bloodGroup,
//       physicalDisability: admission.physicalDisability,
//       seriousDisease: admission.seriousDisease,
//       regularMedication: admission.regularMedication,
//       doctorName: admission.doctorName,
//       doctorMobile: admission.doctorMobile,
//       emergencyContactName: admission.emergencyContactName,
//       emergencyMobile: admission.emergencyMobile,
//       relationship: admission.relationship,
//       feePlan: admission.feePlan,
//       amount: admission.amount || 0,
//       assignedCaregiver: admission.assignedCaregiver,
//       hobbies: admission.hobbies || [],
//       games: admission.games || [],
//       behaviour: admission.behaviour,
//       status: admission.status,
//       organizationId: req.organizationId
//     });

//     await student.save();

//     // Create User record for login
//     if (admissionData.loginMobile && admissionData.password) {
//       const user = new User({
//         userId: admission.loginMobile,
//         password: admissionData.password,
//         role: 'Student',
//         mobile: admission.mobile,
//         fullName: admission.fullName,
//         userType: 'school',
//         linkedId: student._id,
//         isActive: 'Yes',
//         organizationId: req.organizationId
//       });

//       await user.save();
//     }

//     res.status(201).json({
//       ...admission.toObject(),
//       studentId: student.studentId,
//       message: 'Admission, Student, and User created successfully'
//     });
//   } catch (err) {
//     console.error('Error creating admission:', err.message);
//     if (err.code === 11000) {
//       return res.status(400).json({ message: 'Admission ID or Mobile already exists' });
//     }
//     res.status(500).json({ message: 'Server error while creating admission' });
//   }
// };

/**
 * @desc    Update admission by ID
 * @route   PUT /api/school/admission/:id
 * @access  Private (Requires JWT token)
 * @body    Fields to update (partial data)
 * @returns Updated admission object
 */
exports.updateAdmission = async (req, res) => {
  try {
    const admission = await SchoolAdmission.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    // Update fields
    const updateFields = { ...req.body, updatedAt: Date.now() };
    delete updateFields._id;
    delete updateFields.organizationId;
    delete updateFields.createdAt;

    Object.assign(admission, updateFields);
    await admission.save();

    res.json(admission);
  } catch (err) {
    console.error('Error updating admission:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Admission ID or Mobile already exists' });
    }
    res.status(500).json({ message: 'Server error while updating admission' });
  }
};

/**
 * @desc    Delete admission by ID
 * @route   DELETE /api/school/admission/:id
 * @access  Private (Requires JWT token)
 * @returns Success message
 */
exports.deleteAdmission = async (req, res) => {
  try {
    const admission = await SchoolAdmission.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    res.json({ message: 'Admission deleted successfully' });
  } catch (err) {
    console.error('Error deleting admission:', err.message);
    res.status(500).json({ message: 'Server error while deleting admission' });
  }
};
