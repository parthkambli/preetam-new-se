// const SchoolAdmission = require('../models/SchoolAdmission');
// const Student = require('../models/Student');
// const User = require('../models/User');
// const SchoolEnquiry = require('../models/SchoolEnquiry');
// const FeeAllotment = require('../models/FeeAllotment');

// /**
//  * @desc    Get all school admissions with filtering
//  * @route   GET /api/school/admission
//  * @access  Private (Requires JWT token)
//  * @query   { admissionId, name, mobile, feePlan, status }
//  * @returns Array of admissions
//  */
// exports.getAllAdmissions = async (req, res) => {
//   try {
//     const { admissionId, name, mobile, feePlan, status } = req.query;

//     let query = { organizationId: req.organizationId };

//     if (admissionId) {
//       query.admissionId = { $regex: admissionId, $options: 'i' };
//     }
//     if (name) {
//       query.fullName = { $regex: name, $options: 'i' };
//     }
//     if (mobile) {
//       query.mobile = { $regex: mobile, $options: 'i' };
//     }
//     if (feePlan) {
//       query.feePlan = feePlan;
//     }
//     if (status) {
//       query.status = status;
//     }

//     const admissions = await SchoolAdmission.find(query).sort({ createdAt: -1 });
//     res.json(admissions);
//   } catch (err) {
//     console.error('Error fetching admissions:', err.message);
//     res.status(500).json({ message: 'Server error while fetching admissions' });
//   }
// };

// /**
//  * @desc    Get single admission by ID
//  * @route   GET /api/school/admission/:id
//  * @access  Private (Requires JWT token)
//  * @returns Single admission object
//  */
// exports.getAdmissionById = async (req, res) => {
//   try {
//     const admission = await SchoolAdmission.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!admission) {
//       return res.status(404).json({ message: 'Admission not found' });
//     }

//     res.json(admission);
//   } catch (err) {
//     console.error('Error fetching admission:', err.message);
//     res.status(500).json({ message: 'Server error while fetching admission' });
//   }
// };

// /**
//  * @desc    Create new admission (also creates Student and User records)
//  * @route   POST /api/school/admission
//  * @access  Private (Requires JWT token)
//  * @body    Full admission data including personal, health, education, fee details
//  * @returns Created admission with studentId
//  */
// /**
//  * @desc    Create new admission (also creates Student and User records)
//  * @route   POST /api/school/admission
//  */
// exports.createAdmission = async (req, res) => {
//   try {
//     const admissionData = req.body;

//     // Validate required fields
//     if (!admissionData.fullName || !admissionData.mobile || !admissionData.age) {
//       return res.status(400).json({ message: 'Full name, mobile, and age are required' });
//     }

//     const admission = new SchoolAdmission({
//       ...admissionData,
//       organizationId: req.organizationId
//     });

//     await admission.save();

//     // Update enquiry status if applicable
//     if (admissionData.enquiryId) {
//       await SchoolEnquiry.findByIdAndUpdate(admissionData.enquiryId, { status: 'Admitted' });
//     }

//     // Create Student record with emergency contact fields
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

//       // Emergency Contact Fields (flat structure)
//       primaryContactName: admission.primaryContactName,
//       primaryRelation: admission.primaryRelation,
//       primaryPhone: admission.primaryPhone,
//       secondaryContactName: admission.secondaryContactName,
//       secondaryRelation: admission.secondaryRelation,
//       secondaryPhone: admission.secondaryPhone,

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

//     // === AUTO CREATE FEE ALLOTMENT ===
//     if (admission.feePlan && admission.amount && admission.amount > 0) {
//       try {
//         const feeAllotment = new FeeAllotment({
//           studentId: student._id,
//           admissionId: admission._id,
//           description: admission.feeDescription || 'Fee Allotted at Admission',
//           feePlan: admission.feePlan,
//           amount: admission.amount,
//           dueDate: admission.nextDueDate || null,
//           status: admission.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//           organizationId: req.organizationId
//         });

//         await feeAllotment.save();
//         console.log(`✅ Fee Allotment auto-created for student: ${student._id}`);
//       } catch (allotmentErr) {
//         console.error('⚠️ Failed to create Fee Allotment:', allotmentErr.message);
//         // We don't fail the admission if allotment creation fails
//       }
//     }

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
// // exports.createAdmission = async (req, res) => {
// //   try {
// //     const admissionData = req.body;

// //     // Validate required fields
// //     if (!admissionData.fullName || !admissionData.mobile || !admissionData.age) {
// //       return res.status(400).json({ message: 'Full name, mobile, and age are required' });
// //     }

// //     // Handle empty objects for string fields (e.g., from frontend form)
// //     if (admissionData.photo && typeof admissionData.photo === 'object' && Object.keys(admissionData.photo).length === 0) {
// //       admissionData.photo = '';
// //     }
// //     if (admissionData.medicalReports && typeof admissionData.medicalReports === 'object' && Object.keys(admissionData.medicalReports).length === 0) {
// //       admissionData.medicalReports = '';
// //     }
// //     if (admissionData.signature && typeof admissionData.signature === 'object' && Object.keys(admissionData.signature).length === 0) {
// //       admissionData.signature = '';
// //     }

// //     const admission = new SchoolAdmission({
// //       ...admissionData,
// //       organizationId: req.organizationId
// //     });

// //     await admission.save();

// //     // Update enquiry status to Admitted if enquiryId is provided
// //     if (admissionData.enquiryId) {
// //       await SchoolEnquiry.findByIdAndUpdate(
// //         admissionData.enquiryId,
// //         { status: 'Admitted' }
// //       );
// //     }

// //     // Create Student record
// //     const student = new Student({
// //       admissionId: admission._id,
// //       fullName: admission.fullName,
// //       age: admission.age,
// //       gender: admission.gender,
// //       dob: admission.dob,
// //       aadhaar: admission.aadhaar,
// //       mobile: admission.mobile,
// //       fullAddress: admission.fullAddress,
// //       photo: admission.photo,
// //       bloodGroup: admission.bloodGroup,
// //       physicalDisability: admission.physicalDisability,
// //       seriousDisease: admission.seriousDisease,
// //       regularMedication: admission.regularMedication,
// //       doctorName: admission.doctorName,
// //       doctorMobile: admission.doctorMobile,
// //       emergencyContactName: admission.emergencyContactName,
// //       emergencyMobile: admission.emergencyMobile,
// //       relationship: admission.relationship,
// //       feePlan: admission.feePlan,
// //       amount: admission.amount || 0,
// //       assignedCaregiver: admission.assignedCaregiver,
// //       hobbies: admission.hobbies || [],
// //       games: admission.games || [],
// //       behaviour: admission.behaviour,
// //       status: admission.status,
// //       organizationId: req.organizationId
// //     });

