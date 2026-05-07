// const FitnessMember = require("../models/FitnessMember");
// const FitnessBooking = require("../models/FitnessBooking");
// const FitnessFeePayment = require("../models/FitnessFeePayment");
// const FitnessActivity = require("../models/FitnessActivity");
// const FitnessFeeType = require("../models/FitnessFeeType");
// const razorpay = require("../config/razorpay");

// const crypto = require("crypto");
// const FitnessFeeAllotment = require("../models/FitnessFeeAllotment");

// // =====================================================
// // COMMON MEMBER FINDER
// // Because login may come from User collection OR FitnessMember
// // so using req.user.id is unreliable
// // =====================================================
// const findLoggedInMember = async (req) => {
//   const identifier = req.user?.userId;

//   if (!identifier) return null;

//   const member = await FitnessMember.findOne({
//     $or: [
//       { mobile: identifier },
//       { userId: identifier }
//     ]
//   })
//     .populate("activityFees.activity")
//     // .populate("membershipPass")
//     .lean();

//   return member;
// };


// // ============================================
// // MEMBER DASHBOARD
// // GET /api/fitness/member-panel/dashboard
// // ============================================
// exports.getMemberDashboard = async (req, res) => {
//   try {
//     const organizationId = req.organizationId;

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // Active memberships only
//     const activeMemberships = (member.activityFees || []).filter(
//       item => item.membershipStatus === "Active"
//     );

//     // Recent bookings
//     const bookings = await FitnessBooking.find({
//       memberId: member._id
//     })
//       .populate("activityId")
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .lean();

//     // Recent payments
//     const recentPayments = await FitnessFeePayment.find({
//       memberId: member._id,
//       organizationId
//     })
//       .sort({ paymentDate: -1 })
//       .limit(5)
//       .lean();

//     // Pending dues
//     let pendingDues = 0;

//     for (const item of member.activityFees || []) {
//       if (item.paymentStatus === "Pending") {
//         pendingDues += Number(item.finalAmount || 0);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Dashboard fetched successfully",
//       data: {
//         member: {
//           id: member._id,
//           memberId: member.memberId,
//           name: member.name,
//           mobile: member.mobile,
//           email: member.email || "",
//           photo: member.photo || "",
//           membershipStatus: member.membershipStatus,
//           status: member.status
//         },

//         membershipSummary: {
//           totalActiveMemberships: activeMemberships.length,
//           pendingDues,
//           isPassMember: !!member.membershipPass,
//           numberOfPersons: member.numberOfPersons || 1
//         },

//         activeMemberships: activeMemberships.map(item => ({
//           activityName: item.activity?.name || "Membership Pass",
//           plan: item.plan,
//           startDate: item.startDate,
//           endDate: item.endDate,
//           finalAmount: item.finalAmount,
//           paymentStatus: item.paymentStatus,
//           membershipStatus: item.membershipStatus
//         })),

//         recentBookings: bookings.map(item => ({
//           bookingId: item._id,
//           activityName: item.activityId?.name || "N/A",
//           bookingDate: item.date,
//           customerName: item.customerName,
//           phone: item.phone,
//           bookingStatus: item.bookingStatus || "Pending Approval",
//           paymentStatus: item.paymentStatus || "Paid"
//         })),

//         recentPayments: recentPayments.map(item => ({
//           paymentId: item._id,
//           amount: item.amount,
//           paymentMode: item.paymentMode,
//           paymentDate: item.paymentDate,
//           description: item.description || "",
//           source: "Razorpay Booking Payment"
//         }))
//       }
//     });

//   } catch (error) {
//     console.error("getMemberDashboard error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch dashboard"
//     });
//   }
// };



// // ============================================
// // MEMBERSHIP SUMMARY
// // GET /api/fitness/member-panel/membership
// // ============================================
// exports.getMemberMembershipSummary = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Membership summary fetched successfully",
//       data: {
//         memberId: member.memberId,
//         isPassMember: !!member.membershipPass,
//         numberOfPersons: member.numberOfPersons || 1,
//         membershipStatus: member.membershipStatus,
//         memberships: (member.activityFees || []).map(item => ({
//           activityName: item.activity?.name || "Membership Pass",
//           plan: item.plan,
//           planFee: item.planFee,
//           discount: item.discount,
//           finalAmount: item.finalAmount,
//           paymentStatus: item.paymentStatus,
//           paymentMode: item.paymentMode,
//           paymentDate: item.paymentDate,
//           startDate: item.startDate,
//           endDate: item.endDate,
//           membershipStatus: item.membershipStatus,
//           notes: item.planNotes || ""
//         }))
//       }
//     });

//   } catch (error) {
//     console.error("getMemberMembershipSummary error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch membership summary"
//     });
//   }
// };


// // ============================================
// // AVAILABLE ACTIVITIES + SLOT AVAILABILITY
// // GET /api/fitness/member-panel/available-activities
// // ============================================
// exports.getAvailableActivities = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // FIX:
//     // populate fullName instead of name
//     const activities = await FitnessActivity.find({})
//       .populate("slots.staffId", "fullName")
//       .lean();

//     const today = new Date().toISOString().split("T")[0];

//     const formattedActivities = [];

//     for (const activity of activities) {
//       const formattedSlots = [];

//       for (const slot of activity.slots || []) {
//         const bookedCount = await FitnessBooking.countDocuments({
//           activityId: activity._id,
//           slotId: slot._id,
//           date: today,
//           bookingStatus: "Confirmed"
//         });

//         const availableSeats = Math.max(
//           (activity.capacity || 0) - bookedCount,
//           0
//         );

//         formattedSlots.push({
//           slotId: slot._id,
//           startTime: slot.startTime,
//           endTime: slot.endTime,

//           // FIX:
//           // use fullName
//           trainerName: slot.staffId?.fullName || "N/A",

//           totalCapacity: activity.capacity || 0,
//           bookedCount,
//           availableSeats,
//           isAvailable: availableSeats > 0
//         });
//       }

//       formattedActivities.push({
//         activityId: activity._id,
//         activityName: activity.name,
//         isPassMember: !!member.membershipPass,
//         paymentRequired: true,
//         canBook: true,
//         slots: formattedSlots
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Available activities fetched successfully",
//       data: formattedActivities
//     });

//   } catch (error) {
//     console.error("getAvailableActivities error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch available activities"
//     });
//   }
// };

// // ============================================
// // CREATE MEMBER BOOKING
// // POST /api/fitness/member-panel/book-slot
// // ============================================
// exports.createMemberBooking = async (req, res) => {
//   try {
//     const {
//       activityId,
//       slotId,
//       date
//     } = req.body;

//     if (!activityId || !slotId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: "activityId, slotId and date are required"
//       });
//     }

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // ======================================
//     // CHECK ACTIVITY EXISTS
//     // ======================================
//     const activity = await FitnessActivity.findById(activityId).lean();

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     // ======================================
//     // CHECK SLOT EXISTS
//     // ======================================
//     const slotExists = (activity.slots || []).find(
//       slot => String(slot._id) === String(slotId)
//     );

//     if (!slotExists) {
//       return res.status(404).json({
//         success: false,
//         message: "Slot not found for this activity"
//       });
//     }

//     // ======================================
//     // PASS MEMBER CHECK
//     // ======================================

//     if (member.membershipStatus !== "Active") {
//   return res.status(400).json({
//     success: false,
//     message: "Please complete membership payment first"
//   });
// }

//     const isPassMember = !!member.membershipPass;

//     let hasAccess = false;

//     if (isPassMember) {
//       hasAccess = true;
//     } else {
//       hasAccess = (member.activityFees || []).some(item =>
//         item.activity &&
//         String(item.activity._id || item.activity) === String(activityId) &&
//         item.membershipStatus === "Active"
//       );
//     }

//     if (!hasAccess) {
//       return res.status(400).json({
//         success: false,
//         message: "Please purchase this activity membership first"
//       });
//     }

//     // ======================================
//     // DUPLICATE BOOKING CHECK
//     // ======================================
//     const existingBooking = await FitnessBooking.findOne({
//       memberId: member._id,
//       activityId,
//       slotId,
//       date
//     });

//     if (existingBooking) {
//       return res.status(400).json({
//         success: false,
//         message: "You have already booked this slot"
//       });
//     }

//     // ======================================
//     // CAPACITY CHECK
//     // ======================================
//     const bookedCount = await FitnessBooking.countDocuments({
//       activityId,
//       slotId,
//       date
//     });

//     if (bookedCount >= (activity.capacity || 0)) {
//       return res.status(400).json({
//         success: false,
//         message: "This slot is full"
//       });
//     }

//     // ======================================
//     // CREATE BOOKING
//     // ======================================
//     const booking = await FitnessBooking.create({
//   activityId,
//   slotId,
//   date,
//   memberId: member._id,
//   customerName: member.name,
//   phone: member.mobile,
//   bookingStatus: "Confirmed",
//   paymentStatus: "Paid",
//   paymentSource: "Membership Access"
// });

//     return res.status(201).json({
//       success: true,
//       message: "Booking confirmed successfully",
//       data: booking
//     });

//   } catch (error) {
//     console.error("createMemberBooking error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create booking"
//     });
//   }
// };


// // ============================================
// // MEMBER BOOKING HISTORY
// // GET /api/fitness/member-panel/bookings
// // ============================================
// exports.getMemberBookings = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     const bookings = await FitnessBooking.find({
//       memberId: member._id
//     })
//       .populate("activityId", "name")
//       .sort({ createdAt: -1 })
//       .lean();

