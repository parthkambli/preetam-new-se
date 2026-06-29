const mongoose = require('mongoose');
const SchoolAdmission = require('../models/SchoolAdmission');
const Service = require('../models/SchoolService');
const SchoolServiceBooking = require('../models/SchoolServiceBooking');
const FeePayment = require('../models/FeePayment');
const FeeAllotment = require('../models/FeeAllotment');
const RevenueSchedule = require('../models/RevenueSchedule');
const Student = require('../models/Student');

async function expireOverdueBookings(organizationId) {
  const now = new Date();
  const expired = await SchoolServiceBooking.find({
    organizationId,
    status: 'Active',
    endDate: { $lt: now },
  });
  for (const booking of expired) {
    booking.status = 'Expired';
    await booking.save();
    await Service.findByIdAndUpdate(booking.serviceId, { $inc: { bookedCount: -1 } });
  }
}

/**
 * @desc    Book a service for an existing admission (separate collection)
 * @route   POST /api/school/service-bookings
 */
exports.createBooking = async (req, res) => {
  try {
    const { admissionId, serviceId, startDate, duration, paidAmount, paymentMode, paymentDate, responsibleStaff } = req.body;

    if (!admissionId) return res.status(400).json({ message: 'Admission is required.' });
    if (!serviceId) return res.status(400).json({ message: 'Service is required.' });
    if (!startDate) return res.status(400).json({ message: 'Start date is required.' });
    if (!duration || Number(duration) <= 0) return res.status(400).json({ message: 'Valid duration is required.' });

    const numDuration = Number(duration);
    const numPaid = Math.max(0, Number(paidAmount) || 0);
    const sDate = new Date(startDate);
    if (isNaN(sDate.getTime())) return res.status(400).json({ message: 'Invalid start date.' });

    const eDate = new Date(sDate);
    eDate.setDate(eDate.getDate() + numDuration);

    // ── Expire overdue bookings so counts are current ────────────
    await expireOverdueBookings(req.organizationId);

    // ── Find admission ───────────────────────────────────────────
    const admission = await SchoolAdmission.findOne({
      _id: admissionId,
      organizationId: req.organizationId,
    });
    if (!admission) return res.status(404).json({ message: 'Admission not found.' });

    // ── Find service ─────────────────────────────────────────────
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    if (!service.isActive) return res.status(400).json({ message: 'Service is not active.' });

    // ── Date-aware capacity check ────────────────────────────────
    const overlappingCount = await SchoolServiceBooking.countDocuments({
      serviceId: service._id,
      organizationId: req.organizationId,
      status: 'Active',
      startDate: { $lt: eDate },
      endDate: { $gt: sDate },
    });
    if (overlappingCount >= service.capacity) {
      return res.status(409).json({
        message: `Service is fully booked (${overlappingCount}/${service.capacity} seats taken) for the selected dates.`,
      });
    }

    // ── Duplicate active booking check (same admission + service) ─
    const existingActive = await SchoolServiceBooking.findOne({
      admissionId: admission._id,
      serviceId: service._id,
      status: 'Active',
      startDate: { $lt: eDate },
      endDate: { $gt: sDate },
    });
    if (existingActive) {
      return res.status(409).json({
        message: 'This student already has an active booking for this service in the selected date range.',
      });
    }

    // ── Generate dates[] array ──────────────────────────────────
    const dates = [];
    const cursor = new Date(sDate);
    while (cursor < eDate) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const totalFee = service.oneDayFee * numDuration;

    // ── Find student ───────────────────────────────────────────────
    const student = await Student.findOne({ admissionId: admission._id }).lean();

    // ── Transaction: create FeeAllotment + Booking + update Admission ──
    const session = await mongoose.startSession();
    let booking;
    try {
      session.startTransaction();

      // 1. Create FeeAllotment (one per booking, not cumulative)
      const allotment = await FeeAllotment.create([{
        studentId: student?._id,
        admissionId: admission._id,
        feeTypeId: admission.feeTypeId || undefined,
        description: `Service: ${service.serviceName}`,
        feePlan: admission.feePlan || 'Monthly',
        amount: totalFee,
        dueDate: admission.nextDueDate || null,
        organizationId: req.organizationId,
        status: 'Pending',
      }], { session });

      // 2. Create booking with allotmentId
      booking = await SchoolServiceBooking.create([{
        admissionId: admission._id,
        serviceId: service._id,
        studentName: admission.fullName,
        startDate: sDate,
        endDate: eDate,
        duration: numDuration,
        perDayFee: service.oneDayFee,
        totalFee,
        paidAmount: numPaid,
        paymentMode: numPaid > 0 ? (paymentMode || 'Cash') : undefined,
        paymentDate: numPaid > 0 ? (paymentDate || new Date()) : undefined,
        allotmentId: allotment[0]._id,
        responsibleStaff: responsibleStaff || null,
        organizationId: req.organizationId,
        dates,
      }], { session });

      // 3. Increment service bookedCount
      await Service.findByIdAndUpdate(
        service._id,
        { $inc: { bookedCount: 1 } },
        { session }
      );

      // 4. Push to admission.services + update totals
      admission.services.push({
        serviceId: service._id,
        startDate: sDate,
        endDate: eDate,
        days: numDuration,
        perDayFee: service.oneDayFee,
        totalFee,
      });
      admission.totalFee = (admission.totalFee || 0) + totalFee;

      // 5. Handle payment if paidAmount > 0
      if (numPaid > 0 && student) {
        await FeePayment.create([{
          studentId: student._id,
          admissionId: admission._id,
          allotmentId: allotment[0]._id,
          amount: numPaid,
          paymentMode: paymentMode || 'Cash',
          paymentDate: paymentDate || new Date(),
          description: `Service: ${service.serviceName}`,
          responsibleStaff: responsibleStaff || null,
          organizationId: req.organizationId,
        }], { session });

        admission.paymentHistory.push({
          amount: numPaid,
          paymentDate: paymentDate || new Date(),
          paymentMode: paymentMode || 'Cash',
          description: `Service: ${service.serviceName}`,
          responsibleStaff: responsibleStaff || null,
        });

        if (numPaid >= totalFee) {
          await FeeAllotment.findByIdAndUpdate(
            allotment[0]._id,
            { status: 'Paid' },
            { session }
          );
        }

        const allPayments = await FeePayment.aggregate([
          { $match: { admissionId: admission._id, organizationId: req.organizationId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).session(session);
        const totalPaidForAdmission = allPayments[0]?.total || 0;
        admission.paidAmount = totalPaidForAdmission;
        admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - totalPaidForAdmission);
      } else {
        admission.remainingAmount = Math.max(0, (admission.totalFee || 0) - (admission.paidAmount || 0));
      }

      await admission.save({ session });

      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction failed in createBooking:', txErr.message);
      return res.status(500).json({ message: 'Failed to book service. Please try again.' });
    }
    session.endSession();

    // ── RevenueSchedule: service booking (after successful transaction) ──
    try {
      const svcFee = Math.max(0, Number(totalFee) || 0);
      if (svcFee > 0) {
        await RevenueSchedule.create({
          participantId: admission._id,
          organizationId: req.organizationId,
          sourceType: 'Service',
          sourceReferenceId: service._id,
          planId: service._id,
          planName: 'Service',
          grossAmount: svcFee,
          discountAmount: 0,
          netAmount: svcFee,
          startDate: new Date(sDate),
          endDate: new Date(eDate),
          createdBy: req.admin?.userId || req.staff?.userId || req.user?.userId,
        });
      }
    } catch (revErr) {
      console.error('⚠️ Failed to create RevenueSchedule (Service booking):', revErr.message);
    }

    // ── Populate for response ───────────────────────────────────
    const populated = await SchoolServiceBooking.findById(booking._id)
      .populate('serviceId', 'serviceName')
      .populate('responsibleStaff', 'fullName');

    res.status(201).json({ message: 'Service booked successfully.', booking: populated });
  } catch (err) {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format.' });
    }
    console.error('createBooking error:', err.message);
    res.status(500).json({ message: 'Failed to book service.' });
  }
};

/**
 * @desc    Get all service bookings with server-side pagination
 * @route   GET /api/school/service-bookings
 */
exports.getBookings = async (req, res) => {
  try {
    await expireOverdueBookings(req.organizationId);

    const { page = 1, limit = 10, serviceId, dateFrom, dateTo, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const match = { organizationId: req.organizationId };

    if (serviceId) match.serviceId = new mongoose.Types.ObjectId(serviceId);
    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) {
        match.$and = [
          { startDate: { $lt: new Date(dateTo) } },
          { endDate: { $gt: new Date(dateFrom) } },
        ];
      } else if (dateFrom) {
        match.endDate = { $gte: new Date(dateFrom) };
      } else if (dateTo) {
        match.startDate = { $lte: new Date(dateTo) };
      }
    }
    if (search) {
      match.studentName = { $regex: search, $options: 'i' };
    }

    const [result] = await SchoolServiceBooking.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $lookup: {
                from: 'services',
                localField: 'serviceId',
                foreignField: '_id',
                as: 'service',
              },
            },
            {
              $lookup: {
                from: 'fitnessstaffs',
                localField: 'responsibleStaff',
                foreignField: '_id',
                as: 'staff',
              },
            },
            {
              $addFields: {
                serviceName: { $arrayElemAt: ['$service.serviceName', 0] },
                staffName: { $arrayElemAt: ['$staff.fullName', 0] },
              },
            },
            { $project: { service: 0, staff: 0 } },
          ],
        },
      },
    ]);

    const total = result?.metadata?.[0]?.total || 0;
    const bookings = result?.data || [];

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('getBookings error:', err.message);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

