import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
    },
    base: env.VITE_DEMO_MODE === 'true' ? '/habit-quest/' : '/',
    server: {
      proxy: {
        '/api': 'http://localhost:3000'
      }
    }
  }
})
