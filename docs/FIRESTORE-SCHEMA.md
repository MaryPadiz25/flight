# Firestore Data Model — Skyline Flight School Platform

This mirrors the shapes already used in `js/mock-data.js`, so switching
`js/data-service.js` from mock to live Firestore calls is a drop-in
change — no UI code needs to change.

## Collections (Phase 1)

### `users/{uid}`
One doc per authenticated person, keyed by Firebase Auth UID.
```
{
  role: "student" | "instructor" | "admin",
  name: string,
  email: string,
  phone: string,
  status: "active" | "inactive",
  balance: number,              // students only, dollars, negative = owing
  licenceGoal: string,          // students only
  rating: string,                // instructors only, e.g. "CFI, CFII"
  createdAt: Timestamp
}
```

### `aircraft/{aircraftId}`
```
{
  registration: string,          // e.g. "N172SK"
  type: string,                  // e.g. "Cessna 172"
  status: "available" | "maintenance" | "unavailable",
  hourlyRate: number,
  hoursSinceService: number,     // Phase 1.5: maintenance reminders
  createdAt: Timestamp
}
```

### `bookings/{bookingId}`
```
{
  date: "YYYY-MM-DD",
  start: "HH:mm",
  end: "HH:mm",
  studentId: string,             // ref to users/{uid}
  instructorId: string,          // ref to users/{uid}
  aircraftId: string,            // ref to aircraft/{id}
  lessonType: string,
  status: "requested" | "confirmed" | "completed" | "cancelled" | "weather_cancelled",
  notes: string,                 // instructor notes, visible to student once completed
  flightDuration: number,        // hours, set on completion
  trainingCompleted: string,     // set on completion
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `availability/{id}`  (Phase 1.5 — recurring availability)
```
{
  ownerType: "instructor" | "aircraft",
  ownerId: string,
  recurring: boolean,
  dayOfWeek: number,             // 0-6, used when recurring = true
  date: "YYYY-MM-DD",            // used when recurring = false (one-off block/open slot)
  start: "HH:mm",
  end: "HH:mm"
}
```

### `maintenanceBlocks/{id}`
```
{
  aircraftId: string,
  start: "YYYY-MM-DD",
  end: "YYYY-MM-DD",
  reason: string,
  createdBy: string               // admin uid
}
```

## Collections (Phase 2)

### `payments/{id}`
```
{
  studentId: string,
  bookingId: string,
  amount: number,
  method: "card" | "outstanding" | "cash",
  stripePaymentIntentId: string,
  receiptUrl: string,
  date: Timestamp
}
```

### `notifications/{id}`  (send log, triggered by Cloud Functions)
```
{
  toUid: string,
  type: "booking_confirmed" | "lesson_reminder" | "cancellation" | "instructor_changed",
  channel: "email" | "sms",
  bookingId: string,
  sentAt: Timestamp
}
```

## Indexes to create
- `bookings`: composite index on (`date` ASC, `status` ASC) — daily view
- `bookings`: composite index on (`instructorId` ASC, `date` ASC) — instructor schedule
- `bookings`: composite index on (`aircraftId` ASC, `date` ASC) — weekly filter
- `bookings`: composite index on (`studentId` ASC, `date` DESC) — student history

## Double-booking prevention
Booking writes should run inside a Firestore transaction: query existing
`bookings` for the same `aircraftId` OR `instructorId` on the same
`date` with overlapping `start`/`end`, and reject the write if a
non-cancelled conflict exists. The mock `createBooking()` in
`js/data-service.js` already implements this overlap check — port the
same logic into the transaction.
