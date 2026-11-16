# Validación · Casa Oreja · Fase 1 (blocking)

Archivo: `blender/casa-oreja/casa-oreja_v01.blend` (Blender 5.2.3, metros, 1:1).
Origen: esquina izquierda del lote sobre la línea municipal, a nivel de terreno. X = ancho del lote, Y = hacia el fondo (norte), Z = altura.

## Superposición con el plano (corte a 1,20 m sobre cada piso)
- `comparaciones/planta-pb-modelo-vs-plano.png`
- `comparaciones/planta-pa-modelo-vs-plano.png`

Rojo: muros cortados · azul: escalera y elementos fijos · verde: aberturas.
Muros, aberturas, escalera, placards y balcón caen sobre el dibujo del plano conforme a obra.

## Superficies (plano vs. modelo)
| Local | Plano (m²) | Modelo (m²) | Dif. |
|---|---|---|---|
| Estar-comedor 3,58 × 4,74 | 16,92 | 16,97 | 0,3 % |
| Cocina-comedor 4,50 × 3,90 | 17,55 | 17,55 | 0,0 % |
| Toilette 0,80 × 2,01 | 1,60 | 1,61 | 0,5 % |
| Dormitorio frente 3,58 × 3,40 | 12,17 | 12,24 | 0,6 % |
| Dormitorio fondo 2,72 × 3,92 | 10,66 | 10,66 | 0,0 % |
| Baño 1,63 × 2,00 | 3,26 | 3,26 | 0,0 % |

Todas dentro del 1 % pedido.

## Alturas
NPT PB +0,12 · losa +2,82/+2,95 · NPT PA +2,95 · balcón +2,90 · cielorraso PA +5,55 · techo +6,35 · parapeto +6,50 · tanque +8,35.

## Aberturas sin cota (medidas sobre el dibujo a escala)
| Abertura | Posición | Medida | Fuente |
|---|---|---|---|
| Puerta de entrada (frente) | X 6,56–7,36 | 0,80 × 2,00 | Planta PB |
| Ventana PB frente | X 5,74–6,52 | 0,78 × 1,10, antepecho 0,90 | Planta PB, antepecho supuesto |
| Puerta lateral (pérgola) | Y 8,96–9,76 | 0,80 × 2,00 | Planta PB |
| Corrediza al patio | X 4,98–6,99 | 2,01 × 2,00 | Planta PB + corte C |
| Ventana cocina | Y 10,50–11,65 | 1,15 × 0,57, antepecho 1,43 | Planta PB, alto supuesto |
| Ventilación toilette | Y 7,24–7,47 | 0,23 × 0,30 | Planta PB |
| Ventana dormitorio frente | X 4,07–4,87 | 0,80 × 1,75, antepecho +3,25 | Fachada 1:50 |
| Puerta-ventana balcón | X 4,99–5,78 | 0,79 × 2,00 | Corte C |
| Ventana baño PA | X 4,17–4,64 | 0,47 × 1,05, antepecho +3,81 | Corte C |
| Ventana palier PA | Y 8,31–9,02 | 0,71 × 1,75 | Planta PA, alto supuesto |
| Ventana escalera PA | Y 4,52–4,84 | 0,32 × 1,75 | Planta PA, alto supuesto |

## Escalera
16 alzadas de 0,177 m (de +0,12 a +2,95): 2 escalones que salen al estar, 2 compensados en la esquina y 11 huellas de 0,25 m hacia el fondo. Llega a PA en Y 7,70. Coincide con el detalle del plano y con las fotos 02 y 04.

## Comparación con fotos
`comparaciones/fotos-vs-modelo-blocking.jpg`: foto 01 (interior estar), 16 (contrafrente) y 19 (desde el fondo del lote). Las cámaras están aproximadas a mano. En la Fase 2 se ajustan con más precisión.

- **Interior (01):** coinciden la profundidad, la ubicación de la cocina, la puerta del toilette y la corrediza.
- **Fondo (19):** coincide la silueta del par: balcones juntos en la medianera, cuerpos de baño hacia los laterales y pileta frente a nuestra unidad.
- **Contrafrente (16):** la parrilla de la foto parece más grande que la del plano (0,88 × 1,97 m). Se revisa en la Fase 2.

