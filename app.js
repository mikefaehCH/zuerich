/* Zúrich en Navidad – lógica de la página. Los contenidos están en data.js. */
'use strict';
/* ================= utilidades ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = Object.fromEntries(PLACES.map(p => [p.id, p]));
const ideaById = Object.fromEntries(IDEAS.map(i => [i.id, i]));
const HB = [47.3779, 8.5403];
const WD = ['dom','lun','mar','mié','jue','vie','sáb'];
const MO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const startDate = new Date(TRIP.start + 'T00:00:00');
const NDAYS = Math.round((new Date(TRIP.end + 'T00:00:00') - startDate) / 864e5) + 1;
const dayDate = i => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const isoShort = s => { const [y,m,d] = s.split('-').map(Number); return `${d} ${MO[m-1]}`; };
const hh = h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2,'0')}`;
const SITE = 'https://mikefaehch.github.io/zuerich/';
const isLocal = n => !!n && n.startsWith('img/');
/* crédito de una foto (PHOTOS en data.js): «Nombre · Unsplash», enlazado a la foto original */
const credit = (n, cls = '') => { const f = PHOTOS[n]; return f ? `<a${cls ? ` class="${cls}"` : ''} href="${f.src}" target="_blank" rel="noopener">${esc(f.by)} · Unsplash</a>` : ''; };
const gSearch = p => p.gmap || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.q));
const gDir = p => 'https://www.google.com/maps/dir/?api=1&travelmode=transit&' + (p.cat === 'excursion' ? 'origin=' + encodeURIComponent('Zürich HB') + '&' : '') + 'destination=' + encodeURIComponent(p.q);
const MAXSTOPS = 10;   // límite de Google Maps: origen + 8 paradas + destino
const gWalk = ids => {
  const ps = ids.map(id => byId[id]).filter(p => p && p.cat !== 'excursion').slice(0, MAXSTOPS);
  if (!ps.length) return null;
  if (ps.length === 1) return gDir(ps[0]);
  const w = ps.slice(1, -1);
  return 'https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=' + encodeURIComponent(ps[0].q) +
    '&destination=' + encodeURIComponent(ps[ps.length-1].q) + (w.length ? '&waypoints=' + encodeURIComponent(w.map(x => x.q).join('|')) : '');
};
const offMin = p => p.cat === 'excursion' ? null : walkMin(km(OFFICE.ll, p.ll));
const gOffice = p => 'https://www.google.com/maps/dir/?api=1&travelmode=' + (offMin(p) <= 20 ? 'walking' : 'transit') + '&origin=' + encodeURIComponent(OFFICE.q) + '&destination=' + encodeURIComponent(p.q);
const wa = t => 'https://wa.me/?text=' + encodeURIComponent(t);
const km = (a, b) => { const r = x => x * Math.PI / 180, dLa = r(b[0]-a[0]), dLo = r(b[1]-a[1]);
  const h = Math.sin(dLa/2)**2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo/2)**2; return 12742 * Math.asin(Math.sqrt(h)); };
const walkMin = d => Math.max(5, Math.round(d * 1.3 / 4.8 * 60 / 5) * 5);
const sentences = t => String(t).split(/(?<=[.!?»])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«])/);
const short = (t, n = 1) => sentences(t).slice(0, n).join(' ');
const rest = (t, n = 1) => sentences(t).slice(n).join(' ');
const shortName = p => p.name.split(' (')[0].split(' – ')[0];
const STAR_SVG = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.7 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.8 6.3 20l1.4-6.3L2.9 9.4l6.4-.7z"/></svg>';
const STAR = STAR_SVG.replace('aria-hidden="true"', 'role="img" aria-label="Favorito de Mike"');
const ICON = {
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  nav:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.2A8.5 8.5 0 1 1 20.5 11.6z"/></svg>',
  grip:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
};
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollTo = el => el && el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block:'start' });

/* ================= estado ================= */
/* Mi plan = lista ordenada de ids de lugares. Migración desde versiones anteriores (sin pérdida):
   zh-plan [{t:'p'|'i', id, d}] → lugares en el mismo orden; las ideas se convierten en sus paradas. zh-favs → lugares. */
function loadPlan(){
  const v3 = store.get('zh-plan3', null);
  if (Array.isArray(v3)) return v3.filter((id, i) => byId[id] && v3.indexOf(id) === i);
  const out = [];
  const add = id => { if (byId[id] && !out.includes(id)) out.push(id); };
  const v2 = store.get('zh-plan', null);
  if (Array.isArray(v2)) v2.forEach(x => x.t === 'i' ? (ideaById[x.id]?.stops || []).forEach(add) : add(x.id));
  else store.get('zh-favs', []).forEach(add);
  return out;
}
const TABS = [['destacados','Destacados'],['navidad','Navidad'],['favoritos','Favoritos'],['comer','Comer y café'],['excursiones','Excursiones'],['todo','Todo']];
const SUBS = [['cafe','Café'],['brunch','Brunch'],['almuerzo','Almuerzo'],['cena','Cena'],['bar','Copas']];
const TAB_NOTE = { excursiones:'Tiempos de ida aproximados desde Zürich HB; comprobad la conexión del día.' };
const state = { tab: store.get('zh-tab', 'destacados'), sub:null, near:null, nearFrom:null, plan: loadPlan(), incoming:null };
const MOM = Object.fromEntries(CONFIG.momentos.map(m => ['m-' + m.id, m]));
if (!TABS.some(t => t[0] === state.tab) && !MOM[state.tab]) state.tab = 'destacados';
const savePlan = () => { store.set('zh-plan3', state.plan); const c = $('#planCnt'); c.textContent = state.plan.length || ''; c.setAttribute('aria-label', state.plan.length ? `${state.plan.length} lugares` : ''); };
const inPlan = id => state.plan.includes(id);
const PRIO_ORDER = { top:0, muy:1, si:2 };
const isXmasHighlight = p => p.cat === 'navidad' && (p.prio === 'top' || p.poc);

