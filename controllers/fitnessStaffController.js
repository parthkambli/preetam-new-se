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





// /**
//  * Fitness Staff Controller
//  * Handles all CRUD operations for fitness staff members.
//  * Multer (file upload), bcrypt (password hashing), and Joi (validation) are all
//  * configured here — no separate middleware files required.
//  */
// /**
//  * Fitness Staff Controller
//  * Handles all CRUD operations for fitness staff members.
//  * Multer (file upload) and Joi (validation) are configured here —
//  * no separate middleware files required.
//  */



// const fs = require("fs");
// const path = require("path");

// const multer = require("multer");
// const Joi = require("joi");

// const bcrypt = require("bcryptjs");
// const User = require("../models/User");

// const FitnessStaff = require("../models/FitnessStaff");

// // ─── Constants ────────────────────────────────────────────────────────────────
// const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "staff-profiles");
// const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png"];
// const ALLOWED_EXT = /\.(jpg|jpeg|png)$/i;

// // ─── Ensure upload directory exists ──────────────────────────────────────────
// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

// // ─── Multer configuration ─────────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination(_req, _file, cb) {
//     cb(null, UPLOAD_DIR);
//   },
//   filename(_req, file, cb) {
//     const timestamp = Date.now();
//     const safeName = file.originalname.replace(/\s+/g, "-");
//     cb(null, `photo-${timestamp}-${safeName}`);
//   },
// });

// const fileFilter = (_req, file, cb) => {
//   if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.test(file.originalname)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only JPG, JPEG, and PNG images are allowed"), false);
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
// });

// module.exports.upload = upload;

// // ─── Joi Validation Schemas ───────────────────────────────────────────────────
// const baseStaffSchema = {
//   fullName: Joi.string().trim().min(2).max(100),
//   role: Joi.string().trim().min(2).max(100),
//   gender: Joi.string().valid("Male", "Female", "Other"),
//   dateOfBirth: Joi.date().iso().max("now").allow(null, ""),
//   joiningDate: Joi.date().iso(),
//   employmentType: Joi.string().trim().allow(null, ""),
//   status: Joi.string().valid("Active", "Inactive", "Terminated"),
//   salary: Joi.number().min(0).allow(null, ""),
//   mobileNumber: Joi.string()
//     .pattern(/^\d{10}$/)
//     .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
//   emailId: Joi.string().email().allow(null, ""),
//   fullAddress: Joi.string().trim().max(500).allow(null, ""),
//   emergencyContactName: Joi.string().trim().max(100).allow(null, ""),
//   emergencyRelation: Joi.string().trim().max(100).allow(null, ""),
//   emergencyContactMobile: Joi.string()
//     .pattern(/^\d{10}$/)
//     .allow(null, "")
//     .messages({ "string.pattern.base": "Emergency mobile number must be 10 digits" }),
// };

// const createSchema = Joi.object({
//   ...baseStaffSchema,
//   fullName: Joi.string().trim().min(2).max(100).required(),
//   role: Joi.string().trim().min(2).max(100).required(),
//   gender: Joi.string().valid("Male", "Female", "Other").required(),
//   joiningDate: Joi.date().iso().required(),
//   mobileNumber: Joi.string()
//     .pattern(/^\d{10}$/)
//     .required()
//     .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
//   password: Joi.string()
//     .min(6)
//     .max(128)
//     .required()
//     .messages({ "string.min": "Password must be at least 6 characters" }),
// });

// const updateSchema = Joi.object({
//   ...baseStaffSchema,
//   password: Joi.string().min(6).max(128).allow(null, ""),
// }).min(1);

// // ─── Helper: consistent API response ──────────────────────────────────────────
// const respond = (res, statusCode, success, message, data = undefined) => {
//   const body = { success, message };
//   if (data !== undefined) body.data = data;
//   return res.status(statusCode).json(body);
// };

// // ─── Helper: photo URL path ───────────────────────────────────────────────────
// const buildPhotoPath = (filename) => `/uploads/staff-profiles/${filename}`;

