// scripts/backfillMemberSlots.js

require("dotenv").config();

const connectDB = require("../config/db");

const FitnessMember = require("../models/FitnessMember");
const FitnessBooking = require("../models/FitnessBooking");
const FitnessActivity = require("../models/FitnessActivity");

const run = async () => {
  try {
    await connectDB();

    const members = await FitnessMember.find({
      activityFees: {
        $elemMatch: {
          slot: { $exists: false },
        },
      },
    });

    console.log(`Found ${members.length} members`);

    let totalUpdated = 0;

    for (const member of members) {
      let updated = false;

      console.log("\n========================");
      console.log(`MEMBER: ${member.name}`);

      for (let i = 0; i < member.activityFees.length; i++) {
        const af = member.activityFees[i];

       if (af.slot?.slotId) {
        console.log(`Activity ${i}: valid slot already exists`);
        continue;
      }

        const booking = await FitnessBooking.findOne({
          memberId: member._id,
          activityFeeIndex: i,
        });

        if (!booking) {
          console.log(`Activity ${i}: booking not found`);
          continue;
        }

        if (!booking.slotId) {
          console.log(`Activity ${i}: booking has no slotId`);
          continue;
        }

        let label = "Unknown Slot";

        // OPTIONAL lookup for proper label
        const activity = await FitnessActivity.findById(
          af.activity
        );

        if (activity?.slots?.length) {
          const matchedSlot = activity.slots.find(
            (s) =>
              s._id.toString() ===
              booking.slotId.toString()
          );

          if (matchedSlot) {
            label = `${matchedSlot.startTime} - ${matchedSlot.endTime}`;
          }
        }

        // Inject even if slot metadata no longer exists
        member.activityFees[i].slot = {
          slotId: booking.slotId,
          label,
        };

        member.markModified("activityFees");

        updated = true;
        totalUpdated++;

        console.log(
          `Injected slot into ${member.name} activity ${i}`
        );
      }

      if (updated) {
        await member.save();

        console.log(`Saved ${member.name}`);
      }
    }

    console.log("\n========================");
    console.log(`DONE`);
    console.log(`Total Updated: ${totalUpdated}`);
    console.log("========================");

    process.exit(0);

  } catch (err) {
    console.error("SCRIPT ERROR:", err);
    process.exit(1);
  }
};

run();