function inTab(p){
  switch (state.tab){
    case 'destacados': return p.prio === 'top' || isXmasHighlight(p);
    case 'navidad': return p.cat === 'navidad';
    case 'favoritos': return !!p.poc;
    case 'comer': return state.sub ? (p.tags || []).includes(state.sub) : p.cat === 'gastro' || (p.tags || []).includes('bar');   // bares de otras categorías (Cabaret Voltaire) también aquí
    case 'excursiones': return p.cat === 'excursion';
    case 'm-manana': return MOM['m-manana'].places.includes(p.id);
    case 'm-mediodia': return (p.tags || []).includes('almuerzo');
    case 'm-tarde': return (p.cat === 'navidad' && p.status !== 'pend') || ['cena','bar'].some(t => (p.tags || []).includes(t)) || p.id === 'langstrasse';
    case 'm-finde': return p.cat === 'excursion' || p.cat === 'cultura' || (p.tags || []).includes('brunch') || ['uetliberg','lindt','hurlimann'].includes(p.id);
    default: return true;
  }
}
function visible(){
  const list = PLACES.filter(inTab);
  if (state.near) return list.sort((a, b) => km(state.near, a.ll) - km(state.near, b.ll));
  if (state.tab === 'm-manana') return MOM['m-manana'].places.map(id => byId[id]).filter(Boolean);
  if (state.tab === 'm-mediodia') return list.sort((a, b) => km(OFFICE.ll, a.ll) - km(OFFICE.ll, b.ll));
  const mine = p => (p.poc ? 2 : p.rec ? 1 : 0);
  if (state.tab === 'm-tarde') return list.sort((a, b) => (b.cat === 'navidad') - (a.cat === 'navidad') || mine(b) - mine(a) || PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio]);
  if (state.tab === 'm-finde') return list.sort((a, b) => mine(b) - mine(a) || PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio]);
  const navFirst = state.tab === 'destacados' ? (a, b) => (b.cat === 'navidad') - (a.cat === 'navidad') : () => 0;
  return list.sort((a, b) => navFirst(a, b) || PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio] || (b.poc?1:0) - (a.poc?1:0));
}

/* ================= tarjeta compacta ================= */
const statusLabel = p => p.status === 'ok' ? '<span class="st ok">Confirmado</span>' : p.status === 'sec' ? '<span class="st sec">Confirmar antes de ir</span>' : '<span class="st pend">Horario por confirmar</span>';
const dateRange = p => p.cat !== 'navidad' ? '' : p.open ? ` · ${isoShort(p.open[0])} – ${isoShort(p.open[1])}` : ' · fechas por confirmar';
const addBtn = p => `<button class="add" type="button" data-plan="${p.id}" aria-pressed="${inPlan(p.id)}" aria-label="${inPlan(p.id) ? 'Quitar de mi plan' : 'Añadir a mi plan'}: ${esc(p.name)}">${inPlan(p.id) ? ICON.check : ICON.plus}</button>`;
/* listas: solo texto (las fotos se usan en portada, momentos y favoritos) */
/* barrio a partir del código postal de addr */
/* tipo de lugar en una palabra; en «Comer y café» según las etiquetas */
const kindLabel = p => { if (p.cat !== 'gastro') return (p.tags || []).includes('bar') ? 'Bar y ' + CATS[p.cat].label.toLowerCase() : CATS[p.cat].label; const t = p.tags || [];
  return t[0] === 'brunch' ? 'Brunch y café' : t[0] === 'cafe' ? 'Café' : t.length === 1 && t[0] === 'bar' ? 'Bar' : 'Restaurante'; };