// //     await student.save();

// //     // Create User record for login
// //     if (admissionData.loginMobile && admissionData.password) {
// //       const user = new User({
// //         userId: admission.loginMobile,
// //         password: admissionData.password,
// //         role: 'Student',
// //         mobile: admission.mobile,
// //         fullName: admission.fullName,
// //         userType: 'school',
// //         linkedId: student._id,
// //         isActive: 'Yes',
// //         organizationId: req.organizationId
// //       });

// //       await user.save();
// //     }

// //     res.status(201).json({
// //       ...admission.toObject(),
// //       studentId: student.studentId,
// //       message: 'Admission, Student, and User created successfully'
// //     });
// //   } catch (err) {
// //     console.error('Error creating admission:', err.message);
// //     if (err.code === 11000) {
// //       return res.status(400).json({ message: 'Admission ID or Mobile already exists' });
// //     }
// //     res.status(500).json({ message: 'Server error while creating admission' });
// //   }
// // };

// /**
//  * @desc    Update admission by ID
//  * @route   PUT /api/school/admission/:id
//  * @access  Private (Requires JWT token)
//  * @body    Fields to update (partial data)
//  * @returns Updated admission object
//  */
// exports.updateAdmission = async (req, res) => {
//   try {
//     const admission = await SchoolAdmission.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!admission) {
//       return res.status(404).json({ message: 'Admission not found' });
//     }

//     // Update fields
//     const updateFields = { ...req.body, updatedAt: Date.now() };
//     delete updateFields._id;
//     delete updateFields.organizationId;
//     delete updateFields.createdAt;

//     Object.assign(admission, updateFields);
//     await admission.save();

//     res.json(admission);
//   } catch (err) {
//     console.error('Error updating admission:', err.message);
//     if (err.code === 11000) {
//       return res.status(400).json({ message: 'Admission ID or Mobile already exists' });
//     }
//     res.status(500).json({ message: 'Server error while updating admission' });
//   }
// };

// /**
//  * @desc    Delete admission by ID
//  * @route   DELETE /api/school/admission/:id
//  * @access  Private (Requires JWT token)
//  * @returns Success message
//  */
// exports.deleteAdmission = async (req, res) => {
//   try {
//     const admission = await SchoolAdmission.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!admission) {
//       return res.status(404).json({ message: 'Admission not found' });
//     }

//     res.json({ message: 'Admission deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting admission:', err.message);
//     res.status(500).json({ message: 'Server error while deleting admission' });
//   }
// };












// const SchoolAdmission = require('../models/SchoolAdmission');
// const Student = require('../models/Student');
// const User = require('../models/User');
// const SchoolEnquiry = require('../models/SchoolEnquiry');
// const FeeAllotment = require('../models/FeeAllotment');

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const VALID_GENDERS        = ['Male', 'Female', 'Other'];
// const VALID_FEE_PLANS      = ['Daily', 'Weekly', 'Monthly', 'Annual'];
// const VALID_INSTITUTE_TYPES= ['School', 'Residency', 'DayCare'];
// const VALID_PAYMENT_STATUS = ['Paid', 'Pending', 'Partial'];
// const VALID_PAYMENT_MODES  = ['Cash', 'UPI', 'Bank Transfer'];
// const VALID_OCCUPATION     = ['Government', 'Private', 'Retired', 'Self Employed'];
// const VALID_BEHAVIOURS     = ['Calm', 'Angry', 'Moderate', 'Strict'];
// const VALID_YES_NO         = ['Yes', 'No'];
// const VALID_BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// const isValidPhone = (val) => /^\d{10}$/.test(val.toString().trim());

// const isDateInPast = (dateStr) => {
//   const input = new Date(dateStr);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   return input < today;
// };

// // ─── Controllers ──────────────────────────────────────────────────────────────

// /**
//  * @desc    Get all school admissions with filtering
//  * @route   GET /api/school/admission
//  */
// exports.getAllAdmissions = async (req, res) => {
//   try {
//     const { admissionId, name, mobile, feePlan, status } = req.query;

//     let query = { organizationId: req.organizationId };

//     if (admissionId) query.admissionId = { $regex: admissionId.trim(), $options: 'i' };
//     if (name)        query.fullName    = { $regex: name.trim(), $options: 'i' };
//     if (mobile)      query.mobile      = { $regex: mobile.trim(), $options: 'i' };

//     if (feePlan) {
//       if (!VALID_FEE_PLANS.includes(feePlan)) {
//         return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
//       }
//       query.feePlan = feePlan;
//     }

//     if (status) query.status = status;

//     const admissions = await SchoolAdmission.find(query).sort({ createdAt: -1 });
//     res.json(admissions);
//   } catch (err) {
//     console.error('Error fetching admissions:', err.message);
//     res.status(500).json({ message: 'Server error while fetching admissions.' });
//   }
// };

// /**
//  * @desc    Get single admission by ID
//  * @route   GET /api/school/admission/:id
//  */
// exports.getAdmissionById = async (req, res) => {
//   try {
//     const admission = await SchoolAdmission.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!admission) {
//       return res.status(404).json({ message: 'Admission not found.' });
//     }

//     res.json(admission);
//   } catch (err) {
//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ message: 'Invalid admission ID format.' });
//     }
//     console.error('Error fetching admission:', err.message);
//     res.status(500).json({ message: 'Server error while fetching admission.' });
//   }
// };

// /**
//  * @desc    Create new admission (also creates Student and User records)
//  * @route   POST /api/school/admission
//  */
// exports.createAdmission = async (req, res) => {
//   try {
//     const admissionData = req.body;

