const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QRCode = require('qrcode');

const FitnessMember = require('../models/FitnessMember');

dotenv.config();

const fixMemberQR = async () => {
  try {
    console.log('🔌 Connecting DB...');
    await mongoose.connect(process.env.MONGO_URI);

    console.log('🚀 Regenerating QR codes...');

    const members = await FitnessMember.find();

    let updatedCount = 0;

    for (const member of members) {
      if (!member.memberId) continue;

      const qrData = JSON.stringify({
        memberId: member.memberId,
        organizationId: member.organizationId,
      });

      const qrImage = await QRCode.toDataURL(qrData);

      member.qrCode = qrImage;
      await member.save();

      updatedCount++;
      console.log(`✅ Updated: ${member.memberId}`);
    }

    console.log(`🎉 Done. Updated ${updatedCount} members`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Script failed:', err);
    process.exit(1);
  }
};

fixMemberQR();