// const cron = require('node-cron');
// const FitnessMember = require('../models/FitnessMember');

// const computeActivityMembershipStatus = (af) => {
//   if (af.paymentStatus !== 'Paid') return 'Inactive';
//   if (!af.startDate || !af.endDate) return 'Inactive';

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
//   const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

//   return (today >= start && today <= end) ? 'Active' : 'Inactive';
// };

// const updateAllMembershipStatuses = async () => {
//   try {
//     const members = await FitnessMember.find({}).select('activityFees membershipStatus');

//     for (const member of members) {
//       let hasActive = false;

//       member.activityFees = member.activityFees.map(af => {
//         const newStatus = computeActivityMembershipStatus(af);
//         if (newStatus === 'Active') hasActive = true;
//         af.membershipStatus = newStatus;
//         return af;
//       });

//       member.membershipStatus = hasActive ? 'Active' : 'Inactive';

//       await member.save({ validateBeforeSave: false }); // Skip full validation for speed
//     }

//     console.log(`[${new Date().toISOString()}] Membership statuses updated successfully.`);
//   } catch (err) {
//     console.error('Cron: Membership status update failed:', err);
//   }
// };

// // Run every day at 00:05 AM
// const startMembershipCron = () => {
//   cron.schedule('5 0 * * *', updateAllMembershipStatuses, {
//     timezone: "Asia/Kolkata"
//   });

//   // Also run once on server start
//   updateAllMembershipStatuses();
// };

// module.exports = { startMembershipCron, updateAllMembershipStatuses };







// // utils/updateMembershipStatuses.js
// const cron = require('node-cron');
// const FitnessMember = require('../models/FitnessMember');

// const computeActivityMembershipStatus = (af) => {
//   if (af.paymentStatus !== 'Paid') return 'Inactive';
//   if (!af.startDate || !af.endDate) return 'Inactive';

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
//   const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

//   return (today >= start && today <= end) ? 'Active' : 'Inactive';
// };

// const updateAllMembershipStatuses = async () => {
//   try {
//     console.log(`[${new Date().toISOString()}] Starting membership status update...`);

//     const members = await FitnessMember.find({
//       organizationId: { $exists: true }
//     }).select('activityFees membershipStatus organizationId');

//     let updatedCount = 0;

//     for (const member of members) {
//       let hasActive = false;
//       let needsUpdate = false;

//       const updatedFees = member.activityFees.map(af => {
//         const currentStatus = af.membershipStatus || 'Inactive';
//         const newStatus = computeActivityMembershipStatus(af);

//         if (currentStatus !== newStatus) {
//           needsUpdate = true;
//         }
//         if (newStatus === 'Active') hasActive = true;

//         af.membershipStatus = newStatus;
//         return af;
//       });

//       if (needsUpdate) {
//         member.activityFees = updatedFees;
//         member.membershipStatus = hasActive ? 'Active' : 'Inactive';
//         await member.save({ validateBeforeSave: false });
//         updatedCount++;
//       }
//     }

//     console.log(`[${new Date().toISOString()}] Membership status update completed. Updated ${updatedCount} members.`);
//   } catch (err) {
//     console.error('Cron: Membership status update failed:', err);
//   }
// };

// // Run every day at 00:05 AM (Asia/Kolkata)
// const startMembershipCron = () => {
//   cron.schedule('5 0 * * *', updateAllMembershipStatuses, {
//     timezone: "Asia/Kolkata"
//   });

//   // Run immediately on server start
//   setTimeout(updateAllMembershipStatuses, 5000);
// };

// module.exports = { startMembershipCron, updateAllMembershipStatuses };











// // utils/updateMembershipStatuses.js
// const cron = require('node-cron');
// const FitnessMember = require('../models/FitnessMember');

// const computeActivityMembershipStatus = (af) => {
//   if (af.paymentStatus !== 'Paid') return 'Inactive';
//   if (!af.startDate || !af.endDate) return 'Inactive';

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
//   const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

//   return (today >= start && today <= end) ? 'Active' : 'Inactive';
// };

