const express = require('express');
const { getProfile, getTimetable, getActivities, getHealthRecords, getHealthRecordById, getFees, getAttendance, getServices, getAvailableServices, calculateService, createServiceOrder, verifyServicePayment, calculateRenewal, createRenewServiceOrder, verifyRenewServicePayment, createReminder, getReminders, updateReminder, deleteReminder } = require('../controllers/schoolStudentPanelController');
const router = express.Router();

router.get('/profile', getProfile);
router.get('/timetable', getTimetable);
router.get('/activities', getActivities);
router.get('/health-records', getHealthRecords);
router.get('/health-records/:id', getHealthRecordById);
router.get('/fees', getFees);
router.get('/attendance', getAttendance);
router.get('/services', getServices);
router.get('/services/available', getAvailableServices);
router.post('/services/calculate', calculateService);
router.post('/services/create-order', createServiceOrder);
router.post('/services/verify-payment', verifyServicePayment);
router.post('/services/renew/calculate', calculateRenewal);
router.post('/services/renew/create-order', createRenewServiceOrder);
router.post('/services/renew/verify-payment', verifyRenewServicePayment);
router.post('/reminders', createReminder);
router.get('/reminders', getReminders);
router.put('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);

module.exports = router;