// // ─── Helper: safely delete a file ─────────────────────────────────────────────
// const deleteFile = (filePath) => {
//   if (!filePath) return;

//   let absolutePath = filePath;

//   if (filePath.startsWith("/uploads/")) {
//     absolutePath = path.join(__dirname, "..", filePath);
//   }

//   absolutePath = path.resolve(absolutePath);

//   if (fs.existsSync(absolutePath)) {
//     try {
//       fs.unlinkSync(absolutePath);
//     } catch (_) {
//       // best effort
//     }
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // CREATE  POST /api/fitness/staff/create
// // ═════════════════════════════════════════════════════════════════════════════
// const createFitnessStaff = async (req, res) => {
//   try {
//     const { error, value } = createSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       if (req.file) deleteFile(req.file.path);
//       const messages = error.details.map((d) => d.message);
//       return respond(res, 422, false, "Validation failed", { errors: messages });
//     }

//     const [existingMobile, existingEmail] = await Promise.all([
//       FitnessStaff.findOne({ mobileNumber: value.mobileNumber }),
//       value.emailId ? FitnessStaff.findOne({ emailId: value.emailId }) : null,
//     ]);

//     if (existingMobile) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 409, false, "A staff member with this mobile number already exists");
//     }

//     if (existingEmail) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 409, false, "A staff member with this email address already exists");
//     }

//     delete value.employeeId;

//     const lastStaff = await FitnessStaff.findOne()
//       .sort({ createdAt: -1 })
//       .select("employeeId");

//     let nextNumber = 1;
//     if (lastStaff && lastStaff.employeeId) {
//       const num = parseInt(lastStaff.employeeId.replace("EMP", ""), 10);
//       if (!Number.isNaN(num)) nextNumber = num + 1;
//     }

//     const employeeId = "EMP" + String(nextNumber).padStart(4, "0");

//     const staffData = {
//       ...value,
//       employeeId,
//       profilePhoto: req.file ? buildPhotoPath(req.file.filename) : null,
//     };

//     const savedStaff = await FitnessStaff.create(staffData);

//     const staffUserId = `FITSTF${Math.floor(1000 + Math.random() * 9000)}`;

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(value.password, salt);

//     const newUser = new User({
//       userId: staffUserId,
//       password: hashedPassword,
//       fullName: value.fullName,
//       mobile: value.mobileNumber,
//       email: value.emailId || "",
//       role: "FitnessStaff",
//       userType: "fitness",
//       organizationId: "fitness",
//       staffId: savedStaff._id,
//       linkedId: savedStaff._id,
//       isActive: "Yes",
//     });

//     await newUser.save();

//     return respond(
//       res,
//       201,
//       true,
//       "Staff member created successfully with login credentials",
//       {
//         staff: savedStaff,
//         userCredentials: {
//           userId: staffUserId,
//           password: value.password,
//         },
//       }
//     );
//   } catch (err) {
//     if (req.file) deleteFile(req.file.path);
//     console.error("[createFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while creating staff member");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // READ ALL  GET /api/fitness/staff
// // ═════════════════════════════════════════════════════════════════════════════
// const getFitnessStaff = async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
//     const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
//     const skip = (page - 1) * limit;

//     const filter = {};
//     if (req.query.status) filter.status = req.query.status;
//     if (req.query.role) filter.role = new RegExp(req.query.role, "i");
//     if (req.query.search) filter.$text = { $search: req.query.search };

//     const [staff, total] = await Promise.all([
//       FitnessStaff.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
//       FitnessStaff.countDocuments(filter),
//     ]);

//     return respond(res, 200, true, "Staff members retrieved successfully", {
//       staff,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (err) {
//     console.error("[getFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while fetching staff members");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // READ ONE  GET /api/fitness/staff/:id
// // ═════════════════════════════════════════════════════════════════════════════
// const getFitnessStaffById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const staff = await FitnessStaff.findById(id).lean();

//     if (!staff) {
//       return respond(res, 404, false, "Staff member not found");
//     }

