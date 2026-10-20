# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev               # vite dev server
pnpm build             # vue-tsc 型別檢查 + vite build
pnpm lint              # eslint --fix（同時是 formatter，無 Prettier）
pnpm type-check        # vue-tsc（app + node 兩份 tsconfig）
pnpm test:run          # vitest 單次執行（happy-dom）
pnpm vitest run src/path/foo.test.ts   # 單一測試檔
pnpm vitest run -t "name"              # 依名稱執行單一測試
```

## Architecture

- 純前端 SPA：Vue 3 + TypeScript + Vuetify 4 + Vite，`@` alias 指向 `src/`。
- Vuetify 由 `vite-plugin-vuetify`（`autoImport: true`）按需引入，不要手動全量 import components；theme 設定在 `src/plugins/vuetify.ts`。
- `openspec/` 為 spec-driven workflow（使用 global 的 `opsx:*` skills，本專案不內建）；spec 尚未建立，infra 完成後再討論。

## Conventions

- 風格由 `eslint.config.mjs` 強制：4 space indent、single quotes、semicolons、trailing commas、`type` 優先於 `interface`、禁用 `any`。pre-commit 以 husky + lint-staged 執行 `eslint --fix`。
- **排版一律優先使用 Vuetify**：欄位/格狀排版用 `v-row`/`v-col`；對齊、間距、方向用 utility class（`d-flex`、`flex-column`、`align-center`、`justify-center`、`ga-*`、`pa-*`、`text-*` 等）寫在 template `class`。不使用原生 CSS；僅在 Vuetify class 做不到時（偽元素、`box-shadow`、`position: absolute` 等）才寫 `<style>`。
- 置中/頭尾對齊/垂直堆疊/緊湊的小元件仍用 `d-flex`，`v-row`/`v-col` 的 gutter 會破壞緊湊 UI。
