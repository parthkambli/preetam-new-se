
// // controllers/fitnessMemberController.js
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const FitnessMember = require('../models/FitnessMember');
// const FitnessEnquiry = require('../models/FitnessEnquiry');

// // ─────────────────────────────────────────────────────────────────────────────
// // Multer configuration for photo upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'members');
//     fs.mkdirSync(uploadDir, { recursive: true }); // ✅ create folder if missing
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|webp/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) return cb(null, true);
//     cb(new Error('Only JPG, PNG and WebP images are allowed!'));
//   }
// }).single('photo');

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper to delete old photo from disk
// const deleteOldPhoto = (photoPath) => {
//   if (photoPath && photoPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', photoPath);
//     if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * @desc    Get all fitness members with filtering
//  * @route   GET /api/fitness/member
//  * @access  Private
//  */
// exports.getAllMembers = async (req, res) => {
//   try {
//     const { search, status, activity, plan } = req.query;

//     const query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (activity) query.activity = activity;
//     if (plan) query.plan = plan;

//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } },
//         { memberId: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const members = await FitnessMember.find(query)
//     // .populate('staff', 'fullName')
//     .populate('responsibleStaff', 'name') 
//       .sort({ createdAt: -1 })
//       .select('-password');

//     res.json(members);
//   } catch (err) {
//     console.error('Error fetching members:', err.message);
//     res.status(500).json({ message: 'Server error while fetching members' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * @desc    Get single member by ID
//  * @route   GET /api/fitness/member/:id
//  * @access  Private
//  */
// exports.getMemberById = async (req, res) => {
//   try {
//     const member = await FitnessMember.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     }).select('-password');

//     if (!member) {
//       return res.status(404).json({ message: 'Member not found' });
//     }

//     res.json(member);
//   } catch (err) {
//     console.error('Error fetching member:', err.message);
//     res.status(500).json({ message: 'Server error while fetching member' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * @desc    Create new fitness member
//  * @route   POST /api/fitness/member
//  * @access  Private
//  */
// exports.createMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ message: 'Photo size cannot exceed 2MB' });
//       }
//       return res.status(400).json({ message: err.message || 'Photo upload failed' });
//     }

//     try {
//       const mongoose = require('mongoose');

//       const memberData = {
//         ...req.body,
//         organizationId: req.organizationId,
//       };

//       // ✅ staff safe handling
//       if (req.body.staff && mongoose.Types.ObjectId.isValid(req.body.staff)) {
//         memberData.staff = req.body.staff;
//       } else {
//         memberData.staff = null;
//       }

//       if (req.file) {
//         memberData.photo = `/uploads/members/${req.file.filename}`;
//       }

//       if (
//         !memberData.name ||
//         !memberData.mobile ||
//         !memberData.activity ||
//         !memberData.startDate ||
//         !memberData.password
//       ) {
//         if (req.file) deleteOldPhoto(memberData.photo);
//         return res.status(400).json({
//           message: 'Name, mobile, activity, start date and password are required'
//         });
//       }

//       const member = new FitnessMember(memberData);
//       await member.save();

//       if (memberData.enquiryId) {
//         await FitnessEnquiry.findByIdAndUpdate(memberData.enquiryId, {
//           status: 'Admitted'
//         });
//       }

//       const createdMember = await FitnessMember.findById(member._id)
//         .populate('staff', 'fullName name')
//         .select('-password');

//       res.status(201).json({
//         ...createdMember.toObject(),
//         message: 'Member added successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('Error creating member:', err);

//       if (err.code === 11000) {
//         return res.status(400).json({ message: 'Mobile number already exists' });
//       }

//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map(e => e.message).join(', ')
//         });
//       }

//       if (err.name === 'CastError') {
//         return res.status(400).json({
//           message: `Invalid value for ${err.path}`
//         });
//       }

//       res.status(500).json({ message: 'Server error while creating member' });
//     }
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * @desc    Update member
//  * @route   PUT /api/fitness/member/:id
//  * @access  Private
//  */
// exports.updateMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ message: 'Photo size cannot exceed 2MB' });
//       }
//       return res.status(400).json({ message: err.message || 'Photo upload failed' });
//     }

//     try {
//       const mongoose = require('mongoose');

//       const member = await FitnessMember.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!member) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(404).json({ message: 'Member not found' });
//       }

//       const updateData = { ...req.body };

//       // ✅ staff safe handling
//       if (req.body.staff && mongoose.Types.ObjectId.isValid(req.body.staff)) {
//         updateData.staff = req.body.staff;
//       } else {
//         updateData.staff = null;
//       }

//       if (req.file) {
//         if (member.photo) deleteOldPhoto(member.photo);
//         updateData.photo = `/uploads/members/${req.file.filename}`;
//       }

//       Object.assign(member, updateData);
//       await member.save();

//       const updated = await FitnessMember.findById(member._id)
//         .populate('staff', 'fullName name')
//         .select('-password');

//       res.json({
//         ...updated.toObject(),
//         message: 'Member updated successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('Error updating member:', err);

//       if (err.code === 11000) {
//         return res.status(400).json({ message: 'Mobile number already exists' });
//       }

//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map(e => e.message).join(', ')
//         });
//       }

//       if (err.name === 'CastError') {
//         return res.status(400).json({
//           message: `Invalid value for ${err.path}`
//         });
//       }

//       res.status(500).json({ message: 'Server error while updating member' });
//     }
//   });
// };
// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * @desc    Delete member
//  * @route   DELETE /api/fitness/member/:id
//  * @access  Private
//  */
// exports.deleteMember = async (req, res) => {
//   try {
//     const member = await FitnessMember.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!member) {
//       return res.status(404).json({ message: 'Member not found' });
//     }

//     // Delete photo from disk if it exists
//     if (member.photo) deleteOldPhoto(member.photo);

//     res.json({ message: 'Member deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting member:', err.message);
//     res.status(500).json({ message: 'Server error while deleting member' });
//   }
// };











// // controllers/fitnessMemberController.js
// const fs   = require('fs');
// const path = require('path');
// const multer = require('multer');
// const mongoose = require('mongoose');

// const FitnessMember    = require('../models/FitnessMember');
// const FitnessEnquiry   = require('../models/FitnessEnquiry');
// const FeeAllotment     = require('../models/FitnessFeeAllotment');
// const FeePayment       = require('../models/FitnessFeePayment');

