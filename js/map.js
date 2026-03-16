import { state } from './state.js';
import { DOM } from './dom.js';
import { getSectorName } from './utils.js';

export const mapInstance = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([24.45, 65.0], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance);
L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

mapInstance.on('mousemove', e => {
    document.getElementById('live-coords').textContent =
        `${e.latlng.lat.toFixed(4)} / ${e.latlng.lng.toFixed(4)}`;
});

mapInstance.on('zoomend', () => {
    document.getElementById('mc-tr').innerHTML =
        `ZOOM: ${mapInstance.getZoom()}<br>SECTOR: ${getSectorName(mapInstance)}`;
});

export function deadReckoning() {
    const now = Date.now();
    for (const icao in state.targets) {
        const t = state.targets[icao];
        if (t.velocity <= 0) continue;

        const dt = (now - t.lastUpdate) / 1000;
        const dist = t.velocity * dt;
        const hdgRad = t.trueTrack * (Math.PI / 180);
        const dLat = (dist * Math.cos(hdgRad)) / 111320;
        const dLng = (dist * Math.sin(hdgRad)) / (111320 * Math.cos(t.lat * Math.PI / 180));

        t.marker.setLatLng([t.lat + dLat, t.lng + dLng]);

        if (icao === state.selectedICAO) {
            const liveLat = t.lat + dLat, liveLng = t.lng + dLng;
            const posEl = DOM.elSelContent.querySelector('[data-live-pos]');
            if (posEl) posEl.textContent = `${liveLat.toFixed(4)}, ${liveLng.toFixed(4)}`;
        }
    }
    requestAnimationFrame(deadReckoning);
}
