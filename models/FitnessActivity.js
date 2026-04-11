 // // Running Code
// const mongoose = require('mongoose');

// const fitnessActivitySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     unique: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// fitnessActivitySchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports =
//   mongoose.models.FitnessActivity ||
//   mongoose.model('FitnessActivity', fitnessActivitySchema);




// const mongoose = require('mongoose');

// const fitnessActivitySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       unique: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model('FitnessActivity', fitnessActivitySchema);




// const mongoose = require('mongoose');

// const slotSchema = new mongoose.Schema({
//   startTime: {
//     type: String,
//     required: true
//   },
//   endTime: {
//     type: String,
//     required: true
//   },
//   staffId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'FitnessStaff',   // 🔥 must match your model name
//     required: true
//   }
// });

// const fitnessActivitySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     unique: true
//   },

//   capacity: {              // 🔥 ADD THIS
//     type: Number,
//     required: true
//   },

//   slots: [slotSchema],

//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// fitnessActivitySchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports =
//   mongoose.models.FitnessActivity ||
//   mongoose.model('FitnessActivity', fitnessActivitySchema);















const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessStaff',
    required: true
  },
  membersOnly: {           // ✅ NEW FIELD
    type: Boolean,
    default: true
  }
});

const fitnessActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  slots: [slotSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

fitnessActivitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.FitnessActivity || 
                 mongoose.model('FitnessActivity', fitnessActivitySchema);