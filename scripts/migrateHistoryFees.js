// scripts/migrateHistoryFees.js

require("dotenv").config();
const mongoose = require("mongoose");

const FitnessMember = require("../models/FitnessMember");
const FeePayment = require("../models/FitnessFeePayment");

async function migrateHistoryFees() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const members = await FitnessMember.find();

    console.log(`Found ${members.length} members`);

    let updatedCount = 0;

    for (const member of members) {
      try {
        // Skip if already migrated
        if (member.historyFees?.length > 0) {
          console.log(
            `Skipping ${member.memberId} - history already exists`
          );
          continue;
        }

        const payments = await FeePayment.find({
          memberId: member._id,
        })
          .sort({
            paymentDate: 1,
            createdAt: 1,
          })
          .lean();

        // Need at least 2 payments to have history
        if (payments.length <= 1) {
          console.log(
            `Skipping ${member.memberId} - no history found`
          );
          continue;
        }

        const historyFees = [];

        // Everything except latest payment becomes history
        for (let i = 0; i < payments.length - 1; i++) {
          const payment = payments[i];

          historyFees.push({
            plan: payment.feePlan || "Monthly",

            planFee: Number(payment.amount) || 0,
            discount: 0,
            finalAmount: Number(payment.amount) || 0,

            paymentStatus: "Paid",

            paymentMode: payment.paymentMode || "",

            paymentDate: payment.paymentDate || null,

            // We don't have actual dates anymore
            startDate: payment.paymentDate || null,
            endDate: payment.paymentDate || null,

            membershipStatus: "Inactive",

            planNotes: "Migrated from payment history",

            migrated: true,
          });
        }

        await FitnessMember.updateOne(
          { _id: member._id },
          {
            $set: {
              historyFees,
            },
          }
        );

        updatedCount++;

        console.log(
          `Migrated ${member.memberId} (${historyFees.length} records)`
        );
      } catch (err) {
        console.error(
          `Failed member ${member.memberId}:`,
          err.message
        );
      }
    }

    console.log("");
    console.log(
      `Migration Complete. Updated ${updatedCount} members`
    );

    process.exit(0);
  } catch (err) {
    console.error("Migration Failed:", err);
    process.exit(1);
  }
}

migrateHistoryFees();