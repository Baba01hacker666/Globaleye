import { tickClock, logEvent } from './ui.js';
import { mapInstance, deadReckoning } from './map.js';
import { fetchAirspace } from './api.js';

setInterval(tickClock, 1000);
tickClock();

logEvent('enter', 'SYSTEM BOOT COMPLETE');
logEvent('hi', 'AWAITING OPENSKY UPLINK...');

mapInstance.on('moveend', fetchAirspace);
setTimeout(fetchAirspace, 800);
setInterval(fetchAirspace, 12000);

deadReckoning();
