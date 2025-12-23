import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour l'app automatiquement dès qu'il y a du nouveau code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TaskFlow - Gestion Sociale',
        short_name: 'TaskFlow',
        description: 'Gérez vos tâches et défiez vos amis.',
        
        // COULEURS DU THÈME (Gris foncé Tailwind gray-900)
        // Cela permet que la barre de statut du téléphone soit de la même couleur que l'app
        theme_color: '#111827',
        background_color: '#111827',
        
        display: 'standalone', // Enlève l'interface du navigateur (URL, boutons)
        orientation: 'portrait', // Bloque en mode portrait (optionnel, mais mieux pour une Todo list)
        
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            // "any" = Icône normale
            // "maskable" = Autorise Android à rogner les bords pour faire un rond parfait sans blanc/noir autour
            purpose: 'any maskable' 
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})