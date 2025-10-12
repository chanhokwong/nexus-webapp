<template>
  <nav class="nav">
    <ul class="nav-list">
      <li class="nav-item" :class="{ active: $route.name === 'Dashboard' }">
        <router-link to="/dashboard" title="主頁"><el-icon><House /></el-icon><span class="nav-text">{{ $t('sidebar.dashboard') }}</span></router-link>
      </li>
      <li class="nav-item" :class="{ active: $route.name === 'Files' }">
        <router-link to="/files" title="文件"><el-icon><Files /></el-icon><span class="nav-text">{{ $t('sidebar.files') }}</span></router-link>
      </li>
      <li class="nav-item" :class="{ active: $route.name && $route.name.toString().startsWith('Workspace') }">
        <router-link to="/workspaces" title="工作台"><el-icon><Collection /></el-icon><span class="nav-text">{{ $t('sidebar.workspaces') }}</span></router-link>
      </li>
      <li class="nav-item" :class="{ active: $route.name === 'History' }">
        <router-link to="/history" title="歷史回顧"><el-icon><Clock /></el-icon><span class="nav-text">{{ $t('sidebar.history') }}</span></router-link>
      </li>
      <li class="nav-item" :class="{ active: $route.name === 'Tools' }">
        <router-link to="/tools" title="工具箱"><el-icon><Suitcase /></el-icon><span class="nav-text">{{ $t('sidebar.tools') }}</span></router-link>
      </li>
      <li class="nav-item" :class="{ active: $route.name === 'Settings' }">
        <router-link to="/settings" title="設定"><el-icon><Setting /></el-icon><span class="nav-text">{{ $t('sidebar.settings') }}</span></router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { House, Files, Collection, Clock, Suitcase, Setting } from '@element-plus/icons-vue';
</script>

<style scoped>
/* 將原組件中與 nav 相關的樣式複製到這裡 */
.nav { flex-grow: 1; }
.nav-list { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 0; }
.nav-item a {
    display: flex; align-items: center; gap: 16px;
    padding: 12px; border-radius: 8px; text-decoration: none;
    color: var(--text-secondary); font-weight: 500;
    position: relative; transition: background-color 0.3s, color 0.3s;
    overflow: hidden;
}
.nav-item a .el-icon { font-size: 20px; flex-shrink: 0; }
.nav-text { white-space: nowrap; transition: opacity 0.2s ease; }
.nav-item a:hover { background-color: var(--active-bg); color: var(--text-primary); }
.nav-item.active a {
    background-color: var(--active-bg); color: var(--text-primary);
    box-shadow: 0 0 15px var(--active-bg);
}
.nav-item.active a::before {
    content: ''; position: absolute; left: -24px; top: 0;
    height: 100%; width: 4px; background-color: var(--active-glow);
    border-radius: 0 4px 4px 0; box-shadow: 0 0 10px var(--active-glow);
    transition: left 0.3s ease-in-out;
}

/* 針對折疊狀態的樣式，可以保留在父組件或傳入 prop 控制，這裡放在父組件中更合適 */
/* 因為折疊狀態是父組件的，由父組件的 class 控制子元素的樣式更符合 CSS 邏輯 */
</style>