//     // ── Required fields ────────────────────────────────────────────────────
//     if (!admissionData.fullName || !admissionData.fullName.trim()) {
//       return res.status(400).json({ message: 'Full name is required.' });
//     }
//     if (!admissionData.mobile) {
//       return res.status(400).json({ message: 'Mobile number is required.' });
//     }
//     if (!admissionData.age) {
//       return res.status(400).json({ message: 'Age is required.' });
//     }

//     // ── Full name validation ───────────────────────────────────────────────
//     const fullName = admissionData.fullName.trim();
//     if (fullName.length < 2) {
//       return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
//     }
//     if (fullName.length > 100) {
//       return res.status(400).json({ message: 'Full name cannot exceed 100 characters.' });
//     }
//     if (!/^[a-zA-Z\s'.,-]+$/.test(fullName)) {
//       return res.status(400).json({ message: 'Full name can only contain letters, spaces, and basic punctuation.' });
//     }

//     // ── Mobile validation ──────────────────────────────────────────────────
//     if (!isValidPhone(admissionData.mobile)) {
//       return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
//     }

//     // ── Age validation ─────────────────────────────────────────────────────
//     const age = Number(admissionData.age);
//     if (isNaN(age) || !Number.isInteger(age) || age < 1 || age > 120) {
//       return res.status(400).json({ message: 'Age must be a whole number between 1 and 120.' });
//     }

//     // ── Gender ─────────────────────────────────────────────────────────────
//     if (admissionData.gender && !VALID_GENDERS.includes(admissionData.gender)) {
//       return res.status(400).json({ message: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}.` });
//     }

//     // ── Date of Birth ──────────────────────────────────────────────────────
//     if (admissionData.dob) {
//       const dob = new Date(admissionData.dob);
//       if (isNaN(dob.getTime())) {
//         return res.status(400).json({ message: 'Invalid date of birth format.' });
//       }
//       if (dob > new Date()) {
//         return res.status(400).json({ message: 'Date of birth cannot be in the future.' });
//       }
//     }

//     // ── Aadhaar validation ─────────────────────────────────────────────────
//     if (admissionData.aadhaar && admissionData.aadhaar.toString().trim() !== '') {
//       if (!/^\d{12}$/.test(admissionData.aadhaar.toString().trim())) {
//         return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits.' });
//       }
//     }

//     // ── Blood group ────────────────────────────────────────────────────────
//     if (admissionData.bloodGroup && admissionData.bloodGroup.trim() !== '') {
//       const bg = admissionData.bloodGroup.trim().toUpperCase();
//       if (!VALID_BLOOD_GROUPS.includes(bg)) {
//         return res.status(400).json({ message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}.` });
//       }
//       admissionData.bloodGroup = bg;
//     }

//     // ── Doctor mobile ──────────────────────────────────────────────────────
//     if (admissionData.doctorMobile && admissionData.doctorMobile.toString().trim() !== '') {
//       if (!isValidPhone(admissionData.doctorMobile)) {
//         return res.status(400).json({ message: 'Doctor mobile number must be exactly 10 digits.' });
//       }
//     }

//     // ── Yes/No fields ──────────────────────────────────────────────────────
//     const yesNoFields = { physicalDisability: 'Physical disability', seriousDisease: 'Serious disease', regularMedication: 'Regular medication', messFacility: 'Mess facility', residency: 'Residency' };
//     for (const [field, label] of Object.entries(yesNoFields)) {
//       if (admissionData[field] && !VALID_YES_NO.includes(admissionData[field])) {
//         return res.status(400).json({ message: `${label} must be 'Yes' or 'No'.` });
//       }
//     }

//     // ── Occupation type ────────────────────────────────────────────────────
//     if (admissionData.occupationType && !VALID_OCCUPATION.includes(admissionData.occupationType)) {
//       return res.status(400).json({ message: `Invalid occupation type. Must be one of: ${VALID_OCCUPATION.join(', ')}.` });
//     }

//     // ── Behaviour ─────────────────────────────────────────────────────────
//     if (admissionData.behaviour && !VALID_BEHAVIOURS.includes(admissionData.behaviour)) {
//       return res.status(400).json({ message: `Invalid behaviour value. Must be one of: ${VALID_BEHAVIOURS.join(', ')}.` });
//     }

//     // ── Emergency contact phones ───────────────────────────────────────────
//     if (admissionData.primaryPhone && admissionData.primaryPhone.toString().trim() !== '') {
//       if (!isValidPhone(admissionData.primaryPhone)) {
//         return res.status(400).json({ message: 'Primary emergency contact phone must be exactly 10 digits.' });
//       }
//     }
//     if (admissionData.secondaryPhone && admissionData.secondaryPhone.toString().trim() !== '') {
//       if (!isValidPhone(admissionData.secondaryPhone)) {
//         return res.status(400).json({ message: 'Secondary emergency contact phone must be exactly 10 digits.' });
//       }
//     }

//     // ── Primary contact name required if phone given ───────────────────────
//     if (admissionData.primaryPhone && admissionData.primaryPhone.toString().trim() !== '') {
//       if (!admissionData.primaryContactName || !admissionData.primaryContactName.trim()) {
//         return res.status(400).json({ message: 'Primary contact name is required when a primary phone is provided.' });
//       }
//     }

//     // ── Fee plan ───────────────────────────────────────────────────────────
//     if (admissionData.feePlan && !VALID_FEE_PLANS.includes(admissionData.feePlan)) {
//       return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
//     }

//     // ── Institute type ─────────────────────────────────────────────────────
//     if (admissionData.instituteType && !VALID_INSTITUTE_TYPES.includes(admissionData.instituteType)) {
//       return res.status(400).json({ message: `Invalid institute type. Must be one of: ${VALID_INSTITUTE_TYPES.join(', ')}.` });
//     }

//     // ── Amount ─────────────────────────────────────────────────────────────
//     if (admissionData.amount !== undefined && admissionData.amount !== '') {
//       const amt = Number(admissionData.amount);
//       if (isNaN(amt) || amt < 0) {
//         return res.status(400).json({ message: 'Amount must be a non-negative number.' });
//       }
//     }

