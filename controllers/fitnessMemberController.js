// const FitnessMember = require('../models/FitnessMember');
// const FitnessEnquiry = require('../models/FitnessEnquiry');
// const multer = require('multer');
// const path = require('path');

// // Multer configuration for photo upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/members/'); // Make sure this folder exists
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 2 * 1024 * 1024 // 2MB max photo size
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|webp/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) {
//       return cb(null, true);
//     }
//     cb(new Error('Only JPG, PNG and WebP images are allowed!'));
//   }
// }).single('photo');

// // Helper to delete old photo if needed (for update)
// const fs = require('fs');
// const deleteOldPhoto = (photoPath) => {
//   if (photoPath && photoPath.startsWith('/uploads/')) {
//     const fullPath = path.join(__dirname, '..', photoPath);
//     if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
//   }
// };

// /**
//  * @desc    Get all fitness members with filtering
//  * @route   GET /api/fitness/member
//  * @access  Private
//  */
// exports.getAllMembers = async (req, res) => {
//   try {
//     const { search, status, activity, plan } = req.query;

//     let query = { organizationId: req.organizationId };

//     if (status) query.status = status;
//     if (activity) query.activity = activity;
//     if (plan) query.plan = plan;

//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } },
//         { memberId: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const members = await FitnessMember.find(query)
//       .sort({ createdAt: -1 })
//       .select('-password'); // Never return password

//     res.json(members);
//   } catch (err) {
//     console.error('Error fetching members:', err.message);
//     res.status(500).json({ message: 'Server error while fetching members' });
//   }
// };

// /**
//  * @desc    Get single member by ID
//  * @route   GET /api/fitness/member/:id
//  * @access  Private
//  */
// exports.getMemberById = async (req, res) => {
//   try {
//     const member = await FitnessMember.findOne({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     }).select('-password');

//     if (!member) {
//       return res.status(404).json({ message: 'Member not found' });
//     }

//     res.json(member);
//   } catch (err) {
//     console.error('Error fetching member:', err.message);
//     res.status(500).json({ message: 'Server error while fetching member' });
//   }
// };

// /**
//  * @desc    Create new fitness member (supports photo upload + optional enquiry link)
//  * @route   POST /api/fitness/member
//  * @access  Private
//  */
// exports.createMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ message: 'Photo size cannot exceed 2MB' });
//       }
//       if (err.message.includes('Only JPG')) {
//         return res.status(400).json({ message: err.message });
//       }
//       return res.status(400).json({ message: err.message || 'Photo upload failed' });
//     }

//     try {
//       const memberData = { ...req.body, organizationId: req.organizationId };

//       // If photo was uploaded, set path
//       if (req.file) {
//         memberData.photo = `/uploads/members/${req.file.filename}`;
//       }

//       // Validate required fields (extra safety)
//       if (!memberData.name || !memberData.mobile || !memberData.activity || !memberData.startDate || !memberData.password) {
//         if (req.file) deleteOldPhoto(memberData.photo); // cleanup
//         return res.status(400).json({ message: 'Name, mobile, activity, start date and password are required' });
//       }

//       const member = new FitnessMember(memberData);
//       await member.save();

//       // If enquiry was selected → mark it as Admitted
//       if (memberData.enquiryId) {
//         await FitnessEnquiry.findByIdAndUpdate(
//           memberData.enquiryId,
//           { status: 'Admitted' }
//         );
//       }

//       // Return without password
//       const createdMember = member.toObject();
//       delete createdMember.password;

//       res.status(201).json({
//         ...createdMember,
//         message: 'Member added successfully'
//       });
//     } catch (err) {
//       // Cleanup uploaded photo on error
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);

//       console.error('Error creating member:', err.message);
//       if (err.code === 11000) {
//         return res.status(400).json({ message: 'Mobile number already exists' });
//       }
//       res.status(500).json({ message: 'Server error while creating member' });
//     }
//   });
// };

// /**
//  * @desc    Update member (supports new photo upload)
//  * @route   PUT /api/fitness/member/:id
//  * @access  Private
//  */
// exports.updateMember = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Photo size cannot exceed 2MB' });
//       return res.status(400).json({ message: err.message || 'Photo upload failed' });
//     }

//     try {
//       const member = await FitnessMember.findOne({
//         _id: req.params.id,
//         organizationId: req.organizationId
//       });

//       if (!member) {
//         if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//         return res.status(404).json({ message: 'Member not found' });
//       }

//       const updateData = { ...req.body };

//       // If new photo uploaded → delete old one
//       if (req.file) {
//         if (member.photo) deleteOldPhoto(member.photo);
//         updateData.photo = `/uploads/members/${req.file.filename}`;
//       }

//       // Update fields
//       Object.assign(member, updateData);
//       await member.save();

//       const updated = member.toObject();
//       delete updated.password;

//       res.json({
//         ...updated,
//         message: 'Member updated successfully'
//       });
//     } catch (err) {
//       if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
//       console.error('Error updating member:', err.message);
//       if (err.code === 11000) {
//         return res.status(400).json({ message: 'Mobile number already exists' });
//       }
//       res.status(500).json({ message: 'Server error while updating member' });
//     }
//   });
// };

