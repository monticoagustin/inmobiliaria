# Fase 0 · Relevamiento — Casa Oreja

Fecha: 2026-11-15. Material en `input/casa-oreja/`.

## 1. Material de entrada

### Planos
| Archivo | Qué es | Uso |
|---|---|---|
| `plano-conforme-a-obra-lote974-redactado.pdf` | Plano municipal "Conforme a obra" del lote 974 (A1, esc. 1:100 y fachada 1:50): plantas PB/PA del par de dúplex, cortes B-B y C-C, fachada, planilla de locales, croquis con norte. Datos personales tapados. | **Fuente principal** de geometría |
| `prototipo-planta-baja.pdf` / `prototipo-planta-alta.pdf` | "Prototipo 2 dormitorios, lote 7,80 m" (A4, 1:100). Diseño previo del mismo dúplex, sin terreno completo. | Referencia secundaria. Difiere en espesores (12 cm) y en la planta alta |

El original del plano A1 (con nombre y CUIT del propietario) **no se sube** al repo, que es público.

### Fotos (22, ~800×530 px, de aviso inmobiliario)
| Foto | Ambiente | Qué aporta |
|---|---|---|
| 01 | PB estar-comedor → fondo | Profundidad completa, puerta del toilette a la izq., cocina, puerta-ventana al patio. Piso porcelanato gris claro |
| 02 | PB desde la escalera | Escalera con huellas de madera, puerta del toilette, cocina, corrediza |
| 03 | PB cocina-comedor | Bajo y alto mesada melamina roble, alzada blanca, ventana sobre mesada, calefón, corrediza a la pileta |
| 04 | PB estar → frente | Puerta de entrada abierta, reja del frente, arranque de escalera, puerta placa madera |
| 05 | PB desde el fondo → frente | Puerta de entrada al fondo de la vista, escalera, cocina a la der. |
| 06 | PA palier | Ventana alta lateral, baño (porcelanato símil cemento), dormitorio con piso flotante |
| 07 | PA palier | Baranda de escalera, puertas, ventana vertical |
| 08 | PA dormitorio fondo | Puerta-ventana al balcón con baranda, piso flotante roble claro |
| 09 | PA dormitorio | Placard corredizo símil madera oscura, puerta placa |
| 10 | PA dormitorio frente | Ventana paño fijo + oscilobatiente, aluminio negro |
| 11 | PA dormitorio | Placard + ventana lateral |
| 12 | PA baño | Lavatorio de apoyo fuera del recinto (nicho), inodoro, bidet, ducha, ventana alta |
| 13 | Exterior frente | Puerta de entrada gris, revoque texturado beige, revestimiento vertical símil madera en PA, pérgola |
| 14 | Exterior lateral | Pérgola metálica negra (estacionamiento), pileta al fondo |
| 15 | Exterior frente | Portón de reja negra en L.M., cerco |
| 16 | Contrafrente | Balcón PA, corrediza PB, parrilla, bajadas pluviales |
| 17–18 | Fondo | Pileta con borde atérmico, parrilla con chimenea |
| 19 | Fondo | Contrafrente desde el final del lote, cerco perimetral |
| 20–22 | Aéreas | Contexto, techo de chapa, implantación |

## 2. Escala y consistencia de los planos

- **Conforme a obra (1:100 a 200 dpi = 78,74 px/m):** ancho exterior del par medido 9,63 m vs. 9,60 acotado (0,3 %); profundidad medida 8,92 m vs. 8,94 (0,3 %). **Consistente.**
- **Prototipo (1:100 a 150 dpi = 59,06 px/m):** profundidad 8,94 m y ancho 4,80 m: relación medida 1,866 vs. 1,862 (0,2 %). **Consistente.**
- **Excepción:** las franjas laterales del terreno están dibujadas a ~2,53 m pero acotadas 3,00 m. Mandan las cotas.

## 3. Tabla de ambientes (unidad izquierda, según plano conforme a obra)

Niveles: terreno ±0,00 · NPT PB +0,12 · NPT PA +2,95 (balcón +2,90) · parapeto +6,50 · tanque +8,35.

