// Arma los GLB web: geometría de Blender (un primitivo por material) + textura de luz horneada (unlit, WebP) + meshopt.
// Conserva el nombre del material original (el visor lo usa para decidir qué superficies reflejan) y las normales.
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
const [,, inGlb, texPng, outGlb, maxSize='4096'] = process.argv;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inGlb);
if (texPng) {
  const unlitExt = doc.createExtension(KHRMaterialsUnlit).setRequired(false);
  const tex = doc.createTexture('lightmap').setImage(fs.readFileSync(texPng)).setMimeType('image/png');
  const cache = new Map();
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    const nombre = p.getMaterial()?.getName() || 'horneado';
    if (!cache.has(nombre)) cache.set(nombre, doc.createMaterial(nombre).setBaseColorTexture(tex).setExtension('KHR_materials_unlit', unlitExt.createUnlit()));
    p.setMaterial(cache.get(nombre));
  }
  // quitar materiales/texturas originales que quedaron sin uso
  for (const m of doc.getRoot().listMaterials()) if (!cache.has(m.getName()) || cache.get(m.getName()) !== m) m.dispose();
  for (const t of doc.getRoot().listTextures()) if (t !== tex) t.dispose();
}
await doc.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }), prune({ keepAttributes: true }), weld(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 88, resize: [Number(maxSize), Number(maxSize)] }),
  quantize(), meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(outGlb, doc);
console.log(outGlb, (fs.statSync(outGlb).size/1e6).toFixed(2)+' MB', doc.getRoot().listMaterials().length+' materiales');
