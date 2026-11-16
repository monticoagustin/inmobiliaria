# MÉTRICAS DEL PILOTO

## Casa Oreja

| Fase | Claude | Usuario | Máquina | Automático | Manual | Notas |
|---|---|---|---|---|---|---|
| Mejoras 1+3+4 (reflejos, detalle, luz) | ~1 h 40 min (14:20–16:00, 16/11) | ~2 min (reabrir Blender) | 3 horneados de ~12 min (2 fallidos) | Script de horneado, armado de GLB, pruebas en 8 puntos | Elegir reflectividad por material, revisar capturas | 2 bugs propios del horneado (borrado de caras y zonas) detectados en las capturas; Blender se colgó una vez |
| 5 · Caminata y QA | ~1 h (11:43–12:45, 16/11) | ~2 min (pedido de sacar la vecina) | re-bake interiores 9 min + exterior 1,2 min | Pruebas automáticas de caminata, escalera, links y UI | Caminata, minimapa, etiquetas, carga progresiva | 1 bug de modelo de la Fase 1 (toilette/escalera) y 1 bug propio de carga, detectados por las pruebas |
| 4 · Visor | ~45 min (11:22–12:05, 16/11) | 0 | build < 2 s; carga local 2,1 s | Build, pruebas con Chrome sin pantalla en escritorio y celular | Diseño del visor, puntos de recorrido y vistas iniciales | 2 rondas de ajuste de puntos (cocina, palier) |
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
