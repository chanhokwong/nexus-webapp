<template>
  <div class="content-viewer-container">
    <header class="page-header">
      <!-- [核心修正] 將標題和字數統計包裹在一個 div 中 -->
      <div class="header-main">
        <h1 class="page-title">{{ title }}</h1>
        <!-- [核心修正] 新增字數顯示區域 -->
        <div class="word-count-display" v-if="wordCount > 0">
          <el-icon><DataAnalysis /></el-icon>
          <span>{{ t('common.wordCount', { count: wordCount }) }}</span>
        </div>
      </div>
      <div class="actions">
        <el-button @click="copyContent">{{ $t('common.copy') }}</el-button>
        <el-button 
          type="primary" 
          @click="saveAsNote" 
          :disabled="!workspaceId"
          :title="!workspaceId ? t('planning.saveDisabledTooltip') : ''"
        >
          {{ $t('common.saveAsNote') }}
        </el-button>
      </div>
    </header>
    <div class="content-panel">
      <MarkdownRenderer :markdown="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElButton, ElMessage, ElIcon } from 'element-plus';
import { DataAnalysis } from '@element-plus/icons-vue';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import { saveNote } from '../api/notes';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();

const title = ref('');
const content = ref('');
const workspaceId = ref<number | null>(null);

// [核心修正] 新增一個計算屬性來實時計算字數
const wordCount = computed(() => {
  const text = content.value;
  if (!text) return 0;

  // 智能判斷：如果包含中文字符，則按字符計數；否則按單詞計數
  const cjkRegex = /[\u4e00-\u9fa5]/;
  if (cjkRegex.test(text)) {
    // 對於中文內容，計算非空白字符的數量
    return text.replace(/\s/g, '').length;
  } else {
    // 對於英文內容，按空白符分割單詞並過濾掉空字符串
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }
});

onMounted(() => {
  const state = window.history.state;
  if (state && state.content) {
    title.value = state.title || t('planning.unnamedPlan');
    content.value = state.content;
    workspaceId.value = state.workspaceId;
  } else {
    router.replace({ name: 'Tools' }); // 如果沒有內容，返回工具頁
  }
});

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(content.value);
    ElMessage.success(t('common.copiedSuccess'));
  } catch (err) {
    ElMessage.error(t('common.copiedFailed'));
  }
};

const saveAsNote = async () => {
  if (!workspaceId.value || !content.value) {
    ElMessage.warning(t('planning.saveDisabledTooltip'));
    return;
  }
  try {
    await saveNote({
      workspace_id: workspaceId.value,
      title: title.value,
      content: content.value
    });
    ElMessage.success(t('common.savedSuccess'));
  } catch (error) {
    ElMessage.error(t('common.savedFailed'));
  }
};
</script>

<style scoped>
.content-viewer-container { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.page-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 16px 24px; 
    border-bottom: 1px solid var(--border-color); 
    z-index: 5;
}
.page-title { font-size: 24px; }
.content-panel { 
  display: flex;
  flex-direction: column;
  height: 100%;
  z-index: 4;

  position: fixed;
  /* 
    top 等于 .page-header 的高度 + 它们之间的 margin + .main-content 的 padding-top
    大约是 40px (padding) + 50px (header) + 24px (margin) = 114px
  */
  top: 40px; 
  left: 300px;
  right: 40px;
  bottom: 40px; /* 对应 .main-content 的 padding-bottom */
  
}
.markdown-body { /* [关键] 添加滚动能力 */
  overflow-y: auto;
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 30px;
  border: 1px solid var(--border-color);
  z-index: 1; 
  padding-top: 80px;
  padding-bottom: 60px;
  width: auto;
}

@media (max-width: 768px) {
  .content-viewer-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 防止內容溢出 */
    padding: 16px;
  }

  .page-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; /* 垂直居中 */
    padding-bottom: 16px; 
    border-bottom: 1px solid var(--border-color); 
    flex-shrink: 0;
  }

  .header-main {
    display: flex;
    flex-direction: column; /* 垂直堆疊 */
    align-items: flex-start;
    gap: 4px;
    overflow: hidden;
    flex-shrink: 1;
  }

  .page-title { 
    font-size: 20px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }

  .word-count-display {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
  }

  .actions {
    flex-shrink: 0;
    margin-left: auto; /* 將按鈕推到右邊 */
    padding-left: 16px; /* 與標題保持一些距離 */
  }

  .content-panel { 
    position: static;
    flex-grow: 1;
    min-height: 0; /* Flexbox 滾動 hack */
    overflow-y: auto;
  }

  /* 穿透到 MarkdownRenderer 組件，優化閱讀體驗 */
  .content-panel :deep(h1),
  .content-panel :deep(h2),
  .content-panel :deep(h3) {
    font-size: 1.2em;
    line-height: 1.4;
  }
  .content-panel :deep(p),
  .content-panel :deep(li) {
    font-size: 16px;
    line-height: 1.7;
  }
  .markdown-body { /* [关键] 添加滚动能力 */
    overflow-y: auto;
    background: var(--panel-bg);
    border-radius: 12px;
    padding: 30px;
    border: 1px solid var(--border-color);
    z-index: 1; 
    padding-bottom: 20px;
    width: auto;
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

.page-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 16px 24px; 
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* [核心修正] 新增 header-main 容器樣式 */
.header-main {
  display: flex;
  align-items: center;
  gap: 24px; /* 在標題和字數統計之間創建間距 */
  /* 防止容器過寬時擠壓右側按鈕 */
  overflow: hidden;
  flex-shrink: 1;
}

.page-title { 
  font-size: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0; /* 移除默認 margin */
}

/* [核心修正] 新增字數顯示樣式 */
.word-count-display {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0; /* 防止被壓縮 */
}

.actions {
  flex-shrink: 0;
}
</style>