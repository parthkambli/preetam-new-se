
const router = require("express").Router();
const upload = require("../middleware/upload");

const { createFitnessStaff, getFitnessStaff, getFitnessStaffById, updateFitnessStaff, deleteFitnessStaff } = require('../controllers/fitnessStaffController');

router.post("/create", upload.single("photo"), createFitnessStaff );
router.get("/", getFitnessStaff);
router.get("/:id", getFitnessStaffById);
router.put("/:id", upload.single("photo"), updateFitnessStaff);
router.delete("/:id", deleteFitnessStaff);

module.exports = router;