/**
 * @desc    Cancel a booking
 * @route   PATCH /api/school/service-bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    await expireOverdueBookings(req.organizationId);

    const booking = await SchoolServiceBooking.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId, status: 'Active' },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Active booking not found.' });

    await Service.findByIdAndUpdate(booking.serviceId, { $inc: { bookedCount: -1 } });

    res.json({ message: 'Booking cancelled successfully.', booking });
  } catch (err) {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid booking ID format.' });
    }
    console.error('cancelBooking error:', err.message);
    res.status(500).json({ message: 'Failed to cancel booking.' });
  }
};

/**
 * @desc    Get available seats for a service on given dates
 * @route   GET /api/school/service-bookings/seats/:serviceId
 */
exports.getAvailableSeats = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found.' });

    const { startDate, endDate } = req.query;
    let bookedCount;
    if (startDate && endDate) {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
        bookedCount = await SchoolServiceBooking.countDocuments({
          serviceId: service._id,
          status: 'Active',
          startDate: { $lt: eDate },
          endDate: { $gt: sDate },
        });
      } else {
        bookedCount = service.bookedCount || 0;
      }
    } else {
      bookedCount = service.bookedCount || 0;
    }

    res.json({
      serviceId: service._id,
      serviceName: service.serviceName,
      capacity: service.capacity,
      bookedCount,
      availableSeats: Math.max(0, service.capacity - bookedCount),
    });
  } catch (err) {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID format.' });
    }
    console.error('getAvailableSeats error:', err.message);
    res.status(500).json({ message: 'Failed to check availability.' });
  }
};

/**
 * @desc    Get students by service + date range (for Services dashboard)
 * @route   GET /api/school/service-bookings/students
 * @query   serviceId, fromDate, toDate
 */
exports.getServiceStudents = async (req, res) => {
  try {
    const { serviceId, fromDate, toDate } = req.query;
    if (!serviceId || !fromDate || !toDate) {
      return res.status(400).json({ message: 'serviceId, fromDate, and toDate query params required' });
    }

    const sDate = new Date(fromDate);
    const eDate = new Date(toDate);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    const bookings = await SchoolServiceBooking.find({
      organizationId: req.organizationId,
      serviceId: new mongoose.Types.ObjectId(serviceId),
      status: 'Active',
      startDate: { $lt: eDate },
      endDate: { $gt: sDate },
    })
      .populate('admissionId', 'admissionId')
      .select('studentName startDate endDate admissionId')
      .lean();

    const students = bookings.map(b => ({
      admissionId: b.admissionId?.admissionId || 'N/A',
      studentName: b.studentName,
      startDate: b.startDate,
      endDate: b.endDate,
    }));

    res.json({ students });
  } catch (err) {
    console.error('getServiceStudents error:', err.message);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
};
