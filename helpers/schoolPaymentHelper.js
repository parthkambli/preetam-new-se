const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');

exports.applyAdmissionPayment = async ({
  admission,
  student,
  amount,
  paymentMode,
  paymentDate,
  description,
  responsibleStaff,
  organizationId,
  transactionId,
  remarks,
}) => {
  // ── Find ALL pending FeeAllotments for this admission ─────────────
  let allotments = await FeeAllotment.find({
    studentId: student._id,
    admissionId: admission._id,
    organizationId,
    status: 'Pending',
  }).sort({ createdAt: 1 });

  // ── Create a new FeeAllotment if none exist ────────────────────────
  if (allotments.length === 0) {
    const newAllotment = await FeeAllotment.create({
      studentId: student._id,
      admissionId: admission._id,
      feeTypeId: admission.feeTypeId || undefined,
      description: description || admission.feeDescription || 'School Fee',
      feePlan: admission.feePlan || 'Monthly',
      amount: admission.totalFee || amount,
      dueDate: admission.nextDueDate || null,
      organizationId,
      status: 'Pending',
    });
    allotments = [newAllotment];
  }

  // ── Calculate total remaining across ALL pending allotments ────────
  const allotmentDetails = await Promise.all(allotments.map(async (a) => {
    const paidResult = await FeePayment.aggregate([
      { $match: { allotmentId: a._id, organizationId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const alreadyPaid = paidResult[0]?.total || 0;
    return {
      allotment: a,
      alreadyPaid,
      remaining: Math.max(0, a.amount - alreadyPaid),
    };
  }));

  const totalRemaining = allotmentDetails.reduce((sum, d) => sum + d.remaining, 0);

  if (totalRemaining <= 0) {
    throw new Error('All fees are already fully paid.');
  }
  if (amount > totalRemaining) {
    throw new Error(
      `Payment of ₹${amount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${totalRemaining.toLocaleString('en-IN')}.`
    );
  }

  // ── Distribute payment across allotments sequentially ──────────────
  let remainingAmount = amount;
  const paymentDocs = [];
  const paymentHistoryEntries = [];

  for (const detail of allotmentDetails) {
    if (remainingAmount <= 0) break;
    if (detail.remaining <= 0) continue;

    const payNow = Math.min(remainingAmount, detail.remaining);

    const paymentDoc = await FeePayment.create({
      studentId: student._id,
      admissionId: admission._id,
      allotmentId: detail.allotment._id,
      amount: payNow,
      paymentMode: paymentMode || 'Cash',
      paymentDate: paymentDate || new Date(),
      description: description || detail.allotment.description || '',
      responsibleStaff: responsibleStaff || null,
      organizationId,
      ...(transactionId && { transactionId }),
      ...(remarks && { remarks }),
    });
    paymentDocs.push(paymentDoc);

    if (detail.alreadyPaid + payNow >= detail.allotment.amount) {
      await FeeAllotment.findByIdAndUpdate(detail.allotment._id, { status: 'Paid' });
    }

    paymentHistoryEntries.push({
      amount: payNow,
      paymentDate: paymentDate || new Date(),
      paymentMode: paymentMode || 'Cash',
      description: description || detail.allotment.description || '',
      responsibleStaff: responsibleStaff || null,
    });

    remainingAmount -= payNow;
  }

  // ── Update admission payment history ──────────────────────────────
  for (const entry of paymentHistoryEntries) {
    admission.paymentHistory.push(entry);
  }

  // ── Recalculate admission paid/remaining from ALL payments ────────
  const allPayments = await FeePayment.aggregate([
    { $match: { admissionId: admission._id, organizationId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalPaidForAdmission = allPayments[0]?.total || 0;
  admission.paidAmount = totalPaidForAdmission;
  admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - totalPaidForAdmission);
  await admission.save();

  return { payment: paymentDocs[0], payments: paymentDocs, admission };
};