//     const formattedBookings = bookings.map(item => ({
//       bookingId: item._id,
//       activityName: item.activityId?.name || "N/A",
//       bookingDate: item.date,
//       customerName: item.customerName,
//       phone: item.phone,
//       bookingStatus: item.bookingStatus || "Confirmed",
//       paymentStatus: item.paymentStatus || "Paid",
//       paymentSource: item.paymentSource || "Membership Access",
//       createdAt: item.createdAt
//     }));

//     return res.status(200).json({
//       success: true,
//       message: "Booking history fetched successfully",
//       totalBookings: formattedBookings.length,
//       data: formattedBookings
//     });

//   } catch (error) {
//     console.error("getMemberBookings error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch booking history"
//     });
//   }
// };


// // ============================================
// // MEMBER PAYMENT HISTORY
// // GET /api/fitness/member-panel/payments
// // ============================================
// exports.getMemberPayments = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     const payments = await FitnessFeePayment.find({
//       memberId: member._id,
//       organizationId: req.organizationId
//     })
//       .sort({ paymentDate: -1 })
//       .lean();

//     const formattedPayments = payments.map(item => ({
//       paymentId: item._id,
//       amount: item.amount,
//       feePlan: item.feePlan || "",
//       description: item.description || "",
//       paymentMode: item.paymentMode || "",
//       paymentSource: item.paymentSource || "Admin Panel",
//       paymentDate: item.paymentDate,
//       transactionId: item.transactionId || "",
//       remarks: item.remarks || ""
//     }));

//     return res.status(200).json({
//       success: true,
//       message: "Payment history fetched successfully",
//       totalPayments: formattedPayments.length,
//       data: formattedPayments
//     });

//   } catch (error) {
//     console.error("getMemberPayments error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch payment history"
//     });
//   }
// };


// // ============================================
// // GET ACTIVITY FEE PLANS
// // GET /api/fitness/member-panel/activity-fees/:activityId
// // ============================================
// exports.getActivityFeePlans = async (req, res) => {
//   try {
//     const { activityId } = req.params;

//     if (!activityId) {
//       return res.status(400).json({
//         success: false,
//         message: "activityId is required"
//       });
//     }

//     // ======================================
//     // FIND ACTIVITY
//     // ======================================
//     const activity = await FitnessActivity.findById(activityId).lean();

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     // ======================================
//     // FIND FEE TYPE USING DESCRIPTION
//     // description = activity name
//     // ======================================
// const feeType = await FitnessFeeType.findOne({
//   organizationId: req.organizationId,
//   description: activity.name
// }).lean();

// if (!feeType) {
//   return res.status(404).json({
//     success: false,
//     message: "Fee structure not found for this activity"
//   });
// }

//     // ======================================
//     // FORMAT AVAILABLE PLANS
//     // ======================================
//     const plans = [];

//     if (feeType.hourly > 0) {
//       plans.push({
//         plan: "Hourly",
//         amount: feeType.hourly
//       });
//     }

//     if (feeType.daily > 0) {
//       plans.push({
//         plan: "Daily",
//         amount: feeType.daily
//       });
//     }

//     if (feeType.weekly > 0) {
//       plans.push({
//         plan: "Weekly",
//         amount: feeType.weekly
//       });
//     }

//     if (feeType.monthly > 0) {
//       plans.push({
//         plan: "Monthly",
//         amount: feeType.monthly
//       });
//     }

//     if (feeType.quarterly > 0) {
//       plans.push({
//         plan: "Quarterly",
//         amount: feeType.quarterly
//       });
//     }

//     if (feeType.halfYearly > 0) {
//       plans.push({
//         plan: "HalfYearly",
//         amount: feeType.halfYearly
//       });
//     }

//     if (feeType.annual > 0) {
//       plans.push({
//         plan: "Annual",
//         amount: feeType.annual
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Activity fee plans fetched successfully",
//       data: {
//         activityId: activity._id,
//         activityName: activity.name,
//         feeTypeId: feeType._id,
//         feeType: feeType.type,
//         plans
//       }
//     });

//   } catch (error) {
//     console.error("getActivityFeePlans error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch activity fee plans"
//     });
//   }
// };

// // ============================================
// // CREATE MEMBERSHIP PURCHASE ORDER
// // POST /api/fitness/member-panel/create-membership-order
// // ============================================
// exports.createMembershipOrder = async (req, res) => {
//   try {
//     const {
//       activityId,
//       plan
//     } = req.body;

//     if (!activityId || !plan) {
//       return res.status(400).json({
//         success: false,
//         message: "activityId and plan are required"
//       });
//     }

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // ======================================
//     // FIND ACTIVITY
//     // ======================================
//     const activity = await FitnessActivity.findById(activityId).lean();

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     // ======================================
//     // CHECK IF ALREADY ACTIVE
//     // ======================================
//     const alreadyExists = (member.activityFees || []).some(item =>
//       item.activity &&
//       String(item.activity._id || item.activity) === String(activityId) &&
//       item.membershipStatus === "Active"
//     );

//     if (alreadyExists) {
//       return res.status(400).json({
//         success: false,
//         message: "You already have active membership for this activity"
//       });
//     }

//     // ======================================
//     // FIND FEE TYPE
//     // ======================================
//     const feeType = await FitnessFeeType.findOne({
//       description: activity.name,
//       organizationId: req.organizationId
//     }).lean();

//     if (!feeType) {
//       return res.status(404).json({
//         success: false,
//         message: "Fee structure not found"
//       });
//     }

//     // ======================================
//     // PLAN → AMOUNT
//     // ======================================
//     const amountMap = {
//       Hourly: feeType.hourly || 0,
//       Daily: feeType.daily || 0,
//       Weekly: feeType.weekly || 0,
//       Monthly: feeType.monthly || 0,
//       Quarterly: feeType.quarterly || 0,
//       HalfYearly: feeType.halfYearly || 0,
//       Annual: feeType.annual || 0
//     };

//     const amount = amountMap[plan];

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid plan selected"
//       });
//     }

//     // ======================================
//     // CREATE RAZORPAY ORDER
//     // ======================================
//     const options = {
//   amount: amount * 100,// paisa
//   currency: "INR",
//   receipt: `m_${member._id.toString().slice(-6)}_${Date.now()}`
// };

//     const order = await razorpay.orders.create(options);

//     return res.status(200).json({
//       success: true,
//       message: "Razorpay order created successfully",
//       data: {
//         orderId: order.id,
//         amount,
//         currency: order.currency,
//         key: process.env.RAZORPAY_KEY_ID,
//         activityId,
//         activityName: activity.name,
//         plan
//       }
//     });

//   } catch (error) {
// console.log("========== RAZORPAY ERROR ==========");
// console.log(JSON.stringify(error, null, 2));
// console.log("====================================");
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create membership order"
//     });
//   }
// };

// // ============================================
// // VERIFY MEMBERSHIP PAYMENT
// // POST /api/fitness/member-panel/verify-membership-payment
// // ============================================
// exports.verifyMembershipPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       activityId,
//       plan
//     } = req.body;

//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       !activityId ||
//       !plan
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required payment verification fields"
//       });
//     }

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // ======================================
//     // VERIFY RAZORPAY SIGNATURE
//     // ======================================
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed"
//       });
//     }

//     // ======================================
//     // FIND ACTIVITY
//     // ======================================
//     const activity = await FitnessActivity.findById(activityId);

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     // ======================================
//     // FIND FEE TYPE
//     // ======================================
//     const feeType = await FitnessFeeType.findOne({
//       description: activity.name,
//       organizationId: req.organizationId
//     });

//     if (!feeType) {
//       return res.status(404).json({
//         success: false,
//         message: "Fee structure not found"
//       });
//     }

//     // ======================================
//     // PLAN → AMOUNT
//     // ======================================
//     const amountMap = {
//       Hourly: feeType.hourly || 0,
//       Daily: feeType.daily || 0,
//       Weekly: feeType.weekly || 0,
//       Monthly: feeType.monthly || 0,
//       Quarterly: feeType.quarterly || 0,
//       HalfYearly: feeType.halfYearly || 0,
//       Annual: feeType.annual || 0
//     };

//     const amount = amountMap[plan];

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid plan selected"
//       });
//     }

//     // ======================================
//     // CREATE FEE ALLOTMENT
//     // ======================================
//     const allotment = await FitnessFeeAllotment.create({
//       memberId: member._id,
//       feeTypeId: feeType._id,
//       description: `Member App Purchase - ${activity.name}`,
//       feePlan: plan,
//       amount,
//       dueDate: new Date(),
//       status: "Paid",
//       organizationId: req.organizationId
//     });

//     // ======================================
//     // CREATE PAYMENT ENTRY
//     // ======================================
//     await FitnessFeePayment.create({
//       memberId: member._id,
//       allotmentId: allotment._id,
//       customerName: member.name,
//       description: `Membership Purchase - ${activity.name}`,
//       feePlan: plan,
//       amount,
//       paymentMode: "Online",
//       paymentSource: "Member App Razorpay",
//       transactionId: razorpay_payment_id,
//       paymentDate: new Date(),
//       remarks: `Razorpay Order: ${razorpay_order_id}`,
//       organizationId: req.organizationId
//     });

//     // ======================================
//     // CALCULATE END DATE
//     // ======================================
//     const startDate = new Date();
//     const endDate = new Date();

