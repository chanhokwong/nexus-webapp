<template>
  <div class="workspace-list-container">
    <!-- 1. 桌面端專屬 Header -->
    <header class="page-header desktop-view">
      <h1 class="page-title">{{ $t('workspaceList.myWorkspace') }}</h1>
      <button class="btn-create" @click="openCreateModal">
        <el-icon><Plus /></el-icon>
        <span>{{ $t('workspaceList.createNewWorkspace') }}</span>
      </button>
    </header>

    <!-- 2. [新增] 移動端專屬 Header -->
    <header class="mobile-header mobile-view">
      <h1 class="mobile-page-title">{{ $t('workspaceList.myWorkspace') }}</h1>
      <p class="mobile-page-subtitle">{{ $t('workspaceList.manage_workspaces') }}</p>
    </header>

    <!-- 3. 骨架屏 -->
    <div v-if="isLoading" class="workspace-grid skeleton-grid">
      <div v-for="i in 8" :key="`skeleton-${i}`" class="workspace-card skeleton-card">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line text"></div>
        <div class="skeleton-line text short"></div>
      </div>
    </div>

    <!-- 4. 數據加載完成後顯示 -->
    <div v-else class="workspace-grid">
      <!-- 4.1 "新建"卡片 (在移動端也會顯示) -->
      <div class="workspace-card card-new" @click="openCreateModal">
        <el-icon class="plus-icon"><Plus /></el-icon>
        <h2 class="card-title">{{ $t('workspaceList.createNewWorkspace') }}</h2>
      </div>

      <!-- 4.2 工作台卡片列表 -->
      <div 
        v-for="ws in workspaces" 
        :key="ws.id" 
        class="workspace-card"
        @click="goToWorkspace(ws.id)"
      >
        <div class="card-header">
          <div class="card-icon-wrapper"><el-icon><Collection /></el-icon></div>
          <el-dropdown class="card-options" trigger="click" @command="handleCommand" @click.stop>
            <span class="el-dropdown-link"><el-icon><MoreFilled /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'rename', workspace: ws }"><el-icon><EditPen /></el-icon>{{ $t('workspaceList.rename') }}</el-dropdown-item>
                <el-dropdown-item :command="{ action: 'delete', workspace: ws }" divided class="delete-item"><el-icon><Delete /></el-icon>{{ $t('workspaceList.delete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <h2 class="card-title">{{ ws.name }}</h2>
        <p class="card-description">{{ ws.description || 'NULL' }}</p>
        <div class="card-meta">{{ formatMeta(ws) }}</div>
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
/* --- 桌面端樣式 --- */
.workspace-list-container { height: 100%; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-shrink: 0; }
.page-title { font-size: 32px; font-weight: 700; }
.btn-create { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background-color: var(--text-primary); color: #11132C; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
.btn-create:hover { transform: translateY(-2px); }

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
.skeleton-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
.skeleton-card { background-color: var(--card-bg); border-radius: 16px; padding: 24px; }
.skeleton-line { background: linear-gradient(90deg, var(--card-bg) 25%, rgba(45, 48, 102, 0.8) 50%, var(--card-bg) 75%); background-size: 200% 100%; border-radius: 4px; animation: shimmer 1.5s infinite; }
.skeleton-line.title { height: 24px; width: 60%; margin-bottom: 12px; }
.skeleton-line.text { height: 16px; width: 90%; margin-bottom: 8px; }
.skeleton-line.text.short { width: 70%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.workspace-card {
    display: flex; flex-direction: column; position: relative;
    background-color: var(--card-bg); border: 1px solid var(--border-color);
    border-radius: 16px; /* 增加圓角 */
    transition: all 0.3s;
    min-height: 220px; /* 給一個最小高度 */
    padding: 24px;
    cursor: pointer;
}
.workspace-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-color: var(--active-glow); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-icon-wrapper { width: 40px; height: 40px; border-radius: 8px; display: flex; justify-content: center; align-items: center; background-color: rgba(88, 94, 227, 0.15); color: #9FA8DA; }
.card-icon-wrapper .el-icon { font-size: 22px; }
.card-options { z-index: 2; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; border-radius: 50%; color: var(--text-secondary); cursor: pointer; transition: background-color 0.2s; }
.card-options:hover { background-color: var(--active-bg); color: var(--text-primary); }
.card-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px 0; }
.card-description { font-size: 14px; color: var(--text-secondary); flex-grow: 1; line-height: 1.6; margin: 0; }
.card-meta { font-size: 13px; color: var(--text-secondary); margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px; }

.card-new { justify-content: center; align-items: center; border-style: dashed; color: var(--text-secondary); }
.card-new .plus-icon { font-size: 36px; margin-bottom: 12px; }
.card-new .card-title { font-size: 16px; font-weight: 500; color: var(--text-secondary); }
.card-new:hover { color: var(--text-primary); border-color: var(--text-primary); background-color: var(--active-bg); }

/* --- 移動端樣式 --- */
.mobile-view { display: none; }

@media (max-width: 768px) {
  .desktop-view { display: none; }
  .mobile-view { display: block; }
  
  .workspace-list-container { padding: 0 16px; }
  .page-header.desktop-view { display: none; }

  .mobile-header { padding-top: 16px; margin-bottom: 16px; }
  .mobile-page-title { font-size: 24px; font-weight: 600; margin: 0; }
  .mobile-page-subtitle { font-size: 14px; color: var(--text-secondary); margin: 4px 0 0 0; }

  .workspace-grid {
    position: static;
    grid-template-columns: repeat(2, 1fr); /* [核心] 兩列佈局 */
    gap: 16px;
    padding: 5px 0px 0px 0px;
    padding-bottom: 40px;
    width: 100%;
  }
  .workspace-card {
    padding: 16px;
    min-height: 190px;
    border-radius: 16px; /* 確保圓角一致 */
  }
  .card-header { margin-bottom: 12px; }
  .card-title { font-size: 16px; }
  .card-description { font-size: 13px; }
  .card-meta { font-size: 12px; margin-top: 12px; padding-top: 12px; }
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
