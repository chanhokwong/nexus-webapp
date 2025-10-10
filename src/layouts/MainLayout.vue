<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <img src="../assets/nexus-logo.png" alt="Nexus Logo" class="sidebar-logo">
        <span class="brand-text">NEXUS</span>
      </div>
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
      
      <!-- 折叠按钮 -->
      <div class="sidebar-toggle" @click="isSidebarCollapsed = !isSidebarCollapsed">
        <el-icon><DArrowLeft /></el-icon>
      </div>

      <div class="sidebar-footer">
        <div class="user-profile">
          <UserAvatar :email="userStore.currentUser?.email" />
          <div class="user-info">
            <span class="email" :title="userStore.currentUser?.email">{{ userStore.currentUser?.email }}</span>
            <a href="#" @click.prevent="onLogout" class="logout">{{ $t('sidebar.logout') }}</a>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view :key="localeStore.currentLocale" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import UserAvatar from '../components/UserAvatar.vue';
import { House, Files, Collection, Clock, Suitcase, Setting, DArrowLeft } from '@element-plus/icons-vue';
import { useLocaleStore } from '../stores/locale';

const isSidebarCollapsed = ref(false);
const router = useRouter();
const userStore = useUserStore();
const onLogout = () => { router.push('/login'); userStore.logout(); };
const localeStore = useLocaleStore();
</script>

<style scoped>
/* --- 在组件内部定义所有样式和变量 --- */
.layout-container {
  --sidebar-bg: rgba(17, 19, 44, 0.6);
  --main-bg-start: #2a1a63;
  --main-bg-end: #00728c;
  --card-bg: rgba(29, 31, 74, 0.5);
  --active-bg: rgba(88, 94, 227, 0.2);
  --active-glow: #585EE3;
  --text-primary: #f0f2f5;
  --text-secondary: #a0a6c0;
  --border-color: rgba(88, 94, 227, 0.3);
  --sidebar-width: 260px;
  --sidebar-width-collapsed: 90px;
  
  display: flex;
  font-family: 'Noto Sans TC', sans-serif;
  background-color: var(--main-bg-start);
  color: var(--text-primary);
}

