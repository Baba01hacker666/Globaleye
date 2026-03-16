export function makePlaneHTML(heading, color) {
    return `<div class="plane-wrap" style="transform:rotate(${heading}deg)">
        <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
            <path d="M12,2 L14.5,9.5 L21,11.5 L21,13 L14.5,13.5 L14.5,18.5 L17.5,20.5 L17.5,22 L12,20.5 L6.5,22 L6.5,20.5 L9.5,18.5 L9.5,13.5 L3,13 L3,11.5 L9.5,9.5 Z"
                  fill="${color}"
                  style="filter:drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color}66)"/>
        </svg>
    </div>`;
}

export function getColor(t) {
    const origin = (t.origin || '').toLowerCase();
    if (origin.includes('military') || origin.includes('air force')) return 'var(--red)';
    if (t.alt > 10000) return 'var(--amber)';
    return 'var(--green)';
}

export function getSectorName(map) {
    const c = map.getCenter();
    const lat = c.lat, lng = c.lng;
    if (lat > 60) return 'NORTH';
    if (lat < -60) return 'SOUTH';
    if (lng > 90) return 'ASIA-PAC';
    if (lng < -30) return 'AMERICAS';
    if (lng < 60) return 'EMEA';
    return 'MIDEAST';
}
