import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // the wardrobe's background-removal worker imports onnxruntime-web; pre-bundling it
  // stops the dev server from reloading the page the first time a photo is processed
  optimizeDeps: {
    include: ['onnxruntime-web/wasm'],
  },
})