.sidebar {
    width: var(--sidebar-width);
    height: 100vh;
    position: fixed; top: 0; left: 0;
    display: flex; flex-direction: column; padding: 24px;
    background-color: var(--sidebar-bg);
    backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
    border-right: 1px solid var(--border-color); z-index: 10;
    transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
}
.sidebar-header { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
.sidebar-logo { width: 32px; height: 32px; filter: drop-shadow(0 0 10px #fff); }
.sidebar-brand { font-size: 20px; font-weight: 700; letter-spacing: 2px; white-space: nowrap; transition: opacity 0.2s ease; }

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

.sidebar-toggle {
    display: flex; align-items: center; justify-content: center;
    height: 40px; background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary); border-radius: 8px;
    cursor: pointer; margin: 20px 0;
    transition: all 0.3s ease;
}
.sidebar-toggle:hover { background: var(--active-bg); color: var(--text-primary); }
.sidebar-toggle .el-icon { transition: transform 0.3s ease; }

.sidebar-footer { margin-top: auto; }
.user-profile { display: flex; align-items: center; gap: 12px; margin-top: 24px; overflow: hidden; }
.user-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.user-info .email { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-info .logout { font-size: 12px; color: var(--text-secondary); text-decoration: none; align-self: flex-start; }
.user-info .logout:hover { color: var(--active-glow); }

/* --- [核心修正] 折叠状态样式 --- */
.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
  padding: 24px 12px;
}
.sidebar.collapsed .brand-text,
.sidebar.collapsed .nav-text,
.sidebar.collapsed .user-info {
  opacity: 0;
  width: 0;
  pointer-events: none;
  position: absolute; /* 关键：让其脱离文档流，不影响布局 */
}
.sidebar.collapsed .sidebar-header,
.sidebar.collapsed .nav-item a {
  justify-content: center;
}
.sidebar.collapsed .user-profile {
  justify-content: center;
}
.sidebar.collapsed .nav-item.active a::before {
  left: -12px;
}
.sidebar.collapsed .sidebar-toggle .el-icon {
  transform: rotate(180deg);
}

.main-content {
    flex-grow: 1; 
    /* [修正] 使用 CSS 变量来动态计算 margin-left */
    margin-left: var(--sidebar-width);
    padding: 40px; min-height: 100vh;
    background-image: radial-gradient(circle at bottom right, var(--main-bg-end), var(--main-bg-start));
    transition: margin-left 0.3s ease-in-out;
}
.sidebar.collapsed + .main-content {
  margin-left: var(--sidebar-width-collapsed);
}
</style>

<style>
/* --- [核心] MessageBox 全局自定义样式 --- */
.el-overlay.is-message-box .el-overlay-message-box {
  backdrop-filter: blur(5px);
}
.nexus-messagebox {
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 20px var(--active-bg) !important;
}
.nexus-messagebox .el-message-box__header {
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}
.nexus-messagebox .el-message-box__title {
  color: var(--text-primary) !important;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 700;
}
.nexus-messagebox .el-message-box__close {
  color: var(--text-primary) !important;
}
.nexus-messagebox .el-message-box__content {
  color: var(--text-secondary) !important;
  padding: 20px 15px !important;
}
.nexus-messagebox .el-message-box__input .el-input__wrapper {
  background-color: rgba(0,0,0,0.2) !important;
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.nexus-messagebox .el-message-box__btns {
  gap: 10px;
}

/* 自定义按钮样式 */
.nexus-messagebox .el-button {
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}
.nexus-messagebox .el-button--default {
  background-color: transparent !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-secondary) !important;
}
.nexus-messagebox .el-button--default:hover {
  background-color: var(--active-bg) !important;
  color: var(--text-primary) !important;
}
.nexus-messagebox .el-button--primary {
  background-color: var(--active-glow) !important;
  border-color: var(--active-glow) !important;
  color: var(--text-primary) !important;
}
.nexus-messagebox .el-button--primary:hover {
  filter: brightness(1.2);
  box-shadow: 0 0 10px var(--active-glow);
}


/* --- [核心] 确保 ElDropdown 全局自定义样式存在 --- */
.el-popper.is-light {
  border: none !important;
  box-shadow: none !important;
}

/* 菜单容器 */
.el-dropdown__popper {
  background: hsl(233, 62%, 18%) !important;
  border: 1px solid rgba(88, 94, 227, 0.5) !important;
  border-radius: 10px !important;
  padding: 8px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  min-width: 220px !important; /* 增加宽度以容纳新样式 */
}

/* 菜单项 */
.el-dropdown-menu__item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  color: var(--text-secondary) !important;
  border-radius: 6px !important;
  padding: 12px 15px !important;
  font-weight: 500 !important;
  font-size: 16px !important; /* 稍微增大字体 */
  font-family: 'Noto Sans TC', sans-serif !important;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
}

/* 菜单项内部的图标 */
.el-dropdown-menu__item .el-icon {
  font-size: 20px !important;
  color: #8A91B4 !important; /* 设置一个固定的、更亮的图标颜色 */
  transition: color 0.2s ease !important;
}

/* 菜单项悬停效果 */
.el-dropdown-menu__item:hover {
  background-color: var(--active-bg) !important;
  color: var(--text-primary) !important;
  transform: translateX(4px);
}
.el-dropdown-menu__item:hover .el-icon {
  color: var(--primary-glow) !important; /* 悬停时图标变为高亮色 */
}

/* [最终修正] 分割线样式 */
.el-dropdown-menu__item--divided {
  /* 1. 移除顶部的实线边框 */
  border-top: none !important; 
  margin-top: 6px !important; /* 2. 增加上边距，形成空间 */
  padding-top: 6px !important; /* 3. 增加上内边距，形成空间 */
  
  /* 4. 在上方画一条更 subtle 的、渐变的分割线 */
  position: relative;
}

/* 箭头 */
.el-popper__arrow::before {
  background: hsl(233, 62%, 18%) !important;
  border-color: rgba(88, 94, 227, 0.5) !important;
}
</style>