//     return respond(res, 200, true, "Staff member retrieved successfully", staff);
//   } catch (err) {
//     console.error("[getFitnessStaffById]", err);
//     return respond(res, 500, false, "Internal server error while fetching staff member");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // UPDATE  PUT /api/fitness/staff/:id
// // ═════════════════════════════════════════════════════════════════════════════
// const updateFitnessStaff = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const { error, value } = updateSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       if (req.file) deleteFile(req.file.path);
//       const messages = error.details.map((d) => d.message);
//       return respond(res, 422, false, "Validation failed", { errors: messages });
//     }

//     const existing = await FitnessStaff.findById(id);

//     if (!existing) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 404, false, "Staff member not found");
//     }

//     if (value.mobileNumber && value.mobileNumber !== existing.mobileNumber) {
//       const dup = await FitnessStaff.findOne({
//         mobileNumber: value.mobileNumber,
//         _id: { $ne: id },
//       });

//       if (dup) {
//         if (req.file) deleteFile(req.file.path);
//         return respond(res, 409, false, "Mobile number is already used by another staff member");
//       }
//     }

//     if (value.emailId && value.emailId !== existing.emailId) {
//       const dup = await FitnessStaff.findOne({
//         emailId: value.emailId,
//         _id: { $ne: id },
//       });

//       if (dup) {
//         if (req.file) deleteFile(req.file.path);
//         return respond(res, 409, false, "Email address is already used by another staff member");
//       }
//     }

//     if (!value.password) {
//       delete value.password;
//     }

//     if (req.file) {
//       deleteFile(existing.profilePhoto);
//       value.profilePhoto = buildPhotoPath(req.file.filename);
//     }

//     const updated = await FitnessStaff.findByIdAndUpdate(
//       id,
//       { $set: value },
//       { new: true, runValidators: true }
//     );

//     return respond(res, 200, true, "Staff member updated successfully", updated);
//   } catch (err) {
//     if (req.file) deleteFile(req.file.path);
//     console.error("[updateFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while updating staff member");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // DELETE  DELETE /api/fitness/staff/:id
// // ═════════════════════════════════════════════════════════════════════════════
// const deleteFitnessStaff = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const staff = await FitnessStaff.findById(id);

//     if (!staff) {
//       return respond(res, 404, false, "Staff member not found");
//     }

//     deleteFile(staff.profilePhoto);

//     await staff.deleteOne();

//     return respond(res, 200, true, "Staff member deleted successfully");
//   } catch (err) {
//     console.error("[deleteFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while deleting staff member");
//   }
// };

// module.exports = {
//   createFitnessStaff,
//   getFitnessStaff,
//   getFitnessStaffById,
//   updateFitnessStaff,
//   deleteFitnessStaff,
//   upload,
// };

/////////////////////








// controllers/fitnessStaffController.js
const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const FitnessStaff = require("../models/FitnessStaff");

// ─── Helper Functions ─────────────────────────────────────────────────────
const buildPhotoPath = (filename) => `/uploads/fitness/staff/${filename}`;

const deleteFile = (filePath) => {
  if (!filePath) return;

  let absolutePath = filePath;

  if (filePath.startsWith("/uploads/")) {
    absolutePath = path.join(__dirname, "..", filePath);
  }

  absolutePath = path.resolve(absolutePath);

  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      console.error(`Failed to delete file: ${absolutePath}`, err);
    }
  }
};

// ─── Joi Validation Schemas ───────────────────────────────────────────────
const baseStaffSchema = {
  fullName: Joi.string().trim().min(2).max(100),
  role: Joi.string().trim().min(2).max(100),
  gender: Joi.string().valid("Male", "Female", "Other"),
  dateOfBirth: Joi.date().iso().max("now").allow(null, ""),
  joiningDate: Joi.date().iso(),
  employmentType: Joi.string().trim().allow(null, ""),
  status: Joi.string().valid("Active", "Inactive", "Terminated"),
  salary: Joi.number().min(0).allow(null, ""),
  mobileNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
  emailId: Joi.string().email().allow(null, ""),
  fullAddress: Joi.string().trim().max(500).allow(null, ""),
  emergencyContactName: Joi.string().trim().max(100).allow(null, ""),
  emergencyRelation: Joi.string().trim().max(100).allow(null, ""),
  emergencyContactMobile: Joi.string()
    .pattern(/^\d{10}$/)
    .allow(null, "")
    .messages({ "string.pattern.base": "Emergency mobile number must be 10 digits" }),
};

