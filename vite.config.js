// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   base: '/'
// })

// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CRITICAL: The base URL for a User/Organization site must be '/'.
export default defineConfig({
  plugins: [react()],
  base: '/', 
})
