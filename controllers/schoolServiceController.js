const Service  = require("../models/SchoolService")


// create Service ..

exports.createService = async (req, res) => {
  try {
    const { serviceName, capacity, oneDayFee } = req.body;

    const existing = await Service.findOne({
      serviceName: serviceName.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Service already exists",
      });
    }

    const service = await Service.create({
      serviceName,
      capacity,
      oneDayFee,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get service.
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({
      createdAt: -1,
    });

    const formatted = services.map((service) => ({
      ...service.toObject(),
      availableSeats:
        service.capacity - service.bookedCount,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ger service by id
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...service.toObject(),
        availableSeats:
          service.capacity - service.bookedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// update service
exports.updateService = async (req, res) => {
  try {
    const { serviceName, capacity, oneDayFee } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (
      capacity &&
      capacity < service.bookedCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Capacity cannot be less than booked count",
      });
    }

    service.serviceName =
      serviceName ?? service.serviceName;

    service.capacity =
      capacity ?? service.capacity;

    service.oneDayFee =
      oneDayFee ?? service.oneDayFee;

    await service.save();

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Active inactive toggle
exports.toggleStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// delete service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(
      req.params.id
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.bookedCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete service with active bookings",
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};