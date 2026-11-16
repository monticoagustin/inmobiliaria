// Visor de recorridos 3D. Un solo visor para todas las propiedades:
// lee properties/<id>.json (?p=<id>, por defecto casa-oreja) y carga los GLB horneados.
// Coordenadas de la config: las de Blender (X ancho, Y fondo, Z altura), en metros.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const b2t = (x, y, z) => new THREE.Vector3(x, z, -y); // Blender → three (Y arriba)
const $ = (id) => document.getElementById(id);
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const params = new URLSearchParams(location.search);
const idProp = (params.get('p') || 'casa-oreja').replace(/[^a-z0-9-]/gi, '');
const embebido = params.has('embed') || window.self !== window.top;
if (embebido) document.body.classList.add('embebido');

const estado = { modo: 'recorrido', punto: null, yaw: 0, pitch: 0, fov: 70, corte: 'pb', cargado: false };
window.__visor = estado; // para pruebas automáticas
Object.defineProperty(estado, 'cam', { value: null, writable: true, enumerable: false });

const canvas = $('escena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // la luz ya viene horneada y tonemapeada
renderer.localClippingEnabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
estado.cam = camera;
camera.rotation.order = 'YXZ';
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false; orbit.enableDamping = true; orbit.enableZoom = !embebido;
canvas.addEventListener('pointerdown', () => { estado.activo = true; orbit.enableZoom = true; }); orbit.maxPolarAngle = Math.PI * 0.48; orbit.minDistance = 6; orbit.maxDistance = 60;

const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
const marcadores = new THREE.Group(); scene.add(marcadores);
let cfg, puntos = {};
let cargaResto = Promise.resolve();
const plantasCargadas = new Set(['Exterior']);
const plantaDe = (f) => (/_pa/.test(f) ? 'Planta alta' : /_pb/.test(f) ? 'Planta baja' : 'Exterior');
const colision = [];
function agregarModelo(g) {
  g.scene.traverse((o) => {
    if (o.isMesh) { o.material.side = THREE.DoubleSide; o.material.clippingPlanes = [corte]; colision.push(o); }
  });
  scene.add(g.scene);
}

// ---------- carga ----------
async function iniciar() {
  cfg = await (await fetch(`properties/${idProp}.json`)).json();
  document.documentElement.style.setProperty('--acento', cfg.marca?.color || '#2f6f5e');
  document.title = `${cfg.nombre} · Recorrido 3D`;
  $('marca-nombre').textContent = cfg.nombre;
  $('marca-sub').textContent = cfg.subtitulo || '';
  scene.background = new THREE.Color(cfg.cielo || '#cfe0f2');
  crearEntorno(cfg.entorno);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, hechos, total) => {
    const p = Math.round((hechos / total) * 100);
    $('barra').style.width = p + '%'; $('carga-texto').textContent = p + ' %';
  };
  const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
  const base = cfg.carpeta;
  const cargar = (f) => loader.loadAsync(base + f);
  // primero el exterior y la planta donde arranca el recorrido; el resto en segundo plano
  const inicialId = (location.hash.match(/punto=([\w-]+)/) || [])[1];
  const pIni = cfg.puntos.find((p) => p.id === inicialId) || cfg.puntos.find((p) => p.id === cfg.inicio);
  const esAlta = pIni && pIni.planta === 'Planta alta';
  const prioridad = (f) => (/exterior/.test(f) ? 0 : (esAlta ? /_pa/.test(f) : /_pb/.test(f)) ? 1 : 2);
  const orden = [...cfg.modelos].sort((a, b) => prioridad(a) - prioridad(b));
  const nIni = cfg.cargaInicial || orden.length;
  const [modelos, vidrios] = await Promise.all([
    Promise.all(orden.slice(0, nIni).map((f) => cargar(f).then((g) => { plantasCargadas.add(plantaDe(f)); return g; }))),
    Promise.all((cfg.vidrios || []).map(cargar)),
  ]);
  modelos.forEach(agregarModelo);
  for (const g of vidrios) {
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const agua = /agua/i.test(o.material.name);
      o.material = new THREE.MeshBasicMaterial({
        color: agua ? 0x4fb3c6 : 0xd6e6ec, transparent: true, opacity: agua ? 0.78 : 0.16,
        depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [corte],
      });
      o.renderOrder = 2;
      if (!agua) colision.push(o);
    });
    scene.add(g.scene);
  }
  // el resto (p. ej. planta alta) se carga en segundo plano, ya con el recorrido andando
  const resto = orden.slice(nIni);
  if (resto.length) {
    $('carga-fondo').hidden = false; $('carga-fondo').textContent = esAlta ? 'Cargando planta baja…' : 'Cargando planta alta…';
    const l2 = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    cargaResto = Promise.all(resto.map((f) => l2.loadAsync(base + f).then((g) => { plantasCargadas.add(plantaDe(f)); return g; }))).then((gs) => {
      gs.forEach(agregarModelo); estado.completo = true; $('carga-fondo').hidden = true;
    });
  } else estado.completo = true;
  crearPuntos();
  armarLista();
  armarMinimapa();
  armarEtiquetas();
  estado.cargado = true;
  $('carga').classList.add('oculto');
  const inicial = (location.hash.match(/punto=([\w-]+)/) || [])[1];
  irA(puntos[inicial] ? inicial : cfg.inicio, true);
  estado.cargadoInicio = true;
}

