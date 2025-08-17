import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rplitePlugin from '@rplite/plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    rplitePlugin({
      srcDir: 'src',
    }),
  ],
  server: {
    open: '/__rplite',
  },
});