const BARRIOS = { '8001':'Centro', '8002':'Enge', '8004':'Kreis 4', '8005':'Kreis 5', '8008':'Seefeld', '8037':'Wipkingen' };
const barrio = p => { const m = p.cat !== 'excursion' && (p.addr || '').match(/\b(80\d\d)\b/); return m ? BARRIOS[m[1]] || '' : ''; };
function card(p, lvl = 3){
  const more = rest(p.desc);
  const share = `${p.name}${p.poc ? ' (favorito de Mike)' : ''}\n${gSearch(p)}\n\nGuía: ${SITE}#p-${p.id}`;
  return `<article class="pc" id="p-${p.id}" aria-labelledby="h-${p.id}">
    <div class="pc-main">
      <div class="pc-b">
        <p class="pc-cat">${esc(kindLabel(p))}${barrio(p) ? ' · ' + barrio(p) : ''}${dateRange(p)}${p.rec ? ' · <span class="rec">Recomendado por Mike</span>' : ''}${offMin(p) !== null && offMin(p) <= 20 ? ` · a ${offMin(p)} min de la oficina` : ''}</p>
        <h${lvl} class="pc-t" id="h-${p.id}">${esc(p.name)}${p.poc ? STAR : ''}</h${lvl}>
        <p class="pc-desc">${esc(short(p.desc))}</p>
      </div>
    </div>
    <div class="pc-foot">
      <a class="link" href="${gSearch(p)}" target="_blank" rel="noopener">${ICON.pin}Google Maps</a>
      <button class="link" type="button" data-more="${p.id}" aria-expanded="false" aria-controls="m-${p.id}">Más información</button>
      ${addBtn(p)}
    </div>
    <div class="more" id="m-${p.id}" hidden>
      ${isLocal(p.img) ? `<figure class="more-img"><img src="${p.img}-800.webp" srcset="${p.img}-400.webp 400w, ${p.img}-800.webp 800w" sizes="(min-width:760px) 480px, 92vw" alt="${esc(p.imgCap)}" width="800" height="480" loading="lazy" decoding="async"${p.imgPos ? ` style="object-position:${p.imgPos}"` : ''}><figcaption>Foto: ${credit(p.img)}</figcaption></figure>` : ''}
      ${p.tip ? `<p class="mtip"><b>Consejo de Mike:</b> ${esc(p.tip)}</p>` : ''}
      ${more ? `<p>${esc(more)}</p>` : ''}
      <p><strong>Horario:</strong> ${esc(p.hours)} ${statusLabel(p)}</p>
      <p><strong>Precio:</strong> ${esc(p.price)} · <strong>Duración:</strong> ${esc(p.dur)}</p>
      ${p.addr ? `<p><strong>Dirección:</strong> ${esc(p.addr)}</p>` : ''}
      <p><strong>Cómo llegar:</strong> ${esc(p.ov)}</p>
      ${p.cat !== 'excursion' ? `<p><strong>Desde la oficina:</strong> ${offMin(p) <= 25 ? `≈ ${offMin(p)} min a pie` : 'mejor en tranvía o tren'}</p>` : ''}
      <p class="links">${p.cat !== 'excursion' ? `<a href="${gOffice(p)}" target="_blank" rel="noopener">Ruta desde la oficina</a>` : ''}<a href="${gDir(p)}" target="_blank" rel="noopener">Cómo llegar en transporte</a><button type="button" data-showmap="${p.id}">Ver en el mapa</button><a href="${wa(share)}" target="_blank" rel="noopener">Compartir por WhatsApp</a>${p.web ? `<a href="${p.web}" target="_blank" rel="noopener">Web oficial</a>` : ''}${p.src ? `<a href="${p.src}" target="_blank" rel="noopener">Fuente (${TRIP.checked})</a>` : ''}</p>
    </div>
  </article>`;
}

/* ================= 02 · lo mejor de Zúrich = los favoritos de Mike ================= */
/* frase de Mike para la tarjeta: la primera frase de su consejo (o dos, si la primera es muy corta) */
const quote = p => { if (!p.tip) return ''; const f = sentences(p.tip); return (f[0].length < 40 && f[1] ? f[0] + ' ' + f[1] : f[0]); };
function renderFavs(){
  $('#favLegend').innerHTML = `${STAR_SVG}Los favoritos de Mike, contados por él mismo.`;
  const picks = CONFIG.favFirst.map(id => byId[id]).filter(p => p && isLocal(p.img));
  $('#favGrid').innerHTML = picks.map(p => `<article class="pick">
      <button type="button" class="pk-img" data-card="${p.id}" aria-label="${esc(p.name)}: ver ficha">
        <img src="${p.img}-800.webp" srcset="${p.img}-400.webp 400w, ${p.img}-800.webp 800w" sizes="(min-width:700px) 330px, 74vw" alt="${esc(p.imgCap)}" width="800" height="600" loading="lazy" decoding="async">
        <span class="pk-t"><small>${esc(kindLabel(p))}${barrio(p) ? ' · ' + esc(barrio(p)) : ''}</small><b>${esc(shortName(p))}${STAR_SVG}</b></span>
      </button>
      <span class="pk-cr">${credit(p.img)}</span>
      <p class="pk-q">${esc(quote(p) || short(p.desc))}</p>
      ${addBtn(p)}
    </article>`).join('');
  const more = PLACES.filter(p => p.poc && !picks.includes(p)).sort((a, b) => (b.cat === 'navidad') - (a.cat === 'navidad'));
  $('#favList').innerHTML = more.map(p => `<li class="fl">
      <div class="fl-t"><button type="button" class="nm" data-card="${p.id}">${esc(shortName(p))}${STAR}</button>
        <span class="ct">${esc(kindLabel(p))}${barrio(p) ? ' · ' + esc(barrio(p)) : ''}${p.cat === 'navidad' && p.open ? ' · desde el ' + isoShort(p.open[0]) : ''}</span>
        <p>${esc(quote(p) || short(p.desc))}</p></div>
      ${addBtn(p)}
    </li>`).join('');
}

