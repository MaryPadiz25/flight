import { renderShell, toast, fmtMoney } from './app-shell.js';
import { requireRole } from './firebase-init.js';
import { renderDaily, renderWeekly, startOfWeek, addDays, toISODate } from './calendar.js';
import { getAircraft, getInstructors, getStudents, getBookings, getPayments,
         updateBookingStatus, upsertAircraft, removeAircraft, upsertInstructor, byId } from './data-service.js';

const session = requireRole('admin');
let dayCursor = new Date('2026-07-13T00:00:00');
let weekCursor = startOfWeek(new Date('2026-07-13T00:00:00'));

if (session){
  renderShell('admin', 'admin.html');
  document.getElementById('app-main').innerHTML = document.getElementById('tpl-main').innerHTML;
  boot();
  wireDaily();
  wireWeekly();
  wireModals();
}

async function boot(){
  await Promise.all([renderKpis(), renderDay(), renderWeek(), renderAircraftTable(), renderInstructorsTable(), renderStudentsTable(), renderReports()]);
  populateFilters();
}

async function renderKpis(){
  const [today, weekBookings, students, payments, aircraft] = await Promise.all([
    getBookings({ date: '2026-07-13' }),
    getBookings({ weekStart: '2026-07-13', weekEnd: '2026-07-19' }),
    getStudents(), getPayments(), getAircraft(),
  ]);
  document.getElementById('kpiFlights').textContent = today.length;
  document.getElementById('kpiStudents').textContent = students.length;
  const revenue = payments.filter(p => p.amount > 0).reduce((a,b)=>a+b.amount,0);
  document.getElementById('kpiRevenue').textContent = fmtMoney(revenue);
  const activeAircraft = aircraft.filter(a=>a.status!=='unavailable').length || 1;
  const utilHours = weekBookings.filter(b=>b.status!=='cancelled'&&b.status!=='weather_cancelled').length * 1.25;
  const capacity = activeAircraft * 12 * 7 / 24; // rough demo capacity figure
  document.getElementById('kpiUtil').textContent = Math.min(99, Math.round((utilHours / (activeAircraft*40)) * 100)) + '%';
}

// ---- Daily ----
function dayLabel(){ return dayCursor.toLocaleDateString(undefined,{ weekday:'long', month:'short', day:'numeric' }); }
async function renderDay(){
  document.getElementById('dayLabel').textContent = dayLabel();
  await renderDaily(document.getElementById('dailyList'), toISODate(dayCursor), {
    onAction: async (act, id) => {
      if (act === 'confirm') await updateBookingStatus(id, 'confirmed');
      if (act === 'weather') await updateBookingStatus(id, 'weather_cancelled');
      toast(act === 'confirm' ? 'Booking confirmed.' : 'Marked weather cancelled.');
      renderDay(); renderWeek(); renderKpis();
    }
  });
}
function wireDaily(){
  document.getElementById('dayPrev').addEventListener('click', () => { dayCursor = addDays(dayCursor,-1); renderDay(); });
  document.getElementById('dayNext').addEventListener('click', () => { dayCursor = addDays(dayCursor, 1); renderDay(); });
}

