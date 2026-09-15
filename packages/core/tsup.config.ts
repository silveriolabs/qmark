import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'QMark',
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  target: 'es2022',
});