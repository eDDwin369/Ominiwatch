import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // tailwindcss() compiles the scoped stylesheet in src/help-app/help.css for
  // the ported Help Management feature. It does not affect the host app, which
  // keeps its own plain-CSS stack.
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The ported help feature keeps its original `@/` imports, remapped here
      // to an isolated namespace so it can't collide with the host's src tree.
      '@help': path.resolve(__dirname, 'src/help-app'),
      // Bridge TanStack Router hooks onto the host's hash navigation.
      '@tanstack/react-router': path.resolve(__dirname, 'src/help-app/lib/router-shim.tsx'),
    },
  },
  server: {
    // restart trigger bug 16
    //
    // Dev proxy to the Help Management API service (see `api/`). Proxying keeps
    // the browser on one origin, so there is no CORS preflight and the client
    // needs no base URL (`VITE_HELP_API_URL` stays empty).
    proxy: {
      '/api': {
        target: process.env.HELP_API_URL ?? 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  }
})
