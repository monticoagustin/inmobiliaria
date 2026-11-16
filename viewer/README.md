# Visor de recorridos 3D

Un solo visor para todas las propiedades. Se publica en `teskel.online/recorridos/`.

- Propiedad: `?p=<id>` (por defecto `casa-oreja`). Lee `properties/<id>.json` y los GLB de `assets/<id>/`.
- Link directo a un ambiente: `#punto=<id>` (por ejemplo `.../recorridos/#punto=cocina`).

## Cargar una propiedad nueva
1. Generar los GLB horneados en `assets/<id>/` (ver `tools/`).
2. Copiar `properties/casa-oreja.json` como `properties/<id>.json` y completar:
   - `nombre`, `subtitulo`, `marca.color` (marca blanca)
   - `modelos` y `vidrios` (archivos dentro de `carpeta`)
   - `entorno.lotes` [x0, x1, y0, y1]: el pasto de alrededor no tapa el terreno propio
   - `puntos`: cada punto con `pos` [x, y] y `piso` (altura del piso) en coordenadas de Blender, `mirar` [x, y, z] hacia dónde arranca mirando, y `planta`. Con `ir` y `soloMarcador` se arman escaleras (subir/bajar).
   - `cortes`: alturas de corte de la maqueta para PB y PA.

## Desarrollo
```
npm ci
npm run build   # salida en dist/ (JS en dist/app/ para no chocar con assets/)
```
Para probar en local, copiar `dist/*`, `../assets` y `../properties` a una carpeta y servirla con cualquier servidor estático.
