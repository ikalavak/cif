# CIF Admin Panel (CRM)

A standalone admin web app for managing the Creative Industries Festival — events, venues, categories, speakers, gallery, sponsors, announcements, and an admin user roster. Backed by Firebase, kept separate from the main mobile app repo.

## Stack
- Vite + React + React Router
- Firebase (Auth + Firestore)
- Plain CSS (no UI framework)

## How the "live updates" work

Every list in this app (`src/components/CollectionManager.jsx`, `src/pages/Dashboard.jsx`) uses Firestore's `onSnapshot` listener instead of a one-off fetch. That means:

- The moment anyone (you, your manager, a teammate) saves a change in the admin panel, it writes to Firestore.
- Firestore immediately pushes that change to every connected client subscribed to that same data.
- If your mobile app or website **also** subscribes with `onSnapshot` (instead of fetching once on load), changes will appear there instantly too — no refresh, no polling, no manual sync step.

**Action needed on your mobile app / website side:** wherever it currently reads events/announcements/etc. from Firestore, make sure it uses `onSnapshot` rather than `getDocs`. If it's currently doing a one-time fetch, it'll still work — it just won't update live until you switch it to a listener. Happy to help wire that up in the Expo app or Vite site once this is confirmed.

## 1. Firebase setup

1. Open the same Firebase project your mobile app uses (console.firebase.google.com).
2. **Authentication → Sign-in method** → enable Email/Password.
3. **Authentication → Users** → manually add an account per admin (yourself, your manager, teammates).
4. **Firestore Database** → create the database if it doesn't exist yet.
5. **Firestore → Rules** → paste in the contents of `firestore.rules` from this repo → Publish.

Collections (`events`, `venues`, `categories`, `speakers`, `gallery`, `sponsors`, `announcements`, `admin_users`) are created automatically the first time you save something in each section — nothing to set up manually.

## 2. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase config (Project settings → Your apps → Web app → the `firebaseConfig` values).

```bash
npm run dev
```

Runs at `http://localhost:5174`.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: full CIF admin CRM"
git branch -M main
git remote add origin https://github.com/<your-username>/cif-admin-panel.git
git push -u origin main
```

## What's included

- **Dashboard** — live stat cards, upcoming events, quick action shortcuts
- **Events** — full CRUD: title, category, venue, date, status, published/featured toggles
- **Venues** — name, address, capacity
- **Categories** — name, colour tag
- **Speakers** — name, role, photo URL, bio
- **Gallery** — image URL, caption
- **Sponsors** — name, logo URL, tier
- **Announcements** — title, body, published toggle
- **Users** — internal roster of admin panel users/roles (see note on the page itself — actual login access is still managed in the Firebase console, since listing real Auth accounts requires a server-side Admin SDK)

## Notes / next steps

- Access control is currently "any signed-in user can manage everything." If you want tiered permissions later (e.g. Editors can't delete), that needs either Firebase custom claims or a role check tied to the `admin_users` roster — the rules file has a comment showing roughly where that logic would go.
- Image/logo fields are plain URL text inputs for now (no upload widget). Adding real file uploads would mean wiring in Firebase Storage — worth doing once you're past the prototype stage.
