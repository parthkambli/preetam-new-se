// const FeeType = require('../models/FeeType');
// const FeeAllotment = require('../models/FeeAllotment');
// const FeePayment = require('../models/FeePayment');
// const Student = require('../models/Student');

// // ─────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────

// /** Fee Type Categories - Exact match with Frontend (Fitness) */
// const VALID_FEE_TYPES = ['Visitor', 'Residency', 'Membership Pass'];

// /** Fee Plans - Used in Allotments */
// const VALID_FEE_PLANS = ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
// const VALID_PAYMENT_MODES = ['Cash', 'Cheque', 'Online', 'UPI'];

// /** Helper to check Mongoose CastError for invalid ObjectId */
// const isBadId = (err) => err.name === 'CastError' && err.kind === 'ObjectId';


// // ─────────────────────────────────────────────
// // FEE TYPES (Fully updated for Fitness Frontend)
// // ─────────────────────────────────────────────

// exports.getFitnessFeeTypes = async (req, res) => {
//   try {
//     const types = await FeeType.find({ organizationId: req.organizationId });
//     res.json(types);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch fee types. Please try again.' });
//   }
// };

// exports.createFitnessFeeType = async (req, res) => {
//   try {
//     const { description, type, annual, monthly, weekly, daily, hourly } = req.body;

//     // Required field validation
//     if (!description || !description.trim()) {
//       return res.status(400).json({ message: 'Description is required.' });
//     }

//     // Valid fee category (matches frontend exactly)
//     if (type && !VALID_FEE_TYPES.includes(type)) {
//       return res.status(400).json({
//         message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
//       });
//     }

//     // No negative amounts
//     const amounts = { annual, monthly, weekly, daily, hourly };
//     for (const [key, val] of Object.entries(amounts)) {
//       if (val !== undefined && val !== '' && Number(val) < 0) {
//         return res.status(400).json({ message: `${key} amount cannot be negative.` });
//       }
//     }

//     // Duplicate description check within organization
//     const exists = await FeeType.findOne({
//       organizationId: req.organizationId,
//       description: { $regex: new RegExp(`^${description.trim()}$`, 'i') },
//     });
//     if (exists) {
//       return res.status(409).json({
//         message: `A fee type with the description "${description.trim()}" already exists.`,
//       });
//     }

//     const feeType = new FeeType({
//       ...req.body,
//       description: description.trim(),
//       organizationId: req.organizationId,
//     });

//     await feeType.save();
//     res.status(201).json(feeType);
//   } catch (err) {
//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A fee type with this description already exists.' });
//     }
//     res.status(500).json({ message: 'Failed to create fee type. Please try again.' });
//   }
// };

// exports.updateFitnessFeeType = async (req, res) => {
//   try {
//     const { description, type, annual, monthly, weekly, daily, hourly } = req.body;

//     // Check if fee type exists and belongs to organization
//     const feeType = await FeeType.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });
//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     // Valid category
//     if (type && !VALID_FEE_TYPES.includes(type)) {
//       return res.status(400).json({
//         message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
//       });
//     }

//     // No negative amounts
//     const amounts = { annual, monthly, weekly, daily, hourly };
//     for (const [key, val] of Object.entries(amounts)) {
//       if (val !== undefined && val !== '' && Number(val) < 0) {
//         return res.status(400).json({ message: `${key} amount cannot be negative.` });
//       }
//     }

//     // Duplicate description check (exclude current record)
//     if (description && description.trim() !== feeType.description) {
//       const duplicate = await FeeType.findOne({
//         organizationId: req.organizationId,
//         description: { $regex: new RegExp(`^${description.trim()}$`, 'i') },
//         _id: { $ne: req.params.id },
//       });
//       if (duplicate) {
//         return res.status(409).json({
//           message: `Another fee type with the description "${description.trim()}" already exists.`,
//         });
//       }
//     }

//     const updated = await FeeType.findOneAndUpdate(
//       { _id: req.params.id, organizationId: req.organizationId },
//       { 
//         ...req.body, 
//         ...(description && { description: description.trim() }) 
//       },
//       { new: true, runValidators: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid fee type ID.' });
//     }
//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A fee type with this description already exists.' });
//     }
//     res.status(500).json({ message: 'Failed to update fee type. Please try again.' });
//   }
// };

// exports.deleteFitnessFeeType = async (req, res) => {
//   try {
//     const feeType = await FeeType.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });
//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     // Prevent deletion if allotments exist
//     const linkedCount = await FeeAllotment.countDocuments({
//       feeTypeId: req.params.id,
//       organizationId: req.organizationId,
//     });
//     if (linkedCount > 0) {
//       return res.status(409).json({
//         message: `Cannot delete this fee type — it is assigned to ${linkedCount} participant(s). Remove those allotments first.`,
//       });
//     }

//     await FeeType.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
//     res.json({ message: 'Fee type deleted successfully.' });
//   } catch (err) {
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid fee type ID.' });
//     }
//     res.status(500).json({ message: 'Failed to delete fee type. Please try again.' });
//   }
// };


// // ─────────────────────────────────────────────
// // FEE ALLOTMENTS
// // ─────────────────────────────────────────────

// exports.getFitnessAllotments = async (req, res) => {
//   try {
//     const allotments = await FeeAllotment.find({ organizationId: req.organizationId })
//       .populate('studentId', 'fullName studentId')
//       .populate('feeTypeId');
//     res.json(allotments);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch allotments. Please try again.' });
//   }
// };

// exports.allotFitnessFee = async (req, res) => {
//   try {
//     const { studentId, feeTypeId, amount, feePlan, dueDate, paymentMode } = req.body;

//     if (!studentId) {
//       return res.status(400).json({ message: 'Participant (studentId) is required.' });
//     }
//     if (!feeTypeId) {
//       return res.status(400).json({ message: 'Fee item is required.' });
//     }
//     if (amount === undefined || amount === '') {
//       return res.status(400).json({ message: 'Amount is required.' });
//     }

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Amount must be a positive number.' });
//     }

//     // Validate Student
//     const student = await Student.findOne({
//       _id: studentId,
//       organizationId: req.organizationId,
//     });
//     if (!student) {
//       return res.status(404).json({
//         message: `Student with ID ${studentId} not found in this organization.`,
//       });
//     }

//     // Validate Fee Type
//     const feeType = await FeeType.findOne({
//       _id: feeTypeId,
//       organizationId: req.organizationId,
//     });
//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     // Duplicate allotment check
//     const duplicate = await FeeAllotment.findOne({
//       organizationId: req.organizationId,
//       studentId,
//       feeTypeId,
//     });
//     if (duplicate) {
//       return res.status(409).json({
//         message: `"${feeType.description}" is already allotted to ${student.fullName}.`,
//       });
//     }

//     const allotment = new FeeAllotment({
//       studentId,
//       feeTypeId,
//       amount: numAmount,
//       feePlan: feePlan || 'Annual',
//       paymentMode: paymentMode || 'Cash',
//       dueDate: dueDate || null,
//       organizationId: req.organizationId,
//       status: 'Pending',
//     });

//     const savedAllotment = await allotment.save();

//     const populated = await FeeAllotment.findById(savedAllotment._id)
//       .populate('studentId', 'fullName studentId')
//       .populate('feeTypeId');

//     res.status(201).json(populated);
//   } catch (err) {
//     console.error("Allot Fee Error:", err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid studentId or feeTypeId format.' });
//     }
//     res.status(500).json({ message: 'Failed to allot fee.', error: err.message });
//   }
// };

// exports.updateFitnessAllotment = async (req, res) => {
//   try {
//     const { amount, feePlan, dueDate } = req.body;

//     const allotment = await FeeAllotment.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });
//     if (!allotment) {
//       return res.status(404).json({ message: 'Allotment record not found.' });
//     }

