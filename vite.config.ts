import { execSync } from 'node:child_process';
import {
    fileURLToPath, URL, 
} from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// 部署資訊於 build 時寫入：優先取 CI 提供的 commit，其次 git，取不到顯示 dev。
const resolveCommit = (): string => {
    const fromEnv = process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.CF_PAGES_COMMIT_SHA;
    if (fromEnv) {
        return fromEnv.slice(0, 7);
    }
    try {
        return execSync('git rev-parse --short HEAD', {
            stdio: [
                'ignore',
                'pipe',
                'ignore',
            ], 
        }).toString().trim();
    } catch (error) {
        console.warn('[build] 無法取得 git commit，版本顯示 dev', error);
        return 'dev';
    }
};

export default defineConfig({
    define: {
        __APP_COMMIT__: JSON.stringify(resolveCommit()),
        __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
    plugins: [vue({ template: { transformAssetUrls } }), vuetify({ autoImport: true })],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    test: {
        globals: true,
        environment: 'happy-dom',
    },
});
