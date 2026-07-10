import { renderShell, toast, statusLabel } from './app-shell.js';
import { requireRole } from './firebase-init.js';
import { getBookings, getAircraft, getStudents, addLessonNotes, updateBookingStatus, byId } from './data-service.js';

const session = requireRole('instructor');
const TODAY = '2026-07-13'; // demo "today" — aligns with seeded mock data

if (session){
  renderShell('instructor', 'instructor.html');
  document.getElementById('app-main').innerHTML = document.getElementById('tpl-main').innerHTML;
  boot();
}

async function boot(){
  document.getElementById('dateLabel').textContent = new Date(TODAY+'T00:00:00').toLocaleDateString(undefined,{ weekday:'long', month:'long', day:'numeric' });

  const [todayBookings, weekBookings, aircraft, students] = await Promise.all([
    getBookings({ date: TODAY, instructorId: session.uid }),
    getBookings({ weekStart:'2026-07-13', weekEnd:'2026-07-19', instructorId: session.uid }),
    getAircraft(), getStudents(),
  ]);

  document.getElementById('kpiToday').textContent = todayBookings.length;
  document.getElementById('kpiStudents').textContent = new Set(weekBookings.map(b=>b.studentId)).size;
  document.getElementById('kpiHours').textContent = weekBookings.filter(b=>b.status!=='cancelled').length * 1.25;
  document.getElementById('kpiDone').textContent = todayBookings.filter(b=>b.status==='completed').length;

  const list = document.getElementById('scheduleList');
  list.innerHTML = todayBookings.length ? todayBookings.map(b => {
    const ac = byId(aircraft, b.aircraftId), st = byId(students, b.studentId);
    return `<div class="day-strip status-${b.status}">
      <div class="time">${b.start}–${b.end}</div>
      <div class="who"><strong>${st ? st.name : '—'}</strong><span>${b.lessonType} · ${ac ? ac.registration+' ('+ac.type+')' : '—'}</span></div>
      <span class="badge badge-${b.status.replace('_','')}">${statusLabel(b.status)}</span>
      <div class="actions">
        ${b.status === 'confirmed' ? `<button class="btn btn-sm btn-dark" data-complete="${b.id}" data-ac="${ac?ac.registration:''}">Log & complete</button>` : ''}
        ${b.status === 'requested' ? `<button class="btn btn-sm btn-dark" data-confirm="${b.id}">Confirm</button>` : ''}
      </div>
    </div>`;
  }).join('') : `<div style="padding:30px; text-align:center; color:var(--ink-soft);">No lessons assigned to you today.</div>`;

  list.querySelectorAll('[data-confirm]').forEach(btn => btn.addEventListener('click', async () => {
    await updateBookingStatus(btn.dataset.confirm, 'confirmed'); toast('Booking confirmed.'); boot();
  }));
  list.querySelectorAll('[data-complete]').forEach(btn => btn.addEventListener('click', () => openNotes(btn.dataset.complete, btn.dataset.ac)));

  // Students table
  const byStudent = {};
  weekBookings.forEach(b => { (byStudent[b.studentId] ||= []).push(b); });
  document.getElementById('studentsBody').innerHTML = students.map(s => {
    const rows = byStudent[s.id];
    if (!rows) return '';
    const last = rows.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    return `<tr><td><strong>${s.name}</strong></td><td>${s.licenceGoal}</td><td>${rows.filter(r=>r.status==='completed').length}</td><td>${last.date} · ${last.lessonType}</td></tr>`;
  }).join('') || `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:24px;">No students this week.</td></tr>`;
}

const modal = document.getElementById('notesModal');
function openNotes(id, ac){
  document.getElementById('n-id').value = id;
  document.getElementById('n-aircraft').value = ac;
  modal.classList.add('open');
}
document.getElementById('closeNotes')?.addEventListener('click', () => modal.classList.remove('open'));
modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

document.getElementById('notesForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('n-id').value;
  await addLessonNotes(id, {
    notes: document.getElementById('n-notes').value,
    flightDuration: document.getElementById('n-duration').value,
    trainingCompleted: document.getElementById('n-training').value,
  });
  toast('Lesson logged and marked complete.');
  modal.classList.remove('open');
  boot();
});
