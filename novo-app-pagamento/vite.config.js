import { defineConfig } from 'vite'
import path from "path" // Importe o 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Adicione a seção abaixo
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})