//     // Amount validation
//     if (amount !== undefined && amount !== '') {
//       const numAmount = Number(amount);
//       if (isNaN(numAmount) || numAmount <= 0) {
//         return res.status(400).json({ message: 'Amount must be a positive number.' });
//       }

//       const totalPaid = await FeePayment.aggregate([
//         { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
//         { $group: { _id: null, total: { $sum: '$amount' } } },
//       ]);
//       const paidSoFar = totalPaid[0]?.total || 0;

//       if (numAmount < paidSoFar) {
//         return res.status(400).json({
//           message: `Cannot set amount to ₹${numAmount.toLocaleString('en-IN')} — ₹${paidSoFar.toLocaleString('en-IN')} has already been collected against this allotment.`,
//         });
//       }
//     }

//     // Valid fee plan
//     if (feePlan && !VALID_FEE_PLANS.includes(feePlan)) {
//       return res.status(400).json({
//         message: `Invalid fee plan "${feePlan}". Must be one of: ${VALID_FEE_PLANS.join(', ')}.`,
//       });
//     }

//     // Due date validation
//     if (dueDate) {
//       const due = new Date(dueDate);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (isNaN(due.getTime())) {
//         return res.status(400).json({ message: 'Invalid due date.' });
//       }
//       if (due < today) {
//         return res.status(400).json({ message: 'Due date cannot be in the past.' });
//       }
//     }

//     const updated = await FeeAllotment.findOneAndUpdate(
//       { _id: req.params.id, organizationId: req.organizationId },
//       req.body,
//       { new: true, runValidators: true }
//     ).populate([
//       { path: 'studentId', select: 'fullName studentId' },
//       { path: 'feeTypeId' },
//     ]);

//     res.json(updated);
//   } catch (err) {
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid allotment ID.' });
//     }
//     res.status(500).json({ message: 'Failed to update allotment. Please try again.' });
//   }
// };


// // ─────────────────────────────────────────────
// // FEE PAYMENTS
// // ─────────────────────────────────────────────

// exports.getFitnessPayments = async (req, res) => {
//   try {
//     const payments = await FeePayment.find({ organizationId: req.organizationId })
//       .populate('studentId', 'fullName studentId')
//       .sort({ paymentDate: -1 });
//     res.json(payments);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch payments. Please try again.' });
//   }
// };

// exports.addFitnessPayment = async (req, res) => {
//   try {
//     const { studentId, allotmentId, amount, paymentMode, paymentDate } = req.body;

//     if (!studentId) {
//       return res.status(400).json({ message: 'Participant is required.' });
//     }
//     if (!allotmentId) {
//       return res.status(400).json({ message: 'Fee allotment is required.' });
//     }
//     if (amount === undefined || amount === '') {
//       return res.status(400).json({ message: 'Amount is required.' });
//     }
//     if (!paymentDate) {
//       return res.status(400).json({ message: 'Payment date is required.' });
//     }

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Payment amount must be a positive number.' });
//     }

//     const pDate = new Date(paymentDate);
//     if (isNaN(pDate.getTime())) {
//       return res.status(400).json({ message: 'Invalid payment date.' });
//     }

//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//     if (pDate >= tomorrow) {
//       return res.status(400).json({ message: 'Payment date cannot be in the future.' });
//     }

//     if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
//       return res.status(400).json({
//         message: `Invalid payment mode "${paymentMode}". Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.`,
//       });
//     }

//     const student = await Student.findOne({
//       _id: studentId,
//       organizationId: req.organizationId,
//     });
//     if (!student) {
//       return res.status(404).json({ message: 'Participant not found.' });
//     }

//     const allotment = await FeeAllotment.findOne({
//       _id: allotmentId,
//       organizationId: req.organizationId,
//     });
//     if (!allotment) {
//       return res.status(404).json({ message: 'Fee allotment not found.' });
//     }
//     if (allotment.studentId.toString() !== studentId.toString()) {
//       return res.status(400).json({ message: 'This fee allotment does not belong to the selected participant.' });
//     }

//     const totalPaidResult = await FeePayment.aggregate([
//       { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]);
//     const alreadyPaid = totalPaidResult[0]?.total || 0;
//     const totalFee = allotment.amount;
//     const remaining = totalFee - alreadyPaid;

//     if (remaining <= 0) {
//       return res.status(409).json({
//         message: `This fee (₹${totalFee.toLocaleString('en-IN')}) is already fully paid.`,
//       });
//     }

//     if (numAmount > remaining) {
//       return res.status(400).json({
//         message: `Payment of ₹${numAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')}.`,
//       });
//     }

//     const payment = new FeePayment({
//       ...req.body,
//       amount: numAmount,
//       organizationId: req.organizationId,
//     });
//     await payment.save();

//     const newPaid = alreadyPaid + numAmount;
//     if (newPaid >= totalFee) {
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//     } else {
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Partial' });
//     }

//     const populated = await payment.populate('studentId', 'fullName studentId');

//     res.status(201).json({
//       payment: populated,
//       summary: {
//         totalFee,
//         totalPaid: newPaid,
//         remaining: totalFee - newPaid,
//         status: newPaid >= totalFee ? 'Paid' : 'Partial',
//       },
//     });
//   } catch (err) {
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid participant or allotment ID.' });
//     }
//     res.status(500).json({ message: 'Failed to record payment. Please try again.' });
//   }
// };










//   // controllers/fitnessFeeController.js

// const FeeType = require('../models/FeeType');
// const FeeAllotment = require('../models/FeeAllotment');
// const FeePayment = require('../models/FeePayment');
// const FitnessMember = require('../models/FitnessMember');

// // ─────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────

// /** Fee Type Categories - Exact match with Frontend */
// const VALID_FEE_TYPES = ['Visitor', 'Residency', 'Membership Pass'];

// /** Fee Plans & Payment Modes */
// const VALID_FEE_PLANS = ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
// const VALID_PAYMENT_MODES = ['Cash', 'Cheque', 'Online', 'UPI'];

// /** Helper to check invalid ObjectId */
// const isBadId = (err) => err.name === 'CastError' && err.kind === 'ObjectId';

// /** Enhanced error logger for debugging 500 errors */
// const logError = (operation, err) => {
//   console.error(`\n=== ${operation} ERROR ===`);
//   console.error('Message:', err.message);
//   console.error('Name:', err.name);
//   console.error('Code:', err.code);
//   console.error('Stack:', err.stack?.split('\n').slice(0, 8).join('\n'));
//   console.error('Full Error Object:', JSON.stringify(err, null, 2));
// };

// // ─────────────────────────────────────────────
// // FEE TYPES
// // ─────────────────────────────────────────────

// exports.getFitnessFeeTypes = async (req, res) => {
//   try {
//     const types = await FeeType.find({ organizationId: req.organizationId })
//       .sort({ createdAt: -1 });
//     res.json(types);
//   } catch (err) {
//     logError('getFitnessFeeTypes', err);
//     res.status(500).json({ message: 'Failed to fetch fee types. Please try again.' });
//   }
// };

// exports.createFitnessFeeType = async (req, res) => {
//   try {
//     const { description, type, annual, monthly, weekly, daily, hourly } = req.body;

//     // Required field validation
//     if (!description || !description.trim()) {
//       return res.status(400).json({ message: 'Description is required.' });
//     }

//     // Validate category
//     if (type && !VALID_FEE_TYPES.includes(type)) {
//       return res.status(400).json({
//         message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
//       });
//     }

//     // No negative amounts
//     const amounts = { annual, monthly, weekly, daily, hourly };
//     for (const [key, val] of Object.entries(amounts)) {
//       if (val !== undefined && val !== '' && Number(val) < 0) {
//         return res.status(400).json({ message: `${key} amount cannot be negative.` });
//       }
//     }

//     const trimmedDesc = description.trim();

//     // Check for duplicate description in the same organization
//     const exists = await FeeType.findOne({
//       organizationId: req.organizationId,
//       description: { $regex: new RegExp(`^${trimmedDesc}$`, 'i') },
//     });

