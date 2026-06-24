const User = require('../models/User');
const Student = require('../models/Student');
const SchoolAdmission = require('../models/SchoolAdmission');
const TimeTable = require('../models/schoolPeriod');
const Activity = require('../models/Activity');

const findLoggedInStudent = async (req) => {
  const user = await User.findById(req.user.id).lean();
  if (!user || user.role !== 'Student') {
    throw new Error('Student not found');
  }

  const studentDoc = await Student.findById(user.linkedId).lean();
  if (!studentDoc) {
    throw new Error('Admission record not found');
  }

  const student = await SchoolAdmission.findOne({
    _id: studentDoc.admissionId,
    organizationId: req.organizationId,
  }).lean();
  if (!student) {
    throw new Error('Admission record not found');
  }

  return student;
};

exports.getProfile = async (req, res) => {
  try {
    const student = await findLoggedInStudent(req);

    return res.json({
      success: true,
      profile: {
        fullName: student.fullName || '',
        admissionId: student.admissionId || '',
        mobile: student.mobile || '',
        age: student.age || 0,
        gender: student.gender || '',
        dob: student.dob || '',
        bloodGroup: student.bloodGroup || '',
        fullAddress: student.fullAddress || '',
        status: student.status || '',
        photo: student.photo || null,
        qrCode: student.qrCode || '',
        registrationDate: student.registrationDate || '',

        physicalDisability: student.physicalDisability || '',
        mainIllness: student.mainIllness || '',
        seriousDisease: student.seriousDisease || '',
        regularMedication: student.regularMedication || '',
        healthDetails: student.healthDetails || '',

        education: student.education || '',
        educationPlace: student.educationPlace || '',
        yearsOfService: student.yearsOfService || '',
        servicePlace: student.servicePlace || '',
        occupationType: student.occupationType || '',

        primaryContact: {
          name: student.primaryContactName || '',
          relation: student.primaryRelation || '',
          phone: student.primaryPhone || '',
        },

        secondaryContact: {
          name: student.secondaryContactName || '',
          relation: student.secondaryRelation || '',
          phone: student.secondaryPhone || '',
        },
      },
    });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const DAY_FIELDS = ['mondayActivityId', 'tuesdayActivityId', 'wednesdayActivityId', 'thursdayActivityId', 'fridayActivityId', 'saturdayActivityId'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

exports.getTimetable = async (req, res) => {
  try {
    const student = await findLoggedInStudent(req);
    const rows = student.timetable || [];

    const periodIds = [];
    const activityIds = [];
    for (const row of rows) {
      if (row.periodId) periodIds.push(row.periodId);
      for (const field of DAY_FIELDS) {
        if (row[field]) activityIds.push(row[field]);
      }
    }

    const [periods, activities] = await Promise.all([
      periodIds.length > 0
        ? TimeTable.find({ _id: { $in: periodIds } }).select('name startTime endTime').lean()
        : Promise.resolve([]),
      activityIds.length > 0
        ? Activity.find({ _id: { $in: activityIds } }).select('name').lean()
        : Promise.resolve([]),
    ]);

    const periodMap = {};
    for (const p of periods) periodMap[p._id.toString()] = p;
    const activityMap = {};
    for (const a of activities) activityMap[a._id.toString()] = a;

    const timetable = rows.map((row) => {
      const period = periodMap[row.periodId?.toString()] || {};

      const dayEntries = {};
      for (let i = 0; i < DAY_NAMES.length; i++) {
        const dayName = DAY_NAMES[i];
        const activityId = row[DAY_FIELDS[i]];
        const activity = activityMap[activityId?.toString()] || {};
        dayEntries[dayName] = {
          activityId: activityId ? activityId.toString() : '',
          activityName: activity.name || '',
        };
      }

      return {
        periodId: row.periodId ? row.periodId.toString() : '',
        periodName: period.name || '',
        startTime: period.startTime || '',
        endTime: period.endTime || '',
        ...dayEntries,
      };
    });

    return res.json({ success: true, timetable });
  } catch (err) {
    if (err.message === 'Student not found' || err.message === 'Admission record not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('getTimetable error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