/* ================= 01b · según el momento del día ================= */
function renderMoments(){
  $('#momGrid').innerHTML = CONFIG.momentos.map(m => { const n = PLACES.filter(p => { const t = state.tab; state.tab = 'm-' + m.id; const r = inTab(p); state.tab = t; return r; }).length;
    return `<button type="button" class="mo" data-goto="m-${m.id}">
      ${m.img ? `<img src="${m.img}-400.webp" srcset="${m.img}-400.webp 400w, ${m.img}-800.webp 800w" sizes="(min-width:860px) 240px, 46vw" alt="" width="400" height="300" decoding="async">` : ''}
      <span class="mo-t"><b>${esc(m.title)}</b><small>${esc(m.sub)} · ${n}</small></span>
      ${PHOTOS[m.img] ? `<span class="mo-cr" aria-hidden="true">${m.place ? `<span class="mo-pl">${esc(m.place)}</span> ` : ''}<span class="mo-au">${esc(PHOTOS[m.img].by)}</span></span>` : ''}
    </button>`; }).join('');
  $('#photoCredits').innerHTML = Object.entries(PHOTOS).map(([n, f]) => `<li>${esc(f.what)} — ${credit(n)}</li>`).join('');
}

/* ================= 04 · descubrir ================= */
const chip = (g, v, l, on, extra = '') => `<button class="chip${extra}" type="button" data-${g}="${v}" aria-pressed="${on}">${l}</button>`;
function renderTabs(){
  $('#tabs').innerHTML = (MOM[state.tab] ? chip('tab', state.tab, esc(MOM[state.tab].title), true) : '') + TABS.map(([v,l]) => chip('tab', v, v === 'favoritos' ? STAR_SVG + l : l, state.tab === v)).join('');
  const st = $('#subtabs'); st.hidden = state.tab !== 'comer';
  st.innerHTML = SUBS.map(([v,l]) => chip('sub', v, l, state.sub === v, ' sm')).join('');
}
const GROUPS = [['navidad','Navidad'],['ver','Casco antiguo y vistas'],['cultura','Cultura'],['experiencia','Experiencias'],['gastro','Comer y café'],['excursion','Excursiones']];
function renderList(){
  const list = visible();
  $('#count').textContent = (list.length === 1 ? '1 lugar' : `${list.length} lugares`) + (state.near ? (state.nearFrom === 'office' ? ' · cerca de la oficina' : ' · por distancia') : '');
  const note = TAB_NOTE[state.tab] || MOM[state.tab]?.note; const n = $('#tabNote'); n.hidden = !note; n.textContent = note || '';
  if (state.tab === 'todo' && !state.near){
    $('#plist').innerHTML = GROUPS.map(([c, l]) => { const g = list.filter(p => p.cat === c); return g.length ? `<h3 class="group-h">${l}</h3>` + g.map(p => card(p, 4)).join('') : ''; }).join('');
  } else $('#plist').innerHTML = list.map(p => card(p)).join('');
  $('#nearBtn').textContent = state.near && state.nearFrom === 'me' ? 'Quitar distancia' : 'Cerca de mí';
  $('#offBtn').setAttribute('aria-pressed', !!state.near && state.nearFrom === 'office');
  if (map) renderMarkers(list);
}
function refresh(){ store.set('zh-tab', state.tab); renderTabs(); renderList(); }
function goTo(target){
  if (target === 'ideas') return scrollTo($('#ideas'));
  state.tab = target; state.sub = null; state.near = null; state.nearFrom = null; refresh(); scrollTo($('#lista'));
}