// ---- Weekly ----
function weekLabel(){
  const end = addDays(weekCursor, 6);
  return `${weekCursor.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${end.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
}
async function renderWeek(){
  document.getElementById('weekLabel').textContent = weekLabel();
  const aircraftId = document.getElementById('filterAircraft').value || undefined;
  const instructorId = document.getElementById('filterInstructor').value || undefined;
  await renderWeekly(document.getElementById('weeklyGrid'), weekCursor, {
    aircraftId, instructorId,
    onBlockClick: (id) => toast('Booking ' + id + ' — open detail view in a future iteration.'),
  });
}
function wireWeekly(){
  document.getElementById('weekPrev').addEventListener('click', () => { weekCursor = addDays(weekCursor,-7); renderWeek(); });
  document.getElementById('weekNext').addEventListener('click', () => { weekCursor = addDays(weekCursor, 7); renderWeek(); });
  document.getElementById('filterAircraft').addEventListener('change', renderWeek);
  document.getElementById('filterInstructor').addEventListener('change', renderWeek);
}
async function populateFilters(){
  const [aircraft, instructors] = await Promise.all([getAircraft(), getInstructors()]);
  document.getElementById('filterAircraft').innerHTML = '<option value="">All aircraft</option>' + aircraft.map(a=>`<option value="${a.id}">${a.registration}</option>`).join('');
  document.getElementById('filterInstructor').innerHTML = '<option value="">All instructors</option>' + instructors.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
}

// ---- Aircraft table ----
async function renderAircraftTable(){
  const aircraft = await getAircraft();
  document.getElementById('aircraftBody').innerHTML = aircraft.map(a => `
    <tr>
      <td class="mono"><strong>${a.registration}</strong></td>
      <td>${a.type}</td>
      <td class="mono">$${a.hourlyRate}/hr</td>
      <td><span class="pill-status"><span class="dot ${a.status}"></span>${label(a.status)}</span></td>
      <td style="text-align:right;">
        <button class="btn btn-sm btn-ghost" data-edit-ac="${a.id}">Edit</button>
        <button class="btn btn-sm btn-ghost" data-del-ac="${a.id}">Remove</button>
      </td>
    </tr>`).join('');

  document.getElementById('aircraftBody').querySelectorAll('[data-edit-ac]').forEach(b => b.addEventListener('click', () => openAircraftModal(b.dataset.editAc)));
  document.getElementById('aircraftBody').querySelectorAll('[data-del-ac]').forEach(b => b.addEventListener('click', async () => {
    await removeAircraft(b.dataset.delAc); toast('Aircraft removed.'); renderAircraftTable(); populateFilters();
  }));
}
function label(s){ return { available:'Available', maintenance:'Maintenance', unavailable:'Unavailable' }[s]; }

async function openAircraftModal(id){
  document.getElementById('aircraftModalTitle').textContent = id ? 'Edit aircraft' : 'Add aircraft';
  document.getElementById('ac-id').value = id || '';
  if (id){
    const a = byId(await getAircraft(), id);
    document.getElementById('ac-reg').value = a.registration;
    document.getElementById('ac-type').value = a.type;
    document.getElementById('ac-rate').value = a.hourlyRate;
    document.getElementById('ac-status').value = a.status;
  } else {
    document.getElementById('aircraftForm').reset();
    document.getElementById('ac-rate').value = 185;
  }
  document.getElementById('aircraftModal').classList.add('open');
}

// ---- Instructors table ----
async function renderInstructorsTable(){
  const [instructors, weekBookings] = await Promise.all([getInstructors(), getBookings({ weekStart:'2026-07-13', weekEnd:'2026-07-19' })]);
  document.getElementById('instructorsBody').innerHTML = instructors.map(i => {
    const count = weekBookings.filter(b => b.instructorId === i.id && b.status !== 'cancelled').length;
    return `<tr><td><strong>${i.name}</strong></td><td>${i.rating}</td><td>${count} lessons</td></tr>`;
  }).join('');
}

// ---- Students table ----
async function renderStudentsTable(){
  const students = await getStudents();
  document.getElementById('studentsBody').innerHTML = students.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.email}<br><span style="color:var(--ink-soft); font-size:12.5px;">${s.phone}</span></td>
      <td>${s.licenceGoal}</td>
      <td style="color:${s.balance<0?'var(--cancelled)':'var(--confirmed)'}; font-family:var(--font-mono);">${fmtMoney(s.balance)}</td>
    </tr>`).join('');
}

// ---- Reports ----
async function renderReports(){
  const [weekBookings, instructors, aircraft] = await Promise.all([
    getBookings({ weekStart:'2026-07-13', weekEnd:'2026-07-19' }), getInstructors(), getAircraft(),
  ]);
  const byStatus = {};
  weekBookings.forEach(b => byStatus[b.status] = (byStatus[b.status]||0)+1);
  document.getElementById('reportStatus').innerHTML = Object.entries(byStatus).map(([k,v]) => `<div style="display:flex; justify-content:space-between; padding:4px 0;"><span>${k.replace('_',' ')}</span><b>${v}</b></div>`).join('') || 'No bookings this week.';

  document.getElementById('reportWorkload').innerHTML = instructors.map(i => {
    const c = weekBookings.filter(b=>b.instructorId===i.id && b.status!=='cancelled').length;
    return `<div style="display:flex; justify-content:space-between; padding:4px 0;"><span>${i.name}</span><b>${c}</b></div>`;
  }).join('');

  document.getElementById('reportUtil').innerHTML = aircraft.map(a => {
    const c = weekBookings.filter(b=>b.aircraftId===a.id && b.status!=='cancelled').length;
    return `<div style="display:flex; justify-content:space-between; padding:4px 0;"><span>${a.registration}</span><b>${c} flights</b></div>`;
  }).join('');
}

// ---- Modals ----
function wireModals(){
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('open')));
  document.getElementById('addAircraftBtn').addEventListener('click', () => openAircraftModal(null));
  document.getElementById('addInstructorBtn').addEventListener('click', () => { document.getElementById('instructorForm').reset(); document.getElementById('instructorModal').classList.add('open'); });

  document.getElementById('aircraftForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await upsertAircraft({
      id: document.getElementById('ac-id').value || undefined,
      registration: document.getElementById('ac-reg').value,
      type: document.getElementById('ac-type').value,
      hourlyRate: Number(document.getElementById('ac-rate').value),
      status: document.getElementById('ac-status').value,
    });
    document.getElementById('aircraftModal').classList.remove('open');
    toast('Aircraft saved.');
    renderAircraftTable(); populateFilters(); renderWeek();
  });

  document.getElementById('instructorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await upsertInstructor({ name: document.getElementById('in-name').value, rating: document.getElementById('in-rating').value });
    document.getElementById('instructorModal').classList.remove('open');
    toast('Instructor added.');
    renderInstructorsTable(); populateFilters();
  });
}