function crearEntorno(e) {
  if (!e) return;
  const [x0, x1, y0, y1] = e.lotes, s = 160;
  const mat = new THREE.MeshBasicMaterial({ color: e.color, clippingPlanes: [corte] });
  // marco alrededor de los lotes: no tapa la pileta ni el terreno horneado
  for (const [a0, a1, c0, c1] of [[-s, x0, -s, s], [x1, s, -s, s], [x0, x1, -s, y0], [x0, x1, y1, s]]) {
    const g = new THREE.PlaneGeometry(a1 - a0, c1 - c0);
    const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2;
    m.position.copy(b2t((a0 + a1) / 2, (c0 + c1) / 2, -0.02)); scene.add(m);
  }
}

// ---------- puntos de recorrido ----------
const geoAro = new THREE.RingGeometry(0.22, 0.30, 40);
const geoCentro = new THREE.CircleGeometry(0.22, 40);
function crearPuntos() {
  for (const p of cfg.puntos) {
    puntos[p.id] = p;
    const g = new THREE.Group();
    const aro = new THREE.Mesh(geoAro, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false }));
    const centro = new THREE.Mesh(geoCentro, new THREE.MeshBasicMaterial({ color: p.ir ? cfg.marca?.color || 0x2f6f5e : 0xffffff, transparent: true, opacity: p.ir ? 0.85 : 0.28, depthTest: false }));
    aro.renderOrder = centro.renderOrder = 5;
    g.add(aro, centro); g.rotation.x = -Math.PI / 2;
    g.position.copy(b2t(p.pos[0], p.pos[1], p.piso + 0.03));
    g.userData.punto = p.id; aro.userData.punto = p.id; centro.userData.punto = p.id;
    marcadores.add(g); p.marcador = g;
  }
}
const nivel = (p) => (p.planta === 'Planta alta' ? 'alta' : 'baja');
function actualizarMarcadores() {
  const actual = puntos[estado.punto];
  const yo = posBlender(); const miNivel = actual ? nivel(actual) : (yo.z > 3.6 ? 'alta' : 'baja');
  for (const p of Object.values(puntos)) {
    const visible = estado.modo === 'recorrido' && (!actual || p.id !== actual.id) && nivel(p) === miNivel &&
      Math.hypot(p.pos[0] - yo.x, p.pos[1] - yo.y) < 22;
    p.marcador.visible = visible;
  }
}

function posBlender() { const c = camera.position; return { x: c.x, y: -c.z, z: c.y }; }
function ojo(p) { return b2t(p.pos[0], p.pos[1], p.piso + (cfg.alturaOjo || 1.55)); }
function angulosHacia(desde, p) {
  if (!p.mirar) return { yaw: estado.yaw, pitch: 0 };
  const d = b2t(...p.mirar).sub(desde);
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}

