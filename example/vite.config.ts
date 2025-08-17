import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rplite from '@rplite/plugin';

export default defineConfig({
  plugins: [react(), rplite()],
  server: {
    open: '/__rplite'
  }
});