// /**
//  * @desc    Delete member
//  * @route   DELETE /api/fitness/member/:id
//  * @access  Private
//  */
// exports.deleteMember = async (req, res) => {
//   try {
//     const member = await FitnessMember.findOneAndDelete({
//       _id: req.params.id,
//       organizationId: req.organizationId
//     });

//     if (!member) {
//       return res.status(404).json({ message: 'Member not found' });
//     }

//     // Delete photo if exists
//     if (member.photo) deleteOldPhoto(member.photo);

//     res.json({ message: 'Member deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting member:', err.message);
//     res.status(500).json({ message: 'Server error while deleting member' });
//   }
// };









// controllers/fitnessMemberController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FitnessMember = require('../models/FitnessMember');
const FitnessEnquiry = require('../models/FitnessEnquiry');

// ─────────────────────────────────────────────────────────────────────────────
// Multer configuration for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'members');
    fs.mkdirSync(uploadDir, { recursive: true }); // ✅ create folder if missing
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'member-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only JPG, PNG and WebP images are allowed!'));
  }
}).single('photo');

// ─────────────────────────────────────────────────────────────────────────────
// Helper to delete old photo from disk
const deleteOldPhoto = (photoPath) => {
  if (photoPath && photoPath.startsWith('/uploads/')) {
    const fullPath = path.join(__dirname, '..', photoPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get all fitness members with filtering
 * @route   GET /api/fitness/member
 * @access  Private
 */
exports.getAllMembers = async (req, res) => {
  try {
    const { search, status, activity, plan } = req.query;

    const query = { organizationId: req.organizationId };

    if (status) query.status = status;
    if (activity) query.activity = activity;
    if (plan) query.plan = plan;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await FitnessMember.find(query)
      .sort({ createdAt: -1 })
      .select('-password');

    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err.message);
    res.status(500).json({ message: 'Server error while fetching members' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get single member by ID
 * @route   GET /api/fitness/member/:id
 * @access  Private
 */
exports.getMemberById = async (req, res) => {
  try {
    const member = await FitnessMember.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    }).select('-password');

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(member);
  } catch (err) {
    console.error('Error fetching member:', err.message);
    res.status(500).json({ message: 'Server error while fetching member' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create new fitness member
 * @route   POST /api/fitness/member
 * @access  Private
 */
exports.createMember = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Photo size cannot exceed 2MB' });
      }
      return res.status(400).json({ message: err.message || 'Photo upload failed' });
    }

    try {
      const memberData = { ...req.body, organizationId: req.organizationId };

      if (req.file) {
        memberData.photo = `/uploads/members/${req.file.filename}`;
      }

      // Validate required fields
      if (!memberData.name || !memberData.mobile || !memberData.activity || !memberData.startDate || !memberData.password) {
        if (req.file) deleteOldPhoto(memberData.photo);
        return res.status(400).json({ message: 'Name, mobile, activity, start date and password are required' });
      }

      const member = new FitnessMember(memberData);
      await member.save();

      // If enquiry was selected → mark it as Admitted
      if (memberData.enquiryId) {
        await FitnessEnquiry.findByIdAndUpdate(memberData.enquiryId, { status: 'Admitted' });
      }

      const createdMember = member.toObject();
      delete createdMember.password;

      res.status(201).json({
        ...createdMember,
        message: 'Member added successfully'
      });
    } catch (err) {
      if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
      console.error('Error creating member:', err.message);
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
      res.status(500).json({ message: 'Server error while creating member' });
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Update member
 * @route   PUT /api/fitness/member/:id
 * @access  Private
 */
exports.updateMember = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Photo size cannot exceed 2MB' });
      }
      return res.status(400).json({ message: err.message || 'Photo upload failed' });
    }

    try {
      const member = await FitnessMember.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
      });

      if (!member) {
        if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
        return res.status(404).json({ message: 'Member not found' });
      }

      const updateData = { ...req.body };

      if (req.file) {
        // Delete old photo before replacing
        if (member.photo) deleteOldPhoto(member.photo);
        updateData.photo = `/uploads/members/${req.file.filename}`;
      }

      Object.assign(member, updateData);
      await member.save();

      const updated = member.toObject();
      delete updated.password;

      res.json({
        ...updated,
        message: 'Member updated successfully'
      });
    } catch (err) {
      if (req.file) deleteOldPhoto(`/uploads/members/${req.file.filename}`);
      console.error('Error updating member:', err.message);
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
      res.status(500).json({ message: 'Server error while updating member' });
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Delete member
 * @route   DELETE /api/fitness/member/:id
 * @access  Private
 */
exports.deleteMember = async (req, res) => {
  try {
    const member = await FitnessMember.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Delete photo from disk if it exists
    if (member.photo) deleteOldPhoto(member.photo);

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('Error deleting member:', err.message);
    res.status(500).json({ message: 'Server error while deleting member' });
  }
};