const createSchema = Joi.object({
  ...baseStaffSchema,
  fullName: Joi.string().trim().min(2).max(100).required(),
  role: Joi.string().trim().min(2).max(100).required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  joiningDate: Joi.date().iso().required(),
  mobileNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({ "string.min": "Password must be at least 6 characters" }),
});

const updateSchema = Joi.object({
  ...baseStaffSchema,
  password: Joi.string().min(6).max(128).allow(null, ""),
}).min(1);

// ─── Helper Response ─────────────────────────────────────────────────────
const respond = (res, statusCode, success, message, data = null) => {
  const body = { success, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

// ═════════════════════════════════════════════════════════════════════════════
// CREATE STAFF
// ═════════════════════════════════════════════════════════════════════════════
const createFitnessStaff = async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: false });

    if (error) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 422, false, "Validation failed", {
        errors: error.details.map((d) => d.message)
      });
    }

    // Check for duplicates
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

    // Generate Employee ID
    const lastStaff = await FitnessStaff.findOne()
      .sort({ createdAt: -1 })
      .select("employeeId");

    let nextNumber = 1;
    if (lastStaff && lastStaff.employeeId) {
      const num = parseInt(lastStaff.employeeId.replace("EMP", ""), 10);
      if (!Number.isNaN(num)) nextNumber = num + 1;
    }

    const employeeId = "EMP" + String(nextNumber).padStart(4, "0");

    const staffData = {
      ...value,
      employeeId,
      profilePhoto: req.file ? buildPhotoPath(req.file.filename) : null,
    };

    const savedStaff = await FitnessStaff.create(staffData);

    // Create User Login
    const staffUserId = `FITSTF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(value.password, salt);

    await User.create({
      userId: staffUserId,
      password: hashedPassword,
      fullName: value.fullName,
      mobile: value.mobileNumber,
      email: value.emailId || "",
      role: "FitnessStaff",
      userType: "fitness",
      organizationId: "fitness",
      staffId: savedStaff._id,
      linkedId: savedStaff._id,
      isActive: "Yes",
    });

    return respond(res, 201, true, "Staff member created successfully with login credentials", {
      staff: savedStaff,
      userCredentials: {
        userId: staffUserId,
        password: value.password,
      }
    });

  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    console.error("[createFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while creating staff member");
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET ALL STAFF
// ═════════════════════════════════════════════════════════════════════════════
const getFitnessStaff = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && req.query.status.trim()) {
      filter.status = req.query.status.trim();
    }

    if (req.query.role && req.query.role.trim()) {
      filter.role = { $regex: req.query.role.trim(), $options: "i" };
    }

    if (req.query.gender && req.query.gender.trim()) {
      filter.gender = req.query.gender.trim();
    }

    if (req.query.employmentType && req.query.employmentType.trim()) {
      filter.employmentType = {
        $regex: req.query.employmentType.trim(),
        $options: "i",
      };
    }

    if (req.query.search && req.query.search.trim()) {
      const search = req.query.search.trim();

      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { emailId: { $regex: search, $options: "i" } },
      ];
    }

    const staff = await FitnessStaff.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return respond(res, 200, true, "Staff members retrieved successfully", {
      staff,
      filters: {
        status: req.query.status || "",
        role: req.query.role || "",
        gender: req.query.gender || "",
        employmentType: req.query.employmentType || "",
        search: req.query.search || "",
      },
    });
  } catch (err) {
    console.error("[getFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while fetching staff members");
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET SINGLE STAFF
// ═════════════════════════════════════════════════════════════════════════════
const getFitnessStaffById = async (req, res) => {
  try {
    const { id } = req.params;

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
// UPDATE STAFF
// ═════════════════════════════════════════════════════════════════════════════
// const updateFitnessStaff = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const { error, value } = updateSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 422, false, "Validation failed", {
//         errors: error.details.map((d) => d.message)
//       });
//     }

//     const existing = await FitnessStaff.findById(id);
//     if (!existing) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 404, false, "Staff member not found");
//     }

//     // Check duplicate mobile/email (if changed)
//     if (value.mobileNumber && value.mobileNumber !== existing.mobileNumber) {
//       const dup = await FitnessStaff.findOne({
//         mobileNumber: value.mobileNumber,
//         _id: { $ne: id },
//       });
//       if (dup) {
//         if (req.file) deleteFile(req.file.path);
//         return respond(res, 409, false, "Mobile number is already used by another staff member");
//       }
//     }

//     if (value.emailId && value.emailId !== existing.emailId) {
//       const dup = await FitnessStaff.findOne({
//         emailId: value.emailId,
//         _id: { $ne: id },
//       });
//       if (dup) {
//         if (req.file) deleteFile(req.file.path);
//         return respond(res, 409, false, "Email address is already used by another staff member");
//       }
//     }

//     if (!value.password) delete value.password;

//     // Handle new photo upload
//     if (req.file) {
//       deleteFile(existing.profilePhoto);
//       value.profilePhoto = buildPhotoPath(req.file.filename);
//     }

//     const updated = await FitnessStaff.findByIdAndUpdate(
//       id,
//       { $set: value },
//       { new: true, runValidators: true }
//     );

//     return respond(res, 200, true, "Staff member updated successfully", updated);
//   } catch (err) {
//     if (req.file) deleteFile(req.file.path);
//     console.error("[updateFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while updating staff member");
//   }
// };

const updateFitnessStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 400, false, "Invalid staff ID format");
    }

    const { error, value } = updateSchema.validate(req.body, { abortEarly: false });

    if (error) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 422, false, "Validation failed", {
        errors: error.details.map((d) => d.message)
      });
    }

    const existing = await FitnessStaff.findById(id);
    if (!existing) {
      if (req.file) deleteFile(req.file.path);
      return respond(res, 404, false, "Staff member not found");
    }

    // Duplicate checks
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

    if (!value.password) delete value.password;

    // === MOST IMPORTANT PART ===
    if (req.file) {
      // Delete old photo
      deleteFile(existing.profilePhoto);
      // Set new photo
      value.profilePhoto = buildPhotoPath(req.file.filename);
    }
    // If no new file uploaded, do NOT overwrite profilePhoto with null/undefined

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
// DELETE STAFF
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

    deleteFile(staff.profilePhoto);

    await staff.deleteOne();

    return respond(res, 200, true, "Staff member deleted successfully");
  } catch (err) {
    console.error("[deleteFitnessStaff]", err);
    return respond(res, 500, false, "Internal server error while deleting staff member");
  }
};

// Export all controllers
module.exports = {
  createFitnessStaff,
  getFitnessStaff,
  getFitnessStaffById,
  updateFitnessStaff,
  deleteFitnessStaff,
};













// // controllers/fitnessStaffController.js
// const fs = require("fs");
// const path = require("path");
// const Joi = require("joi");
// const bcrypt = require("bcryptjs");

// const User = require("../models/User");
// const FitnessStaff = require("../models/FitnessStaff");

// // ─── Helper Functions ─────────────────────────────────────────────────────
// const buildPhotoPath = (filename) => `/uploads/fitness/staff/${filename}`;

// const deleteFile = (filePath) => {
//   if (!filePath) return;

//   let absolutePath = filePath;

//   if (filePath.startsWith("/uploads/")) {
//     absolutePath = path.join(__dirname, "..", filePath);
//   }

//   absolutePath = path.resolve(absolutePath);

//   if (fs.existsSync(absolutePath)) {
//     try {
//       fs.unlinkSync(absolutePath);
//     } catch (err) {
//       console.error(`Failed to delete file: ${absolutePath}`, err);
//     }
//   }
// };

// // ─── Joi Validation Schemas ───────────────────────────────────────────────
// const baseStaffSchema = {
//   fullName: Joi.string().trim().min(2).max(100),
//   role: Joi.string().trim().min(2).max(100),
//   gender: Joi.string().valid("Male", "Female", "Other"),
//   dateOfBirth: Joi.date().iso().max("now").allow(null, ""),
//   joiningDate: Joi.date().iso(),
//   employmentType: Joi.string().trim().allow(null, ""),
//   status: Joi.string().valid("Active", "Inactive", "Terminated"),
//   salary: Joi.number().min(0).allow(null, ""),
//   mobileNumber: Joi.string()
//     .pattern(/^\d{10}$/)
//     .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
//   emailId: Joi.string().email().allow(null, ""),
//   fullAddress: Joi.string().trim().max(500).allow(null, ""),
//   emergencyContactName: Joi.string().trim().max(100).allow(null, ""),
//   emergencyRelation: Joi.string().trim().max(100).allow(null, ""),
//   emergencyContactMobile: Joi.string()
//     .pattern(/^\d{10}$/)
//     .allow(null, "")
//     .messages({ "string.pattern.base": "Emergency mobile number must be 10 digits" }),
// };

// const createSchema = Joi.object({
//   ...baseStaffSchema,
//   fullName: Joi.string().trim().min(2).max(100).required(),
//   role: Joi.string().trim().min(2).max(100).required(),
//   gender: Joi.string().valid("Male", "Female", "Other").required(),
//   joiningDate: Joi.date().iso().required(),
//   mobileNumber: Joi.string()
//     .pattern(/^\d{10}$/)
//     .required()
//     .messages({ "string.pattern.base": "Mobile number must be 10 digits" }),
//   password: Joi.string()
//     .min(6)
//     .max(128)
//     .required()
//     .messages({ "string.min": "Password must be at least 6 characters" }),
// });

// const updateSchema = Joi.object({
//   ...baseStaffSchema,
//   password: Joi.string().min(6).max(128).allow(null, ""),
// }).min(1);

// // ─── Helper Response ─────────────────────────────────────────────────────
// const respond = (res, statusCode, success, message, data = null) => {
//   const body = { success, message };
//   if (data !== null) body.data = data;
//   return res.status(statusCode).json(body);
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // CREATE STAFF
// // ═════════════════════════════════════════════════════════════════════════════
// const createFitnessStaff = async (req, res) => {
//   try {
//     const { error, value } = createSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 422, false, "Validation failed", {
//         errors: error.details.map((d) => d.message)
//       });
//     }

//     // Check for duplicates
//     const [existingMobile, existingEmail] = await Promise.all([
//       FitnessStaff.findOne({ mobileNumber: value.mobileNumber }),
//       value.emailId ? FitnessStaff.findOne({ emailId: value.emailId }) : null,
//     ]);

//     if (existingMobile) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 409, false, "A staff member with this mobile number already exists");
//     }

//     if (existingEmail) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 409, false, "A staff member with this email address already exists");
//     }

//     // Generate Employee ID
//     const lastStaff = await FitnessStaff.findOne()
//       .sort({ createdAt: -1 })
//       .select("employeeId");

//     let nextNumber = 1;
//     if (lastStaff && lastStaff.employeeId) {
//       const num = parseInt(lastStaff.employeeId.replace("EMP", ""), 10);
//       if (!Number.isNaN(num)) nextNumber = num + 1;
//     }

//     const employeeId = "EMP" + String(nextNumber).padStart(4, "0");

//     const staffData = {
//       ...value,
//       employeeId,
//       profilePhoto: req.file ? buildPhotoPath(req.file.filename) : null,
//     };

//     const savedStaff = await FitnessStaff.create(staffData);

//     // Create User Login
//     const staffUserId = `FITSTF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(value.password, salt);

