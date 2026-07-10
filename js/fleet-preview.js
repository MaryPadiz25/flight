import { getAircraft } from './data-service.js';

const STATUS_LABEL = { available: 'Available', maintenance: 'In Maintenance', unavailable: 'Unavailable' };
const STATUS_CLASS  = { available: 'badge-confirmed', maintenance: 'badge-weather', unavailable: 'badge-cancelled' };

function planeSvg(color){
  return `<svg class="fleet-plane" viewBox="0 0 200 90" fill="none">
    <path d="M20 50 L90 46 L120 20 L132 22 L114 46 L180 44 L188 50 L114 52 L134 76 L122 78 L92 54 L20 56 Z" fill="${color}" opacity="0.9"/>
  </svg>`;
}

async function render(){
  const el = document.getElementById('fleet-preview');
  if (!el) return;
  const fleet = await getAircraft();
  el.innerHTML = fleet.map(a => `
    <div class="card fleet-card">
      <div class="fleet-top">
        <div>
          <div class="fleet-reg">${a.registration}</div>
          <div class="fleet-type">${a.type}</div>
        </div>
        <span class="badge ${STATUS_CLASS[a.status]}">${STATUS_LABEL[a.status]}</span>
      </div>
      ${planeSvg(a.status === 'available' ? '#0B1D3A' : '#B7C0CE')}
      <div style="font-family:var(--font-mono); font-size:12px; color:var(--ink-soft);">$${a.hourlyRate}/hr wet</div>
    </div>
  `).join('');
}

render();
