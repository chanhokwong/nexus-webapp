import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupI18n } from './i18n';

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import Particles from "vue3-particles";

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

const i18n = setupI18n(pinia)
app.use(router)
app.use(i18n);

app.use(createPinia())

app.use(ElementPlus)
app.use(Particles) // 2. 直接註冊，不再需要複雜的 init 函數

app.mount('#app')