//     await User.create({
//       userId: staffUserId,
//       password: hashedPassword,
//       fullName: value.fullName,
//       mobile: value.mobileNumber,
//       email: value.emailId || "",
//       role: "FitnessStaff",
//       userType: "fitness",
//       organizationId: "fitness",
//       staffId: savedStaff._id,
//       linkedId: savedStaff._id,
//       isActive: "Yes",
//     });

//     return respond(res, 201, true, "Staff member created successfully with login credentials", {
//       staff: savedStaff,
//       userCredentials: {
//         userId: staffUserId,
//         password: value.password,
//       }
//     });

//   } catch (err) {
//     if (req.file) deleteFile(req.file.path);
//     console.error("[createFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while creating staff member");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // GET ALL STAFF
// // ═════════════════════════════════════════════════════════════════════════════
// const getFitnessStaff = async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);

//     let limit = parseInt(req.query.limit, 10) || 5;
//     if (limit < 5) limit = 5;
//     if (limit > 100) limit = 100;

//     const skip = (page - 1) * limit;

//     const filter = {};

//     if (req.query.status && req.query.status.trim()) {
//       filter.status = req.query.status.trim();
//     }

//     if (req.query.role && req.query.role.trim()) {
//       filter.role = { $regex: req.query.role.trim(), $options: "i" };
//     }

