# Hornea la luz de Cycles en lightmaps y exporta los GLB por zona.
# Se corre dentro de Blender (5.2) con el .blend de la propiedad abierto.
# Deja en <carpeta del .blend>/bake: BK_<grupo>_raw.exr, progreso5.txt y listo5.txt
# y en <carpeta>/export: <grupo>.glb
#
# Parámetros de la propiedad (cambiar para la próxima):
INTERIOR = dict(x=(3.0, 7.8), y=(4.0, 12.94))   # planta de la casa (con muros)
PISOS = {'B_Interior_PB': (0.0, 2.82), 'B_Interior_PA': (2.93, 5.57)}  # de piso a cielorraso de cada planta
GRUPOS = {  # nombre: (resolución, muestras)
    'B_Interior_PB': (4096, 512), 'B_Interior_PA': (4096, 512),
    'B_Exterior': (4096, 256), 'B_Exterior_Det': (1024, 128),
}
DET = ("Reja_", "Poste_", "Alambre_", "Pergola_", "Carp_", "Baranda_", "Det_Picaporte", "Det_Toma", "Marco_")
NO_TAPAN = ("Esc_03", "Esc_04", "Det_Colgante", "Det_Plafon", "Det_CalefonTubo")
TRANSPARENTES = ("vidrio", "agua")

import bpy, bmesh, os, time
from mathutils import Vector

base = os.path.dirname(bpy.data.filepath)
dir_bake = os.path.join(base, 'bake'); dir_exp = os.path.join(base, 'export')
os.makedirs(dir_bake, exist_ok=True); os.makedirs(dir_exp, exist_ok=True)
log_path = os.path.join(dir_bake, 'progreso5.txt')
for f in ('progreso5.txt', 'listo5.txt'):
    p = os.path.join(dir_bake, f)
    if os.path.exists(p): os.remove(p)

def log(s):
    with open(log_path, 'a', encoding='utf-8') as f: f.write(s + '\n')

def renderiza(o):
    if o.type != 'MESH' or o.hide_render or o.name.startswith('Esp_'): return False
    return all(not c.hide_render and c.name not in ('REFERENCIA', 'CONTEXTO', 'CAMARAS', 'BAKE') for c in o.users_collection)

sc = bpy.context.scene
bk = bpy.data.collections.get('BAKE') or bpy.data.collections.new('BAKE')
if bk.name not in sc.collection.children: sc.collection.children.link(bk)
for o in list(bk.objects): bpy.data.objects.remove(o, do_unlink=True)

fuentes = [o for o in sc.objects if renderiza(o)]
dg = bpy.context.evaluated_depsgraph_get()

# Tapadores: solo objetos que son una caja simple (8 vértices en la malla base). Una cara se borra
# solo si TODOS sus vértices (corridos 4 mm hacia afuera) quedan dentro de la misma caja.
cajas = []
for o in fuentes:
    if o.name.startswith(NO_TAPAN) or len(o.data.vertices) != 8: continue
    if any(t in (s.material.name.lower() if s.material else '') for s in o.material_slots for t in TRANSPARENTES): continue
    vs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    cajas.append((o.name, Vector([min(v[i] for v in vs) for i in range(3)]), Vector([max(v[i] for v in vs) for i in range(3)])))

def dentro(p, lo, hi, e=1e-4):
    return all(lo[i] + e < p[i] < hi[i] - e for i in range(3))

def zona(f, p, es_det):
    # interior = la cara entera cae dentro de la planta de la casa y mira hacia el aire de un ambiente (por altura)
    I = INTERIOR; e = 0.01
    if all(I['x'][0] - e <= v.co.x <= I['x'][1] + e and I['y'][0] - e <= v.co.y <= I['y'][1] + e for v in f.verts) \
            and I['x'][0] < p.x < I['x'][1] and I['y'][0] < p.y < I['y'][1]:
        for g, (z0, z1) in PISOS.items():
            if z0 < p.z < z1: return g
    return 'B_Exterior_Det' if es_det else 'B_Exterior'

