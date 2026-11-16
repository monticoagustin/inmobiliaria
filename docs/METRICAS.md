# MÉTRICAS DEL PILOTO

## Casa Oreja

| Fase | Claude | Usuario | Máquina | Automático | Manual | Notas |
|---|---|---|---|---|---|---|
| 3 · Bake + export | ~1 h 25 min (10:50–12:15, 16/11) | ~5 min (revisión) | ~11 min de bake + 2 min de limpieza de ruido | Separar grupos, mapeo de luz, horneado, limpieza de ruido OIDN, export GLB, optimización, prueba web | Elegir resoluciones y exposiciones; revisar atlas y comparación | 1 bug propio (texturas invertidas) detectado en la comparación web |
| 2 · Materiales y luz | ~45 min (14:58–15:45) | 0 | 6 rondas de renders de 3–10 s c/u (~4 min en total) | Descarga de texturas, materiales, asignación por cara, sanitarios, puertas, perfiles, rejas, pileta, renders | Elegir texturas y colores mirando las fotos; ubicar cámaras; 3 iteraciones de color y luz | 2 bugs propios (vidrios con revoque y perfiles con vidrio) detectados en la comparación con fotos |
| 1 · Blocking | ~12 min (14:41–14:53) | 0 | renders de validación < 1 min | Construcción de muros, aberturas, losas, escalera y exterior desde datos; render de cortes; superposición con el plano | Leer el detalle de la escalera; medir aberturas sin cota sobre el dibujo; ubicar cámaras | 3 correcciones después de superponer (ventana de cocina, placard, ventana de escalera) |
| 0 · Relevamiento | ~12 min (14:29–14:41) | ~10 min (subir material, token Spacefast) | — | Rasterizar planos, medir escala, hojas de contacto | Leer planos y fotos, mapear fotos a ambientes, tapar datos personales | Llegaron dos juegos de planos (prototipo y conforme a obra). Faltaba saber qué unidad del par era |

### Material que faltó del cliente
- Cotas de aberturas (puertas, ventanas de PB, cocina y baño).
- Fondo del lote: tres valores distintos en el mismo plano.
- Indicación de qué unidad del dúplex se vende.

### Checklist "qué pedirle al cliente" (en construcción)
- Planos en PDF vectorial o DWG, sin datos personales, con planilla de aberturas.
- Qué unidad es, si hay varias.
- Fotos de todos los ambientes, incluida la fachada completa desde la calle.
- Orientación (norte) y terminaciones (marca/modelo de pisos y revestimientos).
