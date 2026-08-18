const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

// 1. Load service account
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

initializeApp({
  credential: cert(serviceAccount),
});

// 2. Grant Custom Claims
async function setAdminRole(uid) {
  try {
    await getAuth().setCustomUserClaims(uid, {
      role: 'admin',
      admin: true,
    });

    console.log(`\n✅ Successfully granted Admin custom claims to UID: ${uid}`);
    
    const userRecord = await getAuth().getUser(uid);
    console.log(`Account Email: ${userRecord.email || 'N/A'}`);
    console.log('Active Claims:', userRecord.customClaims);
    console.log('\n👉 Remember to log out and log back into the admin panel to refresh your session.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to set admin claims:', error.message);
    process.exit(1);
  }
}

// 3. Read target UID from terminal argument
const targetUid = process.argv[2];
if (!targetUid) {
  console.log('\n❌ Missing UID argument.');
  console.log('Usage: node makeAdmin.cjs <USER_UID>\n');
  process.exit(1);
}

setAdminRole(targetUid);