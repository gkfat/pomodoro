import {
    fileURLToPath, URL, 
} from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineConfig({
    plugins: [vue({ template: { transformAssetUrls } }), vuetify({ autoImport: true })],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    test: {
        globals: true,
        environment: 'happy-dom',
    },
});
