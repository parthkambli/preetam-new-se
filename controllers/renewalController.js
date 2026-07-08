const SchoolAdmission = require('../models/SchoolAdmission');
const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const SchoolFeeRenewal = require('../models/SchoolFeeRenewal');
const ServiceRenewal = require('../models/ServiceRenewal');
const SchoolServiceBooking = require('../models/SchoolServiceBooking');
const RevenueSchedule = require('../models/RevenueSchedule');
const TimeTable = require('../models/schoolPeriod');
const { getTodayIST, formatDateToISTStr } = require('../utils/date');
const {
  computeTimetableActivityCounts,
  buildOccupancyInc,
} = require('../helpers/occupancyHelpers');

const getPlanEndDate = (startDate, feePlan) => {
  const start = new Date(startDate);
  switch (feePlan) {
    case 'Daily': return start;
    case 'Weekly': return new Date(start.setDate(start.getDate() + 7));
    case 'Monthly': return new Date(start.setMonth(start.getMonth() + 1));
    case 'Quarterly': return new Date(start.setMonth(start.getMonth() + 3));
    case 'HalfYearly': return new Date(start.setMonth(start.getMonth() + 6));
    case 'Annual': return new Date(start.setFullYear(start.getFullYear() + 1));
    default: return new Date(start.setMonth(start.getMonth() + 1));
  }
};

exports.getExpiring = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const admissions = await SchoolAdmission.find({
      organizationId: req.organizationId,
    }).select('fullName admissionId feePlan feeTypeId startDate endDate services status')
      .populate('services.serviceId', 'serviceName');

    const expiring = admissions.map(adm => {
      const feeExpired = adm.endDate && adm.endDate < now;
      const feeExpiring = adm.endDate && adm.endDate <= future;

      const expiringServices = (adm.services || [])
        .map((svc, index) => ({
          index,
          serviceId: svc.serviceId,
          serviceName: svc.serviceId?.serviceName || '',
          startDate: svc.startDate,
          endDate: svc.endDate,
          days: svc.days,
          perDayFee: svc.perDayFee,
          totalFee: svc.totalFee,
          expired: svc.endDate && svc.endDate < now,
          expiring: svc.endDate && svc.endDate <= future && svc.endDate >= now,
        }))
        .filter(s => s.expiring || s.expired);

      return {
        _id: adm._id,
        admissionId: adm.admissionId,
        fullName: adm.fullName,
        feePlan: adm.feePlan,
        feeTypeId: adm.feeTypeId,
        startDate: adm.startDate,
        endDate: adm.endDate,
        status: adm.status,
        feeExpired,
        feeExpiring: feeExpiring && !feeExpired,
        hasExpiringFee: feeExpiring,
        expiringServices: expiringServices.length > 0 ? expiringServices : [],
        hasExpiringServices: expiringServices.length > 0,
      };
    }).filter(adm => adm.hasExpiringFee || adm.hasExpiringServices);

    res.json({ data: expiring });
  } catch (err) {
    console.error('Error fetching expiring renewals:', err.message);
    res.status(500).json({ message: 'Server error while fetching expiring renewals' });
  }
};