//     if (plan === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
//     if (plan === "Quarterly") endDate.setMonth(endDate.getMonth() + 3);
//     if (plan === "HalfYearly") endDate.setMonth(endDate.getMonth() + 6);
//     if (plan === "Annual") endDate.setFullYear(endDate.getFullYear() + 1);
//     if (plan === "Weekly") endDate.setDate(endDate.getDate() + 7);
//     if (plan === "Daily") endDate.setDate(endDate.getDate() + 1);
//     if (plan === "Hourly") endDate.setHours(endDate.getHours() + 1);

//     // ======================================
//     // CREATE NEW activityFees ENTRY
//     // ======================================
//     await FitnessMember.findByIdAndUpdate(
//       member._id,
//       {
//         $push: {
//           activityFees: {
//             activity: activity._id,
//             feeType: feeType._id,
//             plan,
//             planFee: amount,
//             finalAmount: amount,
//             paymentStatus: "Paid",
//             paymentMode: "Bank Transfer",
//             paymentDate: new Date(),
//             startDate,
//             endDate,
//             membershipStatus: "Active",
//             allotmentId: allotment._id
//           }
//         },
//         membershipStatus: "Active"
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and membership activated successfully"
//     });

//   } catch (error) {
//     console.error("verifyMembershipPayment error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Payment verification failed"
//     });
//   }
// };



// // ============================================
// // CREATE RENEWAL ORDER
// // POST /api/fitness/member-panel/create-renewal-order
// // ============================================
// exports.createRenewalOrder = async (req, res) => {
//   try {
//     const { activityFeeId, plan } = req.body;

//     if (!activityFeeId || !plan) {
//       return res.status(400).json({
//         success: false,
//         message: "activityFeeId and plan are required"
//       });
//     }

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     const existingMembership = member.activityFees.id(activityFeeId);

//     if (!existingMembership) {
//       return res.status(404).json({
//         success: false,
//         message: "Membership record not found"
//       });
//     }