let anim = null;
window.addEventListener('hashchange', () => {
  const id = (location.hash.match(/punto=([\w-]+)/) || [])[1];
  if (id && id !== estado.punto && estado.cargado) irA(id);
});
function irA(id, instantaneo = false) {
  let p = puntos[id]; if (!p) return;
  if (p.ir) p = puntos[p.ir];
  if (!plantasCargadas.has(p.planta)) {
    mostrarEtiqueta('Cargando…'); cargaResto.then(() => irA(p.id, instantaneo)); return;
  }
  if (estado.modo !== 'recorrido') ponerModo('recorrido', true);
  const destino = ojo(p);
  const ang = angulosHacia(destino, p);
  estado.punto = p.id; estado.piso = p.piso; estado.pisoObjetivo = p.piso;
  history.replaceState(null, '', `#punto=${p.id}`);
  mostrarEtiqueta(p.nombre + (p.m2 ? ` · ${p.m2.toLocaleString('es-AR')} m²` : ''));
  if (instantaneo || reducirMovimiento) {
    camera.position.copy(destino); estado.yaw = ang.yaw; estado.pitch = ang.pitch; anim = null;
  } else {
    // si es un salto largo o de planta, giramos hacia el ambiente; si es corto, mantenemos la mirada
    const cambiaPlanta = nivel(p) !== nivel(puntos[estado.anterior] || p);
    const lejos = camera.position.distanceTo(destino) > 6 || cambiaPlanta;
    anim = { t: 0, dur: cambiaPlanta ? 1.3 : 0.9, desde: camera.position.clone(), hasta: destino,
             yaw0: estado.yaw, pitch0: estado.pitch, yaw1: lejos ? ang.yaw : estado.yaw, pitch1: lejos ? ang.pitch : estado.pitch };
  }
  estado.anterior = p.id;
  actualizarMarcadores();
}
const suave = (t) => t * t * (3 - 2 * t);
function difAng(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

let tEtiqueta;
function mostrarEtiqueta(txt) {
  const e = $('etiqueta'); e.textContent = txt; e.classList.add('visible');
  clearTimeout(tEtiqueta); tEtiqueta = setTimeout(() => e.classList.remove('visible'), 1800);
}

// ---------- interacción: mirar alrededor, tocar puntos, zoom ----------
const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
let arrastre = null; const toques = new Map();
canvas.addEventListener('pointerdown', (e) => {
  toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (estado.modo !== 'recorrido') return;
  canvas.setPointerCapture(e.pointerId);
  arrastre = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, movio: false, d0: null, fov0: estado.fov };
  canvas.classList.add('arrastrando'); ocultarAyuda(); estado.activo = true;
});
canvas.addEventListener('pointermove', (e) => {
  if (toques.has(e.pointerId)) toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (estado.modo !== 'recorrido') return;
  if (!arrastre) { hover(e); return; }
  if (toques.size === 2) { // pellizco = zoom
    const [a, b] = [...toques.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (arrastre.d0 == null) arrastre.d0 = d;
    estado.fov = THREE.MathUtils.clamp(arrastre.fov0 * (arrastre.d0 / d), 35, 85); arrastre.movio = true; return;
  }
  const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
  arrastre.x = e.clientX; arrastre.y = e.clientY;
  if (Math.hypot(e.clientX - arrastre.x0, e.clientY - arrastre.y0) > 6) arrastre.movio = true;
  const k = (estado.fov / 70) * 0.0042;
  estado.yaw += dx * k; estado.pitch = THREE.MathUtils.clamp(estado.pitch + dy * k, -1.2, 1.2);
  if (anim) { anim.yaw1 = estado.yaw; anim.pitch1 = estado.pitch; }
});
function finArrastre(e) {
  toques.delete(e.pointerId);
  if (estado.modo !== 'recorrido' || !arrastre) return;
  if (!arrastre.movio && toques.size === 0) tocar(e);
  if (toques.size === 0) { arrastre = null; canvas.classList.remove('arrastrando'); }
}
canvas.addEventListener('pointerup', finArrastre);
canvas.addEventListener('pointercancel', finArrastre);
canvas.addEventListener('wheel', (e) => {
  if (estado.modo !== 'recorrido') return;
  if (embebido && !estado.activo) return; // dentro de otra página: no secuestrar el scroll
  e.preventDefault(); estado.fov = THREE.MathUtils.clamp(estado.fov + e.deltaY * 0.03, 35, 85);
}, { passive: false });

function puntoBajo(e) {
  const r = canvas.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const vis = marcadores.children.filter((g) => g.visible);
  const hit = ray.intersectObjects(vis, true)[0];
  return hit ? hit.object.userData.punto : null;
}
function tocar(e) { const id = puntoBajo(e); if (id) irA(id); }
let hoverId = null;
function hover(e) {
  const id = puntoBajo(e);
  if (id === hoverId) return;
  if (hoverId) puntos[hoverId].marcador.scale.setScalar(1);
  hoverId = id; canvas.style.cursor = id ? 'pointer' : '';
  if (id) puntos[id].marcador.scale.setScalar(1.25);
}

// ---------- caminata libre: W A S D / flechas / joystick, con colisiones y escalera ----------
const teclas = new Set();
const mapa = { KeyW: 'ad', ArrowUp: 'ad', KeyS: 'at', ArrowDown: 'at', KeyA: 'iz', KeyD: 'de', ArrowLeft: 'gi', ArrowRight: 'gd', ShiftLeft: 'rap', ShiftRight: 'rap' };
window.addEventListener('keydown', (e) => {
  if (estado.modo !== 'recorrido' || !mapa[e.code]) return;
  teclas.add(mapa[e.code]); e.preventDefault(); ocultarAyuda();
});
window.addEventListener('keyup', (e) => { if (mapa[e.code]) teclas.delete(mapa[e.code]); });
window.addEventListener('blur', () => teclas.clear());
const joy = { x: 0, y: 0, id: null };
{
  const j = $('joystick'), k = $('joy-perilla');
  const mover = (e) => {
    const r = j.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), max = r.width / 2 - 10;
    if (m > max) { dx *= max / m; dy *= max / m; }
    joy.x = dx / max; joy.y = dy / max; k.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  j.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; j.setPointerCapture(e.pointerId); mover(e); ocultarAyuda(); e.stopPropagation(); });
  j.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) mover(e); });
  const fin = (e) => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; k.style.transform = ''; };
  j.addEventListener('pointerup', fin); j.addEventListener('pointercancel', fin);
}
const rayM = new THREE.Raycaster(); rayM.far = 4;
const ABAJO = new THREE.Vector3(0, -1, 0);
function bloqueado(desde, dir, dist) {
  const ojoAlt = desde.clone();
  for (const h of [0.55, 1.1]) { // rodilla (sobre dos alzadas de escalera) y pecho, desde el piso
    const o = ojoAlt.clone(); o.y = estado.piso + h;
    rayM.set(o, dir); rayM.far = dist + 0.3;
    if (rayM.intersectObjects(colision, false).length) return true;
  }
  return false;
}
function pisoBajo(pos) {
  const o = pos.clone(); o.y = estado.piso + 0.55; // un poco arriba del piso actual: detecta escalones de subida
  rayM.set(o, ABAJO); rayM.far = 4;
  const h = rayM.intersectObjects(colision, false)[0];
  return h ? h.point.y : null;
}
function caminar(dt) {
  const ad = (teclas.has('ad') ? 1 : 0) - (teclas.has('at') ? 1 : 0) - joy.y;
  const la = (teclas.has('de') ? 1 : 0) - (teclas.has('iz') ? 1 : 0);
  const gi = (teclas.has('gi') ? 1 : 0) - (teclas.has('gd') ? 1 : 0) - joy.x * 0.9;
  if (Math.abs(gi) > 0.02) estado.yaw += gi * dt * 1.6;
  if (Math.abs(ad) < 0.05 && Math.abs(la) < 0.05) return false;
  if (estado.piso == null) estado.piso = camera.position.y - (cfg.alturaOjo || 1.55);
  const vel = (teclas.has('rap') ? 3.0 : 1.5) * dt;
  const fr = new THREE.Vector3(-Math.sin(estado.yaw), 0, -Math.cos(estado.yaw));
  const de = new THREE.Vector3(fr.z * -1, 0, fr.x);
  const paso = fr.multiplyScalar(ad * vel).add(de.multiplyScalar(la * vel));
  // deslizar contra las paredes: probar el movimiento completo, después cada eje
  for (const intento of [paso, new THREE.Vector3(paso.x, 0, 0), new THREE.Vector3(0, 0, paso.z)]) {
    const d = intento.length(); if (d < 1e-5) continue;
    if (bloqueado(camera.position, intento.clone().normalize(), d)) continue;
    const nueva = camera.position.clone().add(intento);
    const y = pisoBajo(nueva);
    if (y == null || Math.abs(y - estado.piso) > 0.45) continue; // sin piso, escalón alto o caída (pileta, hueco)
    camera.position.copy(nueva); estado.pisoObjetivo = y;
    break;
  }
  if (estado.punto) { estado.punto = null; history.replaceState(null, '', location.pathname + location.search); }
  return true;
}

