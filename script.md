# Nexus Web App - 前端專案說明書 (v1.0)

## 1. 專案概述

本專案是 **Nexus AI 學習助手** 的官方 Web 前端應用程式。它旨在為桌面端用戶提供一個強大、體驗流暢的工作空間，與行動裝置 App 的核心功能保持一致，並充分利用桌面端的大螢幕優勢。

- **線上訪問網址**: `https://app.nexus-ai-edu.app/`
- **後端 API 位址**: `https://api.nexus-ai-edu.app`
- **程式碼倉庫**: `https://github.com/chanhokwong/nexus-webapp`

## 2. 技術架構 (Tech Stack)

為了實現快速開發、高效能和長期可維護性，我們選擇了 Vue 3 生態系統中最現代、最主流的技術組合。

- **核心框架**: **Vue.js 3.x**
 - 完全採用 **`<script setup>`** 語法，遵循 **Composition API** 模式，程式碼邏輯更清晰、更容易重複使用。
- **建置工具**: **Vite**
 - 提供閃電般的開發伺服器啟動速度和模組熱更新 (HMR)，大幅提升開發效率。生產建置基於 Rollup，打包產物小且有效率。
- **程式語言**: **TypeScript**
 - 為專案提供了靜態類型檢查，能在編碼階段就發現潛在錯誤，增強了程式碼的健全性和大型專案的可維護性。
- **狀態管理**: **Pinia**
 - Vue 官方推薦的狀態管理庫，輕量、直覺、對 TypeScript 支援完美，且擁有強大的開發者工具。
- **路由管理**: **Vue Router 4.x**
 - Vue 官方路由，用於管理應用程式的頁面跳躍和嵌套視圖。
- **HTTP 請求**: **Axios**
 - 成熟、強大的 HTTP 用戶端，透過封裝的攔截器，實現了全域的 Token 注入、語言偏好設定和統一的錯誤處理。
- **UI 元件庫**: **Element Plus**
 - 提供了豐富、高品質的基礎元件（如 `ElDialog`, `ElSelect`, `ElDropdown`），我們在此基礎上進行了深度的自訂樣式，以配合應用程式的獨特視覺風格。
- **國際化 (i18n)**: **vue-i18n**
 - 實作了應用程式介面的中英文切換功能，所有文字都集中在 `src/locales` 目錄下的 JSON 檔案中進行管理。
- **CSS 方案**:
 - **CSS 變數**: 在 `MainLayout.vue` 和全域樣式中定義了一套完整的色彩和佈局變數（`--panel-bg`, `--active-glow` 等），確保了視覺風格的高度統一。 
- **Scoped CSS**: 預設使用 Vue 的 Scoped CSS 來隔離元件樣式。 
- **全域/非 Scoped CSS**: 對於需要覆寫第三方函式庫（如 Element Plus）預設樣式的場景，我們使用了不含 `scoped` 的 `<style>` 標籤。
- **視覺化函式庫**:
 - **Mermaid.js**: 用於將後端傳回的文字程式碼渲染為層級清晰的知識圖譜。 
- **Panzoom**: 為 Mermaid.js 產生的 SVG 新增了平移和縮放的交互能力（**註：此方案已被廢棄**）。 
- **純 CSS + JS 事件**: 最終採用的、更可靠的圖譜互動方案。
- **程式碼規範**:
 - **ESLint** & **Prettier**: (建議在專案中配置) 用於保證程式碼風格的統一和語法的正確性。

## 3. 專案結構

