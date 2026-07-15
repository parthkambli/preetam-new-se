const User = require('../models/User');
const Student = require('../models/Student');
const SchoolAdmission = require('../models/SchoolAdmission');
const TimeTable = require('../models/schoolPeriod');
const Activity = require('../models/Activity');
const HealthRecord = require('../models/HealthRecord');
const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');
const FeeType = require('../models/FeeType');
const SchoolServiceBooking = require('../models/SchoolServiceBooking');
const Service = require('../models/SchoolService');
const SchoolAttendance = require('../models/SchoolAttendance');
const SchoolReminder = require('../models/SchoolReminder');
const Event = require('../models/Event');
const RevenueSchedule = require('../models/RevenueSchedule');
const { calculateServiceFee } = require('../helpers/serviceCalculation');
const { applyAdmissionPayment } = require('../helpers/schoolPaymentHelper');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { formatDateToISTStr, getTodayIST } = require('../utils/date');

const findLoggedInStudent = async (req) => {
  const user = await User.findById(req.user.id).lean();
  if (!user || user.role !== 'Student') {
    throw new Error('Student not found');
  }

  const studentDoc = await Student.findById(user.linkedId).lean();
  if (!studentDoc) {
    throw new Error('Admission record not found');
  }

  const student = await SchoolAdmission.findOne({
    _id: studentDoc.admissionId,
    organizationId: req.organizationId,
  });
  if (!student) {
    throw new Error('Admission record not found');
  }

  return student;
};