//     const activity = await FitnessActivity.findById(
//       existingMembership.activity
//     ).lean();

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     const feeType = await FitnessFeeType.findOne({
//       description: activity.name,
//       organizationId: req.organizationId
//     }).lean();

//     if (!feeType) {
//       return res.status(404).json({
//         success: false,
//         message: "Fee structure not found"
//       });
//     }

//     const amountMap = {
//       Hourly: feeType.hourly || 0,
//       Daily: feeType.daily || 0,
//       Weekly: feeType.weekly || 0,
//       Monthly: feeType.monthly || 0,
//       Quarterly: feeType.quarterly || 0,
//       HalfYearly: feeType.halfYearly || 0,
//       Annual: feeType.annual || 0
//     };

//     const amount = amountMap[plan];

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid renewal plan selected"
//       });
//     }

//     const order = await razorpay.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//       receipt: `ren_${Date.now()}`
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Renewal order created successfully",
//       data: {
//         orderId: order.id,
//         amount,
//         currency: order.currency,
//         key: process.env.RAZORPAY_KEY_ID,
//         activityFeeId,
//         activityName: activity.name,
//         plan
//       }
//     });

//   } catch (error) {
//     console.error("createRenewalOrder error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create renewal order"
//     });
//   }
// };

// // ============================================
// // VERIFY RENEWAL PAYMENT
// // POST /api/fitness/member-panel/verify-renewal-payment
// // ============================================
// exports.verifyRenewalPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       activityFeeId,
//       plan
//     } = req.body;

//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       !activityFeeId ||
//       !plan
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required renewal verification fields"
//       });
//     }

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     const oldMembership = member.activityFees.id(activityFeeId);

//     if (!oldMembership) {
//       return res.status(404).json({
//         success: false,
//         message: "Existing membership record not found"
//       });
//     }

//     // ======================================
//     // VERIFY SIGNATURE
//     // ======================================
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Renewal payment verification failed"
//       });
//     }

//     const activity = await FitnessActivity.findById(
//       oldMembership.activity
//     );

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     const feeType = await FitnessFeeType.findOne({
//       description: activity.name,
//       organizationId: req.organizationId
//     });

//     if (!feeType) {
//       return res.status(404).json({
//         success: false,
//         message: "Fee structure not found"
//       });
//     }

//     const amountMap = {
//       Hourly: feeType.hourly || 0,
//       Daily: feeType.daily || 0,
//       Weekly: feeType.weekly || 0,
//       Monthly: feeType.monthly || 0,
//       Quarterly: feeType.quarterly || 0,
//       HalfYearly: feeType.halfYearly || 0,
//       Annual: feeType.annual || 0
//     };

//     const amount = amountMap[plan];

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid renewal plan"
//       });
//     }

//     // ======================================
//     // START DATE LOGIC
//     // ======================================
//     const today = new Date();
//     let startDate;

//     if (
//       oldMembership.endDate &&
//       new Date(oldMembership.endDate) > today
//     ) {
//       // active → extend from old end date
//       startDate = new Date(oldMembership.endDate);
//     } else {
//       // expired → start today
//       startDate = new Date();
//     }

//     const endDate = new Date(startDate);

//     if (plan === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
//     if (plan === "Quarterly") endDate.setMonth(endDate.getMonth() + 3);
//     if (plan === "HalfYearly") endDate.setMonth(endDate.getMonth() + 6);
//     if (plan === "Annual") endDate.setFullYear(endDate.getFullYear() + 1);
//     if (plan === "Weekly") endDate.setDate(endDate.getDate() + 7);
//     if (plan === "Daily") endDate.setDate(endDate.getDate() + 1);
//     if (plan === "Hourly") endDate.setHours(endDate.getHours() + 1);

//     // ======================================
//     // CREATE FEE ALLOTMENT
//     // ======================================
//     const allotment = await FitnessFeeAllotment.create({
//       memberId: member._id,
//       feeTypeId: feeType._id,
//       description: `Renewal - ${activity.name}`,
//       feePlan: plan,
//       amount,
//       dueDate: new Date(),
//       status: "Paid",
//       organizationId: req.organizationId
//     });

//     // ======================================
//     // CREATE PAYMENT ENTRY
//     // ======================================
//     await FitnessFeePayment.create({
//       memberId: member._id,
//       allotmentId: allotment._id,
//       customerName: member.name,
//       description: `Renewal Payment - ${activity.name}`,
//       feePlan: plan,
//       amount,
//       paymentMode: "Online",
//       paymentSource: "Member App Renewal Razorpay",
//       transactionId: razorpay_payment_id,
//       paymentDate: new Date(),
//       remarks: `Renewal | Razorpay Order: ${razorpay_order_id}`,
//       organizationId: req.organizationId
//     });

//     // ======================================
//     // CREATE NEW activityFees ENTRY
//     // ======================================
//     await FitnessMember.findByIdAndUpdate(
//       member._id,
//       {
//         $push: {
//           activityFees: {
//             activity: activity._id,
//             feeType: feeType._id,
//             plan,
//             planFee: amount,
//             finalAmount: amount,
//             paymentStatus: "Paid",
//             paymentMode: "Bank Transfer",
//             paymentDate: new Date(),
//             startDate,
//             endDate,
//             membershipStatus: "Active",
//             allotmentId: allotment._id
//           }
//         },
//         membershipStatus: "Active"
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Membership renewed successfully"
//     });

//   } catch (error) {
//     console.error("verifyRenewalPayment error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Renewal verification failed"
//     });
//   }
// };


// // ============================================
// // MEMBER MEMBERSHIP STATUS
// // GET /api/fitness/member-panel/memberships
// // ============================================
// exports.getMemberMemberships = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     const today = new Date();

//     const memberships = await Promise.all(
//       (member.activityFees || []).map(async (item) => {
//         const activity = await FitnessActivity.findById(
//           item.activity
//         ).select("name").lean();

//         const endDate = item.endDate ? new Date(item.endDate) : null;
//         const startDate = item.startDate ? new Date(item.startDate) : null;

//         let currentStatus = "Inactive";
//         let daysRemaining = 0;
//         let canRenew = true;

//         if (endDate && endDate >= today) {
//           currentStatus = "Active";

//           const diffTime = endDate - today;
//           daysRemaining = Math.ceil(
//             diffTime / (1000 * 60 * 60 * 24)
//           );
//         } else {
//           currentStatus = "Expired";
//           daysRemaining = 0;
//         }

//         // expiring soon logic
//         const isExpiringSoon =
//           currentStatus === "Active" && daysRemaining <= 7;

//         return {
//           activityFeeId: item._id,
//           activityId: item.activity,
//           activityName: activity?.name || "N/A",
//           plan: item.plan,
//           amount: item.finalAmount || 0,
//           paymentStatus: item.paymentStatus || "Pending",
//           startDate,
//           endDate,
//           membershipStatus: currentStatus,
//           daysRemaining,
//           isExpiringSoon,
//           canRenew,
//           isPassMember: !!member.membershipPass
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Membership details fetched successfully",
//       totalMemberships: memberships.length,
//       data: memberships
//     });

//   } catch (error) {
//     console.error("getMemberMemberships error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch memberships"
//     });
//   }
// };

// // ============================================
// // MEMBER PROFILE WITH QR (PRODUCTION READY)
// // GET /api/fitness/member-panel/profile
// // ============================================
// exports.getMemberProfile = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     const today = new Date();

//     // ======================================
//     // ACTIVE ACTIVITIES
//     // Only paid + active + not expired
//     // ======================================
//     const activeActivities = (member.activityFees || [])
//       .filter((item) => {
//         if (
//           item.paymentStatus !== "Paid" ||
//           item.membershipStatus !== "Active"
//         ) {
//           return false;
//         }

//         if (!item.endDate) return false;

//         return new Date(item.endDate) >= today;
//       })
//       .map((item) => ({
//         activityFeeId: item._id,

//         // safer handling for populated/non-populated activity
//         activityId: item.activity?._id || item.activity || null,
//         activityName: item.activity?.name || "N/A",

//         plan: item.plan || "",
//         startDate: item.startDate || null,
//         endDate: item.endDate || null,
//         membershipStatus: item.membershipStatus || "Inactive",
//         paymentStatus: item.paymentStatus || "Pending"
//       }));

//     return res.status(200).json({
//       success: true,
//       message: "Member profile fetched successfully",
//       data: {
//         // ======================================
//         // BASIC PROFILE
//         // ======================================
//         id: member._id,
//         memberId: member.memberId || "",
//         name: member.name || "",
//         mobile: member.mobile || "",
//         email: member.email || "",
//         age: member.age || null,
//         gender: member.gender || "",
//         address: member.address || "",
//         photo: member.photo || "",

//         // ======================================
//         // MEMBERSHIP STATUS
//         // ======================================
//         membershipStatus:
//           member.membershipStatus || "Inactive",

//         status: member.status || "Inactive",

//         // restored from old version
//         numberOfPersons: member.numberOfPersons || 1,
//         isPassMember: !!member.membershipPass,

//         // ======================================
//         // QR CODE
//         // ======================================
//         qrCode: member.qrCode || "",

//         // ======================================
//         // STAFF SCANNER SUPPORT
//         // ======================================
//         activeActivities
//       }
//     });

//   } catch (error) {
//     console.error("getMemberProfile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch member profile"
//     });
//   }
// };





//  ^
//  | this also right but flow is correct in -> this one 
/////////////////////////

// just trying to improve proper flow

const FitnessMember = require("../models/FitnessMember");
const FitnessBooking = require("../models/FitnessBooking");
const FitnessFeePayment = require("../models/FitnessFeePayment");
const FitnessActivity = require("../models/FitnessActivity");
const FitnessFeeType = require("../models/FitnessFeeType");
const razorpay = require("../config/razorpay");

const crypto = require("crypto");
const FitnessFeeAllotment = require("../models/FitnessFeeAllotment");

// =====================================================
// COMMON MEMBER FINDER
// Because login may come from User collection OR FitnessMember
// so using req.user.id is unreliable
// =====================================================
const findLoggedInMember = async (req) => {
  const identifier = req.user?.userId;

  if (!identifier) return null;

  const member = await FitnessMember.findOne({
    $or: [
      { mobile: identifier },
      { userId: identifier }
    ]
  })
    .populate("activityFees.activity")
    // .populate("membershipPass")
    .lean();

  return member;
};


 // ============================================
 // MEMBER DASHBOARD
 // GET /api/fitness/member-panel/dashboard
 // ============================================

exports.getMemberDashboard = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // ======================================
    // TODAY DATE
    // ======================================
    const today = new Date().toISOString().split("T")[0];

    // ======================================
    // ACTIVE MEMBERSHIPS
    // ======================================
    const activeMemberships = (member.activityFees || []).filter(
      item => item.membershipStatus === "Active"
    );

    // ======================================
    // RECENT PAYMENTS
    // ======================================
    const recentPayments = await FitnessFeePayment.find({
      memberId: member._id,
      organizationId
    })
      .sort({ paymentDate: -1 })
      .limit(5)
      .lean();

    // ======================================
    // TODAY'S SCHEDULE
    // Only today's confirmed bookings
    // ======================================
    const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const todayBookings = await FitnessBooking.find({
  memberId: member._id,
  bookingStatus: "Confirmed",
  date: { $regex: `^${today}` } 
})
  .populate("activityId")
  .lean();

// ======================================
// MEMBERSHIP → TODAY SCHEDULE (OFFLINE)
// ======================================
const membershipSchedule = (member.activityFees || [])
  .filter(item =>
    item.membershipStatus === "Active" &&
    new Date(item.startDate) <= new Date() &&
    new Date(item.endDate) >= new Date()
  )
  .map(item => {
    const activity = item.activity || {};

    // 🔥 GET FIRST SLOT (or default slot)
    const slot = (activity.slots && activity.slots.length > 0)
      ? activity.slots[0]
      : {};

    return {
      bookingId: null,
      activityName: activity.name || "Membership Activity",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
      // instructorName: slot.staffName || "Trainer"
    };
  });


      // ======================================
// ACTIVE BOOKINGS (for Hourly/Daily display)
// ======================================
const activeBookings = await FitnessBooking.find({
  memberId: member._id,
  bookingStatus: "Confirmed",
  date: { $gte: today }
})
  .populate("activityId")
  .lean();

    // ======================================
    // BUILD TODAY SCHEDULE
    // ======================================
    const todaySchedule = todayBookings.map(item => {
      const activity = item.activityId || {};
      const slot =
        (activity.slots || []).find(
          s => String(s._id) === String(item.slotId)
        ) || {};

      return {
        bookingId: item._id,
        activityName: activity.name || "N/A",
        startTime: slot.startTime || "",
        endTime: slot.endTime || "",
        // place: activity.location || "Hall A",
        // instructorName: slot.staffName || "Trainer"
      };
    });

    // ======================================
    // PENDING DUES
    // ======================================
    let pendingDues = 0;

    for (const item of member.activityFees || []) {
      if (item.paymentStatus === "Pending") {
        pendingDues += Number(item.finalAmount || 0);
      }
    }

    // ======================================
    // MONTHLY ATTENDANCE
    // placeholder for now
    // ======================================
    const monthlyAttendance = 80;

    return res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        // ======================================
        // MEMBER BASIC INFO
        // ======================================
        member: {
          id: member._id,
          memberId: member.memberId,
          name: member.name,
          mobile: member.mobile,
          email: member.email || "",
          photo: member.photo || "",
          membershipStatus: member.membershipStatus,
          status: member.status
        },

        // ======================================
        // MEMBERSHIP SUMMARY
        // ======================================
        membershipSummary: {
          totalActiveMemberships: activeMemberships.length,
          pendingDues,
          isPassMember: !!member.membershipPass,
          numberOfPersons: member.numberOfPersons || 1,
          monthlyAttendance,
          todaysActivitiesCount: todaySchedule.length
        },

        // ======================================
        // ACTIVE MEMBERSHIPS
        // ======================================
        activeMemberships: activeMemberships.map(item => ({
          activityName: item.activity?.name || "Membership Pass",
          plan: item.plan,
          startDate: item.startDate,
          endDate: item.endDate,
          finalAmount: item.finalAmount,
          paymentStatus: item.paymentStatus,
          membershipStatus: item.membershipStatus,

          daysLeft:
            item.endDate
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(item.endDate) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0
        })),

        // ======================================
        // TODAY'S SCHEDULE
        // ======================================
        // todaySchedule,
        todaySchedule: [...todaySchedule, ...membershipSchedule],

        // ======================================
// CURRENT BOOKINGS (Hourly/Daily)
// ======================================
currentBookings: activeBookings.map(item => {
  const activity = item.activityId || {};
  const slot =
    (activity.slots || []).find(
      s => String(s._id) === String(item.slotId)
    ) || {};

  return {
    bookingId: item._id,
    activityName: activity.name || "N/A",
    date: item.date,
    startTime: slot.startTime || "",
    endTime: slot.endTime || "",
    paymentStatus: item.paymentStatus
  };
}),

        // ======================================
        // RECENT PAYMENTS
        // ======================================
        recentPayments: recentPayments.map(item => ({
          paymentId: item._id,
          amount: item.amount,
          paymentMode: item.paymentMode,
          paymentDate: item.paymentDate,
          description: item.description || "",
          source: "Razorpay Booking Payment"
        }))
      }
    });

  } catch (error) {
    console.error("getMemberDashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard"
    });
  }
};


// ============================================
// MEMBERSHIP SUMMARY
// GET /api/fitness/member-panel/membership
// ============================================
// exports.getMemberMembershipSummary = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Membership summary fetched successfully",
//       data: {
//         memberId: member.memberId,
//         isPassMember: !!member.membershipPass,
//         numberOfPersons: member.numberOfPersons || 1,
//         membershipStatus: member.membershipStatus,
//         memberships: (member.activityFees || []).map(item => ({
//           activityName: item.activity?.name || "Membership Pass",
//           plan: item.plan,
//           planFee: item.planFee,
//           discount: item.discount,
//           finalAmount: item.finalAmount,
//           paymentStatus: item.paymentStatus,
//           paymentMode: item.paymentMode,
//           paymentDate: item.paymentDate,
//           startDate: item.startDate,
//           endDate: item.endDate,
//           membershipStatus: item.membershipStatus,
//           notes: item.planNotes || ""
//         }))
//       }
//     });

//   } catch (error) {
//     console.error("getMemberMembershipSummary error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch membership summary"
//     });
//   }
// };