exports.renew = async (req, res) => {
  try {
    const { admissionId, renewals } = req.body;

    if (!admissionId || !renewals || !Array.isArray(renewals) || renewals.length === 0) {
      return res.status(400).json({ message: 'admissionId and renewals array are required' });
    }

    const admission = await SchoolAdmission.findOne({
      _id: admissionId,
      organizationId: req.organizationId,
    });

    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    const student = await Student.findOne({ admissionId: admission._id });

    const createdBy = req.admin?.userId || req.staff?.userId || req.user?.userId;
    const results = [];
    let totalPaidFromRenewal = 0;
    let totalNewAmount = 0;

    for (const item of renewals) {
      if (item.type === 'fee') {
        const oldFeePlan = admission.feePlan;
        const oldStartDate = admission.startDate;
        const oldEndDate = admission.endDate;
        const newFeePlan = item.newFeePlan || oldFeePlan;
        const newStartDate = new Date(item.newStartDate);
        const newEndDate = item.newEndDate
          ? new Date(item.newEndDate)
          : getPlanEndDate(newStartDate, newFeePlan);

        if (oldEndDate && newStartDate <= oldEndDate) {
          return res.status(400).json({
            message: `New start date must be after current end date (${oldEndDate.toISOString().split('T')[0]})`,
          });
        }

        const amount = item.amount || admission.totalFee || 0;
        totalNewAmount += amount;

        const allotment = await FeeAllotment.create({
          studentId: student?._id,
          admissionId: admission._id,
          feeTypeId: admission.feeTypeId || undefined,
          description: `Renewal - ${newFeePlan}`,
          feePlan: newFeePlan,
          amount,
          status: 'Pending',
          organizationId: req.organizationId,
        });

        await SchoolFeeRenewal.create({
          admissionId: admission._id,
          oldFeePlan, oldStartDate, oldEndDate,
          newFeePlan, newStartDate, newEndDate,
          amount,
          organizationId: req.organizationId,
          createdBy,
        });

        // ── RevenueSchedule: fee renewal ─────────────────────────────────────
        try {
          const netAmt = Math.max(0, Number(amount) || 0);
          if (netAmt > 0 && newStartDate && newEndDate) {
            await RevenueSchedule.create({
              participantId: admission._id,
              organizationId: req.organizationId,
              sourceType: 'Admission',
              sourceReferenceId: admission._id,
              planId: admission.feeTypeId || undefined,
              planName: newFeePlan,
              grossAmount: netAmt,
              discountAmount: 0,
              netAmount: netAmt,
              startDate: new Date(newStartDate),
              endDate: new Date(newEndDate),
              createdBy,
            });
          }
        } catch (revErr) {
          console.error('⚠️ Failed to create RevenueSchedule (Renewal fee):', revErr.message);
        }

        admission.feePlan = newFeePlan;
        admission.startDate = newStartDate;
        admission.endDate = newEndDate;

        if (item.payment && Number(item.payment.amount) > 0) {
          const p = item.payment;
          const numAmount = Number(p.amount);
          totalPaidFromRenewal += numAmount;

          await FeePayment.create({
            studentId: student?._id,
            admissionId: admission._id,
            allotmentId: allotment._id,
            amount: numAmount,
            paymentMode: p.paymentMode || 'Cash',
            paymentDate: p.paymentDate || new Date(),
            description: p.description || `Renewal - ${newFeePlan}`,
            responsibleStaff: p.responsibleStaff || null,
            organizationId: req.organizationId,
          });

          if (numAmount >= amount) {
            await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
          }

          admission.paymentHistory.push({
            amount: numAmount,
            paymentDate: p.paymentDate || new Date(),
            paymentMode: p.paymentMode || 'Cash',
            description: p.description || `Renewal - ${newFeePlan}`,
            responsibleStaff: p.responsibleStaff || null,
          });
        }

        results.push({
          type: 'fee',
          allotmentId: allotment._id,
          feePlan: newFeePlan,
          startDate: newStartDate,
          endDate: newEndDate,
          amount,
        });

      } else if (item.type === 'service') {
        const svcIndex = item.serviceIndex;
        if (svcIndex === undefined || svcIndex === null || !admission.services[svcIndex]) {
          return res.status(400).json({ message: `Invalid serviceIndex: ${svcIndex}` });
        }

        const oldSvc = admission.services[svcIndex];
        const newStartDate = new Date(item.newStartDate);
        const newEndDate = item.newEndDate
          ? new Date(item.newEndDate)
          : new Date(newStartDate.getTime() + (oldSvc.days || 30) * 24 * 60 * 60 * 1000);

        if (oldSvc.endDate && newStartDate <= oldSvc.endDate) {
          return res.status(400).json({
            message: `Service start date must be after current end date (${oldSvc.endDate.toISOString().split('T')[0]})`,
          });
        }

        const amount = item.amount || oldSvc.totalFee || 0;
        totalNewAmount += amount;

        admission.services[svcIndex].startDate = newStartDate;
        admission.services[svcIndex].endDate = newEndDate;
        admission.services[svcIndex].days = item.days || oldSvc.days;
        admission.services[svcIndex].perDayFee = item.perDayFee || oldSvc.perDayFee;
        admission.services[svcIndex].totalFee = amount;

        await ServiceRenewal.create({
          admissionId: admission._id,
          serviceIndex: svcIndex,
          serviceId: oldSvc.serviceId,
          oldStartDate: oldSvc.startDate,
          oldEndDate: oldSvc.endDate,
          newStartDate, newEndDate,
          amount,
          organizationId: req.organizationId,
          createdBy,
        });

        const allotment = await FeeAllotment.create({
          studentId: student?._id,
          admissionId: admission._id,
          description: `Service Renewal`,
          feePlan: admission.feePlan || 'Monthly',
          amount,
          status: 'Pending',
          organizationId: req.organizationId,
        });

        // ── Sync allotmentId to the booking being renewed ─────────
        await SchoolServiceBooking.findOneAndUpdate(
          {
            admissionId: admission._id,
            serviceId: oldSvc.serviceId,
            endDate: oldSvc.endDate,
            organizationId: req.organizationId,
          },
          { allotmentId: allotment._id }
        );

        // ── RevenueSchedule: service renewal ─────────────────────────────────
        try {
          const svcNet = Math.max(0, Number(amount) || 0);
          if (svcNet > 0 && newStartDate && newEndDate) {
            await RevenueSchedule.create({
              participantId: admission._id,
              organizationId: req.organizationId,
              sourceType: 'Service',
              sourceReferenceId: oldSvc.serviceId,
              planId: oldSvc.serviceId,
              planName: 'Service',
              grossAmount: svcNet,
              discountAmount: 0,
              netAmount: svcNet,
              startDate: new Date(newStartDate),
              endDate: new Date(newEndDate),
              createdBy,
            });
          }
        } catch (revErr) {
          console.error('⚠️ Failed to create RevenueSchedule (Service renewal):', revErr.message);
        }

        if (item.payment && Number(item.payment.amount) > 0) {
          const p = item.payment;
          const numAmount = Number(p.amount);
          totalPaidFromRenewal += numAmount;

          await FeePayment.create({
            studentId: student?._id,
            admissionId: admission._id,
            allotmentId: allotment._id,
            amount: numAmount,
            paymentMode: p.paymentMode || 'Cash',
            paymentDate: p.paymentDate || new Date(),
            description: p.description || 'Service Renewal',
            responsibleStaff: p.responsibleStaff || null,
            organizationId: req.organizationId,
          });

          if (numAmount >= amount) {
            await FeeAllotment.findByIdAndUpdate(allotment._id, { status: 'Paid' });
          }

          admission.paymentHistory.push({
            amount: numAmount,
            paymentDate: p.paymentDate || new Date(),
            paymentMode: p.paymentMode || 'Cash',
            description: p.description || 'Service Renewal',
            responsibleStaff: p.responsibleStaff || null,
          });
        }

        results.push({
          type: 'service',
          serviceIndex: svcIndex,
          allotmentId: allotment._id,
          startDate: newStartDate,
          endDate: newEndDate,
          amount,
        });
      }
    }

    // ── Reactivate admission if it was Inactive (renewal — skip capacity validation) ──
    if (admission.status === 'Inactive') {
      const todayStr = getTodayIST();
      const startStr = admission.startDate ? formatDateToISTStr(admission.startDate) : '';
      if (startStr && startStr <= todayStr) {
        admission.status = 'Active';
        const counts = computeTimetableActivityCounts(admission.timetable);
        const incMap = buildOccupancyInc(counts);
        const ops = Object.entries(incMap).map(([pid, inc]) => ({
          updateOne: { filter: { _id: pid }, update: { $inc: inc } }
        }));
        if (ops.length > 0) await TimeTable.bulkWrite(ops);
      }
    }

    admission.totalFee = (admission.totalFee || 0) + totalNewAmount;
    admission.paidAmount = (admission.paidAmount || 0) + totalPaidFromRenewal;
    admission.remainingAmount = Math.max(0, admission.totalFee - admission.paidAmount);
    await admission.save();

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    console.error('Error processing renewal:', err.message);
    res.status(500).json({ message: 'Failed to process renewal' });
  }
};