專案遵循標準的 Vue 3 + Vite 結構，並在此基礎上進行了模組化劃分。
nexus-webapp/
├── public/ # 靜態資源 (會直接複製到 dist 根目錄)
│ └── vite.svg
├── src/
│ ├── api/ # API 服務層 (核心)
│ │ ├── axios.ts # Axios 實例配置與攔截器
│ │ ├── auth.ts # 使用者認證相關 API
│ │ ├── documents.ts # 文件管理 API
│ │ ├── workspaces.ts # 工作台 API
│ │ ├── history.ts # 歷史記錄 API (聚合)
│ │ ├── ai.ts # 所有 AI 智慧產生 API
│ │ ├── tools.ts # 論文對譯 API (預留)
| | └── notes.ts # 筆記 API
│ ├── assets/ # 本地靜態資源 (會被 Vite 處理)
│ │ ├── google-icon.svg
│ │ ├── nexus-logo.png
│ │ └── vue.svg
│ ├── components/ # 可重複使用的 Vue 元件
│ │ ├── AiTutorChat.vue
│ │ ├── CreateWorkspaceModal.vue
│ │ ├── LongAnswerPlayer.vue
│ │ ├── NavigationList.vue
│ │ ├── SplashScreen.vue
│ │ ├── UserAvatar.vue
│ │ ├── MarkdownRenderer.vue
│ │ ├── QuizPlayer.vue
│ │ ├── FlashcardViewer.vue
│ │ └── KnowledgeGraphRenderer.vue
│ ├── layouts/ # 頁面佈局元件
│ │ └── MainLayout.vue # 登入後的主佈局 (含側邊欄)
│ ├── locales/ # 國際化語言文件
│ │ ├── zh.json
│ │ └── en.json
│ ├── router/ # 路由配置
│ │ └── index.ts
│ ├── stores/ # Pinia 狀態管理
│ │ ├── user.ts # 使用者狀態
│ │ └── locale.ts # 語言狀態
│ ├── types/ # 全域 TypeScript 類型聲明
│ │ ├── api.ts 
│ │ └── global.d.ts
│ ├── views/ # 頁面層級元件
│ │ ├── ChatReview.vue # AI導師歷史回顧頁
│ │ ├── ClueSheetReview.vue # 記憶卡歷史回顧頁
│ │ ├── Dashboard.vue # 主頁
│ │ ├── Files.vue # 文件列表頁
│ │ ├── GraphReview.vue # 知識架構圖歷史回顧頁
│ │ ├── History.vue # 歷史回顧列表頁
│ │ ├── Login.vue # 登入頁
│ │ ├── LongAnswerReview.vue # 長題目歷史回顧頁
│ │ ├── NoteReview.vue # 筆記歷史回顧頁
│ │ ├── QuizReview.vue # 選擇題歷史回顧頁
│ │ ├── Register.vue # 注冊頁
│ │ ├── Settings.vue # 設置頁
│ │ ├── ShortAnswerQuiz.vue # 短題目頁面
│ │ ├── ShortAnswerReview.vue # 短題目歷史回顧頁面
│ │ ├── Tools.vue  # 工具箱頁
│ │ ├── TutorialView.vue # 教程頁
│ │ ├── WorkspaceDetail.vue # 工作台詳情頁
│ │ └── WorkspaceList.vue # 工作台列表頁
│ ├── App.vue # 應用根元件
│ ├── main.ts # 應用主入口
│ ├── i18n.ts # vue-i18n 配置
│ └── vite-env.d.ts # Vite 環境變數類型聲明
├── .gitgnore
├── index.html # 應用程式入口 HTML，用於引入 Google 腳本
├── package-lock.json
├── package.json # 專案依賴
├── README.md
├── script.md # 項目說明書
├── shims-vue.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts # Vite 設定文件
code
Code
## 4. 核心功能實現與開發進度

