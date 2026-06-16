const express = require("express");
const router = express.Router();

const { createService, getServices, getServiceById, updateService, toggleStatus, deleteService } = require(
  "../controllers/schoolServiceController"
);


// Create service Routes
router.post("/", createService);

//get services
router.get('/', getServices);

//get service by id 
router.get("/:id", getServiceById);

// update service
router.put("/:id", updateService);

//active inactive toggle status
router.patch("/:id/status", toggleStatus);

//delete service
router.delete("/:id", deleteService);

module.exports = router;
