// ============================================================
// DATA SERVICE — the ONLY file the rest of the app talks to for data.
//
// Right now MODE = 'mock', so every function reads/writes the in-memory
// arrays in mock-data.js. Once a Firebase project is wired up (see
// js/firebase-init.js and docs/FIRESTORE-SCHEMA.md), flip MODE to
// 'firebase' and fill in the marked TODOs — every screen (calendar,
// admin, student, instructor) keeps working unchanged because they
// only ever call these exported functions.
// ============================================================

import * as M from './mock-data.js';

export const MODE = 'mock'; // 'mock' | 'firebase'

// ---- Reads ----
export async function getAircraft(){ return structuredClone(M.AIRCRAFT); }
export async function getInstructors(){ return structuredClone(M.INSTRUCTORS); }
export async function getStudents(){ return structuredClone(M.STUDENTS); }
export async function getMaintenanceBlocks(){ return structuredClone(M.MAINTENANCE_BLOCKS); }
export async function getPayments(){ return structuredClone(M.PAYMENTS); }

export async function getBookings({ date, weekStart, weekEnd, studentId, instructorId, aircraftId } = {}){
  // TODO(firebase): replace with a Firestore query against the `bookings`
  // collection, e.g.:
  //   let q = query(collection(db,'bookings'));
  //   if (date) q = query(q, where('date','==',date));
  //   if (weekStart && weekEnd) q = query(q, where('date','>=',weekStart), where('date','<=',weekEnd));
  //   const snap = await getDocs(q); return snap.docs.map(d => ({id:d.id, ...d.data()}));
  let rows = structuredClone(M.BOOKINGS);
  if (date) rows = rows.filter(b => b.date === date);
  if (weekStart && weekEnd) rows = rows.filter(b => b.date >= weekStart && b.date <= weekEnd);
  if (studentId) rows = rows.filter(b => b.studentId === studentId);
  if (instructorId) rows = rows.filter(b => b.instructorId === instructorId);
  if (aircraftId) rows = rows.filter(b => b.aircraftId === aircraftId);
  return rows.sort((a,b) => (a.date+a.start).localeCompare(b.date+b.start));
}

// ---- Writes ----
// Every write below is a same-shape stand-in for a Firestore
// addDoc/updateDoc/deleteDoc call. They mutate the in-memory mock
// arrays so the demo UI reflects changes immediately.

export async function createBooking(booking){
  // TODO(firebase): check for aircraft/instructor overlap with a
  // transaction before writing, then addDoc(collection(db,'bookings'), booking)
  const conflict = M.BOOKINGS.find(b =>
    b.date === booking.date && b.status !== 'cancelled' && b.status !== 'weather_cancelled' &&
    (b.aircraftId === booking.aircraftId || b.instructorId === booking.instructorId) &&
    overlaps(b.start, b.end, booking.start, booking.end)
  );
  if (conflict) return { ok:false, error:'That aircraft or instructor is already booked in that window.' };
  const id = 'bk' + (M.BOOKINGS.length + 1) + Math.floor(Math.random()*1000);
  const record = { id, status:'requested', notes:'', ...booking };
  M.BOOKINGS.push(record);
  return { ok:true, booking: record };
}

export async function updateBookingStatus(id, status){
  const b = M.BOOKINGS.find(x => x.id === id);
  if (!b) return { ok:false, error:'Booking not found' };
  b.status = status;
  return { ok:true };
}

export async function addLessonNotes(id, { notes, flightDuration, trainingCompleted }){
  const b = M.BOOKINGS.find(x => x.id === id);
  if (!b) return { ok:false, error:'Booking not found' };
  b.notes = notes ?? b.notes;
  b.flightDuration = flightDuration ?? b.flightDuration;
  b.trainingCompleted = trainingCompleted ?? b.trainingCompleted;
  b.status = 'completed';
  return { ok:true };
}

export async function setAircraftStatus(id, status){
  const a = M.AIRCRAFT.find(x => x.id === id);
  if (!a) return { ok:false };
  a.status = status;
  return { ok:true };
}

export async function upsertAircraft(aircraft){
  if (aircraft.id){
    Object.assign(M.AIRCRAFT.find(a => a.id === aircraft.id), aircraft);
  } else {
    aircraft.id = 'ac' + (M.AIRCRAFT.length + 1);
    aircraft.status = aircraft.status || 'available';
    M.AIRCRAFT.push(aircraft);
  }
  return { ok:true };
}

export async function removeAircraft(id){
  const i = M.AIRCRAFT.findIndex(a => a.id === id);
  if (i > -1) M.AIRCRAFT.splice(i,1);
  return { ok:true };
}

export async function upsertInstructor(instructor){
  if (instructor.id){
    Object.assign(M.INSTRUCTORS.find(x => x.id === instructor.id), instructor);
  } else {
    instructor.id = 'in' + (M.INSTRUCTORS.length + 1);
    instructor.color = instructor.color || '#4C6FE0';
    M.INSTRUCTORS.push(instructor);
  }
  return { ok:true };
}

export async function removeInstructor(id){
  const i = M.INSTRUCTORS.findIndex(x => x.id === id);
  if (i > -1) M.INSTRUCTORS.splice(i,1);
  return { ok:true };
}

function overlaps(aStart,aEnd,bStart,bEnd){ return aStart < bEnd && bStart < aEnd; }

export { byId } from './mock-data.js';
export * as MockData from './mock-data.js';
