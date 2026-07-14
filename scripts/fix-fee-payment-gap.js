// scripts/fix-fee-payment-gap.js
// One-time migration: creates missing FeePayment records for initial payments
// made during admission creation that were never tracked as FeePayments.
//
// Usage:
//   node scripts/fix-fee-payment-gap.js --dry-run   (preview only, no changes)
//   node scripts/fix-fee-payment-gap.js              (apply changes)

require('dotenv').config();
const mongoose = require('mongoose');

const SchoolAdmission = require('../models/SchoolAdmission');
const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');

const isDryRun = process.argv.includes('--dry-run');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
    console.log('');

    const admissions = await SchoolAdmission.find({
      paidAmount: { $gt: 0 },
      organizationId: { $exists: true, $ne: null },
    }).lean();

    console.log(`Found ${admissions.length} admissions with paidAmount > 0`);

    let fixedCount = 0;
    let skippedCount = 0;
    let totalPaymentsCreated = 0;
    let totalAmount = 0;

    for (const admission of admissions) {
      try {
        const orgId = admission.organizationId;

        // 1. Get sum of existing FeePayments for this admission
        const existingPayments = await FeePayment.aggregate([
          { $match: { admissionId: admission._id, organizationId: orgId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const feePaymentTotal = existingPayments[0]?.total || 0;

        // 2. Calculate uncovered amount
        const uncovered = Number(admission.paidAmount) - feePaymentTotal;

        if (uncovered <= 0) {
          skippedCount++;
          continue;
        }

        // 3. Safety: don't create more than totalFee
        const safeAmount = Math.min(uncovered, Number(admission.totalFee) || uncovered);

        if (safeAmount <= 0) {
          skippedCount++;
          continue;
        }

        // 4. Find the FeeAllotment for this admission
        const allotment = await FeeAllotment.findOne({
          admissionId: admission._id,
          organizationId: orgId,
        }).lean();

        if (!allotment) {
          console.log(`  SKIP [${admission.admissionId || admission._id}] - No FeeAllotment found (admissionId: ${admission._id})`);
          skippedCount++;
          continue;
        }

        console.log(`  FIX  [${admission.admissionId || admission._id}]`);
        console.log(`        paidAmount on admission: ${admission.paidAmount}`);
        console.log(`        existing FeePayment total: ${feePaymentTotal}`);
        console.log(`        uncovered amount: ${uncovered}`);
        console.log(`        creating FeePayment: ${safeAmount}`);

        if (!isDryRun) {
          await FeePayment.create({
            studentId: admission._id,
            admissionId: admission._id,
            allotmentId: allotment._id,
            description: 'Initial payment at admission (migrated)',
            amount: safeAmount,
            paymentDate: admission.registrationDate || admission.createdAt || new Date(),
            paymentMode: admission.paymentMode || 'Cash',
            organizationId: orgId,
          });
        }

        fixedCount++;
        totalPaymentsCreated++;
        totalAmount += safeAmount;

        console.log(`        ✓ ${isDryRun ? '(dry run - not saved)' : 'FeePayment created'}`);
        console.log('');
      } catch (err) {
        console.error(`  ERROR [${admission.admissionId || admission._id}]: ${err.message}`);
      }
    }

    console.log('='.repeat(60));
    console.log(`Migration ${isDryRun ? 'Preview' : 'Complete'}`);
    console.log(`  Admissions scanned:    ${admissions.length}`);
    console.log(`  Already correct:       ${skippedCount}`);
    console.log(`  ${isDryRun ? 'Would fix' : 'Fixed'}:            ${fixedCount}`);
    console.log(`  FeePayments created:   ${totalPaymentsCreated}`);
    console.log(`  Total amount covered:  ₹${totalAmount.toLocaleString('en-IN')}`);
    console.log('='.repeat(60));

    if (isDryRun) {
      console.log('');
      console.log('This was a DRY RUN. No changes were made.');
      console.log('Run without --dry-run to apply changes:');
      console.log('  node scripts/fix-fee-payment-gap.js');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
