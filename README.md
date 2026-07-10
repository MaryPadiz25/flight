# Skyline Flight School — Booking Platform (Phase 1 MVP)

A booking and management platform for a small flight school: student
self-service booking, instructor daily scheduling, and an admin
operations dashboard with daily/weekly calendars, aircraft and
instructor management.

This build runs in **demo mode** out of the box — no Firebase project
required to preview it. It's structured so wiring up real Firebase
Auth + Firestore is a matter of filling in the `TODO(firebase)` blocks,
not a rewrite.

## What's included (Phase 1)

- **Marketing homepage** (`index.html`) — SEO metadata, semantic
  structure, schema.org `FlightSchool` markup, custom SVG illustrations
  (no stock imagery / licensing risk).
- **Auth screens** — `login.html` (role-aware), `signup.html` (student
  self sign-up).
- **Student portal** (`app/student.html`) — upcoming bookings, book a
  lesson (with live conflict checking), lesson history + instructor
  notes, account balance.
- **Instructor portal** (`app/instructor.html`) — today's flight strips,
  confirm bookings, log lesson notes / flight duration / training
  completed, student roster.
- **Admin dashboard** (`app/admin.html`) — KPIs, **daily calendar**,
  **weekly calendar** (filterable by aircraft/instructor, shows
  maintenance blocks), aircraft CRUD, instructor CRUD, student list,
  reports snapshot (bookings by status, instructor workload, aircraft
  utilisation).
- **Booking engine** (`js/data-service.js`) — double-booking prevention,
  status transitions (`requested → confirmed → completed`, plus
  `cancelled` / `weather_cancelled`).
- **Firestore schema + security rules** — `docs/FIRESTORE-SCHEMA.md`,
  `docs/firestore.rules`.

## Not yet wired (by design — Phase 2, per your roadmap)

- Stripe payments, receipts
- Email/SMS notifications (booking confirmation, reminders, cancellations,
  instructor changes)
- Full reporting/export
- Digital training records

The UI already has placeholders and `TODO(firebase)` markers for all of
these so Phase 2 slots in without restructuring Phase 1.

## Run it locally (demo mode)

No build step. Serve the folder statically, e.g.:

```bash
npx serve .
# or
python3 -m http.server 5173
```

Open `index.html`. Log in as any role from `login.html` — demo mode
accepts any email/password and logs you in as the selected role using
seeded sample data (`js/mock-data.js`).

## Going live with Firebase

1. **Create a Firebase project** → enable **Authentication** (Email/Password)
   and **Cloud Firestore**.
2. In `js/firebase-init.js`:
   - Paste your web app config into `firebaseConfig`.
   - Set `DEMO_MODE = false`.
   - Uncomment the SDK import block.
3. In `js/data-service.js`, replace each function body with the
   Firestore call sketched in its `TODO(firebase)` comment (the
   function signatures and return shapes are already correct — the
   UI never needs to change).
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (rules live in `docs/firestore.rules` — copy to `firestore.rules` at
   your project root first)
5. Create the composite indexes listed at the bottom of
   `docs/FIRESTORE-SCHEMA.md` (Firebase will also prompt you with a
   direct link the first time each query runs).
6. Host it: `firebase deploy --only hosting` (or any static host —
   there's no server-side rendering).

## SEO notes

- `index.html` has a unique title, meta description, canonical URL,
  Open Graph tags, and `FlightSchool` JSON-LD structured data — update
  the placeholder address/phone in the `<script type="application/ld+json">`
  block with your real details.
- App/auth pages are marked `noindex` since they're behind login and
  shouldn't appear in search results.
- Next steps for ranking: submit a sitemap + `robots.txt`, add a real
  Google Business Profile, and get the school listed on aviation
  directories linking back to the homepage.

## Suggested build order from here

1. Wire Firebase Auth + Firestore per above; migrate seeded mock data
   into real documents for your actual aircraft/instructors.
2. Add recurring instructor/aircraft availability (schema already
   defined in `docs/FIRESTORE-SCHEMA.md` under `availability`).
3. Phase 2: Stripe Checkout for payments, Cloud Functions + a transactional
   email provider (e.g. Resend/SendGrid) + Twilio for SMS reminders.
4. Phase 2: CASA/training-record fields on the `bookings` completion
   form (already has `flightDuration` / `trainingCompleted` to extend).
