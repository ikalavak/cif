// backfill-event-images.js
//
// One-time script to add a placeholder image to every event that doesn't
// have one yet. The original schedule document had no actual photos, so
// these are representative stock images chosen by category — swap them
// for real festival photos via the admin panel whenever you have them.
//
// SETUP: npm install dotenv   (skip if already installed)
// USAGE: node backfill-event-images.js
// Run from inside cif-admin-panel, where .env lives.

import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import readline from "readline";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// One representative Unsplash image per category. Swap any of these for
// Cloudinary links whenever you have real photos.
const CATEGORY_IMAGES = {
  Workshops: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80",
  Talks: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
  Exhibitions: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80",
  Screenings: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
  Networking: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
  Festival: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
};
const DEFAULT_IMAGE = CATEGORY_IMAGES.Festival;

async function run() {
  console.log("This script needs to sign in as an admin.\n");
  const email = await prompt("Admin email: ");
  const password = await prompt("Admin password: ");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("✓ Signed in.\n");
  } catch (err) {
    console.error("✗ Login failed:", err.message);
    process.exit(1);
  }

  const snapshot = await getDocs(collection(db, "events"));
  console.log(`Found ${snapshot.size} events. Adding placeholder images where missing...\n`);

  let fixed = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.image_url) {
      const image = CATEGORY_IMAGES[data.category] || DEFAULT_IMAGE;
      await updateDoc(doc(db, "events", docSnap.id), { image_url: image });
      console.log(`✓ ${data.title} → ${data.category || "Festival"} image`);
      fixed++;
    }
  }

  console.log(`\nDone. ${fixed}/${snapshot.size} events updated.`);
  process.exit(0);
}

run();