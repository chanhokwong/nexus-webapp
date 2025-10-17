<template>
  <!-- [核心] 根元素用于控制布局 -->
  <div class="clue-sheet-review-container">
    <div v-if="isLoading" class="loading-state">正在加載記憶卡片...</div>

    <template v-else-if="clueSheetData">
      <header class="page-header">
        <h1 class="page-title">記憶卡片回顧</h1>
        <button class="btn-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回歷史列表</span>
        </button>
        <h1 class="cluesheet-title">{{ clueSheetData.title }}</h1>
      </header>
      
      <!-- [核心] 内容面板现在是透明的，只用于定位 -->
      <div class="clue-sheet-panel">
        <FlashcardViewer :cards="clueSheetData.cards" />
      </div>
    </template>

    <div v-else class="empty-state">找不到該記憶卡片集的詳細紀錄。</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
// [核心] 导入新的 API 函数和类型
import { getClueSheetById, type ClueSheetDetail } from '../api/history'; 
import FlashcardViewer from '../components/FlashcardViewer.vue';

const route = useRoute();
const clueSheetData = ref<ClueSheetDetail | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  document.body.classList.add('fullscreen-mode');
  const clueSheetId = route.params.id as string;
  if (!clueSheetId) {
    ElMessage.error("无效的 ID");
    isLoading.value = false;
    return;
  }

  try {
    // 调用 API: GET /clue-sheets/{clue_sheet_id}
    const data = await getClueSheetById(Number(clueSheetId));
    clueSheetData.value = data;
  } catch (error) {
    ElMessage.error("加載记忆卡片详情失败");
    console.error("Error fetching clue sheet detail:", error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  document.body.classList.remove('fullscreen-mode');
});
</script>

<style scoped>
/* 样式与 NoteReview.vue / GraphReview.vue 完全一致 */

.clue-sheet-review-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px;
}

.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.page-title { font-size: 32px; font-weight: 700; }
.btn-back {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; background-color: rgba(255,255,255,0.1);
  color: var(--text-secondary); border: none;
  border-radius: 999px; /* 胶囊形状 */
  cursor: pointer; transition: all 0.2s;
  backdrop-filter: blur(5px);
}
.btn-back:hover {
  background-color: rgba(255,255,255,0.2);
  color: var(--text-primary);
}

.clue-sheet-panel {
  flex-grow: 1;
  min-height: 0;
  display: flex;
  /* 移除所有背景和边框，使其透明 */
  background: none;
  border: none;
  padding: 0;
}

.flashcard-viewer {
    position: fixed;
    width: 1600px;
    height: 700px;
}

.cluesheet-title {
    position: fixed;
    left: 670px;
    top: 180px;
}
</style>

<style>
body.fullscreen-mode .sidebar {
  display: none; /* 隐藏侧边栏 */
}
body.fullscreen-mode .main-content {
  margin-left: 0; /* 主内容区占满全屏 */
  padding: 0; /* 移除内边距 */
  height: 100vh;
  overflow: hidden;
}
</style>