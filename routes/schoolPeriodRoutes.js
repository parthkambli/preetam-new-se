const express = require('express');
const auth = require('../middleware/auth');
const {
  getAllPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
} = require('../controllers/schoolPeriodController');

const router = express.Router();

router.get('/', auth, getAllPeriods);
router.post('/', auth, createPeriod);
router.put('/:id', auth, updatePeriod);
router.delete('/:id', auth, deletePeriod);

module.exports = router;
