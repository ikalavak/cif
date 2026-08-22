const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

// 1. Load service account
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

// 2. Grant Custom Claims AND Create Firestore Admin Document by Email
async function setAdminRoleByEmail(email) {
  try {
    // Look up the user record by email to get their UID
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Set Custom Claims on Auth token
    await auth.setCustomUserClaims(uid, {
      role: 'admin',
      admin: true,
    });

    // Create the required document in Firestore /admins/{uid}
    await db.collection('admins').doc(uid).set({
      email: userRecord.email,
      role: 'admin',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`\n✅ Successfully granted Admin status!`);
    console.log(`Email: ${userRecord.email}`);
    console.log(`Resolved UID: ${uid}`);
    console.log(`Firestore Doc: /admins/${uid} created/updated.`);
    console.log('\n👉 Log out and log back into the admin panel for the changes to take effect.\n');

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌ Error: No Firebase Auth account found for email "${email}". Make sure the user has signed up first.\n`);
    } else {
      console.error('\n❌ Failed to set admin:', error.message);
    }
    process.exit(1);
  }
}

// 3. Read target Email from terminal argument
const targetEmail = process.argv[2];
if (!targetEmail) {
  console.log('\n❌ Missing email argument.');
  console.log('Usage: node makeAdmin.cjs <USER_EMAIL>\n');
  process.exit(1);
}

setAdminRoleByEmail(targetEmail.trim());