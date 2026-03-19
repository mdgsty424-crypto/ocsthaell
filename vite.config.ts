import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''),
      'process.env.NEXT_PUBLIC_GEMINI_API_KEY': JSON.stringify(env.NEXT_PUBLIC_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.ZEGO_APP_ID': JSON.stringify(env.ZEGO_APP_ID || process.env.ZEGO_APP_ID || ''),
      'process.env.ZEGO_SERVER_SECRET': JSON.stringify(env.ZEGO_SERVER_SECRET || process.env.ZEGO_SERVER_SECRET || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