//     if (exists) {
//       return res.status(409).json({
//         message: `A fee type with the description "${trimmedDesc}" already exists.`,
//       });
//     }

//     // Create new fee type
//     const feeType = new FeeType({
//       description: trimmedDesc,
//       type: type || 'Membership Pass',
//       annual: annual !== '' && annual != null ? Number(annual) : 0,
//       monthly: monthly !== '' && monthly != null ? Number(monthly) : 0,
//       weekly: weekly !== '' && weekly != null ? Number(weekly) : 0,
//       daily: daily !== '' && daily != null ? Number(daily) : 0,
//       hourly: hourly !== '' && hourly != null ? Number(hourly) : 0,
//       organizationId: req.organizationId,
//     });

//     await feeType.save();

//     res.status(201).json(feeType);
//   } catch (err) {
//     logError('createFitnessFeeType', err);

//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A fee type with this description already exists.' });
//     }
//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ message: messages.join(', ') });
//     }

//     res.status(500).json({ message: 'Failed to create fee type. Please try again.' });
//   }
// };

// exports.updateFitnessFeeType = async (req, res) => {
//   try {
//     const { description, type, annual, monthly, weekly, daily, hourly } = req.body;

//     // Check if fee type exists
//     const feeType = await FeeType.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     // Validate category
//     if (type && !VALID_FEE_TYPES.includes(type)) {
//       return res.status(400).json({
//         message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
//       });
//     }

//     // No negative amounts
//     const amounts = { annual, monthly, weekly, daily, hourly };
//     for (const [key, val] of Object.entries(amounts)) {
//       if (val !== undefined && val !== '' && Number(val) < 0) {
//         return res.status(400).json({ message: `${key} amount cannot be negative.` });
//       }
//     }

//     const trimmedDesc = description ? description.trim() : feeType.description;

//     // Duplicate description check (exclude current record)
//     if (description && trimmedDesc.toLowerCase() !== feeType.description.toLowerCase()) {
//       const duplicate = await FeeType.findOne({
//         organizationId: req.organizationId,
//         description: { $regex: new RegExp(`^${trimmedDesc}$`, 'i') },
//         _id: { $ne: req.params.id },
//       });

//       if (duplicate) {
//         return res.status(409).json({
//           message: `Another fee type with the description "${trimmedDesc}" already exists.`,
//         });
//       }
//     }

//     // Update
//     const updated = await FeeType.findOneAndUpdate(
//       { _id: req.params.id, organizationId: req.organizationId },
//       {
//         description: trimmedDesc,
//         type: type || feeType.type,
//         annual: annual !== undefined ? Number(annual) || 0 : feeType.annual,
//         monthly: monthly !== undefined ? Number(monthly) || 0 : feeType.monthly,
//         weekly: weekly !== undefined ? Number(weekly) || 0 : feeType.weekly,
//         daily: daily !== undefined ? Number(daily) || 0 : feeType.daily,
//         hourly: hourly !== undefined ? Number(hourly) || 0 : feeType.hourly,
//       },
//       { new: true, runValidators: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     logError('updateFitnessFeeType', err);

//     if (isBadId(err)) return res.status(400).json({ message: 'Invalid fee type ID.' });
//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A fee type with this description already exists.' });
//     }
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({ message: 'Validation error in update.' });
//     }

//     res.status(500).json({ message: 'Failed to update fee type. Please try again.' });
//   }
// };

// exports.deleteFitnessFeeType = async (req, res) => {
//   try {
//     const feeType = await FeeType.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     // Prevent deletion if linked to allotments
//     const linkedCount = await FeeAllotment.countDocuments({
//       feeTypeId: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (linkedCount > 0) {
//       return res.status(409).json({
//         message: `Cannot delete this fee type — it is assigned to ${linkedCount} participant(s). Remove those allotments first.`,
//       });
//     }

//     await FeeType.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     res.json({ message: 'Fee type deleted successfully.' });
//   } catch (err) {
//     logError('deleteFitnessFeeType', err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid fee type ID.' });
//     }
//     res.status(500).json({ message: 'Failed to delete fee type. Please try again.' });
//   }
// };

// // ─────────────────────────────────────────────
// // FEE ALLOTMENTS
// // ─────────────────────────────────────────────

// exports.getFitnessAllotments = async (req, res) => {
//   try {
//     const allotments = await FeeAllotment.find({ organizationId: req.organizationId })
//       .populate('memberId', 'fullName memberId')
//       .populate('feeTypeId')
//       .sort({ createdAt: -1 });
//     res.json(allotments);
//   } catch (err) {
//     logError('getFitnessAllotments', err);
//     res.status(500).json({ message: 'Failed to fetch allotments. Please try again.' });
//   }
// };

// exports.allotFitnessFee = async (req, res) => {
//   try {
//     const { memberId, feeTypeId, amount, feePlan, dueDate, paymentMode } = req.body;

//     if (!memberId) return res.status(400).json({ message: 'Participant (memberId) is required.' });
//     if (!feeTypeId) return res.status(400).json({ message: 'Fee item is required.' });
//     if (amount === undefined || amount === '') return res.status(400).json({ message: 'Amount is required.' });

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Amount must be a positive number.' });
//     }

//     const member = await FitnessMember.findOne({ _id: memberId, organizationId: req.organizationId });
//     if (!student) {
//       return res.status(404).json({ message: `Student with ID ${memberId} not found in this organization.` });
//     }

//     const feeType = await FeeType.findOne({ _id: feeTypeId, organizationId: req.organizationId });
//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     const duplicate = await FeeAllotment.findOne({
//       organizationId: req.organizationId,
//       memberId,
//       feeTypeId,
//     });
//     if (duplicate) {
//       return res.status(409).json({
//         message: `"${feeType.description}" is already allotted to ${student.fullName}.`,
//       });
//     }

//     const allotment = new FeeAllotment({
//       memberId,
//       feeTypeId,
//       amount: numAmount,
//       feePlan: feePlan || 'Annual',
//       paymentMode: paymentMode || 'Cash',
//       dueDate: dueDate || null,
//       organizationId: req.organizationId,
//       status: 'Pending',
//     });

//     const savedAllotment = await allotment.save();

//     const populated = await FeeAllotment.findById(savedAllotment._id)
//       .populate('memberId', 'fullName memberId')
//       .populate('feeTypeId');

//     res.status(201).json(populated);
//   } catch (err) {
//     logError('allotFitnessFee', err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid memberId or feeTypeId format.' });
//     }
//     res.status(500).json({ message: 'Failed to allot fee.' });
//   }
// };

// exports.updateFitnessAllotment = async (req, res) => {
//   try {
//     const { amount, feePlan, dueDate } = req.body;

//     const allotment = await FeeAllotment.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });
//     if (!allotment) {
//       return res.status(404).json({ message: 'Allotment record not found.' });
//     }

//     if (amount !== undefined && amount !== '') {
//       const numAmount = Number(amount);
//       if (isNaN(numAmount) || numAmount <= 0) {
//         return res.status(400).json({ message: 'Amount must be a positive number.' });
//       }

//       const totalPaid = await FeePayment.aggregate([
//         { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
//         { $group: { _id: null, total: { $sum: '$amount' } } },
//       ]);
//       const paidSoFar = totalPaid[0]?.total || 0;

//       if (numAmount < paidSoFar) {
//         return res.status(400).json({
//           message: `Cannot set amount to ₹${numAmount.toLocaleString('en-IN')} — ₹${paidSoFar.toLocaleString('en-IN')} has already been collected.`,
//         });
//       }
//     }

//     if (feePlan && !VALID_FEE_PLANS.includes(feePlan)) {
//       return res.status(400).json({
//         message: `Invalid fee plan "${feePlan}". Must be one of: ${VALID_FEE_PLANS.join(', ')}.`,
//       });
//     }

