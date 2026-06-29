// scripts/migrate-revenue-schedule.js
// One-time migration: creates RevenueSchedule rows for all active admissions
// and their services. Only covers current contracts — historical periods that
// were overwritten by renewals are NOT backfilled.

require("dotenv").config();
const mongoose = require("mongoose");

const SchoolAdmission = require("../models/SchoolAdmission");
const RevenueSchedule = require("../models/RevenueSchedule");

async function migrateRevenueSchedule() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const admissions = await SchoolAdmission.find({
      status: "Active",
    }).lean();

    console.log(`Found ${admissions.length} active admissions`);
    let created = 0;
    let skipped = 0;

    for (const admission of admissions) {
      try {
        // ── Check if RevenueSchedule already exists for this admission ──
        const existing = await RevenueSchedule.findOne({
          participantId: admission._id,
          sourceType: "Admission",
        });
        if (existing) {
          skipped++;
          continue;
        }

        // ── Main admission fee ──────────────────────────────────────────
        const mainGross = Math.max(0, Number(admission.feeAmount) || 0);
        const mainDiscount = Math.max(0, Number(admission.discount) || 0);
        const mainNet = Math.max(0, mainGross - mainDiscount);
        if (mainNet > 0 && admission.startDate && admission.endDate) {
          await RevenueSchedule.create({
            participantId: admission._id,
            organizationId: admission.organizationId,
            sourceType: "Admission",
            sourceReferenceId: admission._id,
            planId: admission.feeTypeId || undefined,
            planName: admission.feePlan || "Monthly",
            grossAmount: mainGross,
            discountAmount: mainDiscount,
            netAmount: mainNet,
            startDate: new Date(admission.startDate),
            endDate: new Date(admission.endDate),
            createdBy: "migration",
            remarks: "Created by migration script",
          });
          created++;
        }

        // ── Services ────────────────────────────────────────────────────
        if (admission.services && admission.services.length > 0) {
          for (const svc of admission.services) {
            const svcFee = Math.max(0, Number(svc.totalFee) || 0);
            if (svcFee > 0 && svc.startDate && svc.endDate) {
              await RevenueSchedule.create({
                participantId: admission._id,
                organizationId: admission.organizationId,
                sourceType: "Service",
                sourceReferenceId: svc.serviceId,
                planId: svc.serviceId,
                planName: "Service",
                grossAmount: svcFee,
                discountAmount: 0,
                netAmount: svcFee,
                startDate: new Date(svc.startDate),
                endDate: new Date(svc.endDate),
                createdBy: "migration",
                remarks: "Created by migration script",
              });
              created++;
            }
          }
        }
      } catch (admissionErr) {
        console.error(
          `Error processing admission ${admission.admissionId || admission._id}:`,
          admissionErr.message
        );
      }
    }

    console.log(`Migration complete: ${created} RevenueSchedule rows created, ${skipped} already existed`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateRevenueSchedule();
