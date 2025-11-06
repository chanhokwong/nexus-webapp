<template>
  <div class="short-answer-review-page">
    <div v-if="isLoading" class="loading-state">{{ $t('shortAnswerReview.loading') }}</div>
    
    <div v-else-if="historyData" class="review-container">
      <header class="page-header">
        <div class="header-main-content">
          <h1 class="page-title">{{ $t('shortAnswerReview.title') }}</h1>
        </div>
        <button class="btn-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span class="desktop-only">{{ $t('shortAnswerReview.return_history') }}</span>
        </button>
      </header>

      <div class="summary-card">
        <div class="summary-item">
          <span class="label">{{ $t('shortAnswerReview.from_workspace') }}</span>
          <span class="value">{{ historyData.workspace_name }}</span>
        </div>
        <div class="summary-item">
          <span class="label">{{ $t('shortAnswerReview.practice_time') }}</span>
          <span class="value">{{ new Date(historyData.created_at).toLocaleString() }}</span>
        </div>
      </div>
      
      <div class="records-list">
        <div v-for="(record, index) in historyData.records" :key="index" class="record-item">
          <div class="question-header">
            <span class="question-number">{{ $t('shortAnswerReview.question') }} {{ index + 1 }}</span>
            <p class="question-text">{{ record.question }}</p>
          </div>
          
          <div class="result-card score-card">
            <div class="score-label">{{ $t('shortAnswerReview.your_score') }}</div>
            <div class="score-value">{{ record.score }}</div>
          </div>
          <div class="result-card">
            <h3>{{ $t('shortAnswerReview.your_answer') }}</h3>
            <p>{{ record.user_answer }}</p>
          </div>
          <div class="result-card">
            <h3>{{ $t('shortAnswerReview.ai_feedback') }}</h3>
            <MarkdownRenderer :markdown="record.feedback" />
          </div>
          <div class="result-card">
            <h3>{{ $t('shortAnswerReview.standard_answer') }}</h3>
            <MarkdownRenderer :markdown="record.standard_answer" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">{{ $t('shortAnswerReview.load_fail') }}</div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { getShortAnswerHistoryById, type ShortAnswerDetail } from '../api/history';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const historyData = ref<ShortAnswerDetail | null>(null);
const isLoading = ref(true);
const { t } = useI18n();

onMounted(async () => {
  const sessionId = route.params.id as string;
  if (!sessionId) { 
    ElMessage.error(t('shortAnswerReview.invalid_id'));
    isLoading.value = false;
    return; 
  }

  try {
    const data = await getShortAnswerHistoryById(sessionId);
    historyData.value = data;
  } catch (error) { 
    ElMessage.error(t('shortAnswerReview.load_fail'));
    console.error(error);
  } finally { 
    isLoading.value = false; 
  }
});
</script>

<style scoped>
/* --- 基礎佈局 --- */
.short-answer-review-page {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}
.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
}
.review-container {
  position: fixed;
  /* 
    top 等于 .page-header 的高度 + 它们之间的 margin + .main-content 的 padding-top
    大约是 40px (padding) + 50px (header) + 24px (margin) = 114px
  */
  top: 40px; 
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

/* --- 固定的头部 --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.page-title {
  font-size: 32px;
  font-weight: 700;
}
.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-back:hover {
  background-color: var(--active-bg);
  color: var(--text-primary);
}

/* --- 摘要卡片 --- */
.summary-card {
  display: flex;
  gap: 20px;
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 20px;
  border-right: 1px solid var(--border-color);
}
.summary-item:last-child {
  border-right: none;
}
.summary-item .label {
  font-size: 14px;
  color: var(--text-secondary);
}
.summary-item .value {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

/* --- 問題列表 --- */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.record-item {
  padding-bottom: 30px;
  border-bottom: 1px solid var(--border-color);
}
.record-item:last-child { border-bottom: none; }

.question-header { margin-bottom: 24px; }
.question-number { font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; }
.question-text { font-size: 20px; font-weight: 500; color: var(--text-primary); line-height: 1.6; }

.result-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px; /* 為卡片之間添加間距 */
}
.result-card:last-of-type {
  margin-bottom: 0;
}

.result-card h3 {
  font-size: 14px; font-weight: 600; text-transform: uppercase;
  color: var(--text-secondary); margin-bottom: 12px;
  padding-bottom: 10px; border-bottom: 1px solid var(--border-color);
}
.result-card p, .result-card :deep(.markdown-body) {
  font-size: 16px; line-height: 1.7; color: var(--text-primary);
}

.score-card {
  text-align: center;
  padding: 24px;
  border-color: var(--active-glow);
}
.score-label {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.score-value {
  font-size: 48px;
  font-weight: 700;
  color: var(--active-glow);
}

/* --- [核心] 移動端響應式樣式 --- */
@media (max-width: 768px) {
  .review-container {
    position: static;
    /* [关键] 添加滚动能力 */
    overflow-y: auto;
    
    background: var(--panel-bg);
    border-radius: 12px;
    padding: 30px;
    border: 1px solid var(--border-color);
    z-index: 1;
  }
  .short-answer-review-page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .page-title { font-size: 24px; }
  .btn-back {
    position: absolute;
    top: 130px;
    right: 70px;
    padding: 8px;
    border-radius: 50%;
  }
  .desktop-only {
    display: none;
  }
  
  .summary-card {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  .summary-item {
    border-right: none;
    padding: 0;
  }

  .question-text { font-size: 18px; }

  .score-value { font-size: 40px; }
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