/* ================= mapa (Leaflet se carga solo al abrirlo) ================= */
let map, cluster, routeLayer, meMarker, leafletLoading; const markers = {};
function loadLeaflet(){
  if (window.L && L.markerClusterGroup) return Promise.resolve();
  if (leafletLoading) return leafletLoading;
  const css = h => new Promise(r => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; l.onload = r; l.onerror = r; document.head.appendChild(l); });
  const js = s => new Promise((r, j) => { const e = document.createElement('script'); e.src = s; e.onload = r; e.onerror = j; document.head.appendChild(e); });
  return leafletLoading = Promise.all([css('vendor/leaflet/leaflet.css'), css('vendor/markercluster/MarkerCluster.css')])
    .then(() => js('vendor/leaflet/leaflet.js')).then(() => js('vendor/markercluster/leaflet.markercluster.js'));
}
async function openMap(){
  const box = $('#mapbox'); box.hidden = false; $('#mapBtn').setAttribute('aria-expanded','true'); $('#mapBtn').textContent = 'Ocultar mapa';
  if (!map){
    try{ await loadLeaflet(); }catch(e){ $('#map').innerHTML = '<p class="note" style="padding:1rem">El mapa necesita conexión a internet.</p>'; return; }
    map = L.map('map', { scrollWheelZoom:false, fadeAnimation:false }).setView([47.3725, 8.5405], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>' }).addTo(map);
    cluster = L.markerClusterGroup({ maxClusterRadius:36, disableClusteringAtZoom:15, showCoverageOnHover:false, animate:false,
      iconCreateFunction: c => L.divIcon({ className:'', html:`<div class="cl">${c.getChildCount()}</div>`, iconSize:[34,34], iconAnchor:[17,17] }) }).addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    L.marker(OFFICE.ll, { title:'Oficina', alt:'Oficina', zIndexOffset:800, icon:L.divIcon({ className:'', html:'<div class="of">Oficina</div>', iconSize:[60,24], iconAnchor:[30,12] }) }).bindPopup('<span class="pn">La oficina</span><span class="pd">' + esc(OFFICE.q) + '</span>').addTo(map);
    $('#legend').innerHTML = Object.values(CATS).map(c => `<span style="--c:${c.color}"><i></i>${c.label}</span>`).join('') + `<span>Punto grande: TOP 10</span><span>${STAR_SVG} Favoritos de Mike</span>`;
  }
  map.invalidateSize(); renderMarkers(visible());
}
function closeMap(){ $('#mapbox').hidden = true; $('#mapBtn').setAttribute('aria-expanded','false'); $('#mapBtn').textContent = 'Ver mapa'; }
function popup(p){
  const d = km(HB, p.ll);
  return `<span class="pn">${esc(p.name)}${p.poc ? STAR_SVG : ''}</span><span class="pd">${p.prio === 'top' ? 'TOP 10 · ' : ''}${CATS[p.cat].label}${p.cat !== 'excursion' && d < 3 ? ` · ≈ ${walkMin(d)} min a pie de HB` : ''}</span>
    <div class="pa"><a href="${gSearch(p)}" target="_blank" rel="noopener">Google Maps</a><button type="button" data-card="${p.id}">Ver ficha</button></div>`;
}
function renderMarkers(list){
  cluster.clearLayers();
  list.forEach(p => {
    const top = p.prio === 'top';
    const icon = L.divIcon({ className:'', html:`<div class="pinw${top ? ' top' : ''}"><div class="pin" style="--c:${CATS[p.cat].color}"></div>${p.poc ? `<span class="pstar">${STAR_SVG}</span>` : ''}</div>`, iconSize:[22,22], iconAnchor:[11,11], popupAnchor:[0,-10] });
    markers[p.id] = L.marker(p.ll, { icon, title:p.name, alt:p.name, keyboard:true, zIndexOffset: top ? 500 : p.poc ? 300 : 0 }).bindPopup(popup(p), { maxWidth:240, minWidth:200, autoPanPadding:[24,70] });
    cluster.addLayer(markers[p.id]);
  });
  const city = list.filter(p => p.cat !== 'excursion' && !CONFIG.mapFar.includes(p.id));
  const pts = (state.tab === 'excursiones' || !city.length ? list : city).map(p => p.ll);
  if (state.near) pts.push(state.near);
  if (pts.length > 1) map.fitBounds(pts, { padding:[28,28], maxZoom:16, animate:false }); else if (pts.length) map.setView(pts[0], 15, { animate:false });
}
async function showOnMap(id){
  const p = byId[id]; if (!p) return;
  if (!PLACES.filter(inTab).includes(p)){ state.tab = 'todo'; state.sub = null; refresh(); }
  await openMap(); scrollTo($('#mapbox'));
  setTimeout(() => { map.invalidateSize(); cluster.zoomToShowLayer(markers[id], () => markers[id].openPopup()); }, reduced() ? 60 : 450);
}
function openCard(id, instant){
  if (!byId[id]) return;
  let el = document.getElementById('p-' + id);
  if (!el){ state.tab = 'todo'; state.sub = null; refresh(); el = document.getElementById('p-' + id); }
  map && map.closePopup();
  instant ? el.scrollIntoView({ block:'start' }) : scrollTo(el);
  el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1800);
  history.replaceState(null, '', '#p-' + id);
}
function toggleMore(id){
  const b = document.querySelector(`[data-more="${id}"]`), m = document.getElementById('m-' + id); if (!b || !m) return;
  const open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', open); b.textContent = open ? 'Menos' : 'Más información';
}
function nearOffice(){
  const on = state.near && state.nearFrom === 'office';
  meMarker && map && map.removeLayer(meMarker);
  state.near = on ? null : OFFICE.ll; state.nearFrom = on ? null : 'office'; renderList();
  if (!on) toast('Ordenado por distancia a la oficina');
}
function nearMe(){
  if (state.near){ const wasMe = state.nearFrom === 'me'; state.near = null; state.nearFrom = null; meMarker && map && map.removeLayer(meMarker); renderList(); if (wasMe) return; }
  if (!navigator.geolocation){ toast('Este navegador no permite la ubicación'); return; }
  toast('Buscando vuestra ubicación…');
  navigator.geolocation.getCurrentPosition(pos => {
    state.near = [pos.coords.latitude, pos.coords.longitude]; state.nearFrom = 'me';
    if (map){ meMarker && map.removeLayer(meMarker); meMarker = L.marker(state.near, { interactive:false, icon:L.divIcon({ className:'', html:'<div class="me"></div>', iconSize:[16,16], iconAnchor:[8,8] }) }).addTo(map); }
    renderList(); toast('Ordenado por distancia');
  }, () => toast('No se pudo obtener la ubicación'), { enableHighAccuracy:true, timeout:10000, maximumAge:60000 });
}
function renderCal(){
  const xmas = PLACES.filter(p => p.cat === 'navidad');
  const days = Array.from({ length:NDAYS }, (_, i) => dayDate(i));
  const head = '<tr><th scope="col"></th>' + days.map(d => `<th scope="col">${WD[d.getDay()]}<b>${d.getDate()}</b></th>`).join('') + '</tr>';
  const rows = xmas.map(p => '<tr><th scope="row"><button type="button" data-card="' + p.id + '">' + esc(shortName(p).replace('Mercado navideño del ', '')) + '</button></th>' + days.map(d => {
    if (!p.open) return '<td><span class="q" aria-label="por confirmar">?</span></td>';
    const s = iso(d), on = s >= p.open[0] && s <= p.open[1] && !p.closed.includes(d.getDay());
    if (!on) return '<td><span class="n" aria-label="cerrado">—</span></td>';
    const c = p.close ? p.close[d.getDay()] : null;
    return `<td><span class="y" aria-hidden="true">●</span><span class="sr">abierto${c && c < 24 ? ' hasta las ' + hh(c) : ''}</span>${p.status === 'pend' ? '<small>?</small>' : c && c < 24 ? `<small>${hh(c)}</small>` : ''}</td>`;
  }).join('') + '</tr>').join('');
  $('#cal').innerHTML = `<caption class="sr">Mercados navideños abiertos del 20 al 27 de noviembre</caption><thead>${head}</thead><tbody>${rows}</tbody>`;
}