//     if (req.query.gender && req.query.gender.trim()) {
//       filter.gender = req.query.gender.trim();
//     }

//     if (req.query.employmentType && req.query.employmentType.trim()) {
//       filter.employmentType = {
//         $regex: req.query.employmentType.trim(),
//         $options: "i",
//       };
//     }

//     if (req.query.search && req.query.search.trim()) {
//       const search = req.query.search.trim();

//       filter.$or = [
//         { fullName: { $regex: search, $options: "i" } },
//         { role: { $regex: search, $options: "i" } },
//         { employeeId: { $regex: search, $options: "i" } },
//         { mobileNumber: { $regex: search, $options: "i" } },
//         { emailId: { $regex: search, $options: "i" } },
//       ];
//     }

//     const [staff, total] = await Promise.all([
//       FitnessStaff.find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       FitnessStaff.countDocuments(filter),
//     ]);

//     return respond(res, 200, true, "Staff members retrieved successfully", {
//       staff,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page < Math.ceil(total / limit),
//         hasPrevPage: page > 1,
//       },
//       filters: {
//         status: req.query.status || "",
//         role: req.query.role || "",
//         gender: req.query.gender || "",
//         employmentType: req.query.employmentType || "",
//         search: req.query.search || "",
//       },
//     });
//   } catch (err) {
//     console.error("[getFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while fetching staff members");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // GET SINGLE STAFF
// // ═════════════════════════════════════════════════════════════════════════════
// const getFitnessStaffById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const staff = await FitnessStaff.findById(id).lean();

