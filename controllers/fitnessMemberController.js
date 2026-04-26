


















// // controllers/fitnessMemberController.js
// const fs   = require('fs');
// const path = require('path');
// const mongoose = require('mongoose');

// const FitnessMember    = require('../models/FitnessMember');
// const FitnessEnquiry   = require('../models/FitnessEnquiry');
// const FeeAllotment     = require('../models/FitnessFeeAllotment');
// const FeePayment       = require('../models/FitnessFeePayment');
// const FitnessBooking   = require('../models/FitnessBooking');

// const { generateRecurringBookings } = require('./fitnessActivityController');

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const deleteOldPhoto = (photoPath) => {
//   // Now stored as /uploads/fitness/members/filename
//   if (photoPath && photoPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', photoPath);
//     try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
//   }
// };

// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// const computeActivityMembershipStatus = (af) => {
//   if (af.paymentStatus !== 'Paid') return 'Inactive';
//   if (!af.startDate || !af.endDate) return 'Inactive';

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
//   const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

//   return (today >= start && today <= end) ? 'Active' : 'Inactive';
// };

// const computeOverallMembershipStatus = (activityFees) => {
//   if (!Array.isArray(activityFees) || activityFees.length === 0) return 'Inactive';
//   const anyActive = activityFees.some(
//     (af) => computeActivityMembershipStatus(af) === 'Active'
//   );
//   return anyActive ? 'Active' : 'Inactive';
// };

// const validateActivityFee = (af, index) => {
//   const prefix = `Activity ${index + 1}`;

//   // ── feeType is mandatory ──────────────────────────────────────────────────
//   if (!af.feeType) {
//     return { error: `${prefix}: fee type is required.` };
//   }

//   if (!af.activity && !af.feeType) {
//     return { error: `${prefix}: activity or membership pass is required.` };
//   }
//   if (af.activity && !isValidObjectId(af.activity)) {
//     return { error: `${prefix}: invalid activity ID.` };
//   }

//   if (!af.startDate) return { error: `${prefix}: start date is required.` };
//   if (!af.endDate)   return { error: `${prefix}: end date is required.` };

//   const start = new Date(af.startDate);
//   const end   = new Date(af.endDate);

//   if (isNaN(start.getTime())) return { error: `${prefix}: start date is invalid.` };
//   if (isNaN(end.getTime()))   return { error: `${prefix}: end date is invalid.` };

//   if (end < start) {
//     return { error: `${prefix}: end date cannot be before start date.` };
//   }

//   const planFee     = Number(af.planFee)     || 0;
//   const discount    = Number(af.discount)    || 0;
//   const finalAmount = Math.max(0, planFee - discount);

//   if (planFee < 0)  return { error: `${prefix}: plan fee cannot be negative.` };
//   if (discount < 0) return { error: `${prefix}: discount cannot be negative.` };
//   if (discount > planFee && planFee > 0) {
//     return { error: `${prefix}: discount (₹${discount}) cannot exceed plan fee (₹${planFee}).` };
//   }
//   if (finalAmount < 0) {
//     return { error: `${prefix}: final amount cannot be negative.` };
//   }

//   const validPlans    = ['Annual','halfYearly','quarterly', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
//   const validModes    = ['Cash', 'Bank Transfer', ''];
//   const validStatuses = ['Paid', 'Pending'];
//   if (af.paymentStatus === 'Paid' && !af.feeType && !af.activity) {
//     return { error: `${prefix}: Cannot mark as Paid without feeType or activity.` };
//   }

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
//       finalAmount,
//       paymentStatus:   af.paymentStatus  || 'Pending',
//       paymentMode:     af.paymentMode    || '',
//       paymentDate:     af.paymentDate    ? new Date(af.paymentDate) : null,
//       planNotes:       af.planNotes      || '',
//       startDate:       start,
//       endDate:         end,
//       membershipStatus,
//       staff:           af.staff || null,
//       slot:            af.slot  || null,
//     },
//   };
// };

// // ─── Sync fees to FeeAllotment + FeePayment ───────────────────────────────────
// const syncFeesToTables = async (member, orgId, previousAllotmentIds = []) => {
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
//     const af = member.activityFees[i];

//     // if (!af.feeType) continue;
//     if (!af.feeType && !af.activity) continue;

//     const planMap = { Annual: 'Annual', Halfyearly: 'halfYearly',Quarterly: 'quarterly', Monthly: 'Monthly', Weekly: 'Weekly', Daily: 'Daily', Hourly: 'Hourly' };
//     const feePlan = planMap[af.plan] || 'Monthly';

//     let allotment;

//     if (af.allotmentId) {
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
//         { new: true }
//       );
//     } else {
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

//       member.activityFees[i].allotmentId = allotment._id;
//     }

//     if (af.paymentStatus === 'Paid') {
//   if (!allotment) {
//     throw new Error(`CRITICAL: Paid fee without allotment for member ${member._id}`);
//   }

//   if ((af.finalAmount || af.planFee) > 0) {
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
//           ? `Activity fee - ${af.plan} plan`
//           : `Membership pass - ${af.plan} plan`,
//         feePlan,
//       },
//       { upsert: true, new: true }
//     );

//     await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//   }
// } {
//       await FeePayment.findOneAndUpdate(
//         { allotmentId: allotment._id, organizationId: orgId },
//         {
//           memberId:    member._id,
//           allotmentId: allotment._id,
//           amount:      af.finalAmount || af.planFee,
//           paymentMode: af.paymentMode || 'Cash',
//           paymentDate: af.paymentDate || new Date(),
//           organizationId: orgId,
//           description: af.activity
//             ? `Activity fee - ${af.plan} plan`
//             : `Membership pass - ${af.plan} plan`,
//           feePlan,
//         },
//         { upsert: true, new: true }
//       );

//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//     }
//   }

//   await FitnessMember.findByIdAndUpdate(
//     member._id,
//     {
//       $set: {
//         activityFees: member.activityFees.map((af) =>
//           af.toObject ? af.toObject() : af
//         ),
//       },
//     }
//   );
// };

// // ─── Create recurring slot bookings ──────────────────────────────────────────
// const createRecurringSlotBookings = async (member, activityFeesSerialized) => {
//   try {
//     for (let i = 0; i < activityFeesSerialized.length; i++) {
//       const af = activityFeesSerialized[i];

//       if (!af.slot || !af.activity) continue;

//       await FitnessBooking.deleteMany({
//         memberId:         member._id,
//         activityFeeIndex: i,
//       });

//       await generateRecurringBookings(
//         member._id,
//         i,
//         af.activity,
//         af.slot,
//         af.startDate,
//         af.endDate,
//         member.name,
//         member.mobile
//       );
//     }
//   } catch (bookingErr) {
//     console.error('Recurring booking creation error (non-fatal):', bookingErr.message);
//   }
// };

// // ─── Apply computed statuses ──────────────────────────────────────────────────
// const applyComputedStatuses = (obj) => {
//   let anyActive = false;

//   obj.activityFees = (obj.activityFees || []).map((af) => {
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
// exports.getMemberById = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOne({
//       _id:            req.params.id,
//       organizationId: req.organizationId,
//     })
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description annual halfYearly quarterly monthly weekly daily hourly')
//       .populate('activityFees.staff',    'fullName name')
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
// // Note: upload middleware (upload.fitnessMember) runs in the route before this
// // handler. req.file is already populated when we reach here.
// exports.createMember = async (req, res) => {
//   try {
//     const {
//       name, mobile, email, age, gender, address,
//       userId, password, enquiryId,
//       activityFees: rawActivityFees,
//     } = req.body;

//     // ── Basic field validation ────────────────────────────────────────────
//     const fieldErrors = [];

//     if (!name || !name.trim()) fieldErrors.push('Full name is required.');
//     if (!mobile || !mobile.trim()) {
//       fieldErrors.push('Mobile number is required.');
//     } else if (!/^\d{10}$/.test(mobile.trim())) {
//       fieldErrors.push('Mobile must be a valid 10-digit number.');
//     }
//     if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//       fieldErrors.push('Please provide a valid email address.');
//     }
//     if (age !== undefined && age !== '') {
//       const ageNum = Number(age);
//       if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//         fieldErrors.push('Age must be between 1 and 120.');
//       }
//     }
//     if (!password || !password.trim()) fieldErrors.push('Password is required.');
//     if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//       fieldErrors.push('Invalid gender value.');
//     }
//     if (enquiryId && !isValidObjectId(enquiryId)) {
//       fieldErrors.push('Invalid enquiry ID.');
//     }

//     if (fieldErrors.length) {
//       if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//       return res.status(400).json({ message: fieldErrors.join(' ') });
//     }

//     // ── Duplicate mobile check ────────────────────────────────────────────
//     const existingMobile = await FitnessMember.findOne({
//       mobile:         mobile.trim(),
//       organizationId: req.organizationId,
//     });
//     if (existingMobile) {
//       if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//       return res.status(409).json({ message: `A member with mobile ${mobile.trim()} already exists.` });
//     }

//     // ── Activity fees validation ──────────────────────────────────────────
//     let parsedActivityFees = [];
//     if (rawActivityFees) {
//       try {
//         parsedActivityFees = typeof rawActivityFees === 'string'
//           ? JSON.parse(rawActivityFees)
//           : rawActivityFees;
//       } catch {
//         if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Invalid activityFees format.' });
//       }
//     }

//     if (
//       (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0)
//       && !req.body.membershipPass
//     ) {
//       if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//       return res.status(400).json({ message: 'Either activity or membership pass is required.' });
//     }

//     const validatedFees = [];
//     for (let i = 0; i < parsedActivityFees.length; i++) {
//       const result = validateActivityFee(parsedActivityFees[i], i);
//       if (result.error) {
//         if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//         return res.status(400).json({ message: result.error });
//       }
//       validatedFees.push(result.data);
//     }

//     // Duplicate activity check
//     const activityIds       = validatedFees.map((af) => af.activity?.toString()).filter(Boolean);
//     const uniqueActivityIds = new Set(activityIds);
//     if (uniqueActivityIds.size !== activityIds.length) {
//       if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//       return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//     }

//     // ── Build member document ─────────────────────────────────────────────
//     const memberData = {
//       name:             name.trim(),
//       mobile:           mobile.trim(),
//       email:            email?.trim()   || undefined,
//       age:              age             ? Number(age) : undefined,
//       gender:           gender          || 'Male',
//       address:          address?.trim() || undefined,
//       userId:           userId?.trim()  || mobile.trim(),
//       password:         password.trim(),
//       enquiryId:        enquiryId       || null,
//       membershipPass:   req.body.membershipPass || null,
//       activityFees:     validatedFees,
//       membershipStatus: req.body.membershipPass
//         ? 'Active'
//         : computeOverallMembershipStatus(validatedFees),
//       numberOfPersons:  req.body.numberOfPersons || 1,
//       organizationId:   req.organizationId,
//     };

//     // ── Photo path uses the new folder structure ──────────────────────────
//     if (req.file) {
//       memberData.photo = `/uploads/fitness/members/${req.file.filename}`;
//     }

//     const member = new FitnessMember(memberData);
//     await member.save();

//     if (enquiryId) {
//       await FitnessEnquiry.findByIdAndUpdate(enquiryId, { status: 'Admitted' });
//     }

//     try {
//       await syncFeesToTables(member, req.organizationId, []);
//     } catch (syncErr) {
//       console.error('Fee sync error (non-fatal):', syncErr.message);
//     }

//     try {
//       if (!req.body.membershipPass) {
//         await createRecurringSlotBookings(member, validatedFees);
//       }
//     } catch (bookingErr) {
//       console.error('Slot booking error (non-fatal):', bookingErr.message);
//     }

//     const created = await FitnessMember.findById(member._id)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description')
//       .populate('activityFees.staff',    'fullName name')
//       .select('-password');

//     res.status(201).json({
//       ...applyComputedStatuses(created.toObject()),
//       message: 'Member added successfully.',
//     });
//   } catch (err) {
//     if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//     console.error('createMember error:', err);

//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//     }
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({
//         message: Object.values(err.errors).map((e) => e.message).join(' '),
//       });
//     }
//     if (err.name === 'CastError') {
//       return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//     }
//     res.status(500).json({ message: 'Server error while creating member.' });
//   }
// };

// // ─── RENEW MEMBERSHIP ─────────────────────────────────────────────────────────
// exports.renewMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOne({
//       _id:            req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     const { renewals } = req.body;

//     if (!Array.isArray(renewals) || renewals.length === 0) {
//       return res.status(400).json({ message: 'At least one renewal entry is required.' });
//     }

//     const validatedRenewals = [];

//     for (let i = 0; i < renewals.length; i++) {
//       const r      = renewals[i];
//       const prefix = `Renewal ${i + 1}`;

//       if (!r.activityId && !r.feeTypeId) {
//         return res.status(400).json({ message: `${prefix}: activity or membership pass is required.` });
//       }
//       if (r.activityId && !isValidObjectId(r.activityId)) {
//         return res.status(400).json({ message: `${prefix}: invalid activity ID.` });
//       }
//       if (r.feeTypeId && !isValidObjectId(r.feeTypeId)) {
//         return res.status(400).json({ message: `${prefix}: invalid membership pass ID.` });
//       }

//       const start = new Date(r.startDate);
//       const end   = new Date(r.endDate);

//       if (!r.startDate || isNaN(start.getTime())) {
//         return res.status(400).json({ message: `${prefix}: valid start date is required.` });
//       }
//       if (!r.endDate || isNaN(end.getTime())) {
//         return res.status(400).json({ message: `${prefix}: valid end date is required.` });
//       }
//       if (end < start) {
//         return res.status(400).json({ message: `${prefix}: end date cannot be before start date.` });
//       }

//       const planFee  = Number(r.planFee)  || 0;
//       const discount = Number(r.discount) || 0;

//       if (discount > planFee && planFee > 0) {
//         return res.status(400).json({ message: `${prefix}: discount cannot exceed plan fee.` });
//       }

//       const membershipStatus = computeActivityMembershipStatus({
//         paymentStatus: r.paymentStatus || 'Pending',
//         startDate:     start,
//         endDate:       end,
//       });

//       validatedRenewals.push({
//         activity:       r.activityId || null,
//         feeType:        r.feeTypeId  || null,
//         plan:           r.plan       || 'Monthly',
//         planFee,
//         discount,
//         finalAmount:    planFee > 0 ? Math.max(0, planFee - discount) : 0,
//         paymentStatus:  r.paymentStatus || 'Pending',
//         paymentMode:    r.paymentMode   || '',
//         paymentDate:    r.paymentDate   ? new Date(r.paymentDate) : null,
//         planNotes:      r.planNotes     || '',
//         startDate:      start,
//         endDate:        end,
//         membershipStatus,
//         staff:          r.staffId || null,
//         slot:           null,
//         _renewedFromId: r.activityFeeId || null,
//       });
//     }

//     const newStartIndex = member.activityFees.length;
//     member.activityFees.push(...validatedRenewals);
//     member.membershipStatus = computeOverallMembershipStatus(member.activityFees);

//     await member.save();

//     try {
//       const newFeesOnly = {
//         _id:          member._id,
//         activityFees: member.activityFees.slice(newStartIndex),
//       };
//       await syncFeesToTables(newFeesOnly, req.organizationId, []);
//     } catch (syncErr) {
//       console.error('Fee sync error during renewal:', syncErr.message);
//     }

//     try {
//       const activityRenewals = validatedRenewals
//         .map((rv, i) => ({ ...rv, activity: rv.activity, activityFeeIndex: newStartIndex + i }))
//         .filter((r) => r.activity);

//       if (activityRenewals.length > 0) {
//         await createRecurringSlotBookings(member, activityRenewals);
//       }
//     } catch (bookingErr) {
//       console.error('Slot booking error during renewal:', bookingErr.message);
//     }

//     const updated = await FitnessMember.findById(member._id)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description annual halfYearly quaterly monthly weekly daily hourly')
//       .populate('activityFees.staff',    'fullName name')
//       .select('-password');

//     res.json({
//       ...applyComputedStatuses(updated.toObject()),
//       message: `${validatedRenewals.length} membership${validatedRenewals.length > 1 ? 's' : ''} renewed successfully.`,
//     });
//   } catch (err) {
//     console.error('renewMember error:', err);
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({
//         message: Object.values(err.errors).map((e) => e.message).join(' '),
//       });
//     }
//     res.status(500).json({ message: 'Server error while renewing membership.' });
//   }
// };

// // ─── UPDATE ───────────────────────────────────────────────────────────────────
// // Note: upload middleware (upload.fitnessMember) runs in the route before this
// // handler. req.file is already populated when we reach here.
// exports.updateMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOne({
//       _id:            req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) {
//       if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//       return res.status(404).json({ message: 'Member not found.' });
//     }

//     const {
//       name, mobile, email, age, gender, address,
//       userId, password,
//       activityFees: rawActivityFees,
//     } = req.body;

//     // ── Basic field validation ────────────────────────────────────────────
//     const fieldErrors = [];

//     if (name !== undefined && !name.trim()) fieldErrors.push('Full name cannot be empty.');
//     if (mobile !== undefined) {
//       if (!mobile.trim()) {
//         fieldErrors.push('Mobile number cannot be empty.');
//       } else if (!/^\d{10}$/.test(mobile.trim())) {
//         fieldErrors.push('Mobile must be a valid 10-digit number.');
//       }
//     }
//     if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//       fieldErrors.push('Please provide a valid email address.');
//     }
//     if (age !== undefined && age !== '') {
//       const ageNum = Number(age);
//       if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
//         fieldErrors.push('Age must be between 1 and 120.');
//       }
//     }
//     if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
//       fieldErrors.push('Invalid gender value.');
//     }

//     if (fieldErrors.length) {
//       if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//       return res.status(400).json({ message: fieldErrors.join(' ') });
//     }

//     // ── Duplicate mobile check (excluding self) ───────────────────────────
//     if (mobile && mobile.trim() !== member.mobile) {
//       const dup = await FitnessMember.findOne({
//         mobile:         mobile.trim(),
//         organizationId: req.organizationId,
//         _id:            { $ne: member._id },
//       });
//       if (dup) {
//         if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//         return res.status(409).json({ message: `Another member with mobile ${mobile.trim()} already exists.` });
//       }
//     }

//     // ── Activity fees validation ──────────────────────────────────────────
//     const previousAllotmentIds = member.activityFees
//       .map((af) => af.allotmentId?.toString())
//       .filter(Boolean);

//     let validatedFees = member.activityFees; // default: keep existing

//     if (rawActivityFees !== undefined) {
//       let parsedActivityFees = [];
//       try {
//         parsedActivityFees = typeof rawActivityFees === 'string'
//           ? JSON.parse(rawActivityFees)
//           : rawActivityFees;
//       } catch {
//         if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Invalid activityFees format.' });
//       }

//       if (
//         (!Array.isArray(parsedActivityFees) || parsedActivityFees.length === 0)
//         && !req.body.membershipPass
//       ) {
//         if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Either activity or membership pass is required.' });
//       }

//       const tempValidated = [];
//       for (let i = 0; i < parsedActivityFees.length; i++) {
//         const existing = member.activityFees.find(
//           (af) => af._id?.toString() === parsedActivityFees[i]._id?.toString()
//         );
//         const dateUnchanged = existing &&
//           new Date(existing.startDate).toISOString().split('T')[0] === parsedActivityFees[i].startDate;

//         if (dateUnchanged) {
//           const af    = parsedActivityFees[i];
//           const start = new Date(af.startDate);
//           const end   = new Date(af.endDate);

//           if (!af.activity || !isValidObjectId(af.activity)) {
//             if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//             return res.status(400).json({ message: `Activity ${i + 1}: a valid activity ID is required.` });
//           }

//           // ── feeType is mandatory (same as create) ──────────────────────
//           if (!af.feeType) {
//             if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//             return res.status(400).json({ message: `Activity ${i + 1}: fee type is required.` });
//           }
//           if (!isValidObjectId(af.feeType)) {
//             if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//             return res.status(400).json({ message: `Activity ${i + 1}: invalid fee type ID.` });
//           }
//           // ──────────────────────────────────────────────────────────────

//           if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
//             if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//             return res.status(400).json({ message: `Activity ${i + 1}: invalid date range.` });
//           }

//           const membershipStatus = computeActivityMembershipStatus({
//             paymentStatus: af.paymentStatus || 'Pending',
//             startDate:     start,
//             endDate:       end,
//           });

//           tempValidated.push({
//             _id:             existing._id,
//             allotmentId:     existing.allotmentId || null,
//             activity:        af.activity,
//             feeType:         af.feeType   || null,
//             plan:            af.plan      || 'Monthly',
//             planFee:         Number(af.planFee)    || 0,
//             discount:        Number(af.discount)   || 0,
//             finalAmount:     Math.max(0, Number(af.planFee) - Number(af.discount)),
//             paymentStatus:   af.paymentStatus || 'Pending',
//             paymentMode:     af.paymentMode   || '',
//             paymentDate:     af.paymentDate   ? new Date(af.paymentDate) : null,
//             planNotes:       af.planNotes     || '',
//             startDate:       start,
//             endDate:         end,
//             membershipStatus,
//             staff:           af.staff || null,
//             slot:            af.slot  || existing.slot || null,
//           });
//         } else {
//           const result = validateActivityFee(parsedActivityFees[i], i);
//           if (result.error) {
//             if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//             return res.status(400).json({ message: result.error });
//           }
//           tempValidated.push({
//             ...result.data,
//             _id:         existing?._id         || undefined,
//             allotmentId: existing?.allotmentId || null,
//             slot:        parsedActivityFees[i].slot || null,
//           });
//         }
//       }

//       // Duplicate activity check
//       const activityIds       = tempValidated.map((af) => af.activity?.toString()).filter(Boolean);
//       const uniqueActivityIds = new Set(activityIds);
//       if (uniqueActivityIds.size !== activityIds.length) {
//         if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//         return res.status(400).json({ message: 'Duplicate activities are not allowed for the same member.' });
//       }

//       validatedFees        = tempValidated;
//       member.activityFees  = validatedFees;
//     }

//     // ── Apply scalar field updates ────────────────────────────────────────
//     if (name     !== undefined) member.name     = name.trim();
//     if (mobile   !== undefined) member.mobile   = mobile.trim();
//     if (email    !== undefined) member.email    = email.trim() || undefined;
//     if (age      !== undefined && age !== '') member.age = Number(age);
//     if (gender   !== undefined) member.gender   = gender;
//     if (address  !== undefined) member.address  = address?.trim();
//     if (userId   !== undefined) member.userId   = userId?.trim();
//     if (password !== undefined && password.trim()) member.password = password.trim();

//     member.membershipStatus = computeOverallMembershipStatus(
//       Array.isArray(validatedFees) ? validatedFees : []
//     );

//     // ── Photo: delete old, store new path ─────────────────────────────────
//     if (req.file) {
//       if (member.photo) deleteOldPhoto(member.photo);
//       member.photo = `/uploads/fitness/members/${req.file.filename}`;
//     }

//     await member.save();

//     try {
//       await syncFeesToTables(member, req.organizationId, previousAllotmentIds);
//     } catch (syncErr) {
//       console.error('Fee sync error (non-fatal):', syncErr.message);
//     }

//     try {
//       await createRecurringSlotBookings(member, validatedFees);
//     } catch (bookingErr) {
//       console.error('Slot booking error during update (non-fatal):', bookingErr.message);
//     }

//     const updated = await FitnessMember.findById(member._id)
//       .populate('activityFees.activity', 'name activityName')
//       .populate('activityFees.feeType',  'description')
//       .populate('activityFees.staff',    'fullName name')
//       .select('-password');

//     res.json({
//       ...applyComputedStatuses(updated.toObject()),
//       message: 'Member updated successfully.',
//     });
//   } catch (err) {
//     if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
//     console.error('updateMember error:', err);

//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A member with this mobile number already exists.' });
//     }
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({
//         message: Object.values(err.errors).map((e) => e.message).join(' '),
//       });
//     }
//     if (err.name === 'CastError') {
//       return res.status(400).json({ message: `Invalid value for field: ${err.path}.` });
//     }
//     res.status(500).json({ message: 'Server error while updating member.' });
//   }
// };

// // ─── DELETE ───────────────────────────────────────────────────────────────────
// exports.deleteMember = async (req, res) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid member ID.' });
//     }

//     const member = await FitnessMember.findOneAndDelete({
//       _id:            req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!member) return res.status(404).json({ message: 'Member not found.' });

//     if (member.photo) deleteOldPhoto(member.photo);

//     const allotmentIds = member.activityFees.map((af) => af.allotmentId).filter(Boolean);
//     if (allotmentIds.length) {
//       await FeeAllotment.deleteMany({ _id: { $in: allotmentIds }, organizationId: req.organizationId });
//       await FeePayment.deleteMany({ allotmentId: { $in: allotmentIds }, organizationId: req.organizationId });
//     }

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
const QRCode = require('qrcode');

const FitnessMember    = require('../models/FitnessMember');
const FitnessEnquiry   = require('../models/FitnessEnquiry');
const FeeAllotment     = require('../models/FitnessFeeAllotment');
const FeePayment       = require('../models/FitnessFeePayment');
const FitnessBooking   = require('../models/FitnessBooking');

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const AccessRole = require('../models/AccessRole');

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

  // ── feeType is mandatory ──────────────────────────────────────────────────
  if (!af.feeType) {
    return { error: `${prefix}: fee type is required.` };
  }

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
  const finalAmount = Math.max(0, planFee - discount);

  if (planFee < 0)  return { error: `${prefix}: plan fee cannot be negative.` };
  if (discount < 0) return { error: `${prefix}: discount cannot be negative.` };
  if (discount > planFee && planFee > 0) {
    return { error: `${prefix}: discount (₹${discount}) cannot exceed plan fee (₹${planFee}).` };
  }
  if (finalAmount < 0) {
    return { error: `${prefix}: final amount cannot be negative.` };
  }

  const validPlans    = ['Annual','halfYearly','quarterly', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
  const validModes    = ['Cash', 'Bank Transfer', ''];
  const validStatuses = ['Paid', 'Pending'];
  if (af.paymentStatus === 'Paid' && !af.feeType && !af.activity) {
    return { error: `${prefix}: Cannot mark as Paid without feeType or activity.` };
  }

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
      finalAmount,
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

    // if (!af.feeType) continue;
    if (!af.feeType && !af.activity) continue;

    const planMap = { Annual: 'Annual', Halfyearly: 'halfYearly',Quarterly: 'quarterly', Monthly: 'Monthly', Weekly: 'Weekly', Daily: 'Daily', Hourly: 'Hourly' };
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

    if (af.paymentStatus === 'Paid') {
  if (!allotment) {
    throw new Error(`CRITICAL: Paid fee without allotment for member ${member._id}`);
  }

  if ((af.finalAmount || af.planFee) > 0) {
    await FeePayment.findOneAndUpdate(
      { allotmentId: allotment._id, organizationId: orgId },
      {
        memberId: member._id,
        allotmentId: allotment._id,
        amount: af.finalAmount || af.planFee,
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
} {
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
    const { search, status, activity, plan } = req.query;
    const query = { organizationId: req.organizationId };

    if (status)   query.membershipStatus = status;
    if (plan)     query['activityFees.plan'] = plan;
    if (activity) query['activityFees.activity'] = activity;

    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { mobile:   { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    const members = await FitnessMember.find(query)
      .populate('activityFees.activity', 'name activityName')
      .populate('activityFees.feeType',  'description')
      .populate('activityFees.staff',    'fullName name')
      .sort({ createdAt: -1 })
      .select('-password');

    const result = members.map((m) => applyComputedStatuses(m.toObject()));

    res.json(result);
  } catch (err) {
    console.error('getAllMembers error:', err);
    res.status(500).json({ message: 'Server error while fetching members.' });
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
      .populate('activityFees.feeType',  'description annual halfYearly quarterly monthly weekly daily hourly')
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
    const qrData = JSON.stringify({
      memberId: member.memberId,
      organizationId: member.organizationId
    });

    const qrImage = await QRCode.toDataURL(qrData);

    member.qrCode = qrImage;
    await member.save();

    // ================= CREATE USER FOR MEMBER =================
try {
  const existingUser = await User.findOne({
    linkedId: member._id,
    organizationId: req.organizationId
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // 🔥 Fetch default Participant role
    const accessRole = await AccessRole.findOne({
      roleKey: 'PARTICIPANT',
      organizationId: 'fitness'
    }).lean();

    const generatedUserId = member.userId || mobile.trim();

    await User.create({
      userId: generatedUserId,
      password: hashedPassword,
      fullName: member.name,
      mobile: member.mobile,
      email: member.email || "",
      role: "Participant",
      userType: "member",
      organizationId: req.organizationId,
      linkedId: member._id,
      accessRoleId: accessRole?._id || null,
      isActive: "Yes",
    });
  }
} catch (userErr) {
  console.error('User creation failed (non-fatal):', userErr.message);
}

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
      .populate('activityFees.feeType',  'description annual halfYearly quaterly monthly weekly daily hourly')
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

          // ── feeType is mandatory (same as create) ──────────────────────
          if (!af.feeType) {
            if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
            return res.status(400).json({ message: `Activity ${i + 1}: fee type is required.` });
          }
          if (!isValidObjectId(af.feeType)) {
            if (req.file) deleteOldPhoto(`/uploads/fitness/members/${req.file.filename}`);
            return res.status(400).json({ message: `Activity ${i + 1}: invalid fee type ID.` });
          }
          // ──────────────────────────────────────────────────────────────

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

    // ================= SYNC USER PASSWORD =================
    // ================= SYNC USER =================
try {
  const updateFields = {};

  // 🔐 Password sync
  if (password !== undefined && password.trim()) {
    updateFields.password = await bcrypt.hash(password.trim(), 10);
  }

  // 📱 Mobile sync (CRITICAL)
  if (mobile !== undefined && mobile.trim()) {
    updateFields.mobile = mobile.trim();
    updateFields.userId = mobile.trim(); // mobile = login ID
  }

  // 👤 Name sync (keep consistent)
  if (name !== undefined && name.trim()) {
    updateFields.fullName = name.trim();
  }

  // 📧 Email sync (optional but correct)
  if (email !== undefined) {
    updateFields.email = email?.trim() || "";
  }

  if (Object.keys(updateFields).length > 0) {
    await User.findOneAndUpdate(
      {
        linkedId: member._id,
        organizationId: req.organizationId
      },
      updateFields
    );
  }

} catch (userErr) {
  console.error('User sync failed (non-fatal):', userErr.message);
}

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

    // ================= DELETE LINKED USER =================
try {
  await User.deleteOne({
    linkedId: member._id,
    organizationId: req.organizationId,
    userType: "member"
  });
} catch (userErr) {
  console.error('User deletion failed (non-fatal):', userErr.message);
}

    res.json({ message: 'Member deleted successfully.' });
  } catch (err) {
    console.error('deleteMember error:', err);
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid member ID.' });
    res.status(500).json({ message: 'Server error while deleting member.' });
  }
};