exports.getMemberMembershipSummary = async (req, res) => {
  try {
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership summary fetched successfully",
      data: {
        memberId: member.memberId,
        isPassMember: !!member.membershipPass,
        numberOfPersons: member.numberOfPersons || 1,
        membershipStatus: member.membershipStatus,
        memberships: (member.activityFees || [])
  .filter(item => {

    // ======================================
    // REMOVE EXPIRED HOURLY / DAILY
    // ======================================
    if (["Hourly", "Daily"].includes(item.plan)) {

      // no endDate → hide it
      if (!item.endDate) return false;

      return new Date(item.endDate) > new Date();
    }

    // ======================================
    // SHOW ALL OTHER MEMBERSHIPS
    // ======================================
    return true;
  })
  .map(item => ({
    activityName: item.activity?.name || "Membership Pass",
    plan: item.plan,
    planFee: item.planFee,
    discount: item.discount,
    finalAmount: item.finalAmount,
    paymentStatus: item.paymentStatus,
    paymentMode: item.paymentMode,
    paymentDate: item.paymentDate,
    startDate: item.startDate,
    endDate: item.endDate,
    membershipStatus: item.membershipStatus,
    notes: item.planNotes || ""
  }))
      }
    });

  } catch (error) {
    console.error("getMemberMembershipSummary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch membership summary"
    });
  }
};


// ============================================
// AVAILABLE ACTIVITIES + SLOT AVAILABILITY
// GET /api/fitness/member-panel/available-activities
// ============================================
// exports.getAvailableActivities = async (req, res) => {
//   try {
//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // FIX:
//     // populate fullName instead of name
//     const activities = await FitnessActivity.find({})
//       .populate("slots.staffId", "fullName")
//       .lean();

//     const today = new Date().toISOString().split("T")[0];

//     const formattedActivities = [];

//     for (const activity of activities) {
//       const formattedSlots = [];

//       for (const slot of activity.slots || []) {
//         const bookedCount = await FitnessBooking.countDocuments({
//           activityId: activity._id,
//           slotId: slot._id,
//           date: today,
//           bookingStatus: "Confirmed"
//         });

//         const availableSeats = Math.max(
//           (activity.capacity || 0) - bookedCount,
//           0
//         );

//         formattedSlots.push({
//           slotId: slot._id,
//           startTime: slot.startTime,
//           endTime: slot.endTime,

//           // FIX:
//           // use fullName
//           trainerName: slot.staffId?.fullName || "N/A",

//           totalCapacity: activity.capacity || 0,
//           bookedCount,
//           availableSeats,
//           isAvailable: availableSeats > 0
//         });
//       }

//       formattedActivities.push({
//         activityId: activity._id,
//         activityName: activity.name,
//         isPassMember: !!member.membershipPass,
//         paymentRequired: true,
//         canBook: true,
//         slots: formattedSlots
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Available activities fetched successfully",
//       data: formattedActivities
//     });

//   } catch (error) {
//     console.error("getAvailableActivities error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch available activities"
//     });
//   }
// };

exports.getAvailableActivities = async (req, res) => {
  try {
    // ======================================
    // FIND LOGGED-IN MEMBER
    // ======================================
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // ======================================
    // SELECTED DATE FROM FLUTTER
    // ======================================
    const selectedDate =
      req.query.date ||
      new Date().toISOString().split("T")[0];

    // ======================================
    // GET ACTIVE PURCHASED ACTIVITIES
    // ======================================
    const purchasedActivityIds = (member.activityFees || [])
      .filter(item =>
        item.activity &&
        item.membershipStatus === "Active"
      )
      .map(item => String(item.activity._id || item.activity));

    // ======================================
    // FETCH ALL ACTIVITIES
    // DO NOT FILTER PURCHASED ACTIVITIES
    // ======================================
    const activities = await FitnessActivity.find()
      .populate("slots.staffId", "fullName")
      .lean();

    const formattedActivities = [];

    // ======================================
    // LOOP ACTIVITIES
    // ======================================
    for (const activity of activities) {

      const formattedSlots = [];

      // ======================================
      // CHECK IF MEMBER ALREADY PURCHASED
      // ======================================
      const alreadyPurchased = purchasedActivityIds.includes(
        String(activity._id)
      );

      // ======================================
      // LOOP SLOTS
      // ======================================
      for (const slot of activity.slots || []) {

        // ======================================
        // COUNT VALID BOOKINGS ONLY
        // ======================================
        const bookedCount = await FitnessBooking.countDocuments({
          activityId: activity._id,
          slotId: slot._id,
          date: selectedDate,

          // IMPORTANT:
          // COUNT ONLY VALID BOOKINGS
          bookingStatus: {
            $in: ["Confirmed", "Pending Approval"]
          }
        });

        // ======================================
        // CALCULATE REMAINING SEATS
        // ======================================
        const availableSeats = Math.max(
          (activity.capacity || 0) - bookedCount,
          0
        );

        // ======================================
        // SLOT DATA
        // ======================================
        formattedSlots.push({
          slotId: slot._id,

          startTime: slot.startTime,
          endTime: slot.endTime,

          trainerName:
            slot.staffId?.fullName || "N/A",

          totalCapacity: activity.capacity || 0,

          bookedCount,

          availableSeats,

          isAvailable: availableSeats > 0,

          isFull: availableSeats <= 0
        });
      }

      // ======================================
      // ACTIVITY DATA
      // ======================================
      formattedActivities.push({
        activityId: activity._id,

        activityName: activity.name,

        alreadyPurchased,

        isPassMember: !!member.membershipPass,

        // IF ALREADY PURCHASED:
        // no payment required
        paymentRequired: !alreadyPurchased,

        // prevent duplicate booking/purchase
        canBook: !alreadyPurchased,

        slots: formattedSlots
      });
    }

    // ======================================
    // RESPONSE
    // ======================================
    return res.status(200).json({
      success: true,
      message: "Available activities fetched successfully",

      selectedDate,

      data: formattedActivities
    });

  } catch (error) {

    console.error(
      "getAvailableActivities error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available activities"
    });
  }
};
// ============================================
// CREATE MEMBER BOOKING
// POST /api/fitness/member-panel/book-slot
// ============================================
exports.createMemberBooking = async (req, res) => {
  try {
    const {
      activityId,
      slotId,
      date
    } = req.body;

    if (!activityId || !slotId || !date) {
      return res.status(400).json({
        success: false,
        message: "activityId, slotId and date are required"
      });
    }

    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // ======================================
    // CHECK ACTIVITY EXISTS
    // ======================================
    const activity = await FitnessActivity.findById(activityId).lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // ======================================
    // CHECK SLOT EXISTS
    // ======================================
    const slotExists = (activity.slots || []).find(
      slot => String(slot._id) === String(slotId)
    );

    if (!slotExists) {
      return res.status(404).json({
        success: false,
        message: "Slot not found for this activity"
      });
    }

    // ======================================
    // PASS MEMBER CHECK
    // ======================================

    if (member.membershipStatus !== "Active") {
  return res.status(400).json({
    success: false,
    message: "Please complete membership payment first"
  });
}

    const isPassMember = !!member.membershipPass;

    let hasAccess = false;

    if (isPassMember) {
      hasAccess = true;
    } else {
      hasAccess = (member.activityFees || []).some(item =>
        item.activity &&
        String(item.activity._id || item.activity) === String(activityId) &&
        item.membershipStatus === "Active"
      );
    }

    if (!hasAccess) {
      return res.status(400).json({
        success: false,
        message: "Please purchase this activity membership first"
      });
    }

    // ======================================
    // DUPLICATE BOOKING CHECK
    // ======================================
    const existingBooking = await FitnessBooking.findOne({
      memberId: member._id,
      activityId,
      slotId,
      date
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You have already booked this slot"
      });
    }

    // ======================================
    // CAPACITY CHECK
    // ======================================
    const bookedCount = await FitnessBooking.countDocuments({
      activityId,
      slotId,
      date
    });

    if (bookedCount >= (activity.capacity || 0)) {
      return res.status(400).json({
        success: false,
        message: "This slot is full"
      });
    }

    // ======================================
    // CREATE BOOKING
    // ======================================
    const booking = await FitnessBooking.create({
  activityId,
  slotId,
  date,
  memberId: member._id,
  customerName: member.name,
  phone: member.mobile,
  bookingStatus: "Confirmed",
  paymentStatus: "Paid",
  paymentSource: "Membership Access"
});

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      data: booking
    });

  } catch (error) {
    console.error("createMemberBooking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking"
    });
  }
};


// ============================================
// MEMBER BOOKING HISTORY
// GET /api/fitness/member-panel/bookings
// ============================================
exports.getMemberBookings = async (req, res) => {
  try {
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    const bookings = await FitnessBooking.find({
      memberId: member._id
    })
      .populate("activityId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const formattedBookings = bookings.map(item => ({
      bookingId: item._id,
      activityName: item.activityId?.name || "N/A",
      bookingDate: item.date,
      customerName: item.customerName,
      phone: item.phone,
      bookingStatus: item.bookingStatus || "Confirmed",
      paymentStatus: item.paymentStatus || "Paid",
      paymentSource: item.paymentSource || "Membership Access",
      createdAt: item.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: "Booking history fetched successfully",
      totalBookings: formattedBookings.length,
      data: formattedBookings
    });

  } catch (error) {
    console.error("getMemberBookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking history"
    });
  }
};


// ============================================
// MEMBER PAYMENT HISTORY
// GET /api/fitness/member-panel/payments
// ============================================
exports.getMemberPayments = async (req, res) => {
  try {
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    const payments = await FitnessFeePayment.find({
      memberId: member._id,
      organizationId: req.organizationId
    })
      .sort({ paymentDate: -1 })
      .lean();

    const formattedPayments = payments.map(item => ({
      paymentId: item._id,
      amount: item.amount,
      feePlan: item.feePlan || "",
      description: item.description || "",
      paymentMode: item.paymentMode || "",
      paymentSource: item.paymentSource || "Admin Panel",
      paymentDate: item.paymentDate,
      transactionId: item.transactionId || "",
      remarks: item.remarks || ""
    }));

    return res.status(200).json({
      success: true,
      message: "Payment history fetched successfully",
      totalPayments: formattedPayments.length,
      data: formattedPayments
    });

  } catch (error) {
    console.error("getMemberPayments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history"
    });
  }
};


