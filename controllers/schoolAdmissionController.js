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
//                     status:      paidAmount > 0 && admission.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
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
const bcrypt = require('bcryptjs');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');
const FeeType = require('../models/FeeType');
const TimeTable = require('../models/schoolPeriod');
const Activity = require('../models/Activity');
// const Staff = require('../models/Staff');
const FitnessStaff = require('../models/FitnessStaff');
const Service = require('../models/SchoolService');
const SchoolServiceBooking = require('../models/SchoolServiceBooking');
const QRCode = require("qrcode");
const {
  computeTimetableActivityCounts,
  diffTimetableActivityCounts,
  negateActivityCounts,
  buildOccupancyInc,
  validateActivityCapacity,
} = require('../helpers/occupancyHelpers');
const { computeAdmissionStatus } = require('../utils/computeAdmissionStatus');
const { applyAdmissionPayment } = require('../helpers/schoolPaymentHelper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_GENDERS        = ['Male', 'Female', 'Other'];
const VALID_FEE_PLANS      = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Annual'];
const VALID_INSTITUTE_TYPES= ['School', 'Residency', 'DayCare'];
const VALID_PAYMENT_STATUS = ['Paid', 'Pending'];
const VALID_PAYMENT_MODES  = ['Cash', 'Bank Transfer'];
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

// ─── Fee / Date helpers ────────────────────────────────────────────────────────
const FEE_PLAN_DURATION = {
  Daily: 1, Weekly: 7, Monthly: 1, Quarterly: 3, HalfYearly: 6, Annual: 12
};

const FEE_PLAN_MAP = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', halfyearly: 'HalfYearly', annual: 'Annual'
};

// Reverse map: schema (title-case) → FeeType field name
const FEE_TYPE_FIELD_MAP = {
  Daily: 'daily', Weekly: 'weekly', Monthly: 'monthly',
  Quarterly: 'quarterly', HalfYearly: 'halfYearly', Annual: 'annual'
};

function calcEndDate(startDate, feePlan) {
  if (!startDate || !feePlan) return null;
  const d = new Date(startDate);
  const unit = FEE_PLAN_DURATION[feePlan];
  if (!unit) return null;
  if (feePlan === 'Daily' || feePlan === 'Weekly') d.setDate(d.getDate() + unit);
  else d.setMonth(d.getMonth() + unit);
  return d;
}

function parseJSONField(val) {
  if (!val) return undefined;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return undefined; } }
  return val;
}