//     if (dueDate) {
//       const due = new Date(dueDate);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (isNaN(due.getTime()) || due < today) {
//         return res.status(400).json({ message: 'Invalid or past due date.' });
//       }
//     }

//     const updated = await FeeAllotment.findOneAndUpdate(
//       { _id: req.params.id, organizationId: req.organizationId },
//       req.body,
//       { new: true, runValidators: true }
//     ).populate([
//       { path: 'memberId', select: 'fullName memberId' },
//       { path: 'feeTypeId' },
//     ]);

//     res.json(updated);
//   } catch (err) {
//     logError('updateFitnessAllotment', err);
//     if (isBadId(err)) return res.status(400).json({ message: 'Invalid allotment ID.' });
//     res.status(500).json({ message: 'Failed to update allotment. Please try again.' });
//   }
// };

// // ─────────────────────────────────────────────
// // FEE PAYMENTS
// // ─────────────────────────────────────────────

// exports.getFitnessPayments = async (req, res) => {
//   try {
//     const payments = await FeePayment.find({ organizationId: req.organizationId })
//       .populate('memberId', 'fullName memberId')
//       .sort({ paymentDate: -1 });
//     res.json(payments);
//   } catch (err) {
//     logError('getFitnessPayments', err);
//     res.status(500).json({ message: 'Failed to fetch payments. Please try again.' });
//   }
// };

// exports.addFitnessPayment = async (req, res) => {
//   try {
//     const { memberId, allotmentId, amount, paymentMode, paymentDate } = req.body;

//     if (!memberId) return res.status(400).json({ message: 'Participant is required.' });
//     if (!allotmentId) return res.status(400).json({ message: 'Fee allotment is required.' });
//     if (amount === undefined || amount === '') return res.status(400).json({ message: 'Amount is required.' });
//     if (!paymentDate) return res.status(400).json({ message: 'Payment date is required.' });

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Payment amount must be a positive number.' });
//     }

//     const pDate = new Date(paymentDate);
//     if (isNaN(pDate.getTime())) {
//       return res.status(400).json({ message: 'Invalid payment date.' });
//     }

//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//     if (pDate >= tomorrow) {
//       return res.status(400).json({ message: 'Payment date cannot be in the future.' });
//     }

//     if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
//       return res.status(400).json({
//         message: `Invalid payment mode "${paymentMode}". Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.`,
//       });
//     }

//     const student = await Student.findOne({ _id: memberId, organizationId: req.organizationId });
//     if (!student) return res.status(404).json({ message: 'Participant not found.' });

//     const allotment = await FeeAllotment.findOne({ _id: allotmentId, organizationId: req.organizationId });
//     if (!allotment) return res.status(404).json({ message: 'Fee allotment not found.' });
//     if (allotment.memberId.toString() !== memberId.toString()) {
//       return res.status(400).json({ message: 'This allotment does not belong to the selected participant.' });
//     }

//     const totalPaidResult = await FeePayment.aggregate([
//       { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]);
//     const alreadyPaid = totalPaidResult[0]?.total || 0;
//     const totalFee = allotment.amount;
//     const remaining = totalFee - alreadyPaid;

//     if (remaining <= 0) {
//       return res.status(409).json({ message: `This fee is already fully paid.` });
//     }
//     if (numAmount > remaining) {
//       return res.status(400).json({
//         message: `Payment exceeds remaining balance of ₹${remaining.toLocaleString('en-IN')}.`,
//       });
//     }

//     const payment = new FeePayment({
//       ...req.body,
//       amount: numAmount,
//       organizationId: req.organizationId,
//     });
//     await payment.save();

//     const newPaid = alreadyPaid + numAmount;
//     if (newPaid >= totalFee) {
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//     } else {
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Partial' });
//     }

//     const populated = await payment.populate('memberId', 'fullName memberId');

//     res.status(201).json({
//       payment: populated,
//       summary: {
//         totalFee,
//         totalPaid: newPaid,
//         remaining: totalFee - newPaid,
//         status: newPaid >= totalFee ? 'Paid' : 'Partial',
//       },
//     });
//   } catch (err) {
//     logError('addFitnessPayment', err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid participant or allotment ID.' });
//     }
//     res.status(500).json({ message: 'Failed to record payment. Please try again.' });
//   }
// };













// // controllers/fitnessFeeController.js

// const FeeType = require('../models/FitnessFeeType');
// const FeeAllotment = require('../models/FitnessFeeAllotment');
// const FeePayment = require('../models/FitnessFeePayment');
// const FitnessMember = require('../models/FitnessMember');

// // ─────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────

// /** Fee Type Categories - Exact match with Frontend (Fitness) */
// const VALID_FEE_TYPES = ['Visitor', 'Residency', 'Membership Pass'];

// /** Fee Plans & Payment Modes */
// const VALID_FEE_PLANS = ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'];
// const VALID_PAYMENT_MODES = ['Cash', 'Cheque', 'Online', 'UPI'];

// /** Helper to check Mongoose CastError for invalid ObjectId */
// const isBadId = (err) => err.name === 'CastError' && err.kind === 'ObjectId';

// /** Enhanced error logger for debugging */
// const logError = (operation, err) => {
//   console.error(`\n=== ${operation} ERROR ===`);
//   console.error('Message:', err.message);
//   console.error('Name:', err.name);
//   console.error('Code:', err.code);
//   console.error('Stack:', err.stack?.split('\n').slice(0, 8).join('\n'));
//   console.error('Full Error Object:', JSON.stringify(err, null, 2));
// };

// // ─────────────────────────────────────────────
// // FEE TYPES (No change needed - already using FeeType model)
// // ─────────────────────────────────────────────

// exports.getFitnessFeeTypes = async (req, res) => {
//   try {
//     const types = await FeeType.find({ organizationId: req.organizationId })
//       .sort({ createdAt: -1 });
//     res.json(types);
//   } catch (err) {
//     logError('getFitnessFeeTypes', err);
//     res.status(500).json({ message: 'Failed to fetch fee types. Please try again.' });
//   }
// };

// exports.createFitnessFeeType = async (req, res) => {
//   try {
//     const { description, type, annual, monthly, weekly, daily, hourly } = req.body;

//     if (!description || !description.trim()) {
//       return res.status(400).json({ message: 'Description is required.' });
//     }

//     if (type && !VALID_FEE_TYPES.includes(type)) {
//       return res.status(400).json({
//         message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
//       });
//     }

//     const amounts = { annual, monthly, weekly, daily, hourly };
//     for (const [key, val] of Object.entries(amounts)) {
//       if (val !== undefined && val !== '' && Number(val) < 0) {
//         return res.status(400).json({ message: `${key} amount cannot be negative.` });
//       }
//     }

//     const trimmedDesc = description.trim();

//     const exists = await FeeType.findOne({
//       organizationId: req.organizationId,
//       description: { $regex: new RegExp(`^${trimmedDesc}$`, 'i') },
//     });

//     if (exists) {
//       return res.status(409).json({
//         message: `A fee type with the description "${trimmedDesc}" already exists.`,
//       });
//     }

//     const feeType = new FeeType({
//       description: trimmedDesc,
//       type: type || 'Membership Pass',
//       annual: annual !== '' && annual != null ? Number(annual) : 0,
//       monthly: monthly !== '' && monthly != null ? Number(monthly) : 0,
//       weekly: weekly !== '' && weekly != null ? Number(weekly) : 0,
//       daily: daily !== '' && daily != null ? Number(daily) : 0,
//       hourly: hourly !== '' && hourly != null ? Number(hourly) : 0,
//       organizationId: req.organizationId,
//     });

//     await feeType.save();
//     res.status(201).json(feeType);
//   } catch (err) {
//     logError('createFitnessFeeType', err);

//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A fee type with this description already exists.' });
//     }
//     if (err.name === 'ValidationError') {
//       const messages = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ message: messages.join(', ') });
//     }

//     res.status(500).json({ message: 'Failed to create fee type. Please try again.' });
//   }
// };