// ============================================
// GET ACTIVITY FEE PLANS
// GET /api/fitness/member-panel/activity-fees/:activityId
// ============================================
exports.getActivityFeePlans = async (req, res) => {
  try {
    const { activityId } = req.params;

    if (!activityId) {
      return res.status(400).json({
        success: false,
        message: "activityId is required"
      });
    }

    // ======================================
    // FIND ACTIVITY
    // ======================================
    const activity = await FitnessActivity.findById(activityId).lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // ======================================
    // FIND FEE TYPE USING DESCRIPTION
    // description = activity name
    // ======================================
const feeType = await FitnessFeeType.findOne({
  organizationId: req.organizationId,
  description: activity.name
}).lean();

if (!feeType) {
  return res.status(404).json({
    success: false,
    message: "Fee structure not found for this activity"
  });
}

    // ======================================
    // FORMAT AVAILABLE PLANS
    // ======================================
    const plans = [];

    if (feeType.hourly > 0) {
      plans.push({
        plan: "Hourly",
        amount: feeType.hourly
      });
    }

    if (feeType.daily > 0) {
      plans.push({
        plan: "Daily",
        amount: feeType.daily
      });
    }

    if (feeType.weekly > 0) {
      plans.push({
        plan: "Weekly",
        amount: feeType.weekly
      });
    }

    if (feeType.monthly > 0) {
      plans.push({
        plan: "Monthly",
        amount: feeType.monthly
      });
    }

    if (feeType.quarterly > 0) {
      plans.push({
        plan: "quarterly",
        amount: feeType.quarterly
      });
    }

    if (feeType.halfYearly > 0) {
      plans.push({
        plan: "halfYearly",
        amount: feeType.halfYearly
      });
    }

    if (feeType.annual > 0) {
      plans.push({
        plan: "Annual",
        amount: feeType.annual
      });
    }

    return res.status(200).json({
      success: true,
      message: "Activity fee plans fetched successfully",
      data: {
        activityId: activity._id,
        activityName: activity.name,
        feeTypeId: feeType._id,
        feeType: feeType.type,
        plans
      }
    });

  } catch (error) {
    console.error("getActivityFeePlans error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity fee plans"
    });
  }
};

// ============================================
// CREATE MEMBERSHIP PURCHASE ORDER
// POST /api/fitness/member-panel/create-membership-order
// ============================================
exports.createMembershipOrder = async (req, res) => {
  try {
    const {
      activityId,
      slotId,
      date,
      plan
    } = req.body;

    if (!activityId || !slotId || !date || !plan) {
      return res.status(400).json({
        success: false,
        message: "activityId, slotId, date and plan are required"
      });
    }

    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // ======================================
    // FIND ACTIVITY
    // ======================================
    const activity = await FitnessActivity.findById(activityId).lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // ======================================
    // CHECK SLOT EXISTS
    // ======================================
    const slotExists = (activity.slots || []).find(
      slot => String(slot._id) === String(slotId)
    );

    if (!slotExists) {
      return res.status(404).json({
        success: false,
        message: "Slot not found for this activity"
      });
    }

    // ======================================
    // CHECK ACTIVE MEMBERSHIP
    // ======================================
    const alreadyExists = (member.activityFees || []).some(item =>
      item.activity &&
      String(item.activity._id || item.activity) === String(activityId) &&
      item.membershipStatus === "Active"
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "You already have active membership for this activity"
      });
    }

    // ======================================
    // FIND FEE TYPE
    // ======================================
    const feeType = await FitnessFeeType.findOne({
      description: activity.name,
      organizationId: req.organizationId
    }).lean();

    if (!feeType) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }

    // ======================================
    // PLAN → AMOUNT
    // ======================================
    const amountMap = {
      Hourly: feeType.hourly || 0,
      Daily: feeType.daily || 0,
      Weekly: feeType.weekly || 0,
      Monthly: feeType.monthly || 0,
      quarterly: feeType.quarterly || 0,
      halfYearly: feeType.halfYearly || 0,
      Annual: feeType.annual || 0
    };

    const amount = amountMap[plan];

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    // ======================================
    // SLOT CAPACITY CHECK
    // ======================================
    const bookedCount = await FitnessBooking.countDocuments({
      activityId,
      slotId,
      date,
      bookingStatus: "Confirmed"
    });

    if (bookedCount >= (activity.capacity || 0)) {
      return res.status(400).json({
        success: false,
        message: "This slot is full"
      });
    }

    // ======================================
    // CREATE RAZORPAY ORDER
    // ======================================
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `m_${member._id.toString().slice(-6)}_${Date.now()}`
    });

    console.log("CREATE ORDER:");
console.log("Plan:", plan);
console.log("Amount:", amount);
console.log("OrderId:", order.id);

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        orderId: order.id,
        amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        activityId,
        slotId,
        date,
        activityName: activity.name,
        plan
      }
    });

  } catch (error) {
    console.error("createMembershipOrder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create membership order"
    });
  }
};

// ============================================
// VERIFY MEMBERSHIP PAYMENT
// POST /api/fitness/member-panel/verify-membership-payment
// ============================================
// exports.verifyMembershipPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       activityId,
//       slotId,
//       date,
//       plan
//     } = req.body;
// const bookingDate = new Date(date).toISOString().split("T")[0];
//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       !activityId ||
//       !slotId ||
//       !date ||
//       !plan
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required payment verification fields"
//       });
//     }

//     const member = await findLoggedInMember(req);

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found"
//       });
//     }

//     // ======================================
//     // VERIFY RAZORPAY SIGNATURE
//     // ======================================

//     // TEMPORARY DEV TEST ONLY
//     // console.log("Razorpay verification bypassed for local testing");

//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed"
//       });
//     }
    

//     // ======================================
//     // FIND ACTIVITY
//     // ======================================
//     const activity = await FitnessActivity.findById(activityId);

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Activity not found"
//       });
//     }

//     // ======================================
//     // CHECK SLOT EXISTS
//     // ======================================
//     const slotExists = (activity.slots || []).find(
//       slot => String(slot._id) === String(slotId)
//     );

//     if (!slotExists) {
//       return res.status(404).json({
//         success: false,
//         message: "Selected slot not found"
//       });
//     }

//     // ======================================
//     // DUPLICATE MEMBERSHIP CHECK
//     // ======================================
//     const alreadyExists = (member.activityFees || []).some(item =>
//       item.activity &&
//       String(item.activity._id || item.activity) === String(activityId) &&
//       item.membershipStatus === "Active"
//     );

//     if (alreadyExists) {
//       return res.status(400).json({
//         success: false,
//         message: "You already have active membership for this activity"
//       });
//     }

//     // ======================================
//     // FIND FEE TYPE
//     // ======================================
//     const feeType = await FitnessFeeType.findOne({
//       description: activity.name,
//       organizationId: req.organizationId
//     });

//     if (!feeType) {
//       return res.status(404).json({
//         success: false,
//         message: "Fee structure not found"
//       });
//     }

//     // ======================================
//     // PLAN → AMOUNT
//     // ======================================
//     const amountMap = {
//       Hourly: feeType.hourly || 0,
//       Daily: feeType.daily || 0,
//       Weekly: feeType.weekly || 0,
//       Monthly: feeType.monthly || 0,
//       quarterly: feeType.quarterly || 0,
//       halfYearly: feeType.halfYearly || 0,
//       Annual: feeType.annual || 0
//     };

//     const amount = amountMap[plan];

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid plan selected"
//       });
//     }

//     // ======================================
//     // SLOT CAPACITY CHECK AGAIN
//     // (important after payment)
//     // ======================================
//     const bookedCount = await FitnessBooking.countDocuments({
//       activityId,
//       slotId,
//       date,
//       bookingStatus: "Confirmed"
//     });

//     if (bookedCount >= (activity.capacity || 0)) {
//       return res.status(400).json({
//         success: false,
//         message: "Slot became full. Please contact admin."
//       });
//     }

//     // ======================================
//     // CREATE FEE ALLOTMENT
//     // (for fees table + revenue)
//     // ======================================
//     const allotment = await FitnessFeeAllotment.create({
//       memberId: member._id,
//       feeTypeId: feeType._id,
//       description: `Member App Purchase - ${activity.name}`,
//       feePlan: plan,
//       amount,
//       dueDate: new Date(),
//       status: "Paid",
//       organizationId: req.organizationId
//     });

//     // ======================================
//     // CREATE PAYMENT ENTRY
//     // (for revenue + reports)
//     // ======================================
//     await FitnessFeePayment.create({
//       memberId: member._id,
//       allotmentId: allotment._id,
//       customerName: member.name,
//       description: `Member App (Razorpay) - ${activity.name}`,
//       feePlan: plan,
//       amount,
//       paymentMode: "Bank Transfer",
//       paymentSource: "Member App Razorpay",
//       transactionId: razorpay_payment_id,
//       paymentDate: new Date(),
//       remarks: `Razorpay Order: ${razorpay_order_id}`,
//       organizationId: req.organizationId
//     });

//     // ======================================
//     // START DATE / END DATE
//     // ======================================
//     const startDate = new Date();
//     const endDate = new Date(startDate);