//     // ── Payment status / mode ──────────────────────────────────────────────
//     if (admissionData.paymentStatus && !VALID_PAYMENT_STATUS.includes(admissionData.paymentStatus)) {
//       return res.status(400).json({ message: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUS.join(', ')}.` });
//     }
//     if (admissionData.paymentMode && !VALID_PAYMENT_MODES.includes(admissionData.paymentMode)) {
//       return res.status(400).json({ message: `Invalid payment mode. Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.` });
//     }

//     // ── Dates ──────────────────────────────────────────────────────────────
//     if (admissionData.registrationDate) {
//       const rd = new Date(admissionData.registrationDate);
//       if (isNaN(rd.getTime())) {
//         return res.status(400).json({ message: 'Invalid registration date format.' });
//       }
//     }
//     if (admissionData.nextDueDate) {
//       const ndd = new Date(admissionData.nextDueDate);
//       if (isNaN(ndd.getTime())) {
//         return res.status(400).json({ message: 'Invalid next due date format.' });
//       }
//       if (isDateInPast(admissionData.nextDueDate)) {
//         return res.status(400).json({ message: 'Next due date cannot be in the past.' });
//       }
//     }

//     // ── Login mobile ───────────────────────────────────────────────────────
//     if (admissionData.loginMobile && admissionData.loginMobile.toString().trim() !== '') {
//       if (!isValidPhone(admissionData.loginMobile)) {
//         return res.status(400).json({ message: 'Login mobile number must be exactly 10 digits.' });
//       }
//     }

//     // ── Password ───────────────────────────────────────────────────────────
//     if (admissionData.loginMobile && admissionData.password) {
//       if (admissionData.password.length < 6) {
//         return res.status(400).json({ message: 'Password must be at least 6 characters.' });
//       }
//     }

//     // ── Duplicate mobile check (within same org) ───────────────────────────
//     const existingAdmission = await SchoolAdmission.findOne({
//       organizationId: req.organizationId,
//       mobile: admissionData.mobile.toString().trim()
//     });
//     if (existingAdmission) {
//       return res.status(409).json({ message: `An admission with mobile number ${admissionData.mobile} already exists (ID: ${existingAdmission.admissionId}).` });
//     }

//     // ── Aadhaar duplicate check ────────────────────────────────────────────
//     if (admissionData.aadhaar && admissionData.aadhaar.toString().trim() !== '') {
//       const existingAadhaar = await SchoolAdmission.findOne({
//         organizationId: req.organizationId,
//         aadhaar: admissionData.aadhaar.toString().trim()
//       });
//       if (existingAadhaar) {
//         return res.status(409).json({ message: 'An admission with this Aadhaar number already exists.' });
//       }
//     }

//     // ── Handle empty file objects from frontend ────────────────────────────
//     if (admissionData.photo && typeof admissionData.photo === 'object' && !(admissionData.photo instanceof Buffer) && Object.keys(admissionData.photo).length === 0) {
//       admissionData.photo = '';
//     }
//     if (admissionData.medicalReports && typeof admissionData.medicalReports === 'object' && !(admissionData.medicalReports instanceof Buffer) && Object.keys(admissionData.medicalReports).length === 0) {
//       admissionData.medicalReports = '';
//     }

//     // ── Trim name fields ───────────────────────────────────────────────────
//     admissionData.fullName = fullName;

//     // ── Save admission ─────────────────────────────────────────────────────
//     const admission = new SchoolAdmission({
//       ...admissionData,
//       organizationId: req.organizationId
//     });

//     await admission.save();
    
//     // ── Update enquiry status ──────────────────────────────────────────────
//     if (admissionData.enquiryId) {
//       await SchoolEnquiry.findByIdAndUpdate(admissionData.enquiryId, { status: 'Admitted' });
//     }

//     // ── Create Student record ──────────────────────────────────────────────
//     const student = new Student({
//       admissionId:          admission._id,
//       fullName:             admission.fullName,
//       age:                  admission.age,
//       gender:               admission.gender,
//       dob:                  admission.dob,
//       aadhaar:              admission.aadhaar,
//       mobile:               admission.mobile,
//       fullAddress:          admission.fullAddress,
//       photo:                admission.photo,
//       bloodGroup:           admission.bloodGroup,
//       physicalDisability:   admission.physicalDisability,
//       seriousDisease:       admission.seriousDisease,
//       regularMedication:    admission.regularMedication,
//       doctorName:           admission.doctorName,
//       doctorMobile:         admission.doctorMobile,
//       primaryContactName:   admission.primaryContactName,
//       primaryRelation:      admission.primaryRelation,
//       primaryPhone:         admission.primaryPhone,
//       secondaryContactName: admission.secondaryContactName,
//       secondaryRelation:    admission.secondaryRelation,
//       secondaryPhone:       admission.secondaryPhone,
//       feePlan:              admission.feePlan,
//       amount:               admission.amount || 0,
//       assignedCaregiver:    admission.assignedCaregiver,
//       hobbies:              admission.hobbies || [],
//       games:                admission.games || [],
//       behaviour:            admission.behaviour,
//       status:               admission.status,
//       organizationId:       req.organizationId
//     });

//     await student.save();

//     // ── Auto-create fee allotment ──────────────────────────────────────────
//     if (admission.feePlan && admission.amount && admission.amount > 0) {
//       try {
//         const feeAllotment = new FeeAllotment({
//           studentId:   student._id,
//           admissionId: admission._id,
//           description: admission.feeDescription || 'Fee Allotted at Admission',
//           feePlan:     admission.feePlan,
//           amount:      admission.amount,
//           dueDate:     admission.nextDueDate || null,
//           status:      admission.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//           organizationId: req.organizationId
//         });
//         await feeAllotment.save();
//       } catch (allotmentErr) {
//         console.error('⚠️ Failed to create Fee Allotment:', allotmentErr.message);
//       }
//     }

//     // ── Create User record for login ───────────────────────────────────────
//     if (admissionData.loginMobile && admissionData.password) {
//       const existingUser = await User.findOne({
//         userId: admissionData.loginMobile,
//         organizationId: req.organizationId
//       });
//       if (existingUser) {
//         return res.status(409).json({ message: 'A user account with this login mobile already exists.' });
//       }

//       const user = new User({
//         userId:         admission.loginMobile,
//         password:       admissionData.password,
//         role:           'Student',
//         mobile:         admission.mobile,
//         fullName:       admission.fullName,
//         userType:       'school',
//         linkedId:       student._id,
//         isActive:       'Yes',
//         organizationId: req.organizationId
//       });

