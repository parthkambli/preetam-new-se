const cron = require("node-cron");
const SchoolAdmission = require("../models/SchoolAdmission");
const SchoolAttendance = require("../models/SchoolAttendance");
const { getTodayIST } = require("../utils/date");

cron.schedule("8 00 * * *", async () => {
  try {
    console.log("Running school absent attendance cron...");

    const todayIST = getTodayIST();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [y, m, d] = todayIST.split('-').map(Number);
    const todayDay = dayNames[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

    const dayField = `${todayDay.toLowerCase()}ActivityId`;

    const students = await SchoolAdmission.find({
      status: 'Active',
      organizationId: { $exists: true, $ne: '' },
      [`timetable.${dayField}`]: { $exists: true, $ne: null },
    }).select('_id admissionId timetable organizationId').lean();

    const absentRecords = [];

    for (const student of students) {
      if (!student.timetable || !Array.isArray(student.timetable)) continue;

      const todayEntries = student.timetable.filter(t => t[dayField] != null);

      for (const entry of todayEntries) {
        const existing = await SchoolAttendance.findOne({
          studentId: student._id,
          periodId: entry.periodId,
          activityId: entry[dayField],
          attendanceDate: todayIST,
          organizationId: student.organizationId,
        }).lean();

        if (!existing) {
          absentRecords.push({
            studentId: student._id,
            admissionId: student.admissionId,
            periodId: entry.periodId,
            activityId: entry[dayField],
            attendanceDate: todayIST,
            day: todayDay,
            status: 'Absent',
            markedBy: null,
            organizationId: student.organizationId,
          });
        }
      }
    }

    if (absentRecords.length > 0) {
      await SchoolAttendance.insertMany(absentRecords, { ordered: false });
    }

    console.log(`School absent attendance cron completed — ${absentRecords.length} absent records created`);
  } catch (err) {
    console.error("School absent cron error:", err);
  }
}, {
  timezone: "Asia/Kolkata",
});
