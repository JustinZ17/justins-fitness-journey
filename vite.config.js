import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name, or Pages serves index.html fine but
// 404s every /assets/* request and you get a blank screen.
export default defineConfig({
  base: '/justins-fitness-journey/',
  plugins: [react()],
  server: { host: true },
})