// exports.updateFitnessFeeType = async (req, res) => {
//   try {
//     const { description, type, annual, monthly, weekly, daily, hourly } = req.body;

//     const feeType = await FeeType.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     if (type && !VALID_FEE_TYPES.includes(type)) {
//       return res.status(400).json({
//         message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
//       });
//     }

//     const amounts = { annual, monthly, weekly, daily, hourly };
//     for (const [key, val] of Object.entries(amounts)) {
//       if (val !== undefined && val !== '' && Number(val) < 0) {
//         return res.status(400).json({ message: `${key} amount cannot be negative.` });
//       }
//     }

//     const trimmedDesc = description ? description.trim() : feeType.description;

//     if (description && trimmedDesc.toLowerCase() !== feeType.description.toLowerCase()) {
//       const duplicate = await FeeType.findOne({
//         organizationId: req.organizationId,
//         description: { $regex: new RegExp(`^${trimmedDesc}$`, 'i') },
//         _id: { $ne: req.params.id },
//       });

//       if (duplicate) {
//         return res.status(409).json({
//           message: `Another fee type with the description "${trimmedDesc}" already exists.`,
//         });
//       }
//     }

//     const updated = await FeeType.findOneAndUpdate(
//       { _id: req.params.id, organizationId: req.organizationId },
//       {
//         description: trimmedDesc,
//         type: type || feeType.type,
//         annual: annual !== undefined ? Number(annual) || 0 : feeType.annual,
//         monthly: monthly !== undefined ? Number(monthly) || 0 : feeType.monthly,
//         weekly: weekly !== undefined ? Number(weekly) || 0 : feeType.weekly,
//         daily: daily !== undefined ? Number(daily) || 0 : feeType.daily,
//         hourly: hourly !== undefined ? Number(hourly) || 0 : feeType.hourly,
//       },
//       { new: true, runValidators: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     logError('updateFitnessFeeType', err);

//     if (isBadId(err)) return res.status(400).json({ message: 'Invalid fee type ID.' });
//     if (err.code === 11000) {
//       return res.status(409).json({ message: 'A fee type with this description already exists.' });
//     }
//     if (err.name === 'ValidationError') {
//       return res.status(400).json({ message: 'Validation error in update.' });
//     }

//     res.status(500).json({ message: 'Failed to update fee type. Please try again.' });
//   }
// };

// exports.deleteFitnessFeeType = async (req, res) => {
//   try {
//     const feeType = await FeeType.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     const linkedCount = await FeeAllotment.countDocuments({
//       feeTypeId: req.params.id,
//       organizationId: req.organizationId,
//     });

//     if (linkedCount > 0) {
//       return res.status(409).json({
//         message: `Cannot delete this fee type — it is assigned to ${linkedCount} participant(s). Remove those allotments first.`,
//       });
//     }

//     await FeeType.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });

//     res.json({ message: 'Fee type deleted successfully.' });
//   } catch (err) {
//     logError('deleteFitnessFeeType', err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid fee type ID.' });
//     }
//     res.status(500).json({ message: 'Failed to delete fee type. Please try again.' });
//   }
// };

// // ─────────────────────────────────────────────
// // FEE ALLOTMENTS
// // ─────────────────────────────────────────────

// exports.getFitnessAllotments = async (req, res) => {
//   try {
//     const allotments = await FeeAllotment.find({ organizationId: req.organizationId })
//       .populate('memberId', 'name memberId')   // Using 'name' from FitnessMember model
//       .populate('feeTypeId')
//       .populate({
//         path: 'responsibleStaff',
//         select: 'fullName name',
//       })
//       .sort({ createdAt: -1 });
//     res.json(allotments);
//   } catch (err) {
//     logError('getFitnessAllotments', err);
//     res.status(500).json({ message: 'Failed to fetch allotments. Please try again.' });
//   }
// };

// exports.allotFitnessFee = async (req, res) => {
//   try {
//     const { memberId, feeTypeId, amount, feePlan, dueDate, responsibleStaff, paymentMode } = req.body;

//     if (!memberId) return res.status(400).json({ message: 'Participant (memberId) is required.' });
//     if (!feeTypeId) return res.status(400).json({ message: 'Fee item is required.' });
//     if (amount === undefined || amount === '') return res.status(400).json({ message: 'Amount is required.' });

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Amount must be a positive number.' });
//     }

//     // Validate Member
//     const member = await FitnessMember.findOne({
//       _id: memberId,
//       organizationId: req.organizationId,
//     });
//     if (!member) {
//       return res.status(404).json({
//         message: `Member with ID ${memberId} not found in this organization.`,
//       });
//     }

//     // Validate Fee Type
//     const feeType = await FeeType.findOne({
//       _id: feeTypeId,
//       organizationId: req.organizationId,
//     });
//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found.' });
//     }

//     // Duplicate allotment check
//     const duplicate = await FeeAllotment.findOne({
//       organizationId: req.organizationId,
//       memberId,
//       feeTypeId,
//     });
//     if (duplicate) {
//       return res.status(409).json({
//         message: `"${feeType.description}" is already allotted to ${member.name}.`,
//       });
//     }

//     const allotment = new FeeAllotment({
//       memberId,
//       feeTypeId,
//       amount: numAmount,
//       feePlan: feePlan || 'Annual',
//       paymentMode: paymentMode || 'Cash',
//       dueDate: dueDate || null,
//       responsibleStaff: req.body.responsibleStaff || null,
//       organizationId: req.organizationId,
//       status: 'Pending',
//     });

//     const savedAllotment = await allotment.save();

//     const populated = await FeeAllotment.findById(savedAllotment._id)
//       .populate('memberId', 'name memberId')
//       .populate('feeTypeId');

//     res.status(201).json(populated);
//   } catch (err) {
//     logError('allotFitnessFee', err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid memberId or feeTypeId format.' });
//     }
//     res.status(500).json({ message: 'Failed to allot fee.' });
//   }
// };

// exports.updateFitnessAllotment = async (req, res) => {
//   try {
//     const { amount, feePlan, dueDate } = req.body;

//     const allotment = await FeeAllotment.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId,
//     });
//     if (!allotment) {
//       return res.status(404).json({ message: 'Allotment record not found.' });
//     }

//     if (amount !== undefined && amount !== '') {
//       const numAmount = Number(amount);
//       if (isNaN(numAmount) || numAmount <= 0) {
//         return res.status(400).json({ message: 'Amount must be a positive number.' });
//       }

//       const totalPaid = await FeePayment.aggregate([
//         { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
//         { $group: { _id: null, total: { $sum: '$amount' } } },
//       ]);
//       const paidSoFar = totalPaid[0]?.total || 0;

//       if (numAmount < paidSoFar) {
//         return res.status(400).json({
//           message: `Cannot set amount to ₹${numAmount.toLocaleString('en-IN')} — ₹${paidSoFar.toLocaleString('en-IN')} has already been collected against this allotment.`,
//         });
//       }
//     }

//     if (feePlan && !VALID_FEE_PLANS.includes(feePlan)) {
//       return res.status(400).json({
//         message: `Invalid fee plan "${feePlan}". Must be one of: ${VALID_FEE_PLANS.join(', ')}.`,
//       });
//     }

//     if (dueDate) {
//       const due = new Date(dueDate);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (isNaN(due.getTime()) || due < today) {
//         return res.status(400).json({ message: 'Invalid or past due date.' });
//       }
//     }

//     const updated = await FeeAllotment.findOneAndUpdate(
//       { _id: req.params.id, organizationId: req.organizationId },
//       req.body,
//       { new: true, runValidators: true }
//     ).populate([
//       { path: 'memberId', select: 'name memberId' },
//       { path: 'feeTypeId' },
//     ]);

//     res.json(updated);
//   } catch (err) {
//     logError('updateFitnessAllotment', err);
//     if (isBadId(err)) return res.status(400).json({ message: 'Invalid allotment ID.' });
//     res.status(500).json({ message: 'Failed to update allotment. Please try again.' });
//   }
// };

