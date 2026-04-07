// // controllers/staff.controller.js

// const Staff = require("../models/FitnessStaff");
// const Role = require("../models/FitnessStaffRole");
// const EmploymentType = require("../models/FitnessStaffEmpType");
// const mongoose = require("mongoose");


// // ─────────────────────────────────────────────────────────────
// // 🔥 COMMON ERROR HANDLER
// const handleError = (res, err, message = 'Server error') => {
//   console.error('[FitnessStaff Error]', err);

//   if (err.name === 'ValidationError') {
//     const errors = Object.values(err.errors).map(e => e.message);
//     return res.status(400).json({
//       success: false,
//       message: 'Validation failed',
//       errors
//     });
//   }

//   if (err.code === 11000) {
//     const field = Object.keys(err.keyPattern)[0];
//     return res.status(409).json({
//       success: false,
//       message: `${field} already exists`,
//       field
//     });
//   }

//   if (err.name === 'CastError') {
//     return res.status(400).json({
//       success: false,
//       message: 'Invalid ID format'
//     });
//   }

//   res.status(500).json({
//     success: false,
//     message,
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// };


// // ─────────────────────────────────────────────────────────────
// // 🔥 VALIDATION FUNCTION
// const validateStaff = (data) => {
//   const errors = [];

//   if (!data.fullName?.trim()) {
//     errors.push('Full name is required');
//   }

//   if (!data.mobile?.trim()) {
//     errors.push('Mobile is required');
//   } else if (!/^\d{10}$/.test(data.mobile)) {
//     errors.push('Mobile must be 10 digits');
//   }

//   if (!data.role) {
//     errors.push('Role is required');
//   }

//   if (!data.employmentType) {
//     errors.push('Employment type is required');
//   }

//   if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
//     errors.push('Invalid email');
//   }

//   return errors;
// };


// // ─────────────────────────────────────────────────────────────
// // 🔥 CREATE STAFF
// exports.createFitnessStaff = async (req, res) => {
//   try {
//     const data = req.body;

//     // ✅ Validate input
//     const errors = validateStaff(data);
//     if (errors.length) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors
//       });
//     }

//     // ✅ Validate ObjectIds
//     if (!mongoose.Types.ObjectId.isValid(data.role)) {
//       return res.status(400).json({ success: false, message: 'Invalid role ID' });
//     }

//     if (!mongoose.Types.ObjectId.isValid(data.employmentType)) {
//       return res.status(400).json({ success: false, message: 'Invalid employment type ID' });
//     }

//     // ✅ Check role exists
//     const roleExists = await Role.findById(data.role);
//     if (!roleExists) {
//       return res.status(404).json({ success: false, message: 'Role not found' });
//     }

//     // ✅ Check type exists
//     const typeExists = await EmploymentType.findById(data.employmentType);
//     if (!typeExists) {
//       return res.status(404).json({ success: false, message: 'Employment type not found' });
//     }

//     // ✅ Photo validation
//     let photoUrl = '';
//     if (req.file) {
//       const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

//       if (!allowed.includes(req.file.mimetype)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Only JPG, PNG, WEBP allowed'
//         });
//       }

//       if (req.file.size > 2 * 1024 * 1024) {
//         return res.status(400).json({
//           success: false,
//           message: 'Image must be < 2MB'
//         });
//       }

//       photoUrl = `/uploads/staff/${req.file.filename}`;
//     }

//     // ✅ Generate employee ID
//     const count = await Staff.countDocuments();
//     const employeeId = 'EMP' + String(count + 1).padStart(4, '0');

//     // ✅ Create
//     const staff = await Staff.create({
//       ...data,
//       employeeId,
//       photo: photoUrl,
//       fullName: data.fullName.trim(),
//       mobile: data.mobile.trim(),
//       organizationId: req.organizationId
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Staff created successfully',
//       data: staff
//     });

//   } catch (err) {
//     handleError(res, err, 'Failed to create staff');
//   }
// };


