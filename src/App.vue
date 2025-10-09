<script setup lang="ts">
import { ref } from 'vue';
import SplashScreen from './components/SplashScreen.vue'; // 導入我們的新組件

// 創建一個狀態來控制 SplashScreen 的顯示
const isLoading = ref(true);

// 當 SplashScreen 發出 'animation-finished' 事件時，調用此函數
const handleAnimationFinished = () => {
  isLoading.value = false;
};
</script>

<template>
    <!-- 
    這裡是路由的渲染出口。
    所有匹配到的頁面組件 (Login.vue, Dashboard.vue 等)
    都將會在這個位置被渲染出來。
  -->
  <SplashScreen v-if="isLoading" @animation-finished="handleAnimationFinished" />
  <router-view v-else />
</template>

<style>
/* 全局樣式 */
:root {
  --bg-color: #1a237e; /* [恢復] 核心背景色 */
  --primary-glow: #40C4FF;
  --secondary-glow: #7C4DFF;
  --text-color: #C5CAE9;
  --border-color: rgba(64, 196, 255, 0.4);

  --sidebar-bg: rgba(17, 19, 44, 0.6);
  --main-bg-start: #2a1a63;
  --main-bg-end: #00728c;
  --card-bg: rgba(29, 31, 74, 0.5);
  --active-bg: rgba(88, 94, 227, 0.2);
  --active-glow: #585EE3;
  --text-primary: #f0f2f5;
  --text-secondary: #a0a6c0;
  --border-color: rgba(88, 94, 227, 0.3);
  --font-family: 'Noto Sans TC', sans-serif;
  --sidebar-width: 260px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body, html {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", var(--font-family);
  background-color: #0d0c22;
  color: #e0e0e0;
  min-height: 100vh;
  overflow: hidden;
}
</style>
