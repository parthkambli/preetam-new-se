const FeeType = require('../models/FeeType');
const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const VALID_FEE_TYPES    = ['School', 'Residency', 'DayCare'];
const VALID_FEE_PLANS    = ['Annual', 'Monthly', 'Weekly', 'Daily'];
const VALID_PAYMENT_MODES = ['Cash', 'Cheque', 'Online', 'UPI'];

/** Mongoose CastError means the given id string is not a valid ObjectId */
const isBadId = (err) => err.name === 'CastError' && err.kind === 'ObjectId';


// ─────────────────────────────────────────────
// FEE TYPES
// ─────────────────────────────────────────────

exports.getFeeTypes = async (req, res) => {
  try {
    const types = await FeeType.find({ organizationId: req.organizationId });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch fee types. Please try again.' });
  }
};

exports.createFeeType = async (req, res) => {
  try {
    const { description, type, annual, monthly, weekly, daily } = req.body;

    // ── Required field ──────────────────────────────────────────
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required.' });
    }

    // ── Valid category ──────────────────────────────────────────
    if (type && !VALID_FEE_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
      });
    }

    // ── No negative amounts ─────────────────────────────────────
    const amounts = { annual, monthly, weekly, daily };
    for (const [key, val] of Object.entries(amounts)) {
      if (val !== undefined && val !== '' && Number(val) < 0) {
        return res.status(400).json({ message: `${key} amount cannot be negative.` });
      }
    }

    // ── Duplicate description within same org ───────────────────
    const exists = await FeeType.findOne({
      organizationId: req.organizationId,
      description: { $regex: new RegExp(`^${description.trim()}$`, 'i') },
    });
    if (exists) {
      return res.status(409).json({
        message: `A fee type with the description "${description.trim()}" already exists.`,
      });
    }

    const feeType = new FeeType({
      ...req.body,
      description: description.trim(),
      organizationId: req.organizationId,
    });
    await feeType.save();
    res.status(201).json(feeType);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A fee type with this description already exists.' });
    }
    res.status(500).json({ message: 'Failed to create fee type. Please try again.' });
  }
};

