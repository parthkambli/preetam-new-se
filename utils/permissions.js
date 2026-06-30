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
    'VIEW_ATTENDANCE',
    'VIEW_EVENTS',
  ],

  // School Staff
  SchoolStaff: [
    'SCHOOL_VIEW_ADMISSION',
    'SCHOOL_ADD_ADMISSION',
    'SCHOOL_EDIT_ADMISSION',
    'SCHOOL_DELETE_ADMISSION',
    'SCHOOL_VIEW_FEES',
    'SCHOOL_VIEW_REPORTS',
    'SCHOOL_VIEW_ATTENDANCE',
    'SCHOOL_MARK_ATTENDANCE',
  ],
//fitness member
  Participant: [
  "VIEW_OWN_PROFILE",
  "VIEW_MEMBERSHIP",
  "VIEW_BOOKINGS",
  "VIEW_ATTENDANCE",
  "VIEW_PAYMENTS",
  "VIEW_ACTIVITIES",
  "BOOK_ACTIVITY"
],

  // Others
  Student: [],
  // Participant: [],
};

module.exports = { PERMISSIONS };