/* ================= 05 · ideas ================= */
const TOP_IDEAS = CONFIG.topIdeas;
/* el estrella nunca queda sola en una línea: va pegada a la última palabra */
const nameWithStar = p => { const w = esc(shortName(p)).split(' '), last = w.pop(); return (w.length ? w.join(' ') + ' ' : '') + `<span class="nw">${last}${p.poc ? STAR : ''}</span>`; };
const CTXL = { trabajo:'Después del trabajo', finde:'Fin de semana', lluvia:'Con lluvia' };
function ideaHTML(i){
  const all = i.stops.every(inPlan);
  const walk = i.transit || i.walkOnly ? gDir(byId[i.stops[0]]) : gWalk(i.stops);
  return `<article class="idea" id="idea-${i.id}"><h3>${esc(i.title)}</h3>
    <p class="meta">${esc(i.dur)} · <b>${esc(i.days || i.ctx.map(c => CTXL[c]).join(' · '))}</b></p>
    <p class="tx">${esc(short(i.text, 2))}</p>
    <ol class="route">${i.stops.map(id => `<li><span class="rn"><button type="button" data-card="${id}">${nameWithStar(byId[id])}</button></span></li>`).join('')}</ol>
    ${i.note ? `<p class="inote">${esc(i.note)}</p>` : ''}
    <div class="acts"><a class="btn pri" href="${walk}" target="_blank" rel="noopener">${ICON.nav}${i.transit ? 'Conexión' : i.walkOnly ? 'Cómo llegar' : 'Ruta en Google Maps'}</a>
      <button class="btn ghost" type="button" data-addidea="${i.id}" aria-pressed="${all}">${all ? ICON.check + 'En mi plan' : ICON.plus + 'Añadir al plan'}</button></div></article>`;
}
function renderIdeas(){
  $('#ideasTop').innerHTML = TOP_IDEAS.map(id => ideaHTML(ideaById[id])).join('');
  const others = IDEAS.filter(i => !TOP_IDEAS.includes(i.id));
  $('#ideasRest').innerHTML = others.map(ideaHTML).join('');
  $('#ideasMoreSum').textContent = `Más ideas, también para el fin de semana (${others.length})`;
}

