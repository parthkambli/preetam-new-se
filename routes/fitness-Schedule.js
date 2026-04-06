const express = require('express');
const router = express.Router();
const controller = require('../controllers/fitnessScheduleController');

router.post('/', controller.createSchedule);
router.get('/', controller.getSchedules);
router.get('/:id', controller.getScheduleById);
router.put('/:id', controller.updateSchedule);
router.delete('/:id', controller.deleteSchedule);

module.exports = router;


