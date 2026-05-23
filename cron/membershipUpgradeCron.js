const cron = require("node-cron");
const FitnessMember = require("../models/FitnessMember");

const { getTodayIST } = require("../utils/date");

// Runs every day at 1:00 AM IST
cron.schedule(
  "0 1 * * *",
  async () => {
    try {
      console.log("Running membership upgrade cron...");

      const todayIST = getTodayIST();

      // IST start/end of day
      const startOfDay = new Date(
        `${todayIST}T00:00:00.000+05:30`
      );

      const endOfDay = new Date(
        `${todayIST}T23:59:59.999+05:30`
      );

      // Find members whose root upgradeAt is today
      const members = await FitnessMember.find({
        upgradeAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      console.log(`Found ${members.length} members`);

      for (const member of members) {
        // ====================================
        // DOWNGRADE TO ACTIVITY
        // ====================================
        if (member.upgrade === "Activity") {
          member.membershipPass = null;
          member.numberOfPersons = 1;

          console.log(
            `Downgraded ${member.memberId} to Activity`
          );
        }

        // ====================================
        // UPGRADE TO MEMBERSHIP PASS
        // ====================================
        if (member.upgrade === "Membership Pass") {

          // Find activityFee where activity = null
          const membershipActivityFee =
            member.activityFees.find(
              (af) => !af.activity
            );

          if (membershipActivityFee?.feeType) {
            member.membershipPass =
              membershipActivityFee.feeType;

            console.log(
              `Upgraded ${member.memberId} to Membership Pass`
            );
          } else {
            console.log(
              `No membership feeType found for ${member.memberId}`
            );
          }

          // numberOfPersons remains unchanged
        }

        // Clear upgrade fields after execution
        member.upgrade = null;
        member.upgradeAt = null;

        console.log({
        beforeSave: {
          membershipPass: member.membershipPass,
          numberOfPersons: member.numberOfPersons,
          upgrade: member.upgrade,
          upgradeAt: member.upgradeAt,
        },
      });

        await member.save();
      }

      console.log("Membership upgrade cron completed");
    } catch (err) {
      console.error(
        "Membership upgrade cron error:",
        err
      );
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);