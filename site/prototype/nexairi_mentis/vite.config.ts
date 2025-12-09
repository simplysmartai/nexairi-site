import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    base: '/', // Ensures assets are loaded from root
    plugins: [react()],
    define: {
      // This is necessary to prevent "process is not defined" in the browser
      // and to expose the API_KEY from Cloudflare environment variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});