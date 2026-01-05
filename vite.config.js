// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // CAMBIO CLAVE: Volvemos a la ruta absoluta (/) para la raíz del dominio
  base: '/', 
  
  // 🛑 SECCIÓN CRÍTICA PARA EL VISOR 360° (Soluciona el error de "export named")
  optimizeDeps: {
    // Forzamos a Vite a incluir y pre-paquetizar estas dependencias
    include: [
      'three', // Necesario porque PSV lo usa
    ],
  },
  // 🛑 FIN DE SECCIÓN CRÍTICA
})