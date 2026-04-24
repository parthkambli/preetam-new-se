const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QRCode = require('qrcode');

const FitnessMember = require('../models/FitnessMember');

dotenv.config();

const fixMemberQR = async () => {
  try {
    console.log('🔌 Connecting DB...');
    await mongoose.connect(process.env.MONGO_URI);

    console.log('🚀 Fixing QR codes...');

    const members = await FitnessMember.find();

    let updatedCount = 0;

    for (const member of members) {
      try {
        // ❌ Skip if no memberId (should not happen, but be safe)
        if (!member.memberId) {
          console.log(`⚠️ Skipping member without memberId: ${member._id}`);
          continue;
        }

        // 🔍 Detect broken QR
        let isBroken = false;

        if (!member.qrCode) {
          isBroken = true;
        } else {
          try {
            const decoded = JSON.parse(
              Buffer.from(member.qrCode.split(',')[1], 'base64').toString()
            );

            if (!decoded.memberId) {
              isBroken = true;
            }
          } catch {
            isBroken = true;
          }
        }

        if (!isBroken) continue;

        // ✅ Generate correct QR
        const qrData = JSON.stringify({
          memberId: member.memberId,
          org: member.organizationId,
        });

        const qrImage = await QRCode.toDataURL(qrData);

        member.qrCode = qrImage;
        await member.save();

        updatedCount++;
        console.log(`✅ Fixed: ${member.memberId}`);

      } catch (err) {
        console.error(`❌ Error fixing member ${member._id}:`, err.message);
      }
    }

    console.log(`🎉 Done. Updated ${updatedCount} members`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
};

fixMemberQR();