//     if (plan === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
//     if (plan === "quarterly") endDate.setMonth(endDate.getMonth() + 3);
//     if (plan === "halfYearly") endDate.setMonth(endDate.getMonth() + 6);
//     if (plan === "Annual") endDate.setFullYear(endDate.getFullYear() + 1);
//     if (plan === "Weekly") endDate.setDate(endDate.getDate() + 7);
//     if (plan === "Daily") endDate.setDate(endDate.getDate() + 1);
//     if (plan === "Hourly") endDate.setHours(endDate.getHours() + 1);

//     // ======================================
//     // CREATE MEMBER ACTIVITY FEES ENTRY
//     // ======================================
//     // await FitnessMember.findByIdAndUpdate(
//     //   member._id,
//     //   {
//     //     $push: {
//     //       activityFees: {
//     //         activity: activity._id,
//     //         feeType: feeType._id,
//     //         plan,
//     //         planFee: amount,
//     //         finalAmount: amount,
//     //         paymentStatus: "Paid",
//     //         paymentMode: "Online",
//     //         paymentDate: new Date(),
//     //         startDate,
//     //         endDate,
//     //         membershipStatus: "Active",
//     //         allotmentId: allotment._id
//     //       }
//     //     },
//     //     membershipStatus: "Active"
//     //   }
//     // );

//     // STEP: Check if plan is membership-based
// const isMembershipPlan = !["Hourly", "Daily"].includes(plan);

// if (isMembershipPlan) {
//   await FitnessMember.findByIdAndUpdate(
//     member._id,
//     {
//       $push: {
//         activityFees: {
//           activity: activity._id,
//           feeType: feeType._id,
//           plan,
//           planFee: amount,
//           finalAmount: amount,
//           paymentStatus: "Paid",
//           paymentMode: "Bank Transfer",
//           paymentDate: new Date(),
//           startDate,
//           endDate,
//           membershipStatus: "Active",
//           allotmentId: allotment._id
//         }
//       },
//       membershipStatus: "Active"
//     }
//   );
// }

//     // ======================================
//     // AUTO CREATE BOOKING
//     // (slot reserved automatically)
//     // ======================================
//     const bookingDate = new Date(date).toISOString().split("T")[0];

// await FitnessBooking.create({
//   activityId,
//   slotId,
//   date: bookingDate,   // ✅ FIXED
//   memberId: member._id,
//   customerName: member.name,
//   phone: member.mobile,
//   bookingStatus: "Confirmed",
//   paymentStatus: "Paid",
//   paymentSource: "Member App Razorpay",
//   isRecurring: !["Hourly", "Daily"].includes(plan),
//   isException: false
// });


//     return res.status(200).json({
//       success: true,
//       message:
//         "Payment verified, membership activated and slot booked successfully"
//     });

//   } catch (error) {
//     console.error("verifyMembershipPayment error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Payment verification failed"
//     });
//   }
// };

exports.verifyMembershipPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      activityId,
      slotId,
      date,
      plan
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !activityId ||
      !slotId ||
      !date ||
      !plan
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields"
      });
    }

    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // ======================================
    // NORMALIZE DATE (🔥 FIX)
    // ======================================
    const bookingDate = new Date(date).toISOString().split("T")[0];

    // ======================================
    // VERIFY SIGNATURE
    // ======================================
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // ======================================
    // FIND ACTIVITY
    // ======================================
    const activity = await FitnessActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // ======================================
    // CHECK SLOT
    // ======================================
    const slotExists = (activity.slots || []).find(
      slot => String(slot._id) === String(slotId)
    );

    if (!slotExists) {
      return res.status(404).json({
        success: false,
        message: "Selected slot not found"
      });
    }

    // ======================================
    // DUPLICATE MEMBERSHIP CHECK
    // ======================================
    const isMembershipPlan = !["Hourly", "Daily"].includes(plan);

    const alreadyExists = (member.activityFees || []).some(item =>
      item.activity &&
      String(item.activity._id || item.activity) === String(activityId) &&
      item.membershipStatus === "Active"
    );

    if (alreadyExists && isMembershipPlan) {
      return res.status(400).json({
        success: false,
        message: "You already have active membership for this activity"
      });
    }

    // ======================================
    // FIND FEE TYPE
    // ======================================
    const feeType = await FitnessFeeType.findOne({
      description: activity.name,
      organizationId: req.organizationId
    });

    if (!feeType) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }

    // ======================================
    // NORMALIZE PLAN (🔥 IMPORTANT)
    // ======================================
    const normalizedPlan =
      plan.charAt(0).toUpperCase() + plan.slice(1);

    // ======================================
    // PLAN → AMOUNT
    // ======================================
    const amountMap = {
      Hourly: feeType.hourly || 0,
      Daily: feeType.daily || 0,
      Weekly: feeType.weekly || 0,
      Monthly: feeType.monthly || 0,
      quarterly: feeType.quarterly || 0,
      halfYearly: feeType.halfYearly || 0,
      Annual: feeType.annual || 0
    };

    const amount = amountMap[normalizedPlan];

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    // ======================================
    // SLOT CAPACITY CHECK (🔥 FIXED)
    // ======================================
    const bookedCount = await FitnessBooking.countDocuments({
      activityId,
      slotId,
      date: bookingDate,
      bookingStatus: "Confirmed"
    });

    if (bookedCount >= (activity.capacity || 0)) {
      return res.status(400).json({
        success: false,
        message: "Slot became full"
      });
    }

    // ======================================
    // CREATE ALLOTMENT
    // ======================================
    const allotment = await FitnessFeeAllotment.create({
      memberId: member._id,
      feeTypeId: feeType._id,
      description: `Member App Purchase - ${activity.name}`,
      feePlan: normalizedPlan,
      amount,
      dueDate: new Date(),
      status: "Paid",
      organizationId: req.organizationId
    });

    // ======================================
    // PAYMENT ENTRY
    // ======================================
    await FitnessFeePayment.create({
      memberId: member._id,
      allotmentId: allotment._id,
      customerName: member.name,
      description: `Member App (Razorpay) - ${activity.name}`,
      feePlan: normalizedPlan,
      amount,
      paymentMode: "Bank Transfer",
      paymentSource: "Member App Razorpay",
      transactionId: razorpay_payment_id,
      paymentDate: new Date(),
      remarks: `Razorpay Order: ${razorpay_order_id}`,
      organizationId: req.organizationId
    });

    // ======================================
    // DATES
    // ======================================
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (normalizedPlan === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
    if (normalizedPlan === "quarterly") endDate.setMonth(endDate.getMonth() + 3);
    if (normalizedPlan === "halfYearly") endDate.setMonth(endDate.getMonth() + 6);
    if (normalizedPlan === "Annual") endDate.setFullYear(endDate.getFullYear() + 1);
    if (normalizedPlan === "Weekly") endDate.setDate(endDate.getDate() + 7);
    if (normalizedPlan === "Daily") endDate.setDate(endDate.getDate() + 1);
    if (normalizedPlan === "Hourly") endDate.setHours(endDate.getHours() + 1);

    // ======================================
    // SAVE MEMBERSHIP
    // ======================================
    if (isMembershipPlan) {
      await FitnessMember.findByIdAndUpdate(member._id, {
        $push: {
          activityFees: {
            activity: activity._id,
            feeType: feeType._id,
            plan: normalizedPlan,
            planFee: amount,
            finalAmount: amount,
            paymentStatus: "Paid",
            paymentMode: "Bank Transfer",
            paymentDate: new Date(),
            startDate,
            endDate,
            membershipStatus: "Active",
            allotmentId: allotment._id
          }
        },
        membershipStatus: "Active"
      });
    }

    // ======================================
    // CREATE BOOKING
    // ======================================
    await FitnessBooking.create({
      activityId,
      slotId,
      date: bookingDate,
      memberId: member._id,
      customerName: member.name,
      phone: member.mobile,
      bookingStatus: "Confirmed",
      paymentStatus: "Paid",
      paymentSource: "Member App Razorpay",
      isRecurring: isMembershipPlan,
      isException: false
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified, membership activated and slot booked successfully"
    });

  } catch (error) {
    console.error("verifyMembershipPayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
};



// ============================================
// CREATE RENEWAL ORDER
// POST /api/fitness/member-panel/create-renewal-order
// ============================================
exports.createRenewalOrder = async (req, res) => {
  try {
    const { activityFeeId, plan } = req.body;

    // =========================================
    // VALIDATION
    // =========================================
    if (!activityFeeId || !plan) {
      return res.status(400).json({
        success: false,
        message: "activityFeeId and plan are required"
      });
    }

    // =========================================
    // BLOCK INVALID RENEWALS
    // =========================================
    if (["Hourly", "Daily"].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Hourly and Daily plans cannot be renewed"
      });
    }

    // =========================================
    // FIND LOGGED-IN MEMBER
    // =========================================
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // =========================================
    // FIND EXISTING MEMBERSHIP
    // IMPORTANT:
    // .id() WILL FAIL because member is lean/plain object
    // =========================================
    const existingMembership = (member.activityFees || []).find(
      item => String(item._id) === String(activityFeeId)
    );

    if (!existingMembership) {
      return res.status(404).json({
        success: false,
        message: "Membership record not found"
      });
    }

    // =========================================
    // CHECK MEMBERSHIP STATUS
    // =========================================
    // if (existingMembership.membershipStatus !== "Active") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Only active memberships can be renewed"
    //   });
    // }

    // =========================================
    // FIND ACTIVITY
    // =========================================
    const activityId =
      existingMembership.activity?._id ||
      existingMembership.activity;

    const activity = await FitnessActivity.findById(activityId).lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // =========================================
    // FIND FEE STRUCTURE
    // =========================================
    const feeType = await FitnessFeeType.findOne({
      description: activity.name,
      organizationId: req.organizationId
    }).lean();

    if (!feeType) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }

    // =========================================
    // PLAN → AMOUNT MAP
    // KEEP CASING CONSISTENT EVERYWHERE
    // =========================================
    const amountMap = {
      Weekly: feeType.weekly || 0,
      Monthly: feeType.monthly || 0,
      quarterly: feeType.quarterly || 0,
      halfYearly: feeType.halfYearly || 0,
      Annual: feeType.annual || 0
    };

    const amount = amountMap[plan];

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid renewal plan selected"
      });
    }

    // =========================================
    // CREATE RAZORPAY ORDER
    // =========================================
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `renewal_${Date.now()}`
    });

    // =========================================
    // SUCCESS RESPONSE
    // =========================================
    return res.status(200).json({
      success: true,
      message: "Renewal order created successfully",
      data: {
        orderId: order.id,
        amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,

        // Important for verify API
        activityFeeId,

        activityId: activity._id,
        activityName: activity.name,
        plan
      }
    });

  } catch (error) {
    console.error("createRenewalOrder error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create renewal order"
    });
  }
};