// // ─────────────────────────────────────────────
// // FEE PAYMENTS
// // ─────────────────────────────────────────────

// exports.getFitnessPayments = async (req, res) => {
//   try {
//     const payments = await FeePayment.find({ organizationId: req.organizationId })
//       .populate('memberId', 'name memberId')
//       .sort({ paymentDate: -1 });
//     res.json(payments);
//   } catch (err) {
//     logError('getFitnessPayments', err);
//     res.status(500).json({ message: 'Failed to fetch payments. Please try again.' });
//   }
// };

// exports.addFitnessPayment = async (req, res) => {
//   try {
//     const { memberId, allotmentId, amount, paymentMode, paymentDate } = req.body;

//     if (!memberId) return res.status(400).json({ message: 'Participant is required.' });
//     if (!allotmentId) return res.status(400).json({ message: 'Fee allotment is required.' });
//     if (amount === undefined || amount === '') return res.status(400).json({ message: 'Amount is required.' });
//     if (!paymentDate) return res.status(400).json({ message: 'Payment date is required.' });

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Payment amount must be a positive number.' });
//     }

//     const pDate = new Date(paymentDate);
//     if (isNaN(pDate.getTime())) {
//       return res.status(400).json({ message: 'Invalid payment date.' });
//     }

//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);
//     if (pDate >= tomorrow) {
//       return res.status(400).json({ message: 'Payment date cannot be in the future.' });
//     }

//     if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
//       return res.status(400).json({
//         message: `Invalid payment mode "${paymentMode}". Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.`,
//       });
//     }

//     // Validate Member
//     const member = await FitnessMember.findOne({
//       _id: memberId,
//       organizationId: req.organizationId,
//     });
//     if (!member) {
//       return res.status(404).json({ message: 'Participant not found.' });
//     }

//     // Validate Allotment
//     const allotment = await FeeAllotment.findOne({
//       _id: allotmentId,
//       organizationId: req.organizationId,
//     });
//     if (!allotment) {
//       return res.status(404).json({ message: 'Fee allotment not found.' });
//     }
//     if (allotment.memberId.toString() !== memberId.toString()) {
//       return res.status(400).json({ message: 'This fee allotment does not belong to the selected participant.' });
//     }

//     const totalPaidResult = await FeePayment.aggregate([
//       { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]);
//     const alreadyPaid = totalPaidResult[0]?.total || 0;
//     const totalFee = allotment.amount;
//     const remaining = totalFee - alreadyPaid;

//     if (remaining <= 0) {
//       return res.status(409).json({
//         message: `This fee (₹${totalFee.toLocaleString('en-IN')}) is already fully paid.`,
//       });
//     }

//     if (numAmount > remaining) {
//       return res.status(400).json({
//         message: `Payment of ₹${numAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')}.`,
//       });
//     }

//     const payment = new FeePayment({
//       ...req.body,
//       amount: numAmount,
//       organizationId: req.organizationId,
//     });
//     await payment.save();

//     const newPaid = alreadyPaid + numAmount;
//     if (newPaid >= totalFee) {
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
//     } else {
//       await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Partial' });
//     }

//     const populated = await payment.populate('memberId', 'name memberId');

//     res.status(201).json({
//       payment: populated,
//       summary: {
//         totalFee,
//         totalPaid: newPaid,
//         remaining: totalFee - newPaid,
//         status: newPaid >= totalFee ? 'Paid' : 'Partial',
//       },
//     });
//   } catch (err) {
//     logError('addFitnessPayment', err);
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid participant or allotment ID.' });
//     }
//     res.status(500).json({ message: 'Failed to record payment. Please try again.' });
//   }
// };





















// controllers/fitnessFeeController.js

const FeeType = require('../models/FitnessFeeType');
const FeeAllotment = require('../models/FitnessFeeAllotment');
const FeePayment = require('../models/FitnessFeePayment');
const FitnessMember = require('../models/FitnessMember');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const VALID_FEE_TYPES = ['Visitor', 'Residency', 'Membership Pass'];
const VALID_FEE_PLANS = [
  'Annual',
  'Half-Yearly',   // ✅ NEW
  'Quarterly',     // ✅ NEW
  'Monthly',
  'Weekly',
  'Daily',
  'Hourly'
];
const VALID_PAYMENT_MODES = ['Cash', 'Bank Transfer'];

const isBadId = (err) => err.name === 'CastError' && err.kind === 'ObjectId';

const logError = (operation, err) => {
  console.error(`\n=== ${operation} ERROR ===`);
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  console.error('Code:', err.code);
  console.error('Stack:', err.stack?.split('\n').slice(0, 8).join('\n'));
  console.error('Full Error Object:', JSON.stringify(err, null, 2));
};

// ─────────────────────────────────────────────
// FEE TYPES
// ─────────────────────────────────────────────

exports.getFitnessFeeTypes = async (req, res) => {
  try {
    const types = await FeeType.find({ organizationId: req.organizationId })
      .sort({ createdAt: -1 });
    res.json(types);
  } catch (err) {
    logError('getFitnessFeeTypes', err);
    res.status(500).json({ message: 'Failed to fetch fee types. Please try again.' });
  }
};

exports.createFitnessFeeType = async (req, res) => {
  try {
    const { description, type, annual, halfYearly, quarterly, monthly, weekly, daily, hourly, numberOfPersons } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required.' });
    }

    if (type && !VALID_FEE_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
      });
    }

    const amounts = { annual, halfYearly, quarterly, monthly, weekly, daily, hourly };
    for (const [key, val] of Object.entries(amounts)) {
      if (val !== undefined && val !== '' && Number(val) < 0) {
        return res.status(400).json({ message: `${key} amount cannot be negative.` });
      }
    }

    const trimmedDesc = description.trim();

    const exists = await FeeType.findOne({
      organizationId: req.organizationId,
      description: { $regex: new RegExp(`^${trimmedDesc}$`, 'i') },
    });

    if (exists) {
      return res.status(409).json({
        message: `A fee type with the description "${trimmedDesc}" already exists.`,
      });
    }

    const feeType = new FeeType({
      description: trimmedDesc,
      type: type || 'Membership Pass',
      annual: Number(annual) || 0,
      halfYearly: Number(halfYearly) || 0,   // ✅
      quarterly: Number(quarterly) || 0,     // ✅
      monthly: Number(monthly) || 0,
      weekly: Number(weekly) || 0,
      daily: Number(daily) || 0,
      hourly: Number(hourly) || 0,
      numberOfPersons:
      type === "Membership Pass"
      ? Number(numberOfPersons) || 1
      : 1,
      organizationId: req.organizationId,
    });

    await feeType.save();
    res.status(201).json(feeType);
  } catch (err) {
    logError('createFitnessFeeType', err);

    if (err.code === 11000) {
      return res.status(409).json({ message: 'A fee type with this description already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: 'Failed to create fee type. Please try again.' });
  }
};

exports.updateFitnessFeeType = async (req, res) => {
  try {
    const { description, type, annual, halfYearly, quarterly, monthly, weekly, daily, hourly } = req.body;

    const feeType = await FeeType.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found.' });
    }

    if (type && !VALID_FEE_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
      });
    }

    const amounts = { annual, halfYearly, quarterly, monthly, weekly, daily, hourly, numberOfPersons, };

    for (const [key, val] of Object.entries(amounts)) {
      if (val !== undefined && val !== '' && Number(val) < 0) {
        return res.status(400).json({ message: `${key} amount cannot be negative.` });
      }
    }

    const trimmedDesc = description ? description.trim() : feeType.description;

    if (description && trimmedDesc.toLowerCase() !== feeType.description.toLowerCase()) {
      const duplicate = await FeeType.findOne({
        organizationId: req.organizationId,
        description: { $regex: new RegExp(`^${trimmedDesc}$`, 'i') },
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: `Another fee type with the description "${trimmedDesc}" already exists.`,
        });
      }
    }

    const updated = await FeeType.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      {
        description: trimmedDesc,
        type: type || feeType.type,
        annual: annual !== undefined ? Number(annual) || 0 : feeType.annual,
        halfYearly: halfYearly !== undefined ? Number(halfYearly) || 0 : feeType.halfYearly,
        quarterly: quarterly !== undefined ? Number(quarterly) || 0 : feeType.quarterly,
        monthly: monthly !== undefined ? Number(monthly) || 0 : feeType.monthly,
        weekly: weekly !== undefined ? Number(weekly) || 0 : feeType.weekly,
        daily: daily !== undefined ? Number(daily) || 0 : feeType.daily,
        hourly: hourly !== undefined ? Number(hourly) || 0 : feeType.hourly,
        numberOfPersons:
        type === "Membership Pass"
        ? Number(numberOfPersons) || 1
        : 1,
       },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    logError('updateFitnessFeeType', err);

    if (isBadId(err)) return res.status(400).json({ message: 'Invalid fee type ID.' });
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A fee type with this description already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error in update.' });
    }

    res.status(500).json({ message: 'Failed to update fee type. Please try again.' });
  }
};

