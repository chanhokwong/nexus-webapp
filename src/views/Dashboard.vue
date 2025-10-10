<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1 class="welcome-title">{{ $t('dashboard.welcome_message') }}</h1>
    </header>

    <section class="dashboard-section">
      <h2 class="section-title">{{ $t('dashboard.quick_start') }}</h2>
      <div class="card-grid">
        <!-- 1. 文件工作台  -->
        <div class="dashboard-card action-card" @click="router.push('/workspaces')">
          <div class="card-icon-wrapper"><el-icon><Files /></el-icon></div>
          <h3>{{ $t('dashboard.workspaces') }}</h3>
          <p>{{ $t('dashboard.workspaces_content') }}</p>
        </div>

        <!-- 2. 知识宝库  -->
        <div class="dashboard-card action-card" @click="router.push('/history')">
          <!-- 使用一个更合适的“宝箱”或“数据库”图标 -->
          <div class="card-icon-wrapper" style="background-color: rgba(74, 0, 224, 0.1);"><el-icon><TakeawayBox /></el-icon></div>
          <h3>{{ $t('dashboard.knowledge_base') }}</h3>
          <p>{{ $t('dashboard.knowledge_base_content') }}</p>
        </div>

        <!-- 3. 工具箱  -->
        <div class="dashboard-card action-card" @click="router.push('/tools')">
           <div class="card-icon-wrapper" style="background-color: rgba(0, 212, 255, 0.1);"><el-icon><Suitcase /></el-icon></div>
          <h3>{{ $t('dashboard.toolbox') }}</h3>
          <p>{{ $t('dashboard.toolbox_content') }}</p>
        </div>
      </div>
    </section>

    <section class="dashboard-section">
      <h2 class="section-title">{{ $t('dashboard.recent_projects') }}</h2>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">{{ $t('dashboard.loadProjectMsg') }}</div>
      
      <!-- 数据加载完成后 -->
      <template v-else>
        <!-- [核心] 动态渲染最近的项目 -->
        <div v-if="recentWorkspaces.length > 0" class="card-grid recent-projects-grid">
          <div 
            v-for="ws in recentWorkspaces" 
            :key="ws.id" 
            class="workspace-card"
            @click="navigateTo(`/workspaces/${ws.id}`)"
          >
            <!-- [核心] 完全复用 WorkspaceList.vue 的卡片结构 -->
            <div class="card-header">
              <el-icon class="card-icon"><Collection /></el-icon>
              <!-- 可以在这里添加一个 mini 的操作按钮，如果需要的话 -->
            </div>
            <h2 class="card-title">{{ ws.name }}</h2>
            <p class="card-description">{{ ws.description || 'NULL' }}</p>
            <div class="card-meta">{{ formatMeta(ws) }}</div>
          </div>
        </div>

        <!-- 空状态 -->
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
/* --- [精修] 样式与最终设计图完全对齐 --- */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.welcome-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn.primary {
  background-color: #fff;
  color: #0d0c22;
}
.action-btn.primary:hover {
  background-color: #e0e0e0;
}
.action-btn .el-icon {
  font-size: 20px;
}

.dashboard-section {
  margin-bottom: 40px;
}

.section-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  color: #c5cae9;
  margin-bottom: 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.quick-start-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.recent-projects-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.dashboard-card {
  background: rgba(13, 12, 34, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 25px;
  transition: all 0.3s ease;
}

.dashboard-card.action-card {
  cursor: pointer;
}
.dashboard-card.action-card:hover {
  transform: translateY(-5px);
  background: rgba(29, 26, 61, 0.7);
  border-color: rgba(255, 255, 255, 0.3);
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  background-color: rgba(255,255,255,0.05);
}
.card-icon-wrapper .el-icon {
  font-size: 24px;
  color: #fff;
}

.dashboard-card h3 {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 20px;
  margin-bottom: 10px;
  color: #fff;
}

.dashboard-card p {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #c5cae9;
  line-height: 1.6;
}

.dashboard-card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.empty-state {
  background: rgba(13, 12, 34, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #8a91b4;
  font-family: 'Noto Sans TC', sans-serif;
}

/* [核心] 复用 WorkspaceList.vue 的网格和卡片样式 */
.card-grid {
  display: grid;
  gap: 24px;
}
.quick-start-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.recent-projects-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* 
  这里的 .workspace-card 样式
  与 src/views/WorkspaceList.vue 中的 .workspace-card 完全一致
*/
.workspace-card {
    display: flex; flex-direction: column; gap: 12px;
    padding: 24px; background: rgba(13, 12, 34, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color); border-radius: 12px;
    transition: all 0.3s;
    min-height: 300px;
    cursor: pointer;
    position: relative;
}
.workspace-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 20px var(--active-bg);
    border-color: var(--active-glow);
}

.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-icon { font-size: 24px; color: var(--text-secondary); }
.card-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.card-description { font-size: 14px; color: var(--text-secondary); flex-grow: 1; }
.card-meta {
    font-size: 12px; color: var(--text-secondary);
    border-top: 1px solid var(--border-color);
    padding-top: 12px; 
    margin-top: auto;
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}
</style>