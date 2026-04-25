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
    'VIEW_SCHOOL_DASHBOARD',
    'MANAGE_STUDENTS',
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