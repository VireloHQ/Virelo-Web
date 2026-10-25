import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { ffmpegAssets } from './scripts/ffmpeg-assets.ts';

export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss(), ffmpegAssets()],
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg'] },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@heroui')) return 'heroui';
          if (id.includes('node_modules/@tanstack')) return 'tanstack';
          if (id.includes('node_modules/@phosphor-icons')) return 'icons';
        }
      }
    }
  }
});
