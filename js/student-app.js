import { renderShell, toast, fmtDate, fmtMoney, statusLabel } from './app-shell.js';
import { requireRole } from './firebase-init.js';
import { getBookings, getAircraft, getInstructors, createBooking, byId, MockData } from './data-service.js';

const session = requireRole('student');
if (session){
  renderShell('student', 'student.html');
  document.getElementById('app-main').innerHTML = document.getElementById('tpl-main').innerHTML;
  boot();
}

async function boot(){
  document.getElementById('studentName').textContent = session.name.split(' ')[0];

  const student = byId(await import('./mock-data.js').then(m => m.STUDENTS), session.uid) || { balance: 0, licenceGoal:'Private Pilot' };

  const [allBookings, aircraft, instructors] = await Promise.all([
    getBookings({ studentId: session.uid }), getAircraft(), getInstructors(),
  ]);

  const today = '2026-07-10';
  const upcoming = allBookings.filter(b => b.date >= today && !['cancelled','weather_cancelled'].includes(b.status));
  const past = allBookings.filter(b => b.date < today || b.status === 'completed');

  document.getElementById('kpiUpcoming').textContent = upcoming.length;
  document.getElementById('kpiHours').textContent = past.filter(b=>b.status==='completed').length * 1.25;
  document.getElementById('kpiBalance').textContent = fmtMoney(student.balance);
  document.getElementById('kpiBalance').style.color = student.balance < 0 ? 'var(--cancelled)' : 'var(--confirmed)';

  // Upcoming list
  const upcomingList = document.getElementById('upcomingList');
  upcomingList.innerHTML = upcoming.length ? upcoming.map(b => rowHtml(b, aircraft, instructors, true)).join('')
    : `<div style="padding:30px; text-align:center; color:var(--ink-soft);">No upcoming lessons. <a href="#" id="quickBook" style="color:var(--beacon-deep); font-weight:600;">Book one now</a>.</div>`;
  const qb = document.getElementById('quickBook');
  if (qb) qb.addEventListener('click', (e) => { e.preventDefault(); openModal(); });

  upcomingList.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { updateBookingStatus } = await import('./data-service.js');
      await updateBookingStatus(btn.dataset.cancel, 'cancelled');
      toast('Cancellation request sent.');
      boot();
    });
  });

  // Account block
  document.getElementById('accountBlock').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid var(--cloud);">
      <div><strong>Current balance</strong><div style="font-size:12.5px; color:var(--ink-soft);">${student.balance < 0 ? 'Amount due' : 'Credit on file'}</div></div>
      <div style="font-family:var(--font-mono); font-size:20px; color:${student.balance<0?'var(--cancelled)':'var(--confirmed)'};">${fmtMoney(student.balance)}</div>
    </div>
    <p style="font-size:13px; color:var(--ink-soft); padding-top:12px;">Online payments (Stripe) and downloadable receipts arrive in Phase 2 of the platform build.</p>
  `;

  // History
  document.getElementById('historyBody').innerHTML = past.map(b => {
    const ac = byId(aircraft, b.aircraftId), ins = byId(instructors, b.instructorId);
    return `<tr>
      <td>${fmtDate(b.date)}</td>
      <td>${b.lessonType}</td>
      <td>${ins ? ins.name : '—'}</td>
      <td class="mono">${ac ? ac.registration : '—'}</td>
      <td style="max-width:280px; color:var(--ink-soft);">${b.notes || '—'}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:24px;">No completed lessons yet.</td></tr>`;

  // Populate booking form selects
  const insSel = document.getElementById('f-instructor');
  insSel.innerHTML = instructors.map(i => `<option value="${i.id}">${i.name} (${i.rating})</option>`).join('');
  const acSel = document.getElementById('f-aircraft');
  acSel.innerHTML = aircraft.filter(a => a.status === 'available').map(a => `<option value="${a.id}">${a.registration} — ${a.type}</option>`).join('');
}

function rowHtml(b, aircraft, instructors, showCancel){
  const ac = byId(aircraft, b.aircraftId), ins = byId(instructors, b.instructorId);
  return `<div class="day-strip status-${b.status}">
    <div class="time">${fmtDate(b.date)}<br><span style="font-size:11.5px; color:var(--ink-soft);">${b.start}–${b.end}</span></div>
    <div class="who"><strong>${b.lessonType}</strong><span>with ${ins ? ins.name : '—'} · ${ac ? ac.registration : '—'}</span></div>
    <span class="badge badge-${b.status.replace('_','')}">${statusLabel(b.status)}</span>
    ${showCancel ? `<div class="actions"><button class="btn btn-sm btn-ghost" data-cancel="${b.id}">Request cancel</button></div>` : ''}
  </div>`;
}

// ---- Modal ----
const modal = document.getElementById('bookModal');
function openModal(){ modal.classList.add('open'); }
function closeModal(){ modal.classList.remove('open'); }
document.getElementById('openBookBtn')?.addEventListener('click', openModal);
document.getElementById('closeBook')?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('bookForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('f-date').value;
  const start = document.getElementById('f-start').value;
  if (!date){ toast('Pick a date first.'); return; }
  const [h,m] = start.split(':').map(Number);
  const end = `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  const res = await createBooking({
    date, start, end,
    lessonType: document.getElementById('f-lesson').value,
    instructorId: document.getElementById('f-instructor').value,
    aircraftId: document.getElementById('f-aircraft').value,
    studentId: session.uid,
  });

  if (!res.ok){ toast(res.error); return; }
  toast('Lesson requested — you\'ll be notified once confirmed.');
  closeModal();
  boot();
});
