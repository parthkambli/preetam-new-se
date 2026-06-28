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
  let allotment = await FeeAllotment.findOne({
    studentId: student._id,
    admissionId: admission._id,
    organizationId,
    status: 'Pending',
  }).sort({ createdAt: 1 });

  if (!allotment) {
    allotment = await FeeAllotment.create({
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
  }

  const totalPaidResult = await FeePayment.aggregate([
    { $match: { allotmentId: allotment._id, organizationId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const alreadyPaid = totalPaidResult[0]?.total || 0;
  const totalFee = allotment.amount;
  const remaining = totalFee - alreadyPaid;

  if (remaining <= 0) {
    throw new Error('This fee is already fully paid.');
  }
  if (amount > remaining) {
    throw new Error(
      `Payment of ₹${amount.toLocaleString('en-IN')} exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')}.`
    );
  }

  const paymentDoc = await FeePayment.create({
    studentId: student._id,
    admissionId: admission._id,
    allotmentId: allotment._id,
    amount,
    paymentMode: paymentMode || 'Cash',
    paymentDate: paymentDate || new Date(),
    description: description || allotment.description || '',
    responsibleStaff: responsibleStaff || null,
    organizationId,
    ...(transactionId && { transactionId }),
    ...(remarks && { remarks }),
  });

  const newPaid = alreadyPaid + amount;
  if (newPaid >= totalFee) {
    await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
  }

  admission.paymentHistory.push({
    amount,
    paymentDate: paymentDate || new Date(),
    paymentMode: paymentMode || 'Cash',
    description: description || allotment.description || '',
    responsibleStaff: responsibleStaff || null,
  });

  const allPayments = await FeePayment.aggregate([
    { $match: { admissionId: admission._id, organizationId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalPaidForAdmission = allPayments[0]?.total || 0;
  admission.paidAmount = totalPaidForAdmission;
  admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - totalPaidForAdmission);
  await admission.save();

  return { payment: paymentDoc, admission };
};