exports.getProfile = async (req, res) => {
  try {
    const student = await findLoggedInStudent(req);

    return res.json({
      success: true,
      profile: {
        fullName: student.fullName || '',
        admissionId: student.admissionId || '',
        mobile: student.mobile || '',
        age: student.age || 0,
        gender: student.gender || '',
        dob: student.dob || '',
        bloodGroup: student.bloodGroup || '',
        fullAddress: student.fullAddress || '',
        status: student.status || '',
        photo: student.photo || null,
        qrCode: student.qrCode || '',
        registrationDate: student.registrationDate || '',

        physicalDisability: student.physicalDisability || '',
        mainIllness: student.mainIllness || '',
        seriousDisease: student.seriousDisease || '',
        regularMedication: student.regularMedication || '',
        healthDetails: student.healthDetails || '',

        education: student.education || '',
        educationPlace: student.educationPlace || '',
        yearsOfService: student.yearsOfService || '',
        servicePlace: student.servicePlace || '',
        occupationType: student.occupationType || '',

        primaryContact: {
          name: student.primaryContactName || '',
          relation: student.primaryRelation || '',
          phone: student.primaryPhone || '',
        },

        secondaryContact: {
          name: student.secondaryContactName || '',
          relation: student.secondaryRelation || '',
          phone: student.secondaryPhone || '',
        },
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const DAY_FIELDS = ['mondayActivityId', 'tuesdayActivityId', 'wednesdayActivityId', 'thursdayActivityId', 'fridayActivityId', 'saturdayActivityId', 'sundayActivityId'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

exports.getActivities = async (req, res) => {
  try {
    await findLoggedInStudent(req);

    const activities = await Activity.find({
      organizationId: req.organizationId,
    })
      .select('name staffName createdAt')
      .sort({ name: 1 })
      .lean();

    return res.json({ success: true, activities });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getActivities error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHealthRecords = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const records = await HealthRecord.find({
      studentId: studentDoc._id,
      organizationId: req.organizationId,
    })
      .sort({ recordDate: -1 })
      .lean();

    const latestRecord = records.length > 0 ? records[0] : null;
    const history = records.map((r) => ({
      _id: r._id,
      recordDate: r.recordDate,
      recordType: r.recordType,
      hasReport: !!r.reportFile,
    }));

    return res.json({ success: true, latestRecord, history });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getHealthRecords error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHealthRecordById = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const record = await HealthRecord.findOne({
      _id: req.params.id,
      studentId: studentDoc._id,
      organizationId: req.organizationId,
    }).lean();

    if (!record) {
      return res.status(404).json({ success: false, message: 'Health record not found' });
    }

    if (!record.reportFile) {
      record.reportFile = null;
      record.reportFileName = null;
    }

    return res.json({ success: true, record });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getHealthRecordById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getFees = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const allotments = await FeeAllotment.find({
      studentId: studentDoc._id,
      organizationId: req.organizationId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const allotmentIds = allotments.map((a) => a._id);

    const payments = await FeePayment.find({
      allotmentId: { $in: allotmentIds },
      organizationId: req.organizationId,
    })
      .sort({ paymentDate: -1 })
      .lean();

    const paymentMap = new Map();
    for (const payment of payments) {
      const key = payment.allotmentId.toString();
      if (!paymentMap.has(key)) {
        paymentMap.set(key, []);
      }
      paymentMap.get(key).push(payment);
    }

    const feeHistory = allotments.map((allotment) => {
      const allotmentPayments = paymentMap.get(allotment._id.toString()) || [];
      const paidAmount = allotmentPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = Math.max(0, allotment.amount - paidAmount);
      const status = pendingAmount === 0 ? 'Paid' : 'Pending';

      return {
        allotmentId: allotment._id,
        feePlan: allotment.feePlan || '',
        description: allotment.description || '',
        totalFee: allotment.amount || 0,
        paidAmount,
        pendingAmount,
        dueDate: allotment.dueDate || '',
        status,
        payments: allotmentPayments.map((p) => ({
          _id: p._id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMode: p.paymentMode || '',
          transactionId: p.transactionId || '',
        })),
      };
    });

    return res.json({ success: true, feeHistory });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getFees error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getServices = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const bookings = await SchoolServiceBooking.find({
      admissionId: admission._id,
      organizationId: req.organizationId,
    })
      .populate('serviceId', 'serviceName oneDayFee')
      .sort({ startDate: -1 })
      .lean();

    const allotmentIds = bookings
      .map((b) => b.allotmentId)
      .filter(Boolean);

    const payments = await FeePayment.find({
      allotmentId: { $in: allotmentIds },
      organizationId: req.organizationId,
    })
      .sort({ paymentDate: -1 })
      .lean();

    const paymentMap = new Map();
    for (const payment of payments) {
      const key = payment.allotmentId.toString();
      if (!paymentMap.has(key)) {
        paymentMap.set(key, []);
      }
      paymentMap.get(key).push(payment);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const services = bookings.map((booking) => {
      const svc = booking.serviceId || {};
      const endDate = new Date(booking.endDate);
      endDate.setHours(0, 0, 0, 0);

      let status, remainingDays, canRenew;

      if (booking.status === 'Cancelled') {
        status = 'Cancelled';
        remainingDays = 0;
        canRenew = false;
      } else if (endDate < today) {
        status = 'Expired';
        remainingDays = 0;
        canRenew = true;
      } else {
        remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        status = 'Active';
        canRenew = remainingDays <= 3;
      }

      let paidAmount = 0;
      let pendingAmount = 0;
      let paymentStatus = null;

      if (booking.allotmentId) {
        const allotmentPayments = paymentMap.get(booking.allotmentId.toString()) || [];
        paidAmount = allotmentPayments.reduce((sum, p) => sum + p.amount, 0);
        pendingAmount = Math.max(0, booking.totalFee - paidAmount);
        paymentStatus = pendingAmount === 0 ? 'Paid' : 'Pending';
      }

      return {
        _id: booking._id,
        serviceId: svc._id || booking.serviceId,
        serviceName: svc.serviceName || '',
        startDate: booking.startDate,
        endDate: booking.endDate,
        duration: booking.duration,
        perDayFee: svc.oneDayFee || booking.perDayFee,
        totalFee: booking.totalFee,
        status,
        remainingDays,
        canRenew,
        paymentStatus,
      };
    });

    return res.json({ success: true, services });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getServices error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAvailableServices = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const bookings = await SchoolServiceBooking.find({
      admissionId: admission._id,
      organizationId: req.organizationId,
    })
      .select('serviceId endDate status')
      .lean();

    const bookedServiceIds = bookings
      .filter((b) => b.status !== 'Cancelled')
      .map((b) => b.serviceId);

    const services = await Service.find({
      isActive: true,
      _id: { $nin: bookedServiceIds },
    })
      .select('serviceName oneDayFee')
      .sort({ serviceName: 1 })
      .lean();

    return res.json({ success: true, services });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getAvailableServices error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.calculateService = async (req, res) => {
  try {
    await findLoggedInStudent(req);

    const { serviceId, days, startDate } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required' });
    }

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' });
    }

    if (!Number.isInteger(Number(days)) || Number(days) <= 0) {
      return res.status(400).json({ success: false, message: 'Days must be a positive integer' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(startDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    }).lean();

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const { endDate, totalFee } = calculateServiceFee({
      oneDayFee: service.oneDayFee,
      days: Number(days),
      startDate,
    });

    return res.json({
      success: true,
      calculation: {
        serviceId: service._id,
        serviceName: service.serviceName,
        perDayFee: service.oneDayFee,
        days: Number(days),
        startDate,
        endDate,
        totalFee,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('calculateService error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createServiceOrder = async (req, res) => {
  try {
    await findLoggedInStudent(req);

    const { serviceId, days, startDate, payNow } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required' });
    }
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' });
    }
    if (!Number.isInteger(Number(days)) || Number(days) <= 0) {
      return res.status(400).json({ success: false, message: 'Days must be a positive integer' });
    }
    if (!payNow || Number(payNow) <= 0) {
      return res.status(400).json({ success: false, message: 'Pay now amount must be greater than 0' });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    }).lean();

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const { endDate, totalFee } = calculateServiceFee({
      oneDayFee: service.oneDayFee,
      days: Number(days),
      startDate,
    });

    const numPayNow = Number(payNow);

    if (numPayNow > totalFee) {
      return res.status(400).json({ success: false, message: 'Pay now cannot exceed total fee' });
    }

    const amount = Math.round(numPayNow * 100);

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum payable amount is ₹1' });
    }

    const pendingAmount = totalFee - numPayNow;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `svc_${service._id.toString().slice(-6)}_${Date.now()}`,
    });

    return res.json({
      success: true,
      order: {
        orderId: order.id,
        amount: numPayNow,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      summary: {
        serviceId: service._id,
        serviceName: service.serviceName,
        perDayFee: service.oneDayFee,
        days: Number(days),
        startDate,
        endDate,
        totalFee,
        paidNow: numPayNow,
        pendingAmount,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('createServiceOrder error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyServicePayment = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      serviceId,
      days,
      startDate,
      payNow,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment details' });
    }
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required' });
    }
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' });
    }
    if (!Number.isInteger(Number(days)) || Number(days) <= 0) {
      return res.status(400).json({ success: false, message: 'Days must be a positive integer' });
    }
    if (!payNow || Number(payNow) <= 0) {
      return res.status(400).json({ success: false, message: 'Pay now amount must be greater than 0' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // TEMP: Skip Razorpay signature verification for local Postman testing
    // TODO: Re-enable before production
// if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//   return res.status(400).json({
//     success: false,
//     message: 'Missing Razorpay payment details'
//   });
// }
//comment out above code after testing

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    }).lean();

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const { endDate, totalFee } = calculateServiceFee({
      oneDayFee: service.oneDayFee,
      days: Number(days),
      startDate,
    });

    const numPayNow = Number(payNow);

    if (numPayNow > totalFee) {
      return res.status(400).json({ success: false, message: 'Pay now cannot exceed total fee' });
    }

    const pendingAmount = totalFee - numPayNow;

    const allotment = await FeeAllotment.create({
      studentId: studentDoc._id,
      admissionId: admission._id,
      description: `${service.serviceName} Service`,
      feePlan: admission.feePlan || 'Monthly',
      amount: totalFee,
      organizationId: req.organizationId,
      status: numPayNow >= totalFee ? 'Paid' : 'Pending',
    });

    // ── RevenueSchedule: service booking (student app) ─────────────────
    try {
      const svcFee = Math.max(0, Number(totalFee) || 0);
      if (svcFee > 0 && startDate && endDate) {
        await RevenueSchedule.create({
          participantId: admission._id,
          organizationId: req.organizationId,
          sourceType: 'Service',
          sourceReferenceId: service._id,
          planId: service._id,
          planName: service.serviceName || 'Service',
          grossAmount: svcFee,
          discountAmount: 0,
          netAmount: svcFee,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          createdBy: req.user?.userId,
        });
      }
    } catch (revErr) {
      console.error('⚠️ Failed to create RevenueSchedule (Student service):', revErr.message);
    }

    await FeePayment.create({
      studentId: studentDoc._id,
      admissionId: admission._id,
      allotmentId: allotment._id,
      description: `${service.serviceName} Service`,
      amount: numPayNow,
      paymentDate: new Date(),
      paymentMode: 'Bank Transfer',
      transactionId: razorpay_payment_id,
      remarks: 'Service booked via Student App',
      organizationId: req.organizationId,
    });

    const sDate = new Date(startDate);
    const dates = [];
    const cursor = new Date(sDate);
    while (cursor < endDate) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const booking = await SchoolServiceBooking.create({
      admissionId: admission._id,
      serviceId: service._id,
      studentName: admission.fullName,
      startDate: sDate,
      endDate,
      duration: Number(days),
      perDayFee: service.oneDayFee,
      totalFee,
      paidAmount: numPayNow,
      paymentMode: 'Bank Transfer',
      paymentDate: new Date(),
      allotmentId: allotment._id,
      organizationId: req.organizationId,
      status: 'Active',
      dates,
    });

    admission.services.push({
      serviceId: service._id,
      startDate: sDate,
      endDate,
      days: Number(days),
      perDayFee: service.oneDayFee,
      totalFee,
    });

    admission.totalFee = (admission.totalFee || 0) + totalFee;
    admission.paidAmount = (admission.paidAmount || 0) + numPayNow;
    admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - (admission.paidAmount || 0));
    await admission.save();

    return res.json({
      success: true,
      message: 'Payment verified and service booked successfully',
      booking: {
        _id: booking._id,
        serviceName: service.serviceName,
        startDate: sDate,
        endDate,
        totalFee,
        paidAmount: numPayNow,
        pendingAmount,
        status: 'Active',
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('verifyServicePayment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

async function validateRenewalRequest(admission, bookingId, days, startDate) {
  if (!bookingId || !Number.isInteger(Number(days)) || Number(days) <= 0 || !startDate) {
    throw new Error('bookingId, positive days, and startDate are required');
  }

  const booking = await SchoolServiceBooking.findOne({
    _id: bookingId,
    admissionId: admission._id,
    organizationId: admission.organizationId,
  }).populate('serviceId', 'serviceName oneDayFee isActive');

  if (!booking) throw new Error('Booking not found');
  if (booking.status === 'Cancelled') throw new Error('Cannot renew a cancelled booking');
  if (!booking.serviceId) throw new Error('Linked service not found');
  if (!booking.serviceId.isActive) throw new Error('Service is no longer active');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingEndDate = new Date(booking.endDate);
  bookingEndDate.setHours(0, 0, 0, 0);
  const renewalStartDate = new Date(bookingEndDate);
  renewalStartDate.setDate(renewalStartDate.getDate() - 3);
  if (today < renewalStartDate) {
    throw new Error('Renewal is allowed only within 3 days of expiry or after expiry.');
  }

  const selectedStartDate = new Date(startDate);
  selectedStartDate.setHours(0, 0, 0, 0);
  if (selectedStartDate <= bookingEndDate) {
    throw new Error('Renewal start date must be after the current service end date.');
  }

  const { endDate, totalFee } = calculateServiceFee({
    oneDayFee: booking.serviceId.oneDayFee,
    days: Number(days),
    startDate,
  });

  return { booking, service: booking.serviceId, endDate, totalFee };
}

exports.calculateRenewal = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { bookingId, days, startDate } = req.body;
    const { booking, service, endDate, totalFee } = await validateRenewalRequest(admission, bookingId, days, startDate);

    return res.json({
      success: true,
      calculation: {
        bookingId: booking._id,
        serviceId: service._id,
        serviceName: service.serviceName,
        perDayFee: service.oneDayFee,
        days: Number(days),
        startDate,
        endDate,
        totalFee,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('calculateRenewal error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.createRenewServiceOrder = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { bookingId, days, startDate, payNow } = req.body;
    const { booking, service, endDate, totalFee } = await validateRenewalRequest(admission, bookingId, days, startDate);

    // TODO: Before creating order, check if a pending renewal already exists
    // for this booking (e.g., a ServiceRenewalRequest model or a
    // booking.renewalStatus field). Return 400 with
    // "A renewal payment is already pending for this service."
    // Implement this together with POST /services/renew/verify-payment.

    const numPayNow = Number(payNow);
    if (!numPayNow || numPayNow <= 0) {
      return res.status(400).json({ success: false, message: 'payNow must be greater than 0' });
    }
    if (numPayNow > totalFee) {
      return res.status(400).json({ success: false, message: 'payNow cannot exceed totalFee' });
    }

    const amount = Math.round(numPayNow * 100);
    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum payable amount is ₹1' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `svc_renew_${booking._id.toString().slice(-6)}_${Date.now()}`,
    });

    return res.json({
      success: true,
      order: {
        orderId: order.id,
        amount: numPayNow,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      summary: {
        bookingId: booking._id,
        serviceId: service._id,
        serviceName: service.serviceName,
        perDayFee: service.oneDayFee,
        days: Number(days),
        startDate,
        endDate,
        totalFee,
        paidNow: numPayNow,
        pendingAmount: totalFee - numPayNow,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('createRenewServiceOrder error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.verifyRenewServicePayment = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const {
      bookingId, days, startDate, payNow,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    } = req.body;

    // 1. Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // 2. Validate renewal request (reuses shared helper)
    const { booking, service, endDate, totalFee } =
      await validateRenewalRequest(admission, bookingId, days, startDate);

    const numPayNow = Number(payNow);
    if (!numPayNow || numPayNow <= 0) {
      return res.status(400).json({ success: false, message: 'payNow must be greater than 0' });
    }
    if (numPayNow > totalFee) {
      return res.status(400).json({ success: false, message: 'payNow cannot exceed totalFee' });
    }

    // 3. Find student
    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // 4. MongoDB transaction
    const session = await mongoose.startSession();
    const sDate = new Date(startDate);

    try {
      session.startTransaction();

      // FeeAllotment (new, not reused)
      const allotment = await FeeAllotment.create([{
        studentId: studentDoc._id,
        admissionId: admission._id,
        description: `${service.serviceName} Service Renewal (${days} Days)`,
        feePlan: admission.feePlan || 'Monthly',
        amount: totalFee,
        organizationId: req.organizationId,
        status: numPayNow >= totalFee ? 'Paid' : 'Pending',
      }], { session });

      // FeePayment
      await FeePayment.create([{
        studentId: studentDoc._id,
        admissionId: admission._id,
        allotmentId: allotment[0]._id,
        description: `${service.serviceName} Service Renewal (${days} Days)`,
        amount: numPayNow,
        paymentMode: 'Bank Transfer',
        paymentDate: new Date(),
        transactionId: razorpay_payment_id,
        remarks: 'Service renewed via Student App',
        organizationId: req.organizationId,
      }], { session });

      // Regenerate dates array
      const dates = [];
      const cursor = new Date(sDate);
      while (cursor < endDate) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }

      // Update existing booking — only service fields, not payment history
      booking.startDate = sDate;
      booking.endDate = endDate;
      booking.duration = Number(days);
      booking.perDayFee = service.oneDayFee;
      booking.totalFee = totalFee;
      booking.allotmentId = allotment[0]._id;
      booking.status = 'Active';
      booking.dates = dates;
      await booking.save({ session });

      // Update existing admission.services entry (match by serviceId)
      const serviceEntry = admission.services.find(
        s => s.serviceId.toString() === service._id.toString()
      );
      if (serviceEntry) {
        serviceEntry.startDate = sDate;
        serviceEntry.endDate = endDate;
        serviceEntry.days = Number(days);
        serviceEntry.perDayFee = service.oneDayFee;
        serviceEntry.totalFee = totalFee;
      }

      // Update admission totals (same pattern as verifyServicePayment)
      admission.totalFee = (admission.totalFee || 0) + totalFee;
      admission.paidAmount = (admission.paidAmount || 0) + numPayNow;
      admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - (admission.paidAmount || 0));
      await admission.save({ session });

      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction failed in verifyRenewServicePayment:', txErr.message);
      return res.status(500).json({ success: false, message: 'Failed to renew service. Please try again.' });
    }
    session.endSession();

    // ── RevenueSchedule: service renewal (student app) ────────────────────
    try {
      const svcFee = Math.max(0, Number(totalFee) || 0);
      if (svcFee > 0 && sDate && endDate) {
        await RevenueSchedule.create({
          participantId: admission._id,
          organizationId: req.organizationId,
          sourceType: 'Service',
          sourceReferenceId: service._id,
          planId: service._id,
          planName: service.serviceName || 'Service',
          grossAmount: svcFee,
          discountAmount: 0,
          netAmount: svcFee,
          startDate: new Date(sDate),
          endDate: new Date(endDate),
          createdBy: req.user?.userId,
        });
      }
    } catch (revErr) {
      console.error('⚠️ Failed to create RevenueSchedule (Student service renewal):', revErr.message);
    }

    return res.json({
      success: true,
      message: 'Service renewed successfully',
      booking: {
        _id: booking._id,
        serviceName: service.serviceName,
        startDate: sDate,
        endDate,
        totalFee,
        paidAmount: numPayNow,
        pendingAmount: totalFee - numPayNow,
        status: 'Active',
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('verifyRenewServicePayment error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const requestDate = req.query.date || getTodayIST();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const dateObj = new Date(requestDate + 'T00:00:00Z');
    const dayIndex = dateObj.getUTCDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const dayOfWeekIndex = dayMap[dayIndex];
    const dayFieldName = DAY_FIELDS[dayOfWeekIndex];
    const dayNameDisplay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];

    const timetableRows = admission.timetable || [];
    if (timetableRows.length === 0) {
      return res.json({
        success: true,
        date: requestDate,
        day: dayNameDisplay,
        summary: { present: 0, absent: 0, notMarked: 0, totalPeriods: 0 },
        periods: [],
      });
    }

    const periodIds = timetableRows.map(r => r.periodId).filter(Boolean);
    const activityIds = timetableRows.map(r => r[dayFieldName]).filter(Boolean);

    const [periods, activities, attendanceRecords] = await Promise.all([
      periodIds.length > 0
        ? TimeTable.find({ _id: { $in: periodIds } }).select('name startTime endTime').lean()
        : [],
      activityIds.length > 0
        ? Activity.find({ _id: { $in: activityIds } }).select('name staffName').lean()
        : [],
      SchoolAttendance.find({
        studentId: admission._id,
        attendanceDate: requestDate,
        organizationId: req.organizationId,
      }).populate('markedBy', 'fullName').lean(),
    ]);

    const periodMap = {};
    for (const p of periods) periodMap[p._id.toString()] = p;

    const activityMap = {};
    for (const a of activities) activityMap[a._id.toString()] = a;

    const attendanceMap = {};
    for (const a of attendanceRecords) attendanceMap[a.periodId.toString()] = a;

    let present = 0;
    let absent = 0;
    let notMarked = 0;

    const periodDetails = timetableRows.map(row => {
      const period = periodMap[row.periodId?.toString()] || {};
      const activityId = row[dayFieldName];
      const activity = activityMap[activityId?.toString()] || {};
      const attendance = attendanceMap[row.periodId?.toString()];

      let status;
      if (attendance) {
        status = attendance.status;
        if (status === 'Present') present++;
        else absent++;
      } else {
        status = 'Not Marked';
        notMarked++;
      }

      return {
        periodName: period.name || '',
        startTime: period.startTime || '',
        endTime: period.endTime || '',
        activityName: activity.name || '',
        staffName: activity.staffName || '',
        status,
        markedAt: attendance?.markedAt || null,
        markedBy: attendance?.markedBy?.fullName || '',
      };
    });

    periodDetails.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    return res.json({
      success: true,
      date: requestDate,
      day: dayNameDisplay,
      summary: { present, absent, notMarked, totalPeriods: timetableRows.length },
      periods: periodDetails,
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('getAttendance error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { title, description, type, date, time } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    if (!type) return res.status(400).json({ success: false, message: 'type is required' });
    if (!['OneTime', 'Daily'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid reminder type' });
    }
    if (!time) return res.status(400).json({ success: false, message: 'time is required' });

    const reminderDate = type === 'OneTime' ? new Date(date) : null;
    if (type === 'OneTime') {
      if (!date) return res.status(400).json({ success: false, message: 'date is required for OneTime reminders' });
      if (isNaN(reminderDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const reminder = await SchoolReminder.create({
      title: title.trim(),
      description: description || '',
      type,
      date: reminderDate,
      time,
      studentId: admission._id,
      organizationId: req.organizationId,
    });

    return res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      reminder,
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('createReminder error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const reminders = await SchoolReminder.find({
      studentId: admission._id,
      organizationId: req.organizationId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, reminders });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('getReminders error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { id } = req.params;
    const { title, description, type, date, time } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'title is required' });
    if (!type) return res.status(400).json({ success: false, message: 'type is required' });
    if (!['OneTime', 'Daily'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid reminder type' });
    }
    if (!time) return res.status(400).json({ success: false, message: 'time is required' });

    const reminderDate = type === 'OneTime' ? new Date(date) : null;
    if (type === 'OneTime') {
      if (!date) return res.status(400).json({ success: false, message: 'date is required for OneTime reminders' });
      if (isNaN(reminderDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const reminder = await SchoolReminder.findOne({
      _id: id,
      studentId: admission._id,
      organizationId: req.organizationId,
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    reminder.title = title.trim();
    reminder.description = description || '';
    reminder.type = type;
    reminder.date = reminderDate;
    reminder.time = time;

    await reminder.save();

    return res.json({
      success: true,
      message: 'Reminder updated successfully',
      reminder,
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('updateReminder error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { id } = req.params;

    const reminder = await SchoolReminder.findOne({
      _id: id,
      studentId: admission._id,
      organizationId: req.organizationId,
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    await reminder.deleteOne();

    return res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('deleteReminder error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMembership = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = admission.endDate ? new Date(admission.endDate) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let status = 'Active';
    let daysRemaining = 0;
    let canRenew = false;

    if (!endDate) {
      status = 'Active';
      daysRemaining = null;
      canRenew = false;
    } else if (endDate < today) {
      status = 'Expired';
      daysRemaining = 0;
      canRenew = true;
    } else {
      daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      status = 'Active';
      const renewalStart = new Date(endDate);
      renewalStart.setDate(renewalStart.getDate() - 3);
      canRenew = today >= renewalStart;
    }

    return res.json({
      success: true,
      membership: {
        plan: admission.feePlan || '',
        startDate: admission.startDate || null,
        endDate: admission.endDate || null,
        status,
        daysRemaining,
        canRenew,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('getMembership error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createPendingFeeOrder = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const { payNow } = req.body;

    if (!payNow || Number(payNow) <= 0) {
      return res.status(400).json({ success: false, message: 'Pay now amount must be greater than 0' });
    }

    const numPayNow = Number(payNow);
    const pendingAmount = admission.remainingAmount || 0;

    if (numPayNow > pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Pay now of ₹${numPayNow.toLocaleString('en-IN')} exceeds pending amount of ₹${pendingAmount.toLocaleString('en-IN')}`,
      });
    }

    const amount = Math.round(numPayNow * 100);

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum payable amount is ₹1' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `mem_${admission._id.toString().slice(-6)}_${Date.now()}`,
    });

    return res.json({
      success: true,
      order: {
        orderId: order.id,
        amount: numPayNow,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      summary: {
        totalFee: admission.totalFee || 0,
        paidAmount: admission.paidAmount || 0,
        pendingAmount,
        payNow: numPayNow,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('createPendingFeeOrder error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyPendingFeePayment = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payNow,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment details' });
    }
    if (!payNow || Number(payNow) <= 0) {
      return res.status(400).json({ success: false, message: 'Pay now amount must be greater than 0' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const numPayNow = Number(payNow);

    await applyAdmissionPayment({
      admission,
      student: studentDoc,
      amount: numPayNow,
      paymentMode: 'Bank Transfer',
      paymentDate: new Date(),
      description: 'Admission fee payment via Student App',
      transactionId: razorpay_payment_id,
      remarks: 'Paid via Student App',
      organizationId: req.organizationId,
    });

    const updatedAdmission = await SchoolAdmission.findById(admission._id).lean();

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      summary: {
        totalFee: updatedAdmission.totalFee || 0,
        paidAmount: updatedAdmission.paidAmount || 0,
        pendingAmount: updatedAdmission.remainingAmount || 0,
        paidNow: numPayNow,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('verifyPendingFeePayment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const VALID_FEE_PLANS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Annual'];

const planFieldMap = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  Quarterly: 'quarterly',
  HalfYearly: 'halfYearly',
  Annual: 'annual',
};

async function validateMembershipRenewal(admission, organizationId, feePlan, startDate) {
  if (!feePlan || !VALID_FEE_PLANS.includes(feePlan)) {
    throw new Error(`feePlan must be one of: ${VALID_FEE_PLANS.join(', ')}`);
  }

  if (!admission.feeTypeId) {
    throw new Error('No fee type assigned to this admission. Renewal not available.');
  }

  const feeType = await FeeType.findOne({ _id: admission.feeTypeId, organizationId }).lean();
  if (!feeType) {
    throw new Error('Fee type not found');
  }

  const planKey = planFieldMap[feePlan];
  const totalFee = feeType[planKey];
  if (!totalFee || totalFee <= 0) {
    throw new Error(`No fee amount defined for plan "${feePlan}" in the selected fee type.`);
  }

  const endDate = admission.endDate ? new Date(admission.endDate) : null;
  if (endDate) endDate.setHours(0, 0, 0, 0);

  if (!endDate) {
    throw new Error('No membership end date set. Renewal not available.');
  }

  let newStartDate;
  if (startDate) {
    newStartDate = new Date(startDate);
    if (isNaN(newStartDate.getTime())) {
      throw new Error('Invalid startDate format.');
    }
    newStartDate.setHours(0, 0, 0, 0);
    if (newStartDate <= endDate) {
      throw new Error('Renewal start date must be after the current membership end date.');
    }
  } else {
    newStartDate = new Date(endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
  }

  let newEndDate = new Date(newStartDate);
  switch (feePlan) {
    case 'Weekly':    newEndDate.setDate(newEndDate.getDate() + 7); break;
    case 'Monthly':   newEndDate.setMonth(newEndDate.getMonth() + 1); break;
    case 'Quarterly': newEndDate.setMonth(newEndDate.getMonth() + 3); break;
    case 'HalfYearly':newEndDate.setMonth(newEndDate.getMonth() + 6); break;
    case 'Annual':    newEndDate.setFullYear(newEndDate.getFullYear() + 1); break;
  }

  return { feeType, feePlan, startDate: newStartDate, endDate: newEndDate, totalFee };
}

exports.calculateMembershipRenewal = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { feePlan, startDate: requestStartDate } = req.body;
    const { feeType, startDate: computedStartDate, endDate, totalFee } =
      await validateMembershipRenewal(admission, req.organizationId, feePlan, requestStartDate);

    return res.json({
      success: true,
      calculation: {
        feeTypeId: feeType._id,
        plan: feePlan,
        startDate: formatDateToISTStr(computedStartDate),
        endDate: formatDateToISTStr(endDate),
        totalFee,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('calculateMembershipRenewal error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.createMembershipRenewalOrder = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const { feePlan, startDate: requestStartDate, payNow } = req.body;
    const { feeType, startDate: computedStartDate, endDate, totalFee } =
      await validateMembershipRenewal(admission, req.organizationId, feePlan, requestStartDate);

    const numPayNow = Number(payNow);
    if (!numPayNow || numPayNow <= 0) {
      return res.status(400).json({ success: false, message: 'payNow must be greater than 0' });
    }
    if (numPayNow > totalFee) {
      return res.status(400).json({ success: false, message: 'payNow cannot exceed totalFee' });
    }

    const amount = Math.round(numPayNow * 100);
    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum payable amount is ₹1' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `mem_renew_${admission.admissionId.slice(-6)}_${Date.now()}`,
    });

    return res.json({
      success: true,
      order: {
        orderId: order.id,
        amount: numPayNow,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      summary: {
        plan: feePlan,
        startDate: formatDateToISTStr(computedStartDate),
        endDate: formatDateToISTStr(endDate),
        totalFee,
        paidNow: numPayNow,
        pendingAmount: totalFee - numPayNow,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('createMembershipRenewalOrder error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.verifyMembershipRenewalPayment = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);
    const {
      feePlan, startDate: requestStartDate, payNow,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment details' });
    }

    const { feeType, startDate: computedStartDate, endDate, totalFee } =
      await validateMembershipRenewal(admission, req.organizationId, feePlan, requestStartDate);

    const numPayNow = Number(payNow);
    if (!numPayNow || numPayNow <= 0) {
      return res.status(400).json({ success: false, message: 'payNow must be greater than 0' });
    }
    if (numPayNow > totalFee) {
      return res.status(400).json({ success: false, message: 'payNow cannot exceed totalFee' });
    }

    const studentDoc = await Student.findOne({ admissionId: admission._id })
      .select('_id')
      .lean();
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const allotment = await FeeAllotment.create([{
        studentId: studentDoc._id,
        admissionId: admission._id,
        description: `Membership Renewal (${feePlan})`,
        feePlan,
        amount: totalFee,
        organizationId: req.organizationId,
        status: numPayNow >= totalFee ? 'Paid' : 'Pending',
      }], { session });

      await FeePayment.create([{
        studentId: studentDoc._id,
        admissionId: admission._id,
        allotmentId: allotment[0]._id,
        description: `Membership Renewal (${feePlan})`,
        amount: numPayNow,
        paymentMode: 'Bank Transfer',
        paymentDate: new Date(),
        transactionId: razorpay_payment_id,
        remarks: 'Membership renewed via Student App',
        organizationId: req.organizationId,
      }], { session });

      if (!admission.membershipHistory) {
        admission.membershipHistory = [];
      }
      admission.membershipHistory.push({
        feeTypeId: admission.feeTypeId,
        feePlan: admission.feePlan,
        startDate: admission.startDate,
        endDate: admission.endDate,
        renewedAt: new Date(),
      });

      admission.feeTypeId = feeType._id;
      admission.feePlan = feePlan;
      admission.startDate = computedStartDate;
      admission.endDate = endDate;

      if (admission.status === 'Inactive') {
        admission.status = 'Active';
      }

      admission.totalFee = (admission.totalFee || 0) + totalFee;
      admission.paidAmount = (admission.paidAmount || 0) + numPayNow;
      admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - (admission.paidAmount || 0));
      await admission.save({ session });

      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction failed in verifyMembershipRenewalPayment:', txErr.message);
      return res.status(500).json({ success: false, message: 'Failed to renew membership. Please try again.' });
    }
    session.endSession();

    // ── RevenueSchedule: membership renewal (student app) ─────────────────
    try {
      const netAmt = Math.max(0, Number(totalFee) || 0);
      if (netAmt > 0 && computedStartDate && endDate) {
        await RevenueSchedule.create({
          participantId: admission._id,
          organizationId: req.organizationId,
          sourceType: 'Admission',
          sourceReferenceId: admission._id,
          planId: feeType._id,
          planName: feePlan,
          grossAmount: netAmt,
          discountAmount: 0,
          netAmount: netAmt,
          startDate: new Date(computedStartDate),
          endDate: new Date(endDate),
          createdBy: req.user?.userId,
        });
      }
    } catch (revErr) {
      console.error('⚠️ Failed to create RevenueSchedule (Student renewal):', revErr.message);
    }

    const status = numPayNow >= totalFee ? 'Paid' : 'Pending';

    return res.json({
      success: true,
      message: 'Membership renewed successfully',
      membership: {
        plan: feePlan,
        startDate: formatDateToISTStr(computedStartDate),
        endDate: formatDateToISTStr(endDate),
        totalFee,
        paidAmount: numPayNow,
        pendingAmount: totalFee - numPayNow,
        status,
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('verifyMembershipRenewalPayment error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const student = await findLoggedInStudent(req);
    const rows = student.timetable || [];

    const periodIds = [];
    const activityIds = [];
    for (const row of rows) {
      if (row.periodId) periodIds.push(row.periodId);
      for (const field of DAY_FIELDS) {
        if (row[field]) activityIds.push(row[field]);
      }
    }

    const [periods, activities] = await Promise.all([
      periodIds.length > 0
        ? TimeTable.find({ _id: { $in: periodIds } }).select('name startTime endTime').lean()
        : Promise.resolve([]),
      activityIds.length > 0
        ? Activity.find({ _id: { $in: activityIds } }).select('name').lean()
        : Promise.resolve([]),
    ]);

    const periodMap = {};
    for (const p of periods) periodMap[p._id.toString()] = p;
    const activityMap = {};
    for (const a of activities) activityMap[a._id.toString()] = a;

    const timetable = rows.map((row) => {
      const period = periodMap[row.periodId?.toString()] || {};

      const dayEntries = {};
      for (let i = 0; i < DAY_NAMES.length; i++) {
        const dayName = DAY_NAMES[i];
        const activityId = row[DAY_FIELDS[i]];
        const activity = activityMap[activityId?.toString()] || {};
        dayEntries[dayName] = {
          activityId: activityId ? activityId.toString() : '',
          activityName: activity.name || '',
        };
      }

      return {
        periodId: row.periodId ? row.periodId.toString() : '',
        periodName: period.name || '',
        startTime: period.startTime || '',
        endTime: period.endTime || '',
        ...dayEntries,
      };
    });

    return res.json({ success: true, timetable });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getTimetable error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const admission = await findLoggedInStudent(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Membership
    const endDate = admission.endDate ? new Date(admission.endDate) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let membershipStatus = 'Active';
    let daysRemaining = 0;
    if (!endDate) {
      daysRemaining = null;
    } else if (endDate < today) {
      membershipStatus = 'Expired';
      daysRemaining = 0;
    } else {
      daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      membershipStatus = (admission.remainingAmount || 0) > 0 ? 'Payment Pending' : 'Active';
    }

    const membership = {
      plan: admission.feePlan || '',
      startDate: admission.startDate || null,
      endDate: admission.endDate || null,
      status: membershipStatus,
      daysRemaining,
      pendingAmount: admission.remainingAmount || 0,
    };

    // 2. Attendance — current month
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEndDate = new Date(year, month + 1, 0);
    const monthEndStr = formatDateToISTStr(monthEndDate);
    const monthName = today.toLocaleString('default', { month: 'long' });

    const attendanceRecords = await SchoolAttendance.find({
      studentId: admission._id,
      organizationId: req.organizationId,
      attendanceDate: { $gte: monthStartStr, $lte: monthEndStr },
    }).lean();

    let present = 0;
    for (const r of attendanceRecords) {
      if (r.status === 'Present') present++;
    }
    const total = attendanceRecords.length;
    const percentage = total === 0 ? 0 : Number(((present / total) * 100).toFixed(2));

    const attendance = { month: monthName, present, total, percentage };

    // 3. Reminders — today only
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const reminders = await SchoolReminder.find({
      studentId: admission._id,
      organizationId: req.organizationId,
      status: 'Active',
      $or: [
        { type: 'Daily' },
        { type: 'OneTime', date: { $gte: today, $lte: todayEnd } },
      ],
    }).sort({ createdAt: -1 }).lean();

    // 4. Today's schedule
    const dayIndexMap = [6, 0, 1, 2, 3, 4, 5];
    const dayIndex = dayIndexMap[today.getDay()];
    let todaySchedule = [];

    if (Array.isArray(admission.timetable) && admission.timetable.length > 0) {
      const todayField = DAY_FIELDS[dayIndex];
      const rows = admission.timetable;

      const todayPeriodIds = [];
      const todayActivityIds = [];
      for (const row of rows) {
        if (row.periodId) todayPeriodIds.push(row.periodId);
        if (row[todayField]) todayActivityIds.push(row[todayField]);
      }

      const [periods, activities] = await Promise.all([
        todayPeriodIds.length
          ? TimeTable.find({ _id: { $in: todayPeriodIds } })
              .select('name startTime endTime').lean()
          : [],
        todayActivityIds.length
          ? Activity.find({ _id: { $in: todayActivityIds } })
              .select('name staffName').lean()
          : [],
      ]);

      const periodMap = {};
      for (const p of periods) periodMap[p._id.toString()] = p;
      const activityMap = {};
      for (const a of activities) activityMap[a._id.toString()] = a;

      for (const row of rows) {
        const activityId = row[todayField];
        const activity = activityMap[activityId?.toString()];
        const period = periodMap[row.periodId?.toString()];
        todaySchedule.push({
          periodName: period?.startTime || '',
          activityName: activity?.name || '',
          staffName: activity?.staffName || '',
        });
      }

      todaySchedule.sort((a, b) => a.periodName.localeCompare(b.periodName));
    }

    // 5. This week events
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    if (dayOfWeek === 0) {
      monday.setDate(today.getDate() - 6);
    } else {
      monday.setDate(today.getDate() - (dayOfWeek - 1));
    }
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekEvents = await Event.find({
      organizationId: req.organizationId,
      date: { $gte: monday, $lte: sunday },
    }).sort({ date: 1 }).lean();

    return res.json({
      success: true,
      membership,
      attendance,
      reminders,
      todaySchedule,
      weekEvents,
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found')
      return res.status(404).json({ success: false, message: err.message });
    console.error('getDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