# armar un bmesh por grupo
bms = {g: bmesh.new() for g in list(GRUPOS) + ['B_Vidrios']}
mats = {g: [] for g in bms}
borradas = 0
for o in fuentes:
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); me.transform(o.matrix_world)
    src = bmesh.new(); src.from_mesh(me); src.normal_update()
    es_det = o.name.startswith(DET)
    for f in src.faces:
        m = o.material_slots[f.material_index].material if f.material_index < len(o.material_slots) else None
        mn = m.name if m else 'Sin_Material'
        n = f.normal
        if any(t in mn.lower() for t in TRANSPARENTES):
            g = 'B_Vidrios'
        else:
            pts = [v.co + n * 0.004 for v in f.verts]
            if any(nom != o.name and all(dentro(p, lo, hi) for p in pts) for nom, lo, hi in cajas):
                borradas += 1; continue
            g = zona(f, f.calc_center_median() + n * 0.03, es_det)
        bm = bms[g]
        if m not in mats[g]: mats[g].append(m)
        nv = [bm.verts.new(v.co) for v in f.verts]
        try:
            nf = bm.faces.new(nv); nf.material_index = mats[g].index(m); nf.smooth = f.smooth
        except ValueError:
            pass
    src.free(); bpy.data.meshes.remove(me)
log(f'caras tapadas borradas: {borradas} (tapadores: {len(cajas)})')

objs = {}
for g, bm in bms.items():
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(g); bm.to_mesh(me); bm.free()
    for m in mats[g]: me.materials.append(m)
    o = bpy.data.objects.new(g, me); bk.objects.link(o); objs[g] = o
log('grupos: ' + ', '.join(f'{g}={len(o.data.polygons)}' for g, o in objs.items()))
for g, o in objs.items():
    vs = [v.co for v in o.data.vertices]
    if vs: log(f'  {g}: min {[round(min(v[i] for v in vs), 2) for i in range(3)]} max {[round(max(v[i] for v in vs), 2) for i in range(3)]}')

# UV de lightmap
win = bpy.context.window_manager.windows[0]
area = next((a for a in win.screen.areas if a.type == 'VIEW_3D'), None)
for g in GRUPOS:
    o = objs[g]
    while o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers[0])
    o.data.uv_layers.new(name='Lightmap')
    for x in sc.objects: x.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    with bpy.context.temp_override(window=win, area=area, region=next(r for r in area.regions if r.type == 'WINDOW'), active_object=o, object=o):
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.003, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
        bpy.ops.object.mode_set(mode='OBJECT')

# horneado
sc.render.engine = 'CYCLES'
sc.render.bake.margin = 4
for g, (res, spp) in GRUPOS.items():
    t0 = time.time(); o = objs[g]
    if len(o.data.polygons) == 0: log(f'{g} vacío'); continue
    nombre = 'BK_' + g[2:]
    img = bpy.data.images.get(nombre)
    if img and (img.size[0] != res): bpy.data.images.remove(img); img = None
    img = img or bpy.data.images.new(nombre, res, res, float_buffer=True, alpha=False)
    for m in o.data.materials:
        if not m or not m.use_nodes: continue
        nd = m.node_tree.nodes.get('BAKE_IMG') or m.node_tree.nodes.new('ShaderNodeTexImage')
        nd.name = 'BAKE_IMG'; nd.image = img; m.node_tree.nodes.active = nd
    for x in sc.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
    sc.cycles.samples = spp
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT', 'COLOR'}, margin=4, use_clear=True, uv_layer='Lightmap')
    img.filepath_raw = os.path.join(dir_bake, f'{nombre}_raw.exr'); img.file_format = 'OPEN_EXR'; img.save()
    # albedo (solo color, sin luz): ayuda al limpiador de ruido a separar luz de color
    sc.cycles.samples = 4
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=4, use_clear=True, uv_layer='Lightmap')
    img.filepath_raw = os.path.join(dir_bake, f'{nombre}_alb.exr'); img.save()
    log(f'{g} {res} {spp} {time.time() - t0:.1f}s')

# exportar GLB
for g, o in objs.items():
    for x in sc.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
    args = dict(filepath=os.path.join(dir_exp, g[2:].lower() + '.glb'), use_selection=True, export_apply=True,
                export_materials='EXPORT', export_normals=True, export_texcoords=True)
    try: bpy.ops.export_scene.gltf(export_image_format='NONE', **args)
    except TypeError: bpy.ops.export_scene.gltf(**args)
    log('export ' + g)
bpy.ops.wm.save_mainfile()
with open(os.path.join(dir_bake, 'listo5.txt'), 'w') as f: f.write(open(log_path, encoding='utf-8').read())
