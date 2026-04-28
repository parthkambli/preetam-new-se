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

let isBackupRunning = false;

function withTimeout(promise, ms, label = 'Operation') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`⏱ ${label} timed out after ${ms / 1000}s`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function backupSingleCollection(db, name, targetDir, log) {
  const filePath = path.join(targetDir, `${name}.json`);
  const COLLECTION_TIMEOUT_MS = 2 * 60 * 1000; // 2 min per collection

  try {
    fs.writeFileSync(filePath, '[]', 'utf8');

    log(`  🔍 Reading ${name}...`);
    log(`  ⏳ Starting find().toArray() for ${name}`);

    const docs = await withTimeout(
      db.collection(name).find({}).toArray(),
      COLLECTION_TIMEOUT_MS,
      `Collection '${name}'`
    );

    log(`  ✅ Fetched ${docs.length} docs from ${name}`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    log(`  ✅ ${name}: ${docs.length} documents`);

    return { success: true, count: docs.length };
  } catch (err) {
    log(`  ❌ FAILED '${name}': ${err.message}`);

    try {
      fs.writeFileSync(filePath, '[]', 'utf8');
      log(`  ↩️ Saved empty backup file for '${name}'`);
    } catch (writeErr) {
      log(`  ❌ Could not write fallback file for '${name}': ${writeErr.message}`);
    }

    return { success: false, count: 0 };
  }
}

async function runBackup() {
  if (isBackupRunning) {
    console.log('⚠️ Backup already running. Skipping this run.');
    return;
  }

  isBackupRunning = true;

  const logFile = path.join(BACKUP_DIR, 'backup.log');

  // Open ONE persistent stream for the entire backup run.
  // This avoids repeated open/close cycles that cause EBUSY on Windows
  // (triggered by antivirus, Windows Search indexer, etc. grabbing the file
  //  in between appendFileSync calls).
  const logStream = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });

  const log = (message) => {
    const time = new Date().toLocaleString();
    console.log(message);
    logStream.write(`[${time}] ${message}\n`);
  };

  // Cleanly close the stream and wait for it to drain before resolving
  const closeLog = () =>
    new Promise((resolve) => {
      logStream.end(resolve);
    });

  log('🚀 Starting MongoDB backup...');
  const startTime = Date.now();

  let client;

  try {
    // Step 1: Move everything from latest -> old
    try {
      if (fs.existsSync(OLD_DIR)) {
        fs.rmSync(OLD_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(OLD_DIR, { recursive: true });

      if (fs.existsSync(LATEST_DIR)) {
        const latestItems = fs.readdirSync(LATEST_DIR);

        for (const item of latestItems) {
          fs.renameSync(
            path.join(LATEST_DIR, item),
            path.join(OLD_DIR, item)
          );
        }
      }

      if (fs.existsSync(LATEST_DIR)) {
        fs.rmSync(LATEST_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(LATEST_DIR, { recursive: true });

      log('📦 Moved all previous latest backup files to /old and cleared /latest');
    } catch (err) {
      log(`⚠️ Could not rotate backup folders: ${err.message}`);
    }

    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    await client.connect();
    log('✅ Connected to MongoDB');

    const db = client.db();
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    log(`📋 Found ${collections.length} collections`);
    log('');

    let totalDocs = 0;
    const failed = [];

    for (let i = 0; i < collections.length; i++) {
      const name = collections[i].name;
      log(`[${i + 1}/${collections.length}] 📦 ${name}`);

      const result = await backupSingleCollection(db, name, LATEST_DIR, log);

      if (result.success) {
        totalDocs += result.count;
      } else {
        failed.push(name);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const successCount = collections.length - failed.length;

    log('');
    log('═════════════════════════════════════════');
    log(`🎉 BACKUP FINISHED in ${elapsed}s`);
    log(`   Collections : ${successCount}/${collections.length} succeeded`);
    log(`   Documents   : ${totalDocs} total`);

    if (failed.length > 0) {
      log(`   ❌ Failed    : ${failed.join(', ')}`);
      log('   ⚠️ Backup completed WITH errors');
    } else {
      log('   🟢 ALL collections backed up successfully — zero errors!');
    }

    log('═════════════════════════════════════════');
  } catch (err) {
    log(`❌ Fatal backup error: ${err.message}`);
  } finally {
    try {
      if (client) {
        await client.close();
        log('🔌 MongoDB connection closed');
      }
    } catch (closeErr) {
      log(`⚠️ Error closing MongoDB connection: ${closeErr.message}`);
    }

    isBackupRunning = false;

    // Always close the log stream last, after all other finally work is done
    await closeLog();
  }
}

function startBackupCron() {
  console.log('⏰ Backup cron scheduled — every Sunday at 3:09 AM');

  cron.schedule('0 3 * * 0', () => {
  // cron.schedule('* * * * *', () => {
    console.log('⏰ Cron triggered backup...');
    runBackup();
  });
}

if (require.main === module) {
  runBackup();
}

module.exports = { startBackupCron, runBackup };



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
// const LATEST_DIR = path.join(BACKUP_DIR, 'latest');
// const OLD_DIR = path.join(BACKUP_DIR, 'old');

// if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
// if (!fs.existsSync(LATEST_DIR)) fs.mkdirSync(LATEST_DIR, { recursive: true });
// if (!fs.existsSync(OLD_DIR)) fs.mkdirSync(OLD_DIR, { recursive: true });

// let isBackupRunning = false;

// function withTimeout(promise, ms, label = 'Operation') {
//   return new Promise((resolve, reject) => {
//     const timer = setTimeout(() => {
//       reject(new Error(`⏱ ${label} timed out after ${ms / 1000}s`));
//     }, ms);

//     promise
//       .then((result) => {
//         clearTimeout(timer);
//         resolve(result);
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         reject(err);
//       });
//   });
// }


// async function backupSingleCollection(db, name, targetDir, log) {
//   const filePath = path.join(targetDir, `${name}.json`);
//   const COLLECTION_TIMEOUT_MS = 2 * 60 * 1000; // 2 min per collection

//   try {
//     fs.writeFileSync(filePath, '[]', 'utf8');

//     log(`  🔍 Reading ${name}...`);
//     log(`  ⏳ Starting find().toArray() for ${name}`);

//     const docs = await withTimeout(
//       db.collection(name).find({}).toArray(),
//       COLLECTION_TIMEOUT_MS,
//       `Collection '${name}'`
//     );

//     log(`  ✅ Fetched ${docs.length} docs from ${name}`);
//     fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
//     log(`  ✅ ${name}: ${docs.length} documents`);

//     return { success: true, count: docs.length };
//   } catch (err) {
//     log(`  ❌ FAILED '${name}': ${err.message}`);

//     try {
//       fs.writeFileSync(filePath, '[]', 'utf8');
//       log(`  ↩️ Saved empty backup file for '${name}'`);
//     } catch (writeErr) {
//       log(`  ❌ Could not write fallback file for '${name}': ${writeErr.message}`);
//     }

//     return { success: false, count: 0 };
//   }
// }

// // async function backupSingleCollection(db, name, targetDir, log) {
// //   const filePath = path.join(targetDir, `${name}.json`);
// //   const COLLECTION_TIMEOUT_MS = 2 * 60 * 1000; // 2 min per collection

// //   try {
// //     // always create file, even before fetching
// //     fs.writeFileSync(filePath, '[]', 'utf8');

// //     log(`  🔍 Reading ${name}...`);

// //     const docs = await withTimeout(
// //       db.collection(name).find({}).toArray(),
// //       COLLECTION_TIMEOUT_MS,
// //       `Collection '${name}'`
// //     );

// //     fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
// //     log(`  ✅ ${name}: ${docs.length} documents`);

// //     return { success: true, count: docs.length };
// //   } catch (err) {
// //     log(`  ❌ FAILED '${name}': ${err.message}`);

// //     try {
// //       // keep empty file so collection still exists in backup
// //       fs.writeFileSync(filePath, '[]', 'utf8');
// //       log(`  ↩️ Saved empty backup file for '${name}'`);
// //     } catch (writeErr) {
// //       log(`  ❌ Could not write fallback file for '${name}': ${writeErr.message}`);
// //     }

// //     return { success: false, count: 0 };
// //   }
// // }

// async function runBackup() {
//   if (isBackupRunning) {
//     console.log('⚠️ Backup already running. Skipping this run.');
//     return;
//   }

//   isBackupRunning = true;

//   const logFile = path.join(BACKUP_DIR, 'backup.log');

//   const log = (message) => {
//     const time = new Date().toLocaleString();
//     const logMsg = `[${time}] ${message}\n`;
//     console.log(message);
//     fs.appendFileSync(logFile, logMsg);
//   };

//   log('🚀 Starting MongoDB backup...');
//   const startTime = Date.now();

//   let client;

//   try {
//     // Step 1: Move everything from latest -> old
//     try {
//       if (fs.existsSync(OLD_DIR)) {
//         fs.rmSync(OLD_DIR, { recursive: true, force: true });
//       }
//       fs.mkdirSync(OLD_DIR, { recursive: true });

//       if (fs.existsSync(LATEST_DIR)) {
//         const latestItems = fs.readdirSync(LATEST_DIR);

//         for (const item of latestItems) {
//           fs.renameSync(
//             path.join(LATEST_DIR, item),
//             path.join(OLD_DIR, item)
//           );
//         }
//       }

//       if (fs.existsSync(LATEST_DIR)) {
//         fs.rmSync(LATEST_DIR, { recursive: true, force: true });
//       }
//       fs.mkdirSync(LATEST_DIR, { recursive: true });

//       log('📦 Moved all previous latest backup files to /old and cleared /latest');
//     } catch (err) {
//       log(`⚠️ Could not rotate backup folders: ${err.message}`);
//     }

//     client = new MongoClient(MONGO_URI, {
//       serverSelectionTimeoutMS: 30000,
//       connectTimeoutMS: 30000,
//       socketTimeoutMS: 30000,
//     });

//     await client.connect();
//     log('✅ Connected to MongoDB');

//     const db = client.db();
//     const collections = await db.listCollections({}, { nameOnly: true }).toArray();

//     log(`📋 Found ${collections.length} collections`);
//     log('');

//     let totalDocs = 0;
//     const failed = [];

//     for (let i = 0; i < collections.length; i++) {
//       const name = collections[i].name;
//       log(`[${i + 1}/${collections.length}] 📦 ${name}`);

//       const result = await backupSingleCollection(db, name, LATEST_DIR, log);

//       if (result.success) {
//         totalDocs += result.count;
//       } else {
//         failed.push(name);
//       }
//     }

//     const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
//     const successCount = collections.length - failed.length;

//     log('');
//     log('═════════════════════════════════════════');
//     log(`🎉 BACKUP FINISHED in ${elapsed}s`);
//     log(`   Collections : ${successCount}/${collections.length} succeeded`);
//     log(`   Documents   : ${totalDocs} total`);

//     if (failed.length > 0) {
//       log(`   ❌ Failed    : ${failed.join(', ')}`);
//       log('   ⚠️ Backup completed WITH errors');
//     } else {
//       log('   🟢 ALL collections backed up successfully — zero errors!');
//     }

//     log('═════════════════════════════════════════');
//   } catch (err) {
//     const time = new Date().toLocaleString();
//     const logMsg = `[${time}] ❌ Fatal backup error: ${err.message}\n`;
//     console.log(`❌ Fatal backup error: ${err.message}`);
//     fs.appendFileSync(logFile, logMsg);
//   } finally {
//     try {
//       if (client) {
//         await client.close();
//         const time = new Date().toLocaleString();
//         const logMsg = `[${time}] 🔌 MongoDB connection closed\n`;
//         console.log('🔌 MongoDB connection closed');
//         fs.appendFileSync(logFile, logMsg);
//       }
//     } catch (closeErr) {
//       const time = new Date().toLocaleString();
//       const logMsg = `[${time}] ⚠️ Error closing MongoDB connection: ${closeErr.message}\n`;
//       console.log(`⚠️ Error closing MongoDB connection: ${closeErr.message}`);
//       fs.appendFileSync(logFile, logMsg);
//     }

//     isBackupRunning = false;
//   }
// }

// function startBackupCron() {
//   console.log('⏰ Backup cron scheduled — every Sunday at 3:09 AM');

//   cron.schedule('23 3 * * 0', () => {
//     console.log('⏰ Cron triggered backup...');
//     runBackup();
//   });
// }

// if (require.main === module) {
//   runBackup();
// }

// module.exports = { startBackupCron, runBackup };