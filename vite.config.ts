import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.API_TIMEOUT': JSON.stringify(env.API_TIMEOUT || '30000'),
        'process.env.MAX_RETRIES': JSON.stringify(env.MAX_RETRIES || '3'),
        'process.env.MAX_CONCURRENT_TASKS': JSON.stringify(env.MAX_CONCURRENT_TASKS || '3'),
        'process.env.CACHE_DURATION': JSON.stringify(env.CACHE_DURATION || '3600000')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser'
      }
    };
});
