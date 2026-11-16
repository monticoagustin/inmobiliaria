// Visor de recorridos 3D. Un solo visor para todas las propiedades:
// lee properties/<id>.json (?p=<id>, por defecto casa-oreja) y carga los GLB horneados.
// Coordenadas de la config: las de Blender (X ancho, Y fondo, Z altura), en metros.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createIcons, List, Share2, Maximize, ChevronDown, ChevronLeft, ChevronRight, Eye, Box, X, Copy, MessageCircle } from 'lucide';
createIcons({ icons: { List, Share2, Maximize, ChevronDown, ChevronLeft, ChevronRight, Eye, Box, X, Copy, MessageCircle } });

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
// superficies que reflejan: rugosidad e intensidad por material (nombre del material de Blender)
const REFLEJA = [
  [/^Porcelanato_Gris/, 0.16, 1.4], [/^Porcelanato_Cemento/, 0.24, 1.2], [/^Porcelanato_Exterior/, 0.45, 0.6],
  [/^Piso_Flotante/, 0.34, 1.0], [/^Mesada/, 0.14, 1.3], [/^Azulejo/, 0.06, 1.4], [/^Vidrio_Negro/, 0.04, 1.6],
  [/^Acero/, 0.22, 1.6], [/^Aluminio/, 0.28, 1.0], [/^Loza/, 0.08, 1.2], [/^Puerta_Placa/, 0.5, 0.35],
  [/^Placard/, 0.36, 0.8], [/^Cocina_Melamina/, 0.38, 0.8], [/^Madera_Escalera/, 0.36, 0.8],
];
const sinReflejos = new URLSearchParams(location.search).has('sinreflejos'); // para comparar en QA
const reflectivos = []; let envRT = null; let pmrem = null;
let cargaResto = Promise.resolve();
const plantasCargadas = new Set(['Exterior']);
const plantaDe = (f) => (/_pa/.test(f) ? 'Planta alta' : /_pb/.test(f) ? 'Planta baja' : 'Exterior');
const colision = [];
function agregarModelo(g) {
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const regla = REFLEJA.find(([re]) => re.test(o.material.name || ''));
    if (regla && !sinReflejos && o.geometry.attributes.normal) {
      const base = o.material;
      o.material = new THREE.MeshStandardMaterial({
        name: base.name, color: 0x000000, emissive: 0xffffff, emissiveMap: base.map,
        roughness: regla[1], metalness: 0, envMapIntensity: regla[2],
      });
      reflectivos.push(o.material);
    }
    for (const t of [o.material.map, o.material.emissiveMap]) if (t) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    o.material.side = THREE.DoubleSide; o.material.clippingPlanes = [corte]; colision.push(o);
  });
  scene.add(g.scene);
  if (envRT) for (const m of reflectivos) if (!m.envMap) { m.envMap = envRT.texture; m.needsUpdate = true; }
}
// captura del entorno desde la posición actual (6 vistas → PMREM); se rehace al llegar a cada punto
const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
const cubeCam = new THREE.CubeCamera(0.05, 200, cubeRT);
function capturarEntorno() {
  if (!reflectivos.length) return;
  pmrem ||= new THREE.PMREMGenerator(renderer);
  const vis = marcadores.visible; marcadores.visible = false;
  const clip = renderer.localClippingEnabled; renderer.localClippingEnabled = false;
  for (const m of reflectivos) m.visible = true;
  cubeCam.position.copy(camera.position); cubeCam.update(renderer, scene);
  const nuevo = pmrem.fromCubemap(cubeRT.texture);
  for (const m of reflectivos) { m.envMap = nuevo.texture; m.needsUpdate = true; }
  envRT?.dispose(); envRT = nuevo;
  marcadores.visible = vis; renderer.localClippingEnabled = clip;
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
      o.material = new THREE.MeshStandardMaterial({
        name: agua ? 'Agua' : 'Vidrio', color: 0x000000, emissive: agua ? 0x3a9fb4 : 0xbfd3da, emissiveIntensity: agua ? 0.9 : 0.12,
        roughness: 0.02, metalness: 0, envMapIntensity: agua ? 1.2 : 2.2, transparent: true, opacity: agua ? 0.85 : 0.22,
        depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [corte],
      });
      reflectivos.push(o.material);
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
      gs.forEach(agregarModelo); estado.completo = true; $('carga-fondo').hidden = true; capturarEntorno();
    });
  } else estado.completo = true;
  crearPuntos();
  armarLista();
  armarPisos();
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
function texturaMarcador(color, flecha) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const m = 128;
  const sombra = g.createRadialGradient(m, m, 70, m, m, 124); sombra.addColorStop(0, 'rgba(20,28,32,.35)'); sombra.addColorStop(1, 'rgba(20,28,32,0)');
  g.fillStyle = sombra; g.beginPath(); g.arc(m, m, 124, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(m, m, 92, 0, Math.PI * 2); g.fill();
  g.lineWidth = 12; g.strokeStyle = '#fff'; g.beginPath(); g.arc(m, m, 86, 0, Math.PI * 2); g.stroke();
  g.fillStyle = color; g.beginPath(); g.arc(m, m, flecha ? 58 : 24, 0, Math.PI * 2); g.fill();
  if (flecha) { // escalera: chevrons
    g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
    const d = flecha === 'subir' ? -1 : 1;
    for (const o of [-12, 16]) { g.beginPath(); g.moveTo(m - 22, m + o * d + 10 * d); g.lineTo(m, m + o * d - 12 * d); g.lineTo(m + 22, m + o * d + 10 * d); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const geoMarca = new THREE.PlaneGeometry(0.78, 0.78);
function crearPuntos() {
  const acento = cfg.marca?.color || '#2f6f5e';
  const tex = { normal: texturaMarcador(acento), subir: texturaMarcador(acento, 'subir'), bajar: texturaMarcador(acento, 'bajar') };
  for (const p of cfg.puntos) {
    puntos[p.id] = p;
    const tipo = p.ir ? (p.id.includes('bajar') ? 'bajar' : 'subir') : 'normal';
    const g = new THREE.Mesh(geoMarca, new THREE.MeshBasicMaterial({ map: tex[tipo], transparent: true, depthTest: false, depthWrite: false }));
    g.renderOrder = 5; g.rotation.x = -Math.PI / 2;
    g.position.copy(b2t(p.pos[0], p.pos[1], p.piso + 0.03));
    g.userData.punto = p.id; marcadores.add(g); p.marcador = g;
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
  if (instantaneo || reducirMovimiento) {
    camera.position.copy(destino); estado.yaw = ang.yaw; estado.pitch = ang.pitch; anim = null;
    requestAnimationFrame(capturarEntorno);
  } else {
    // si es un salto largo o de planta, giramos hacia el ambiente; si es corto, mantenemos la mirada
    const cambiaPlanta = nivel(p) !== nivel(puntos[estado.anterior] || p);
    const lejos = camera.position.distanceTo(destino) > 6 || cambiaPlanta;
    anim = { t: 0, dur: cambiaPlanta ? 1.3 : 0.9, desde: camera.position.clone(), hasta: destino,
             yaw0: estado.yaw, pitch0: estado.pitch, yaw1: lejos ? ang.yaw : estado.yaw, pitch1: lejos ? ang.pitch : estado.pitch };
  }
  estado.anterior = p.id;
  actualizarMarcadores(); actualizarBarra();
}
const suave = (t) => t * t * (3 - 2 * t);
function difAng(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

let tEtiqueta;
const recorridoOrden = () => cfg.puntos.filter((p) => !p.soloMarcador);
function actualizarBarra() {
  const p = puntos[estado.punto];
  document.querySelectorAll('#lista-ambientes button').forEach((b) => b.classList.toggle('actual', b.dataset.punto === estado.punto));
  $('plano-titulo').textContent = p && p.planta !== 'Exterior' ? p.planta : 'Terreno';
  $('amb-nombre').textContent = p ? p.nombre : cfg.nombre;
  $('amb-detalle').textContent = p ? (p.m2 ? `${p.planta} · ${p.m2.toLocaleString('es-AR')} m²` : p.planta) : '';
  document.querySelectorAll('#pisos .seg').forEach((b) => b.classList.toggle('activo', p && b.dataset.planta === p.planta));
}
function paso(d) {
  const lista = recorridoOrden(); const i = lista.findIndex((p) => p.id === estado.punto);
  irA(lista[(i + d + lista.length) % lista.length].id);
}
function armarPisos() {
  const cont = $('pisos'); const vistas = [];
  for (const p of recorridoOrden()) if (!vistas.includes(p.planta)) vistas.push(p.planta);
  for (const pl of vistas) {
    const b = document.createElement('button'); b.className = 'seg'; b.dataset.planta = pl;
    const corto = { 'Planta baja': 'PB', 'Planta alta': 'PA' }[pl] || pl;
    b.innerHTML = `<span class="largo">${pl}</span><span class="corto">${corto}</span>`; b.title = pl;
    b.addEventListener('click', () => irA(recorridoOrden().find((p) => p.planta === pl).id)); cont.appendChild(b);
  }
}
$('btn-ant').addEventListener('click', () => paso(-1));
$('btn-sig').addEventListener('click', () => paso(1));
$('btn-minimapa').addEventListener('click', () => {
  const pl = $('plano').classList.toggle('plegado');
  $('btn-minimapa').setAttribute('aria-pressed', String(!pl)); $('btn-minimapa').title = pl ? 'Mostrar plano' : 'Ocultar plano';
});
function mostrarEtiqueta(txt) { $('amb-detalle').textContent = txt; }

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
  // arrastrar mueve la vista hacia el mismo lado que el dedo/mouse (ejes invertidos a pedido)
  const k = (estado.fov / 70) * 0.0021;
  estado.yaw -= dx * k; estado.pitch = THREE.MathUtils.clamp(estado.pitch - dy * k, -1.2, 1.2);
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
  const id = puntoBajo(e); const tt = $('tooltip');
  if (id) { const p = puntos[id]; tt.textContent = p.nombre; tt.style.left = e.clientX + 'px'; tt.style.top = (e.clientY - 18) + 'px'; tt.hidden = false; }
  else tt.hidden = true;
  if (id === hoverId) return;
  hoverId = id; canvas.style.cursor = id ? 'pointer' : '';
}

// teclado: flechas para girar la cámara (no se camina libremente: solo puntos de recorrido)
window.addEventListener('keydown', (e) => {
  if (estado.modo !== 'recorrido' || e.target.closest?.('input,textarea')) return;
  const k = 0.08;
  if (e.key === 'ArrowLeft') estado.yaw += k; else if (e.key === 'ArrowRight') estado.yaw -= k;
  else if (e.key === 'ArrowUp') estado.pitch = Math.min(1.2, estado.pitch + k);
  else if (e.key === 'ArrowDown') estado.pitch = Math.max(-1.2, estado.pitch - k);
  else return;
  e.preventDefault(); ocultarAyuda();
});

// ---------- modos: recorrido / maqueta ----------
function ponerModo(m, silencioso = false) {
  estado.modo = m;
  document.querySelectorAll('#modos .seg').forEach((b) => b.classList.toggle('activo', b.dataset.modo === m));
  $('ficha').hidden = m === 'maqueta'; $('pisos').hidden = m === 'maqueta'; document.querySelector('#controles .separador').hidden = m === 'maqueta';
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
  document.querySelectorAll('#plantas .seg').forEach((b) => b.classList.toggle('activo', b.dataset.corte === c));
  corte.constant = c === 'pb' ? cfg.cortes.pb : c === 'pa' ? cfg.cortes.pa : 100;
}
document.querySelectorAll('#modos .seg').forEach((b) => b.addEventListener('click', () => ponerModo(b.dataset.modo)));
document.querySelectorAll('#plantas .seg').forEach((b) => b.addEventListener('click', () => ponerCorte(b.dataset.corte)));

// ---------- lista de ambientes ----------
function armarLista() {
  const ul = $('lista-ambientes'); ul.innerHTML = '';
  const grupos = {};
  for (const p of cfg.puntos) if (!p.soloMarcador) (grupos[p.planta] ||= []).push(p);
  for (const [g, ps] of Object.entries(grupos)) {
    const li = document.createElement('li'); li.className = 'grupo'; li.textContent = g; ul.appendChild(li);
    for (const p of ps) {
      const li2 = document.createElement('li'); const b = document.createElement('button');
      b.innerHTML = `<span>${p.nombre}</span>` + (p.m2 ? `<small>${p.m2.toLocaleString('es-AR')} m²</small>` : ''); b.dataset.punto = p.id;
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
const svg = $('minimapa'); let svgAmb = [], svgYo, svgCono, svgNorte, svgEscala;
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
  // flecha de norte y escala gráfica de 1 m (se reubican con la ventana)
  svgNorte = el('g', {}); svgNorte.append(el('path', { class: 'norte', d: 'M0,-0.55 L0.28,0.3 L0,0.12 L-0.28,0.3 Z' }));
  const n = el('text', { class: 'norte-n', x: 0, y: -0.85 }); n.textContent = 'N'; svgNorte.appendChild(n);
  svgEscala = el('g', {}); svgEscala.append(el('path', { class: 'escala', d: 'M0,0 L1,0 M0,-0.12 L0,0.12 M1,-0.12 L1,0.12' }));
  const e = el('text', { x: 0.5, y: 0.42 }); e.textContent = '1 m'; svgEscala.appendChild(e);
  svg.append(svgNorte, svgEscala);
}
function actualizarMinimapa() {
  if (!svgYo) return;
  const yo = posBlender(); const maq = estado.modo === 'maqueta';
  const alta = maq ? estado.corte !== 'pb' : yo.z > 3.6;
  if (maq) $('plano-titulo').textContent = alta ? 'Planta alta' : 'Planta baja';
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
  const vx = (lx0 + lx1) / 2 - W / 2, vy = sy(cy) - H / 2;
  svgNorte.setAttribute('transform', `translate(${vx + W - 0.6} ${vy + 1.3})`);
  svgEscala.setAttribute('transform', `translate(${vx + 0.4} ${vy + H - 0.6})`);
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
  $('btn-pantalla').hidden = false;
  $('btn-pantalla').addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()));
}

let ayudaOculta = false;
function ocultarAyuda() { if (!ayudaOculta) { ayudaOculta = true; $('ayuda').classList.add('oculto'); } }
if (matchMedia('(pointer: coarse)').matches) $('ayuda').textContent = 'Deslizá para mirar alrededor · tocá un círculo para moverte';
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
  const tt = performance.now() / 1000;
  for (const p of Object.values(puntos)) if (p.marcador?.visible) {
    const base = p.id === hoverId ? 1.25 : 1; p.marcador.scale.setScalar(base * (1 + 0.06 * Math.sin(tt * 2.4)));
  }
  if (estado.modo === 'recorrido') {
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / anim.dur); const s = suave(anim.t);
      camera.position.lerpVectors(anim.desde, anim.hasta, s);
      estado.yaw = anim.yaw0 + difAng(anim.yaw0, anim.yaw1) * s;
      estado.pitch = anim.pitch0 + (anim.pitch1 - anim.pitch0) * s;
      if (anim.t >= 1) { anim = null; capturarEntorno(); }
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