exports.deleteFitnessFeeType = async (req, res) => {
  try {
    const feeType = await FeeType.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found.' });
    }

    const linkedCount = await FeeAllotment.countDocuments({
      feeTypeId: req.params.id,
      organizationId: req.organizationId,
    });

    if (linkedCount > 0) {
      return res.status(409).json({
        message: `Cannot delete this fee type — it is assigned to ${linkedCount} participant(s). Remove those allotments first.`,
      });
    }

    await FeeType.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    res.json({ message: 'Fee type deleted successfully.' });
  } catch (err) {
    logError('deleteFitnessFeeType', err);
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid fee type ID.' });
    }
    res.status(500).json({ message: 'Failed to delete fee type. Please try again.' });
  }
};

// ─────────────────────────────────────────────
// FEE ALLOTMENTS
// ─────────────────────────────────────────────

exports.getFitnessAllotments = async (req, res) => {
  try {
    const allotments = await FeeAllotment.find({ organizationId: req.organizationId })
      .populate('memberId', 'name memberId')
      .populate('feeTypeId')
      .populate('responsibleStaff', 'fullName name')
      .sort({ createdAt: -1 });

    const formattedAllotments = allotments.map((row) => ({
      ...row.toObject(),
      responsibleStaff:
        row.responsibleStaff?.fullName ||
        row.responsibleStaff?.name ||
        row.responsibleStaff ||
        '-',
    }));

    res.json(formattedAllotments);
  } catch (err) {
    logError('getFitnessAllotments', err);
    res.status(500).json({ message: 'Failed to fetch allotments. Please try again.' });
  }
};

exports.allotFitnessFee = async (req, res) => {
  try {
    const {
      memberId,
      feeTypeId,
      amount,
      feePlan,
      dueDate,
      responsibleStaff,
      paymentMode
    } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: 'Participant (memberId) is required.' });
    }
    if (!feeTypeId) {
      return res.status(400).json({ message: 'Fee item is required.' });
    }
    if (amount === undefined || amount === '') {
      return res.status(400).json({ message: 'Amount is required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    const member = await FitnessMember.findOne({
      _id: memberId,
      organizationId: req.organizationId,
    });
    if (!member) {
      return res.status(404).json({
        message: `Member with ID ${memberId} not found in this organization.`,
      });
    }

    const feeType = await FeeType.findOne({
      _id: feeTypeId,
      organizationId: req.organizationId,
    });
    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found.' });
    }

    const duplicate = await FeeAllotment.findOne({
      organizationId: req.organizationId,
      memberId,
      feeTypeId,
    });
    if (duplicate) {
      return res.status(409).json({
        message: `"${feeType.description}" is already allotted to ${member.name}.`,
      });
    }

    const allotment = new FeeAllotment({
      memberId,
      feeTypeId,
      amount: numAmount,
      feePlan: feePlan || 'Annual',
      paymentMode: paymentMode || 'Cash',
      dueDate: dueDate || null,
      responsibleStaff: responsibleStaff || null,
      organizationId: req.organizationId,
      status: 'Pending',
    });

    const savedAllotment = await allotment.save();

    const populated = await FeeAllotment.findById(savedAllotment._id)
      .populate('memberId', 'name memberId')
      .populate('feeTypeId')
      .populate('responsibleStaff', 'fullName name');
    populated.responsibleStaff ||
      '-',

      res.status(201).json({
        ...populated.toObject(),
        responsibleStaff:
          populated.responsibleStaff?.fullName ||
          populated.responsibleStaff?.name ||
          populated.responsibleStaff ||
          '-',
      });
  } catch (err) {
    logError('allotFitnessFee', err);
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid memberId or feeTypeId or responsibleStaff format.' });
    }
    res.status(500).json({ message: 'Failed to allot fee.' });
  }
};

exports.updateFitnessAllotment = async (req, res) => {
  try {
    const { amount, feePlan, dueDate, responsibleStaff } = req.body;

    const allotment = await FeeAllotment.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!allotment) {
      return res.status(404).json({ message: 'Allotment record not found.' });
    }

    if (amount !== undefined && amount !== '') {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
      }

      const totalPaid = await FeePayment.aggregate([
        { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const paidSoFar = totalPaid[0]?.total || 0;

      if (numAmount < paidSoFar) {
        return res.status(400).json({
          message: `Cannot set amount to ₹${numAmount.toLocaleString('en-IN')} — ₹${paidSoFar.toLocaleString('en-IN')} has already been collected against this allotment.`,
        });
      }
    }

    if (feePlan && !VALID_FEE_PLANS.includes(feePlan)) {
      return res.status(400).json({
        message: `Invalid fee plan "${feePlan}". Must be one of: ${VALID_FEE_PLANS.join(', ')}.`,
      });
    }

    if (dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(due.getTime()) || due < today) {
        return res.status(400).json({ message: 'Invalid or past due date.' });
      }
    }

    const updatePayload = { ...req.body };
    if (responsibleStaff !== undefined) {
      updatePayload.responsibleStaff = responsibleStaff || null;
    }

    const updated = await FeeAllotment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      updatePayload,
      { new: true, runValidators: true }
    ).populate([
      { path: 'memberId', select: 'name memberId' },
      { path: 'feeTypeId' },
      { path: 'responsibleStaff', select: 'fullName name' },
    ]);

    res.json(updated);
  } catch (err) {
    logError('updateFitnessAllotment', err);
    if (isBadId(err)) return res.status(400).json({ message: 'Invalid allotment ID.' });
    res.status(500).json({ message: 'Failed to update allotment. Please try again.' });
  }
};

// ─────────────────────────────────────────────
// FEE PAYMENTS
// ─────────────────────────────────────────────

// exports.getFitnessPayments = async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit) || 10, 1);
//     const skip = (page - 1) * limit;

//     const totalRecords = await FeePayment.countDocuments({
//       organizationId: req.organizationId,
//     });

//     const payments = await FeePayment.find({
//       organizationId: req.organizationId,
//     })
//       .populate('memberId', 'name memberId')
//       .populate('allotmentId')
//       .sort({ paymentDate: -1 })
//       .skip(skip)
//       .limit(limit);

//     const totalPages = Math.ceil(totalRecords / limit);

//     res.json({
//       data: payments,
//       pagination: {
//         totalRecords,
//         currentPage: page,
//         totalPages,
//         limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (err) {
//     logError('getFitnessPayments', err);
//     res.status(500).json({ message: 'Failed to fetch payments. Please try again.' });
//   }
// };
// ---> working...

// exports.getFitnessPayments = async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit) || 10, 1);
//     const skip = (page - 1) * limit;

//     const {
//       member,
//       status,
//       mode,
//       staff,
//       fromDate,
//       toDate,
//     } = req.query;