exports.updateFeeType = async (req, res) => {
  try {
    const { description, type, annual, monthly, weekly, daily } = req.body;

    // ── Valid ObjectId ──────────────────────────────────────────
    const feeType = await FeeType.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found.' });
    }

    // ── Valid category ──────────────────────────────────────────
    if (type && !VALID_FEE_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid fee category "${type}". Must be one of: ${VALID_FEE_TYPES.join(', ')}.`,
      });
    }

    // ── No negative amounts ─────────────────────────────────────
    const amounts = { annual, monthly, weekly, daily };
    for (const [key, val] of Object.entries(amounts)) {
      if (val !== undefined && val !== '' && Number(val) < 0) {
        return res.status(400).json({ message: `${key} amount cannot be negative.` });
      }
    }

    // ── Duplicate description (exclude self) ────────────────────
    if (description && description.trim() !== feeType.description) {
      const duplicate = await FeeType.findOne({
        organizationId: req.organizationId,
        description: { $regex: new RegExp(`^${description.trim()}$`, 'i') },
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res.status(409).json({
          message: `Another fee type with the description "${description.trim()}" already exists.`,
        });
      }
    }

    const updated = await FeeType.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { ...req.body, ...(description && { description: description.trim() }) },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid fee type ID.' });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A fee type with this description already exists.' });
    }
    res.status(500).json({ message: 'Failed to update fee type. Please try again.' });
  }
};

exports.deleteFeeType = async (req, res) => {
  try {
    const feeType = await FeeType.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found.' });
    }

    // ── Block deletion if allotments are linked ─────────────────
    const linkedCount = await FeeAllotment.countDocuments({
      feeTypeId: req.params.id,
      organizationId: req.organizationId,
    });
    if (linkedCount > 0) {
      return res.status(409).json({
        message: `Cannot delete this fee type — it is assigned to ${linkedCount} participant(s). Remove those allotments first.`,
      });
    }

    await FeeType.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
    res.json({ message: 'Fee type deleted successfully.' });
  } catch (err) {
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid fee type ID.' });
    }
    res.status(500).json({ message: 'Failed to delete fee type. Please try again.' });
  }
};


// ─────────────────────────────────────────────
// FEE ALLOTMENTS
// ─────────────────────────────────────────────

exports.getAllotments = async (req, res) => {
  try {
    const allotments = await FeeAllotment.find({ organizationId: req.organizationId })
      .populate('studentId', 'fullName studentId')
      .populate('feeTypeId');
    res.json(allotments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch allotments. Please try again.' });
  }
};

// exports.allotFee = async (req, res) => {
//   try {
//     const { studentId, feeTypeId, amount, feePlan, dueDate } = req.body;

//     // ── Required fields ─────────────────────────────────────────
//     if (!studentId) {
//       return res.status(400).json({ message: 'Participant is required.' });
//     }
//     if (!feeTypeId) {
//       return res.status(400).json({ message: 'Fee item is required.' });
//     }
//     if (amount === undefined || amount === '') {
//       return res.status(400).json({ message: 'Amount is required.' });
//     }

//     // ── Amount sanity checks ────────────────────────────────────
//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       return res.status(400).json({ message: 'Amount must be a positive number.' });
//     }

//     // ── Valid fee plan ──────────────────────────────────────────
//     if (feePlan && !VALID_FEE_PLANS.includes(feePlan)) {
//       return res.status(400).json({
//         message: `Invalid fee plan "${feePlan}". Must be one of: ${VALID_FEE_PLANS.join(', ')}.`,
//       });
//     }

//     // ── Due date not in the past ────────────────────────────────
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

//     // ── Participant exists ──────────────────────────────────────
//     const student = await Student.findOne({
//       _id: studentId,
//       organizationId: req.organizationId,
//     });
//     if (!student) {
//       return res.status(404).json({
//         message: 'Participant not found. Please select a valid participant.',
//       });
//     }

//     // ── Fee type exists ─────────────────────────────────────────
//     const feeType = await FeeType.findOne({
//       _id: feeTypeId,
//       organizationId: req.organizationId,
//     });
//     if (!feeType) {
//       return res.status(404).json({ message: 'Fee type not found. It may have been deleted.' });
//     }

//     // ── Duplicate allotment: same student + same fee type ───────
//     const duplicate = await FeeAllotment.findOne({
//       organizationId: req.organizationId,
//       studentId,
//       feeTypeId,
//     });
//     if (duplicate) {
//       return res.status(409).json({
//         message: `"${feeType.description}" is already allotted to ${student.fullName}. Update the existing allotment instead.`,
//       });
//     }

//     const allotment = new FeeAllotment({
//     studentId,        
//     feeTypeId,        
//     amount: numAmount,
//     feePlan,
//     dueDate,
//     paymentMode: req.body.paymentMode,
//     organizationId: req.organizationId,
//     });
//     await allotment.save();

//     const populated = await allotment.populate([
//       { path: 'studentId', select: 'fullName studentId' },
//       { path: 'feeTypeId' },
//     ]);
//     res.status(201).json(populated);
//   } catch (err) {
//     if (isBadId(err)) {
//       return res.status(400).json({ message: 'Invalid participant or fee type ID.' });
//     }
//     res.status(500).json({ message: 'Failed to allot fee. Please try again.' });
//   }
// };

exports.allotFee = async (req, res) => {
  try {
    const { studentId, feeTypeId, amount, feePlan, dueDate, paymentMode } = req.body;

    // ── Required fields ─────────────────────────────────────────
    if (!studentId) {
      return res.status(400).json({ message: 'Participant (studentId) is required.' });
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

    // ── Validate Student ────────────────────────────────────────
    const student = await Student.findOne({
      _id: studentId,
      organizationId: req.organizationId,
    });

    if (!student) {
      return res.status(404).json({
        message: `Student with ID ${studentId} not found in this organization.`,
      });
    }

    // ── Validate Fee Type ───────────────────────────────────────
    const feeType = await FeeType.findOne({
      _id: feeTypeId,
      organizationId: req.organizationId,
    });
    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found.' });
    }

    // ── Duplicate check ─────────────────────────────────────────
    const duplicate = await FeeAllotment.findOne({
      organizationId: req.organizationId,
      studentId,
      feeTypeId,
    });
    if (duplicate) {
      return res.status(409).json({
        message: `"${feeType.description}" is already allotted to ${student.fullName}.`,
      });
    }

    // ── Create Allotment ────────────────────────────────────────
    const allotment = new FeeAllotment({
      studentId: studentId,           // Explicitly pass as string/ObjectId
      feeTypeId,
      amount: numAmount,
      feePlan: feePlan || 'Annual',
      paymentMode: paymentMode || 'Cash',
      dueDate: dueDate || null,
      organizationId: req.organizationId,
      status: 'Pending',
    });

    const savedAllotment = await allotment.save();

    // Populate and return
    const populated = await FeeAllotment.findById(savedAllotment._id)
      .populate('studentId', 'fullName studentId')
      .populate('feeTypeId');

    res.status(201).json(populated);
  } catch (err) {
    console.error("Allot Fee Error:", err);   // ← Important for debugging
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid studentId or feeTypeId format.' });
    }
    res.status(500).json({ 
      message: 'Failed to allot fee.', 
      error: err.message 
    });
  }
};

exports.updateAllotment = async (req, res) => {
  try {
    const { amount, feePlan, dueDate } = req.body;

    // ── Allotment exists ────────────────────────────────────────
    const allotment = await FeeAllotment.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!allotment) {
      return res.status(404).json({ message: 'Allotment record not found.' });
    }

    // ── Amount sanity check ─────────────────────────────────────
    if (amount !== undefined && amount !== '') {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
      }

      // ── New amount cannot be less than what is already paid ───
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

    // ── Valid fee plan ──────────────────────────────────────────
    if (feePlan && !VALID_FEE_PLANS.includes(feePlan)) {
      return res.status(400).json({
        message: `Invalid fee plan "${feePlan}". Must be one of: ${VALID_FEE_PLANS.join(', ')}.`,
      });
    }

    // ── Due date not in the past ────────────────────────────────
    if (dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(due.getTime())) {
        return res.status(400).json({ message: 'Invalid due date.' });
      }
      if (due < today) {
        return res.status(400).json({ message: 'Due date cannot be in the past.' });
      }
    }

    const updated = await FeeAllotment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'studentId', select: 'fullName studentId' },
      { path: 'feeTypeId' },
    ]);

    res.json(updated);
  } catch (err) {
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid allotment ID.' });
    }
    res.status(500).json({ message: 'Failed to update allotment. Please try again.' });
  }
};


// ─────────────────────────────────────────────
// FEE PAYMENTS
// ─────────────────────────────────────────────

exports.getPayments = async (req, res) => {
  try {
    const payments = await FeePayment.find({ organizationId: req.organizationId })
      .populate('studentId', 'fullName studentId')
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments. Please try again.' });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { studentId, allotmentId, amount, paymentMode, paymentDate } = req.body;

    // ── Required fields ─────────────────────────────────────────
    if (!studentId) {
      return res.status(400).json({ message: 'Participant is required.' });
    }
    if (!allotmentId) {
      return res.status(400).json({ message: 'Fee allotment is required.' });
    }
    if (amount === undefined || amount === '') {
      return res.status(400).json({ message: 'Amount is required.' });
    }
    if (!paymentDate) {
      return res.status(400).json({ message: 'Payment date is required.' });
    }

    // ── Amount sanity checks ────────────────────────────────────
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be a positive number.' });
    }

    // ── Payment date not in the future ──────────────────────────
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

    // ── Valid payment mode ──────────────────────────────────────
    if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
      return res.status(400).json({
        message: `Invalid payment mode "${paymentMode}". Must be one of: ${VALID_PAYMENT_MODES.join(', ')}.`,
      });
    }

    // ── Participant exists ──────────────────────────────────────
    const student = await Student.findOne({
      _id: studentId,
      organizationId: req.organizationId,
    });
    if (!student) {
      return res.status(404).json({
        message: 'Participant not found. Please select a valid participant.',
      });
    }

    // ── Allotment exists and belongs to this student ────────────
    const allotment = await FeeAllotment.findOne({
      _id: allotmentId,
      organizationId: req.organizationId,
    });
    if (!allotment) {
      return res.status(404).json({
        message: 'Fee allotment not found. The fee may not have been allotted to this participant yet.',
      });
    }
    if (allotment.studentId.toString() !== studentId.toString()) {
      return res.status(400).json({
        message: 'This fee allotment does not belong to the selected participant.',
      });
    }

    // ── Check remaining balance ─────────────────────────────────
    const totalPaidResult = await FeePayment.aggregate([
      { $match: { allotmentId: allotment._id, organizationId: req.organizationId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const alreadyPaid  = totalPaidResult[0]?.total || 0;
    const totalFee     = allotment.amount;
    const remaining    = totalFee - alreadyPaid;

    // ── Allotment is already fully paid ────────────────────────
    if (remaining <= 0) {
      return res.status(409).json({
        message: `This fee (₹${totalFee.toLocaleString('en-IN')}) is already fully paid. No further payment is needed.`,
      });
    }

    // ── Payment exceeds remaining balance ───────────────────────
    if (numAmount > remaining) {
      return res.status(400).json({
        message: `Payment of ₹${numAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')} (Total: ₹${totalFee.toLocaleString('en-IN')}, Paid: ₹${alreadyPaid.toLocaleString('en-IN')}).`,
      });
    }

    // ── Save payment ────────────────────────────────────────────
    const payment = new FeePayment({
      ...req.body,
      amount: numAmount,
      organizationId: req.organizationId,
    });
    await payment.save();

    // ── Auto-mark allotment as fully paid if balance is cleared ─
    const newPaid = alreadyPaid + numAmount;
    if (newPaid >= totalFee) {
      await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
    } else {
      // Mark as partially paid if not already
      await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Partial' });
    }

    const populated = await payment.populate('studentId', 'fullName studentId');
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
    if (isBadId(err)) {
      return res.status(400).json({ message: 'Invalid participant or allotment ID.' });
    }
    res.status(500).json({ message: 'Failed to record payment. Please try again.' });
  }
};