//     if (!staff) {
//       return respond(res, 404, false, "Staff member not found");
//     }

//     return respond(res, 200, true, "Staff member retrieved successfully", staff);
//   } catch (err) {
//     console.error("[getFitnessStaffById]", err);
//     return respond(res, 500, false, "Internal server error while fetching staff member");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // UPDATE STAFF
// // ═════════════════════════════════════════════════════════════════════════════
// // const updateFitnessStaff = async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
// //       if (req.file) deleteFile(req.file.path);
// //       return respond(res, 400, false, "Invalid staff ID format");
// //     }

// //     const { error, value } = updateSchema.validate(req.body, { abortEarly: false });

// //     if (error) {
// //       if (req.file) deleteFile(req.file.path);
// //       return respond(res, 422, false, "Validation failed", {
// //         errors: error.details.map((d) => d.message)
// //       });
// //     }

// //     const existing = await FitnessStaff.findById(id);
// //     if (!existing) {
// //       if (req.file) deleteFile(req.file.path);
// //       return respond(res, 404, false, "Staff member not found");
// //     }

// //     // Check duplicate mobile/email (if changed)
// //     if (value.mobileNumber && value.mobileNumber !== existing.mobileNumber) {
// //       const dup = await FitnessStaff.findOne({
// //         mobileNumber: value.mobileNumber,
// //         _id: { $ne: id },
// //       });
// //       if (dup) {
// //         if (req.file) deleteFile(req.file.path);
// //         return respond(res, 409, false, "Mobile number is already used by another staff member");
// //       }
// //     }

