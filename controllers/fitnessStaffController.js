







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

//     const staff = await FitnessStaff.find(filter)
//       .sort({ createdAt: -1 })
//       .lean();

//     return respond(res, 200, true, "Staff members retrieved successfully", {
//       staff,
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















// controllers/fitnessStaffController.js
const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const FitnessStaff = require("../models/FitnessStaff");
const AccessRole = require("../models/AccessRole");

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

//    const staffData = {
//   ...value,
//   employeeId,
//   profilePhoto: req.file ? buildPhotoPath(req.file.filename) : null,
// };

// if (value.emailId?.trim()) {
//   staffData.emailId = value.emailId.trim();
// } else {
//   delete staffData.emailId;
// }


const staffData = {
  employeeId,
  fullName: value.fullName,
  role: value.role,
  gender: value.gender,
  dateOfBirth: value.dateOfBirth,
  joiningDate: value.joiningDate,
  employmentType: value.employmentType,
  status: value.status,
  salary: value.salary,
  mobileNumber: value.mobileNumber,
  password: value.password,
  fullAddress: value.fullAddress,
  emergencyContactName: value.emergencyContactName,
  emergencyRelation: value.emergencyRelation,
  emergencyContactMobile: value.emergencyContactMobile,
  profilePhoto: req.file ? buildPhotoPath(req.file.filename) : null,
};

if (value.emailId?.trim()) {
  staffData.emailId = value.emailId.trim();
}

// console.log("FINAL staffData before save:", staffData);

    const savedStaff = await FitnessStaff.create(staffData);

    // Create User Login
    const staffUserId = `FITSTF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(value.password, salt);

// 🔥 Fetch default FitnessStaff role
const accessRole = await AccessRole.findOne({
  roleKey: 'FITNESS_STAFF',
  organizationId: 'fitness'
}).lean();

    await User.create({
      userId: staffUserId,
      password: hashedPassword,
      fullName: value.fullName,
      mobile: value.mobileNumber,

        ...(value.emailId?.trim() && {
    email: value.emailId.trim(),
  }),
      role: "FitnessStaff",
      userType: "fitness",
      organizationId: "fitness",
      staffId: savedStaff._id,
      linkedId: savedStaff._id,
      accessRoleId: accessRole?._id || null, // ✅ ADD THIS
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

    // if (value.emailId && value.emailId !== existing.emailId) 
    const incomingEmail = value.emailId?.trim();

if (incomingEmail && incomingEmail !== existing.emailId){
      const dup = await FitnessStaff.findOne({
  emailId: incomingEmail,
  _id: { $ne: id }
});
      if (dup) {
        if (req.file) deleteFile(req.file.path);
        return respond(res, 409, false, "Email address is already used by another staff member");
      }
    }

    // if (!value.password) delete value.password;

    // // === MOST IMPORTANT PART ===
    // if (req.file) {
    //   // Delete old photo
    //   deleteFile(existing.profilePhoto);
    //   // Set new photo
    //   value.profilePhoto = buildPhotoPath(req.file.filename);
    // }
    // // If no new file uploaded, do NOT overwrite profilePhoto with null/undefined

    // const updated = await FitnessStaff.findByIdAndUpdate(
    //   id,
    //   { $set: value },
    //   { new: true, runValidators: true }
    // );

if (!value.password) {
  delete value.password;
}

const updateData = { ...value };
const unsetData = {};

// Handle email safely
if (value.emailId?.trim()) {
  updateData.emailId = value.emailId.trim();
} else {
  delete updateData.emailId;
  unsetData.emailId = "";
}

// Handle profile photo
if (req.file) {
  deleteFile(existing.profilePhoto);
  updateData.profilePhoto = buildPhotoPath(req.file.filename);
}

// Final update object
const updateQuery = {
  $set: updateData,
};

if (Object.keys(unsetData).length > 0) {
  updateQuery.$unset = unsetData;
}

const updated = await FitnessStaff.findByIdAndUpdate(
  id,
  updateQuery,
  {
    new: true,
    runValidators: true,
  }
);

await User.findOneAndUpdate(
  {
    linkedId: existing._id,
    organizationId: "fitness",
    userType: "fitness",
  },
  {
    $set: {
      fullName: updated.fullName,
      mobile: updated.mobileNumber,
      ...(updated.emailId
        ? { email: updated.emailId }
        : {}),
    },
    ...(updated.emailId
      ? {}
      : {
          $unset: {
            email: "",
          },
        }),
  }
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

    // Delete profile photo
    deleteFile(staff.profilePhoto);

    // ================= DELETE LINKED USER =================
    try {
      await User.findOneAndDelete({
        linkedId: staff._id,
        organizationId: "fitness",
        userType: "fitness"
      });
    } catch (userErr) {
      console.error("User deletion failed (non-fatal):", userErr.message);
    }

    // Delete staff record
    await staff.deleteOne();

    return respond(
      res,
      200,
      true,
      "Staff member deleted successfully"
    );

  } catch (err) {
    console.error("[deleteFitnessStaff]", err);

    return respond(
      res,
      500,
      false,
      "Internal server error while deleting staff member"
    );
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