const DAY_FIELDS = ['mondayActivityId', 'tuesdayActivityId', 'wednesdayActivityId', 'thursdayActivityId', 'fridayActivityId', 'saturdayActivityId', 'sundayActivityId'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function computeTimetableDayCounts(timetable) {
  const counts = {};
  for (const row of (timetable || [])) {
    if (!row.periodId) continue;
    const pid = row.periodId.toString();
    if (!counts[pid]) counts[pid] = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
    for (let i = 0; i < DAY_FIELDS.length; i++) {
      if (row[DAY_FIELDS[i]]) counts[pid][DAY_NAMES[i]]++;
    }
  }
  return counts;
}

function diffTimetableDayCounts(oldTt, newTt) {
  const oldCounts = computeTimetableDayCounts(oldTt);
  const newCounts = computeTimetableDayCounts(newTt);
  const allPids = new Set([...Object.keys(oldCounts), ...Object.keys(newCounts)]);
  const diff = {};
  for (const pid of allPids) {
    const old = oldCounts[pid] || { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
    const cur = newCounts[pid] || { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
    const d = {};
    for (const day of DAY_NAMES) {
      const delta = (cur[day] || 0) - (old[day] || 0);
      if (delta !== 0) d[day] = delta;
    }
    if (Object.keys(d).length > 0) diff[pid] = d;
  }
  return diff;
}

// Fields that exist on both Admission and Student and should always stay in sync
const STUDENT_SYNC_FIELDS = [
  'fullName', 'age', 'gender', 'dob', 'aadhaar', 'mobile', 'fullAddress',
  'photo', 'bloodGroup', 'physicalDisability', 'seriousDisease',
  'regularMedication', 'doctorName', 'doctorMobile',
  'primaryContactName', 'primaryRelation', 'primaryPhone',
  'secondaryContactName', 'secondaryRelation', 'secondaryPhone',
  'villageCity', 'alternateContact',
  'feePlan', 'feeTypeId', 'feeAmount', 'discount', 'totalFee',
  'paidAmount', 'remainingAmount', 'startDate', 'endDate',
  'amount', 'assignedCaregiver', 'responsibleStaffId',
  'hobbies', 'games', 'behaviour', 'status',
  'wakeUpTime', 'breakfastTime', 'lunchTime', 'dinnerTime'
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all school admissions with filtering
 * @route   GET /api/school/admission
 */
exports.getAllAdmissions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const { search, feePlan, status, paymentFilter } = req.query;

    let query = { organizationId: req.organizationId };

    if (search) {
      const s = search.trim();
      query.$or = [
        { admissionId: { $regex: s, $options: 'i' } },
        { fullName:    { $regex: s, $options: 'i' } },
        { mobile:      { $regex: s, $options: 'i' } },
      ];
    }

    if (feePlan) {
      if (!VALID_FEE_PLANS.includes(feePlan)) {
        return res.status(400).json({ message: `Invalid fee plan. Must be one of: ${VALID_FEE_PLANS.join(', ')}.` });
      }
      query.feePlan = feePlan;
    }

    if (status) query.status = status;

    if (paymentFilter === 'Paid') {
      query.remainingAmount = { $lte: 0 };
    } else if (paymentFilter === 'Pending') {
      query.remainingAmount = { $gt: 0 };
    }

    const totalRecords = await SchoolAdmission.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    const admissions = await SchoolAdmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const admissionsWithStatus = admissions.map(adm => {
      const statusMeta = computeAdmissionStatus(adm);
      return { ...adm.toObject(), ...statusMeta };
    });

    res.json({
      data: admissionsWithStatus,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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

    const statusMeta = computeAdmissionStatus(admission);
    const response = { ...admission.toObject(), ...statusMeta };
    res.json(response);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid admission ID format.' });
    }
    console.error('Error fetching admission:', err.message);
    res.status(500).json({ message: 'Server error while fetching admission.' });
  }
};

exports.getAdmissionPayments = async (req, res) => {
  try {
    const payments = await FeePayment.find({
      admissionId: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('responsibleStaff', 'fullName')
      .populate('allotmentId', 'amount status')
      .sort({ paymentDate: -1 });

    res.json({ data: payments });
  } catch (err) {
    console.error('getAdmissionPayments error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payment history.' });
  }
};

/**
 * @desc    Create new admission (also creates Student and User records)
 * @route   POST /api/school/admission
 */
exports.createAdmission = async (req, res) => {
  try {
    const admissionData = req.body;

    if (admissionData.hobbies) {
  try {
    admissionData.hobbies = JSON.parse(admissionData.hobbies);
  } catch {}
}

if (admissionData.games) {
  try {
    admissionData.games = JSON.parse(admissionData.games);
  } catch {}
}

    // ── Handle uploaded files (multer → controller mapping) ──
if (req.files) {
  // Single photo
  if (req.files.photo && req.files.photo.length > 0) {
    admissionData.photo = `/uploads/school/${req.files.photo[0].filename}`;
  }

  // Multiple health records
  if (req.files.healthRecord && req.files.healthRecord.length > 0) {
    admissionData.medicalReports = req.files.healthRecord.map(
      file => `/uploads/school/${file.filename}`
    );
  }
}

    // ── Normalize feePlan (frontend sends lowercase) ───────────────────────
    if (admissionData.feePlan) {
      const normalized = FEE_PLAN_MAP[admissionData.feePlan.trim().toLowerCase()];
      if (normalized) admissionData.feePlan = normalized;
    }

    // ── Map responsibleStaff → responsibleStaffId ──────────────────────────
    if (admissionData.responsibleStaff && !admissionData.responsibleStaffId) {
      admissionData.responsibleStaffId = admissionData.responsibleStaff;
    }
    delete admissionData.responsibleStaff;

    // ── Parse timetable / services from JSON strings ───────────────────────
    const rawTimetable = parseJSONField(admissionData.timetable);
    const rawServices = parseJSONField(admissionData.services);
    delete admissionData.timetable;
    delete admissionData.services;

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
    if (!admissionData.gender) {
      return res.status(400).json({ message: 'Gender is required.' });
    }
    if (!admissionData.fullAddress || !admissionData.fullAddress.trim()) {
      return res.status(400).json({ message: 'Full address is required.' });
    }
    if (!admissionData.primaryContactName || !admissionData.primaryContactName.trim()) {
      return res.status(400).json({ message: 'Primary contact name is required.' });
    }
    if (!admissionData.primaryRelation || !admissionData.primaryRelation.trim()) {
      return res.status(400).json({ message: 'Primary relation is required.' });
    }
    if (!admissionData.primaryPhone) {
      return res.status(400).json({ message: 'Primary phone is required.' });
    }
    if (!admissionData.startDate) {
      return res.status(400).json({ message: 'Start date is required.' });
    }
    if (!admissionData.responsibleStaffId) {
      return res.status(400).json({ message: 'Responsible staff is required.' });
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

    // ── Fee calculation (server-authoritative) ─────────────────────────────
    let feeAmount = 0, discount = 0, totalFee = 0;
    let paidAmount = 0, remainingAmount = 0, paymentStatus = 'Pending';

    if (admissionData.feeTypeId && admissionData.feePlan) {
      const feeType = await FeeType.findOne({
        _id: admissionData.feeTypeId,
        organizationId: req.organizationId
      }).lean();

      if (!feeType) {
        return res.status(400).json({ message: 'Selected fee type not found in this organization.' });
      }

      const planKey = FEE_TYPE_FIELD_MAP[admissionData.feePlan] || admissionData.feePlan.toLowerCase();
      feeAmount = feeType[planKey] || 0;
      discount = Math.max(0, Number(admissionData.discount) || 0);
      totalFee = Math.max(0, feeAmount - discount);

      // Add service totals to grand total
      let servicesTotal = 0;
      if (rawServices && rawServices.length > 0) {
        for (const s of rawServices) {
          servicesTotal += Number(s.totalFee) || 0;
        }
      }
      totalFee += servicesTotal;

      paidAmount = Math.max(0, Number(admissionData.paidAmount) || 0);
      if (paidAmount > totalFee) {
        return res.status(400).json({
          message: `Paid amount (₹${paidAmount.toLocaleString('en-IN')}) cannot exceed the total fee (₹${totalFee.toLocaleString('en-IN')}).`
        });
      }
      remainingAmount = Math.max(0, totalFee - paidAmount);
      paymentStatus = (remainingAmount <= 0 && paidAmount > 0) ? 'Paid' : 'Pending';

      // Overwrite with server-calculated values
      admissionData.feeAmount = feeAmount;
      admissionData.discount = discount;
      admissionData.totalFee = totalFee;
      admissionData.paidAmount = paidAmount;
      admissionData.remainingAmount = remainingAmount;
      admissionData.paymentStatus = paymentStatus;
    }

    // ── End date calculation ───────────────────────────────────────────────
    if (admissionData.startDate && admissionData.feePlan) {
      admissionData.endDate = calcEndDate(admissionData.startDate, admissionData.feePlan);
    }

    // ── Reference validations ──────────────────────────────────────────────
    const refErrors = [];

    if (admissionData.assignedCaregiver) {
      const cg = await FitnessStaff.findOne({
        _id: admissionData.assignedCaregiver
      }).lean();
      if (!cg) refErrors.push('Assigned caregiver not found.');
    }

    if (admissionData.responsibleStaffId) {
      const rs = await FitnessStaff.findOne({
        _id: admissionData.responsibleStaffId
      }).lean();
      if (!rs) refErrors.push('Responsible staff not found.');
    }

    if (rawTimetable && rawTimetable.length > 0) {
      for (let i = 0; i < rawTimetable.length; i++) {
        const row = rawTimetable[i];
        if (row.periodId) {
          const p = await TimeTable.findOne({
            _id: row.periodId,
            organizationId: req.organizationId
          }).lean();
          if (!p) refErrors.push(`Period at row ${i + 1} not found.`);
        }
        for (const df of DAY_FIELDS) {
          if (row[df]) {
            const a = await Activity.findOne({
              _id: row[df],
              organizationId: req.organizationId
            }).lean();
            if (!a) refErrors.push(`Activity for ${df} at row ${i + 1} not found.`);
          }
        }
      }
      // ── Per‑activity capacity check ──────────────────────────────────
      const activityCounts = computeTimetableActivityCounts(rawTimetable);
      const periodDocs = await TimeTable.find({
        _id: { $in: Object.keys(activityCounts) },
        organizationId: req.organizationId
      }).lean();
      const periodMap = {};
      for (const p of periodDocs) periodMap[p._id.toString()] = p;
      const capErr = validateActivityCapacity(periodMap, activityCounts);
      if (capErr) refErrors.push(capErr);
    }

    if (refErrors.length > 0) {
      return res.status(400).json({ message: refErrors.join(' ') });
    }

    // ── Date-aware capacity check for services ──────────────────────────
    if (rawServices && rawServices.length > 0) {
      for (const s of rawServices) {
        const svc = await Service.findById(s.serviceId).lean();
        if (!svc) {
          return res.status(400).json({ message: 'Service not found.' });
        }
        if (!svc.isActive) {
          return res.status(400).json({ message: `"${svc.serviceName}" is not active.` });
        }
        const overlapping = await SchoolServiceBooking.countDocuments({
          serviceId: s.serviceId,
          organizationId: req.organizationId,
          status: 'Active',
          startDate: { $lt: new Date(s.endDate) },
          endDate: { $gt: new Date(s.startDate) },
        });
        if (overlapping >= svc.capacity) {
          return res.status(409).json({
            message: `"${svc.serviceName}" is fully booked (${overlapping}/${svc.capacity}) for the selected dates.`,
          });
        }
      }
    }

    // ── Save admission ─────────────────────────────────────────────────────
    const admission = new SchoolAdmission({
      ...admissionData,
      timetable: rawTimetable || [],
      services: rawServices || [],
      organizationId: req.organizationId
    });

    await admission.save();

    // ── Increment period occupancy for timetable ─────────────────────────
    if (rawTimetable && rawTimetable.length > 0) {
      const activityCounts = computeTimetableActivityCounts(rawTimetable);
      const incMap = buildOccupancyInc(activityCounts);
      const ops = Object.entries(incMap).map(([pid, inc]) => ({
        updateOne: { filter: { _id: pid }, update: { $inc: inc } }
      }));
      if (ops.length > 0) await TimeTable.bulkWrite(ops);
    }

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
      wakeUpTime:           admission.wakeUpTime,
      breakfastTime:        admission.breakfastTime,
      lunchTime:            admission.lunchTime,
      dinnerTime:           admission.dinnerTime,
      status:               admission.status,
      organizationId:       req.organizationId
    });

    await student.save();

    // ── Auto-create fee allotment ──────────────────────────────────────────
    let feeAllotment = null;
    if (admission.feePlan && admission.totalFee > 0) {
      try {
        feeAllotment = await FeeAllotment.create({
          studentId:   student._id,
          admissionId: admission._id,
          feeTypeId:   admission.feeTypeId,
          description: admission.feeDescription || 'Fee Allotted at Admission',
          feePlan:     admission.feePlan,
          amount:      admission.totalFee,
          dueDate:     admission.nextDueDate || null,
          status:      admission.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
          organizationId: req.organizationId
        });
      } catch (allotmentErr) {
        console.error('⚠️ Failed to create Fee Allotment:', allotmentErr.message);
      }
    }

    // ── Create SchoolServiceBooking records for each service ───────────
    if (rawServices && rawServices.length > 0) {
      for (const s of rawServices) {
        try {
          const dates = [];
          const cursor = new Date(s.startDate);
          const end = new Date(s.endDate);
          while (cursor < end) {
            dates.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
          }

          await SchoolServiceBooking.create({
            admissionId: admission._id,
            serviceId: s.serviceId,
            studentName: admission.fullName,
            startDate: new Date(s.startDate),
            endDate: new Date(s.endDate),
            duration: Number(s.days) || 0,
            perDayFee: Number(s.perDayFee) || 0,
            totalFee: Number(s.totalFee) || 0,
            paidAmount: 0,
            isFromAdmission: true,
            responsibleStaff: admissionData.responsibleStaffId || null,
            organizationId: req.organizationId,
            status: 'Active',
            dates,
          });

          await Service.findByIdAndUpdate(s.serviceId, { $inc: { bookedCount: 1 } });
        } catch (bookingErr) {
          console.error(`⚠️ Failed to create booking for service ${s.serviceId}:`, bookingErr.message);
        }
      }
    }

    // ── If paidAmount > 0, create FeePayment + push to paymentHistory ──
    if (paidAmount > 0) {
      try {
        await FeePayment.create({
          studentId:   student._id,
          admissionId: admission._id,
          allotmentId: feeAllotment?._id,
          amount:      paidAmount,
          paymentMode: admissionData.paymentMode || 'Cash',
          paymentDate: admissionData.paymentDate || new Date(),
          description: admission.feeDescription || 'Admission Fee',
          responsibleStaff: admissionData.responsibleStaffId || null,
          organizationId: req.organizationId
        });

        admission.paymentHistory.push({
          amount: paidAmount,
          paymentDate: admissionData.paymentDate || new Date(),
          paymentMode: admissionData.paymentMode || 'Cash',
          description: admission.feeDescription || 'Admission Fee',
          responsibleStaff: admissionData.responsibleStaffId || null,
        });

        const allPayments = await FeePayment.aggregate([
          { $match: { admissionId: admission._id, organizationId: req.organizationId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalPaid = allPayments[0]?.total || 0;
        admission.paidAmount = totalPaid;
        admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - totalPaid);
        await admission.save();
      } catch (paymentErr) {
        console.error('⚠️ Failed to create FeePayment:', paymentErr.message);
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

      const hashedPassword = await bcrypt.hash(admissionData.password, 10);

      const user = new User({
        userId:         admission.loginMobile,
        password:       hashedPassword,
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

    // ── Generate QR Code ───────────────────────────────────────────
    const qrData = JSON.stringify({
      admissionId: admission.admissionId,
      organizationId: admission.organizationId,
    });
    const qrImage = await QRCode.toDataURL(qrData);
    admission.qrCode = qrImage;
    await admission.save();

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
    const fs = require('fs');
const path = require('path');

// Delete old photo if new one uploaded
if (req.files?.photo && admission.photo) {
  const oldPath = path.join(__dirname, '..', admission.photo);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }
}

const updateData = req.body;

// ── Parse JSON fields from frontend ──
if (updateData.hobbies) {
  try { updateData.hobbies = JSON.parse(updateData.hobbies); } catch {}
}
if (updateData.games) {
  try { updateData.games = JSON.parse(updateData.games); } catch {}
}
if (updateData.timetable) {
  const parsed = parseJSONField(updateData.timetable);
  if (parsed) updateData.timetable = parsed;
}
if (updateData.services) {
  const parsed = parseJSONField(updateData.services);
  if (parsed) updateData.services = parsed;
}

// ── Normalize feePlan (frontend sends lowercase) ───────────────────
if (updateData.feePlan) {
  const normalized = FEE_PLAN_MAP[updateData.feePlan.trim().toLowerCase()];
  if (normalized) updateData.feePlan = normalized;
}

// ── Map responsibleStaff → responsibleStaffId ──────────────────────
if (updateData.responsibleStaff && !updateData.responsibleStaffId) {
  updateData.responsibleStaffId = updateData.responsibleStaff;
}
delete updateData.responsibleStaff;

// ── Handle uploaded files ──
if (req.files) {
  if (req.files.photo && req.files.photo.length > 0) {
    updateData.photo = `/uploads/school/${req.files.photo[0].filename}`;
  }
  if (req.files.healthRecord && req.files.healthRecord.length > 0) {
    updateData.medicalReports = req.files.healthRecord.map(
      file => `/uploads/school/${file.filename}`
    );
  }
}
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

    // ── Recalculate fee if feeTypeId or feePlan changed ─────────────────────
    if (updateData.feeTypeId || updateData.feePlan || updateData.paidAmount !== undefined || updateData.discount !== undefined) {
      const feeTypeId = updateData.feeTypeId || admission.feeTypeId;
      const feePlan = updateData.feePlan || admission.feePlan;
      const discount = updateData.discount !== undefined ? Number(updateData.discount) : (admission.discount || 0);
      const paidAmount = updateData.paidAmount !== undefined ? Number(updateData.paidAmount) : (admission.paidAmount || 0);

      if (feeTypeId && feePlan) {
        const feeType = await FeeType.findOne({ _id: feeTypeId, organizationId: req.organizationId }).lean();
        if (!feeType) {
          return res.status(400).json({ message: 'Selected fee type not found in this organization.' });
        }
        const planKey = FEE_TYPE_FIELD_MAP[feePlan] || feePlan.toLowerCase();
        let feeAmount = feeType[planKey] || 0;
        let totalFee = Math.max(0, feeAmount - Math.max(0, discount));

        // Recalculate service totals from current admission.services
        let servicesTotal = 0;
        if (admission.services && admission.services.length > 0) {
          for (const s of admission.services) {
            servicesTotal += Number(s.totalFee) || 0;
          }
        }
        totalFee += servicesTotal;

        let remainingAmount = Math.max(0, totalFee - Math.max(0, paidAmount));
        let paymentStatus = (remainingAmount <= 0 && paidAmount > 0) ? 'Paid' : 'Pending';

        updateData.feeAmount = feeAmount;
        updateData.discount = Math.max(0, discount);
        updateData.totalFee = totalFee;
        updateData.paidAmount = Math.max(0, paidAmount);
        updateData.remainingAmount = remainingAmount;
        updateData.paymentStatus = paymentStatus;
      }
    }

    // ── Recalculate endDate if startDate or feePlan changed ─────────────────
    const startDate = updateData.startDate || admission.startDate;
    const feePlan = updateData.feePlan || admission.feePlan;
    if (startDate && feePlan) {
      updateData.endDate = calcEndDate(startDate, feePlan);
    }

    // ── Capture timetable diff before applying updates ─────────────────
    let timetableDiff = null;
    let newStatusOccupancy = null;
    if (updateData.timetable !== undefined) {
      timetableDiff = diffTimetableActivityCounts(admission.timetable, updateData.timetable);
      // Extract positive additions for capacity check
      const additions = {};
      for (const [pid, activities] of Object.entries(timetableDiff)) {
        for (const [aid, days] of Object.entries(activities)) {
          for (const [day, delta] of Object.entries(days)) {
            if (delta > 0) {
              if (!additions[pid]) additions[pid] = {};
              if (!additions[pid][aid]) additions[pid][aid] = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
              additions[pid][aid][day] = (additions[pid][aid][day] || 0) + delta;
            }
          }
        }
      }
      if (Object.keys(additions).length > 0) {
        const periodDocs = await TimeTable.find({
          _id: { $in: Object.keys(additions) },
          organizationId: req.organizationId
        }).lean();
        const periodMap = {};
        for (const p of periodDocs) periodMap[p._id.toString()] = p;
        const capErr = validateActivityCapacity(periodMap, additions);
        if (capErr) return res.status(409).json({ message: capErr });
      }
    }

    // ── Handle status change occupancy ──────────────────────────────────────
    if (updateData.status && updateData.status !== admission.status) {
      if (updateData.status === 'Inactive') {
        // Active → Inactive: release current occupancy
        if (admission.status === 'Active') {
          const counts = computeTimetableActivityCounts(admission.timetable);
          newStatusOccupancy = buildOccupancyInc(negateActivityCounts(counts));
        }
      } else if (updateData.status === 'Active') {
        // Inactive → Active: validate and restore occupancy using final timetable
        const effectiveTt = updateData.timetable !== undefined ? updateData.timetable : admission.timetable;
        const counts = computeTimetableActivityCounts(effectiveTt);
        const pidSet = Object.keys(counts);
        if (pidSet.length > 0) {
          const periodDocs = await TimeTable.find({
            _id: { $in: pidSet },
            organizationId: req.organizationId
          }).lean();
          const periodMap = {};
          for (const p of periodDocs) periodMap[p._id.toString()] = p;
          const capErr = validateActivityCapacity(periodMap, counts);
          if (capErr) return res.status(409).json({ message: capErr });
        }
        newStatusOccupancy = buildOccupancyInc(counts);
      }
    }

    // ── Apply updates to admission ─────────────────────────────────────────
    const updateFields = { ...updateData, updatedAt: Date.now() };
    delete updateFields._id;
    delete updateFields.organizationId;
    delete updateFields.createdAt;

    Object.assign(admission, updateFields);
    await admission.save();

    // ── Apply occupancy changes (timetable diff + status change) ───────
    const allOps = {};
    if (timetableDiff) {
      const incMap = buildOccupancyInc(timetableDiff);
      for (const [pid, inc] of Object.entries(incMap)) {
        if (!allOps[pid]) allOps[pid] = {};
        for (const [key, val] of Object.entries(inc)) {
          allOps[pid][key] = (allOps[pid][key] || 0) + val;
        }
      }
    }
    if (newStatusOccupancy) {
      for (const [pid, inc] of Object.entries(newStatusOccupancy)) {
        if (!allOps[pid]) allOps[pid] = {};
        for (const [key, val] of Object.entries(inc)) {
          allOps[pid][key] = (allOps[pid][key] || 0) + val;
        }
      }
    }
    if (Object.keys(allOps).length > 0) {
      const ops = Object.entries(allOps).map(([pid, inc]) => ({
        updateOne: { filter: { _id: pid }, update: { $inc: inc } }
      }));
      await TimeTable.bulkWrite(ops);
    }

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

    // ── Sync User record (password / loginMobile) ─────────────────────────
    if (updateData.password || updateData.loginMobile) {
      const studentDoc = await Student.findOne({ admissionId: admission._id }).lean();
      if (studentDoc) {
        const userUpdate = {};
        if (updateData.password) {
          userUpdate.password = await bcrypt.hash(updateData.password, 10);
        }
        if (updateData.loginMobile) {
          userUpdate.userId = admission.loginMobile;
        }
        if (Object.keys(userUpdate).length > 0) {
          userUpdate.updatedAt = Date.now();
          const userResult = await User.findOneAndUpdate(
            { linkedId: studentDoc._id, role: 'Student' },
            { $set: userUpdate },
            { new: true }
          );
          if (!userResult) {
            console.warn(`⚠️ User record not found for studentId ${studentDoc._id}. Password/loginMobile not synced.`);
          }
        }
      } else {
        console.warn(`⚠️ Student record not found for admissionId ${admission._id}. Cannot sync User password/loginMobile.`);
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
    const admission = await SchoolAdmission.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    // Decrement occupancy only if Active
    if (admission.status === 'Active') {
      const counts = computeTimetableActivityCounts(admission.timetable);
      const incMap = buildOccupancyInc(negateActivityCounts(counts));
      const ops = Object.entries(incMap).map(([pid, inc]) => ({
        updateOne: { filter: { _id: pid }, update: { $inc: inc } }
      }));
      if (ops.length > 0) await TimeTable.bulkWrite(ops);
    }

    await SchoolAdmission.findByIdAndDelete(admission._id);

    res.json({ message: 'Admission deleted successfully.' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid admission ID format.' });
    }
    console.error('Error deleting admission:', err.message);
    res.status(500).json({ message: 'Server error while deleting admission.' });
  }
};

/**
 * @desc    Collect pending fee payment for an admission
 * @route   POST /api/school/admission/:id/collect-payment
 */
exports.collectPayment = async (req, res) => {
  try {
    const { amount, paymentMode, paymentDate, description, responsibleStaff } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required.' });
    }
    if (!paymentDate) {
      return res.status(400).json({ message: 'Payment date is required.' });
    }
    if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
      return res.status(400).json({ message: `Invalid payment mode. Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.` });
    }

    const numAmount = Number(amount);
    const pDate = new Date(paymentDate);
    if (isNaN(pDate.getTime())) {
      return res.status(400).json({ message: 'Invalid payment date.' });
    }

    // ── Find admission ───────────────────────────────────────────
    const admission = await SchoolAdmission.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found.' });
    }

    // ── Find Student linked to this admission ────────────────────
    let student = await Student.findOne({ admissionId: admission._id });
    if (!student) {
      return res.status(400).json({ message: 'No student record linked to this admission.' });
    }

    // ── Delegate to shared helper ─────────────────────────────────
    const { payment } = await applyAdmissionPayment({
      admission,
      student,
      amount: numAmount,
      paymentMode,
      paymentDate: pDate,
      description,
      responsibleStaff,
      organizationId: req.organizationId,
    });

    const populated = await FeePayment.findById(payment._id)
      .populate('responsibleStaff', 'fullName');

    res.status(201).json({
      payment: populated,
      admission: {
        _id: admission._id,
        paidAmount: admission.paidAmount,
        remainingAmount: admission.remainingAmount,
        totalFee: admission.totalFee,
      },
    });
  } catch (err) {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid admission ID format.' });
    }
    console.error('collectPayment error:', err.message);
    res.status(500).json({ message: 'Failed to record payment. Please try again.' });
  }
};

