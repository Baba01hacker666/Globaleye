import { state } from './state.js';
import { DOM } from './dom.js';
import { mapInstance } from './map.js';

export function tickClock() {
    const d = new Date();
    const hh = String(d.getUTCHours()).padStart(2,'0');
    const mm = String(d.getUTCMinutes()).padStart(2,'0');
    const ss = String(d.getUTCSeconds()).padStart(2,'0');
    document.getElementById('utc-clock').textContent = `${hh}:${mm}:${ss}`;
}

export function logEvent(type, msg) {
    const now = new Date();
    const t = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')}`;
    const item = document.createElement('div');
    item.className = `event-item evt-${type}`;
    item.innerHTML = `<span class="evt-time">${t}</span><span class="evt-msg">${msg}</span>`;
    DOM.elEventLog.insertBefore(item, DOM.elEventLog.firstChild);
    if (DOM.elEventLog.children.length > state.MAX_EVENTS) DOM.elEventLog.removeChild(DOM.elEventLog.lastChild);
    state.eventCount++;
    DOM.elEvtCount.textContent = `${state.eventCount} EVENTS`;
}

export function updateTicker() {
    const sorted = Object.values(state.targets).sort((a,b) => b.velocity - a.velocity).slice(0, 15);
    if (sorted.length === 0) return;
    const text = sorted.map(t =>
        `▸ ${(t.callsign || t.icao).toUpperCase()}  HDG:${Math.round(t.trueTrack)}°  ALT:${Math.round(t.alt)}m  VEL:${Math.round(t.velocity)}m/s  ORG:${t.origin || '?'}  ///  `
    ).join('');
    const el = document.getElementById('ticker-inner');
    el.textContent = text + text; // doubled for seamless loop
}

export function setSort(mode, btn) {
    state.sortMode = mode;
    document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateSidebar();
}
window.setSort = setSort; // Ensure it is available globally for the onclick handler

export function updateSidebar() {
    let sorted = Object.values(state.targets);
    if (state.sortMode === 'vel') sorted.sort((a,b) => b.velocity - a.velocity);
    else if (state.sortMode === 'alt') sorted.sort((a,b) => b.alt - a.alt);
    else sorted.sort((a,b) => (a.callsign||a.icao).localeCompare(b.callsign||b.icao));
    sorted = sorted.slice(0, 25);

    DOM.elCount.textContent = `${Object.keys(state.targets).length} TRACKS`;
    DOM.elTotal.textContent = Object.keys(state.targets).length;
    const airborne = Object.values(state.targets).filter(t => t.alt > 100).length;
    DOM.elAirborne.textContent = airborne;
    const alts = Object.values(state.targets).map(t => t.alt).filter(a => a > 0);
    DOM.elAvgAlt.textContent = alts.length ? Math.round(alts.reduce((a,b)=>a+b,0)/alts.length) : 0;

    if (sorted.length === 0) {
        DOM.elFeed.innerHTML = '<div style="color:var(--red);font-family:var(--mono);font-size:0.6rem;padding:10px;">NO TARGETS IN SECTOR</div>';
        return;
    }

    DOM.elFeed.innerHTML = '';
    sorted.forEach(t => {
        const altPct = Math.min(100, (t.alt / 13000) * 100);
        const isMil = (t.origin||'').toLowerCase().includes('military') ||
                      (t.origin||'').toLowerCase().includes('air force');
        const isHighAlt = t.alt > 10000;

        const card = document.createElement('div');
        card.className = `tcard${isMil ? ' military' : isHighAlt ? ' high-alt' : ''}`;
        if (t.icao === state.selectedICAO) card.style.background = 'rgba(0,229,255,0.12)';

        card.innerHTML = `
            <div class="tcard-top">
                <span class="tcard-callsign">${(t.callsign || t.icao).toUpperCase()}</span>
                <span class="tcard-heading">${Math.round(t.trueTrack).toString().padStart(3,'0')}°</span>
            </div>
            <div class="tcard-rows">
                <div class="trow"><span class="trow-key">ALT</span><span class="trow-val">${Math.round(t.alt)}m</span></div>
                <div class="trow"><span class="trow-key">VEL</span><span class="trow-val">${Math.round(t.velocity)}m/s</span></div>
                <div class="trow"><span class="trow-key">HEX</span><span class="trow-val">${t.icao.toUpperCase()}</span></div>
                <div class="trow"><span class="trow-key">ORG</span><span class="trow-val">${(t.origin||'???').substring(0,8)}</span></div>
            </div>
            <div class="alt-bar"><div class="alt-bar-fill" style="width:${altPct}%"></div></div>
        `;
        card.onclick = () => {
            mapInstance.flyTo([t.lat, t.lng], 9, { duration: 1.2 });
            selectTarget(t.icao);
        };
        DOM.elFeed.appendChild(card);
    });
}

export function selectTarget(icao) {
    state.selectedICAO = icao;
    const t = state.targets[icao];
    if (!t) {
        DOM.elSelContent.innerHTML = '<div class="no-select">TARGET LOST</div>';
        DOM.elSelICAO.textContent = 'NONE';
        return;
    }
    DOM.elSelICAO.textContent = t.icao.toUpperCase();
    const spd_kmh = Math.round(t.velocity * 3.6);
    const alt_ft  = Math.round(t.alt * 3.281);

    DOM.elSelContent.innerHTML = `
        <div class="selected-detail">
            <div class="selected-callsign">${(t.callsign || t.icao).toUpperCase()}</div>
            <div class="detail-grid">
                <div class="detail-cell">
                    <span class="detail-key">ALTITUDE</span>
                    <span class="detail-val">${Math.round(t.alt)}m</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">ALT (FT)</span>
                    <span class="detail-val">${alt_ft.toLocaleString()} ft</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">VELOCITY</span>
                    <span class="detail-val">${Math.round(t.velocity)} m/s</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">SPEED</span>
                    <span class="detail-val">${spd_kmh} km/h</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">HEADING</span>
                    <span class="detail-val">${Math.round(t.trueTrack).toString().padStart(3,'0')}°</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">ICAO HEX</span>
                    <span class="detail-val">${t.icao.toUpperCase()}</span>
                </div>
                <div class="detail-cell" style="grid-column:span 2">
                    <span class="detail-key">ORIGIN COUNTRY</span>
                    <span class="detail-val">${t.origin || 'UNRESOLVED'}</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">POSITION</span>
                    <span class="detail-val" data-live-pos style="font-size:0.58rem">${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}</span>
                </div>
                <div class="detail-cell">
                    <span class="detail-key">ON GROUND</span>
                    <span class="detail-val" style="color:${t.alt < 50 ? 'var(--red)' : 'var(--green)'}">${t.alt < 50 ? 'YES' : 'NO'}</span>
                </div>
            </div>
        </div>
    `;
}

export function setBadge(type, text) {
    DOM.elApiBadge.className = `badge badge-${type}`;
    DOM.elApiText.textContent = text;
}