### a. 使用者認證 (Authentication) - **已完成**
- **概述**: 提供了完整的使用者生命週期管理，包括註冊、登入、登出，並支援 Google 第三方登入。實現了持久化會話，確保使用者在刷新頁面後能保持登入狀態。
- **關鍵元件**: `Login.vue`, `Register.vue`, `stores/user.ts`, `api/auth.ts`
- **實作細節**:
 - **持久化登入**:
   1. **登入成功**: `userStore` 的 `handleLogin` 或 Google 登入回調，在取得 `access_token` 後，會呼叫 `setToken`，將 Token 同時存入 Pinia 的 `ref` 和瀏覽器的 `localStorage`。 
   2. **應用程式啟動**: 在 `main.ts` 的 `initializeApp` 非同步函數中，我們**首先** `await userStore.checkAuthStatus()`。 
   3. **狀態恢復**: `checkAuthStatus` 會檢查 `localStorage` 中是否存在 `token`。如果存在，它會立即向後端 `GET /users/me` 發送驗證請求。如果請求成功，則以傳回的使用者資訊填入 `currentUser`，此時 `isLoggedIn` 計算屬性會自動變成 `true`。如果失敗，則 `logout()` 會被調用，清理無效的 `token`。 
   4. **時序保證**: 整個「恢復記憶」的過程在 `app.use(router)` **之前**完成，確保了路由守衛在做出判斷時，用戶狀態已經是最終的、正確​​的狀態。 
 - **路由守衛 (`router/index.ts`)**:
   - `router.beforeEach` 在每次導航前觸發。 
   - 它檢查目標路由的元資訊 `meta.requiresAuth`。 
   - 如果需要授權 (`true`) 且 `userStore.isLoggedIn` 為 `false`，則強制重定向到 `/login`。 
 - **Google 登入 (`Login.vue`)**:
   - 採用 Google Identity Services (GIS) 函式庫的「回呼模式」 (`?onload=...`)，確保在外部腳本載入完成後才初始化。 
   - 使用「**狀態驅動**」的互動模式：`isGisReady` 這個 `ref` 追蹤 Google 庫的就緒狀態，當使用者點擊自訂按鈕時，我們檢查這個狀態，並在**必要時重新渲染**被隱藏的官方按鈕，再以程式方式觸發其 `.click()` 事件。這個方案解決了在生產環境中因網路延遲導致的「雙擊才能登入」的競態條件問題。

### b. 主佈局 (Main Layout) - **完成**
- **組件**: `layouts/MainLayout.vue`
- **功能**: 作為所有需要用戶登入後才能訪問的頁面的“外殼”，提供了統一的導航和視覺框架。
- **實作細節**:
 - **響應式設計**: 透過 CSS **媒體查詢 (`@media (max-width: 768px)`)**，實現了兩種完全不同的佈局模式。 
 - **桌面端**:
   - 固定的左側導覽列 (`<aside class="sidebar desktop-only">`)，寬度可變。 
   - 提供了可點擊的折疊/展開按鈕，透過修改 `isSidebarCollapsed` 狀態和 CSS class (`.collapsed`) 來實現平滑的寬度過渡動畫。 
   - 主內容區 (`<main class="main-content">`) 的 `margin-left` 會根據側邊欄的折疊狀態動態調整。 
 - **行動端**:
   - 桌面側邊欄被 `display: none` 隱藏。 
   - **頂部 Header**: 一個只在行動端顯示的 `<header class="mobile-header">`，包含 Logo 和一個用於打開抽屜選單的「漢堡」按鈕。 
   - **抽屜式選單**: 使用 Element Plus 的 `<el-drawer>` 元件，點擊漢堡按鈕時，一個與桌面版內容完全相同的側邊欄會從左側滑出。 
   - **底部標籤列**: 一個只在行動端顯示的 `<footer class="mobile-footer">`，使用 CSS Grid 佈局，提供了對四個核心功能（主頁、工作台、檔案、設定）的快速存取入口。透過 `.router-link-exact-active` 自動高亮目前頁面對應的標籤。

### c. 工作台 (Workspaces) - **核心功能區, 已完成**
- **清單頁 (`WorkspaceList.vue`)**:
 - **資料**: `onMounted` 時呼叫 `getWorkspaces()` API 取得並展示所有工作台清單。 
 - **互動**:
   - 採用卡片式網格佈局，點選卡片主體會透過 `router.push` 跳到對應的詳情頁。 
   - **事件衝突解決**: 卡片右上角的「更多選項」 (`<el-dropdown>`) 與卡片的點擊跳轉事件有衝突。最終我們採用了**“分離導航與內容”**的 HTML 結構方案：卡片內部分為“導航區”和獨立的“交互區”，從 DOM 結構上徹底根除了事件冒泡問題。 
   - **增刪改**: 建立、重新命名、刪除等操作透過 Element Plus 的 `ElMessageBox.prompt` 和 `ElMessageBox.confirm` 實現，成功後會重新呼叫 `fetchWorkspaces()` 來刷新列表，確保資料一致性。
