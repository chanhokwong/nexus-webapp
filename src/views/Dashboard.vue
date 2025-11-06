<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1 class="welcome-title">{{ $t('dashboard.welcome_message') }}</h1>
    </header>

    <section class="dashboard-section">
      <!-- [改造] 添加 'quick-start-title' 類以添加圖標 -->
      <h2 class="section-title quick-start-title">{{ $t('dashboard.quick_start') }}</h2>
      <!-- [改造] 將 card-grid 改為 quick-start-list -->
      <div class="quick-start-list">
        <!-- 1. 文件工作台 -->
        <div class="quick-start-card" @click="router.push('/workspaces')">
          <div class="card-icon-wrapper"><el-icon><Files /></el-icon></div>
          <div class="card-text-content">
            <h3>{{ $t('dashboard.workspaces') }}</h3>
            <p>{{ $t('dashboard.workspaces_content') }}</p>
          </div>
        </div>

        <!-- 2. 知识宝库 -->
        <div class="quick-start-card" @click="router.push('/history')">
          <div class="card-icon-wrapper" style="background-color: rgba(149, 117, 205, 0.15); color: #B39DDB;"><el-icon><TakeawayBox /></el-icon></div>
          <div class="card-text-content">
            <h3>{{ $t('dashboard.knowledge_base') }}</h3>
            <p>{{ $t('dashboard.knowledge_base_content') }}</p>
          </div>
        </div>

        <!-- 3. 工具箱 -->
        <div class="quick-start-card" @click="router.push('/tools')">
           <div class="card-icon-wrapper" style="background-color: rgba(77, 182, 172, 0.15); color: #4DB6AC;"><el-icon><Suitcase /></el-icon></div>
           <div class="card-text-content">
            <h3>{{ $t('dashboard.toolbox') }}</h3>
            <p>{{ $t('dashboard.toolbox_content') }}</p>
           </div>
        </div>
      </div>
    </section>

    <section class="dashboard-section">
      <h2 class="section-title">{{ $t('dashboard.recent_projects') }}</h2>
      <div v-if="isLoading" class="loading-state">{{ $t('dashboard.loadProjectMsg') }}</div>
      <template v-else>
        <div v-if="recentWorkspaces.length > 0" class="recent-projects-grid">
          <!-- [改造] 使用新的 recent-project-card 樣式 -->
          <div 
            v-for="ws in recentWorkspaces" 
            :key="ws.id" 
            class="recent-project-card"
            @click="navigateTo(`/workspaces/${ws.id}`)"
          >
            <div class="card-icon-wrapper small"><el-icon><Collection /></el-icon></div>
            <h2 class="card-title">{{ ws.name }}</h2>
            <p class="card-description">{{ ws.description || 'NULL' }}</p>
            <div class="card-meta">
              <span class="meta-item"><el-icon><Clock /></el-icon>{{ formatMeta(ws) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>{{ $t('dashboard.no_recent_projects') }}</p>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
// [核心] 导入新的图标
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Files, Collection, TakeawayBox, Suitcase } from '@element-plus/icons-vue';
// 导入新的 API 函数和类型
import { getWorkspaces, type Workspace } from '../api/workspaces';
import { useI18n } from 'vue-i18n';

// --- 中英對譯函數 ---
const loadRecentProjectFailMsg = computed(() => t('dashboard.loadRecentProjectFail'));
const justNowMsg = computed(() => t('dashboard.justNow'));
const minutesAgoMsg = computed(() => t('dashboard.minutesAgo'));
const hoursAgoMsg = computed(() => t('dashboard.hoursAgo'));
const daysAgoMsg = computed(() => t('dashboard.daysAgo'));
const updateAtMsg = computed(() => t('dashboard.updateAt'));
const dateInvalidMsg = computed(() => t('dashboard.dateInvalid'));
const includeMsg1 = computed(() => t('dashboard.includeMsg1'));
const includeMsg2 = computed(() => t('dashboard.includeMsg2'));
const noDetailMsg = computed(() => t('dashboard.noDetailMsg'));

const router = useRouter();

// --- 状态 ---
const isLoading = ref(true);
const recentWorkspaces = ref<Workspace[]>([]);

const { t } = useI18n();

// --- 数据获取 ---
onMounted(async () => {
  isLoading.value = true;
  try {
    const allWorkspaces = await getWorkspaces();
    // 只取最近的 3-4 个项目进行展示
    recentWorkspaces.value = allWorkspaces.slice(0, 4); 
  } catch (error) {
    console.error(loadRecentProjectFailMsg.value, error);
  } finally {
    isLoading.value = false;
  }
});

const navigateTo = (path: string) => {
  router.push(path);
};

// [核心修正] 使用最可靠的方法计算时间差
function formatMeta(workspace: any): string {
  const parts: string[] = [];

  // 尝试处理时间
  const updatedAtValue = workspace.updated_at;
  if (updatedAtValue) {
    // 将可能的非标准格式替换为标准格式
    const dateString = typeof updatedAtValue === 'string' ? updatedAtValue.replace(' ', 'T') + 'Z' : updatedAtValue;
    const updatedAt = new Date(dateString);

    // 检查日期是否有效
    if (!isNaN(updatedAt.getTime())) {
      const now = new Date();
      const diffMilliseconds = now.getTime() - updatedAt.getTime();
      const diffMinutes = Math.round(diffMilliseconds / 60000);

      let timeAgo = '';
      if (diffMinutes < 1) timeAgo = justNowMsg.value;
      else if (diffMinutes < 60) timeAgo = `${diffMinutes}`+minutesAgoMsg.value;
      else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)}`+hoursAgoMsg.value;
      else timeAgo = `${Math.floor(diffMinutes / 1440)}`+daysAgoMsg.value;
      parts.push(updateAtMsg.value+`${timeAgo}`);
    } else {
      parts.push(dateInvalidMsg.value);
    }
  }

  // 尝试处理文件数
  const docCount = workspace.document_count; // <-- 稍后根据您的真实数据修改此处的 'document_count'
  if (docCount !== undefined && docCount !== null) {
    parts.push(includeMsg1.value+`${docCount}`+includeMsg2.value);
  }

  if (parts.length === 0) {
    return noDetailMsg.value;
  }

  return parts.join(' • ');
}
</script>

<style scoped>
/* --- [美化核心] 移動端優先 (Mobile-First) --- */

.dashboard-container {
  padding-bottom: 40px; /* 為底部內容留出空間 */
}

.dashboard-header {
  margin-bottom: 30px;
}
.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}
.dashboard-section {
  margin-bottom: 30px;
}
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 16px;
  position: relative;
}
/* 為 "快速開始" 添加閃爍圖標 */
.quick-start-title::after {
  content: '✨';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 10px;
  animation: sparkle 2s infinite ease-in-out;
}
@keyframes sparkle { 0%, 100% { opacity: 1; transform: translateY(-50%) scale(1.1); } 50% { opacity: 0.5; transform: translateY(-50%) scale(0.9); } }

/* 快速開始：移動端為列表 */
.quick-start-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.quick-start-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.quick-start-card:hover {
  transform: translateY(-3px);
  background-color: var(--active-bg);
  border-color: var(--active-glow);
}
.card-icon-wrapper {
  width: 44px; height: 44px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  background-color: rgba(88, 94, 227, 0.15); /* 默認顏色 */
  color: #9FA8DA;
}
.card-icon-wrapper .el-icon {
  font-size: 22px;
}
.card-text-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}
.card-text-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* 最近的項目：移動端為兩列網格 */
.recent-projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.recent-project-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 180px;
}
.recent-project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  border-color: var(--active-glow);
}
.recent-project-card .card-icon-wrapper.small {
  width: 36px; height: 36px; margin-bottom: 12px;
  background-color: rgba(88, 94, 227, 0.15);
  color: #9FA8DA;
}
.recent-project-card .card-icon-wrapper .el-icon { font-size: 20px; }
.recent-project-card .card-title {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin: 0 0 4px 0;
}
.recent-project-card .card-description {
  font-size: 12px; color: var(--text-secondary);
  flex-grow: 1; margin: 0;
}
.recent-project-card .card-meta {
  font-size: 11px; color: var(--text-secondary);
  margin-top: auto; padding-top: 10px;
  border-top: 1px solid var(--border-color);
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 加載與空狀態 */
.loading-state, .empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
  background-color: var(--card-bg);
  border-radius: 12px;
}

/* --- [響應式] 桌面端樣式 --- */
@media (min-width: 768px) {
  .welcome-title {
    font-size: 32px;
  }
  .dashboard-section {
    margin-bottom: 40px;
  }
  .section-title {
    font-size: 20px;
  }
  
  /* 快速開始：桌面端變為三列網格 */
  .quick-start-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .quick-start-card {
    /* 在網格佈局中，可以變回垂直佈局以獲得更好視覺效果 */
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
    text-align: left;
  }
  .quick-start-card .card-icon-wrapper {
    margin-bottom: 20px;
  }

  /* 最近的項目：桌面端自適應更多列 */
  .recent-projects-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }
  .recent-project-card {
    padding: 24px;
    /* --- [核心修改] 在這裡添加最小高度 --- */
    min-height: 300px;
  }
}
</style>