/* ================= 06 · mi plan: lista simple, ordenable ================= */
const encodePlan = plan => plan.join('~');
function decodePlan(s){
  const out = [];
  s.split('~').forEach(tok => {
    const m = tok.match(/^(i-)?([a-z0-9-]+?)(?:\.\d+)?$/); if (!m) return;      // admite también enlaces antiguos «id.día» e «i-idea»
    const ids = m[1] ? (ideaById[m[2]]?.stops || []) : [m[2]];
    ids.forEach(id => { if (byId[id] && !out.includes(id)) out.push(id); });
  });
  return out;
}
const planLink = () => SITE + '#plan=' + encodePlan(state.plan);
function syncAddButtons(){
  document.querySelectorAll('.add[data-plan]').forEach(b => { const id = b.dataset.plan, on = inPlan(id);
    b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', (on ? 'Quitar de mi plan' : 'Añadir a mi plan') + ': ' + byId[id].name); b.innerHTML = on ? ICON.check : ICON.plus; });
  document.querySelectorAll('[data-addidea]').forEach(b => { const all = ideaById[b.dataset.addidea].stops.every(inPlan);
    b.setAttribute('aria-pressed', all); b.innerHTML = all ? ICON.check + 'En mi plan' : ICON.plus + 'Añadir al plan'; });
}
function togglePlace(id){
  const i = state.plan.indexOf(id);
  i >= 0 ? state.plan.splice(i, 1) : state.plan.push(id);
  savePlan(); syncAddButtons(); renderPlan();
  toast(inPlan(id) ? 'Añadido a «Mi plan»' : 'Quitado de «Mi plan»');
}
function toggleIdea(iid){
  const stops = ideaById[iid].stops, all = stops.every(inPlan);
  if (all) state.plan = state.plan.filter(id => !stops.includes(id)); else stops.forEach(id => { if (!inPlan(id)) state.plan.push(id); });
  savePlan(); syncAddButtons(); renderPlan(); toast(all ? 'Idea quitada de «Mi plan»' : 'Idea añadida a «Mi plan»');
}
function renderPlan(){
  savePlan();
  if (!state.plan.length){
    $('#planBody').innerHTML = '<div class="plan-empty">Todavía está vacío. Tocad <b>+</b> en cualquier lugar o «Añadir al plan» en una idea.</div>';
    $('#planActs').innerHTML = ''; return;
  }
  $('#planBody').innerHTML = `<ol class="plan-list" id="planList">${state.plan.map((id, i) => { const p = byId[id];
    const early = p.close && p.close.filter(x => x != null).every(x => x <= 17) ? ` · cierra a las ${hh(Math.max(...p.close.filter(x => x != null)))}` : '';
    return `<li class="pl" data-id="${id}"><button class="handle" type="button" aria-label="Mover ${esc(p.name)} (flechas arriba y abajo)">${ICON.grip}</button><span class="num">${i+1}</span>
      <span class="tx"><button class="nm" type="button" data-card="${id}">${esc(p.name)}${p.poc ? STAR : ''}</button><span class="sub">${CATS[p.cat].label} · ${esc(p.dur)}${early}</span></span>
      <button class="rm" type="button" data-plan="${id}" aria-label="Quitar ${esc(p.name)}">×</button></li>`; }).join('')}</ol>`;
  const walkIds = state.plan.filter(id => byId[id].cat !== 'excursion');
  const route = gWalk(walkIds);
  const text = 'Nuestro plan para Zúrich:\n' + state.plan.map((id, i) => `${i+1}. ${byId[id].name}`).join('\n') + (route ? '\n\nRuta a pie: ' + route : '') + '\n\nAbrir el plan: ' + planLink();
  $('#planActs').innerHTML = `${route ? `<a class="btn pri" href="${route}" target="_blank" rel="noopener">${ICON.nav}Abrir ruta en Google Maps</a>` : ''}
    <a class="btn" href="${wa(text)}" target="_blank" rel="noopener">${ICON.wa}Compartir por WhatsApp</a>
    <button class="btn ghost" type="button" data-clearplan>Vaciar</button>
    ${walkIds.length > MAXSTOPS ? `<p class="note" style="width:100%">Google Maps admite como máximo ${MAXSTOPS} paradas: la ruta usa las ${MAXSTOPS} primeras.</p>` : walkIds.length > 4 ? '<p class="note" style="width:100%">En el móvil, Google Maps a veces muestra solo algunas paradas intermedias.</p>' : ''}`;
  initDrag();
}
/* arrastrar con el dedo o el ratón (Pointer Events) + flechas del teclado */
function initDrag(){
  const list = $('#planList'); if (!list) return;
  list.querySelectorAll('.handle').forEach(h => {
    h.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      const li = h.closest('.pl'); e.preventDefault(); li.classList.add('dragging');
      // escuchamos en window: mover el elemento en el DOM rompería la captura del puntero
      const move = ev => {
        ev.preventDefault();
        const sibs = [...list.children].filter(x => x !== li);
        const after = sibs.find(s => { const r = s.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; }) || null;
        if (li.nextElementSibling !== after) list.insertBefore(li, after);
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        li.classList.remove('dragging'); commitOrder(li.dataset.id); };
      window.addEventListener('pointermove', move, { passive:false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
    h.addEventListener('keydown', e => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return; e.preventDefault();
      const id = h.closest('.pl').dataset.id, i = state.plan.indexOf(id), j = e.key === 'ArrowUp' ? i - 1 : i + 1;
      if (j < 0 || j >= state.plan.length) return;
      [state.plan[i], state.plan[j]] = [state.plan[j], state.plan[i]]; renderPlan();
      document.querySelector(`.pl[data-id="${id}"] .handle`)?.focus(); toast(`Posición ${j + 1}`);
    });
  });
}
function commitOrder(focusId){
  const order = [...$('#planList').children].map(li => li.dataset.id);
  if (order.join() === state.plan.join()) return;
  state.plan = order; renderPlan(); document.querySelector(`.pl[data-id="${focusId}"] .handle`)?.focus();
}
function renderIncoming(){
  const inc = state.incoming;
  if (!inc){ $('#shareIn').innerHTML = ''; return; }
  $('#shareIn').innerHTML = `<div class="share-in" role="region" aria-label="Plan compartido"><strong>Os han compartido un plan</strong>
    <p>${inc.length} ${inc.length === 1 ? 'lugar' : 'lugares'}: ${esc(inc.slice(0, 5).map(id => byId[id].name).join(', '))}${inc.length > 5 ? '…' : ''}</p>
    <div class="plan-acts" style="margin-top:0"><button class="btn pri" type="button" data-inc="replace">Usar este plan</button><button class="btn" type="button" data-inc="merge">Añadir al mío</button><button class="btn" type="button" data-inc="ignore">Ignorar</button></div></div>`;
}

/* ================= tiempo en vivo, navegación, tema ================= */
const WMO = c => c===0?'despejado':c<=2?'algo nuboso':c===3?'cubierto':c<=48?'niebla':c<=57?'llovizna':c<=67?'lluvia':c<=77?'nieve':c<=82?'chubascos':c<=86?'chubascos de nieve':'tormenta';
async function weather(){
  try{
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${HB[0]}&longitude=${HB[1]}&current=temperature_2m,weather_code&timezone=Europe%2FZurich`);
    if (!r.ok) throw 0; const w = await r.json();
    $('#wxT').textContent = Math.round(w.current.temperature_2m) + '°';
    $('#wxD').textContent = `Ahora en Zúrich: ${WMO(w.current.weather_code)} (datos en vivo de Open-Meteo).`;
  }catch(e){ $('#wxD').textContent = 'Sin datos del tiempo ahora. Previsión: meteoswiss.admin.ch'; }
}
function navSpy(){
  const links = [...document.querySelectorAll('nav.top a')];
  const set = id => links.forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('on', on); on ? a.setAttribute('aria-current','true') : a.removeAttribute('aria-current'); });
  const zones = [['momentos','descubrir'],['lomejor','descubrir'],['lista','descubrir'],['ideas','ideas'],['plan','plan'],['info','plan']];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(zones.find(z => z[0] === e.target.id)[1]); }), { rootMargin:'-40% 0px -55% 0px' });
  zones.forEach(([id]) => io.observe(document.getElementById(id)));
  set('descubrir');
}
function theme(){
  const root = document.documentElement, t = store.get('zh-theme', null);
  if (t) root.dataset.theme = t;
  $('#themeBtn').onclick = () => { const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark'; store.set('zh-theme', root.dataset.theme); };
}

/* ================= eventos ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('button, a'); if (!t) return;
  const ds = t.dataset;
  if (ds.tab){ state.tab = ds.tab; state.sub = null; refresh(); }
  else if (ds.sub){ state.sub = state.sub === ds.sub ? null : ds.sub; refresh(); }
  else if (ds.goto){ goTo(ds.goto); }
  else if (t.id === 'mapBtn'){ $('#mapbox').hidden ? openMap() : closeMap(); }
  else if (t.id === 'nearBtn'){ nearMe(); }
  else if (t.id === 'offBtn'){ nearOffice(); }
  else if (ds.more){ toggleMore(ds.more); }
  else if (ds.showmap){ showOnMap(ds.showmap); }
  else if (ds.card){ e.preventDefault(); openCard(ds.card); }
  else if (ds.plan){ togglePlace(ds.plan); }
  else if (ds.addidea){ toggleIdea(ds.addidea); }
  else if (ds.clearplan !== undefined){ if (confirm('¿Vaciar «Mi plan»?')){ state.plan = []; savePlan(); syncAddButtons(); renderPlan(); } }
  else if (ds.inc){
    if (ds.inc === 'replace') state.plan = state.incoming;
    if (ds.inc === 'merge') state.incoming.forEach(id => { if (!inPlan(id)) state.plan.push(id); });
    if (ds.inc !== 'ignore') toast('Plan actualizado');
    state.incoming = null; history.replaceState(null, '', '#plan'); savePlan(); syncAddButtons(); renderIncoming(); renderPlan();
  }
});

/* ================= enlaces profundos (incluidos los antiguos) ================= */
const ALIAS = { '#hoy':'#descubrir', '#lugares':'#lista', '#mapa':'#lista', '#esencial':'#lomejor', '#seleccion':'#lomejor', '#favoritos':'#lomejor', '#navidad':'#calFold', '#rutas':'#ideas', '#semana':'#ideas', '#excursiones':'#lista', '#comer':'#lista', '#bienvenida':'#descubrir' };
function handleHash(instant){
  try { route(instant); } catch (e) { /* un enlace raro no debe romper la página */ }
}
function route(instant){
  let h = location.hash;
  try { h = decodeURIComponent(h); } catch (e) { return; }
  if (h.startsWith('#plan=')){ const inc = decodePlan(h.slice(6)); if (inc.length){ state.incoming = inc; renderIncoming(); setTimeout(() => $('#plan').scrollIntoView(), 60); } return; }
  if (h.startsWith('#p-') && byId[h.slice(3)]) return setTimeout(() => openCard(h.slice(3), instant), 60);
  if (h.startsWith('#idea-') && ideaById[h.slice(6)]){ if (!TOP_IDEAS.includes(h.slice(6))) $('#ideasMore').open = true; return setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView(), 60); }
  if (h === '#mapa') openMap();
  if (h === '#comer'){ state.tab = 'comer'; refresh(); }
  if (h === '#excursiones'){ state.tab = 'excursiones'; refresh(); }
  if (h === '#navidad') $('#calFold').open = true;
  h = ALIAS[h] || h;
  const el = h.length > 1 && document.getElementById(h.slice(1));
  if (el) setTimeout(() => el.scrollIntoView(), 60);
}

/* ================= inicio ================= */
(function init(){
  $('#szuNote').textContent = SZU_NOTE;
  $('#checked').textContent = `Datos comprobados por última vez el ${TRIP.checked}.`;
  theme();
  renderMoments(); renderFavs(); refresh(); renderCal(); renderIdeas(); renderPlan(); renderIncoming();
  document.documentElement.classList.add('ready');
  window.addEventListener('hashchange', () => handleHash(false));
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  weather(); navSpy();
  handleHash(true);
})();
