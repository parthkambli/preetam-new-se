const PERMISSIONS = {
  // Admin (User model)
  Admin: [
    'USER_MANAGE',
    'VIEW_DASHBOARD',
    'MANAGE_ATTENDANCE',
    'MANAGE_ACTIVITIES',
    'VIEW_REPORTS',
  ],

  // Fitness Staff
  FitnessStaff: [
    'VIEW_OWN_SCHEDULE',
    'VIEW_ACTIVITIES',
    'MARK_ATTENDANCE',
    'VIEW_EVENTS',
  ],

  // School Staff
  SchoolStaff: [
    'VIEW_SCHOOL_DASHBOARD',
    'MANAGE_STUDENTS',
  ],

  // Others
  Student: [],
  Participant: [],
};

module.exports = { PERMISSIONS };