// // ─── Multer ───────────────────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'members');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
//   fileFilter: (req, file, cb) => {
//     const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase()) &&
//                /jpeg|jpg|png|webp/.test(file.mimetype);
//     ok ? cb(null, true) : cb(new Error('Only JPG, PNG and WebP images are allowed.'));
//   },
// }).single('photo');

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const deleteOldPhoto = (photoPath) => {
//   if (photoPath && photoPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', photoPath);
//     try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
//   }
// };

// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// /**
//  * Validate and normalise a single activityFee entry coming from the request.
//  * Returns { error: string } on failure, or { data: object } on success.
//  */
// const validateActivityFee = (af, index) => {
//   const prefix = `Activity ${index + 1}`;

//   if (!af.activity || !isValidObjectId(af.activity)) {
//     return { error: `${prefix}: a valid activity ID is required.` };
//   }

//   if (!af.startDate) return { error: `${prefix}: start date is required.` };
//   if (!af.endDate)   return { error: `${prefix}: end date is required.` };

//   const start = new Date(af.startDate);
//   const end   = new Date(af.endDate);

//   if (isNaN(start.getTime())) return { error: `${prefix}: start date is invalid.` };
//   if (isNaN(end.getTime()))   return { error: `${prefix}: end date is invalid.` };

//   // Start date must not be in the past (allow today)
//   const todayMidnight = new Date();
//   todayMidnight.setHours(0, 0, 0, 0);
//   if (start < todayMidnight) {
//     return { error: `${prefix}: start date cannot be in the past.` };
//   }

//   if (end < start) {
//     return { error: `${prefix}: end date cannot be before start date.` };
//   }

//   const planFee    = Number(af.planFee)    || 0;
//   const discount   = Number(af.discount)   || 0;
//   const finalAmount = Number(af.finalAmount) || 0;

//   if (planFee < 0)    return { error: `${prefix}: plan fee cannot be negative.` };
//   if (discount < 0)   return { error: `${prefix}: discount cannot be negative.` };
//   if (discount > planFee && planFee > 0) {
//     return { error: `${prefix}: discount (₹${discount}) cannot exceed plan fee (₹${planFee}).` };
//   }

//   const validPlans   = ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'];
//   const validModes   = ['Cash', 'Cheque', 'Online', 'UPI', ''];
//   const validStatuses = ['Paid', 'Pending'];
//   const validMembershipStatuses = ['Active', 'Inactive'];

//   if (af.plan && !validPlans.includes(af.plan)) {
//     return { error: `${prefix}: invalid plan "${af.plan}".` };
//   }
//   if (af.paymentMode && !validModes.includes(af.paymentMode)) {
//     return { error: `${prefix}: invalid payment mode "${af.paymentMode}".` };
//   }
//   if (af.paymentStatus && !validStatuses.includes(af.paymentStatus)) {
//     return { error: `${prefix}: invalid payment status "${af.paymentStatus}".` };
//   }
//   if (af.membershipStatus && !validMembershipStatuses.includes(af.membershipStatus)) {
//     return { error: `${prefix}: invalid membership status.` };
//   }
//   if (af.staff && !isValidObjectId(af.staff)) {
//     return { error: `${prefix}: invalid staff ID.` };
//   }
//   if (af.feeType && !isValidObjectId(af.feeType)) {
//     return { error: `${prefix}: invalid fee type ID.` };
//   }
//   if (af.paymentDate) {
//     const pd = new Date(af.paymentDate);
//     if (isNaN(pd.getTime())) return { error: `${prefix}: payment date is invalid.` };
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//     if (pd >= tomorrow) {
//       return { error: `${prefix}: payment date cannot be in the future.` };
//     }
//   }

//   return {
//     data: {
//       activity:        af.activity,
//       feeType:         af.feeType  || null,
//       plan:            af.plan     || 'Monthly',
//       planFee,
//       discount,
//       finalAmount:     Math.max(0, planFee - discount),
//       paymentStatus:   af.paymentStatus  || 'Pending',
//       paymentMode:     af.paymentMode    || '',
//       paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//       planNotes:       af.planNotes      || '',
//       startDate:       start,
//       endDate:         end,
//       membershipStatus: af.membershipStatus || 'Inactive',
//       staff:           af.staff || null,
//     },
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // After saving a member, sync each activityFee entry to FeeAllotment +
// // FeePayment tables so they appear in the Allot Fees / Add Payments views.
// // ─────────────────────────────────────────────────────────────────────────────
// const syncFeesToTables = async (member, orgId, previousAllotmentIds = []) => {
//   // Delete old allotments that no longer have a corresponding activityFee
//   const currentAllotmentIds = member.activityFees
//     .map((af) => af.allotmentId?.toString())
//     .filter(Boolean);

//   const orphaned = previousAllotmentIds.filter(
//     (id) => id && !currentAllotmentIds.includes(id.toString())
//   );
//   if (orphaned.length) {
//     await FeeAllotment.deleteMany({ _id: { $in: orphaned }, organizationId: orgId });
//     await FeePayment.deleteMany({ allotmentId: { $in: orphaned }, organizationId: orgId });
//   }

//   // Upsert allotment + payment for each activityFee
//   for (let i = 0; i < member.activityFees.length; i++) {
//     const af = member.activityFees[i];

//     // Only sync if there is a fee type selected (otherwise nothing to allot)
//     if (!af.feeType) continue;

//     // Determine feePlan mapping: convert member plan to allotment plan
//     const planMap = {
//       Monthly:      'Monthly',
//       Quarterly:    'Monthly',   // closest available
//       'Half Yearly':'Monthly',
//       Yearly:       'Annual',
//     };
//     const feePlan = planMap[af.plan] || 'Monthly';

//     let allotment;
//     if (af.allotmentId) {
//       // Update existing allotment
//       allotment = await FeeAllotment.findByIdAndUpdate(
//         af.allotmentId,
//         {
//           memberId:         member._id,
//           feeTypeId:        af.feeType,
//           amount:           af.finalAmount || af.planFee || 0,
//           feePlan,
//           dueDate:          af.endDate,
//           responsibleStaff: af.staff || null,
//           organizationId:   orgId,
//           status:           af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//         },
//         { new: true, upsert: false }
//       );
//     } else {
//       // Create new allotment
//       allotment = await FeeAllotment.create({
//         memberId:         member._id,
//         feeTypeId:        af.feeType,
//         amount:           af.finalAmount || af.planFee || 0,
//         feePlan,
//         dueDate:          af.endDate,
//         responsibleStaff: af.staff || null,
//         organizationId:   orgId,
//         status:           af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//       });

//       // Save allotmentId back to the activityFee subdoc
//       member.activityFees[i].allotmentId = allotment._id;
//     }

//     // If payment status is Paid and finalAmount > 0, upsert a payment record
//     if (af.paymentStatus === 'Paid' && (af.finalAmount || af.planFee) > 0 && allotment) {
//       const existingPayment = await FeePayment.findOne({
//         allotmentId:    allotment._id,
//         organizationId: orgId,
//       });

//       const paymentData = {
//         memberId:       member._id,
//         allotmentId:    allotment._id,
//         amount:         af.finalAmount || af.planFee,
//         paymentMode:    af.paymentMode || 'Cash',
//         paymentDate:    af.paymentDate || new Date(),
//         organizationId: orgId,
//         description:    `Activity fee - ${af.plan} plan`,
//         feePlan,
//       };

//       if (existingPayment) {
//         await FeePayment.findByIdAndUpdate(existingPayment._id, paymentData);
//       } else {
//         await FeePayment.create(paymentData);
//       }

//       // Mark allotment as Paid
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//     } else if (af.paymentStatus === 'Pending' && allotment) {
//       // Remove any stale payment if status changed back to Pending
//       // (only do this for existing records that were just edited)
//       // We DON'T auto-delete existing payments to preserve audit trail.
//     }
//   }

//   // Persist the allotmentId updates back to DB
//   await FitnessMember.findByIdAndUpdate(
//     member._id,
//     {
//       $set: {
//         activityFees: member.activityFees.map((af) => af.toObject ? af.toObject() : af),
//       },
//     },
//     { new: false }
//   );
// };

// // ─── GET ALL ──────────────────────────────────────────────────────────────────
// exports.getAllMembers = async (req, res) => {
//   try {
//     const { search, status, activity, plan } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status)   query.membershipStatus = status;
//     if (plan)     query['activityFees.plan'] = plan;
//     if (activity) query['activityFees.activity'] = activity;

//     if (search) {
//       query.$or = [
//         { name:     { $regex: search, $options: 'i' } },
//         { mobile:   { $regex: search, $options: 'i' } },
//         { memberId: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const members = await FitnessMember.find(query)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description')
//       .populate('activityFees.staff',    'fullName name')
//       .sort({ createdAt: -1 })
//       .select('-password');

//     // Recompute live membershipStatus for each member without a save
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const result = members.map((m) => {
//       const obj = m.toObject();
//       let anyActive = false;

//       obj.activityFees = (obj.activityFees || []).map((af) => {
//         if (af.startDate && af.endDate) {
//           const s = new Date(af.startDate); s.setHours(0, 0, 0, 0);
//           const e = new Date(af.endDate);   e.setHours(23, 59, 59, 999);
//           const active = today >= s && today <= e && af.paymentStatus === 'Paid';
//           af.membershipStatus = active ? 'Active' : 'Inactive';
//           if (active) anyActive = true;
//         }
//         return af;
//       });

//       obj.membershipStatus = anyActive ? 'Active' : 'Inactive';
//       return obj;
//     });

//     res.json(result);
//   } catch (err) {
//     console.error('getAllMembers error:', err);
//     res.status(500).json({ message: 'Server error while fetching members.' });
//   }
// };

// // ─── GET ONE ──────────────────────────────────────────────────────────────────
// exports.getMemberById = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     })
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description monthly quarterly halfYearly annual')
//       .populate('activityFees.staff',    'fullName name')
//       .select('-password');

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     // Recompute live status
//     const today = new Date(); today.setHours(0, 0, 0, 0);
//     const obj   = member.toObject();
//     let anyActive = false;

//     obj.activityFees = (obj.activityFees || []).map((af) => {
//       if (af.startDate && af.endDate) {
//         const s = new Date(af.startDate); s.setHours(0, 0, 0, 0);
//         const e = new Date(af.endDate);   e.setHours(23, 59, 59, 999);
//         const active = today >= s && today <= e && af.paymentStatus === 'Paid';
//         af.membershipStatus = active ? 'Active' : 'Inactive';
//         if (active) anyActive = true;
//       }
//       return af;
//     });
//     obj.membershipStatus = anyActive ? 'Active' : 'Inactive';

//     res.json(obj);
//   } catch (err) {
//     console.error('getMemberById error:', err);
//     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
//     res.status(500).json({ message: 'Server error while fetching member.' });
//   }
// };

// // ─── CREATE ───────────────────────────────────────────────────────────────────
// exports.createMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2 MB.' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed.' });
//     }

//     try {
//       const {
//         name, mobile, email, age, gender, address,
//         userId, password, enquiryId,
//         activityFees: rawActivityFees,
//       } = req.body;

//       // ── Basic field validation ──────────────────────────────────────────
//       const fieldErrors = [];

//       if (!name || !name.trim()) fieldErrors.push('Full name is required.');
//       if (!mobile || !mobile.trim()) {
//         fieldErrors.push('Mobile number is required.');
//       } else if (!/^\d{10}$/.test(mobile.trim())) {
//         fieldErrors.push('Mobile must be a valid 10-digit number.');
//       }
//       if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//         fieldErrors.push('Please provide a valid email address.');
//       }
//       if (age !== undefined && age !== '') {
//         const ageNum = Number(age);
//         if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//           fieldErrors.push('Age must be between 1 and 120.');
//         }
//       }
//       if (!password || !password.trim()) fieldErrors.push('Password is required.');
//       if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//         fieldErrors.push('Invalid gender value.');
//       }
//       if (enquiryId && !isValidObjectId(enquiryId)) {
//         fieldErrors.push('Invalid enquiry ID.');
//       }

//       if (fieldErrors.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: fieldErrors.join(' ') });
//       }

//       // ── Duplicate mobile check ──────────────────────────────────────────
//       const existingMobile = await FitnessMember.findOne({
//         mobile: mobile.trim(),
//         organizationId: req.organizationId,
//       });
//       if (existingMobile) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(409).json({ message: `A member with mobile ${mobile.trim()} already exists.` });
//       }

//       // ── Activity fees validation ────────────────────────────────────────
//       let parsedActivityFees = [];
//       if (rawActivityFees) {
//         try {
//           parsedActivityFees = typeof rawActivityFees === 'string'
//             ? JSON.parse(rawActivityFees)
//             : rawActivityFees;
//         } catch {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Invalid activityFees format.' });
//         }
//       }

//       if (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'At least one activity with a start date and end date is required.' });
//       }

//       const validatedFees = [];
//       for (let i = 0; i < parsedActivityFees.length; i++) {
//         const result = validateActivityFee(parsedActivityFees[i], i);
//         if (result.error) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: result.error });
//         }
//         validatedFees.push(result.data);
//       }

//       // Duplicate activity check within the same submission
//       const activityIds = validatedFees.map((af) => af.activity.toString());
//       const uniqueActivityIds = new Set(activityIds);
//       if (uniqueActivityIds.size !== activityIds.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//       }

//       // ── Build member document ───────────────────────────────────────────
//       const memberData = {
//         name:           name.trim(),
//         mobile:         mobile.trim(),
//         email:          email?.trim()   || undefined,
//         age:            age             ? Number(age) : undefined,
//         gender:         gender          || 'Male',
//         address:        address?.trim() || undefined,
//         userId:         userId?.trim()  || mobile.trim(),
//         password:       password.trim(),
//         enquiryId:      enquiryId       || null,
//         activityFees:   validatedFees,
//         organizationId: req.organizationId,
//       };

//       if (req.file) memberData.photo = `/uploads/members/${req.file.filename}`;

//       const member = new FitnessMember(memberData);
//       await member.save();

//       // Mark enquiry as Admitted
//       if (enquiryId) {
//         await FitnessEnquiry.findByIdAndUpdate(enquiryId, { status: 'Admitted' });
//       }

//       // ── Sync fees to allotment / payment tables ─────────────────────────
//       try {
//         await syncFeesToTables(member, req.organizationId, []);
//       } catch (syncErr) {
//         console.error('Fee sync error (non-fatal):', syncErr.message);
//       }

//       const created = await FitnessMember.findById(member._id)
//         .populate('activityFees.activity', 'name activityName')
//         .populate('activityFees.feeType',  'description')
//         .populate('activityFees.staff',    'fullName name')
//         .select('-password');

//       res.status(201).json({ ...created.toObject(), message: 'Member added successfully.' });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('createMember error:', err);

//       if (err.code === 11000) {
//         return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//       }
//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map((e) => e.message).join(' '),
//         });
//       }
//       if (err.name === 'CastError') {
//         return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//       }
//       res.status(500).json({ message: 'Server error while creating member.' });
//     }
//   });
// };

// // ─── UPDATE ───────────────────────────────────────────────────────────────────
// exports.updateMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2 MB.' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed.' });
//     }

//     try {
//       if (!isValidObjectId(req.params.id)) {
//         return res.status(400).json({ message: 'Invalid member ID.' });
//       }

//       const member = await FitnessMember.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId,
//       });

//       if (!member) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(404).json({ message: 'Member not found.' });
//       }

//       const { name, mobile, email, age, gender, address, userId, password, activityFees: rawActivityFees } = req.body;

//       // ── Basic field validation ──────────────────────────────────────────
//       const fieldErrors = [];

//       if (name !== undefined && !name.trim()) fieldErrors.push('Full name cannot be empty.');
//       if (mobile !== undefined) {
//         if (!mobile.trim()) {
//           fieldErrors.push('Mobile number cannot be empty.');
//         } else if (!/^\d{10}$/.test(mobile.trim())) {
//           fieldErrors.push('Mobile must be a valid 10-digit number.');
//         }
//       }
//       if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//         fieldErrors.push('Please provide a valid email address.');
//       }
//       if (age !== undefined && age !== '') {
//         const ageNum = Number(age);
//         if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//           fieldErrors.push('Age must be between 1 and 120.');
//         }
//       }
//       if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//         fieldErrors.push('Invalid gender value.');
//       }

//       if (fieldErrors.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: fieldErrors.join(' ') });
//       }

//       // ── Duplicate mobile check (excluding self) ─────────────────────────
//       if (mobile && mobile.trim() !== member.mobile) {
//         const dup = await FitnessMember.findOne({
//           mobile:         mobile.trim(),
//           organizationId: req.organizationId,
//           _id:            { $ne: member._id },
//         });
//         if (dup) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(409).json({ message: `Another member with mobile ${mobile.trim()} already exists.` });
//         }
//       }

//       // ── Activity fees validation ────────────────────────────────────────
//       const previousAllotmentIds = member.activityFees
//         .map((af) => af.allotmentId?.toString())
//         .filter(Boolean);

//       if (rawActivityFees !== undefined) {
//         let parsedActivityFees = [];
//         try {
//           parsedActivityFees = typeof rawActivityFees === 'string'
//             ? JSON.parse(rawActivityFees)
//             : rawActivityFees;
//         } catch {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Invalid activityFees format.' });
//         }

//         if (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'At least one activity is required.' });
//         }

//         const validatedFees = [];
//         for (let i = 0; i < parsedActivityFees.length; i++) {
//           // For edit: skip start-date-in-past validation if date hasn't changed
//           const existing = member.activityFees.find(
//             (af) => af._id?.toString() === parsedActivityFees[i]._id?.toString()
//           );
//           const dateUnchanged =
//             existing &&
//             new Date(existing.startDate).toISOString().split('T')[0] ===
//               parsedActivityFees[i].startDate;

//           if (dateUnchanged) {
//             // Validate without the past-date restriction
//             const af = parsedActivityFees[i];
//             const start = new Date(af.startDate);
//             const end   = new Date(af.endDate);
//             if (!af.activity || !isValidObjectId(af.activity)) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: a valid activity ID is required.` });
//             }
//             if (isNaN(start.getTime())) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: start date is invalid.` });
//             }
//             if (isNaN(end.getTime()) || end < start) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: end date must be after start date.` });
//             }
//             const planFee  = Number(af.planFee)  || 0;
//             const discount = Number(af.discount) || 0;
//             if (discount > planFee && planFee > 0) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: discount cannot exceed plan fee.` });
//             }
//             validatedFees.push({
//               _id:             existing._id,
//               allotmentId:     existing.allotmentId || null,
//               activity:        af.activity,
//               feeType:         af.feeType   || null,
//               plan:            af.plan      || 'Monthly',
//               planFee,
//               discount,
//               finalAmount:     Math.max(0, planFee - discount),
//               paymentStatus:   af.paymentStatus  || 'Pending',
//               paymentMode:     af.paymentMode    || '',
//               paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//               planNotes:       af.planNotes      || '',
//               startDate:       start,
//               endDate:         end,
//               membershipStatus: af.membershipStatus || 'Inactive',
//               staff:           af.staff || null,
//             });
//           } else {
//             // New or changed date → full validation
//             const result = validateActivityFee(parsedActivityFees[i], i);
//             if (result.error) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: result.error });
//             }
//             const existingAllotmentId = existing?.allotmentId || null;
//             validatedFees.push({
//               ...result.data,
//               _id:         existing?._id || undefined,
//               allotmentId: existingAllotmentId,
//             });
//           }
//         }

//         // Duplicate activity check
//         const activityIds    = validatedFees.map((af) => af.activity.toString());
//         const uniqueActivityIds = new Set(activityIds);
//         if (uniqueActivityIds.size !== activityIds.length) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//         }

//         member.activityFees = validatedFees;
//       }

//       // ── Apply scalar field updates ──────────────────────────────────────
//       if (name     !== undefined) member.name     = name.trim();
//       if (mobile   !== undefined) member.mobile   = mobile.trim();
//       if (email    !== undefined) member.email    = email.trim() || undefined;
//       if (age      !== undefined && age !== '') member.age = Number(age);
//       if (gender   !== undefined) member.gender   = gender;
//       if (address  !== undefined) member.address  = address?.trim();
//       if (userId   !== undefined) member.userId   = userId?.trim();
//       if (password !== undefined && password.trim()) member.password = password.trim();

//       if (req.file) {
//         if (member.photo) deleteOldPhoto(member.photo);
//         member.photo = `/uploads/members/${req.file.filename}`;
//       }

//       await member.save();

//       // Sync fees
//       try {
//         await syncFeesToTables(member, req.organizationId, previousAllotmentIds);
//       } catch (syncErr) {
//         console.error('Fee sync error (non-fatal):', syncErr.message);
//       }

//       const updated = await FitnessMember.findById(member._id)
//         .populate('activityFees.activity', 'name activityName')
//         .populate('activityFees.feeType',  'description')
//         .populate('activityFees.staff',    'fullName name')
//         .select('-password');

//       res.json({ ...updated.toObject(), message: 'Member updated successfully.' });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('updateMember error:', err);

//       if (err.code === 11000) {
//         return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//       }
//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map((e) => e.message).join(' '),
//         });
//       }
//       if (err.name === 'CastError') {
//         return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//       }
//       res.status(500).json({ message: 'Server error while updating member.' });
//     }
//   });
// };

// // ─── DELETE ───────────────────────────────────────────────────────────────────
// exports.deleteMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     // Cleanup photo
//     if (member.photo) deleteOldPhoto(member.photo);

//     // Cleanup linked allotments + payments
//     const allotmentIds = member.activityFees
//       .map((af) => af.allotmentId)
//       .filter(Boolean);

//     if (allotmentIds.length) {
//       await FeeAllotment.deleteMany({ _id: { $in: allotmentIds }, organizationId: req.organizationId });
//       await FeePayment.deleteMany({ allotmentId: { $in: allotmentIds }, organizationId: req.organizationId });
//     }

//     res.json({ message: 'Member deleted successfully.' });
//   } catch (err) {
//     console.error('deleteMember error:', err);
//     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
//     res.status(500).json({ message: 'Server error while deleting member.' });
//   }
// };








// // controllers/fitnessMemberController.js
// const fs   = require('fs');
// const path = require('path');
// const multer = require('multer');
// const mongoose = require('mongoose');

// const FitnessMember    = require('../models/FitnessMember');
// const FitnessEnquiry   = require('../models/FitnessEnquiry');
// const FeeAllotment     = require('../models/FitnessFeeAllotment');
// const FeePayment       = require('../models/FitnessFeePayment');
// const FitnessBooking = require('../models/FitnessBooking');

// // Import the booking generator from activity controller
// const { generateRecurringBookings } = require('./fitnessActivityController');

// // ─── Multer ───────────────────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'members');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
//   fileFilter: (req, file, cb) => {
//     const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase()) &&
//                /jpeg|jpg|png|webp/.test(file.mimetype);
//     ok ? cb(null, true) : cb(new Error('Only JPG, PNG and WebP images are allowed.'));
//   },
// }).single('photo');

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const deleteOldPhoto = (photoPath) => {
//   if (photoPath && photoPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', photoPath);
//     try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
//   }
// };

// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// /**
//  * Validate and normalise a single activityFee entry coming from the request.
//  * Returns { error: string } on failure, or { data: object } on success.
//  */
// const validateActivityFee = (af, index) => {
//   const prefix = `Activity ${index + 1}`;

//   if (!af.activity || !isValidObjectId(af.activity)) {
//     return { error: `${prefix}: a valid activity ID is required.` };
//   }

//   if (!af.startDate) return { error: `${prefix}: start date is required.` };
//   if (!af.endDate)   return { error: `${prefix}: end date is required.` };

//   const start = new Date(af.startDate);
//   const end   = new Date(af.endDate);

//   if (isNaN(start.getTime())) return { error: `${prefix}: start date is invalid.` };
//   if (isNaN(end.getTime()))   return { error: `${prefix}: end date is invalid.` };

//   // Start date must not be in the past (allow today)
//   const todayMidnight = new Date();
//   todayMidnight.setHours(0, 0, 0, 0);
//   if (start < todayMidnight) {
//     return { error: `${prefix}: start date cannot be in the past.` };
//   }

//   if (end < start) {
//     return { error: `${prefix}: end date cannot be before start date.` };
//   }

//   const planFee    = Number(af.planFee)    || 0;
//   const discount   = Number(af.discount)   || 0;
//   const finalAmount = Number(af.finalAmount) || 0;

//   if (planFee < 0)    return { error: `${prefix}: plan fee cannot be negative.` };
//   if (discount < 0)   return { error: `${prefix}: discount cannot be negative.` };
//   if (discount > planFee && planFee > 0) {
//     return { error: `${prefix}: discount (₹${discount}) cannot exceed plan fee (₹${planFee}).` };
//   }

//   const validPlans   = ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
//   const validModes   = ['Cash', 'Cheque', 'Online', 'UPI', ''];
//   const validStatuses = ['Paid', 'Pending'];
//   const validMembershipStatuses = ['Active', 'Inactive'];

//   if (af.plan && !validPlans.includes(af.plan)) {
//     return { error: `${prefix}: invalid plan "${af.plan}". Must be one of: ${validPlans.join(', ')}.` };
//   }

//   if (af.paymentMode && !validModes.includes(af.paymentMode)) {
//     return { error: `${prefix}: invalid payment mode "${af.paymentMode}".` };
//   }
//   if (af.paymentStatus && !validStatuses.includes(af.paymentStatus)) {
//     return { error: `${prefix}: invalid payment status "${af.paymentStatus}".` };
//   }
//   if (af.membershipStatus && !validMembershipStatuses.includes(af.membershipStatus)) {
//     return { error: `${prefix}: invalid membership status.` };
//   }
//   if (af.staff && !isValidObjectId(af.staff)) {
//     return { error: `${prefix}: invalid staff ID.` };
//   }
//   if (af.feeType && !isValidObjectId(af.feeType)) {
//     return { error: `${prefix}: invalid fee type ID.` };
//   }
//   if (af.paymentDate) {
//     const pd = new Date(af.paymentDate);
//     if (isNaN(pd.getTime())) return { error: `${prefix}: payment date is invalid.` };
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//     if (pd >= tomorrow) {
//       return { error: `${prefix}: payment date cannot be in the future.` };
//     }
//   }

//   return {
//     data: {
//       activity:        af.activity,
//       feeType:         af.feeType  || null,
//       plan:            af.plan     || 'Monthly',
//       planFee,
//       discount,
//       finalAmount:     Math.max(0, planFee - discount),
//       paymentStatus:   af.paymentStatus  || 'Pending',
//       paymentMode:     af.paymentMode    || '',
//       paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//       planNotes:       af.planNotes      || '',
//       startDate:       start,
//       endDate:         end,
//       membershipStatus: af.membershipStatus || 'Inactive',
//       staff:           af.staff || null,
//       slot:            af.slot || null,           // ← Added slot support
//     },
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // After saving a member, sync each activityFee entry to FeeAllotment +
// // FeePayment tables so they appear in the Allot Fees / Add Payments views.
// // ─────────────────────────────────────────────────────────────────────────────
// const syncFeesToTables = async (member, orgId, previousAllotmentIds = []) => {
//   // Delete old allotments that no longer have a corresponding activityFee
//   const currentAllotmentIds = member.activityFees
//     .map((af) => af.allotmentId?.toString())
//     .filter(Boolean);

//   const orphaned = previousAllotmentIds.filter(
//     (id) => id && !currentAllotmentIds.includes(id.toString())
//   );
//   if (orphaned.length) {
//     await FeeAllotment.deleteMany({ _id: { $in: orphaned }, organizationId: orgId });
//     await FeePayment.deleteMany({ allotmentId: { $in: orphaned }, organizationId: orgId });
//   }

//   // Upsert allotment + payment for each activityFee
//   // for (let i = 0; i < member.activityFees.length; i++) {
//   //   const af = member.activityFees[i];

//   //   // Only sync if there is a fee type selected (otherwise nothing to allot)
//   //   if (!af.feeType) continue;

//   //   // Determine feePlan mapping: convert member plan to allotment plan
//   //   const planMap = {
//   //     Monthly:      'Monthly',
//   //     Quarterly:    'Monthly',
//   //     'Half Yearly':'Monthly',
//   //     Yearly:       'Annual',
//   //   };
//   //   const feePlan = planMap[af.plan] || 'Monthly';

//   //   let allotment;
//   //   if (af.allotmentId) {
//   //     // Update existing allotment
//   //     allotment = await FeeAllotment.findByIdAndUpdate(
//   //       af.allotmentId,
//   //       {
//   //         memberId:         member._id,
//   //         feeTypeId:        af.feeType,
//   //         amount:           af.finalAmount || af.planFee || 0,
//   //         feePlan,
//   //         dueDate:          af.endDate,
//   //         responsibleStaff: af.staff || null,
//   //         organizationId:   orgId,
//   //         status:           af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//   //       },
//   //       { new: true, upsert: false }
//   //     );
//   //   } else {
//   //     // Create new allotment
//   //     allotment = await FeeAllotment.create({
//   //       memberId:         member._id,
//   //       feeTypeId:        af.feeType,
//   //       amount:           af.finalAmount || af.planFee || 0,
//   //       feePlan,
//   //       dueDate:          af.endDate,
//   //       responsibleStaff: af.staff || null,
//   //       organizationId:   orgId,
//   //       status:           af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//   //     });

//   //     // Save allotmentId back to the activityFee subdoc
//   //     member.activityFees[i].allotmentId = allotment._id;
//   //   }

//   //   // If payment status is Paid and finalAmount > 0, upsert a payment record
//   //   if (af.paymentStatus === 'Paid' && (af.finalAmount || af.planFee) > 0 && allotment) {
//   //     const existingPayment = await FeePayment.findOne({
//   //       allotmentId:    allotment._id,
//   //       organizationId: orgId,
//   //     });

//   //     const paymentData = {
//   //       memberId:       member._id,
//   //       allotmentId:    allotment._id,
//   //       amount:         af.finalAmount || af.planFee,
//   //       paymentMode:    af.paymentMode || 'Cash',
//   //       paymentDate:    af.paymentDate || new Date(),
//   //       organizationId: orgId,
//   //       description:    `Activity fee - ${af.plan} plan`,
//   //       feePlan,
//   //     };

//   //     if (existingPayment) {
//   //       await FeePayment.findByIdAndUpdate(existingPayment._id, paymentData);
//   //     } else {
//   //       await FeePayment.create(paymentData);
//   //     }

//   //     // Mark allotment as Paid
//   //     await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//   //   }
//   // }

//   for (let i = 0; i < member.activityFees.length; i++) {
//   const af = member.activityFees[i];

//   if (!af.feeType) continue;

//   const planMap = {
//   Annual:   'Annual',
//   Monthly:  'Monthly',
//   Weekly:   'Weekly',
//   Daily:    'Daily',
//   Hourly:   'Hourly',
//   };
//   const feePlan = planMap[af.plan] || 'Monthly';

//   let allotment;

//   if (af.allotmentId) {
//     allotment = await FeeAllotment.findByIdAndUpdate(
//       af.allotmentId,
//       {
//         memberId: member._id,
//         feeTypeId: af.feeType,
//         amount: af.finalAmount || af.planFee || 0,
//         feePlan,
//         dueDate: af.endDate,
//         responsibleStaff: af.staff || null,
//         organizationId: orgId,
//         status: af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//       },
//       { new: true }
//     );
//   } else {
//     allotment = await FeeAllotment.create({
//       memberId: member._id,
//       feeTypeId: af.feeType,
//       amount: af.finalAmount || af.planFee || 0,
//       feePlan,
//       dueDate: af.endDate,
//       responsibleStaff: af.staff || null,
//       organizationId: orgId,
//       status: af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//     });

//     // Save back allotmentId
//     member.activityFees[i].allotmentId = allotment._id;
//   }

//   // Handle Payment
//   if (af.paymentStatus === 'Paid' && (af.finalAmount || af.planFee) > 0 && allotment) {
//     await FeePayment.findOneAndUpdate(
//       { allotmentId: allotment._id, organizationId: orgId },
//       {
//         memberId: member._id,
//         allotmentId: allotment._id,
//         amount: af.finalAmount || af.planFee,
//         paymentMode: af.paymentMode || 'Cash',
//         paymentDate: af.paymentDate || new Date(),
//         organizationId: orgId,
//         description: `Activity fee - ${af.plan} plan`,
//         feePlan,
//       },
//       { upsert: true, new: true }
//     );

//     await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//   }
// }

// // Save updated allotmentIds back to member
// await member.save();

//   // Persist the allotmentId updates back to DB
//   await FitnessMember.findByIdAndUpdate(
//     member._id,
//     {
//       $set: {
//         activityFees: member.activityFees.map((af) => af.toObject ? af.toObject() : af),
//       },
//     },
//     { new: false }
//   );
// };

// // ─── Helper: Create recurring slot bookings for all activityFees ─────────────
// const createRecurringSlotBookings = async (member, activityFeesSerialized) => {
//   try {
//     for (let i = 0; i < activityFeesSerialized.length; i++) {
//       const af = activityFeesSerialized[i];

//       // Only create bookings if slot is provided
//       if (!af.slot || !af.activity) continue;

//       // Clean up any existing bookings for this member + activityFee (important for updates)
//       await FitnessBooking.deleteMany({
//         memberId: member._id,
//         activityFeeIndex: i,
//       });

//       // Generate new recurring bookings
//       await generateRecurringBookings(
//         member._id,
//         i,                    // activityFeeIndex
//         af.activity,
//         af.slot,              // slotId (ObjectId)
//         af.startDate,
//         af.endDate,
//         member.name,
//         member.mobile
//       );
//     }
//   } catch (bookingErr) {
//     console.error('Recurring booking creation error (non-fatal):', bookingErr.message);
//     // We don't fail the member creation/update if booking fails
//   }
// };

// // ─── GET ALL ──────────────────────────────────────────────────────────────────
// exports.getAllMembers = async (req, res) => {
//   try {
//     const { search, status, activity, plan } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status)   query.membershipStatus = status;
//     if (plan)     query['activityFees.plan'] = plan;
//     if (activity) query['activityFees.activity'] = activity;

//     if (search) {
//       query.$or = [
//         { name:     { $regex: search, $options: 'i' } },
//         { mobile:   { $regex: search, $options: 'i' } },
//         { memberId: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const members = await FitnessMember.find(query)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description')
//       .populate('activityFees.staff',    'fullName name')
//       .sort({ createdAt: -1 })
//       .select('-password');

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const result = members.map((m) => {
//       const obj = m.toObject();
//       let anyActive = false;

//       obj.activityFees = (obj.activityFees || []).map((af) => {
//         if (af.startDate && af.endDate) {
//           const s = new Date(af.startDate); s.setHours(0, 0, 0, 0);
//           const e = new Date(af.endDate);   e.setHours(23, 59, 59, 999);
//           const active = today >= s && today <= e && af.paymentStatus === 'Paid';
//           af.membershipStatus = active ? 'Active' : 'Inactive';
//           if (active) anyActive = true;
//         }
//         return af;
//       });

//       obj.membershipStatus = anyActive ? 'Active' : 'Inactive';
//       return obj;
//     });

//     res.json(result);
//   } catch (err) {
//     console.error('getAllMembers error:', err);
//     res.status(500).json({ message: 'Server error while fetching members.' });
//   }
// };

// // ─── GET ONE ──────────────────────────────────────────────────────────────────
// exports.getMemberById = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     })
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description monthly quarterly halfYearly annual')
//       .populate('activityFees.staff',    'fullName name')
//       .select('-password');

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     const today = new Date(); today.setHours(0, 0, 0, 0);
//     const obj   = member.toObject();
//     let anyActive = false;

//     obj.activityFees = (obj.activityFees || []).map((af) => {
//       if (af.startDate && af.endDate) {
//         const s = new Date(af.startDate); s.setHours(0, 0, 0, 0);
//         const e = new Date(af.endDate);   e.setHours(23, 59, 59, 999);
//         const active = today >= s && today <= e && af.paymentStatus === 'Paid';
//         af.membershipStatus = active ? 'Active' : 'Inactive';
//         if (active) anyActive = true;
//       }
//       return af;
//     });
//     obj.membershipStatus = anyActive ? 'Active' : 'Inactive';

//     res.json(obj);
//   } catch (err) {
//     console.error('getMemberById error:', err);
//     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
//     res.status(500).json({ message: 'Server error while fetching member.' });
//   }
// };

// // ─── CREATE ───────────────────────────────────────────────────────────────────
// exports.createMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2 MB.' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed.' });
//     }

//     try {
//       const {
//         name, mobile, email, age, gender, address,
//         userId, password, enquiryId,
//         activityFees: rawActivityFees,
//       } = req.body;

//       // ── Basic field validation ──────────────────────────────────────────
//       const fieldErrors = [];

//       if (!name || !name.trim()) fieldErrors.push('Full name is required.');
//       if (!mobile || !mobile.trim()) {
//         fieldErrors.push('Mobile number is required.');
//       } else if (!/^\d{10}$/.test(mobile.trim())) {
//         fieldErrors.push('Mobile must be a valid 10-digit number.');
//       }
//       if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//         fieldErrors.push('Please provide a valid email address.');
//       }
//       if (age !== undefined && age !== '') {
//         const ageNum = Number(age);
//         if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//           fieldErrors.push('Age must be between 1 and 120.');
//         }
//       }
//       if (!password || !password.trim()) fieldErrors.push('Password is required.');
//       if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//         fieldErrors.push('Invalid gender value.');
//       }
//       if (enquiryId && !isValidObjectId(enquiryId)) {
//         fieldErrors.push('Invalid enquiry ID.');
//       }

//       if (fieldErrors.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: fieldErrors.join(' ') });
//       }

//       // ── Duplicate mobile check ──────────────────────────────────────────
//       const existingMobile = await FitnessMember.findOne({
//         mobile: mobile.trim(),
//         organizationId: req.organizationId,
//       });
//       if (existingMobile) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(409).json({ message: `A member with mobile ${mobile.trim()} already exists.` });
//       }

//       // ── Activity fees validation ────────────────────────────────────────
//       let parsedActivityFees = [];
//       if (rawActivityFees) {
//         try {
//           parsedActivityFees = typeof rawActivityFees === 'string'
//             ? JSON.parse(rawActivityFees)
//             : rawActivityFees;
//         } catch {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Invalid activityFees format.' });
//         }
//       }

//       if (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'At least one activity with a start date and end date is required.' });
//       }

//       const validatedFees = [];
//       for (let i = 0; i < parsedActivityFees.length; i++) {
//         const result = validateActivityFee(parsedActivityFees[i], i);
//         if (result.error) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: result.error });
//         }
//         validatedFees.push(result.data);
//       }

//       // Duplicate activity check within the same submission
//       const activityIds = validatedFees.map((af) => af.activity.toString());
//       const uniqueActivityIds = new Set(activityIds);
//       if (uniqueActivityIds.size !== activityIds.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//       }

//       // ── Build member document ───────────────────────────────────────────
//       const memberData = {
//         name:           name.trim(),
//         mobile:         mobile.trim(),
//         email:          email?.trim()   || undefined,
//         age:            age             ? Number(age) : undefined,
//         gender:         gender          || 'Male',
//         address:        address?.trim() || undefined,
//         userId:         userId?.trim()  || mobile.trim(),
//         password:       password.trim(),
//         enquiryId:      enquiryId       || null,
//         activityFees:   validatedFees,
//         organizationId: req.organizationId,
//       };

//       if (req.file) memberData.photo = `/uploads/members/${req.file.filename}`;

//       const member = new FitnessMember(memberData);
//       await member.save();

//       // Mark enquiry as Admitted
//       if (enquiryId) {
//         await FitnessEnquiry.findByIdAndUpdate(enquiryId, { status: 'Admitted' });
//       }

//       // ── Sync fees to allotment / payment tables ─────────────────────────
//       try {
//         await syncFeesToTables(member, req.organizationId, []);
//       } catch (syncErr) {
//         console.error('Fee sync error (non-fatal):', syncErr.message);
//       }

//       // ── Create recurring slot bookings for each activityFee ─────────────
//       try {
//         await createRecurringSlotBookings(member, validatedFees);
//       } catch (bookingErr) {
//         console.error('Slot booking error (non-fatal):', bookingErr.message);
//       }

//       const created = await FitnessMember.findById(member._id)
//         .populate('activityFees.activity', 'name activityName')
//         .populate('activityFees.feeType',  'description')
//         .populate('activityFees.staff',    'fullName name')
//         .select('-password');

//       res.status(201).json({ ...created.toObject(), message: 'Member added successfully.' });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('createMember error:', err);

//       if (err.code === 11000) {
//         return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//       }
//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map((e) => e.message).join(' '),
//         });
//       }
//       if (err.name === 'CastError') {
//         return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//       }
//       res.status(500).json({ message: 'Server error while creating member.' });
//     }
//   });
// };

// // ─── UPDATE ───────────────────────────────────────────────────────────────────
// exports.updateMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2 MB.' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed.' });
//     }

//     try {
//       if (!isValidObjectId(req.params.id)) {
//         return res.status(400).json({ message: 'Invalid member ID.' });
//       }

//       const member = await FitnessMember.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId,
//       });

//       if (!member) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(404).json({ message: 'Member not found.' });
//       }

//       const { name, mobile, email, age, gender, address, userId, password, activityFees: rawActivityFees } = req.body;

//       // ── Basic field validation ──────────────────────────────────────────
//       const fieldErrors = [];

//       if (name !== undefined && !name.trim()) fieldErrors.push('Full name cannot be empty.');
//       if (mobile !== undefined) {
//         if (!mobile.trim()) {
//           fieldErrors.push('Mobile number cannot be empty.');
//         } else if (!/^\d{10}$/.test(mobile.trim())) {
//           fieldErrors.push('Mobile must be a valid 10-digit number.');
//         }
//       }
//       if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//         fieldErrors.push('Please provide a valid email address.');
//       }
//       if (age !== undefined && age !== '') {
//         const ageNum = Number(age);
//         if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//           fieldErrors.push('Age must be between 1 and 120.');
//         }
//       }
//       if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//         fieldErrors.push('Invalid gender value.');
//       }

//       if (fieldErrors.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: fieldErrors.join(' ') });
//       }

//       // ── Duplicate mobile check (excluding self) ─────────────────────────
//       if (mobile && mobile.trim() !== member.mobile) {
//         const dup = await FitnessMember.findOne({
//           mobile:         mobile.trim(),
//           organizationId: req.organizationId,
//           _id:            { $ne: member._id },
//         });
//         if (dup) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(409).json({ message: `Another member with mobile ${mobile.trim()} already exists.` });
//         }
//       }

//       // ── Activity fees validation ────────────────────────────────────────
//       const previousAllotmentIds = member.activityFees
//         .map((af) => af.allotmentId?.toString())
//         .filter(Boolean);

//       let validatedFees = member.activityFees; // default to existing

//       if (rawActivityFees !== undefined) {
//         let parsedActivityFees = [];
//         try {
//           parsedActivityFees = typeof rawActivityFees === 'string'
//             ? JSON.parse(rawActivityFees)
//             : rawActivityFees;
//         } catch {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Invalid activityFees format.' });
//         }

//         if (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'At least one activity is required.' });
//         }

//         const tempValidated = [];
//         for (let i = 0; i < parsedActivityFees.length; i++) {
//           const existing = member.activityFees.find(
//             (af) => af._id?.toString() === parsedActivityFees[i]._id?.toString()
//           );
//           const dateUnchanged = existing &&
//             new Date(existing.startDate).toISOString().split('T')[0] === parsedActivityFees[i].startDate;

//           if (dateUnchanged) {
//             const af = parsedActivityFees[i];
//             const start = new Date(af.startDate);
//             const end   = new Date(af.endDate);

//             if (!af.activity || !isValidObjectId(af.activity)) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: a valid activity ID is required.` });
//             }
//             if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: invalid date range.` });
//             }

//             tempValidated.push({
//               _id:             existing._id,
//               allotmentId:     existing.allotmentId || null,
//               activity:        af.activity,
//               feeType:         af.feeType   || null,
//               plan:            af.plan      || 'Monthly',
//               planFee:         Number(af.planFee) || 0,
//               discount:        Number(af.discount) || 0,
//               finalAmount:     Math.max(0, Number(af.planFee) - Number(af.discount)),
//               paymentStatus:   af.paymentStatus  || 'Pending',
//               paymentMode:     af.paymentMode    || '',
//               paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//               planNotes:       af.planNotes      || '',
//               startDate:       start,
//               endDate:         end,
//               membershipStatus: af.membershipStatus || 'Inactive',
//               staff:           af.staff || null,
//               slot:            af.slot || existing.slot || null,
//             });
//           } else {
//             const result = validateActivityFee(parsedActivityFees[i], i);
//             if (result.error) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: result.error });
//             }
//             tempValidated.push({
//               ...result.data,
//               _id:         existing?._id || undefined,
//               allotmentId: existing?.allotmentId || null,
//               slot:        parsedActivityFees[i].slot || null,
//             });
//           }
//         }

//         // Duplicate activity check
//         const activityIds = tempValidated.map((af) => af.activity.toString());
//         const uniqueActivityIds = new Set(activityIds);
//         if (uniqueActivityIds.size !== activityIds.length) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//         }

//         validatedFees = tempValidated;
//         member.activityFees = validatedFees;
//       }

//       // ── Apply scalar field updates ──────────────────────────────────────
//       if (name     !== undefined) member.name     = name.trim();
//       if (mobile   !== undefined) member.mobile   = mobile.trim();
//       if (email    !== undefined) member.email    = email.trim() || undefined;
//       if (age      !== undefined && age !== '') member.age = Number(age);
//       if (gender   !== undefined) member.gender   = gender;
//       if (address  !== undefined) member.address  = address?.trim();
//       if (userId   !== undefined) member.userId   = userId?.trim();
//       if (password !== undefined && password.trim()) member.password = password.trim();

//       if (req.file) {
//         if (member.photo) deleteOldPhoto(member.photo);
//         member.photo = `/uploads/members/${req.file.filename}`;
//       }

//       await member.save();

//       // Sync fees
//       try {
//         await syncFeesToTables(member, req.organizationId, previousAllotmentIds);
//       } catch (syncErr) {
//         console.error('Fee sync error (non-fatal):', syncErr.message);
//       }

//       // ── Create / Update recurring slot bookings ─────────────────────────
//       try {
//         await createRecurringSlotBookings(member, validatedFees);
//       } catch (bookingErr) {
//         console.error('Slot booking error during update (non-fatal):', bookingErr.message);
//       }

//       const updated = await FitnessMember.findById(member._id)
//         .populate('activityFees.activity', 'name activityName')
//         .populate('activityFees.feeType',  'description')
//         .populate('activityFees.staff',    'fullName name')
//         .select('-password');

//       res.json({ ...updated.toObject(), message: 'Member updated successfully.' });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('updateMember error:', err);

//       if (err.code === 11000) {
//         return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//       }
//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map((e) => e.message).join(' '),
//         });
//       }
//       if (err.name === 'CastError') {
//         return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//       }
//       res.status(500).json({ message: 'Server error while updating member.' });
//     }
//   });
// };

// // ─── DELETE ───────────────────────────────────────────────────────────────────
// exports.deleteMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     // Cleanup photo
//     if (member.photo) deleteOldPhoto(member.photo);

//     // Cleanup linked allotments + payments
//     const allotmentIds = member.activityFees
//       .map((af) => af.allotmentId)
//       .filter(Boolean);

//     if (allotmentIds.length) {
//       await FeeAllotment.deleteMany({ _id: { $in: allotmentIds }, organizationId: req.organizationId });
//       await FeePayment.deleteMany({ allotmentId: { $in: allotmentIds }, organizationId: req.organizationId });
//     }

//     // Cleanup all slot bookings for this member
//     await FitnessBooking.deleteMany({ memberId: req.params.id });

//     res.json({ message: 'Member deleted successfully.' });
//   } catch (err) {
//     console.error('deleteMember error:', err);
//     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
//     res.status(500).json({ message: 'Server error while deleting member.' });
//   }
// };















// // controllers/fitnessMemberController.js
// const fs   = require('fs');
// const path = require('path');
// const multer = require('multer');
// const mongoose = require('mongoose');

// const FitnessMember    = require('../models/FitnessMember');
// const FitnessEnquiry   = require('../models/FitnessEnquiry');
// const FeeAllotment     = require('../models/FitnessFeeAllotment');
// const FeePayment       = require('../models/FitnessFeePayment');
// const FitnessBooking = require('../models/FitnessBooking');

// // Import the booking generator from activity controller
// const { generateRecurringBookings } = require('./fitnessActivityController');

// // ─── Multer ───────────────────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '..', 'uploads', 'members');
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
//   fileFilter: (req, file, cb) => {
//     const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase()) &&
//                /jpeg|jpg|png|webp/.test(file.mimetype);
//     ok ? cb(null, true) : cb(new Error('Only JPG, PNG and WebP images are allowed.'));
//   },
// }).single('photo');

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const deleteOldPhoto = (photoPath) => {
//   if (photoPath && photoPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', photoPath);
//     try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
//   }
// };

// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// /**
//  * Compute the membership status for a single activityFee entry.
//  * Active only when:
//  *   1. paymentStatus === 'Paid'
//  *   2. today falls within [startDate, endDate] (inclusive)
//  */
// const computeActivityMembershipStatus = (af) => {
//   if (af.paymentStatus !== 'Paid') return 'Inactive';
//   if (!af.startDate || !af.endDate) return 'Inactive';

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
//   const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

//   return (today >= start && today <= end) ? 'Active' : 'Inactive';
// };

// /**
//  * Compute overall membership status from an array of activityFee objects.
//  * Active if at least one activity is Active; Inactive if all are Inactive.
//  */
// const computeOverallMembershipStatus = (activityFees) => {
//   if (!Array.isArray(activityFees) || activityFees.length === 0) return 'Inactive';
//   const anyActive = activityFees.some(
//     (af) => computeActivityMembershipStatus(af) === 'Active'
//   );
//   return anyActive ? 'Active' : 'Inactive';
// };

// /**
//  * Validate and normalise a single activityFee entry coming from the request.
//  * Returns { error: string } on failure, or { data: object } on success.
//  */
// const validateActivityFee = (af, index) => {
//   const prefix = `Activity ${index + 1}`;

//   // Allow either activity OR membership pass (feeType)
// if (!af.activity && !af.feeType) {
//   return { error: `${prefix}: activity or membership pass is required.` };
// }

// if (af.activity && !isValidObjectId(af.activity)) {
//   return { error: `${prefix}: invalid activity ID.` };
// }

//   if (!af.startDate) return { error: `${prefix}: start date is required.` };
//   if (!af.endDate)   return { error: `${prefix}: end date is required.` };

//   const start = new Date(af.startDate);
//   const end   = new Date(af.endDate);

//   if (isNaN(start.getTime())) return { error: `${prefix}: start date is invalid.` };
//   if (isNaN(end.getTime()))   return { error: `${prefix}: end date is invalid.` };

//   // Start date must not be in the past (allow today)
//   // const todayMidnight = new Date();
//   // todayMidnight.setHours(0, 0, 0, 0);
//   // if (start < todayMidnight) {
//   //   return { error: `${prefix}: start date cannot be in the past.` };
//   // }

//   if (end < start) {
//     return { error: `${prefix}: end date cannot be before start date.` };
//   }

//   const planFee    = Number(af.planFee)    || 0;
//   const discount   = Number(af.discount)   || 0;
//   const finalAmount = Number(af.finalAmount) || 0;

//   if (planFee < 0)    return { error: `${prefix}: plan fee cannot be negative.` };
//   if (discount < 0)   return { error: `${prefix}: discount cannot be negative.` };
//   if (discount > planFee && planFee > 0) {
//     return { error: `${prefix}: discount (₹${discount}) cannot exceed plan fee (₹${planFee}).` };
//   }

//   const validPlans   = ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
//   const validModes   = ['Cash', 'Bank Transfer', ''];
//   const validStatuses = ['Paid', 'Pending'];

//   if (af.plan && !validPlans.includes(af.plan)) {
//     return { error: `${prefix}: invalid plan "${af.plan}". Must be one of: ${validPlans.join(', ')}.` };
//   }

//   if (af.paymentMode && !validModes.includes(af.paymentMode)) {
//     return { error: `${prefix}: invalid payment mode "${af.paymentMode}".` };
//   }
//   if (af.paymentStatus && !validStatuses.includes(af.paymentStatus)) {
//     return { error: `${prefix}: invalid payment status "${af.paymentStatus}".` };
//   }
//   if (af.staff && !isValidObjectId(af.staff)) {
//     return { error: `${prefix}: invalid staff ID.` };
//   }
//   if (af.feeType && !isValidObjectId(af.feeType)) {
//     return { error: `${prefix}: invalid fee type ID.` };
//   }
//   if (af.paymentDate) {
//     const pd = new Date(af.paymentDate);
//     if (isNaN(pd.getTime())) return { error: `${prefix}: payment date is invalid.` };
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//     if (pd >= tomorrow) {
//       return { error: `${prefix}: payment date cannot be in the future.` };
//     }
//   }

//   // Compute membershipStatus server-side — do NOT trust client value
//   const membershipStatus = computeActivityMembershipStatus({
//     paymentStatus: af.paymentStatus || 'Pending',
//     startDate:     start,
//     endDate:       end,
//   });

//   return {
//     data: {
//       activity:        af.activity,
//       feeType:         af.feeType  || null,
//       plan:            af.plan     || 'Monthly',
//       planFee,
//       discount,
//       finalAmount:     Math.max(0, planFee - discount),
//       paymentStatus:   af.paymentStatus  || 'Pending',
//       paymentMode:     af.paymentMode    || '',
//       paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//       planNotes:       af.planNotes      || '',
//       startDate:       start,
//       endDate:         end,
//       membershipStatus,                         // ← always computed
//       staff:           af.staff || null,
//       slot:            af.slot || null,
//     },
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // After saving a member, sync each activityFee entry to FeeAllotment +
// // FeePayment tables so they appear in the Allot Fees / Add Payments views.
// // ─────────────────────────────────────────────────────────────────────────────
// const syncFeesToTables = async (member, orgId, previousAllotmentIds = []) => {
//   // Delete old allotments that no longer have a corresponding activityFee
//   const currentAllotmentIds = member.activityFees
//     .map((af) => af.allotmentId?.toString())
//     .filter(Boolean);

//   const orphaned = previousAllotmentIds.filter(
//     (id) => id && !currentAllotmentIds.includes(id.toString())
//   );
//   if (orphaned.length) {
//     await FeeAllotment.deleteMany({ _id: { $in: orphaned }, organizationId: orgId });
//     await FeePayment.deleteMany({ allotmentId: { $in: orphaned }, organizationId: orgId });
//   }

//   for (let i = 0; i < member.activityFees.length; i++) {
//   const af = member.activityFees[i];

//   if (!af.feeType) continue;

//   const planMap = {
//   Annual:   'Annual',
//   Monthly:  'Monthly',
//   Weekly:   'Weekly',
//   Daily:    'Daily',
//   Hourly:   'Hourly',
//   };
//   const feePlan = planMap[af.plan] || 'Monthly';

//   let allotment;

//   if (af.allotmentId) {
//     allotment = await FeeAllotment.findByIdAndUpdate(
//       af.allotmentId,
//       {
//         memberId: member._id,
//         feeTypeId: af.feeType,
//         amount: af.finalAmount || af.planFee || 0,
//         feePlan,
//         dueDate: af.endDate,
//         responsibleStaff: af.staff || null,
//         organizationId: orgId,
//         status: af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//       },
//       { new: true }
//     );
//   } else {
//     allotment = await FeeAllotment.create({
//       memberId: member._id,
//       feeTypeId: af.feeType,
//       amount: af.finalAmount || af.planFee || 0,
//       feePlan,
//       dueDate: af.endDate,
//       responsibleStaff: af.staff || null,
//       organizationId: orgId,
//       status: af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
//     });

//     // Save back allotmentId
//     member.activityFees[i].allotmentId = allotment._id;
//   }

//   // Handle Payment
//   if (af.paymentStatus === 'Paid' && (af.finalAmount || af.planFee) > 0 && allotment) {
//     await FeePayment.findOneAndUpdate(
//       { allotmentId: allotment._id, organizationId: orgId },
//       {
//         memberId: member._id,
//         allotmentId: allotment._id,
//         amount: af.finalAmount || af.planFee,
//         paymentMode: af.paymentMode || 'Cash',
//         paymentDate: af.paymentDate || new Date(),
//         organizationId: orgId,
//         description: af.activity 
//   ? `Activity fee - ${af.plan} plan`
//   : `Membership pass - ${af.plan} plan`,
//         feePlan,
//       },
//       { upsert: true, new: true }
//     );

//     await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//   }
// }

// // Save updated allotmentIds back to member
// // await member.save();

//   // Persist the allotmentId updates back to DB
// await FitnessMember.findByIdAndUpdate(
//   member._id,
//   {
//     $set: {
//       activityFees: member.activityFees.map((af) =>
//         af.toObject ? af.toObject() : af
//       ),
//     },
//   }
// );
// };

// // ─── Helper: Create recurring slot bookings for all activityFees ─────────────
// const createRecurringSlotBookings = async (member, activityFeesSerialized) => {
//   try {
//     for (let i = 0; i < activityFeesSerialized.length; i++) {
//       const af = activityFeesSerialized[i];

//       // Only create bookings if slot is provided
//       if (!af.slot || !af.activity) continue;

//       // Clean up any existing bookings for this member + activityFee (important for updates)
//       await FitnessBooking.deleteMany({
//         memberId: member._id,
//         activityFeeIndex: i,
//       });

//       // Generate new recurring bookings
//       await generateRecurringBookings(
//         member._id,
//         i,                    // activityFeeIndex
//         af.activity,
//         af.slot,              // slotId (ObjectId)
//         af.startDate,
//         af.endDate,
//         member.name,
//         member.mobile
//       );
//     }
//   } catch (bookingErr) {
//     console.error('Recurring booking creation error (non-fatal):', bookingErr.message);
//     // We don't fail the member creation/update if booking fails
//   }
// };

// // ─── Helper: apply computed statuses to a member object for API responses ────
// const applyComputedStatuses = (obj) => {
//   let anyActive = false;

//   obj.activityFees = (obj.activityFees || []).map((af) => {
//     // Always recompute fresh status (safety net even if cron is delayed)
//     const status = computeActivityMembershipStatus(af);
//     af.membershipStatus = status;
//     if (status === 'Active') anyActive = true;
//     return af;
//   });

//   obj.membershipStatus = anyActive ? 'Active' : 'Inactive';
//   return obj;
// };

// // ─── GET ALL ──────────────────────────────────────────────────────────────────
// exports.getAllMembers = async (req, res) => {
//   try {
//     const { search, status, activity, plan } = req.query;
//     const query = { organizationId: req.organizationId };

//     if (status)   query.membershipStatus = status;
//     if (plan)     query['activityFees.plan'] = plan;
//     if (activity) query['activityFees.activity'] = activity;

//     if (search) {
//       query.$or = [
//         { name:     { $regex: search, $options: 'i' } },
//         { mobile:   { $regex: search, $options: 'i' } },
//         { memberId: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const members = await FitnessMember.find(query)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description')
//       .populate('activityFees.staff',    'fullName name')
//       .sort({ createdAt: -1 })
//       .select('-password');

//     const result = members.map((m) => applyComputedStatuses(m.toObject()));

//     res.json(result);
//   } catch (err) {
//     console.error('getAllMembers error:', err);
//     res.status(500).json({ message: 'Server error while fetching members.' });
//   }
// };

// // ─── GET ONE ──────────────────────────────────────────────────────────────────
// // exports.getMemberById = async (req, res) => {
// //   try {
// //     if (!isValidObjectId(req.params.id)) {
// //       return res.status(400).json({ message: 'Invalid member ID.' });
// //     }

// //     const member = await FitnessMember.findOne({
// //       _id: req.params.id,
// //       organizationId: req.organizationId,
// //     })
// //       .populate('activityFees.activity', 'name activityName')
// //       .populate('activityFees.feeType',  'description monthly quarterly halfYearly annual')
// //       .populate('activityFees.staff',    'fullName name')
// //       .select('-password');

// //     if (!member) return res.status(404).json({ message: 'Member not found.' });

// //     const obj = applyComputedStatuses(member.toObject());

// //     res.json(obj);
// //   } catch (err) {
// //     console.error('getMemberById error:', err);
// //     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
// //     res.status(500).json({ message: 'Server error while fetching member.' });
// //   }
// // };

// exports.getMemberById = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }
 
//     const member = await FitnessMember.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     })
//       .populate('activityFees.activity', 'name activityName')
//       // ↓ include all plan-price fields so the edit form can auto-fill fees
//       .populate('activityFees.feeType', 'description annual monthly weekly daily hourly')
//       .populate('activityFees.staff',   'fullName name')
//       .select('-password');
 
//     if (!member) return res.status(404).json({ message: 'Member not found.' });
 
//     const obj = applyComputedStatuses(member.toObject());
 
//     res.json(obj);
//   } catch (err) {
//     console.error('getMemberById error:', err);
//     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
//     res.status(500).json({ message: 'Server error while fetching member.' });
//   }
// };
 

// // ─── CREATE ───────────────────────────────────────────────────────────────────
// exports.createMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2 MB.' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed.' });
//     }

//     try {
//       const {
//         name, mobile, email, age, gender, address,
//         userId, password, enquiryId,
//         activityFees: rawActivityFees,
//       } = req.body;

//       // ── Basic field validation ──────────────────────────────────────────
//       const fieldErrors = [];

//       if (!name || !name.trim()) fieldErrors.push('Full name is required.');
//       if (!mobile || !mobile.trim()) {
//         fieldErrors.push('Mobile number is required.');
//       } else if (!/^\d{10}$/.test(mobile.trim())) {
//         fieldErrors.push('Mobile must be a valid 10-digit number.');
//       }
//       if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//         fieldErrors.push('Please provide a valid email address.');
//       }
//       if (age !== undefined && age !== '') {
//         const ageNum = Number(age);
//         if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//           fieldErrors.push('Age must be between 1 and 120.');
//         }
//       }
//       if (!password || !password.trim()) fieldErrors.push('Password is required.');
//       if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//         fieldErrors.push('Invalid gender value.');
//       }
//       if (enquiryId && !isValidObjectId(enquiryId)) {
//         fieldErrors.push('Invalid enquiry ID.');
//       }

//       if (fieldErrors.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: fieldErrors.join(' ') });
//       }
      

//       // ── Duplicate mobile check ──────────────────────────────────────────
//       const existingMobile = await FitnessMember.findOne({
//         mobile: mobile.trim(),
//         organizationId: req.organizationId,
//       });
//       if (existingMobile) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(409).json({ message: `A member with mobile ${mobile.trim()} already exists.` });
//       }

//       // ── Activity fees validation ────────────────────────────────────────
//       let parsedActivityFees = [];
//       if (rawActivityFees) {
//         try {
//           parsedActivityFees = typeof rawActivityFees === 'string'
//             ? JSON.parse(rawActivityFees)
//             : rawActivityFees;
//         } catch {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Invalid activityFees format.' });
//         }
//       }

//      if (
//   (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0)
//   && !req.body.membershipPass
// ) {
//   if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//   return res.status(400).json({
//     message: 'Either activity or membership pass is required.'
//   });
// }

// //       const validatedFees = [];

// // if (!req.body.membershipPass) {
// //   for (let i = 0; i < parsedActivityFees.length; i++) {
// //     const result = validateActivityFee(parsedActivityFees[i], i);
// //     if (result.error) {
// //       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
// //       return res.status(400).json({ message: result.error });
// //     }
// //     validatedFees.push(result.data);
// //   }
// // }

//     const validatedFees = [];

// for (let i = 0; i < parsedActivityFees.length; i++) {
//   const result = validateActivityFee(parsedActivityFees[i], i);
//   if (result.error) {
//     if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//     return res.status(400).json({ message: result.error });
//   }
//   validatedFees.push(result.data);
// }



//       // Duplicate activity check within the same submission
//       const activityIds = validatedFees
//   .map((af) => af.activity?.toString())
//   .filter(Boolean);
// const uniqueActivityIds = new Set(activityIds);
// if (uniqueActivityIds.size !== activityIds.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//       }

//       // ── Build member document ───────────────────────────────────────────
//       const memberData = {
//         name:             name.trim(),
//         mobile:           mobile.trim(),
//         email:            email?.trim()   || undefined,
//         age:              age             ? Number(age) : undefined,
//         gender:           gender          || 'Male',
//         address:          address?.trim() || undefined,
//         userId:           userId?.trim()  || mobile.trim(),
//         password:         password.trim(),
//         enquiryId:        enquiryId       || null,
//         membershipPass: req.body.membershipPass || null,
//         activityFees:     validatedFees,
//         membershipStatus: req.body.membershipPass
//   ? 'Active'
//   : computeOverallMembershipStatus(validatedFees),// ← computed
//   numberOfPersons: req.body.numberOfPersons || 1,
//         organizationId:   req.organizationId,
//       };

//       if (req.file) memberData.photo = `/uploads/members/${req.file.filename}`;

//       const member = new FitnessMember(memberData);
//       await member.save();

//       // Mark enquiry as Admitted
//       if (enquiryId) {
//         await FitnessEnquiry.findByIdAndUpdate(enquiryId, { status: 'Admitted' });
//       }

//       // ── Sync fees to allotment / payment tables ─────────────────────────
//       try {
//         await syncFeesToTables(member, req.organizationId, []);
//       } catch (syncErr) {
//         console.error('Fee sync error (non-fatal):', syncErr.message);
//       }

//       // ── Create recurring slot bookings for each activityFee ─────────────
//       try {
//        if (!req.body.membershipPass) {
//   await createRecurringSlotBookings(member, validatedFees);
// }
//       } catch (bookingErr) {
//         console.error('Slot booking error (non-fatal):', bookingErr.message);
//       }

//       const created = await FitnessMember.findById(member._id)
//         .populate('activityFees.activity', 'name activityName')
//         .populate('activityFees.feeType',  'description')
//         .populate('activityFees.staff',    'fullName name')
//         .select('-password');

//       res.status(201).json({ ...applyComputedStatuses(created.toObject()), message: 'Member added successfully.' });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('createMember error:', err);

//       if (err.code === 11000) {
//         return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//       }
//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map((e) => e.message).join(' '),
//         });
//       }
//       if (err.name === 'CastError') {
//         return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//       }
//       res.status(500).json({ message: 'Server error while creating member.' });
//     }
//   });
// };

// // ─── RENEW MEMBERSHIP ─────────────────────────────────────────────────────────
// exports.renewMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     const { renewals } = req.body;

//     if (!Array.isArray(renewals) || renewals.length === 0) {
//       return res.status(400).json({ message: 'At least one renewal entry is required.' });
//     }

//     // ── Validate each renewal entry ───────────────────────────────────────
//     const validatedRenewals = [];

//     for (let i = 0; i < renewals.length; i++) {
//       const r = renewals[i];
//       const prefix = `Renewal ${i + 1}`;

//       // Allow activity OR membership pass
// if (!r.activityId && !r.feeTypeId) {
//   return res.status(400).json({
//     message: `${prefix}: activity or membership pass is required.`,
//   });
// }

// // Validate activity only if present
// if (r.activityId && !isValidObjectId(r.activityId)) {
//   return res.status(400).json({
//     message: `${prefix}: invalid activity ID.`,
//   });
// }

// // Validate feeType (pass) only if present
// if (r.feeTypeId && !isValidObjectId(r.feeTypeId)) {
//   return res.status(400).json({
//     message: `${prefix}: invalid membership pass ID.`,
//   });
// }

//       const start = new Date(r.startDate);
//       const end = new Date(r.endDate);

//       if (!r.startDate || isNaN(start.getTime())) {
//         return res.status(400).json({ message: `${prefix}: valid start date is required.` });
//       }
//       if (!r.endDate || isNaN(end.getTime())) {
//         return res.status(400).json({ message: `${prefix}: valid end date is required.` });
//       }
//       if (end < start) {
//         return res.status(400).json({ message: `${prefix}: end date cannot be before start date.` });
//       }

//       const planFee = Number(r.planFee) || 0;
//       const discount = Number(r.discount) || 0;

//       if (discount > planFee && planFee > 0) {
//         return res.status(400).json({ message: `${prefix}: discount cannot exceed plan fee.` });
//       }

//       const membershipStatus = computeActivityMembershipStatus({
//         paymentStatus: r.paymentStatus || 'Pending',
//         startDate: start,
//         endDate: end,
//       });

//       validatedRenewals.push({
//         activity: r.activityId || null,
//         feeType: r.feeTypeId || null,
//         plan: r.plan || 'Monthly',
//         planFee,
//         discount,
//         finalAmount: planFee > 0 ? Math.max(0, planFee - discount) : 0,
//         paymentStatus: r.paymentStatus || 'Pending',
//         paymentMode: r.paymentMode || '',
//         paymentDate: r.paymentDate ? new Date(r.paymentDate) : null,
//         planNotes: r.planNotes || '',
//         startDate: start,
//         endDate: end,
//         membershipStatus,
//         staff: r.staffId || null,
//         slot: null,
//         _renewedFromId: r.activityFeeId || null,
//       });
//     }

//     // ── Append new activityFee entries ────────────────────────────────────
//     const newStartIndex = member.activityFees.length;
//     member.activityFees.push(...validatedRenewals);

//     // Recompute overall status
//     member.membershipStatus = computeOverallMembershipStatus(member.activityFees);


// // Just for debug
// //     console.log('TYPE:', typeof member);
// // console.log('IS DOC:', member instanceof FitnessMember);
// // console.log('HAS SAVE:', typeof member.save);



//     await member.save();

//     // ── Sync only the newly added renewals to FeeAllotment & FeePayment ─────
//     try {
//       const newFeesOnly = {
//         _id: member._id,
//         activityFees: member.activityFees.slice(newStartIndex)
//       };
//       await syncFeesToTables(newFeesOnly, req.organizationId, []);
//     } catch (syncErr) {
//       console.error('Fee sync error during renewal:', syncErr.message);
//     }

//     // ── Create recurring bookings for renewed activities ───────────────────
//     try {
//       const activityRenewals = validatedRenewals
//   .map((rv, i) => ({
//     ...rv,
//     activity: rv.activity,
//     activityFeeIndex: newStartIndex + i,
//   }))
//   .filter(r => r.activity); // 🔥 only activities

// if (activityRenewals.length > 0) {
//   await createRecurringSlotBookings(member, activityRenewals);
// }
//     } catch (bookingErr) {
//       console.error('Slot booking error during renewal:', bookingErr.message);
//     }

//     // ── Return updated member ─────────────────────────────────────────────
//     const updated = await FitnessMember.findById(member._id)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType', 'description annual monthly weekly daily hourly')
//       .populate('activityFees.staff', 'fullName name')
//       .select('-password');

//     res.json({
//       ...applyComputedStatuses(updated.toObject()),
//       message: `${validatedRenewals.length} membership${validatedRenewals.length > 1 ? 's' : ''} renewed successfully.`,
//     });

//   } catch (err) {
//     console.error('renewMember error:', err);
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({
//         message: Object.values(err.errors).map(e => e.message).join(' '),
//       });
//     }
//     res.status(500).json({ message: 'Server error while renewing membership.' });
//   }
// };

// // ─── UPDATE ───────────────────────────────────────────────────────────────────
// exports.updateMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2 MB.' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed.' });
//     }

//     try {
//       if (!isValidObjectId(req.params.id)) {
//         return res.status(400).json({ message: 'Invalid member ID.' });
//       }

//       const member = await FitnessMember.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId,
//       });

//       if (!member) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(404).json({ message: 'Member not found.' });
//       }

//       const { name, mobile, email, age, gender, address, userId, password, activityFees: rawActivityFees } = req.body;

//       // ── Basic field validation ──────────────────────────────────────────
//       const fieldErrors = [];

//       if (name !== undefined && !name.trim()) fieldErrors.push('Full name cannot be empty.');
//       if (mobile !== undefined) {
//         if (!mobile.trim()) {
//           fieldErrors.push('Mobile number cannot be empty.');
//         } else if (!/^\d{10}$/.test(mobile.trim())) {
//           fieldErrors.push('Mobile must be a valid 10-digit number.');
//         }
//       }
//       if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//         fieldErrors.push('Please provide a valid email address.');
//       }
//       if (age !== undefined && age !== '') {
//         const ageNum = Number(age);
//         if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//           fieldErrors.push('Age must be between 1 and 120.');
//         }
//       }
//       if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//         fieldErrors.push('Invalid gender value.');
//       }

//       if (fieldErrors.length) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(400).json({ message: fieldErrors.join(' ') });
//       }

//       // ── Duplicate mobile check (excluding self) ─────────────────────────
//       if (mobile && mobile.trim() !== member.mobile) {
//         const dup = await FitnessMember.findOne({
//           mobile:         mobile.trim(),
//           organizationId: req.organizationId,
//           _id:            { $ne: member._id },
//         });
//         if (dup) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(409).json({ message: `Another member with mobile ${mobile.trim()} already exists.` });
//         }
//       }

//       // ── Activity fees validation ────────────────────────────────────────
//       const previousAllotmentIds = member.activityFees
//         .map((af) => af.allotmentId?.toString())
//         .filter(Boolean);

//       let validatedFees = member.activityFees; // default to existing

//       if (rawActivityFees !== undefined) {
//         let parsedActivityFees = [];
//         try {
//           parsedActivityFees = typeof rawActivityFees === 'string'
//             ? JSON.parse(rawActivityFees)
//             : rawActivityFees;
//         } catch {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Invalid activityFees format.' });
//         }

//         if (
//   (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0)
//   && !req.body.membershipPass
// ) {
//   if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//   return res.status(400).json({
//     message: 'Either activity or membership pass is required.'
//   });
// }

//         const tempValidated = [];
//         for (let i = 0; i < parsedActivityFees.length; i++) {
//           const existing = member.activityFees.find(
//             (af) => af._id?.toString() === parsedActivityFees[i]._id?.toString()
//           );
//           const dateUnchanged = existing &&
//             new Date(existing.startDate).toISOString().split('T')[0] === parsedActivityFees[i].startDate;

//           if (dateUnchanged) {
//             const af = parsedActivityFees[i];
//             const start = new Date(af.startDate);
//             const end   = new Date(af.endDate);

//             if (!af.activity || !isValidObjectId(af.activity)) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: a valid activity ID is required.` });
//             }
//             if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: `Activity ${i + 1}: invalid date range.` });
//             }

//             // Compute membershipStatus server-side
//             const membershipStatus = computeActivityMembershipStatus({
//               paymentStatus: af.paymentStatus || 'Pending',
//               startDate:     start,
//               endDate:       end,
//             });

//             tempValidated.push({
//               _id:             existing._id,
//               allotmentId:     existing.allotmentId || null,
//               activity:        af.activity,
//               feeType:         af.feeType   || null,
//               plan:            af.plan      || 'Monthly',
//               planFee:         Number(af.planFee) || 0,
//               discount:        Number(af.discount) || 0,
//               finalAmount:     Math.max(0, Number(af.planFee) - Number(af.discount)),
//               paymentStatus:   af.paymentStatus  || 'Pending',
//               paymentMode:     af.paymentMode    || '',
//               paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//               planNotes:       af.planNotes      || '',
//               startDate:       start,
//               endDate:         end,
//               membershipStatus,                       // ← always computed
//               staff:           af.staff || null,
//               slot:            af.slot || existing.slot || null,
//             });
//           } else {
//             const result = validateActivityFee(parsedActivityFees[i], i);
//             if (result.error) {
//               if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//               return res.status(400).json({ message: result.error });
//             }
//             tempValidated.push({
//               ...result.data,
//               _id:         existing?._id || undefined,
//               allotmentId: existing?.allotmentId || null,
//               slot:        parsedActivityFees[i].slot || null,
//             });
//           }
//         }

//         // Duplicate activity check
//         const activityIds = validatedFees
//   .map((af) => af.activity?.toString())
//   .filter(Boolean);
// const uniqueActivityIds = new Set(activityIds);
// if (uniqueActivityIds.size !== activityIds.length) {
//           if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//           return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//         }

//         validatedFees = tempValidated;
//         member.activityFees = validatedFees;
//       }

//       // ── Apply scalar field updates ──────────────────────────────────────
//       if (name     !== undefined) member.name     = name.trim();
//       if (mobile   !== undefined) member.mobile   = mobile.trim();
//       if (email    !== undefined) member.email    = email.trim() || undefined;
//       if (age      !== undefined && age !== '') member.age = Number(age);
//       if (gender   !== undefined) member.gender   = gender;
//       if (address  !== undefined) member.address  = address?.trim();
//       if (userId   !== undefined) member.userId   = userId?.trim();
//       if (password !== undefined && password.trim()) member.password = password.trim();

//       // ── Recompute overall membership status ────────────────────────────
//       member.membershipStatus = computeOverallMembershipStatus(
//         Array.isArray(validatedFees)
//           ? validatedFees
//           : (validatedFees || []).map
//             ? Array.from(validatedFees)
//             : []
//       );

//       if (req.file) {
//         if (member.photo) deleteOldPhoto(member.photo);
//         member.photo = `/uploads/members/${req.file.filename}`;
//       }

//       await member.save();

//       // Sync fees
//       try {
//         await syncFeesToTables(member, req.organizationId, previousAllotmentIds);
//       } catch (syncErr) {
//         console.error('Fee sync error (non-fatal):', syncErr.message);
//       }

//       // ── Create / Update recurring slot bookings ─────────────────────────
//       try {
//         await createRecurringSlotBookings(member, validatedFees);
//       } catch (bookingErr) {
//         console.error('Slot booking error during update (non-fatal):', bookingErr.message);
//       }

//       const updated = await FitnessMember.findById(member._id)
//         .populate('activityFees.activity', 'name activityName')
//         .populate('activityFees.feeType',  'description')
//         .populate('activityFees.staff',    'fullName name')
//         .select('-password');

//       res.json({ ...applyComputedStatuses(updated.toObject()), message: 'Member updated successfully.' });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('updateMember error:', err);

//       if (err.code === 11000) {
//         return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//       }
//       if (err.name === 'ValidationError') {
//         return res.status(400).json({
//           message: Object.values(err.errors).map((e) => e.message).join(' '),
//         });
//       }
//       if (err.name === 'CastError') {
//         return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//       }
//       res.status(500).json({ message: 'Server error while updating member.' });
//     }
//   });
// };

// // ─── DELETE ───────────────────────────────────────────────────────────────────
// exports.deleteMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     // Cleanup photo
//     if (member.photo) deleteOldPhoto(member.photo);

//     // Cleanup linked allotments + payments
//     const allotmentIds = member.activityFees
//       .map((af) => af.allotmentId)
//       .filter(Boolean);

//     if (allotmentIds.length) {
//       await FeeAllotment.deleteMany({ _id: { $in: allotmentIds }, organizationId: req.organizationId });
//       await FeePayment.deleteMany({ allotmentId: { $in: allotmentIds }, organizationId: req.organizationId });
//     }

//     // Cleanup all slot bookings for this member
//     await FitnessBooking.deleteMany({ memberId: req.params.id });

//     res.json({ message: 'Member deleted successfully.' });
//   } catch (err) {
//     console.error('deleteMember error:', err);
//     if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
//     res.status(500).json({ message: 'Server error while deleting member.' });
//   }
// };















// controllers/fitnessMemberController.js
const fs   = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const FitnessMember    = require('../models/FitnessMember');
const FitnessEnquiry   = require('../models/FitnessEnquiry');
const FeeAllotment     = require('../models/FitnessFeeAllotment');
const FeePayment       = require('../models/FitnessFeePayment');
const FitnessBooking   = require('../models/FitnessBooking');

const { generateRecurringBookings } = require('./fitnessActivityController');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const deleteOldPhoto = (photoPath) => {
  // Now stored as /uploads/fitness/members/filename
  if (photoPath && photoPath.startsWith('/uploads/')) {
    const fullPath = path.join(__dirname, '..', photoPath);
    try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
  }
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const computeActivityMembershipStatus = (af) => {
  if (af.paymentStatus !== 'Paid') return 'Inactive';
  if (!af.startDate || !af.endDate) return 'Inactive';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
  const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

  return (today >= start && today <= end) ? 'Active' : 'Inactive';
};

const computeOverallMembershipStatus = (activityFees) => {
  if (!Array.isArray(activityFees) || activityFees.length === 0) return 'Inactive';
  const anyActive = activityFees.some(
    (af) => computeActivityMembershipStatus(af) === 'Active'
  );
  return anyActive ? 'Active' : 'Inactive';
};

const validateActivityFee = (af, index) => {
  const prefix = `Activity ${index + 1}`;

  if (!af.activity && !af.feeType) {
    return { error: `${prefix}: activity or membership pass is required.` };
  }
  if (af.activity && !isValidObjectId(af.activity)) {
    return { error: `${prefix}: invalid activity ID.` };
  }

  if (!af.startDate) return { error: `${prefix}: start date is required.` };
  if (!af.endDate)   return { error: `${prefix}: end date is required.` };

  const start = new Date(af.startDate);
  const end   = new Date(af.endDate);

  if (isNaN(start.getTime())) return { error: `${prefix}: start date is invalid.` };
  if (isNaN(end.getTime()))   return { error: `${prefix}: end date is invalid.` };

  if (end < start) {
    return { error: `${prefix}: end date cannot be before start date.` };
  }

  const planFee     = Number(af.planFee)     || 0;
  const discount    = Number(af.discount)    || 0;
  const finalAmount = Number(af.finalAmount) || 0;

  if (planFee < 0)  return { error: `${prefix}: plan fee cannot be negative.` };
  if (discount < 0) return { error: `${prefix}: discount cannot be negative.` };
  if (discount > planFee && planFee > 0) {
    return { error: `${prefix}: discount (₹${discount}) cannot exceed plan fee (₹${planFee}).` };
  }

  const validPlans    = ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
  const validModes    = ['Cash', 'Bank Transfer', ''];
  const validStatuses = ['Paid', 'Pending'];

  if (af.plan && !validPlans.includes(af.plan)) {
    return { error: `${prefix}: invalid plan "${af.plan}". Must be one of: ${validPlans.join(', ')}.` };
  }
  if (af.paymentMode && !validModes.includes(af.paymentMode)) {
    return { error: `${prefix}: invalid payment mode "${af.paymentMode}".` };
  }
  if (af.paymentStatus && !validStatuses.includes(af.paymentStatus)) {
    return { error: `${prefix}: invalid payment status "${af.paymentStatus}".` };
  }
  if (af.staff && !isValidObjectId(af.staff)) {
    return { error: `${prefix}: invalid staff ID.` };
  }
  if (af.feeType && !isValidObjectId(af.feeType)) {
    return { error: `${prefix}: invalid fee type ID.` };
  }
  if (af.paymentDate) {
    const pd = new Date(af.paymentDate);
    if (isNaN(pd.getTime())) return { error: `${prefix}: payment date is invalid.` };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (pd >= tomorrow) {
      return { error: `${prefix}: payment date cannot be in the future.` };
    }
  }

  const membershipStatus = computeActivityMembershipStatus({
    paymentStatus: af.paymentStatus || 'Pending',
    startDate:     start,
    endDate:       end,
  });

  return {
    data: {
      activity:        af.activity,
      feeType:         af.feeType  || null,
      plan:            af.plan     || 'Monthly',
      planFee,
      discount,
      finalAmount:     Math.max(0, planFee - discount),
      paymentStatus:   af.paymentStatus  || 'Pending',
      paymentMode:     af.paymentMode    || '',
      paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
      planNotes:       af.planNotes      || '',
      startDate:       start,
      endDate:         end,
      membershipStatus,
      staff:           af.staff || null,
      slot:            af.slot  || null,
    },
  };
};

// ─── Sync fees to FeeAllotment + FeePayment ───────────────────────────────────
const syncFeesToTables = async (member, orgId, previousAllotmentIds = []) => {
  const currentAllotmentIds = member.activityFees
    .map((af) => af.allotmentId?.toString())
    .filter(Boolean);

  const orphaned = previousAllotmentIds.filter(
    (id) => id && !currentAllotmentIds.includes(id.toString())
  );
  if (orphaned.length) {
    await FeeAllotment.deleteMany({ _id: { $in: orphaned }, organizationId: orgId });
    await FeePayment.deleteMany({ allotmentId: { $in: orphaned }, organizationId: orgId });
  }

  for (let i = 0; i < member.activityFees.length; i++) {
    const af = member.activityFees[i];

    if (!af.feeType) continue;

    const planMap = { Annual: 'Annual', Monthly: 'Monthly', Weekly: 'Weekly', Daily: 'Daily', Hourly: 'Hourly' };
    const feePlan = planMap[af.plan] || 'Monthly';

    let allotment;

    if (af.allotmentId) {
      allotment = await FeeAllotment.findByIdAndUpdate(
        af.allotmentId,
        {
          memberId:         member._id,
          feeTypeId:        af.feeType,
          amount:           af.finalAmount || af.planFee || 0,
          feePlan,
          dueDate:          af.endDate,
          responsibleStaff: af.staff || null,
          organizationId:   orgId,
          status:           af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
        },
        { new: true }
      );
    } else {
      allotment = await FeeAllotment.create({
        memberId:         member._id,
        feeTypeId:        af.feeType,
        amount:           af.finalAmount || af.planFee || 0,
        feePlan,
        dueDate:          af.endDate,
        responsibleStaff: af.staff || null,
        organizationId:   orgId,
        status:           af.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
      });

      member.activityFees[i].allotmentId = allotment._id;
    }

    if (af.paymentStatus === 'Paid' && (af.finalAmount || af.planFee) > 0 && allotment) {
      await FeePayment.findOneAndUpdate(
        { allotmentId: allotment._id, organizationId: orgId },
        {
          memberId:    member._id,
          allotmentId: allotment._id,
          amount:      af.finalAmount || af.planFee,
          paymentMode: af.paymentMode || 'Cash',
          paymentDate: af.paymentDate || new Date(),
          organizationId: orgId,
          description: af.activity
            ? `Activity fee - ${af.plan} plan`
            : `Membership pass - ${af.plan} plan`,
          feePlan,
        },
        { upsert: true, new: true }
      );

      await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
    }
  }

  await FitnessMember.findByIdAndUpdate(
    member._id,
    {
      $set: {
        activityFees: member.activityFees.map((af) =>
          af.toObject ? af.toObject() : af
        ),
      },
    }
  );
};

// ─── Create recurring slot bookings ──────────────────────────────────────────
const createRecurringSlotBookings = async (member, activityFeesSerialized) => {
  try {
    for (let i = 0; i < activityFeesSerialized.length; i++) {
      const af = activityFeesSerialized[i];

      if (!af.slot || !af.activity) continue;

      await FitnessBooking.deleteMany({
        memberId:         member._id,
        activityFeeIndex: i,
      });

      await generateRecurringBookings(
        member._id,
        i,
        af.activity,
        af.slot,
        af.startDate,
        af.endDate,
        member.name,
        member.mobile
      );
    }
  } catch (bookingErr) {
    console.error('Recurring booking creation error (non-fatal):', bookingErr.message);
  }
};

// ─── Apply computed statuses ──────────────────────────────────────────────────
const applyComputedStatuses = (obj) => {
  let anyActive = false;

  obj.activityFees = (obj.activityFees || []).map((af) => {
    const status = computeActivityMembershipStatus(af);
    af.membershipStatus = status;
    if (status === 'Active') anyActive = true;
    return af;
  });

  obj.membershipStatus = anyActive ? 'Active' : 'Inactive';
  return obj;
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
exports.getAllMembers = async (req, res) => {
  try {
    const {
      search,
      status,
      activity,
      plan,
      page = 1,
      limit = 10
    } = req.query;

    const query = { organizationId: req.organizationId };

    if (status) query.membershipStatus = status;
    if (plan) query['activityFees.plan'] = plan;

    if (activity && mongoose.Types.ObjectId.isValid(activity)) {
      query['activityFees.activity'] = new mongoose.Types.ObjectId(activity);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    let parsedLimit = parseInt(limit, 10) || 10;
    if (parsedLimit < 5) parsedLimit = 5;
    if (parsedLimit > 100) parsedLimit = 100;

    const skip = (parsedPage - 1) * parsedLimit;

    const total = await FitnessMember.countDocuments(query);

    const members = await FitnessMember.find(query)
      .populate('activityFees.activity', 'name activityName')
      .populate('activityFees.feeType', 'description')
      .populate('activityFees.staff', 'fullName name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .select('-password');

    const result = members.map((m) => applyComputedStatuses(m.toObject()));

    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(parsedPage));
    res.set('X-Limit', String(parsedLimit));
    res.set('X-Total-Pages', String(Math.ceil(total / parsedLimit)));
    res.set('X-Has-Next-Page', String(parsedPage < Math.ceil(total / parsedLimit)));
    res.set('X-Has-Prev-Page', String(parsedPage > 1));

    res.json(result);
  } catch (err) {
    console.error('getAllMembers error:', err);
    res.status(500).json({
      message: 'Server error while fetching members.'
    });
  }
};

// ─── GET ONE ──────────────────────────────────────────────────────────────────
exports.getMemberById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid member ID.' });
    }

    const member = await FitnessMember.findOne({
      _id:            req.params.id,
      organizationId: req.organizationId,
    })
      .populate('activityFees.activity', 'name activityName')
      .populate('activityFees.feeType',  'description annual monthly weekly daily hourly')
      .populate('activityFees.staff',    'fullName name')
      .select('-password');

    if (!member) return res.status(404).json({ message: 'Member not found.' });

    const obj = applyComputedStatuses(member.toObject());
    res.json(obj);
  } catch (err) {
    console.error('getMemberById error:', err);
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
    res.status(500).json({ message: 'Server error while fetching member.' });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
// Note: upload middleware (upload.fitnessMember) runs in the route before this
// handler. req.file is already populated when we reach here.
exports.createMember = async (req, res) => {
  try {
    const {
      name, mobile, email, age, gender, address,
      userId, password, enquiryId,
      activityFees: rawActivityFees,
    } = req.body;

    // ── Basic field validation ────────────────────────────────────────────
    const fieldErrors = [];

    if (!name || !name.trim()) fieldErrors.push('Full name is required.');
    if (!mobile || !mobile.trim()) {
      fieldErrors.push('Mobile number is required.');
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      fieldErrors.push('Mobile must be a valid 10-digit number.');
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      fieldErrors.push('Please provide a valid email address.');
    }
    if (age !== undefined && age !== '') {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        fieldErrors.push('Age must be between 1 and 120.');
      }
    }
    if (!password || !password.trim()) fieldErrors.push('Password is required.');
    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
      fieldErrors.push('Invalid gender value.');
    }
    if (enquiryId && !isValidObjectId(enquiryId)) {
      fieldErrors.push('Invalid enquiry ID.');
    }

    if (fieldErrors.length) {
      if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
      return res.status(400).json({ message: fieldErrors.join(' ') });
    }

    // ── Duplicate mobile check ────────────────────────────────────────────
    const existingMobile = await FitnessMember.findOne({
      mobile:         mobile.trim(),
      organizationId: req.organizationId,
    });
    if (existingMobile) {
      if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
      return res.status(409).json({ message: `A member with mobile ${mobile.trim()} already exists.` });
    }

    // ── Activity fees validation ──────────────────────────────────────────
    let parsedActivityFees = [];
    if (rawActivityFees) {
      try {
        parsedActivityFees = typeof rawActivityFees === 'string'
          ? JSON.parse(rawActivityFees)
          : rawActivityFees;
      } catch {
        if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
        return res.status(400).json({ message: 'Invalid activityFees format.' });
      }
    }

    if (
      (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0)
      && !req.body.membershipPass
    ) {
      if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
      return res.status(400).json({ message: 'Either activity or membership pass is required.' });
    }

    const validatedFees = [];
    for (let i = 0; i < parsedActivityFees.length; i++) {
      const result = validateActivityFee(parsedActivityFees[i], i);
      if (result.error) {
        if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
        return res.status(400).json({ message: result.error });
      }
      validatedFees.push(result.data);
    }

    // Duplicate activity check
    const activityIds       = validatedFees.map((af) => af.activity?.toString()).filter(Boolean);
    const uniqueActivityIds = new Set(activityIds);
    if (uniqueActivityIds.size !== activityIds.length) {
      if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
      return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
    }

    // ── Build member document ─────────────────────────────────────────────
    const memberData = {
      name:             name.trim(),
      mobile:           mobile.trim(),
      email:            email?.trim()   || undefined,
      age:              age             ? Number(age) : undefined,
      gender:           gender          || 'Male',
      address:          address?.trim() || undefined,
      userId:           userId?.trim()  || mobile.trim(),
      password:         password.trim(),
      enquiryId:        enquiryId       || null,
      membershipPass:   req.body.membershipPass || null,
      activityFees:     validatedFees,
      membershipStatus: req.body.membershipPass
        ? 'Active'
        : computeOverallMembershipStatus(validatedFees),
      numberOfPersons:  req.body.numberOfPersons || 1,
      organizationId:   req.organizationId,
    };

    // ── Photo path uses the new folder structure ──────────────────────────
    if (req.file) {
      memberData.photo = `/uploads/fitness/members/${req.file.filename}`;
    }

    const member = new FitnessMember(memberData);
    await member.save();

    if (enquiryId) {
      await FitnessEnquiry.findByIdAndUpdate(enquiryId, { status: 'Admitted' });
    }

    try {
      await syncFeesToTables(member, req.organizationId, []);
    } catch (syncErr) {
      console.error('Fee sync error (non-fatal):', syncErr.message);
    }

    try {
      if (!req.body.membershipPass) {
        await createRecurringSlotBookings(member, validatedFees);
      }
    } catch (bookingErr) {
      console.error('Slot booking error (non-fatal):', bookingErr.message);
    }

    const created = await FitnessMember.findById(member._id)
      .populate('activityFees.activity', 'name activityName')
      .populate('activityFees.feeType',  'description')
      .populate('activityFees.staff',    'fullName name')
      .select('-password');

    res.status(201).json({
      ...applyComputedStatuses(created.toObject()),
      message: 'Member added successfully.',
    });
  } catch (err) {
    if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
    console.error('createMember error:', err);

    if (err.code === 11000) {
      return res.status(409).json({ message: 'A member with this mobile number already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors).map((e) => e.message).join(' '),
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
    }
    res.status(500).json({ message: 'Server error while creating member.' });
  }
};

// ─── RENEW MEMBERSHIP ─────────────────────────────────────────────────────────
exports.renewMember = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid member ID.' });
    }

    const member = await FitnessMember.findOne({
      _id:            req.params.id,
      organizationId: req.organizationId,
    });

    if (!member) return res.status(404).json({ message: 'Member not found.' });

    const { renewals } = req.body;

    if (!Array.isArray(renewals) || renewals.length === 0) {
      return res.status(400).json({ message: 'At least one renewal entry is required.' });
    }

    const validatedRenewals = [];

    for (let i = 0; i < renewals.length; i++) {
      const r      = renewals[i];
      const prefix = `Renewal ${i + 1}`;

      if (!r.activityId && !r.feeTypeId) {
        return res.status(400).json({ message: `${prefix}: activity or membership pass is required.` });
      }
      if (r.activityId && !isValidObjectId(r.activityId)) {
        return res.status(400).json({ message: `${prefix}: invalid activity ID.` });
      }
      if (r.feeTypeId && !isValidObjectId(r.feeTypeId)) {
        return res.status(400).json({ message: `${prefix}: invalid membership pass ID.` });
      }

      const start = new Date(r.startDate);
      const end   = new Date(r.endDate);

      if (!r.startDate || isNaN(start.getTime())) {
        return res.status(400).json({ message: `${prefix}: valid start date is required.` });
      }
      if (!r.endDate || isNaN(end.getTime())) {
        return res.status(400).json({ message: `${prefix}: valid end date is required.` });
      }
      if (end < start) {
        return res.status(400).json({ message: `${prefix}: end date cannot be before start date.` });
      }

      const planFee  = Number(r.planFee)  || 0;
      const discount = Number(r.discount) || 0;

      if (discount > planFee && planFee > 0) {
        return res.status(400).json({ message: `${prefix}: discount cannot exceed plan fee.` });
      }

      const membershipStatus = computeActivityMembershipStatus({
        paymentStatus: r.paymentStatus || 'Pending',
        startDate:     start,
        endDate:       end,
      });

      validatedRenewals.push({
        activity:       r.activityId || null,
        feeType:        r.feeTypeId  || null,
        plan:           r.plan       || 'Monthly',
        planFee,
        discount,
        finalAmount:    planFee > 0 ? Math.max(0, planFee - discount) : 0,
        paymentStatus:  r.paymentStatus || 'Pending',
        paymentMode:    r.paymentMode   || '',
        paymentDate:    r.paymentDate   ? new Date(r.paymentDate) : null,
        planNotes:      r.planNotes     || '',
        startDate:      start,
        endDate:        end,
        membershipStatus,
        staff:          r.staffId || null,
        slot:           null,
        _renewedFromId: r.activityFeeId || null,
      });
    }

    const newStartIndex = member.activityFees.length;
    member.activityFees.push(...validatedRenewals);
    member.membershipStatus = computeOverallMembershipStatus(member.activityFees);

    await member.save();

    try {
      const newFeesOnly = {
        _id:          member._id,
        activityFees: member.activityFees.slice(newStartIndex),
      };
      await syncFeesToTables(newFeesOnly, req.organizationId, []);
    } catch (syncErr) {
      console.error('Fee sync error during renewal:', syncErr.message);
    }

    try {
      const activityRenewals = validatedRenewals
        .map((rv, i) => ({ ...rv, activity: rv.activity, activityFeeIndex: newStartIndex + i }))
        .filter((r) => r.activity);

      if (activityRenewals.length > 0) {
        await createRecurringSlotBookings(member, activityRenewals);
      }
    } catch (bookingErr) {
      console.error('Slot booking error during renewal:', bookingErr.message);
    }

    const updated = await FitnessMember.findById(member._id)
      .populate('activityFees.activity', 'name activityName')
      .populate('activityFees.feeType',  'description annual monthly weekly daily hourly')
      .populate('activityFees.staff',    'fullName name')
      .select('-password');

    res.json({
      ...applyComputedStatuses(updated.toObject()),
      message: `${validatedRenewals.length} membership${validatedRenewals.length > 1 ? 's' : ''} renewed successfully.`,
    });
  } catch (err) {
    console.error('renewMember error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors).map((e) => e.message).join(' '),
      });
    }
    res.status(500).json({ message: 'Server error while renewing membership.' });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// Note: upload middleware (upload.fitnessMember) runs in the route before this
// handler. req.file is already populated when we reach here.
exports.updateMember = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid member ID.' });
    }

    const member = await FitnessMember.findOne({
      _id:            req.params.id,
      organizationId: req.organizationId,
    });

    if (!member) {
      if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
      return res.status(404).json({ message: 'Member not found.' });
    }

    const {
      name, mobile, email, age, gender, address,
      userId, password,
      activityFees: rawActivityFees,
    } = req.body;

    // ── Basic field validation ────────────────────────────────────────────
    const fieldErrors = [];

    if (name !== undefined && !name.trim()) fieldErrors.push('Full name cannot be empty.');
    if (mobile !== undefined) {
      if (!mobile.trim()) {
        fieldErrors.push('Mobile number cannot be empty.');
      } else if (!/^\d{10}$/.test(mobile.trim())) {
        fieldErrors.push('Mobile must be a valid 10-digit number.');
      }
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      fieldErrors.push('Please provide a valid email address.');
    }
    if (age !== undefined && age !== '') {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        fieldErrors.push('Age must be between 1 and 120.');
      }
    }
    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
      fieldErrors.push('Invalid gender value.');
    }

    if (fieldErrors.length) {
      if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
      return res.status(400).json({ message: fieldErrors.join(' ') });
    }

    // ── Duplicate mobile check (excluding self) ───────────────────────────
    if (mobile && mobile.trim() !== member.mobile) {
      const dup = await FitnessMember.findOne({
        mobile:         mobile.trim(),
        organizationId: req.organizationId,
        _id:            { $ne: member._id },
      });
      if (dup) {
        if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
        return res.status(409).json({ message: `Another member with mobile ${mobile.trim()} already exists.` });
      }
    }

    // ── Activity fees validation ──────────────────────────────────────────
    const previousAllotmentIds = member.activityFees
      .map((af) => af.allotmentId?.toString())
      .filter(Boolean);

    let validatedFees = member.activityFees; // default: keep existing

    if (rawActivityFees !== undefined) {
      let parsedActivityFees = [];
      try {
        parsedActivityFees = typeof rawActivityFees === 'string'
          ? JSON.parse(rawActivityFees)
          : rawActivityFees;
      } catch {
        if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
        return res.status(400).json({ message: 'Invalid activityFees format.' });
      }

      if (
        (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0)
        && !req.body.membershipPass
      ) {
        if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
        return res.status(400).json({ message: 'Either activity or membership pass is required.' });
      }

      const tempValidated = [];
      for (let i = 0; i < parsedActivityFees.length; i++) {
        const existing = member.activityFees.find(
          (af) => af._id?.toString() === parsedActivityFees[i]._id?.toString()
        );
        const dateUnchanged = existing &&
          new Date(existing.startDate).toISOString().split('T')[0] === parsedActivityFees[i].startDate;

        if (dateUnchanged) {
          const af    = parsedActivityFees[i];
          const start = new Date(af.startDate);
          const end   = new Date(af.endDate);

          if (!af.activity || !isValidObjectId(af.activity)) {
            if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
            return res.status(400).json({ message: `Activity ${i + 1}: a valid activity ID is required.` });
          }
          if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
            return res.status(400).json({ message: `Activity ${i + 1}: invalid date range.` });
          }

          const membershipStatus = computeActivityMembershipStatus({
            paymentStatus: af.paymentStatus || 'Pending',
            startDate:     start,
            endDate:       end,
          });

          tempValidated.push({
            _id:             existing._id,
            allotmentId:     existing.allotmentId || null,
            activity:        af.activity,
            feeType:         af.feeType   || null,
            plan:            af.plan      || 'Monthly',
            planFee:         Number(af.planFee)    || 0,
            discount:        Number(af.discount)   || 0,
            finalAmount:     Math.max(0, Number(af.planFee) - Number(af.discount)),
            paymentStatus:   af.paymentStatus || 'Pending',
            paymentMode:     af.paymentMode   || '',
            paymentDate:     af.paymentDate   ? new Date(af.paymentDate) : null,
            planNotes:       af.planNotes     || '',
            startDate:       start,
            endDate:         end,
            membershipStatus,
            staff:           af.staff || null,
            slot:            af.slot  || existing.slot || null,
          });
        } else {
          const result = validateActivityFee(parsedActivityFees[i], i);
          if (result.error) {
            if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
            return res.status(400).json({ message: result.error });
          }
          tempValidated.push({
            ...result.data,
            _id:         existing?._id         || undefined,
            allotmentId: existing?.allotmentId || null,
            slot:        parsedActivityFees[i].slot || null,
          });
        }
      }

      // Duplicate activity check
      const activityIds       = tempValidated.map((af) => af.activity?.toString()).filter(Boolean);
      const uniqueActivityIds = new Set(activityIds);
      if (uniqueActivityIds.size !== activityIds.length) {
        if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
        return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
      }

      validatedFees        = tempValidated;
      member.activityFees  = validatedFees;
    }

    // ── Apply scalar field updates ────────────────────────────────────────
    if (name     !== undefined) member.name     = name.trim();
    if (mobile   !== undefined) member.mobile   = mobile.trim();
    if (email    !== undefined) member.email    = email.trim() || undefined;
    if (age      !== undefined && age !== '') member.age = Number(age);
    if (gender   !== undefined) member.gender   = gender;
    if (address  !== undefined) member.address  = address?.trim();
    if (userId   !== undefined) member.userId   = userId?.trim();
    if (password !== undefined && password.trim()) member.password = password.trim();

    member.membershipStatus = computeOverallMembershipStatus(
      Array.isArray(validatedFees) ? validatedFees : []
    );

    // ── Photo: delete old, store new path ─────────────────────────────────
    if (req.file) {
      if (member.photo) deleteOldPhoto(member.photo);
      member.photo = `/uploads/fitness/members/${req.file.filename}`;
    }

    await member.save();

    try {
      await syncFeesToTables(member, req.organizationId, previousAllotmentIds);
    } catch (syncErr) {
      console.error('Fee sync error (non-fatal):', syncErr.message);
    }

    try {
      await createRecurringSlotBookings(member, validatedFees);
    } catch (bookingErr) {
      console.error('Slot booking error during update (non-fatal):', bookingErr.message);
    }

    const updated = await FitnessMember.findById(member._id)
      .populate('activityFees.activity', 'name activityName')
      .populate('activityFees.feeType',  'description')
      .populate('activityFees.staff',    'fullName name')
      .select('-password');

    res.json({
      ...applyComputedStatuses(updated.toObject()),
      message: 'Member updated successfully.',
    });
  } catch (err) {
    if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
    console.error('updateMember error:', err);

    if (err.code === 11000) {
      return res.status(409).json({ message: 'A member with this mobile number already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors).map((e) => e.message).join(' '),
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
    }
    res.status(500).json({ message: 'Server error while updating member.' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteMember = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid member ID.' });
    }

    const member = await FitnessMember.findOneAndDelete({
      _id:            req.params.id,
      organizationId: req.organizationId,
    });

    if (!member) return res.status(404).json({ message: 'Member not found.' });

    if (member.photo) deleteOldPhoto(member.photo);

    const allotmentIds = member.activityFees.map((af) => af.allotmentId).filter(Boolean);
    if (allotmentIds.length) {
      await FeeAllotment.deleteMany({ _id: { $in: allotmentIds }, organizationId: req.organizationId });
      await FeePayment.deleteMany({ allotmentId: { $in: allotmentIds }, organizationId: req.organizationId });
    }

    await FitnessBooking.deleteMany({ memberId: req.params.id });

    res.json({ message: 'Member deleted successfully.' });
  } catch (err) {
    console.error('deleteMember error:', err);
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
    res.status(500).json({ message: 'Server error while deleting member.' });
  }
};