- **詳情頁 (`WorkspaceDetail.vue`)**:
 - **佈局**: 實現了經典的三欄式佈局，並在行動端透過媒體查詢自動轉換為單欄垂直佈局。 
 - **文件庫**: 實現了動態新增/移除文件到工作台的功能，並支援彈跳窗預覽原始文件 (`<iframe>`)。 
 - **智慧操作 (核心)**:
   - **統一調度**: 所有 AI 功能都由一個 `runAiTool(toolType)` 函數統一調度。 
   - **視圖切換**: 此函數的核心職責是**設定 `aiResultType` 狀態**。 `<template>` 中的 `v-if / v-else-if` 鏈會根據這個狀態，動態地渲染對應的預覽元件。 
   - **互動式 vs. 一次**:
     - **互動式工具** (AI 導師, 長答案): `runAiTool` 只負責切換視圖 (`aiResultType = 'chat'`)，然後**立即返回**。後續的所有 API 呼叫和狀態管理都由被渲染的子元件 (`AiTutorChat.vue`, `LongAnswerPlayer.vue`) **自己負責**。 
     - **一次性產生工具** (筆記, 圖譜, 測驗, 卡片): `runAiTool` 會 `await` 對應的 `generate...` API 調用，取得到結果後，將其存入 `aiResult` 狀態，然後由對應的預覽元件 (`MarkdownRenderer`, `Knowledge, `Knowledge, etc, etc) 進行渲染。 
   - **自動儲存**: 所有「產生」類別操作（圖譜、筆記、卡片）和練習類別操作（測驗、短答案）都已實現「產生/完成後即自動儲存」的無縫體驗。

### d. 歷史回顧 (History) - **完成**
- **清單頁 (`History.vue`)**:
 - **API 聚合**: `getAllHistory` 函數是前端資料聚合的核心。它使用 `Promise.allSettled` 並行呼叫多個不同的歷史清單 API（`/quiz-history/sessions`, `/chat-history/sessions` 等）。 
 - **資料轉換**: 取得不同結構的資料後，會將其**統一**轉換為 `HistoryEvent` 介面格式，並按時間戳排序，最終渲染為「記憶之流」時間軸。 
 - **滾動問題解決**: 最終採用了**`position: fixed`** 的強制佈局方案，將頁面分為固定的“頭部”、“功能欄”和可滾動的“內容區”，徹底解決了因複雜 CSS 繼承鏈導致滾動條失效的頑固問題。
- **詳情頁** (`QuizReview.vue`, `NoteReview.vue`, etc.):
 - **模式重複使用**: 所有詳情頁都重複使用了**相同**的佈局模式：一個固定的 `page-header` 和一個 `flex-grow: 1; overflow-y: auto;` 的內容面板，確保了體驗的一致性和滾動的可靠性。 
 - **資料驅動**: 每個詳情頁都在 `onMounted` 中透過 `useRoute().params.id` 取得 ID，並呼叫對應的 `get...ById` API 來載入和展示資料。

## 5. 編碼規範與注意事項

1. **狀態管理**:
   - 任何跨元件、或需要持久化的狀態，都應透過 **Pinia** 進行管理。 
   - 避免在元件內部直接修改 `localStorage`，應透過 Pinia Action 來統一操作。
2. **API 呼叫**:
   - 所有與後端 API 的互動都必須封裝在 `src/api/` 目錄下的服務檔案中。 
   - **禁止**在 Vue 元件內部直接呼叫 `axios` 或 `fetch`。 
   - 對於耗時較長的 AI 相關請求，請使用 `longTimeoutApiClient`。
