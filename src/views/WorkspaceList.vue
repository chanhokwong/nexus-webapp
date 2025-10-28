<template>
  <div class="workspace-list-container">
    <header class="page-header">
      <h1 class="page-title">{{ $t('workspaceList.myWorkspace') }}</h1>
      <button class="btn-create" @click="openCreateModal">
        <el-icon><Plus /></el-icon>
        <!-- [改造] 在移動端隱藏文字 -->
        <span class="desktop-only">{{ $t('workspaceList.createNewWorkspace') }}</span>
      </button>
    </header>

    <!-- [核心] 骨架屏加載狀態 -->
    <div v-if="isLoading" class="workspace-grid skeleton-grid">
      <div v-for="i in 12" :key="i" class="workspace-card skeleton-card">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line text"></div>
        <div class="skeleton-line text short"></div>
        <div class="skeleton-line meta"></div>
      </div>
    </div>

    <!-- 數據加載完成後顯示 -->
    <div v-else class="workspace-grid">
      <!-- 新建卡片 -->
      <div class="workspace-card card-new desktop-only" @click="openCreateModal">
        <el-icon class="plus-icon"><Plus /></el-icon>
        <h2 class="card-title">{{ $t('workspaceList.createNewWorkspace') }}</h2>
      </div>

      <!-- 工作台卡片列表 -->
      <div 
        v-for="ws in workspaces" 
        :key="ws.id" 
        class="workspace-card"
      >
        <!-- 1. 导航区域：只包裹非交互内容 -->
        <div class="card-navigation-area" @click="goToWorkspace(ws.id)">
          <div class="card-header">
            <el-icon class="card-icon"><Collection /></el-icon>
          </div>
          
          <h2 class="card-title">{{ ws.name }}</h2>
          <p class="card-description">{{ ws.description || 'NULL' }}</p>
          <div class="card-meta">{{ formatMeta(ws) }}</div>
        </div>

        <!-- 2. 交互区域：下拉菜单独立在外 -->
        <el-dropdown class="card-options" trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            <el-icon><MoreFilled /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="{ action: 'rename', workspace: ws }">
                <el-icon><EditPen /></el-icon>{{ $t('workspaceList.rename') }}
              </el-dropdown-item>
              <el-dropdown-item :command="{ action: 'delete', workspace: ws }" divided class="delete-item">
                <el-icon><Delete /></el-icon>{{ $t('workspaceList.delete') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <CreateWorkspaceModal ref="createModal" @confirm="createNewWorkspace" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { Plus, Collection, MoreFilled, EditPen, Delete } from '@element-plus/icons-vue';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, type Workspace, type CreateWorkspacePayload } from '../api/workspaces';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal.vue';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const workspaces = ref<any[]>([]);
const createModal = ref<InstanceType<typeof CreateWorkspaceModal> | null>(null);
const isLoading = ref(true);

// --- 國際化 ---
const { t } = useI18n();

const getWorkspaceListFail = computed(() => t('workspaceList.getWorkspaceListFail'));
const createWorkspaceFail = computed(() => t('workspaceList.createWorkspaceFail'));
const justNow = computed(() => t('workspaceList.justNow'));
const minutesAgo = computed(() => t('workspaceList.minutesAgo'));
const hoursAgo = computed(() => t('workspaceList.hoursAgo'));
const daysAgo = computed(() => t('workspaceList.daysAgo'));
const updateAt = computed(() => t('workspaceList.updateAt'));
const dateFormatInvalid = computed(() => t('workspaceList.dateFormatInvalid'));
const containMsg1 = computed(() => t('workspaceList.containMsg1'));
const containMsg2 = computed(() => t('workspaceList.containMsg2'));
const noDetailInfo = computed(() => t('workspaceList.noDetailInfo'));
const enterNewWorkspaceName = computed(() => t('workspaceList.enterNewWorkspaceName'));
const renameWorkspace = computed(() => t('workspaceList.renameWorkspace'));
const confirm = computed(() => t('workspaceList.confirm'));
const cancel = computed(() => t('workspaceList.cancel'));
const renameSuccess = computed(() => t('workspaceList.renameSuccess'));
const renameFail = computed(() => t('workspaceList.renameFail'));
const confirmDelMsg1 = computed(() => t('workspaceList.confirmDelMsg1'));
const confirmDelMsg2 = computed(() => t('workspaceList.confirmDelMsg2'));
const delConfirm = computed(() => t('workspaceList.delConfirm'));
const confirmDel = computed(() => t('workspaceList.confirmDel'));
const delSuccess = computed(() => t('workspaceList.delSuccess'));
const delFail = computed(() => t('workspaceList.delFail'));

// 獲取數據的統一函數
const fetchWorkspaces = async () => {
  isLoading.value = true;
  try {
    workspaces.value = await getWorkspaces();
  } catch (error) { 
    console.error(getWorkspaceListFail.value, error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchWorkspaces);

const goToWorkspace = (id: number) => {
  // 2. [核心] 添加一个调试日志
  console.log(`Navigating to workspace with ID: ${id}`);
  
  // 3. 检查 router.push 的路径
  router.push(`/workspaces/${id}`);
};

const openCreateModal = () => {
  createModal.value?.openDialog();
};

const createNewWorkspace = async (payload: CreateWorkspacePayload) => {
  try {
    await createWorkspace(payload);
    await fetchWorkspaces(); // 重新獲取列表以保證數據同步
  } catch (error) { console.error(createWorkspaceFail.value, error); }
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
      if (diffMinutes < 1) timeAgo = justNow.value;
      else if (diffMinutes < 60) timeAgo = `${diffMinutes}`+minutesAgo.value;
      else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)}`+hoursAgo.value;
      else timeAgo = `${Math.floor(diffMinutes / 1440)}`+daysAgo.value;
      parts.push(updateAt.value+`${timeAgo}`);
    } else {
      parts.push(dateFormatInvalid.value);
    }
  }

  // 尝试处理文件数
  const docCount = workspace.document_count; // <-- 稍后根据您的真实数据修改此处的 'document_count'
  if (docCount !== undefined && docCount !== null) {
    parts.push(containMsg1.value+`${docCount}`+containMsg2.value);
  }

  if (parts.length === 0) {
    return noDetailInfo.value;
  }

  return parts.join(' • ');
}

// --- [核心] 卡片操作邏輯 ---
interface Command {
  action: 'rename' | 'delete';
  workspace: Workspace;
}

const handleCommand = (command: Command) => {
  if (command.action === 'rename') {
    handleRename(command.workspace);
  } else if (command.action === 'delete') {
    handleDelete(command.workspace);
  }
};

const handleRename = (workspace: Workspace) => {
  ElMessageBox.prompt(enterNewWorkspaceName.value, renameWorkspace.value, {
    confirmButtonText: confirm.value,
    cancelButtonText: cancel.value,
    inputValue: workspace.name, // 預填入當前名稱
    customClass: 'nexus-messagebox', 
  })
  .then(async ({ value }) => {
    if (value === workspace.name) return; // 名稱未改變則不操作
    try {
      await updateWorkspace(workspace.id, { name: value, description: workspace.description || '' });
      await fetchWorkspaces(); // 重新獲取列表
      ElMessage.success(renameSuccess.value);
    } catch (error) {
      ElMessage.error(renameFail.value);
      console.error(error);
    }
  }).catch(() => {});
};

const handleDelete = (workspace: Workspace) => {
  ElMessageBox.confirm(confirmDelMsg1.value+`"${workspace.name}"`+confirmDelMsg2.value, delConfirm.value, {
    confirmButtonText: confirmDel.value,
    cancelButtonText: cancel.value,
    type: 'warning',
    customClass: 'nexus-messagebox',
  })
  .then(async () => {
    try {
      await deleteWorkspace(workspace.id);
      await fetchWorkspaces(); // 重新獲取列表
      ElMessage.success(delSuccess.value);
    } catch (error) {
      ElMessage.error(delFail.value);
      console.error(error);
    }
  }).catch(() => {});
};
</script>

<style scoped>
.workspace-list-container {
  /* [改造] 給容器一個最小高度，防止移動端內容不足時頁面塌陷 */
  min-height: 100%;
}
.page-header {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 30px;
}
.page-title { font-size: 32px; font-weight: 700; }
.btn-create {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; background-color: var(--text-primary);
    color: #11132C; 
    border: none; border-radius: 8px;
    font-weight: 700; cursor: pointer;
    transition: transform 0.2s, box-shadow 0.3s;
}
.btn-create:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(240, 242, 245, 0.2);
}

.workspace-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    width: 80%;
    
    position: fixed;
    top: 120px; /* header + filter-bar 高度 + 间距 */
    bottom: 40px; /* main-content 的 padding-bottom */
    left: 280px; /* 侧边栏宽度 + main-content 的 padding-left */
    
    overflow-y: auto;
    padding: 5px 20px;
    z-index: 1;
}

/* [核心] 骨架屏樣式 */
.skeleton-card {
  cursor: default;
  pointer-events: none;
}
.skeleton-line {
  background: linear-gradient(90deg, var(--card-bg) 25%, rgba(45, 48, 102, 0.8) 50%, var(--card-bg) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}
.skeleton-line.title { height: 24px; width: 60%; margin-bottom: 12px; }
.skeleton-line.text { height: 16px; width: 90%; margin-bottom: 8px; }
.skeleton-line.text.short { width: 70%; }
.skeleton-line.meta { height: 14px; width: 80%; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 12px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* [核心] 卡片和選項按鈕樣式 */
.workspace-card {
    display: flex; /* 让内部元素可以被 flex 控制 */
    position: relative; /* 为绝对定位的下拉菜单提供上下文 */
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    transition: all 0.3s;
    min-height: 200px;
    max-height: 200px;
}
.workspace-card:not(.card-new):hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 20px var(--active-bg);
    border-color: var(--active-glow);
}

.workspace-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 20px var(--active-bg);
    border-color: var(--active-glow);
}

/* [新增] 导航覆盖层样式 */
/* [新增] 导航区域样式 */
.card-navigation-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

/* [新增] 内容包装器样式 */
.card-content-wrapper {
    position: relative; /* 确保内容在覆盖层之上 */
    z-index: 2;      /* 层级高于导航覆盖层 */
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    pointer-events: none; 
}

.card-options {
  position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2; /* 确保在最上层 */
    
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background-color 0.2s;
}
.card-options:hover {
  background-color: var(--active-bg);
  color: var(--text-primary);
}
.el-dropdown-link {
  outline: none; /* 移除點擊時的藍色邊框 */
  display: flex;
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
.card-new {
    justify-content: center; align-items: center;
    border-style: dashed; color: var(--text-secondary);
}
.card-new .plus-icon { font-size: 48px; margin-bottom: 12px; }
.card-new .card-title { color: var(--text-secondary); }
.card-new:hover {
    color: var(--text-primary); border-color: var(--text-primary);
    background-color: var(--active-bg);
}

/* --- [新增] 響應式樣式 --- */
@media (max-width: 768px) {
  /* 1. 調整頁面頭部 */
  .page-header {
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 28px;
  }
  .btn-create {
    padding: 10px; /* 變為純圖標按鈕 */
    border-radius: 50%;
  }
  .desktop-only {
    display: none; /* 隱藏按鈕文字 */
  }

  /* 2. 移除固定佈局，改為正常文檔流 */
  .workspace-grid {
    position: static;
    width: 100%;
    overflow-y: visible;
    padding: 0;
    
    /* [核心] 將網格變為單列列表 */
    grid-template-columns: 1fr;
    gap: 16px; /* 調整卡片間距 */
  }

  /* 3. 調整卡片樣式以適應列表模式 */
  .workspace-card {
    min-height: auto; /* 移除最小高度限制 */
    max-height: none; /* 移除最大高度限制 */
  }
  .card-navigation-area {
    padding: 16px; /* 縮小內邊距 */
  }
  .card-options {
    top: 12px;
    right: 12px;
  }
}
</style>
<style>
/* 
  我们为所有可能出现滚动条的 `.main-content` 区域
  以及其内部的元素定义统一的滚动条样式
*/
.main-content ::-webkit-scrollbar {
  width: 8px;
  height: 8px; /* 同时美化水平滚动条 */
}

.main-content ::-webkit-scrollbar-track {
  /* 轨道背景：设置为透明 */
  background: transparent;
}

.main-content ::-webkit-scrollbar-thumb {
  /* 滑块本身 */
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
  
  /* 添加一个最小高度，防止滑块变得过小 */
  min-height: 30px;
}

.main-content ::-webkit-scrollbar-thumb:hover {
  /* 鼠标悬停在滑块上时 */
  background-color: rgba(255, 255, 255, 0.4);
}

/* --- [核心] 弹窗内部样式 --- */
.doc-selection-list {
  max-height: 40vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.doc-selection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}
.doc-selection-item:hover {
  background-color: var(--active-bg);
}
.doc-selection-item.selected {
  border-color: var(--active-glow);
  background-color: var(--active-bg);
  color: var(--text-primary);
}
.empty-docs-state {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}

</style>
