// ── PALETTE ──────────────────────────────────────────────────────────────────
const COLORS = ['#c8ff47','#47cfff','#ff5f5f','#ffd166','#c77dff','#ff9f1c','#06d6a0','#ef476f'];

// ── STATE ────────────────────────────────────────────────────────────────────
let zones = [
  { id: 1, name: 'Zone A', color: COLORS[0], spotifyUrl: '', layer: null },
  { id: 2, name: 'Zone B', color: COLORS[1], spotifyUrl: '', layer: null },
];
let nextId = 3;
let selectedZoneId = zones[0].id;
let mode = 'draw';
let drawHandler = null;

// ── MAP INIT ─────────────────────────────────────────────────────────────────
const map = L.map('map', {
  center: [40.7128, -74.006],
  zoom: 13,
  zoomControl: true,
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// Dismiss loader once tiles load
map.once('load', fadeOutLoader);
setTimeout(fadeOutLoader, 2500);

function fadeOutLoader() {
  const el = document.getElementById('mapLoading');
  if (!el) return;
  el.classList.add('gone');
  setTimeout(() => el.remove(), 600);
}

// Feature group holds all drawn layers
const drawnItems = new L.FeatureGroup().addTo(map);

// ── DRAW MANAGEMENT ───────────────────────────────────────────────────────────
function startDraw() {
  if (drawHandler) { try { drawHandler.disable(); } catch(e){} drawHandler = null; }
  if (!selectedZoneId) { showToast('Select a zone first'); return; }
  const z = getZone(selectedZoneId);
  if (!z) return;

  drawHandler = new L.Draw.Polygon(map, {
    shapeOptions: {
      color: z.color,
      fillColor: z.color,
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.9,
    },
    showArea: false,
    allowIntersection: false,
    drawError: { color: '#ff5757', timeout: 1000 },
    guidelineDistance: 20,
  });
  drawHandler.enable();
}

map.on(L.Draw.Event.CREATED, function(e) {
  if (!selectedZoneId) return;
  const z = getZone(selectedZoneId);
  if (!z) return;

  // Remove previous layer for this zone
  if (z.layer) drawnItems.removeLayer(z.layer);

  const layer = e.layer;
  applyStyle(layer, z, true);
  drawnItems.addLayer(layer);
  z.layer = layer;
  attachLayerEvents(layer, z);

  render();

  // Auto-advance to next unmapped zone
  const next = zones.find(z2 => !z2.layer && z2.id !== selectedZoneId);
  if (next) {
    setSelected(next.id);
    if (mode === 'draw') setTimeout(startDraw, 150);
  } else {
    showToast('All zones mapped ✓');
    drawHandler = null;
  }
});

map.on(L.Draw.Event.DRAWSTOP, () => { drawHandler = null; });

function applyStyle(layer, z, isSelected) {
  layer.setStyle({
    color:       z.color,
    fillColor:   z.color,
    fillOpacity: isSelected ? 0.22 : 0.12,
    weight:      isSelected ? 2.5 : 1.5,
    opacity:     isSelected ? 1 : 0.7,
    dashArray:   isSelected ? null : '6 4',
  });
}

function attachLayerEvents(layer, z) {
  layer.off('click');
  layer.on('click', function() {
    setSelected(z.id);
    openZonePopup(layer, z);
  });
  layer.on('mouseover', function() {
    if (z.id !== selectedZoneId) {
      layer.setStyle({ fillOpacity: 0.2, weight: 2 });
    }
  });
  layer.on('mouseout', function() {
    applyStyle(layer, z, z.id === selectedZoneId);
  });
}

function openZonePopup(layer, z) {
  const musicHtml = z.spotifyUrl
    ? `<div class="popup-music">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="${z.color}"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.13-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.52-.972c3.633-1.102 8.147-.568 11.233 1.328a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.795c3.528-1.068 9.396-.862 13.105 1.333a.938.938 0 01-.945 1.619z"/></svg>
         Spotify linked
       </div>`
    : `<div class="popup-no-music">No music assigned</div>`;

  const openBtn = z.spotifyUrl
    ? `<a class="popup-btn" href="${esc(z.spotifyUrl)}" target="_blank">Open ↗</a>` : '';

  layer.bindPopup(`
    <div>
      <div class="popup-name" style="color:${z.color}">${esc(z.name)}</div>
      ${musicHtml}
      <div class="popup-actions">
        ${openBtn}
        <button class="popup-btn del" onclick="deleteZone(${z.id})">Delete zone</button>
      </div>
    </div>
  `, { maxWidth: 220, closeButton: true }).openPopup();
}

// ── MODE ─────────────────────────────────────────────────────────────────────
function setMode(m) {
  mode = m;
  document.getElementById('btnDraw').classList.toggle('on', m === 'draw');
  document.getElementById('btnNav').classList.toggle('on', m === 'nav');
  if (m === 'draw') {
    startDraw();
  } else {
    if (drawHandler) { try { drawHandler.disable(); } catch(e){} drawHandler = null; }
  }
}

// ── SELECTION ────────────────────────────────────────────────────────────────
function setSelected(id) {
  selectedZoneId = id;
  zones.forEach(z => {
    if (z.layer) applyStyle(z.layer, z, z.id === id);
  });
  render();
  updateChip();
  if (mode === 'draw') startDraw();
}

function updateChip() {
  const chip = document.getElementById('chipWrap');
  const z = getZone(selectedZoneId);
  if (z) {
    chip.classList.remove('hidden');
    document.getElementById('chipName').textContent = z.name;
    document.getElementById('chipDot').style.background = z.color;
  } else {
    chip.classList.add('hidden');
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
function addZone() {
  const inp = document.getElementById('newZoneName');
  const name = inp.value.trim() || `Zone ${nextId}`;
  const color = COLORS[zones.length % COLORS.length];
  const z = { id: nextId++, name, color, spotifyUrl: '', layer: null };
  zones.push(z);
  inp.value = '';
  setSelected(z.id);
}

function deleteZone(id) {
  map.closePopup();
  const z = getZone(id);
  if (z && z.layer) drawnItems.removeLayer(z.layer);
  zones = zones.filter(z => z.id !== id);
  if (selectedZoneId === id) selectedZoneId = zones[0]?.id ?? null;
  render();
  updateChip();
}

function renameZone(id, val) {
  const z = getZone(id);
  if (!z) return;
  z.name = val || 'Unnamed';
  updateChip();
  // Reattach popup with updated name
  if (z.layer) attachLayerEvents(z.layer, z);
}

function setSpotify(id, url) {
  const z = getZone(id);
  if (!z) return;
  z.spotifyUrl = url;
  if (z.layer) attachLayerEvents(z.layer, z);
}

function clearAllZones() {
  if (!confirm('Remove all zone shapes from the map?')) return;
  zones.forEach(z => { if (z.layer) { drawnItems.removeLayer(z.layer); z.layer = null; } });
  render();
  if (mode === 'draw') startDraw();
}

// ── RENDER SIDEBAR ────────────────────────────────────────────────────────────
function render() {
  // Zones list
  const zl = document.getElementById('zonesList');
  zl.innerHTML = '';
  zones.forEach(z => {
    const div = document.createElement('div');
    div.className = 'zone-row' + (z.id === selectedZoneId ? ' selected' : '');
    div.innerHTML = `
      <div class="zone-pip" style="background:${z.color}"></div>
      <input class="zone-name-inp" value="${esc(z.name)}" maxlength="40" placeholder="Zone name">
      <span class="zone-mapped" title="${z.layer ? 'Mapped' : 'Not drawn yet'}">${z.layer ? '◉' : '○'}</span>
      <button class="del-btn" title="Delete zone">✕</button>
    `;
    div.querySelector('.zone-name-inp').addEventListener('input', e => renameZone(z.id, e.target.value));
    div.querySelector('.del-btn').addEventListener('click', e => { e.stopPropagation(); deleteZone(z.id); });
    div.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      setSelected(z.id);
    });
    zl.appendChild(div);
  });

  // Music list
  const ml = document.getElementById('musicList');
  ml.innerHTML = '';
  zones.forEach(z => {
    const linked = z.spotifyUrl.includes('spotify');
    const div = document.createElement('div');
    div.className = 'music-item';
    div.innerHTML = `
      <div class="music-header">
        <div class="music-pip" style="background:${z.color}"></div>
        <span class="music-zone-name">${esc(z.name)}</span>
      </div>
      <div class="spotify-row">
        <div class="spotify-ball">
          <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.13-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.52-.972c3.633-1.102 8.147-.568 11.233 1.328a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.795c3.528-1.068 9.396-.862 13.105 1.333a.938.938 0 01-.945 1.619z"/></svg>
        </div>
        <input class="spotify-inp ${linked ? 'linked' : ''}" placeholder="Paste Spotify URL or URI…" value="${esc(z.spotifyUrl)}">
        ${z.spotifyUrl ? `<a class="open-btn" href="${esc(z.spotifyUrl)}" target="_blank">Open ↗</a>` : ''}
      </div>
    `;
    div.querySelector('.spotify-inp').addEventListener('input', e => {
      setSpotify(z.id, e.target.value);
      render();
    });
    ml.appendChild(div);
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getZone(id) { return zones.find(z => z.id === id); }

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

document.getElementById('newZoneName').addEventListener('keydown', e => {
  if (e.key === 'Enter') addZone();
});

// ── SPOTIFY AUTH (PKCE) ───────────────────────────────────────────────────────
const SP_CLIENT_ID     = '08b989759dcd46fab3f9126cf581f628';
const SP_REDIRECT_URI  = window.location.href.split('?')[0].split('#')[0];
const SP_SCOPES        = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

let spotifyToken      = null;
let spotifyPlayer     = null;
let spotifyDeviceId   = null;
let playerReady       = false;
let currentlyPlaying  = false;
let progressTimer     = null;
let trackDuration     = 0;
let trackPosition     = 0;

// PKCE helpers
function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
async function generatePKCE() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

async function startSpotifyAuth() {
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem('sp_verifier', verifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     SP_CLIENT_ID,
    scope:         SP_SCOPES,
    redirect_uri:  SP_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location = 'https://accounts.spotify.com/authorize?' + params;
}

async function exchangeCode(code) {
  const verifier = sessionStorage.getItem('sp_verifier');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  SP_REDIRECT_URI,
      client_id:     SP_CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    spotifyToken = data.access_token;
    // Store with expiry
    const expiry = Date.now() + (data.expires_in - 60) * 1000;
    sessionStorage.setItem('sp_token', spotifyToken);
    sessionStorage.setItem('sp_expiry', expiry);
    if (data.refresh_token) sessionStorage.setItem('sp_refresh', data.refresh_token);
    sessionStorage.removeItem('sp_verifier');
    // Clean URL
    history.replaceState({}, '', window.location.pathname);
    return true;
  }
  console.error('Token exchange failed', data);
  return false;
}

async function refreshToken() {
  const refresh = sessionStorage.getItem('sp_refresh');
  if (!refresh) return false;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refresh,
      client_id:     SP_CLIENT_ID,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    spotifyToken = data.access_token;
    const expiry = Date.now() + (data.expires_in - 60) * 1000;
    sessionStorage.setItem('sp_token', spotifyToken);
    sessionStorage.setItem('sp_expiry', expiry);
    return true;
  }
  return false;
}

async function ensureToken() {
  const expiry = parseInt(sessionStorage.getItem('sp_expiry') || '0');
  if (Date.now() > expiry) return await refreshToken();
  return true;
}

// ── SPOTIFY WEB PLAYBACK SDK ──────────────────────────────────────────────────
window.onSpotifyWebPlaybackSDKReady = () => {
  if (!spotifyToken) return; // will init after auth
  initPlayer();
};

function initPlayer() {
  spotifyPlayer = new Spotify.Player({
    name: 'ZoneTune',
    getOAuthToken: async cb => {
      await ensureToken();
      cb(spotifyToken);
    },
    volume: 0.8,
  });

  spotifyPlayer.addListener('ready', ({ device_id }) => {
    spotifyDeviceId = device_id;
    playerReady = true;
    console.log('Spotify player ready, device:', device_id);
    showToast('Spotify player ready ✓');
  });

  spotifyPlayer.addListener('not_ready', ({ device_id }) => {
    playerReady = false;
    console.warn('Player went offline');
  });

  spotifyPlayer.addListener('player_state_changed', state => {
    if (!state) return;
    updatePlayerUI(state);
  });

  spotifyPlayer.addListener('initialization_error', ({ message }) => {
    showToast('Player init error: ' + message);
  });
  spotifyPlayer.addListener('authentication_error', async ({ message }) => {
    const ok = await refreshToken();
    if (!ok) showToast('Spotify auth error — please reload');
  });
  spotifyPlayer.addListener('account_error', ({ message }) => {
    showToast('Spotify Premium required for playback');
  });

  spotifyPlayer.connect();
}

// ── SPOTIFY PLAYBACK API ──────────────────────────────────────────────────────
function extractSpotifyUri(url) {
  // Handle spotify: URIs directly
  if (url.startsWith('spotify:')) return url;
  // Parse https://open.spotify.com/track/xxx or playlist/xxx
  const m = url.match(/spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
  if (m) return `spotify:${m[1]}:${m[2]}`;
  return null;
}

async function playSpotifyUri(uri) {
  if (!playerReady || !spotifyDeviceId) {
    showToast('Player not ready yet…');
    return;
  }
  await ensureToken();

  const isTrack    = uri.startsWith('spotify:track:');
  const isPlaylist = uri.includes(':playlist:');
  const isAlbum    = uri.includes(':album:');

  const body = isTrack
    ? { uris: [uri] }
    : { context_uri: uri };

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + spotifyToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 204 || res.status === 200) {
    currentlyPlaying = true;
    document.getElementById('nowPlaying').classList.add('show');
  } else {
    const err = await res.json().catch(() => ({}));
    showToast('Playback error: ' + (err.error?.message || res.status));
  }
}

async function spotifyTogglePlay() {
  if (!spotifyPlayer) return;
  await spotifyPlayer.togglePlay();
}

async function spotifyNext() {
  if (!spotifyPlayer) return;
  await spotifyPlayer.nextTrack();
}

async function spotifyPrev() {
  if (!spotifyPlayer) return;
  await spotifyPlayer.previousTrack();
}

async function setVolume(val) {
  if (!spotifyPlayer) return;
  await spotifyPlayer.setVolume(val / 100);
}

async function seekTo(e) {
  if (!spotifyPlayer || !trackDuration) return;
  const bar = document.getElementById('npBar');
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  await spotifyPlayer.seek(Math.floor(pct * trackDuration));
}

function updatePlayerUI(state) {
  if (!state) return;
  const track = state.track_window?.current_track;
  if (!track) return;

  currentlyPlaying = !state.paused;
  trackDuration = state.duration;
  trackPosition = state.position;

  // Art
  const artEl = document.getElementById('npArt');
  const imgUrl = track.album?.images?.[0]?.url;
  artEl.innerHTML = imgUrl
    ? `<img src="${imgUrl}" alt="album art">`
    : `<svg class="np-art-placeholder" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.5 8.5l7 3.5-7 3.5V8.5z" fill="currentColor"/></svg>`;

  document.getElementById('npTrack').textContent  = track.name || '—';
  document.getElementById('npArtist').textContent = (track.artists || []).map(a => a.name).join(', ');

  // Play/pause icon
  const icon = document.getElementById('npPlayIcon');
  icon.innerHTML = state.paused
    ? '<path d="M8 5v14l11-7z"/>'
    : '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

  // Progress
  updateProgress(state.position, state.duration);

  // Show player bar
  document.getElementById('nowPlaying').classList.add('show');

  // Kick off local progress timer
  clearInterval(progressTimer);
  if (!state.paused) {
    const startedAt = Date.now();
    const startPos  = state.position;
    progressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pos = Math.min(startPos + elapsed, trackDuration);
      updateProgress(pos, trackDuration);
      if (pos >= trackDuration) clearInterval(progressTimer);
    }, 500);
  }
}

function updateProgress(pos, dur) {
  if (!dur) return;
  const pct = (pos / dur) * 100;
  document.getElementById('npFill').style.width = pct + '%';
  document.getElementById('npTimeCur').textContent = msToTime(pos);
  document.getElementById('npTimeDur').textContent = msToTime(dur);
}

function msToTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

// ── PERSON MARKER ────────────────────────────────────────────────────────────
let personMarker  = null;
let personVisible = false;
let currentZoneId = null;

const personIcon = L.divIcon({
  className: '',
  html: `
    <div class="person-marker-wrap">
      <div class="person-pulse" id="personPulse"></div>
      <svg class="person-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="37" rx="8" ry="3" fill="rgba(0,0,0,0.4)"/>
        <circle cx="20" cy="11" r="7" fill="#c8ff47" stroke="#0b0b0e" stroke-width="1.5"/>
        <circle cx="17.5" cy="10" r="1.2" fill="#0b0b0e"/>
        <circle cx="22.5" cy="10" r="1.2" fill="#0b0b0e"/>
        <path d="M17 13 Q20 15.5 23 13" stroke="#0b0b0e" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M11 28 Q11 20 20 20 Q29 20 29 28 L29 34 L11 34 Z" fill="#c8ff47" stroke="#0b0b0e" stroke-width="1.5"/>
        <path d="M11 22 L6 28" stroke="#c8ff47" stroke-width="3" stroke-linecap="round"/>
        <path d="M29 22 L34 28" stroke="#c8ff47" stroke-width="3" stroke-linecap="round"/>
        <path d="M15 34 L13 40" stroke="#c8ff47" stroke-width="3" stroke-linecap="round"/>
        <path d="M25 34 L27 40" stroke="#c8ff47" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>
  `,
  iconSize: [40, 44],
  iconAnchor: [20, 44],
});

function togglePerson() {
  personVisible ? removePerson() : placePerson();
}

function placePerson() {
  const center = map.getCenter();
  personMarker = L.marker(center, { icon: personIcon, draggable: true, zIndexOffset: 1000 }).addTo(map);
  personMarker.on('dragstart', () => map.dragging.disable());
  personMarker.on('drag',    () => checkPersonZone());
  personMarker.on('dragend', () => { map.dragging.enable(); checkPersonZone(); });
  personVisible = true;
  document.getElementById('btnPerson').classList.add('on');
  document.getElementById('btnPersonLabel').textContent = 'Remove Person';
  checkPersonZone();
}

function removePerson() {
  if (personMarker) { map.removeLayer(personMarker); personMarker = null; }
  personVisible = false;
  currentZoneId = null;
  document.getElementById('btnPerson').classList.remove('on');
  document.getElementById('btnPersonLabel').textContent = 'Add Person';
  document.getElementById('nowPlaying').classList.remove('show');
}

function checkPersonZone() {
  if (!personMarker) return;
  const latlng = personMarker.getLatLng();
  let foundId = null;
  for (const z of zones) {
    if (z.layer && pointInLeafletPolygon(latlng, z.layer)) { foundId = z.id; break; }
  }
  if (foundId !== currentZoneId) {
    currentZoneId = foundId;
    onPersonZoneChange(foundId);
  }
}

function pointInLeafletPolygon(latlng, layer) {
  if (!layer.getBounds().contains(latlng)) return false;
  const verts = layer.getLatLngs()[0];
  let inside = false;
  const x = latlng.lng, y = latlng.lat;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].lng, yi = verts[i].lat;
    const xj = verts[j].lng, yj = verts[j].lat;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

async function onPersonZoneChange(zoneId) {
  const pulse = document.getElementById('personPulse');
  if (pulse) pulse.classList.toggle('in-zone', !!zoneId);

  if (!zoneId) {
    // Left all zones — pause playback
    if (spotifyPlayer && currentlyPlaying) await spotifyPlayer.pause();
    document.getElementById('npZoneLabel').textContent = 'Outside zones';
    return;
  }

  const z = getZone(zoneId);
  if (!z) return;

  showToast(`Entered: ${z.name}`);
  document.getElementById('npZoneLabel').textContent = z.name;
  document.getElementById('nowPlaying').classList.add('show');

  if (z.spotifyUrl) {
    const uri = extractSpotifyUri(z.spotifyUrl);
    if (uri && playerReady) {
      await playSpotifyUri(uri);
    } else if (!playerReady) {
      showToast('Spotify player not ready yet');
    }
  } else {
    // No music — pause whatever is playing
    if (spotifyPlayer && currentlyPlaying) await spotifyPlayer.pause();
    document.getElementById('npTrack').textContent  = 'No music assigned';
    document.getElementById('npArtist').textContent = '';
  }
}

// ── SPOTIFY INIT ON LOAD ──────────────────────────────────────────────────────
async function initSpotify() {
  // Check for auth code callback
  const params  = new URLSearchParams(window.location.search);
  const code    = params.get('code');
  const errParam = params.get('error');

  if (errParam) {
    showToast('Spotify auth cancelled');
    history.replaceState({}, '', window.location.pathname);
    return;
  }

  if (code) {
    const ok = await exchangeCode(code);
    if (!ok) { showToast('Token exchange failed'); return; }
  }

  // Check stored token
  const storedToken  = sessionStorage.getItem('sp_token');
  const storedExpiry = parseInt(sessionStorage.getItem('sp_expiry') || '0');

  if (storedToken && Date.now() < storedExpiry) {
    spotifyToken = storedToken;
    document.getElementById('spOverlay').classList.add('hidden');
    // SDK may already be ready; init player
    if (window.Spotify) initPlayer();
    // else onSpotifyWebPlaybackSDKReady will fire and call initPlayer()
    return;
  }

  // Try refresh
  if (sessionStorage.getItem('sp_refresh')) {
    const ok = await refreshToken();
    if (ok) {
      document.getElementById('spOverlay').classList.add('hidden');
      if (window.Spotify) initPlayer();
      return;
    }
  }

  // Show login overlay
  document.getElementById('spOverlay').classList.remove('hidden');
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
render();
updateChip();
setTimeout(() => setMode('draw'), 600);
initSpotify();