// // ─────────────────────────────────────────────────────────────
// // 🔥 GET ALL STAFF
// exports.getFitnessStaff = async (req, res) => {
//   try {
//     const query = { organizationId: req.organizationId };

//     const staff = await Staff.find(query)
//       .populate('role', 'name')
//       .populate('employmentType', 'name')
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json({
//       success: true,
//       count: staff.length,
//       data: staff
//     });

//   } catch (err) {
//     handleError(res, err, 'Failed to fetch staff');
//   }
// };


// // ─────────────────────────────────────────────────────────────
// // 🔥 GET STAFF BY ID
// exports.getFitnessStaffById = async (req, res) => {
//   try {
//     const staff = await Staff.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     })
//       .populate('role', 'name')
//       .populate('employmentType', 'name');

//     if (!staff) {
//       return res.status(404).json({
//         success: false,
//         message: 'Staff not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: staff
//     });

//   } catch (err) {
//     handleError(res, err, 'Failed to fetch staff');
//   }
// };


// // ─────────────────────────────────────────────────────────────
// // 🔥 UPDATE STAFF
// exports.updateFitnessStaff = async (req, res) => {
//   try {
//     const staff = await Staff.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!staff) {
//       return res.status(404).json({
//         success: false,
//         message: 'Staff not found'
//       });
//     }

//     const updates = { ...req.body };

//     // ✅ Validate
//     const errors = validateStaff({ ...staff.toObject(), ...updates });
//     if (errors.length) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors
//       });
//     }

//     // ✅ Photo update
//     if (req.file) {
//       const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

//       if (!allowed.includes(req.file.mimetype)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid image type'
//         });
//       }

//       updates.photo = `/uploads/staff/${req.file.filename}`;
//     }

//     // ❌ Prevent critical overwrite
//     ['_id', 'organizationId', 'employeeId', 'createdAt'].forEach(f => delete updates[f]);

//     Object.assign(staff, updates);
//     await staff.save();

//     res.json({
//       success: true,
//       message: 'Staff updated successfully',
//       data: staff
//     });

//   } catch (err) {
//     handleError(res, err, 'Failed to update staff');
//   }
// };


// // ─────────────────────────────────────────────────────────────
// // 🔥 DELETE STAFF
// exports.deleteFitnessStaff = async (req, res) => {
//   try {
//     const staff = await Staff.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!staff) {
//       return res.status(404).json({
//         success: false,
//         message: 'Staff not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Staff deleted successfully'
//     });

//   } catch (err) {
//     handleError(res, err, 'Failed to delete staff');
//   }
// };





/**
 * Fitness Staff Controller
 * Handles all CRUD operations for fitness staff members.
 * Multer (file upload), bcrypt (password hashing), and Joi (validation) are all
 * configured here — no separate middleware files required.
 */
/**
 * Fitness Staff Controller
 * Handles all CRUD operations for fitness staff members.
 * Multer (file upload) and Joi (validation) are configured here —
 * no separate middleware files required.
 */

const fs   = require("fs");
const path = require("path");

const multer = require("multer");
const Joi    = require("joi");

const FitnessStaff = require("../models/FitnessStaff");

// ─── Constants ────────────────────────────────────────────────────────────────
const UPLOAD_DIR        = path.join(__dirname, "..", "uploads", "staff-profiles");
const ALLOWED_MIME      = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXT       = /\.(jpg|jpeg|png)$/i;

// ─── Ensure upload directory exists ──────────────────────────────────────────
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Multer configuration ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    // e.g. photo-1718000000000-my-image.jpg
    const timestamp = Date.now();
    const safeName  = file.originalname.replace(/\s+/g, "-");
    cb(null, `photo-${timestamp}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, and PNG images are allowed"), false);
  }
};

/** Multer middleware — exported so routes can reference it */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports.upload = upload;

// ─── Joi Validation Schemas ───────────────────────────────────────────────────
const baseStaffSchema = {
  fullName:              Joi.string().trim().min(2).max(100),
  role:                  Joi.string().trim().min(2).max(100),
  gender:                Joi.string().valid("Male", "Female", "Other"),
  dateOfBirth:           Joi.date().iso().max("now").allow(null, ""),
  joiningDate:           Joi.date().iso(),
  employmentType:        Joi.string().trim().allow(null, ""),        // remove .valid(...)
  status:                Joi.string().valid("Active", "Inactive", "Terminated"),
  salary:                Joi.number().min(0).allow(null, ""),
  mobileNumber:          Joi.string().pattern(/^\d{10}$/),
  emailId:               Joi.string().email().allow(null, ""),
  fullAddress:           Joi.string().trim().max(500).allow(null, ""),
  emergencyContactName:  Joi.string().trim().max(100).allow(null, ""),
  emergencyRelation:     Joi.string().trim().max(100).allow(null, ""),
  emergencyContactMobile:Joi.string().pattern(/^\d{10}$/).allow(null, ""),
};

const createSchema = Joi.object({
  ...baseStaffSchema,
  fullName:     Joi.string().trim().min(2).max(100).required(),
  role:         Joi.string().trim().min(2).max(100).required(),
  gender:       Joi.string().valid("Male", "Female", "Other").required(),
  joiningDate:  Joi.date().iso().required(),
  mobileNumber: Joi.string().pattern(/^\d{10,15}$/).required()
    .messages({ "string.pattern.base": "Mobile number must be 10–15 digits" }),
  password:     Joi.string().min(6).max(128).required()
    .messages({ "string.min": "Password must be at least 6 characters" }),
});

const updateSchema = Joi.object({
  ...baseStaffSchema,
  password: Joi.string().min(6).max(128).allow(null, ""),
}).min(1); // at least one field required for an update

// ─── Helper: build consistent API response ────────────────────────────────────
const respond = (res, statusCode, success, message, data = undefined) => {
  const body = { success, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

// ─── Helper: safely delete a file ─────────────────────────────────────────────
const deleteFile = (filePath) => {
  if (!filePath) return;
  const abs = path.resolve(filePath);
  if (fs.existsSync(abs)) {
    try { fs.unlinkSync(abs); } catch (_) { /* best-effort */ }
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// CREATE  POST /api/fitness-staff
// ═════════════════════════════════════════════════════════════════════════════
const createFitnessStaff = async (req, res) => {
  try {
    // 1. Validate request body
    const { error, value } = createSchema.validate(req.body, { abortEarly: false });
    if (error) {
      // Clean up any uploaded file on validation failure
      if (req.file) deleteFile(req.file.path);
      const messages = error.details.map((d) => d.message);
      return respond(res, 422, false, "Validation failed", { errors: messages });
    }

    // 2. Check uniqueness manually for friendlier error messages
    const [existingMobile, existingEmail] = await Promise.all([
      FitnessStaff.findOne({ mobileNumber: value.mobileNumber }),
      value.emailId ? FitnessStaff.findOne({ emailId: value.emailId }) : null,
    ]);

    if (existingMobile) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 409, false, "A staff member with this mobile number already exists");
    }
    if (existingEmail) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 409, false, "A staff member with this email address already exists");
    }

// prevent override
delete value.employeeId;

// generate employee ID
const lastStaff = await FitnessStaff.findOne()
  .sort({ createdAt: -1 })
  .select('employeeId');

let nextNumber = 1;

if (lastStaff && lastStaff.employeeId) {
  const num = parseInt(lastStaff.employeeId.replace('EMP', ''));
  nextNumber = num + 1;
}

const employeeId = 'EMP' + String(nextNumber).padStart(4, '0');

// build data
const staffData = {
  ...value,
  employeeId,
  profilePhoto: req.file ? req.file.path : null,
};

const staff = await FitnessStaff.create(staffData);

    // toJSON transformer strips password automatically
    return respond(res, 201, true, "Staff member created successfully", staff);
  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    console.error("[createFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while creating staff member");
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// READ ALL  GET /api/fitness-staff
// Supports: ?page, ?limit, ?status, ?role, ?search (fullName text search)
// ═════════════════════════════════════════════════════════════════════════════
const getFitnessStaff = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip   = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role)   filter.role   = new RegExp(req.query.role, "i");
    if (req.query.search) filter.$text  = { $search: req.query.search };

    const [staff, total] = await Promise.all([
      FitnessStaff.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FitnessStaff.countDocuments(filter),
    ]);

    return respond(res, 200, true, "Staff members retrieved successfully", {
      staff,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[getFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while fetching staff members");
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// READ ONE  GET /api/fitness-staff/:id
// ═════════════════════════════════════════════════════════════════════════════
const getFitnessStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format before hitting the DB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return respond(res, 400, false, "Invalid staff ID format");
    }

    const staff = await FitnessStaff.findById(id).lean();

    if (!staff) {
      return respond(res, 404, false, "Staff member not found");
    }

    return respond(res, 200, true, "Staff member retrieved successfully", staff);
  } catch (err) {
    console.error("[getFitnessStaffById]", err);
    return respond(res, 500, false, "Internal server error while fetching staff member");
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// UPDATE  PUT /api/fitness-staff/:id
// ═════════════════════════════════════════════════════════════════════════════
const updateFitnessStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 400, false, "Invalid staff ID format");
    }

    // 1. Validate body
    const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      if (req.file) deleteFile(req.file.path);
      const messages = error.details.map((d) => d.message);
      return respond(res, 422, false, "Validation failed", { errors: messages });
    }

    // 2. Fetch existing record
    const existing = await FitnessStaff.findById(id);
    if (!existing) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 404, false, "Staff member not found");
    }

    // 3. Check uniqueness conflicts (exclude current record)
    if (value.mobileNumber && value.mobileNumber !== existing.mobileNumber) {
      const dup = await FitnessStaff.findOne({ mobileNumber: value.mobileNumber, _id: { $ne: id } });
      if (dup) {
        if (req.file) deleteFile(req.file.path);
        return respond(res, 409, false, "Mobile number is already used by another staff member");
      }
    }
    if (value.emailId && value.emailId !== existing.emailId) {
      const dup = await FitnessStaff.findOne({ emailId: value.emailId, _id: { $ne: id } });
      if (dup) {
        if (req.file) deleteFile(req.file.path);
        return respond(res, 409, false, "Email address is already used by another staff member");
      }
    }

    // 4. Clear password if empty string sent (don't overwrite with blank)
    if (!value.password) {
      delete value.password;
    }

    // 5. Handle profile photo update
    if (req.file) {
      // Delete old photo if it exists
      deleteFile(existing.profilePhoto);
      value.profilePhoto = req.file.path;
    }

    // 6. Apply update
    const updated = await FitnessStaff.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true, runValidators: true }
    );

    return respond(res, 200, true, "Staff member updated successfully", updated);
  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    console.error("[updateFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while updating staff member");
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// DELETE  DELETE /api/fitness-staff/:id
// ═════════════════════════════════════════════════════════════════════════════
const deleteFitnessStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return respond(res, 400, false, "Invalid staff ID format");
    }

    const staff = await FitnessStaff.findById(id);
    if (!staff) {
      return respond(res, 404, false, "Staff member not found");
    }

    // Delete profile photo from disk before removing the document
    deleteFile(staff.profilePhoto);

    await staff.deleteOne();

    return respond(res, 200, true, "Staff member deleted successfully");
  } catch (err) {
    console.error("[deleteFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while deleting staff member");
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  createFitnessStaff,
  getFitnessStaff,
  getFitnessStaffById,
  updateFitnessStaff,
  deleteFitnessStaff,
  upload,   // also exported so routes can apply as middleware
};