// const updateAllMembershipStatuses = async () => {
//   try {
//     console.log(`[${new Date().toISOString()}] [IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Starting membership status update...`);

//     const members = await FitnessMember.find({
//       organizationId: { $exists: true }
//     }).select('activityFees membershipStatus organizationId');

//     let updatedCount = 0;

//     for (const member of members) {
//       let hasActive = false;
//       let needsUpdate = false;

//       const updatedFees = member.activityFees.map(af => {
//         const currentStatus = af.membershipStatus || 'Inactive';
//         const newStatus = computeActivityMembershipStatus(af);

//         if (currentStatus !== newStatus) needsUpdate = true;
//         if (newStatus === 'Active') hasActive = true;

//         af.membershipStatus = newStatus;
//         return af;
//       });

//       if (needsUpdate) {
//         member.activityFees = updatedFees;
//         member.membershipStatus = hasActive ? 'Active' : 'Inactive';
//         await member.save({ validateBeforeSave: false });
//         updatedCount++;
//       }
//     }

//     console.log(`[${new Date().toISOString()}] Membership status update completed. Updated ${updatedCount} members.`);
//   } catch (err) {
//     console.error('Cron: Membership status update failed:', err);
//   }
// };

// // ─────────────────────────────────────────────
// // More Reliable Cron Configuration
// // ─────────────────────────────────────────────
// const startMembershipCron = () => {
//   // Run every day at 00:05 AM IST
//   cron.schedule('0 0 * * *', updateAllMembershipStatuses, {
//     timezone: "Asia/Kolkata"
//   });

//   console.log(`[${new Date().toISOString()}] Cron job scheduled: Every day at 00:05 AM IST`);

//   // Run immediately when server starts (for testing)
//   setTimeout(() => {
//     console.log("Running immediate status update on server start...");
//     updateAllMembershipStatuses();
//   }, 8000);
// };

// module.exports = { startMembershipCron, updateAllMembershipStatuses };










// utils/updateMembershipStatuses.js
const cron = require('node-cron');
const FitnessMember = require('../models/FitnessMember');

const computeActivityMembershipStatus = (af) => {
  if (af.paymentStatus !== 'Paid') return 'Inactive';
  if (!af.startDate || !af.endDate) return 'Inactive';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
  const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);

  return (today >= start && today <= end) ? 'Active' : 'Inactive';
};

const updateAllMembershipStatuses = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Starting membership status update...`);

    const members = await FitnessMember.find({
      organizationId: { $exists: true }
    }).select('activityFees membershipStatus organizationId');

    let updatedCount = 0;

    for (const member of members) {
      let hasActive = false;
      let needsUpdate = false;

      const updatedFees = member.activityFees.map(af => {
        const currentStatus = af.membershipStatus || 'Inactive';
        const newStatus = computeActivityMembershipStatus(af);

        if (currentStatus !== newStatus) needsUpdate = true;
        if (newStatus === 'Active') hasActive = true;

        af.membershipStatus = newStatus;
        return af;
      });

      if (needsUpdate) {
        member.activityFees = updatedFees;
        member.membershipStatus = hasActive ? 'Active' : 'Inactive';
        
        // IMPORTANT: Bypass pre-save hook to avoid memberId regeneration
        await member.save({ 
          validateBeforeSave: false,
          timestamps: false   // Also prevent updatedAt from changing unnecessarily
        });
        updatedCount++;
      }
    }

    console.log(`[${new Date().toISOString()}] Membership status update completed. Updated ${updatedCount} members.`);
  } catch (err) {
    console.error('Cron: Membership status update failed:', err.message || err);
  }
};

// Run every day at 12:05 AM IST
const startMembershipCron = () => {
  cron.schedule('5 0 * * *', updateAllMembershipStatuses, {
    timezone: "Asia/Kolkata"
  });

  console.log(`[${new Date().toISOString()}] ✅ Cron job scheduled: Every day at 12:05 AM IST`);

  // Run once on server start
  setTimeout(() => {
    console.log("Running immediate status update on server start...");
    updateAllMembershipStatuses();
  }, 8000);
};

module.exports = { startMembershipCron, updateAllMembershipStatuses };