//       await user.save();
//     }

//     res.status(201).json({
//       ...admission.toObject(),
//       studentId: student.studentId,
//       message: 'Admission, Student, and User created successfully.'
//     });
//   } catch (err) {
//     console.error('Error creating admission:', err.message);
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyValue || {})[0];
//       if (field === 'mobile')     return res.status(409).json({ message: 'An admission with this mobile number already exists.' });
//       if (field === 'aadhaar')    return res.status(409).json({ message: 'An admission with this Aadhaar number already exists.' });
//       if (field === 'admissionId') return res.status(409).json({ message: 'Duplicate admission ID. Please try again.' });
//       return res.status(409).json({ message: 'Duplicate entry detected. Please try again.' });
//     }
//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ message: messages.join(', ') });
//     }
//     res.status(500).json({ message: 'Server error while creating admission.' });
//   }
// };

// /**
//  * @desc    Update admission by ID
//  * @route   PUT /api/school/admission/:id
//  */
// exports.updateAdmission = async (req, res) => {
//   try {
//     const admission = await SchoolAdmission.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!admission) {
//       return res.status(404).json({ message: 'Admission not found.' });
//     }

//     const updateData = req.body;

//     // ── Validate only fields that are being updated ────────────────────────
//     if (updateData.mobile !== undefined && updateData.mobile !== '') {
//       if (!isValidPhone(updateData.mobile)) {
//         return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
//       }
//     }
//     if (updateData.doctorMobile !== undefined && updateData.doctorMobile !== '') {
//       if (!isValidPhone(updateData.doctorMobile)) {
//         return res.status(400).json({ message: 'Doctor mobile number must be exactly 10 digits.' });
//       }
//     }
//     if (updateData.primaryPhone !== undefined && updateData.primaryPhone !== '') {
//       if (!isValidPhone(updateData.primaryPhone)) {
//         return res.status(400).json({ message: 'Primary emergency contact phone must be exactly 10 digits.' });
//       }
//     }
//     if (updateData.secondaryPhone !== undefined && updateData.secondaryPhone !== '') {
//       if (!isValidPhone(updateData.secondaryPhone)) {
//         return res.status(400).json({ message: 'Secondary emergency contact phone must be exactly 10 digits.' });
//       }
//     }
//     if (updateData.age !== undefined && updateData.age !== '') {
//       const age = Number(updateData.age);
//       if (isNaN(age) || age < 1 || age > 120) {
//         return res.status(400).json({ message: 'Age must be between 1 and 120.' });
//       }
//     }
//     if (updateData.aadhaar !== undefined && updateData.aadhaar !== '') {
//       if (!/^\d{12}$/.test(updateData.aadhaar.toString().trim())) {
//         return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits.' });
//       }
//     }
//     if (updateData.amount !== undefined && updateData.amount !== '') {
//       if (isNaN(Number(updateData.amount)) || Number(updateData.amount) < 0) {
//         return res.status(400).json({ message: 'Amount must be a non-negative number.' });
//       }
//     }
//     if (updateData.feePlan && !VALID_FEE_PLANS.includes(updateData.feePlan)) {
//       return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
//     }
//     if (updateData.paymentStatus && !VALID_PAYMENT_STATUS.includes(updateData.paymentStatus)) {
//       return res.status(400).json({ message: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUS.join(', ')}.` });
//     }
//     if (updateData.nextDueDate && isDateInPast(updateData.nextDueDate)) {
//       return res.status(400).json({ message: 'Next due date cannot be in the past.' });
//     }

//     const updateFields = { ...updateData, updatedAt: Date.now() };
//     delete updateFields._id;
//     delete updateFields.organizationId;
//     delete updateFields.createdAt;

//     Object.assign(admission, updateFields);
//     await admission.save();

//     res.json(admission);
//   } catch (err) {
//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ message: 'Invalid admission ID format.' });
//     }
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyValue || {})[0];
//       if (field === 'mobile') return res.status(409).json({ message: 'An admission with this mobile number already exists.' });
//       return res.status(409).json({ message: 'Duplicate entry detected.' });
//     }
//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ message: messages.join(', ') });
//     }
//     console.error('Error updating admission:', err.message);
//     res.status(500).json({ message: 'Server error while updating admission.' });
//   }
// };

// /**
//  * @desc    Delete admission by ID
//  * @route   DELETE /api/school/admission/:id
//  */
// exports.deleteAdmission = async (req, res) => {
//   try {
//     const admission = await SchoolAdmission.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!admission) {
//       return res.status(404).json({ message: 'Admission not found.' });
//     }

//     res.json({ message: 'Admission deleted successfully.' });
//   } catch (err) {
//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ message: 'Invalid admission ID format.' });
//     }
//     console.error('Error deleting admission:', err.message);
//     res.status(500).json({ message: 'Server error while deleting admission.' });
//   }
// };










const SchoolAdmission = require('../models/SchoolAdmission');
const Student = require('../models/Student');
const User = require('../models/User');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const FeeAllotment = require('../models/FeeAllotment');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_GENDERS        = ['Male', 'Female', 'Other'];
const VALID_FEE_PLANS      = ['Daily', 'Weekly', 'Monthly', 'Annual'];
const VALID_INSTITUTE_TYPES= ['School', 'Residency', 'DayCare'];
const VALID_PAYMENT_STATUS = ['Paid', 'Pending', 'Partial'];
const VALID_PAYMENT_MODES  = ['Cash', 'UPI', 'Bank Transfer'];
const VALID_OCCUPATION     = ['Government', 'Private', 'Retired', 'Self Employed'];
const VALID_BEHAVIOURS     = ['Calm', 'Angry', 'Moderate', 'Strict'];
const VALID_YES_NO         = ['Yes', 'No'];
const VALID_BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const isValidPhone = (val) => /^\d{10}$/.test(val.toString().trim());

const isDateInPast = (dateStr) => {
  const input = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return input < today;
};