//     // Base filter
//     const query = {
//       organizationId: req.organizationId,
//     };

//     // 🔹 Payment mode filter
//     if (mode) {
//       query.paymentMode = { $regex: mode, $options: "i" };
//     }

//     // 🔹 Date filter
//     if (fromDate || toDate) {
//       query.paymentDate = {};
//       if (fromDate) query.paymentDate.$gte = new Date(fromDate);
//       if (toDate) {
//         const end = new Date(toDate);
//         end.setHours(23, 59, 59, 999);
//         query.paymentDate.$lte = end;
//       }
//     }

//     // 🔹 Member filter (needs populate match later)
//     let memberMatch = {};
//     if (member) {
//       memberMatch = {
//         name: { $regex: member, $options: "i" },
//       };
//     }

//     // 🔹 Allotment filter (status + staff)
//     let allotmentMatch = {};
//     if (status && status !== "All") {
//       allotmentMatch.status = status;
//     }
//     if (staff) {
//       allotmentMatch.responsibleStaff = staff;
//     }

//     // Fetch data
//     const payments = await FeePayment.find(query)
//       .populate({
//         path: "memberId",
//         select: "name memberId",
//         match: memberMatch,
//       })
//       .populate({
//         path: "allotmentId",
//         match: allotmentMatch,
//       })
//       .sort({ paymentDate: -1 })
//       .skip(skip)
//       .limit(limit);

//     // ❗ IMPORTANT: Remove unmatched populated docs
//     const filteredPayments = payments.filter(
//       (p) => p.memberId && p.allotmentId
//     );

//     // Count (this is tricky — must match filters)
//     const totalRecords = await FeePayment.countDocuments(query);

//     const totalPages = Math.ceil(totalRecords / limit);

//     res.json({
//       data: filteredPayments,
//       pagination: {
//         totalRecords,
//         currentPage: page,
//         totalPages,
//         limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (err) {
//     logError("getFitnessPayments", err);
//     res.status(500).json({
//       message: "Failed to fetch payments. Please try again.",
//     });
//   }
// };

// <--- working..
exports.getFitnessPayments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const {
      member,
      status,
      mode,
      staff,
      fromDate,
      toDate,
    } = req.query;

    const query = {
      organizationId: req.organizationId,
    };

    // =========================
    // Payment Mode Filter
    // =========================
    if (mode) {
      query.paymentMode = {
        $regex: mode,
        $options: "i",
      };
    }

    // =========================
    // Date Filter
    // =========================
    if (fromDate || toDate) {
      query.paymentDate = {};

      if (fromDate) {
        query.paymentDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        query.paymentDate.$lte = end;
      }
    }

    // =========================
    // Member Filter
    // =========================
    if (member) {
      const matchedMembers = await FitnessMember.find({
        organizationId: req.organizationId,
        name: {
          $regex: member,
          $options: "i",
        },
      }).select("_id");

      const memberIds = matchedMembers.map((m) => m._id);

      query.memberId = { $in: memberIds };
    }

    // =========================
    // Allotment Filters
    // =========================
    if (
      (status && status !== "All") ||
      staff
    ) {
      const allotmentQuery = {
        organizationId: req.organizationId,
      };

      if (status && status !== "All") {
        allotmentQuery.status = status;
      }

      if (staff) {
        allotmentQuery.responsibleStaff = staff;
      }

      const matchedAllotments = await FeeAllotment.find(
        allotmentQuery
      ).select("_id");

      const allotmentIds = matchedAllotments.map(
        (a) => a._id
      );

      query.allotmentId = {
        $in: allotmentIds,
      };
    }

    // =========================
    // Total Count
    // =========================
    const totalRecords =
      await FeePayment.countDocuments(query);

    const totalPages = Math.ceil(
      totalRecords / limit
    );

    // =========================
    // Fetch Paginated Data
    // =========================
    const payments = await FeePayment.find(query)
      .populate({
        path: "memberId",
        select: "name memberId",
      })
      .populate({
        path: "allotmentId",
      })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: payments,
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
    logError("getFitnessPayments", err);

    res.status(500).json({
      message: "Failed to fetch payments. Please try again.",
    });
  }
};

exports.addFitnessPayment = async (req, res) => {
  try {
    const { memberId, allotmentId, amount, paymentMode, paymentDate } = req.body;

    if (!memberId) return res.status(400).json({ message: 'Participant is required.' });
    if (!allotmentId) return res.status(400).json({ message: 'Fee allotment is required.' });
    if (amount === undefined || amount === '') return res.status(400).json({ message: 'Amount is required.' });
    if (!paymentDate) return res.status(400).json({ message: 'Payment date is required.' });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be a positive number.' });
    }

    const pDate = new Date(paymentDate);
    if (isNaN(pDate.getTime())) {
      return res.status(400).json({ message: 'Invalid payment date.' });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (pDate >= tomorrow) {
      return res.status(400).json({ message: 'Payment date cannot be in the future.' });
    }

    if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
      return res.status(400).json({
        message: `Invalid payment mode "${paymentMode}". Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.`,
      });
    }

    const member = await FitnessMember.findOne({
      _id: memberId,
      organizationId: req.organizationId,
    });
    if (!member) {
      return res.status(404).json({ message: 'Participant not found.' });
    }

    const allotment = await FeeAllotment.findOne({
      _id: allotmentId,
      organizationId: req.organizationId,
    });
    if (!allotment) {
      return res.status(404).json({ message: 'Fee allotment not found.' });
    }
    if (allotment.memberId.toString() !== memberId.toString()) {
      return res.status(400).json({ message: 'This fee allotment does not belong to the selected participant.' });
    }

    const totalPaidResult = await FeePayment.aggregate([
      { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const alreadyPaid = totalPaidResult[0]?.total || 0;
    const totalFee = allotment.amount;
    const remaining = totalFee - alreadyPaid;

    if (remaining <= 0) {
      return res.status(409).json({
        message: `This fee (₹${totalFee.toLocaleString('en-IN')}) is already fully paid.`,
      });
    }

    if (numAmount > remaining) {
      return res.status(400).json({
        message: `Payment of ₹${numAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')}.`,
      });
    }
    

    const payment = new FeePayment({
      ...req.body,
      amount: numAmount,
      organizationId: req.organizationId,
    });
    await payment.save();

    const newPaid = alreadyPaid + numAmount;
    if (newPaid >= totalFee) {
      await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
    } else {
      await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Partial' });
    }

    const populated = await payment.populate('memberId', 'name memberId');

    res.status(201).json({
      payment: populated,
      summary: {
        totalFee,
        totalPaid: newPaid,
        remaining: totalFee - newPaid,
        status: newPaid >= totalFee ? 'Paid' : 'Partial',
      },
    });
  } catch (err) {
    logError('addFitnessPayment', err);
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid participant or allotment ID.' });
    }
    res.status(500).json({ message: 'Failed to record payment. Please try again.' });
  }
};

exports.getPendingAllotments = async (req, res) => {
  try {
    const { memberId } = req.params;

    const allotments = await FeeAllotment.find({
      memberId,
      organizationId: req.organizationId,
      status: { $ne: "Paid" } // 🔥 KEY FIX
    })
      .populate("feeTypeId")
      .sort({ createdAt: -1 });

    res.json(allotments);
  } catch (err) {
    logError("getPendingAllotments", err);
    res.status(500).json({ message: "Failed to fetch pending fees" });
  }
};

exports.getFitnessFeeStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const totalMembers = await FitnessMember.countDocuments({ organizationId });

    const assignedAgg = await FeeAllotment.aggregate([
      { $match: { organizationId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const collectedAgg = await FeePayment.aggregate([
      { $match: { organizationId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        totalAssigned: assignedAgg[0]?.total || 0,
        totalCollected: collectedAgg[0]?.total || 0
      }
    });

  } catch (err) {
    logError("getFitnessFeeStats", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};