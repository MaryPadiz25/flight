import { getSession, demoSignOut } from './firebase-init.js';

const NAV = {
  student: [
    { href:'student.html', label:'My Bookings', icon:'cal' },
    { href:'student.html#book', label:'Book a Lesson', icon:'plus' },
    { href:'student.html#history', label:'Lesson History', icon:'clock' },
    { href:'student.html#account', label:'Account & Balance', icon:'wallet' },
  ],
  instructor: [
    { href:'instructor.html', label:'Today\'s Schedule', icon:'cal' },
    { href:'instructor.html#students', label:'My Students', icon:'user' },
  ],
  admin: [
    { href:'admin.html', label:'Dashboard', icon:'grid' },
    { href:'admin.html#daily', label:'Daily Calendar', icon:'cal' },
    { href:'admin.html#weekly', label:'Weekly Calendar', icon:'week' },
    { href:'admin.html#aircraft', label:'Aircraft', icon:'plane' },
    { href:'admin.html#instructors', label:'Instructors', icon:'user' },
    { href:'admin.html#students', label:'Students', icon:'users' },
    { href:'admin.html#reports', label:'Reports', icon:'chart' },
  ],
};

const ICONS = {
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  wallet:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M15 14h3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.5-3.3 3.2-5.2 6.5-5.2s6 1.9 6.5 5.2"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.3c2.6.3 4.4 1.9 4.8 4.2"/>',
  grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  week:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 14h2M11 14h2M15 14h2"/>',
  plane:'<path d="M3 12h4l3-9 4 18 3-9h4"/>',
  chart:'<path d="M4 20V10M11 20V4M18 20v-7"/>',
};

export function renderShell(role, activeHref){
  const session = getSession();
  const items = NAV[role] || [];
  const shell = document.getElementById('app-shell-root');
  if (!shell) return session;

  shell.innerHTML = `
    <aside class="app-side">
      <a class="brand" href="../index.html">
        <svg viewBox="0 0 32 32" fill="none"><path d="M16 2 L18.5 13 L29 16 L18.5 17.5 L17 29 L15 17.5 L4.5 16 L15 13 Z" fill="#E8A33D"/></svg>
        Skyline
      </a>
      <nav class="app-nav">
        ${items.map(it => `
          <a href="${it.href}" class="${it.href.split('#')[0] === activeHref ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ICONS[it.icon]}</svg>
            ${it.label}
          </a>`).join('')}
      </nav>
      <div class="app-side-foot">
        <div style="color:#fff; font-weight:600; margin-bottom:2px;">${session ? session.name : 'Guest'}</div>
        <div style="text-transform:capitalize; margin-bottom:10px;">${role}</div>
        <a href="#" id="signOutLink">Sign out</a>
      </div>
    </aside>
    <main class="app-main" id="app-main"></main>
  `;

  document.getElementById('signOutLink').addEventListener('click', (e) => {
    e.preventDefault();
    demoSignOut();
    window.location.href = '../login.html';
  });

  return session;
}

export function toast(msg){
  let t = document.getElementById('toast');
  if (!t){
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

export function fmtDate(d){
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
}
export function fmtMoney(n){
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}
export function statusLabel(s){
  return { requested:'Requested', confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', weather_cancelled:'Weather Cancelled' }[s] || s;
}