// ============================================
// VERIFY RENEWAL PAYMENT
// POST /api/fitness/member-panel/verify-renewal-payment
// ============================================
exports.verifyRenewalPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      activityFeeId,
      plan
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !activityFeeId ||
      !plan
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required renewal verification fields"
      });
    }

    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // const oldMembership = member.activityFees.id(activityFeeId);
    const oldMembership = (member.activityFees || []).find(
  item => String(item._id) === String(activityFeeId)
);

if (!oldMembership) {
  return res.status(404).json({
    success: false,
    message: "Membership record not found"
  });
}

    if (!oldMembership) {
      return res.status(404).json({
        success: false,
        message: "Existing membership record not found"
      });
    }

    // ======================================
    // VERIFY SIGNATURE
    // ======================================
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Renewal payment verification failed"
      });
    }

    const activity = await FitnessActivity.findById(
      oldMembership.activity
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    const feeType = await FitnessFeeType.findOne({
      description: activity.name,
      organizationId: req.organizationId
    });

    if (!feeType) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }

    const amountMap = {
      Hourly: feeType.hourly || 0,
      Daily: feeType.daily || 0,
      Weekly: feeType.weekly || 0,
      Monthly: feeType.monthly || 0,
      quarterly: feeType.quarterly || 0,
      halfYearly: feeType.halfYearly || 0,
      Annual: feeType.annual || 0
    };

    const amount = amountMap[plan];

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid renewal plan"
      });
    }

    // ======================================
    // START DATE LOGIC
    // ======================================
    const today = new Date();
    let startDate;

    if (
      oldMembership.endDate &&
      new Date(oldMembership.endDate) > today
    ) {
      // active → extend from old end date
      startDate = new Date(oldMembership.endDate);
    } else {
      // expired → start today
      startDate = new Date();
    }

    const endDate = new Date(startDate);

    if (plan === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
    if (plan === "quarterly") endDate.setMonth(endDate.getMonth() + 3);
    if (plan === "halfYearly") endDate.setMonth(endDate.getMonth() + 6);
    if (plan === "Annual") endDate.setFullYear(endDate.getFullYear() + 1);
    if (plan === "Weekly") endDate.setDate(endDate.getDate() + 7);
    if (plan === "Daily") endDate.setDate(endDate.getDate() + 1);
    if (plan === "Hourly") endDate.setHours(endDate.getHours() + 1);

    // ======================================
    // CREATE FEE ALLOTMENT
    // ======================================
    const allotment = await FitnessFeeAllotment.create({
      memberId: member._id,
      feeTypeId: feeType._id,
      description: `Renewal - ${activity.name}`,
      feePlan: plan,
      amount,
      dueDate: new Date(),
      status: "Paid",
      organizationId: req.organizationId
    });

    // ======================================
    // CREATE PAYMENT ENTRY
    // ======================================
    await FitnessFeePayment.create({
      memberId: member._id,
      allotmentId: allotment._id,
      customerName: member.name,
      description: `Renewal Payment - ${activity.name}`,
      feePlan: plan,
      amount,
      paymentMode: "Bank Transfer",
      paymentSource: "Member App Renewal Razorpay",
      transactionId: razorpay_payment_id,
      paymentDate: new Date(),
      remarks: `Renewal | Razorpay Order: ${razorpay_order_id}`,
      organizationId: req.organizationId
    });

    // ======================================
    // CREATE NEW activityFees ENTRY
    // ======================================
    await FitnessMember.findByIdAndUpdate(
      member._id,
      {
        $push: {
          activityFees: {
            activity: activity._id,
            feeType: feeType._id,
            plan,
            planFee: amount,
            finalAmount: amount,
            paymentStatus: "Paid",
            paymentMode: "Bank Transfer",
            paymentDate: new Date(),
            startDate,
            endDate,
            membershipStatus: "Active",
            allotmentId: allotment._id
          }
        },
        membershipStatus: "Active"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Membership renewed successfully"
    });

  } catch (error) {
    console.error("verifyRenewalPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Renewal verification failed"
    });
  }
};


// ============================================
// MEMBER MEMBERSHIP STATUS
// GET /api/fitness/member-panel/memberships
// ============================================
exports.getMemberMemberships = async (req, res) => {
  try {
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    const today = new Date();

    const memberships = await Promise.all(
      (member.activityFees || []).map(async (item) => {
        const activity = await FitnessActivity.findById(
          item.activity
        ).select("name").lean();

        const endDate = item.endDate ? new Date(item.endDate) : null;
        const startDate = item.startDate ? new Date(item.startDate) : null;

        let currentStatus = "Inactive";
        let daysRemaining = 0;
        let canRenew = true;

        if (endDate && endDate >= today) {
          currentStatus = "Active";

          const diffTime = endDate - today;
          daysRemaining = Math.ceil(
            diffTime / (1000 * 60 * 60 * 24)
          );
        } else {
          currentStatus = "Expired";
          daysRemaining = 0;
        }

        // expiring soon logic
        const isExpiringSoon =
          currentStatus === "Active" && daysRemaining <= 7;

        return {
          activityFeeId: item._id,
          activityId: item.activity,
          activityName: activity?.name || "N/A",
          plan: item.plan,
          amount: item.finalAmount || 0,
          paymentStatus: item.paymentStatus || "Pending",
          startDate,
          endDate,
          membershipStatus: currentStatus,
          daysRemaining,
          isExpiringSoon,
          canRenew,
          isPassMember: !!member.membershipPass
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Membership details fetched successfully",
      totalMemberships: memberships.length,
      data: memberships
    });

  } catch (error) {
    console.error("getMemberMemberships error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memberships"
    });
  }
};

// ============================================
// MEMBER PROFILE WITH QR (PRODUCTION READY)
// GET /api/fitness/member-panel/profile
// ============================================
exports.getMemberProfile = async (req, res) => {
  try {
    const member = await findLoggedInMember(req);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    const today = new Date();

    // ======================================
    // ACTIVE ACTIVITIES
    // Only paid + active + not expired
    // ======================================
    const activeActivities = (member.activityFees || [])
      .filter((item) => {
        if (
          item.paymentStatus !== "Paid" ||
          item.membershipStatus !== "Active"
        ) {
          return false;
        }

        if (!item.endDate) return false;

        return new Date(item.endDate) >= today;
      })
      .map((item) => ({
        activityFeeId: item._id,

        // safer handling for populated/non-populated activity
        activityId: item.activity?._id || item.activity || null,
        activityName: item.activity?.name || "N/A",

        plan: item.plan || "",
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        membershipStatus: item.membershipStatus || "Inactive",
        paymentStatus: item.paymentStatus || "Pending"
      }));


      // ======================================
// ACTIVE BOOKINGS (Hourly/Daily)
// ======================================
const todayStr = new Date().toISOString().split("T")[0];

const activeBookings = await FitnessBooking.find({
  memberId: member._id,
  bookingStatus: "Confirmed",
  date: { $gte: todayStr }
})
  .populate("activityId")
  .lean();

    return res.status(200).json({
      success: true,
      message: "Member profile fetched successfully",
      data: {
        // ======================================
        // BASIC PROFILE
        // ======================================
        id: member._id,
        memberId: member.memberId || "",
        name: member.name || "",
        mobile: member.mobile || "",
        email: member.email || "",
        age: member.age || null,
        gender: member.gender || "",
        address: member.address || "",
        photo: member.photo || "",

        // ======================================
        // MEMBERSHIP STATUS
        // ======================================
        membershipStatus:
          member.membershipStatus || "Inactive",

        status: member.status || "Inactive",

        // restored from old version
        numberOfPersons: member.numberOfPersons || 1,
        isPassMember: !!member.membershipPass,

        // ======================================
        // QR CODE
        // ======================================
        qrCode: member.qrCode || "",

        // ======================================
        // STAFF SCANNER SUPPORT
        // ======================================
        activeActivities,

        // ======================================
// ACTIVE BOOKINGS (Hourly/Daily)
// ======================================
bookingActivities: activeBookings.map(item => ({
  activityId: item.activityId?._id,
  activityName: item.activityId?.name || "N/A",
  date: item.date,
  bookingStatus: item.bookingStatus
}))
      }
    });

  } catch (error) {
    console.error("getMemberProfile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch member profile"
    });
  }
};