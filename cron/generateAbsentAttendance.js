const cron = require("node-cron");

const FitnessMember =
  require("../models/FitnessMember");

const FitnessAttendance =
  require("../models/FitnessAttendance");

const { getTodayIST } =
  require("../utils/date");

cron.schedule(
  "59 23 * * *",
  async () => {

    try {

      console.log(
        "Running absent attendance cron..."
      );

      const todayIST =
        getTodayIST();

      const attendanceDate =
        new Date(
          `${todayIST}T12:00:00.000Z`
        );

      const members =
        await FitnessMember.find({
          organizationId: "fitness",
          status: "Active"
        }).lean();

      for (const member of members) {

        for (
          const af of member.activityFees || []
        ) {

          // ✅ Skip unpaid
          if (
            af.paymentStatus !== "Paid"
          ) {
            continue;
          }

          // ✅ Skip inactive
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

          // ✅ Today must be within range
          if (
            todayIST < start ||
            todayIST > end
          ) {
            continue;
          }

          // ✅ Already exists?
          const existing =
            await FitnessAttendance.findOne({
              member: member._id,
              activity: af.activity,
              activityFeeId: af._id,
              attendanceDate,
              organizationId:
                member.organizationId
            });

          if (existing) {
            continue;
          }

          // ✅ Create absent
          await FitnessAttendance.create({

            member: member._id,

            activity: af.activity,

            activityFeeId: af._id,

            attendanceDate,

            markedBy: null,

            status: "Absent",

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