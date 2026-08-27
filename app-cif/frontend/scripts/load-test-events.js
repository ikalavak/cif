/**
 * load-test-events.js
 *
 * Simulates many concurrent "users" browsing the Events screen —
 * repeatedly running the exact same Firestore query EventsScreen.js
 * uses (published events, ordered by start_date) — against the local
 * Firebase Emulator Suite. Never touches live/production Firebase.
 *
 * USAGE (from app-cif/frontend):
 *   node scripts/load-test-events.js --concurrency 50 --duration 30
 *
 * Flags (all optional):
 *   --concurrency  Number of simulated simultaneous users   (default: 50)
 *   --duration     How long to run, in seconds              (default: 30)
 *   --host         Firestore emulator host                  (default: 127.0.0.1)
 *   --port         Firestore emulator port                  (default: 8080)
 *   --project      Firebase project ID (must match your app) (default: cif-1-2d484)
 */

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} = require("firebase/firestore");

// ---- Parse CLI args ----
function getArg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const CONCURRENCY = parseInt(getArg("concurrency", "50"), 10);
const DURATION_SEC = parseInt(getArg("duration", "30"), 10);
const HOST = getArg("host", "127.0.0.1");
const PORT = parseInt(getArg("port", "8080"), 10);
const PROJECT_ID = getArg("project", "cif-1-2d484");

// ---- Connect to the LOCAL EMULATOR ONLY ----
const app = initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, HOST, PORT);

console.log("🔥 Load test target: Firebase EMULATOR only (never live Firebase)");
console.log(`   Project: ${PROJECT_ID}  Host: ${HOST}:${PORT}`);
console.log(`   Simulated concurrent users: ${CONCURRENCY}`);
console.log(`   Duration: ${DURATION_SEC}s\n`);

const latencies = [];
let successCount = 0;
let errorCount = 0;
const errors = [];

function buildEventsQuery() {
  // Same query as EventsScreen.js / HomeScreen.js
  return query(
    collection(db, "events"),
    where("published", "==", true),
    orderBy("start_date", "asc"),
  );
}

async function virtualUserLoop(userId, stopAt) {
  while (Date.now() < stopAt) {
    const start = performance.now();
    try {
      await getDocs(buildEventsQuery());
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push(err.message || String(err));
    }
  }
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(
    sortedArr.length - 1,
    Math.floor((p / 100) * sortedArr.length),
  );
  return sortedArr[idx];
}

async function main() {
  const stopAt = Date.now() + DURATION_SEC * 1000;
  const users = Array.from({ length: CONCURRENCY }, (_, i) =>
    virtualUserLoop(i, stopAt),
  );

  const overallStart = performance.now();
  await Promise.all(users);
  const overallElapsedSec = (performance.now() - overallStart) / 1000;

  const sorted = [...latencies].sort((a, b) => a - b);
  const total = successCount + errorCount;
  const avg =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

  const summary = {
    timestamp: new Date().toISOString(),
    concurrency: CONCURRENCY,
    requestedDurationSec: DURATION_SEC,
    actualDurationSec: Number(overallElapsedSec.toFixed(2)),
    totalRequests: total,
    successCount,
    errorCount,
    requestsPerSecond: Number((total / overallElapsedSec).toFixed(2)),
    latencyMs: {
      min: sorted.length ? Number(sorted[0].toFixed(1)) : 0,
      avg: Number(avg.toFixed(1)),
      p50: Number(percentile(sorted, 50).toFixed(1)),
      p95: Number(percentile(sorted, 95).toFixed(1)),
      p99: Number(percentile(sorted, 99).toFixed(1)),
      max: sorted.length ? Number(sorted[sorted.length - 1].toFixed(1)) : 0,
    },
    sampleErrors: [...new Set(errors)].slice(0, 5),
  };

  console.log("===== LOAD TEST RESULTS =====");
  console.log(`Total requests:      ${summary.totalRequests}`);
  console.log(`Successful:          ${summary.successCount}`);
  console.log(`Errors:              ${summary.errorCount}`);
  console.log(`Requests/sec:        ${summary.requestsPerSecond}`);
  console.log(`Latency (ms) — min:  ${summary.latencyMs.min}`);
  console.log(`Latency (ms) — avg:  ${summary.latencyMs.avg}`);
  console.log(`Latency (ms) — p50:  ${summary.latencyMs.p50}`);
  console.log(`Latency (ms) — p95:  ${summary.latencyMs.p95}`);
  console.log(`Latency (ms) — p99:  ${summary.latencyMs.p99}`);
  console.log(`Latency (ms) — max:  ${summary.latencyMs.max}`);
  if (summary.sampleErrors.length > 0) {
    console.log("\nSample errors:");
    summary.sampleErrors.forEach((e) => console.log(`  - ${e}`));
  }

  const fs = require("fs");
  const outPath = `load-test-results-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nFull results saved to ${outPath}`);

  process.exit(errorCount > 0 ? 1 : 0);
}

main();