// seed-events.js
//
// One-time script to bulk-populate the "events" collection in Firestore
// from the official 2026 festival schedule. Uses the same field names
// your admin panel and mobile app already expect (title, category, venue,
// start_date, status, published, featured).
//
// SETUP (run once):
//   npm install dotenv
//
// USAGE:
//   node seed-events.js
//
// This reads your existing .env file (same VITE_FIREBASE_* values your
// admin panel already uses), so run this from inside the cif-admin-panel
// folder where that .env lives.

import "dotenv/config";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Missing Firebase env vars. Run this from inside cif-admin-panel where .env lives.",
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Category inferred from each title's wording — not in the original source
// document, so treat these as a reasonable starting guess, easy to correct
// later in the admin panel's Edit form.
function inferCategory(title) {
  const t = title.toLowerCase();
  if (t.includes("workshop")) return "Workshops";
  if (t.includes("panel") || t.includes("talk") || t.includes("conference"))
    return "Talks";
  if (t.includes("screening")) return "Screenings";
  if (
    t.includes("private view") ||
    t.includes("archive") ||
    t.includes("installation") ||
    t.includes("exhibition")
  )
    return "Exhibitions";
  if (
    t.includes("cypher") ||
    t.includes("coffee morning") ||
    t.includes("open day")
  )
    return "Networking";
  return "Festival";
}

