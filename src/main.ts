import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupI18n } from './i18n';

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { useUserStore } from './stores/user';
import Particles from "vue3-particles";

const initializeApp = async () => {
    const app = createApp(App);

    const pinia = createPinia();
    app.use(pinia);

    // 2. [关键] 在挂载路由之前，先恢复认证状态
    console.log("[App Init] Attempting to restore auth status...");
    const userStore = useUserStore();
    await userStore.checkAuthStatus(); // 等待检查完成
    console.log("[App Init] Auth status check complete.");

    // 3. 现在 Pinia 的状态已经恢复，可以安全地使用 router 了
    app.use(router);
    app.use(ElementPlus);

    const i18n = setupI18n(pinia);
    app.use(i18n);

    app.use(Particles) // 2. 直接註冊，不再需要複雜的 init 函數

    // 4. 挂载应用
    app.mount('#app')
};

initializeApp();