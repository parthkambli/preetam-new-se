// const fs = require('fs');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// const { MongoClient } = require('mongodb');
// const cron = require('node-cron');

// const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;

// if (!MONGO_URI) {
//   console.error('❌ MONGODB_URI not found in .env file');
//   process.exit(1);
// }

// const BACKUP_DIR = path.join(__dirname, '..', 'backup');

// if (!fs.existsSync(BACKUP_DIR)) {
//   fs.mkdirSync(BACKUP_DIR, { recursive: true });
//   console.log('✅ Backup folder created automatically');
// }

// async function runBackup() {
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//   const backupFolder = path.join(BACKUP_DIR, `db_backup_${timestamp}`);
//   const logFile = path.join(BACKUP_DIR, 'backup.log');

//   const log = (message) => {
//     const time = new Date().toLocaleString();
//     const logMsg = `[${time}] ${message}\n`;
//     console.log(message);
//     fs.appendFileSync(logFile, logMsg);
//   };

//   log('🚀 Starting scheduled MongoDB backup...');

//   const client = new MongoClient(MONGO_URI);

//   try {
//     await client.connect();
//     log('✅ Connected to MongoDB');

//     const db = client.db();
//     const collections = await db.listCollections().toArray();

//     if (!fs.existsSync(backupFolder)) {
//       fs.mkdirSync(backupFolder, { recursive: true });
//     }

//     let totalDocs = 0;

//     for (const coll of collections) {
//       const name = coll.name;
//       log(`📦 Backing up collection: ${name}`);

//       const data = await db.collection(name).find({}).toArray();
//       fs.writeFileSync(path.join(backupFolder, `${name}.json`), JSON.stringify(data, null, 2));
//       totalDocs += data.length;
//     }

//     log(`🎉 Backup completed successfully!`);
//     log(`   Folder: ${backupFolder}`);
//     log(`   Collections: ${collections.length} | Total Documents: ${totalDocs}`);

//   } catch (err) {
//     log(`❌ Backup failed: ${err.message}`);
//     console.error(err);
//   } finally {
//     await client.close();
//   }
// }

// // ================== EXPORTED FUNCTION ==================
// function startBackupCron() {
//   console.log('⏰ MongoDB Backup Cron Job Scheduled (Every 7 days - Sunday 3:00 AM)');

//   // Runs every Sunday at 3:00 AM
//   cron.schedule('0 3 * * 1', () => {
//     console.log('⏰ Scheduled Backup Triggered...');
//     runBackup();
//   });
// }

// // Allow direct run for testing: node scripts/dbBackup.js
// if (require.main === module) {
//   runBackup();
// }
    
// module.exports = { startBackupCron, runBackup };











const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { MongoClient } = require('mongodb');
const cron = require('node-cron');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const BACKUP_DIR = path.join(__dirname, '..', 'backup');
const LATEST_DIR = path.join(BACKUP_DIR, 'latest');
const OLD_DIR = path.join(BACKUP_DIR, 'old');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
if (!fs.existsSync(LATEST_DIR)) fs.mkdirSync(LATEST_DIR, { recursive: true });
if (!fs.existsSync(OLD_DIR)) fs.mkdirSync(OLD_DIR, { recursive: true });

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(BACKUP_DIR, 'backup.log');

  const log = (message) => {
    const time = new Date().toLocaleString();
    const logMsg = `[${time}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMsg);
  };

  log('🚀 Starting scheduled MongoDB backup...');

  // Step 1: Move current 'latest' to 'old' (and clear old first)
  try {
    // Clear old folder first
    if (fs.existsSync(OLD_DIR)) {
      fs.rmSync(OLD_DIR, { recursive: true, force: true });
      fs.mkdirSync(OLD_DIR, { recursive: true });
    }

    // Move latest → old
    if (fs.existsSync(LATEST_DIR) && fs.readdirSync(LATEST_DIR).length > 0) {
      // Move all contents from latest to old
      const items = fs.readdirSync(LATEST_DIR);
      for (const item of items) {
        fs.renameSync(
          path.join(LATEST_DIR, item),
          path.join(OLD_DIR, item)
        );
      }
      log('📦 Moved previous backup to /old folder');
    }
  } catch (err) {
    log(`⚠️ Warning while moving old backup: ${err.message}`);
  }

  // Step 2: Create new backup in 'latest' folder
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    log('✅ Connected to MongoDB');

    const db = client.db();
    const collections = await db.listCollections().toArray();

    let totalDocs = 0;

    for (const coll of collections) {
      const name = coll.name;
      log(`📦 Backing up collection: ${name}`);

      const data = await db.collection(name).find({}).toArray();
      fs.writeFileSync(
        path.join(LATEST_DIR, `${name}.json`),
        JSON.stringify(data, null, 2)
      );
      totalDocs += data.length;
    }

    log(`🎉 New backup created successfully in /latest folder`);
    log(`   Collections: ${collections.length} | Total Documents: ${totalDocs}`);

  } catch (err) {
    log(`❌ Backup failed: ${err.message}`);
    console.error(err);
  } finally {
    await client.close();
  }
}

// ================== CRON FUNCTION ==================
function startBackupCron() {
  console.log('⏰ MongoDB Backup Cron Job Scheduled (Every 7 days - Sunday 3:00 AM)');

  // Runs every Sunday at 3:00 AM
  cron.schedule('0 3 * * 1', () => {
    console.log('⏰ Scheduled Backup Triggered...');
    runBackup();
  });
}

if (require.main === module) {
  runBackup();
}

module.exports = { startBackupCron, runBackup };