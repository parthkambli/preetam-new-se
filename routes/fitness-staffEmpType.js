

const router = require("express").Router();
const { createType, getTypes, deleteType } = require("../controllers/fitnessStaffEmpTypeController");

router.post("/create", createType);
router.get("/", getTypes);
router.delete("/:id", deleteType);

module.exports = router;