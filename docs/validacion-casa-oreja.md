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
