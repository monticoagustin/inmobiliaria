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

const estado = { modo: 'recorrido', punto: null, yaw: 0, pitch: 0, fov: 70, corte: 'pb', cargado: false };
window.__visor = estado; // para pruebas automáticas

const canvas = $('escena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // la luz ya viene horneada y tonemapeada
renderer.localClippingEnabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
camera.rotation.order = 'YXZ';
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false; orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI * 0.48; orbit.minDistance = 6; orbit.maxDistance = 60;

const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
const marcadores = new THREE.Group(); scene.add(marcadores);
let cfg, puntos = {};

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
  const [modelos, vidrios] = await Promise.all([
    Promise.all(cfg.modelos.map(cargar)),
    Promise.all((cfg.vidrios || []).map(cargar)),
  ]);
  for (const g of modelos) {
    g.scene.traverse((o) => {
      if (o.isMesh) { o.material.side = THREE.DoubleSide; o.material.clippingPlanes = [corte]; }
    });
    scene.add(g.scene);
  }
  for (const g of vidrios) {
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const agua = /agua/i.test(o.material.name);
      o.material = new THREE.MeshBasicMaterial({
        color: agua ? 0x4fb3c6 : 0xd6e6ec, transparent: true, opacity: agua ? 0.78 : 0.16,
        depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [corte],
      });
      o.renderOrder = 2;
    });
    scene.add(g.scene);
  }
  crearPuntos();
  armarLista();
  estado.cargado = true;
  $('carga').classList.add('oculto');
  const inicial = (location.hash.match(/punto=([\w-]+)/) || [])[1];
  irA(puntos[inicial] ? inicial : cfg.inicio, true);
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
  for (const p of Object.values(puntos)) {
    const visible = estado.modo === 'recorrido' && actual && p.id !== actual.id && nivel(p) === nivel(actual) &&
      Math.hypot(p.pos[0] - actual.pos[0], p.pos[1] - actual.pos[1]) < 22;
    p.marcador.visible = visible;
  }
}

function ojo(p) { return b2t(p.pos[0], p.pos[1], p.piso + (cfg.alturaOjo || 1.55)); }
function angulosHacia(desde, p) {
  if (!p.mirar) return { yaw: estado.yaw, pitch: 0 };
  const d = b2t(...p.mirar).sub(desde);
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}

let anim = null;
function irA(id, instantaneo = false) {
  let p = puntos[id]; if (!p) return;
  if (p.ir) p = puntos[p.ir];
  if (estado.modo !== 'recorrido') ponerModo('recorrido', true);
  const destino = ojo(p);
  const ang = angulosHacia(destino, p);
  estado.punto = p.id;
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
  canvas.classList.add('arrastrando'); ocultarAyuda();
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

// teclado: flechas para mirar
window.addEventListener('keydown', (e) => {
  if (estado.modo !== 'recorrido') return;
  const k = 0.08;
  if (e.key === 'ArrowLeft') estado.yaw += k; else if (e.key === 'ArrowRight') estado.yaw -= k;
  else if (e.key === 'ArrowUp') estado.pitch = Math.min(1.2, estado.pitch + k);
  else if (e.key === 'ArrowDown') estado.pitch = Math.max(-1.2, estado.pitch - k);
});

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

let ayudaOculta = false;
function ocultarAyuda() { if (!ayudaOculta) { ayudaOculta = true; $('ayuda').classList.add('oculto'); } }
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
    const fovBase = camera.aspect < 0.8 ? estado.fov + 8 : estado.fov; // celular vertical: más campo
    if (camera.fov !== fovBase) { camera.fov = fovBase; camera.updateProjectionMatrix(); }
    camera.rotation.set(estado.pitch, estado.yaw, 0);
  } else {
    orbit.update();
  }
  renderer.render(scene, camera);
});

iniciar().catch((err) => {
  console.error(err);
  $('carga-titulo').textContent = 'No se pudo cargar el recorrido';
  $('carga-texto').textContent = String(err.message || err);
});
