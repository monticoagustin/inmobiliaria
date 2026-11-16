import { defineConfig } from 'vite';

// Se publica en teskel.online/recorridos/ junto a assets/ (modelos) y properties/ (config).
// Los JS compilados van en app/ para no chocar con la carpeta assets/ de los modelos.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'app',
    target: 'es2020',
  },
});
