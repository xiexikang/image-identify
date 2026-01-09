import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: true,
    host: '0.0.0.0',
    port: 4567,
    strictPort: true,
  },
  resolve: {
    // 别名
    alias: {
      '@root': resolve(__dirname, ''),
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
})