## Diferencias abiertas (para la Fase 2)
1. **Parrillero:** el plano indica 0,70 + 1,88; en las fotos 16 y 17 se ve un quincho más ancho, con mesada.
2. **Ventana de cocina:** el plano la ubica centrada en la bacha (Y 10,50–11,65); en la foto 16 hay una ventana chica cerca de la esquina del fondo. A confirmar.
3. **Fachada y revestimientos:** se modelan en la Fase 2 según las fotos (revestimiento vertical símil madera en PA, revoque texturado, pérgola).
4. **Unidad espejada:** es una copia vinculada de nuestra unidad, solo como contexto.

---

# Fase 2 · Materiales, terminaciones y luz

Archivo: `blender/casa-oreja/casa-oreja_v02.blend` (15 MB, con las texturas empaquetadas).

## Qué se hizo
- **Materiales PBR** con texturas CC0 de Poly Haven (1k) y procedurales: porcelanato 60×60 con juntas a medida, piso flotante roble en dormitorios, porcelanato símil cemento 60×120 en el baño, revestimiento WPC de tablas verticales de 15 cm, revoque texturado beige, melamina roble en la cocina y oscura en placards, puertas placa cedro, aluminio negro.
- **Asignación automática por cara:** cada cara toma la terminación del ambiente que tiene adelante. Interior: pintura, salvo el baño (porcelanato) y la alzada de cocina. Exterior: revoque en PB y WPC en PA, salvo el recorte del balcón. Es reutilizable para otras propiedades.
- **Detalles:** cocina con mesada, anafe, bacha y alacenas; sanitarios en baño y toilette; puertas abiertas según el sentido de giro del plano; marcos; perfiles de aluminio (con parante en las corredizas y travesaño en los paños fijo + oscilobatiente); barandas de barrotes; rejas en la L.M.; vaso de la pileta de 1,30 m; parrilla con boca hacia la pileta; cercos (media sombra en el divisorio, tejido con postes en el resto); cielorraso de madera en el balcón.
- **Luz:** cielo físico + sol desde el noroeste a 40° (orientación real: fondo al norte). Cycles en la RTX 2060 (OptiX): **3–10 s por render** de 800×533.

## Comparación con fotos
`comparaciones/fotos-vs-modelo-materiales.jpg` y `renders/`:
- **01 · estar:** coinciden la profundidad, la cocina, el toilette y la corrediza con perfil negro.
- **03 · cocina:** coinciden la ubicación de mesada y alacenas, la corrediza a la pileta y la luz del fondo.
- **08 · dormitorio fondo:** coincide la puerta-ventana con perfil negro a la izquierda, con baranda y travesaño.
- **16 · contrafrente:** coinciden la parrilla, el balcón con cielorraso de madera, el volumen WPC, el revoque, la pérgola y la sombra de la pérgola.
- **19 · desde el fondo:** coinciden la silueta del par, la distribución WPC/revoque, la pileta, la media sombra y los postes.

## Diferencias que quedan (para la Fase 3 o con tu OK)
1. Los pisos se ven más claros que en las fotos en las zonas con sol directo. Se va a ajustar con el bake final.
2. Faltan detalles menores que muestran las fotos: tomacorrientes, artefactos de luz, calefón, bajadas pluviales, apliques exteriores y la chimenea del tanque.
3. Las cámaras de comparación se ubicaron a mano (sin camera matching), así que el encuadre difiere un poco.
4. Supuestos de terminaciones: ver `supuestos-casa-oreja.md` (T1–T9).

### Correcciones posteriores (revisión del usuario)
- **Parrillero rehecho** dentro de sus límites (no pasa al pasto ni a la altura de la pileta): boca de 1,20 m y mesada de apoyo con tapa a 0,95 y nicho abajo, que llega hasta el borde del solado del patio (Y 15,45), como pidió el usuario. Ver `comparaciones/parrilla-fotos-vs-modelo.jpg`.
- **Bug corregido:** el terreno de entorno tapaba el vaso de la pileta (se veía pasto adentro). Ahora es un marco alrededor de los lotes.
- Falta (menor): una caja baja de hormigón junto al cerco, en la foto 17 (posible casilla de la bomba de la pileta).
