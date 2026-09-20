import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // Native addon: must be loaded from node_modules at runtime, not bundled.
      external: ['sherpa-onnx-node'],
    },
  },
});
