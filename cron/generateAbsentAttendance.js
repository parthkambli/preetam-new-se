const cron = require("node-cron");

const FitnessMember =
  require("../models/FitnessMember");

const FitnessAttendance =
  require("../models/FitnessAttendance");

const { getTodayIST } =
  require("../utils/date");

cron.schedule(
  "00 0 * * *",
  async () => {

    try {

      console.log(
        "Running absent attendance cron..."
      );

      // ✅ Get today in YYYY-MM-DD IST format
      const todayIST =
        getTodayIST();

      // ✅ Fetch all active members
      const members =
        await FitnessMember.find({
          organizationId: "fitness",
          status: "Active"
        }).lean();

      for (const member of members) {

        // ✅ Skip if no activity fees
        if (
          !member.activityFees ||
          !member.activityFees.length
        ) {
          continue;
        }

        for (
          const af of member.activityFees
        ) {

          // ✅ Skip invalid entry
          if (!af) {
            continue;
          }

          // ✅ Skip unpaid memberships
          if (
            af.paymentStatus !== "Paid"
          ) {
            continue;
          }

          // ✅ Skip inactive memberships
          if (
            af.membershipStatus !==
            "Active"
          ) {
            continue;
          }

          // ✅ Activity required
          if (!af.activity) {
            continue;
          }

          // ✅ Start/end required
          if (
            !af.startDate ||
            !af.endDate
          ) {
            continue;
          }

          // ✅ Convert dates to IST YYYY-MM-DD
          const start =
            new Intl.DateTimeFormat(
              "en-CA",
              {
                timeZone:
                  "Asia/Kolkata"
              }
            ).format(
              new Date(af.startDate)
            );

          const end =
            new Intl.DateTimeFormat(
              "en-CA",
              {
                timeZone:
                  "Asia/Kolkata"
              }
            ).format(
              new Date(af.endDate)
            );

          // ✅ Today must be within membership range
          if (
            todayIST < start ||
            todayIST > end
          ) {
            continue;
          }

          // ✅ Check if attendance already exists
          const existing =
            await FitnessAttendance.findOne({
              member: member._id,

              // IMPORTANT:
              // using activityFeeId instead of activity
              // because same activity can exist
              // multiple times for same member
              activityFeeId: af._id,

              attendanceDay: todayIST,

              organizationId:
                member.organizationId
            });

          // ✅ Already marked
          if (existing) {
            continue;
          }

          // ✅ Create absent attendance
          await FitnessAttendance.create({

            member: member._id,

            activity: af.activity,

            activityFeeId: af._id,

            attendanceDay: todayIST,

            markedBy: null,

            status: "Absent",

            notes:
              "Auto-generated absent attendance by cron",

            organizationId:
              member.organizationId
          });
        }
      }

      console.log(
        "Absent attendance cron completed"
      );

    } catch (err) {

      console.error(
        "Absent cron error:",
        err
      );
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);