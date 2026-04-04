const express = require('express');
const router = express.Router();
const controller = require('../controllers/fitnessActivityController');

router.post('/', controller.createActivity);
router.get('/', controller.getActivities);
router.get('/:id', controller.getActivityById);
router.put('/:id', controller.updateActivity);
router.delete('/:id', controller.deleteActivity);

module.exports = router;