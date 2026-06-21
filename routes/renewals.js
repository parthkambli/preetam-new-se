const express = require('express');
const router = express.Router();
const {
  getExpiring,
  renew,
} = require('../controllers/renewalController');

router.get('/', getExpiring);
router.post('/renew', renew);

module.exports = router;