// //     if (value.emailId && value.emailId !== existing.emailId) {
// //       const dup = await FitnessStaff.findOne({
// //         emailId: value.emailId,
// //         _id: { $ne: id },
// //       });
// //       if (dup) {
// //         if (req.file) deleteFile(req.file.path);
// //         return respond(res, 409, false, "Email address is already used by another staff member");
// //       }
// //     }

// //     if (!value.password) delete value.password;

// //     // Handle new photo upload
// //     if (req.file) {
// //       deleteFile(existing.profilePhoto);
// //       value.profilePhoto = buildPhotoPath(req.file.filename);
// //     }

// //     const updated = await FitnessStaff.findByIdAndUpdate(
// //       id,
// //       { $set: value },
// //       { new: true, runValidators: true }
// //     );

// //     return respond(res, 200, true, "Staff member updated successfully", updated);
// //   } catch (err) {
// //     if (req.file) deleteFile(req.file.path);
// //     console.error("[updateFitnessStaff]", err);
// //     return respond(res, 500, false, "Internal server error while updating staff member");
// //   }
// // };

// const updateFitnessStaff = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const { error, value } = updateSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 422, false, "Validation failed", {
//         errors: error.details.map((d) => d.message)
//       });
//     }

//     const existing = await FitnessStaff.findById(id);
//     if (!existing) {
//       if (req.file) deleteFile(req.file.path);
//       return respond(res, 404, false, "Staff member not found");
//     }

//     // Duplicate checks
//     if (value.mobileNumber && value.mobileNumber !== existing.mobileNumber) {
//       const dup = await FitnessStaff.findOne({ mobileNumber: value.mobileNumber, _id: { $ne: id } });
//       if (dup) {
//         if (req.file) deleteFile(req.file.path);
//         return respond(res, 409, false, "Mobile number is already used by another staff member");
//       }
//     }

//     if (value.emailId && value.emailId !== existing.emailId) {
//       const dup = await FitnessStaff.findOne({ emailId: value.emailId, _id: { $ne: id } });
//       if (dup) {
//         if (req.file) deleteFile(req.file.path);
//         return respond(res, 409, false, "Email address is already used by another staff member");
//       }
//     }

//     if (!value.password) delete value.password;

//     // === MOST IMPORTANT PART ===
//     if (req.file) {
//       // Delete old photo
//       deleteFile(existing.profilePhoto);
//       // Set new photo
//       value.profilePhoto = buildPhotoPath(req.file.filename);
//     }
//     // If no new file uploaded, do NOT overwrite profilePhoto with null/undefined

//     const updated = await FitnessStaff.findByIdAndUpdate(
//       id,
//       { $set: value },
//       { new: true, runValidators: true }
//     );

//     return respond(res, 200, true, "Staff member updated successfully", updated);
//   } catch (err) {
//     if (req.file) deleteFile(req.file.path);
//     console.error("[updateFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while updating staff member");
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // DELETE STAFF
// // ═════════════════════════════════════════════════════════════════════════════
// const deleteFitnessStaff = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       return respond(res, 400, false, "Invalid staff ID format");
//     }

//     const staff = await FitnessStaff.findById(id);
//     if (!staff) {
//       return respond(res, 404, false, "Staff member not found");
//     }

//     deleteFile(staff.profilePhoto);

//     await staff.deleteOne();

//     return respond(res, 200, true, "Staff member deleted successfully");
//   } catch (err) {
//     console.error("[deleteFitnessStaff]", err);
//     return respond(res, 500, false, "Internal server error while deleting staff member");
//   }
// };

// // Export all controllers
// module.exports = {
//   createFitnessStaff,
//   getFitnessStaff,
//   getFitnessStaffById,
//   updateFitnessStaff,
//   deleteFitnessStaff,
// };