// ---------- modos: recorrido / maqueta ----------
function ponerModo(m, silencioso = false) {
  estado.modo = m;
  document.querySelectorAll('#modos .chip').forEach((b) => b.classList.toggle('activo', b.dataset.modo === m));
  $('plantas').hidden = m !== 'maqueta';
  if (m === 'maqueta') {
    orbit.enabled = true; renderer.localClippingEnabled = true; anim = null;
    const c = b2t(...cfg.maqueta.centro); orbit.target.copy(c);
    camera.fov = 45; camera.updateProjectionMatrix();
    camera.position.copy(c).add(new THREE.Vector3(-0.55, 0.75, 0.7).normalize().multiplyScalar(cfg.maqueta.distancia));
    ponerCorte(estado.corte);
    ocultarAyuda();
  } else {
    orbit.enabled = false; renderer.localClippingEnabled = false;
    if (!silencioso && estado.punto) irA(estado.punto, true);
  }
  actualizarMarcadores();
}
function ponerCorte(c) {
  estado.corte = c;
  document.querySelectorAll('#plantas .chip').forEach((b) => b.classList.toggle('activo', b.dataset.corte === c));
  corte.constant = c === 'pb' ? cfg.cortes.pb : c === 'pa' ? cfg.cortes.pa : 100;
}
document.querySelectorAll('#modos .chip').forEach((b) => b.addEventListener('click', () => ponerModo(b.dataset.modo)));
document.querySelectorAll('#plantas .chip').forEach((b) => b.addEventListener('click', () => ponerCorte(b.dataset.corte)));

