// ============================================================
// MOCK DATA — shaped 1:1 with the Firestore schema (see docs/FIRESTORE-SCHEMA.md)
// Swap the functions in js/data-service.js from "mock" to "firebase"
// mode once a real Firebase project is connected — the rest of the
// app (calendar.js, admin-app.js, student-app.js, instructor-app.js)
// never touches this file directly.
// ============================================================

export const AIRCRAFT = [
  { id: 'ac1', registration: 'N172SK', type: 'Cessna 172', status: 'available', hourlyRate: 185, hoursSinceService: 42 },
  { id: 'ac2', registration: 'N44DT',  type: 'Diamond DA40', status: 'available', hourlyRate: 210, hoursSinceService: 18 },
  { id: 'ac3', registration: 'N88PA',  type: 'Piper PA-28', status: 'maintenance', hourlyRate: 175, hoursSinceService: 0 },
  { id: 'ac4', registration: 'N21CT',  type: 'Cessna 172', status: 'unavailable', hourlyRate: 185, hoursSinceService: 96 },
];

export const INSTRUCTORS = [
  { id: 'in1', name: 'Daniel Ortiz', rating: 'CFI, CFII', color: '#4C6FE0' },
  { id: 'in2', name: 'Sarah Whitfield', rating: 'CFI', color: '#2E8B74' },
  { id: 'in3', name: 'Marcus Chen', rating: 'CFI, MEI', color: '#E8A33D' },
];

export const STUDENTS = [
  { id: 'st1', name: 'Maya Reyes', email: 'maya@example.com', phone: '555-0101', balance: 240.00, licenceGoal: 'Private Pilot' },
  { id: 'st2', name: 'Jordan Lee', email: 'jordan@example.com', phone: '555-0102', balance: -85.00, licenceGoal: 'Recreational Pilot' },
  { id: 'st3', name: 'Priya Shah', email: 'priya@example.com', phone: '555-0103', balance: 0.00, licenceGoal: 'Private Pilot' },
  { id: 'st4', name: 'Alex Kim', email: 'alex@example.com', phone: '555-0104', balance: 120.00, licenceGoal: 'Instrument Rating' },
];

// status ∈ requested | confirmed | completed | cancelled | weather_cancelled
export const BOOKINGS = [
  { id: 'bk1', date: '2026-07-13', start: '07:30', end: '09:00', aircraftId: 'ac1', instructorId: 'in1', studentId: 'st1', lessonType: 'Circuits & Landings', status: 'confirmed', notes: '' },
  { id: 'bk2', date: '2026-07-13', start: '09:00', end: '10:30', aircraftId: 'ac2', instructorId: 'in2', studentId: 'st2', lessonType: 'Navigation', status: 'requested', notes: '' },
  { id: 'bk3', date: '2026-07-13', start: '10:30', end: '12:00', aircraftId: 'ac1', instructorId: 'in1', studentId: 'st3', lessonType: 'Pre-Solo Review', status: 'completed', notes: 'Great progress on flare timing. Ready for solo next lesson.' },
  { id: 'bk4', date: '2026-07-13', start: '12:00', end: '13:30', aircraftId: 'ac4', instructorId: 'in3', studentId: 'st4', lessonType: 'Instrument Approach', status: 'weather_cancelled', notes: 'Low ceiling, rescheduled to Thursday.' },
  { id: 'bk5', date: '2026-07-13', start: '13:30', end: '15:00', aircraftId: 'ac2', instructorId: 'in2', studentId: 'st1', lessonType: 'Cross-Country Prep', status: 'confirmed', notes: '' },
  { id: 'bk6', date: '2026-07-14', start: '08:00', end: '09:30', aircraftId: 'ac1', instructorId: 'in1', studentId: 'st2', lessonType: 'Circuits & Landings', status: 'confirmed', notes: '' },
  { id: 'bk7', date: '2026-07-14', start: '10:00', end: '11:30', aircraftId: 'ac2', instructorId: 'in3', studentId: 'st4', lessonType: 'Instrument Approach', status: 'confirmed', notes: '' },
  { id: 'bk8', date: '2026-07-15', start: '07:30', end: '09:00', aircraftId: 'ac1', instructorId: 'in2', studentId: 'st3', lessonType: 'Solo Consolidation', status: 'confirmed', notes: '' },
  { id: 'bk9', date: '2026-07-15', start: '14:00', end: '15:30', aircraftId: 'ac2', instructorId: 'in1', studentId: 'st1', lessonType: 'Navigation', status: 'cancelled', notes: 'Student requested reschedule.' },
  { id: 'bk10', date: '2026-07-16', start: '09:00', end: '10:30', aircraftId: 'ac1', instructorId: 'in3', studentId: 'st2', lessonType: 'Circuits & Landings', status: 'requested', notes: '' },
  { id: 'bk11', date: '2026-07-17', start: '08:00', end: '09:30', aircraftId: 'ac2', instructorId: 'in2', studentId: 'st4', lessonType: 'Instrument Approach', status: 'confirmed', notes: '' },
];

export const MAINTENANCE_BLOCKS = [
  { id: 'mb1', aircraftId: 'ac3', start: '2026-07-12', end: '2026-07-16', reason: '100-hour inspection' },
];

export const PAYMENTS = [
  { id: 'pay1', studentId: 'st1', amount: 185.00, date: '2026-07-06', method: 'card', bookingId: 'bk3' },
  { id: 'pay2', studentId: 'st3', amount: 210.00, date: '2026-07-05', method: 'card', bookingId: 'bk8' },
  { id: 'pay3', studentId: 'st2', amount: -85.00, date: '2026-07-08', method: 'outstanding', bookingId: 'bk6' },
];

export const CURRENT_USER = {
  // demo helper — the real app derives this from Firebase Auth + the users/{uid} doc
  student:    { uid: 'st1', role: 'student',    name: 'Maya Reyes' },
  instructor: { uid: 'in1', role: 'instructor', name: 'Daniel Ortiz' },
  admin:      { uid: 'ad1', role: 'admin',      name: 'Priya Shah (Admin)' },
};

export function byId(list, id){ return list.find(x => x.id === id); }