// Fields that exist on both Admission and Student and should always stay in sync
const STUDENT_SYNC_FIELDS = [
  'fullName', 'age', 'gender', 'dob', 'aadhaar', 'mobile', 'fullAddress',
  'photo', 'bloodGroup', 'physicalDisability', 'seriousDisease',
  'regularMedication', 'doctorName', 'doctorMobile',
  'primaryContactName', 'primaryRelation', 'primaryPhone',
  'secondaryContactName', 'secondaryRelation', 'secondaryPhone',
  'villageCity', 'alternateContact',
  'feePlan', 'amount', 'assignedCaregiver',
  'hobbies', 'games', 'behaviour', 'status'
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all school admissions with filtering
 * @route   GET /api/school/admission
 */
exports.getAllAdmissions = async (req, res) => {
  try {
    const { admissionId, name, mobile, feePlan, status } = req.query;

    let query = { organizationId: req.organizationId };

    if (admissionId) query.admissionId = { $regex: admissionId.trim(), $options: 'i' };
    if (name)        query.fullName    = { $regex: name.trim(), $options: 'i' };
    if (mobile)      query.mobile      = { $regex: mobile.trim(), $options: 'i' };

    if (feePlan) {
      if (!VALID_FEE_PLANS.includes(feePlan)) {
        return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
      }
      query.feePlan = feePlan;
    }

    if (status) query.status = status;

    const admissions = await SchoolAdmission.find(query).sort({ createdAt: -1 });
    res.json(admissions);
  } catch (err) {
    console.error('Error fetching admissions:', err.message);
    res.status(500).json({ message: 'Server error while fetching admissions.' });
  }
};

/**
 * @desc    Get single admission by ID
 * @route   GET /api/school/admission/:id
 */
exports.getAdmissionById = async (req, res) => {
  try {
    const admission = await SchoolAdmission.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    res.json(admission);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid admission ID format.' });
    }
    console.error('Error fetching admission:', err.message);
    res.status(500).json({ message: 'Server error while fetching admission.' });
  }
};

/**
 * @desc    Create new admission (also creates Student and User records)
 * @route   POST /api/school/admission
 */
