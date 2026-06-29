import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The GLPI server. All browser requests go through the `/glpi` proxy below so we
// never hit CORS and the secrets stay on this single config (prototype only).
const GLPI_TARGET = 'https://vr.in1.glpi-network.cloud';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/glpi': {
                target: GLPI_TARGET,
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/glpi/, ''),
            },
        },
    },
});
