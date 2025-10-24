<template>
  <div v-if="isLoading" class="loading-state">正在加載紀錄...</div>
  
  <div v-else-if="historyData" class="review-container">
    <header class="page-header">
      <h1 class="page-title">短答題回顧</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回歷史列表</span>
      </button>
    </header>

    <div class="summary-card">
      <div class="summary-item">
        <span class="label">源自工作台</span>
        <span class="value">{{ historyData.workspace_name }}</span>
      </div>
      <div class="summary-item">
        <span class="label">练习时间</span>
        <span class="value">{{ new Date(historyData.created_at).toLocaleString() }}</span>
      </div>
    </div>
    
    <div class="records-list">
      <div v-for="(record, index) in historyData.records" :key="index" class="record-item">
        <div class="question-header">
          <span class="question-number">問題 {{ index + 1 }}</span>
          <p class="question-text">{{ record.question }}</p>
        </div>
        
        <div class="result-card score-card">
          <div class="score-label">你的得分</div>
          <div class="score-value">{{ record.score }}</div>
        </div>
        <div class="result-card">
          <h3>你的答案</h3>
          <p>{{ record.user_answer }}</p>
        </div>
        <div class="result-card">
          <h3>AI 評價</h3>
          <MarkdownRenderer :markdown="record.feedback" />
        </div>
        <div class="result-card">
          <h3>參考答案</h3>
          <MarkdownRenderer :markdown="record.standard_answer" />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">找不到該練習的詳細紀錄。</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { getShortAnswerHistoryById, type ShortAnswerDetail } from '../api/history';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';

const route = useRoute();
const historyData = ref<ShortAnswerDetail | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  const sessionId = route.params.id as string;
  if (!sessionId) { /* ... */ return; }

  try {
    const data = await getShortAnswerHistoryById(sessionId);
    historyData.value = data;
  } catch (error) { ElMessage.error("加載紀錄失敗"); } 
  finally { isLoading.value = false; }
});
</script>

<style scoped>
/* --- 整体布局 (复用 NoteReview/QuizReview 的成功模式) --- */
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

/* --- [核心] 可滚动的内容区 --- */
.records-list {
  flex-grow: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 15px; /* 为滚动条留出空间 */
}
.record-item {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--border-color);
}
.record-item:last-child {
  border-bottom: none;
}

/* --- 问答卡片样式 (复用 ShortAnswerQuiz.vue 的结果卡片样式) --- */
.question-header {
  margin-bottom: 30px;
}
.question-number {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.question-text {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
}

.result-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;
}
.result-card h3 {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}
.result-card p,
.result-card :deep(.markdown-body) {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);
}

.score-card {
  text-align: center;
  padding: 24px;
  border-color: var(--active-glow);
  margin-top: 0;
  margin-bottom: 16px;
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
</style>