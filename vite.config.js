/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@_src": path.resolve(__dirname, "./src"),
      "@_components": path.resolve(__dirname, "./src/components"),
      "@_contexts": path.resolve(__dirname, "./src/contexts"),
      "@_providers": path.resolve(__dirname, "./src/providers"),
      "@_routes": path.resolve(__dirname, "./src/routes"),
      "@_services": path.resolve(__dirname, "./src/services"),
      "@_store": path.resolve(__dirname, "./src/store"),
      "@_templates": path.resolve(__dirname, "./src/templates"),
      "@_utils": path.resolve(__dirname, "./src/utils"),
      "@_types": path.resolve(__dirname, "./src/types")
    }
  },
})