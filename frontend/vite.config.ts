import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    host: true, // 0.0.0.0 - accept connections outside the container
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    allowedHosts: ['salesforce-oauth-frontend'],
  },
})