3. **樣式**:
   - 優先使用**元件內 Scoped CSS**。 
   - 對於需要覆寫第三方程式庫（如 Element Plus）或實作全域主題的樣式，請在 `MainLayout.vue` 或 `App.vue` 的**非 `scoped` `<style>` 標籤**中定義。 
   - 顏色、字體、間距等應盡可能使用 `:root` 中定義的 CSS 變數。
4. **國際化 (i18n)**:
   - **禁止**在 `<template>` 或 `<script>` 中硬編碼任何面向使用者的文字（中文或英文）。 
   - 所有文字都必須透過 `$t('key')` (在範本中) 或 `t('key')` (在腳本中) 來引用。 
   - 新增的文字需要在 `src/locales/zh.json` 和 `en.json` 中同步新增。
5. **型別安全**:
   - 為所有 `props`、`ref`、函數參數和傳回值提供明確的 TypeScript 類型。 
   - 從 API 取得資料後，應與 `api/*.ts` 中定義的介面類型進行比對。 
   - 謹慎使用 `any` 類型。只在處理第三方函式庫或無法預知結構的 API 回應時暫時使用。 
   - 對於可能為空的值，在存取其屬性前，必須進行**空值檢查** (`if (obj)` 或 `obj?.property`)。

## 6. 如何開始開發

1. **安裝依賴**:
    ```bash
    npm install
    ```
2. **啟動開發伺服器**:
    ```bash
    npm run dev
    ```
    應用程式將在 `http://localhost:5173` 上運行。
3. **建置生產版本**:
    ```bash
    npm run build
    ```
    建置產物將生成在 `dist` 資料夾中。

## 7. 部署 (Deployment)

本專案已配置為透過 **Vercel** 進行自動化部署。

### a. 部署流程
1. **匯入專案**: 在 Vercel Dashboard 中，透過 “Add New... -> Project” 匯入您的 GitHub 倉庫。
2. **配置**: Vercel 會自動識別為 “Vite” 項目。您**唯一**需要手動配置的可能是 **Environment Variables** (環境變數)，請確保新增了 `VITE_API_BASE_URL` (如果需要的話)。
3. **部署**: 點選 “Deploy”。 Vercel 會自動執行 `npm install` 和 `npm run build`。

### b. 關鍵設定檔解析
- **`vite.config.ts`**:
 - 我們整合了 `vite-plugin-csp` 外掛程式來管理**內容安全策略 (CSP)**。 
- 特別是，為了讓 `Mermaid.js` 能夠正常運作，我們在 `script-src` 指令中加入了 `'unsafe-eval'`。這是一個必要的安全“豁免”，以允許 Mermaid.js 的動態渲染。
- **`vercel.json` (如果需要)**:
 - 預設情況下，Vite 專案部署到 Vercel **不需要** `vercel.json` 檔案。 Vercel 的 Vite 預設會自動處理所有事情。 
- 只有在您需要設定**伺服器端重寫/重定向**或**自訂頭部**等進階功能時，才需要建立此檔案。對於本專案目前的 SPA (單頁應用) 模式，是不需要的。

### c. 常見部署問題
- **環境變數缺失**: 如果部署後的應用程式無法連線到 API，請先檢查 Vercel 專案設定中的環境變數是否已正確配置。
- **CORS 錯誤**: 如果 API 請求失敗並報告 CORS 錯誤，這**不是**前端部署的問題。請聯絡後端開發者，確保 Vercel 部署的網域（例如 `nexus-webapp.vercel.app`）已經被加入到了後端伺服器的 `Access-Control-Allow-Origin` 清單中。
- **Google 登入失敗 (`401: invalid_client`)**:
 - 這是一個**極為常見**的部署後問題。 
- **解決方案**: 您必須登入 Google Cloud Console，找到您的 OAuth 2.0 用戶端 ID，並在「**已授權的 JavaScript 來源**」清單中，**新增**您的 Vercel 生產網域名稱 (`https://nexus-webapp.vercel.app`)。

---