// ---------- lista de ambientes ----------
function armarLista() {
  const ul = $('lista-ambientes'); ul.innerHTML = '';
  const grupos = {};
  for (const p of cfg.puntos) if (!p.soloMarcador) (grupos[p.planta] ||= []).push(p);
  for (const [g, ps] of Object.entries(grupos)) {
    const li = document.createElement('li'); li.className = 'grupo'; li.textContent = g; ul.appendChild(li);
    for (const p of ps) {
      const li2 = document.createElement('li'); const b = document.createElement('button');
      b.textContent = p.nombre + (p.m2 ? ` · ${p.m2.toLocaleString('es-AR')} m²` : '');
      b.addEventListener('click', () => { irA(p.id); toggleLista(false); });
      li2.appendChild(b); ul.appendChild(li2);
    }
  }
}
function toggleLista(v) {
  const ul = $('lista-ambientes'); const abrir = v ?? ul.hidden;
  ul.hidden = !abrir; $('btn-ambientes').setAttribute('aria-expanded', String(abrir));
}
$('btn-ambientes').addEventListener('click', () => toggleLista());

// ---------- minimapa (plano con la ubicación) ----------
const NS = 'http://www.w3.org/2000/svg';
const svg = $('minimapa'); let svgAmb = [], svgYo, svgCono;
const el = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
const sy = (y) => -y; // norte (fondo) arriba
function armarMinimapa() {
  const pl = cfg.plano; if (!pl) { svg.style.display = 'none'; return; }
  const [x0, x1, y0, y1] = pl.lote;
  svg.appendChild(el('rect', { class: 'lote', x: x0, y: sy(y1), width: x1 - x0, height: y1 - y0 }));
  for (const e of pl.exterior) { const [a, b, c, d] = e.r; svg.appendChild(el('rect', { class: 'ext ' + e.tipo, x: a, y: sy(d), width: b - a, height: d - c })); }
  for (const a of pl.ambientes) {
    const [x0, x1, y0, y1] = a.r; const g = el('g', {});
    const r = el('rect', { class: 'amb', x: x0, y: sy(y1), width: x1 - x0, height: y1 - y0 });
    const t = el('text', { x: (x0 + x1) / 2, y: sy((y0 + y1) / 2) }); t.textContent = (x1 - x0) > 1 ? a.nombre : '';
    g.append(r, t); g.dataset.planta = a.planta; if (a.punto) r.addEventListener('click', () => irA(a.punto));
    const ti = el('title', {}); ti.textContent = a.nombre + (a.m2 ? ` · ${a.m2} m²` : ''); r.appendChild(ti);
    svg.appendChild(g); svgAmb.push({ g, r, a });
  }
  svgCono = el('path', { class: 'cono' }); svgYo = el('circle', { class: 'yo', r: 0.28 });
  svg.append(svgCono, svgYo);
}
function actualizarMinimapa() {
  if (!svgYo) return;
  const yo = posBlender(); const maq = estado.modo === 'maqueta';
  const alta = maq ? estado.corte !== 'pb' : yo.z > 3.6;
  svgYo.style.display = maq ? 'none' : '';
  for (const { g, r, a } of svgAmb) {
    g.style.display = (a.planta === 'alta') === alta ? '' : 'none';
    r.classList.toggle('actual', !maq && yo.x > a.r[0] && yo.x < a.r[1] && yo.y > a.r[2] && yo.y < a.r[3]);
  }
  // ventana de 9 × 14 m que sigue a la cámara
  const W = 9.4, H = 14.4, [lx0, lx1, ly0, ly1] = cfg.plano.lote;
  const cy = maq ? 8.5 : THREE.MathUtils.clamp(yo.y, ly0 + H / 2 - 4, ly1 - H / 2 + 1);
  svg.setAttribute('viewBox', `${(lx0 + lx1) / 2 - W / 2} ${sy(cy) - H / 2} ${W} ${H}`);
  svgYo.setAttribute('cx', yo.x); svgYo.setAttribute('cy', sy(yo.y));
  const a = estado.yaw, L = 2.2, ap = 0.5; // dirección de la mirada en el plano
  const dir = (ang) => [yo.x - Math.sin(ang) * L, sy(yo.y + Math.cos(ang) * L)];
  const [p1, p2] = [dir(a - ap), dir(a + ap)];
  svgCono.setAttribute('d', `M${yo.x},${sy(yo.y)} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`);
  svgCono.style.display = estado.modo === 'recorrido' ? '' : 'none';
}

