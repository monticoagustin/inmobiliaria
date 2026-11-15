# Recorridos 3D de propiedades (piloto)

Web para recorrer en 3D una propiedad, con calidad de render y fluida en el celular. Se alimenta con planos y fotos.
Es un piloto: además del recorrido, el entregable es un proceso repetible y medido para ofrecerlo como servicio a constructoras e inmobiliarias.

## Dónde vive todo
- Este repo de GitHub es la única fuente de verdad. Por ahora los binarios van directo en git (sin LFS, ver PROGRESS).
- Blender (5.2.3, RTX 2060 6 GB, OptiX) corre en la PC del usuario a través del conector. El .blend se guarda en `C:\Users\Agustin\Desktop\Casa Oreja\blender\` y **siempre** se sube a `blender/<propiedad>/`.
- Deploy: push o merge a `main` → `.github/workflows/publicar-en-teskel.yml` → `teskel.online/recorridos/` (Space `spc_02ae51f4db5a45b3a6c013388fe16504`, secreto `SPACEFAST_TOKEN`). Solo se publica el visor, `assets/` y `properties/`; nunca `input/`, `blender/` ni `docs/`.

## Reglas
- Castellano rioplatense y explicaciones simples.
- Ramas por fase y PR al cerrar cada una. **Merge a main = publicar en vivo:** solo con el OK del usuario.
- La precisión manda sobre la estética. Respetar las cotas (±2 cm). Lo que no surja de planos ni fotos se anota en `docs/supuestos-<propiedad>.md`.
- Las fotos mandan en las terminaciones; los planos, en la geometría.
- No tocar .blend ajenos al proyecto. Versionar `_v01`, `_v02`…
- Estimar el tiempo antes de bakes o renders largos.
- Marcar como deuda en `docs/PROGRESS.md` todo lo que sea "a mano".
- Mantener `docs/PROGRESS.md` y `docs/METRICAS.md`. Leer PROGRESS al empezar cada sesión.
- No subir datos personales: el repo es público.

## Estructura
```
input/<propiedad>/     planos, fotos, datos.md (lo que entrega el cliente)
blender/<propiedad>/   .blend versionados
assets/<propiedad>/    GLB optimizados, lightmaps, texturas, portada
viewer/                visor three.js (Vite + JS vanilla)
properties/            un JSON de config por propiedad
docs/                  PROGRESS, METRICAS, relevamiento, validación, supuestos, comparaciones
```

## Pipeline
1. Blender: modelar desde los planos (1:1, metros) → materiales PBR CC0 según las fotos → hornear la luz de Cycles en lightmaps → GLB por planta.
2. glTF Transform: KTX2 + meshopt. Primera vista < 5 MB, total < 40 MB.
3. Visor three.js (WebGPU con fallback a WebGL): puntos de salto, caminata, dollhouse, minimapa, etiquetas, marca blanca y embed.
