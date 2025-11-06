<template>
  <!-- [改造] 將所有內容包裹在一個根 div 中，以便更好地控制佈局 -->
  <div class="note-review-container">
    <div v-if="isLoading" class="loading-state">{{ $t('noteReview.loadNoteMsg') }}</div>
    
    <div v-else-if="note" class="note-wrapper">
      <!-- 固定的头部 -->
      <header class="page-header">
        <h1 class="page-title">{{ $t('noteReview.title') }}</h1>
        <button class="btn-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <!-- [改造] 添加 .desktop-only 類 -->
          <span class="desktop-only">{{ $t('noteReview.returnHistoryList') }}</span>
        </button>
      </header>
      
      <!-- 可滚动的内容区 -->
      <div class="note-content-panel">
        <h2 class="note-title">{{ note.title }}</h2>
        <MarkdownRenderer :markdown="note.content" />
      </div>
    </div>

    <div v-else class="empty-state">{{ $t('noteReview.notFindNotesHistory') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { getNoteById, type NoteDetail } from '../api/notes'; // 导入 API 函数和类型
import MarkdownRenderer from '../components/MarkdownRenderer.vue'; // 导入 Markdown 组件
import { useI18n } from 'vue-i18n';

const route = useRoute();
const note = ref<NoteDetail | null>(null);
const isLoading = ref(true);

// --- 國際化 ---
const { t } = useI18n();

const invalidNotesId = computed(() => t('noteReview.invalidNotesId'));
const loadNotesDetailFail = computed(() => t('noteReview.loadNotesDetailFail'))

onMounted(async () => {
  const noteId = route.params.id as string;
  if (!noteId) {
    ElMessage.error(invalidNotesId.value);
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    const data = await getNoteById(Number(noteId));
    note.value = data;
  } catch (error) {
    ElMessage.error(loadNotesDetailFail.value);
    console.error("Error fetching note detail:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- 基礎樣式 --- */
.note-review-container {
  height: 100%;
}
.note-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.loading-state, .empty-state {
  display: flex; justify-content: center; align-items: center;
  height: 100%; color: var(--text-secondary);
}

/* --- 桌面端樣式 --- */
@media (min-width: 769px) {
  .page-header {
    position: fixed;
    top: 40px;
    left: calc(var(--sidebar-width) + 40px);
    right: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 2;
    transition: left 0.3s ease-in-out;
  }
  .sidebar.collapsed ~ .main-content .page-header {
    left: calc(var(--sidebar-width-collapsed) + 40px);
  }

  .note-content-panel {
    position: fixed;
    top: 120px; 
    left: calc(var(--sidebar-width) + 40px);
    right: 40px;
    bottom: 40px;
    overflow-y: auto;
    background: var(--panel-bg);
    border-radius: 12px;
    padding: 30px;
    border: 1px solid var(--border-color);
    z-index: 1;
    transition: left 0.3s ease-in-out;
  }
  .sidebar.collapsed ~ .main-content .note-content-panel {
    left: calc(var(--sidebar-width-collapsed) + 40px);
  }
}

/* --- 共享樣式 (桌面和移動端) --- */
.page-title { font-size: 32px; font-weight: 700; }
.btn-back {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background-color: transparent;
  color: var(--text-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.btn-back:hover {
  background-color: var(--active-bg);
  color: var(--text-primary);
}
.note-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
}

/* --- [核心] 移動端響應式樣式 --- */
@media (max-width: 768px) {
  .note-wrapper {
    /* 在移動端，wrapper 不再需要 flex，恢復正常文檔流 */
    display: block;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 24px;
  }
  .btn-back {
    padding: 8px; /* 變為純圖標按鈕 */
    border-radius: 50%;
  }
  .desktop-only {
    display: none; /* 隱藏文字 */
  }

  .note-content-panel {
    /* 移除固定定位，恢復正常文檔流 */
    position: static;
    padding: 20px 20px 50px 20px;
    background: var(--panel-bg);
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }
  .note-title {
    font-size: 22px;
  }

  /* 穿透到 MarkdownRenderer 組件，優化移動端閱讀體驗 */
  .note-content-panel :deep(h1),
  .note-content-panel :deep(h2),
  .note-content-panel :deep(h3) {
    font-size: 1.2em;
    line-height: 1.4;
  }
  .note-content-panel :deep(p),
  .note-content-panel :deep(li) {
    font-size: 16px;
    line-height: 1.7;
  }
}
</style>

<style>
/* --- [核心最终修正] 全局自定义滚动条样式 --- */

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
</style>