// routes/role.routes.js

const router = require("express").Router();
const { createRole, getRoles, deleteRole } = require("../controllers/fitnessStaffRoleController");

router.post("/create", createRole);
router.get("/", getRoles);
router.delete("/:id", deleteRole);

module.exports = router;