<template>
  <div class="clue-sheet-review-container">
    <div v-if="isLoading" class="loading-state">{{ $t('clueSheetReview.loading') }}</div>

    <template v-else-if="clueSheetData">
      <header class="page-header">
        <!-- [改造] 將 page-title 和 cluesheet-title 整合 -->
        <h1 class="page-title">{{ $t('clueSheetReview.title') }}</h1>
        <button class="btn-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span class="desktop-only">{{ $t('clueSheetReview.return_history') }}</span>
        </button>
      </header>
      
      <div class="clue-sheet-panel">
        <h2 class="cluesheet-title">{{ clueSheetData.title }}</h2>
        <FlashcardViewer :cards="clueSheetData.cards" />
      </div>
    </template>

    <div v-else class="empty-state">{{ $t('clueSheetReview.not_found') }}</div>
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
import { useI18n } from 'vue-i18n';

const route = useRoute();
const clueSheetData = ref<ClueSheetDetail | null>(null);
const isLoading = ref(true);
const { t } = useI18n();

onMounted(async () => {
  document.body.classList.add('fullscreen-mode');
  const clueSheetId = route.params.id as string;
  if (!clueSheetId) {
    ElMessage.error(t('clueSheetReview.invalid_id'));
    isLoading.value = false;
    return;
  }

  try {
    const data = await getClueSheetById(Number(clueSheetId));
    clueSheetData.value = data;
  } catch (error) {
    ElMessage.error(t('clueSheetReview.load_fail'));
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
.loading-state, .empty-state {
  display: flex; justify-content: center; align-items: center;
  height: 100%; color: var(--text-secondary);
}

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
    display: flex;
    margin: auto;
}

.cluesheet-title {
    display: flex;
    margin: auto;
    margin-top: 90px;
    margin-left: 700px;
}

@media (max-width: 768px) {
  .clue-sheet-review-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-shrink: 0;
  }

  .page-title { font-size: 24px; font-weight: 600; padding: 50px 10px 30px 0px; }

  .btn-back {
    display: flex; align-items: center; gap: 8px;
    padding: 8px; /* 純圖標按鈕 */
    background-color: rgba(255,255,255,0.05);
    color: var(--text-secondary); border: 1px solid var(--border-color);
    border-radius: 50%; /* 圓形 */
    cursor: pointer; transition: all 0.2s;
    z-index: 5; margin-top: 25px;
  }
  .btn-back:hover {
    background-color: var(--active-bg);
    color: var(--text-primary);
  }
  .desktop-only { display: none; } /* 移動端默認隱藏文字 */

  .clue-sheet-panel {
    flex-grow: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* 讓卡片垂直居中 */
    gap: 20px;
  }

  .cluesheet-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
  }
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