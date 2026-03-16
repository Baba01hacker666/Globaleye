import { state } from './state.js';
import { DOM } from './dom.js';
import { mapInstance } from './map.js';
import { getColor, makePlaneHTML } from './utils.js';
import { setBadge, logEvent, updateSidebar, updateTicker, selectTarget } from './ui.js';

export async function fetchAirspace() {
    const bounds = mapInstance.getBounds();
    let lamin = bounds.getSouth(), lamax = bounds.getNorth();
    let lomin = bounds.getWest(),  lomax = bounds.getEast();

    if (Math.abs(lamax - lamin) > 20 || Math.abs(lomax - lomin) > 20) {
        const c = mapInstance.getCenter();
        lamin = c.lat - 10; lamax = c.lat + 10;
        lomin = c.lng - 10; lomax = c.lng + 10;
    }

    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

    setBadge('amber', 'QUERYING...');

    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error("Rate limited");
        const data = await r.json();
        const now = Date.now();
        const count = data.states ? data.states.length : 0;

        setBadge('green', `${count} CONTACTS`);
        document.getElementById('mc-br').innerHTML = `DATA: FREE OPENSKY NETWORK<br>LAST SYNC: ${new Date().toUTCString().slice(17,25)}`;

        if (data.states) {
            const seen = new Set();
            data.states.forEach(s => {
                const icao = s[0];
                const callsign = (s[1] || '').trim();
                const origin = s[2] || '';
                const lng = s[5], lat = s[6];
                const alt = s[7] || 0;
                const velocity = s[9] || 0;
                const trueTrack = s[10] || 0;

                if (!lat || !lng) return;
                seen.add(icao);

                const color = getColor({ origin, alt });

                if (state.targets[icao]) {
                    const t = state.targets[icao];
                    t.lat = lat; t.lng = lng;
                    t.velocity = velocity; t.trueTrack = trueTrack;
                    t.lastUpdate = now; t.alt = alt;

                    t.marker.setIcon(L.divIcon({
                        className: '',
                        html: makePlaneHTML(trueTrack, color),
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    }));
                } else {
                    const icon = L.divIcon({
                        className: '',
                        html: makePlaneHTML(trueTrack, color),
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    });

                    const marker = L.marker([lat, lng], { icon }).addTo(mapInstance);
                    marker.bindPopup(`
                        <strong>HEX</strong> ${icao.toUpperCase()}<br>
                        <strong>SIG</strong> ${callsign || 'UNRESOLVED'}<br>
                        <strong>ORG</strong> ${origin || '?'}<br>
                        <strong>ALT</strong> ${Math.round(alt)}m<br>
                        <strong>HDG</strong> ${Math.round(trueTrack)}°
                    `);
                    marker.on('click', () => selectTarget(icao));

                    state.targets[icao] = { icao, callsign, origin, lat, lng, alt, velocity, trueTrack, marker, lastUpdate: now };
                    logEvent('enter', `NEW: ${(callsign||icao).toUpperCase()} [${origin}]`);
                }
            });

            // Purge departed
            for (const icao in state.targets) {
                if (!seen.has(icao)) {
                    logEvent('exit', `LOST: ${(state.targets[icao].callsign||icao).toUpperCase()}`);
                    mapInstance.removeLayer(state.targets[icao].marker);
                    if (state.selectedICAO === icao) {
                        state.selectedICAO = null;
                        DOM.elSelContent.innerHTML = '<div class="no-select">TARGET LOST — OUTSIDE SECTOR</div>';
                    }
                    delete state.targets[icao];
                }
            }
        }

        updateSidebar();
        updateTicker();

    } catch (err) {
        console.error(err);
        setBadge('red', 'TIMEOUT');
        logEvent('hi', `API TIMEOUT: ${err.message}`);
    }
}
