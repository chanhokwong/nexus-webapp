<template>
  <div v-if="isLoading" class="loading-state">{{ $t('noteReview.loadNoteMsg') }}</div>
  
  <div v-else-if="note">
    <!-- 固定的头部 -->
    <header class="page-header">
      <h1 class="page-title">{{ $t('noteReview.title') }}</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>{{ $t('noteReview.returnHistoryList') }}</span>
      </button>
    </header>
    
    <!-- 可滚动的内容区 -->
    <div class="note-content-panel">
      <h2 class="note-title">{{ note.title }}</h2>
      <MarkdownRenderer :markdown="note.content" />
    </div>
  </div>

  <div v-else class="empty-state">{{ $t('noteReview.notFindNotesHistory') }}</div>
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
/* 样式与我们的主题保持一致，并复用 QuizReview 的风格 */
.loading-state, .empty-state {
  display: flex; justify-content: center; align-items: center;
  /* 确保在没有内容时也能占满空间 */
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  color: var(--text-secondary);
}

.page-header {
  position: fixed;
  top: 40px; /* 对应 .main-content 的 padding-top */
  /* 
    left 等于侧边栏宽度 + .main-content 的 padding-left 
    260px + 40px = 300px
  */
  left: 300px;
  /* right 等于 .main-content 的 padding-right */
  right: 40px;
  
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2; /* 确保在内容之上 */
}
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

/* [核心] 笔记内容的容器 */
.note-content-panel {
  position: fixed;
  /* 
    top 等于 .page-header 的高度 + 它们之间的 margin + .main-content 的 padding-top
    大约是 40px (padding) + 50px (header) + 24px (margin) = 114px
  */
  top: 120px; 
  left: 300px;
  right: 40px;
  bottom: 40px; /* 对应 .main-content 的 padding-bottom */
  
  /* [关键] 添加滚动能力 */
  overflow-y: auto;
  
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 30px;
  border: 1px solid var(--border-color);
  z-index: 1;
}
/* 笔记内部的标题样式 */
.note-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
}
</style>