| Planta | Local | Medidas (m) | Sup. (m²) | Altura libre | Aberturas |
|---|---|---|---|---|---|
| PB | Estar-comedor | 3,58 × 4,74 | 16,92 | 2,55 | Puerta de entrada al frente; ventana al frente |
| PB | Cocina-comedor | 4,50 × 3,90 | 17,55 | 2,55–2,70 | Corrediza al patio ≈1,95 × 2,00 (medida en corte C); ventana sobre mesada (sin cota) |
| PB | Toilette | 0,80 × 2,01 | 1,60 | 2,55 | Puerta placa (sin cota) |
| PB | Escalera | ancho 0,80, a lo largo del muro lateral | — | — | — |
| PA | Dormitorio frente | 3,58 × 3,40 | 12,17 | 2,60 | Ventana 0,80 × 1,75, antepecho +3,25 (fachada 1:50) |
| PA | Dormitorio fondo | 2,72 × 3,92 | 10,66 | 2,80 | Puerta-ventana al balcón |
| PA | Baño | 1,63 × 2,00 | 3,26 | 2,60–2,80 | Ventana alta |
| PA | Nicho lavatorio | 1,63 × 0,90 | — | — | — |
| PA | Balcón | 2,72 × 1,20 | — | — | Baranda h ≈ 1,00 |
| Ext. | Lote (una unidad) | 7,80 × 32,20 | 251,16 | — | — |
| Ext. | Retiro de frente | 4,00 | — | — | Portón en L.M. |
| Ext. | Franja lateral con pérgola | 3,00 × ~9,94 | — | — | — |
| Ext. | Pileta | 3,00 × 7,00, prof. 1,30 | 21,00 | — | — |

Espesores: muros exteriores 0,15 · interiores 0,12 · medianera entre unidades 0,30 · losa 0,20–0,30.

## 4. Faltantes y ambigüedades

### Bloquean el modelado (resueltas con supuesto, falta confirmar)
1. **Qué plano manda.** Supuesto: el conforme a obra. Coincide con las fotos en la escalera al frente, el lavatorio fuera del baño en PA, el balcón al fondo y la pileta.
2. **Qué unidad es.** Supuesto: la **izquierda** mirando desde la calle, porque en las fotos 01 y 05 la cocina queda sobre el muro izquierdo mirando al fondo. La unidad espejada se modela como volumen simple de contexto.

### Se pueden suponer (criterio propuesto)
| Tema | Ambigüedad | Criterio |
|---|---|---|
| Fondo del lote | 32,30 (planta), 33,20 (croquis), 32,20 (de 502,32 m² ÷ 15,60) | **32,20 m**, coincide con la superficie |
| Cadena de cotas PA | El lado derecho suma 9,09 m contra 8,94 m total | Respetar el total de 8,94 y los locales de la planilla; los 15 cm se absorben en el balcón |
| Altura PB | 2,55 en el frente y 2,70 en el fondo (corte B) | Losa a 2,70 desde el NPT; cielorraso a 2,55 donde está acotado |
| Techo PA | Chapa con pendiente: 2,60 al frente y 2,80 al fondo | Cielorraso inclinado entre esas alturas, parapeto a +6,50 |
| Aberturas sin cota | Puertas interiores, ventanas de PB, cocina y baño | Medidas estándar (puertas 0,70/0,80 × 2,00) ajustadas midiendo las fotos y el dibujo |
| Norte | La flecha del croquis apunta a calle Garrone (al fondo) | **Fondo al norte**, frente a calle Alfonsín al sur. Coincide con el fondo asoleado de las fotos |
| Fachada | El plano muestra revestimiento acrílico liso; las fotos, revestimiento vertical símil madera en PA y pérgola | Las fotos mandan en terminaciones |
| Terminaciones | Sin especificar en planos | Tomarlas de las fotos (ver tabla de la sección 1) |
| Ambientes sin foto | Interior del toilette PB, llegada de la escalera a PA, fachada completa desde la calle | Seguir el estilo del resto de la casa y marcarlo como supuesto |
| Mobiliario | La casa está vacía en las fotos | Versión principal vacía, igual que en las fotos; el amoblamiento se hace después como variante |

## 5. Blender
Conectado (5.2.3 LTS, OptiX). El archivo abierto no tenía nombre ni cambios. Se creó `casa-oreja_v01.blend` en metros.

## 6. Estimación fases 1–3 (esta propiedad)
| Fase | Claude | Máquina | Revisión tuya |
|---|---|---|---|
| 1 · Blocking | 2–4 h | — | 20 min |
| 2 · Materiales y luz | 4–6 h | 1 h de renders | 30 min |
| 3 · Bake y export | 2–3 h | 2–4 h de bake (RTX 2060) | 15 min |
