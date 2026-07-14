const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');
const { upload, handleUpload } = require('../middleware/upload');

const {
  getDashboard,
  getMySchedule,
  getScheduleStudents,
  getProfile,
  getAttendance,
  getAttendanceStudents,
  getStudentPeriods,
  scanMark,
  getEvents,
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getFollowups,
  createFollowup,
  getAdmissions,
  getAdmissionById,
  getAdmissionPayments,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  collectPayment,
  getStudents,
  getStudentById,
  updateStudent,
  updateEmergencyContact,
  clearEmergencyContact,
  getServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceBookings,
  createServiceBooking,
  cancelServiceBooking,
  getAvailableSeats,
  getFeeTypes,
  createFeeType,
  updateFeeType,
  deleteFeeType,
  getAllotments,
  allotFee,
  getPayments,
  addPayment,
  getFeeStats,
  getHealthRecords,
  getHealthRecordById,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getActivities,
  getExpiring,
  renew,
  getReports,
} = require('../controllers/schoolStaffPanelController');

router.get('/dashboard', getDashboard);
router.get('/my-schedule', getMySchedule);
router.get('/my-schedule/students', getScheduleStudents);
router.get('/profile', getProfile);
router.get('/attendance', allowPermissions('SCHOOL_VIEW_ATTENDANCE'), getAttendance);
router.get('/attendance/students', allowPermissions('SCHOOL_VIEW_ATTENDANCE'), getAttendanceStudents);
router.get('/attendance/student-periods', allowPermissions('SCHOOL_VIEW_ATTENDANCE'), getStudentPeriods);
router.post('/attendance/scan-mark', allowPermissions('SCHOOL_MARK_ATTENDANCE'), scanMark);
router.get('/events', getEvents);

router.get('/enquiry', getEnquiries);
router.get('/enquiry/:id', getEnquiryById);
router.post('/enquiry', createEnquiry);
router.put('/enquiry/:id', updateEnquiry);
router.delete('/enquiry/:id', deleteEnquiry);

router.get('/followups', getFollowups);
router.post('/followups', createFollowup);

router.get('/admission', allowPermissions('SCHOOL_VIEW_ADMISSION'), getAdmissions);
router.get('/admission/:id', allowPermissions('SCHOOL_VIEW_ADMISSION'), getAdmissionById);
router.get('/admission/:id/payments', allowPermissions('SCHOOL_VIEW_ADMISSION'), getAdmissionPayments);
router.post('/admission', allowPermissions('SCHOOL_ADD_ADMISSION'), handleUpload(upload.schoolAdmission), createAdmission);
router.put('/admission/:id', allowPermissions('SCHOOL_EDIT_ADMISSION'), handleUpload(upload.schoolAdmission), updateAdmission);
router.delete('/admission/:id', allowPermissions('SCHOOL_DELETE_ADMISSION'), deleteAdmission);
router.post('/admission/:id/collect-payment', allowPermissions('SCHOOL_EDIT_ADMISSION'), collectPayment);

router.get('/participants', getStudents);
router.get('/participants/:id', allowPermissions('SCHOOL_VIEW_ADMISSION'), getStudentById);
router.put('/participants/:id', allowPermissions('SCHOOL_VIEW_ADMISSION'), updateStudent);
router.put('/participants/:id/emergency-contact', allowPermissions('SCHOOL_VIEW_ADMISSION'), updateEmergencyContact);
router.delete('/participants/:id/emergency-contact', allowPermissions('SCHOOL_VIEW_ADMISSION'), clearEmergencyContact);

router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.patch('/services/:id/toggle-status', toggleServiceStatus);

router.get('/services/bookings', getServiceBookings);
router.post('/services/bookings', createServiceBooking);
router.delete('/services/bookings/:id', cancelServiceBooking);
router.get('/services/bookings/available-seats', getAvailableSeats);

router.get('/fees/types', allowPermissions('SCHOOL_VIEW_FEES'), getFeeTypes);
router.post('/fees/types', allowPermissions('SCHOOL_VIEW_FEES'), createFeeType);
router.put('/fees/types/:id', allowPermissions('SCHOOL_VIEW_FEES'), updateFeeType);
router.delete('/fees/types/:id', allowPermissions('SCHOOL_VIEW_FEES'), deleteFeeType);

router.get('/fees/stats', allowPermissions('SCHOOL_VIEW_FEES'), getFeeStats);

router.get('/fees/allotments', allowPermissions('SCHOOL_VIEW_FEES'), getAllotments);
router.post('/fees/allotments', allowPermissions('SCHOOL_VIEW_FEES'), allotFee);

router.get('/fees/payments', allowPermissions('SCHOOL_VIEW_FEES'), getPayments);
router.post('/fees/payments', allowPermissions('SCHOOL_VIEW_FEES'), addPayment);

router.get('/health-records', getHealthRecords);
router.get('/health-records/:id', getHealthRecordById);
router.post('/health-records', handleUpload(upload.schoolHealthRecord), createHealthRecord);
router.put('/health-records/:id', handleUpload(upload.schoolHealthRecord), updateHealthRecord);
router.delete('/health-records/:id', deleteHealthRecord);

router.get('/activities', getActivities);

router.get('/renewals/expiring', getExpiring);
router.post('/renewals/renew', renew);

router.get('/reports', allowPermissions('SCHOOL_VIEW_REPORTS'), getReports);

module.exports = router;