// ---------- etiquetas de ambientes en la maqueta ----------
let etiquetas = [];
function armarEtiquetas() {
  const cont = $('etiquetas'); if (!cfg.plano) return;
  for (const a of cfg.plano.ambientes) {
    if ((a.r[1] - a.r[0]) < 1.2) continue;
    const b = document.createElement('button');
    b.innerHTML = a.nombre + (a.m2 ? `<small>${a.m2.toLocaleString('es-AR')} m²</small>` : '');
    if (a.punto) b.addEventListener('click', () => irA(a.punto));
    cont.appendChild(b);
    const z = a.planta === 'alta' ? 2.95 : 0.12;
    etiquetas.push({ b, a, pos: b2t((a.r[0] + a.r[1]) / 2, (a.r[2] + a.r[3]) / 2, z + 0.4) });
  }
}
const vTmp = new THREE.Vector3();
function actualizarEtiquetas() {
  const ver = estado.modo === 'maqueta';
  for (const e of etiquetas) {
    const deEstaPlanta = estado.corte === 'pb' ? e.a.planta === 'baja' : e.a.planta === 'alta';
    if (!ver || !deEstaPlanta) { e.b.style.display = 'none'; continue; }
    vTmp.copy(e.pos).project(camera);
    if (vTmp.z > 1) { e.b.style.display = 'none'; continue; }
    e.b.style.display = ''; e.b.style.left = ((vTmp.x + 1) / 2 * innerWidth) + 'px'; e.b.style.top = ((1 - vTmp.y) / 2 * innerHeight) + 'px';
  }
}

