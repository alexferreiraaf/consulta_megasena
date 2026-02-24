import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'Mega-Sena Resultados',
                short_name: 'Mega-Sena',
                description: 'Consulta de resultados da Mega-Sena',
                theme_color: '#209869',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'icon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
})
