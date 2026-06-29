const express = require('express');
const router = express.Router();
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
router.get('/attendance', getAttendance);
router.get('/attendance/students', getAttendanceStudents);
router.get('/attendance/student-periods', getStudentPeriods);
router.post('/attendance/scan-mark', scanMark);
router.get('/events', getEvents);

router.get('/enquiry', getEnquiries);
router.get('/enquiry/:id', getEnquiryById);
router.post('/enquiry', createEnquiry);
router.put('/enquiry/:id', updateEnquiry);
router.delete('/enquiry/:id', deleteEnquiry);

router.get('/followups', getFollowups);
router.post('/followups', createFollowup);

router.get('/admission', getAdmissions);
router.get('/admission/:id', getAdmissionById);
router.get('/admission/:id/payments', getAdmissionPayments);
router.post('/admission', handleUpload(upload.schoolAdmission), createAdmission);
router.put('/admission/:id', handleUpload(upload.schoolAdmission), updateAdmission);
router.delete('/admission/:id', deleteAdmission);
router.post('/admission/:id/collect-payment', collectPayment);

router.get('/participants', getStudents);
router.get('/participants/:id', getStudentById);
router.put('/participants/:id', updateStudent);
router.put('/participants/:id/emergency-contact', updateEmergencyContact);
router.delete('/participants/:id/emergency-contact', clearEmergencyContact);

router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.patch('/services/:id/toggle-status', toggleServiceStatus);

router.get('/services/bookings', getServiceBookings);
router.post('/services/bookings', createServiceBooking);
router.delete('/services/bookings/:id', cancelServiceBooking);
router.get('/services/bookings/available-seats', getAvailableSeats);

router.get('/fees/types', getFeeTypes);
router.post('/fees/types', createFeeType);
router.put('/fees/types/:id', updateFeeType);
router.delete('/fees/types/:id', deleteFeeType);

router.get('/fees/allotments', getAllotments);
router.post('/fees/allotments', allotFee);

router.get('/fees/payments', getPayments);
router.post('/fees/payments', addPayment);

router.get('/health-records', getHealthRecords);
router.get('/health-records/:id', getHealthRecordById);
router.post('/health-records', handleUpload(upload.schoolHealthRecord), createHealthRecord);
router.put('/health-records/:id', handleUpload(upload.schoolHealthRecord), updateHealthRecord);
router.delete('/health-records/:id', deleteHealthRecord);

router.get('/activities', getActivities);

router.get('/renewals/expiring', getExpiring);
router.post('/renewals/renew', renew);

router.get('/reports', getReports);

module.exports = router;
