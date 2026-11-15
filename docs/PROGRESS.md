# PROGRESS

## Estado
- [x] Fase 0 · Relevamiento Casa Oreja → `docs/relevamiento/fase-0-casa-oreja.md`
- [x] Fase 1 · Blocking en Blender → `docs/validacion-casa-oreja.md` (rama `fase-1-blocking`)
- [ ] Fase 2 · Materiales, mobiliario y luz
- [ ] Fase 3 · Bake + export + optimización
- [ ] Fase 4 · Visor con puntos de salto y dollhouse
- [ ] Fase 5 · Caminata, minimapa, etiquetas, QA mobile
- [ ] Fase 6 · Marca blanca, embed, variantes, métricas
- [ ] Fase 7 · Informe del piloto

## Pendiente de confirmar
- Supuestos de la Fase 0 (plano principal, unidad izquierda, fondo de 32,20 m, norte al fondo).
- Pasar el repo a privado: tiene fotos del aviso y planos.

## Deuda / soluciones a mano
- El blocking se generó con scripts de bpy ejecutados por el conector. Para el servicio: extraer un script parametrizable (muros, aberturas y escalera desde una tabla) y guardarlo en `tools/`.
- Las cámaras de comparación con fotos se ubicaron a mano. Para el servicio: hacer camera matching (fSpy o similar).
- El .blend se guarda en `Desktop\Casa Oreja\blender\` y se sube a mano al repo. Para el servicio: definir una carpeta de trabajo estándar.
- El plano A1 se tapó a mano. Para el servicio: pedirle al cliente planos sin datos personales.

- Git LFS no funciona desde la sesión de Claude: los binarios van directo en git. Si un .blend supera los 50 MB, pasar a LFS subiéndolo desde la PC.

## Deploy
Push o merge a `main` → GitHub Action → `teskel.online/recorridos/` (secreto `SPACEFAST_TOKEN` ya cargado).