// [title, venue, "YYYY-MM-DDTHH:MM"]
const RAW_EVENTS = [
  // Wednesday 2 September 2026
  ["Creative Careers Lab", "RDCS GF Exhibition", "2026-09-02T11:00"],
  [
    "ACI Advisory Board: Industry Insiders Talk — You've Got the Degree. Now What?",
    "RDCS GF Exhibition",
    "2026-09-02T11:00",
  ],
  [
    "MBA Fashion: Different Ideas. Different Identities. One Creative Future.",
    "",
    "2026-09-02T11:00",
  ],
  ["Immersive Horror Demo", "RDCS GF Exhibition", "2026-09-02T11:00"],
  [
    "Searchlight: Which Career Is Right for Me Workshop",
    "RDCS GF Exhibition",
    "2026-09-02T12:00",
  ],
  [
    "Lazy Oaf Workshop: Designing the Oaf Way",
    "Community Hub",
    "2026-09-02T13:00",
  ],
  [
    "Searchlight Workshop: CV / Portfolio Reviews",
    "RDCS GF Exhibition",
    "2026-09-02T14:00",
  ],
  [
    "London Higher Panel Talk: Breaking into Screen",
    "RDCS GF Exhibition",
    "2026-09-02T15:00",
  ],
  ["Regenerative Fashion Archive (RFA)", "Archive Room", "2026-09-02T16:00"],
  [
    "TLSS x UEL Global League: Installation",
    "RDCS GF Exhibition",
    "2026-09-02T16:00",
  ],
  [
    "RFA x GDIPU x JISULIFE: Climate Control Centre",
    "RDCS GF Exhibition",
    "2026-09-02T16:00",
  ],
  [
    "Private View: MA Fine Art Show, University of East London",
    "AVA",
    "2026-09-02T17:00",
  ],

  // Thursday 3 September 2026
  [
    "Creative Futures Community CIC x CIRCA Research Conference: Creative Balance",
    "The Source",
    "2026-09-03T10:00",
  ],
  [
    "MBA Fashion: Different Ideas. Different Identities. One Creative Future.",
    "Community Hub",
    "2026-09-03T11:00",
  ],
  [
    "TLSS x UEL Global League: Installation",
    "RDCS GF Exhibition",
    "2026-09-03T11:00",
  ],
  [
    "Regenerative Fashion Archive (RFA)",
    "Regenerative Fashion Archive Room",
    "2026-09-03T11:00",
  ],
  [
    "RFA x GDIPU x JISULIFE: Climate Control Centre",
    "RDCS GF Exhibition",
    "2026-09-03T11:00",
  ],
  ["Immersive Horror Demo", "RDCS GF Exhibition", "2026-09-03T11:00"],
  ["Creative Careers Lab", "RDCS GF Exhibition", "2026-09-03T11:00"],
  [
    "Caramel Rock: Drop-in Making Workshop",
    "RDCS GF Exhibition",
    "2026-09-03T11:00",
  ],
  [
    "Canva Workshop: Making It With Canva",
    "Living Library",
    "2026-09-03T12:00",
  ],
  [
    "London Higher Talk: Networking and Freelancing",
    "RDCS GF Exhibition",
    "2026-09-03T13:00",
  ],
  [
    "Beyond the Classroom: Achieving Success as a Graduate",
    "",
    "2026-09-03T14:00",
  ],
  [
    "Akanda Productions Workshop: Creative Speedwriting Camp & Cypher",
    "Hackathon Space",
    "2026-09-03T14:00",
  ],
  [
    "Learning by Doing: A Creative Applied Education Workshop",
    "RDCS GF Exhibition",
    "2026-09-03T15:00",
  ],

  // Friday 4 September 2026
  [
    "Creative Futures Community CIC x CIRCA Research Conference: Creative Balance",
    "The Source",
    "2026-09-04T09:30",
  ],
  ["House of Kings", "The Source", "2026-09-04T10:00"],
  ["Grow London Local Coffee Morning", "RDCS Café Area", "2026-09-04T10:00"],
  ["Creative Careers Lab", "RDCS GF Exhibition", "2026-09-04T11:00"],
  [
    "TLSS x UEL Global League: Installation",
    "RDCS GF Exhibition",
    "2026-09-04T11:00",
  ],
  [
    "RFA x GDIPU x JISULIFE: Climate Control Centre",
    "RDCS GF Exhibition",
    "2026-09-04T11:00",
  ],
  [
    "Regenerative Fashion Archive (RFA)",
    "Regenerative Fashion Archive Room",
    "2026-09-04T11:00",
  ],
  ["RDCS and TerraDock Open Day", "TerraDock", "2026-09-04T11:00"],
  [
    "One Newham: Creative Health in Newham",
    "Living Library",
    "2026-09-04T11:00",
  ],
  ["Metro Bank", "RDCS GF Exhibition", "2026-09-04T11:00"],
  [
    "Grow London Local: One-to-One Business & Freelancing Advice",
    "RDCS GF Exhibition",
    "2026-09-04T12:15",
  ],
  [
    "DASH Arts Workshop: Speak Out, Find Your Voice",
    "RDCS GF Exhibition",
    "2026-09-04T12:00",
  ],
  [
    "Different Minds, Creative Strengths: An Interactive Neurodiversity Workshop",
    "RDCS",
    "2026-09-04T13:00",
  ],
  [
    "ACI Advisory Board: Industry Insider Panel — Who's in Control",
    "The Source",
    "2026-09-04T13:00",
  ],
  [
    "Care-Centred Co-Creation with Communities Workshop",
    "RDCS GF Exhibition",
    "2026-09-04T14:00",
  ],
  [
    "Akanda Productions: Seema — Short Film Screening & Q&A",
    "Hackathon Space",
    "2026-09-04T14:00",
  ],

  // Saturday 5 September 2026
  ["The Cypher: Black Women Own the Element", "The Source", "2026-09-05T15:30"],
];

async function seed() {
  console.log(`Seeding ${RAW_EVENTS.length} events...`);
  let count = 0;

  for (const [title, venue, dateTimeStr] of RAW_EVENTS) {
    try {
      await addDoc(collection(db, "events"), {
        title,
        image_url: "",
        category: inferCategory(title),
        venue,
        start_date: Timestamp.fromDate(new Date(dateTimeStr)),
        status: "Open",
        published: true,
        featured: false,
        created_at: serverTimestamp(),
      });
      count++;
      console.log(`✓ (${count}/${RAW_EVENTS.length}) ${title}`);
    } catch (err) {
      console.error(`✗ Failed on "${title}":`, err.message);
    }
  }

  console.log(`\nDone. ${count}/${RAW_EVENTS.length} events added.`);
  process.exit(0);
}

seed();
