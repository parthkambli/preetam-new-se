require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await User.updateMany(
      {
        role: "FitnessStaff",
        organizationId: "fitness",
        $or: [
          { accessibleOrganizations: { $exists: false } },
          { accessibleOrganizations: { $size: 0 } }
        ]
      },
      {
        $set: {
          accessibleOrganizations: ["fitness", "school"]
        }
      }
    );

    console.log("------------------------------------------------");
    console.log("Migration completed");
    console.log("Matched :", result.matchedCount);
    console.log("Modified:", result.modifiedCount);
    console.log("------------------------------------------------");
  } catch (err) {
    console.error("❌ Migration failed");
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

run();