// ---------- compartir: link, WhatsApp e inserción ----------
function urlBase() { const u = new URL(location.href); u.hash = ''; u.searchParams.delete('embed'); if (idProp !== 'casa-oreja') u.searchParams.set('p', idProp); return u.toString().replace(/\?$/, ''); }
function abrirCompartir() {
  const link = urlBase() + (estado.punto ? `#punto=${estado.punto}` : '');
  const u = new URL(urlBase()); u.searchParams.set('p', idProp); u.searchParams.set('embed', '1');
  $('txt-link').value = link;
  $('txt-embed').value = `<iframe src="${u}" title="Recorrido 3D · ${cfg.nombre}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" allow="fullscreen" allowfullscreen loading="lazy"></iframe>`;
  $('lnk-whatsapp').href = 'https://wa.me/?text=' + encodeURIComponent(`Mirá el recorrido 3D: ${cfg.nombre} ${link}`);
  $('compartir').hidden = false; $('cerrar-compartir').focus();
}
$('btn-compartir').addEventListener('click', abrirCompartir);
$('cerrar-compartir').addEventListener('click', () => { $('compartir').hidden = true; $('btn-compartir').focus(); });
$('compartir').addEventListener('click', (e) => { if (e.target.id === 'compartir') $('compartir').hidden = true; });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('compartir').hidden = true; });
document.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
  const t = $(b.dataset.copiar); t.select();
  try { await navigator.clipboard.writeText(t.value); } catch { document.execCommand('copy'); }
  const txt = b.textContent; b.textContent = 'Copiado'; setTimeout(() => (b.textContent = txt), 1500);
}));
// pantalla completa (útil sobre todo insertado)
if (document.fullscreenEnabled) {
  $('btn-pantalla').hidden = !embebido;
  $('btn-pantalla').addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()));
}

let ayudaOculta = false;
function ocultarAyuda() { if (!ayudaOculta) { ayudaOculta = true; $('ayuda').classList.add('oculto'); } }
if (matchMedia('(pointer: coarse)').matches) $('ayuda').textContent = 'Arrastrá para mirar · usá el joystick para caminar';
setTimeout(ocultarAyuda, 9000);

// ---------- bucle ----------
function ajustar() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', ajustar); ajustar();
const reloj = new THREE.Timer();
renderer.setAnimationLoop(() => {
  reloj.update(); const dt = Math.min(reloj.getDelta(), 0.05);
  if (estado.modo === 'recorrido') {
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / anim.dur); const s = suave(anim.t);
      camera.position.lerpVectors(anim.desde, anim.hasta, s);
      estado.yaw = anim.yaw0 + difAng(anim.yaw0, anim.yaw1) * s;
      estado.pitch = anim.pitch0 + (anim.pitch1 - anim.pitch0) * s;
      if (anim.t >= 1) anim = null;
    }
    if (!anim && estado.cargado) {
      const movio = caminar(dt);
      if (estado.pisoObjetivo != null && estado.piso != null) {
        const dif = estado.pisoObjetivo - estado.piso;
        estado.piso += Math.abs(dif) < 0.005 ? dif : dif * Math.min(1, dt * 10);
        camera.position.y = estado.piso + (cfg.alturaOjo || 1.55);
      }
      if (movio) actualizarMarcadores();
    }
    const fovBase = camera.aspect < 0.8 ? estado.fov + 8 : estado.fov; // celular vertical: más campo
    if (camera.fov !== fovBase) { camera.fov = fovBase; camera.updateProjectionMatrix(); }
    camera.rotation.set(estado.pitch, estado.yaw, 0);
  } else {
    orbit.update();
  }
  actualizarMinimapa(); actualizarEtiquetas();
  renderer.render(scene, camera);
});

iniciar().catch((err) => {
  console.error(err);
  $('carga-titulo').textContent = 'No se pudo cargar el recorrido';
  $('carga-texto').textContent = String(err.message || err);
});
