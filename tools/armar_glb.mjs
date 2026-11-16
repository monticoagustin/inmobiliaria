// Arma los GLB web: geometría exportada de Blender + textura horneada (unlit, WebP) + meshopt.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsUnlit, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
const [,, inGlb, texPng, outGlb, maxSize='4096'] = process.argv;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inGlb);
if (texPng) {
  const unlit = doc.createExtension(KHRMaterialsUnlit).setRequired(false);
  const tex = doc.createTexture('lightmap').setImage(fs.readFileSync(texPng)).setMimeType('image/png');
  const mat = doc.createMaterial('horneado').setBaseColorTexture(tex).setExtension('KHR_materials_unlit', unlit.createUnlit());
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    p.setMaterial(mat); p.setAttribute('NORMAL', null);
  }
}
await doc.transform(
  dedup(), prune(), weld(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 88, resize: [Number(maxSize), Number(maxSize)] }),
  quantize(), meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(outGlb, doc);
console.log(outGlb, (fs.statSync(outGlb).size/1e6).toFixed(2)+' MB');
