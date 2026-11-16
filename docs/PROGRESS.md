# PROGRESS

## Estado
- [x] Fase 0 · Relevamiento Casa Oreja → `docs/relevamiento/fase-0-casa-oreja.md`
- [x] Fase 1 · Blocking en Blender → `docs/validacion-casa-oreja.md` (rama `fase-1-blocking`)
- [x] Fase 2 · Materiales, terminaciones y luz → `docs/validacion-casa-oreja.md` (rama `fase-2-materiales`)
- [x] Fase 3 · Bake + export + optimización → `assets/casa-oreja/` (4,1 MB), rama `fase-3-bake`
- [x] Fase 4 · Visor con puntos de salto y maqueta → `viewer/`, `properties/casa-oreja.json` (rama `fase-4-visor`)
- [x] Fase 5 · Caminata, minimapa, etiquetas, carga progresiva (QA en teléfonos reales pendiente)
- [ ] Fase 6 · Marca blanca, embed, variantes, métricas
- [ ] Fase 7 · Informe del piloto

## Pendiente de confirmar
- Supuestos de geometría y terminaciones: `docs/supuestos-casa-oreja.md`.
- Supuestos de la Fase 0 (plano principal, unidad izquierda, fondo de 32,20 m, norte al fondo).
- Pasar el repo a privado: tiene fotos del aviso y planos.

## Deuda / soluciones a mano
- QA en teléfonos reales (Android/iOS) pendiente: las pruebas automáticas corren sin GPU.
- Las rejas y el tejido dejan pasar al caminar (los rayos pasan entre barrotes): agregar colisionadores simples.
- El horneado interior se hizo con la casa vecina presente (afecta muy poco: la medianera no tiene aberturas). Si se rehace, hornear sin el contexto.
- Puntos del recorrido cargados a mano en el JSON. Para el servicio: exportarlos desde Blender (empties con nombre) o elegirlos con un editor visual.
- El JS del visor pesa ~600 kB (three.js completo). Separar en partes o recortar lo que no se usa.
- Atlas de luz: ~25 % del espacio se pierde en caras ocultas (losas bajo pisos, cantos de muros dentro de otros). Borrarlas antes del mapeo da más resolución con el mismo peso.
- Exterior: barrotes, perfiles y postes ocupan mucho atlas. Hornearlos aparte en baja resolución o con color plano.
- Texturas en WebP y no en KTX2 (falta el binario toktx en la sesión). KTX2 ahorra memoria de GPU en celulares.
- Las llamadas a la PC cortan a los 80 s: los procesos largos de Blender se lanzan con `bpy.app.timers` y se controlan por archivos.
- Texturas: se bajan de Poly Haven desde Blender (API pública, CC0) y se empaquetan en el .blend. Para el servicio: una biblioteca propia de materiales en `tools/materiales/`.
- La regla de terminaciones por cara (ambiente → material) está en un script del conector. Extraerla junto con el script de blocking.
- El arreglo de vidrios buscó "_vid" en el nombre y pisó los marcos: convención de nombres más estricta (prefijos únicos por tipo).
- El blocking se generó con scripts de bpy ejecutados por el conector. Para el servicio: extraer un script parametrizable (muros, aberturas y escalera desde una tabla) y guardarlo en `tools/`.
- Las cámaras de comparación con fotos se ubicaron a mano. Para el servicio: hacer camera matching (fSpy o similar).
- El .blend se guarda en `Desktop\Casa Oreja\blender\` y se sube a mano al repo. Para el servicio: definir una carpeta de trabajo estándar.
- El plano A1 se tapó a mano. Para el servicio: pedirle al cliente planos sin datos personales.

- Git LFS no funciona desde la sesión de Claude: los binarios van directo en git. Si un .blend supera los 50 MB, pasar a LFS subiéndolo desde la PC.

## Deploy
Push o merge a `main` → GitHub Action → `teskel.online/recorridos/` (secreto `SPACEFAST_TOKEN` ya cargado).
