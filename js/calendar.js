import { getBookings, getAircraft, getInstructors, getStudents, getMaintenanceBlocks, byId } from './data-service.js';
import { statusLabel } from './app-shell.js';

const HOURS = Array.from({length:12}, (_,i) => i + 6); // 06:00–17:00

export function toISODate(d){ return d.toISOString().slice(0,10); }
export function startOfWeek(d){
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // week starts Monday
  date.setDate(date.getDate() + diff);
  return date;
}
export function addDays(d, n){ const nd = new Date(d); nd.setDate(nd.getDate()+n); return nd; }

// ---------------- DAILY VIEW ----------------
export async function renderDaily(container, dateStr, { onAction } = {}){
  const [bookings, aircraft, instructors, students] = await Promise.all([
    getBookings({ date: dateStr }), getAircraft(), getInstructors(), getStudents(),
  ]);

  if (!bookings.length){
    container.innerHTML = `<div class="card" style="padding:40px; text-align:center; color:var(--ink-soft);">No lessons scheduled for this day yet.</div>`;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const ac = byId(aircraft, b.aircraftId), ins = byId(instructors, b.instructorId), st = byId(students, b.studentId);
    return `
      <div class="day-strip status-${b.status}" data-id="${b.id}">
        <div class="time">${b.start}–${b.end}</div>
        <div class="who"><strong>${st ? st.name : '—'}</strong><span>${b.lessonType}</span></div>
        <div class="meta">
          <span>Aircraft: <b>${ac ? ac.registration : '—'}</b></span>
          <span>Instructor: <b>${ins ? ins.name : '—'}</b></span>
        </div>
        <span class="badge badge-${b.status.replace('_','')}">${statusLabel(b.status)}</span>
        <div class="actions">
          ${b.status === 'requested' ? `<button class="btn btn-sm btn-dark" data-act="confirm" data-id="${b.id}">Confirm</button>` : ''}
          ${(b.status === 'requested' || b.status === 'confirmed') ? `<button class="btn btn-sm btn-ghost" data-act="weather" data-id="${b.id}">Weather cancel</button>` : ''}
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => onAction && onAction(btn.dataset.act, btn.dataset.id));
  });
}

// ---------------- WEEKLY VIEW ----------------
export async function renderWeekly(container, weekStartDate, { aircraftId, instructorId, studentId, onBlockClick } = {}){
  const weekStart = toISODate(weekStartDate);
  const weekEnd = toISODate(addDays(weekStartDate, 6));
  const [bookings, aircraft, instructors, students, maint] = await Promise.all([
    getBookings({ weekStart, weekEnd, aircraftId, instructorId, studentId }),
    getAircraft(), getInstructors(), getStudents(), getMaintenanceBlocks(),
  ]);

  const days = Array.from({length:7}, (_,i) => addDays(weekStartDate, i));

  let html = `<div class="week-grid">`;
  html += `<div class="head-cell"></div>`;
  days.forEach(d => {
    html += `<div class="head-cell">${d.toLocaleDateString(undefined,{weekday:'short'})}<strong>${d.getDate()}</strong></div>`;
  });

  HOURS.forEach(hour => {
    html += `<div class="time-cell">${String(hour).padStart(2,'0')}:00</div>`;
    days.forEach(d => {
      const iso = toISODate(d);
      const hits = bookings.filter(b => parseInt(b.start) === hour);
      const dayHits = hits.filter(b => b.date === iso);
      const maintHits = maint.filter(m => iso >= m.start && iso <= m.end && hour === HOURS[0]);
      html += `<div class="day-cell">`;
      dayHits.forEach(b => {
        const ac = byId(aircraft, b.aircraftId), ins = byId(instructors, b.instructorId), st = byId(students, b.studentId);
        html += `<div class="week-block status-${b.status}" data-id="${b.id}" title="${statusLabel(b.status)}">
          <b>${b.start}</b>${st ? st.name.split(' ')[0] : ''} · ${ac ? ac.registration : ''}
        </div>`;
      });
      if (maintHits.length){
        maintHits.forEach(m => {
          const ac = byId(aircraft, m.aircraftId);
          html += `<div class="week-block maint">🔧 ${ac ? ac.registration : ''} maintenance</div>`;
        });
      }
      html += `</div>`;
    });
  });
  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll('.week-block[data-id]').forEach(el => {
    el.addEventListener('click', () => onBlockClick && onBlockClick(el.dataset.id));
  });
}