exports.createAdmission = async (req, res) => {
  try {
    const admissionData = req.body;

    // ── Required fields ────────────────────────────────────────────────────
    if (!admissionData.fullName || !admissionData.fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }
    if (!admissionData.mobile) {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }
    if (!admissionData.age) {
      return res.status(400).json({ message: 'Age is required.' });
    }

    // ── Full name validation ───────────────────────────────────────────────
    const fullName = admissionData.fullName.trim();
    if (fullName.length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }
    if (fullName.length > 100) {
      return res.status(400).json({ message: 'Full name cannot exceed 100 characters.' });
    }
    if (!/^[a-zA-Z\s'.,-]+$/.test(fullName)) {
      return res.status(400).json({ message: 'Full name can only contain letters, spaces, and basic punctuation.' });
    }

    // ── Mobile validation ──────────────────────────────────────────────────
    if (!isValidPhone(admissionData.mobile)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
    }

    // ── Age validation ─────────────────────────────────────────────────────
    const age = Number(admissionData.age);
    if (isNaN(age) || !Number.isInteger(age) || age < 1 || age > 120) {
      return res.status(400).json({ message: 'Age must be a whole number between 1 and 120.' });
    }

    // ── Gender ─────────────────────────────────────────────────────────────
    if (admissionData.gender && !VALID_GENDERS.includes(admissionData.gender)) {
      return res.status(400).json({ message: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}.` });
    }

    // ── Date of Birth ──────────────────────────────────────────────────────
    if (admissionData.dob) {
      const dob = new Date(admissionData.dob);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ message: 'Invalid date of birth format.' });
      }
      if (dob > new Date()) {
        return res.status(400).json({ message: 'Date of birth cannot be in the future.' });
      }
    }

    // ── Aadhaar validation ─────────────────────────────────────────────────
    if (admissionData.aadhaar && admissionData.aadhaar.toString().trim() !== '') {
      if (!/^\d{12}$/.test(admissionData.aadhaar.toString().trim())) {
        return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits.' });
      }
    }

    // ── Blood group ────────────────────────────────────────────────────────
    if (admissionData.bloodGroup && admissionData.bloodGroup.trim() !== '') {
      const bg = admissionData.bloodGroup.trim().toUpperCase();
      if (!VALID_BLOOD_GROUPS.includes(bg)) {
        return res.status(400).json({ message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}.` });
      }
      admissionData.bloodGroup = bg;
    }

    // ── Doctor mobile ──────────────────────────────────────────────────────
    if (admissionData.doctorMobile && admissionData.doctorMobile.toString().trim() !== '') {
      if (!isValidPhone(admissionData.doctorMobile)) {
        return res.status(400).json({ message: 'Doctor mobile number must be exactly 10 digits.' });
      }
    }

    // ── Yes/No fields ──────────────────────────────────────────────────────
    const yesNoFields = { physicalDisability: 'Physical disability', seriousDisease: 'Serious disease', regularMedication: 'Regular medication', messFacility: 'Mess facility', residency: 'Residency' };
    for (const [field, label] of Object.entries(yesNoFields)) {
      if (admissionData[field] && !VALID_YES_NO.includes(admissionData[field])) {
        return res.status(400).json({ message: `${label} must be 'Yes' or 'No'.` });
      }
    }

    // ── Occupation type ────────────────────────────────────────────────────
    if (admissionData.occupationType && !VALID_OCCUPATION.includes(admissionData.occupationType)) {
      return res.status(400).json({ message: `Invalid occupation type. Must be one of: ${VALID_OCCUPATION.join(', ')}.` });
    }

    // ── Behaviour ─────────────────────────────────────────────────────────
    if (admissionData.behaviour && !VALID_BEHAVIOURS.includes(admissionData.behaviour)) {
      return res.status(400).json({ message: `Invalid behaviour value. Must be one of: ${VALID_BEHAVIOURS.join(', ')}.` });
    }

    // ── Emergency contact phones ───────────────────────────────────────────
    if (admissionData.primaryPhone && admissionData.primaryPhone.toString().trim() !== '') {
      if (!isValidPhone(admissionData.primaryPhone)) {
        return res.status(400).json({ message: 'Primary emergency contact phone must be exactly 10 digits.' });
      }
    }
    if (admissionData.secondaryPhone && admissionData.secondaryPhone.toString().trim() !== '') {
      if (!isValidPhone(admissionData.secondaryPhone)) {
        return res.status(400).json({ message: 'Secondary emergency contact phone must be exactly 10 digits.' });
      }
    }

    // ── Primary contact name required if phone given ───────────────────────
    if (admissionData.primaryPhone && admissionData.primaryPhone.toString().trim() !== '') {
      if (!admissionData.primaryContactName || !admissionData.primaryContactName.trim()) {
        return res.status(400).json({ message: 'Primary contact name is required when a primary phone is provided.' });
      }
    }

    // ── Fee plan ───────────────────────────────────────────────────────────
    if (admissionData.feePlan && !VALID_FEE_PLANS.includes(admissionData.feePlan)) {
      return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
    }

    // ── Institute type ─────────────────────────────────────────────────────
    if (admissionData.instituteType && !VALID_INSTITUTE_TYPES.includes(admissionData.instituteType)) {
      return res.status(400).json({ message: `Invalid institute type. Must be one of: ${VALID_INSTITUTE_TYPES.join(', ')}.` });
    }

    // ── Amount ─────────────────────────────────────────────────────────────
    if (admissionData.amount !== undefined && admissionData.amount !== '') {
      const amt = Number(admissionData.amount);
      if (isNaN(amt) || amt < 0) {
        return res.status(400).json({ message: 'Amount must be a non-negative number.' });
      }
    }

    // ── Payment status / mode ──────────────────────────────────────────────
    if (admissionData.paymentStatus && !VALID_PAYMENT_STATUS.includes(admissionData.paymentStatus)) {
      return res.status(400).json({ message: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUS.join(', ')}.` });
    }
    if (admissionData.paymentMode && !VALID_PAYMENT_MODES.includes(admissionData.paymentMode)) {
      return res.status(400).json({ message: `Invalid payment mode. Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.` });
    }

    // ── Dates ──────────────────────────────────────────────────────────────
    if (admissionData.registrationDate) {
      const rd = new Date(admissionData.registrationDate);
      if (isNaN(rd.getTime())) {
        return res.status(400).json({ message: 'Invalid registration date format.' });
      }
    }
    if (admissionData.nextDueDate) {
      const ndd = new Date(admissionData.nextDueDate);
      if (isNaN(ndd.getTime())) {
        return res.status(400).json({ message: 'Invalid next due date format.' });
      }
      if (isDateInPast(admissionData.nextDueDate)) {
        return res.status(400).json({ message: 'Next due date cannot be in the past.' });
      }
    }

    // ── Login mobile ───────────────────────────────────────────────────────
    if (admissionData.loginMobile && admissionData.loginMobile.toString().trim() !== '') {
      if (!isValidPhone(admissionData.loginMobile)) {
        return res.status(400).json({ message: 'Login mobile number must be exactly 10 digits.' });
      }
    }

    // ── Password ───────────────────────────────────────────────────────────
    if (admissionData.loginMobile && admissionData.password) {
      if (admissionData.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
    }

    // ── Duplicate mobile check (within same org) ───────────────────────────
    const existingAdmission = await SchoolAdmission.findOne({
      organizationId: req.organizationId,
      mobile: admissionData.mobile.toString().trim()
    });
    if (existingAdmission) {
      return res.status(409).json({ message: `An admission with mobile number ${admissionData.mobile} already exists (ID: ${existingAdmission.admissionId}).` });
    }

    // ── Aadhaar duplicate check ────────────────────────────────────────────
    if (admissionData.aadhaar && admissionData.aadhaar.toString().trim() !== '') {
      const existingAadhaar = await SchoolAdmission.findOne({
        organizationId: req.organizationId,
        aadhaar: admissionData.aadhaar.toString().trim()
      });
      if (existingAadhaar) {
        return res.status(409).json({ message: 'An admission with this Aadhaar number already exists.' });
      }
    }

    // ── Handle empty file objects from frontend ────────────────────────────
    if (admissionData.photo && typeof admissionData.photo === 'object' && !(admissionData.photo instanceof Buffer) && Object.keys(admissionData.photo).length === 0) {
      admissionData.photo = '';
    }
    if (admissionData.medicalReports && typeof admissionData.medicalReports === 'object' && !(admissionData.medicalReports instanceof Buffer) && Object.keys(admissionData.medicalReports).length === 0) {
      admissionData.medicalReports = '';
    }

    // ── Trim name fields ───────────────────────────────────────────────────
    admissionData.fullName = fullName;

    // ── Save admission ─────────────────────────────────────────────────────
    const admission = new SchoolAdmission({
      ...admissionData,
      organizationId: req.organizationId
    });

    await admission.save();

    // ── Update enquiry status ──────────────────────────────────────────────
    if (admissionData.enquiryId) {
      await SchoolEnquiry.findByIdAndUpdate(admissionData.enquiryId, { status: 'Admitted' });
    }

    // ── Create Student record ──────────────────────────────────────────────
    const student = new Student({
      admissionId:          admission._id,
      fullName:             admission.fullName,
      age:                  admission.age,
      gender:               admission.gender,
      dob:                  admission.dob,
      aadhaar:              admission.aadhaar,
      mobile:               admission.mobile,
      fullAddress:          admission.fullAddress,
      photo:                admission.photo,
      bloodGroup:           admission.bloodGroup,
      physicalDisability:   admission.physicalDisability,
      seriousDisease:       admission.seriousDisease,
      regularMedication:    admission.regularMedication,
      doctorName:           admission.doctorName,
      doctorMobile:         admission.doctorMobile,
      primaryContactName:   admission.primaryContactName,
      primaryRelation:      admission.primaryRelation,
      primaryPhone:         admission.primaryPhone,
      secondaryContactName: admission.secondaryContactName,
      secondaryRelation:    admission.secondaryRelation,
      secondaryPhone:       admission.secondaryPhone,
      feePlan:              admission.feePlan,
      amount:               admission.amount || 0,
      assignedCaregiver:    admission.assignedCaregiver,
      hobbies:              admission.hobbies || [],
      games:                admission.games || [],
      behaviour:            admission.behaviour,
      status:               admission.status,
      organizationId:       req.organizationId
    });

    await student.save();

    // ── Auto-create fee allotment ──────────────────────────────────────────
    if (admission.feePlan && admission.amount && admission.amount > 0) {
      try {
        const feeAllotment = new FeeAllotment({
          studentId:   student._id,
          admissionId: admission._id,
          description: admission.feeDescription || 'Fee Allotted at Admission',
          feePlan:     admission.feePlan,
          amount:      admission.amount,
          dueDate:     admission.nextDueDate || null,
          status:      admission.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
          organizationId: req.organizationId
        });
        await feeAllotment.save();
      } catch (allotmentErr) {
        console.error('⚠️ Failed to create Fee Allotment:', allotmentErr.message);
      }
    }

    // ── Create User record for login ───────────────────────────────────────
    if (admissionData.loginMobile && admissionData.password) {
      const existingUser = await User.findOne({
        userId: admissionData.loginMobile,
        organizationId: req.organizationId
      });
      if (existingUser) {
        return res.status(409).json({ message: 'A user account with this login mobile already exists.' });
      }

      const user = new User({
        userId:         admission.loginMobile,
        password:       admissionData.password,
        role:           'Student',
        mobile:         admission.mobile,
        fullName:       admission.fullName,
        userType:       'school',
        linkedId:       student._id,
        isActive:       'Yes',
        organizationId: req.organizationId
      });

      await user.save();
    }

    res.status(201).json({
      ...admission.toObject(),
      studentId: student.studentId,
      message: 'Admission, Student, and User created successfully.'
    });
  } catch (err) {
    console.error('Error creating admission:', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      if (field === 'mobile')     return res.status(409).json({ message: 'An admission with this mobile number already exists.' });
      if (field === 'aadhaar')    return res.status(409).json({ message: 'An admission with this Aadhaar number already exists.' });
      if (field === 'admissionId') return res.status(409).json({ message: 'Duplicate admission ID. Please try again.' });
      return res.status(409).json({ message: 'Duplicate entry detected. Please try again.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while creating admission.' });
  }
};

/**
 * @desc    Update admission by ID — also syncs Student record
 * @route   PUT /api/school/admission/:id
 */
exports.updateAdmission = async (req, res) => {
  try {
    const admission = await SchoolAdmission.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    const updateData = req.body;

    // ── Validate only fields that are being updated ────────────────────────
    if (updateData.mobile !== undefined && updateData.mobile !== '') {
      if (!isValidPhone(updateData.mobile)) {
        return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
      }
    }
    if (updateData.doctorMobile !== undefined && updateData.doctorMobile !== '') {
      if (!isValidPhone(updateData.doctorMobile)) {
        return res.status(400).json({ message: 'Doctor mobile number must be exactly 10 digits.' });
      }
    }
    if (updateData.primaryPhone !== undefined && updateData.primaryPhone !== '') {
      if (!isValidPhone(updateData.primaryPhone)) {
        return res.status(400).json({ message: 'Primary emergency contact phone must be exactly 10 digits.' });
      }
    }
    if (updateData.secondaryPhone !== undefined && updateData.secondaryPhone !== '') {
      if (!isValidPhone(updateData.secondaryPhone)) {
        return res.status(400).json({ message: 'Secondary emergency contact phone must be exactly 10 digits.' });
      }
    }
    if (updateData.age !== undefined && updateData.age !== '') {
      const age = Number(updateData.age);
      if (isNaN(age) || age < 1 || age > 120) {
        return res.status(400).json({ message: 'Age must be between 1 and 120.' });
      }
    }
    if (updateData.aadhaar !== undefined && updateData.aadhaar !== '') {
      if (!/^\d{12}$/.test(updateData.aadhaar.toString().trim())) {
        return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits.' });
      }
    }
    if (updateData.amount !== undefined && updateData.amount !== '') {
      if (isNaN(Number(updateData.amount)) || Number(updateData.amount) < 0) {
        return res.status(400).json({ message: 'Amount must be a non-negative number.' });
      }
    }
    if (updateData.feePlan && !VALID_FEE_PLANS.includes(updateData.feePlan)) {
      return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
    }
    if (updateData.paymentStatus && !VALID_PAYMENT_STATUS.includes(updateData.paymentStatus)) {
      return res.status(400).json({ message: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUS.join(', ')}.` });
    }
    if (updateData.nextDueDate && isDateInPast(updateData.nextDueDate)) {
      return res.status(400).json({ message: 'Next due date cannot be in the past.' });
    }

    // ── Apply updates to admission ─────────────────────────────────────────
    const updateFields = { ...updateData, updatedAt: Date.now() };
    delete updateFields._id;
    delete updateFields.organizationId;
    delete updateFields.createdAt;

    Object.assign(admission, updateFields);
    await admission.save();

    // ── Sync Student record ────────────────────────────────────────────────
    // Build a Student update object containing only the fields that were
    // sent in this request AND exist on the Student model.
    const studentUpdate = {};
    STUDENT_SYNC_FIELDS.forEach((field) => {
      if (updateData[field] !== undefined) {
        // Use the post-save admission value so we get the cleaned/validated data
        studentUpdate[field] = admission[field];
      }
    });

    if (Object.keys(studentUpdate).length > 0) {
      studentUpdate.updatedAt = Date.now();

      const updatedStudent = await Student.findOneAndUpdate(
        { admissionId: admission._id, organizationId: req.organizationId },
        { $set: studentUpdate },
        { new: true }
      );

      if (!updatedStudent) {
        // Log the miss but don't fail the request — admission was saved successfully
        console.warn(`⚠️ Student record not found for admissionId ${admission._id}. Admission updated but Student not synced.`);
      }
    }

    res.json(admission);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid admission ID format.' });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      if (field === 'mobile') return res.status(409).json({ message: 'An admission with this mobile number already exists.' });
      return res.status(409).json({ message: 'Duplicate entry detected.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error updating admission:', err.message);
    res.status(500).json({ message: 'Server error while updating admission.' });
  }
};

/**
 * @desc    Delete admission by ID
 * @route   DELETE /api/school/admission/:id
 */
exports.deleteAdmission = async (req, res) => {
  try {
    const admission = await SchoolAdmission.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    res.json({ message: 'Admission deleted successfully.' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid admission ID format.' });
    }
    console.error('Error deleting admission:', err.message);
    res.status(500).json({ message: 'Server error while deleting admission.' });
  }
};