// tests/auth.setup.js
import { test as setup } from "@playwright/test";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import fs from "fs";
import path from "path";

const TEST_ADMIN_EMAIL = "reddyakshay3002@gmail.com";
const TEST_ADMIN_PASSWORD = "Qwerty@123";

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "cif-admin-panel.firebaseapp.com",
  projectId: "cif-admin-panel",
};

const app = initializeApp(firebaseConfig, "setup-app");
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
connectFirestoreEmulator(db, "127.0.0.1", 8080);

async function ensureTestAdminSeed() {
  let user;

  try {
    const result = await signInWithEmailAndPassword(
      auth,
      TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD
    );
    user = result.user;
  } catch (error) {
    if (
      error?.code !== "auth/user-not-found" &&
      error?.code !== "auth/invalid-credential" &&
      error?.code !== "auth/wrong-password"
    ) {
      throw error;
    }

    const result = await createUserWithEmailAndPassword(
      auth,
      TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD
    );
    user = result.user;
  }

  await setDoc(
    doc(db, "admins", user.uid),
    {
      email: TEST_ADMIN_EMAIL.toLowerCase(),
      role: "admin",
      lastLogin: serverTimestamp(),
    },
    { merge: true }
  );
}

setup("authenticate as admin", async ({ page }, testInfo) => {
  await ensureTestAdminSeed();

  const dir = path.resolve("tests/.auth");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // ✅ Capture browser console logs and failed requests to diagnose login blocks
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    console.log(`[Browser Uncaught Exception]: ${err.message}`);
  });

  const baseURL = testInfo.project.use.baseURL || "http://localhost:5173";
  const loginUrl = `${baseURL}/login`;

  await page.context().clearCookies();
  await page.goto(loginUrl, { waitUntil: "networkidle" });

  const emailInput = page.locator("#admin-email, input[type='email']").or(page.getByLabel("Email")).first();
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill(TEST_ADMIN_EMAIL);

  const passwordInput = page.locator("#admin-password, input[type='password']").first();
  await passwordInput.fill(TEST_ADMIN_PASSWORD);

  const submitBtn = page.locator("button[type='submit']").or(page.getByRole("button", { name: /sign in|login|submit/i })).first();
  
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
  } else {
    await passwordInput.press("Enter");
  }

  try {
    // Wait for URL transition to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
  } catch (err) {
    console.error("--- LOGIN STUCK DIAGNOSTIC ---");
    console.error("Current URL:", page.url());
    console.error("Page HTML Content:", await page.content());
    throw err;
  }

  await page.context().storageState({ path: "tests/.auth/user.json" });
});