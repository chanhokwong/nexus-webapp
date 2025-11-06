<template>
  <!-- [改造] 將所有內容包裹在一個根 div 中 -->
  <div class="exam-review-page">
    <div v-if="isLoading" class="loading-state">{{ $t('examReview.loading') }}</div>
    
    <div v-else-if="historyData" class="review-container">
      <header class="page-header">
        <div class="header-main-content">
          <h1 class="page-title">{{ historyData.title }}</h1>
          <p class="page-subtitle">
            {{ $t('examReview.completed_at') }} {{ formattedDate }}，{{ $t('examReview.from_workspace') }}: {{ historyData.workspace_name }}
          </p>
        </div>
        <button class="btn-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span class="desktop-only">{{ $t('examReview.return') }}</span>
        </button>
      </header>

      <div class="review-content">
        <div class="overall-summary-card">
          <h2>{{ $t('examReview.total_score') }}: {{ historyData.grading_report?.overall_score ?? 'N/A' }}</h2>
          <p>{{ historyData.grading_report?.overall_feedback ?? $t('examReview.no_overall_feedback') }}</p>
        </div>

        <div v-for="(question, index) in historyData.paper_content.questions" :key="question.id" class="question-block">
          <div class="question-header">
            <strong>{{ $t('examReview.question') }} {{ index + 1 }}:</strong> {{ question.question_text }} ({{ question.points }} {{ $t('examReview.points') }})
          </div>
          
          <div class="results-grid">
            <div class="result-card user-answer">
              <h3>{{ $t('examReview.your_answer') }}</h3>
              <p>{{ getUserAnswer(question.id) || $t('examReview.not_answered') }}</p>
            </div>
            <div class="result-card standard-answer">
              <h3>{{ $t('examReview.standard_answer') }}</h3>
              <MarkdownRenderer :markdown="getGrading(question.id)?.standard_answer || $t('examReview.no_standard_answer')" />
            </div>
            <div class="result-card ai-feedback">
              <h3>{{ $t('examReview.ai_feedback') }}</h3>
              <MarkdownRenderer :markdown="getGrading(question.id)?.feedback || $t('examReview.no_feedback')" />
            </div>
            <div class="result-card score-card">
              <div class="score-label">{{ $t('examReview.score') }}</div>
              <div class="score-value">{{ getGrading(question.id)?.score ?? '?' }} / {{ question.points }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">{{ $t('examReview.load_fail') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getExamSessionById, type ExamSessionDetail } from '../api/history';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const isLoading = ref(true);
const historyData = ref<ExamSessionDetail | null>(null);
// @ts-ignore
const { t } = useI18n();

const formattedDate = computed(() => {
  if (!historyData.value) return '';
  return new Date(historyData.value.created_at).toLocaleString();
});

const gradedQuestionsMap = computed(() => {
  const map = new Map();
  historyData.value?.grading_report?.graded_questions.forEach(gq => map.set(gq.id, gq));
  return map;
});

onMounted(async () => {
  const sessionId = route.params.id as string;
  try {
    const data = await getExamSessionById(sessionId);
    historyData.value = data;
  } catch (error) {
    console.error("Failed to load exam history:", error);
  } finally {
    isLoading.value = false;
  }
});

const getUserAnswer = (questionId: string) => historyData.value?.user_answers?.[questionId];
const getGrading = (questionId: string) => gradedQuestionsMap.value.get(questionId);
</script>

<style scoped>
/* --- 基礎佈局 --- */
.exam-review-page {
  height: 100%;
  overflow-y: auto; /* 讓整個頁面可滾動 */
  padding: 24px;
}

.loading-state, .empty-state {
  display: flex; justify-content: center; align-items: center;
  height: 100%; color: var(--text-secondary);
}

.review-container {
  display: flex;
  flex-direction: column;
  height: 100%;

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

.overall-summary-card {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 32px;
}

.overall-summary-card h2 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
}

/* --- 固定的头部 --- */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}
.page-title { font-size: 32px; font-weight: 700; }
.page-subtitle { font-size: 14px; color: var(--text-secondary); }
.btn-back {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background-color: transparent;
  color: var(--text-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.btn-back:hover { background-color: var(--active-bg); color: var(--text-primary); }
.desktop-only { display: inline; }

/* --- 摘要卡片 --- */
.summary-card {
  display: flex; gap: 20px;
  background: var(--panel-bg); border-radius: 12px;
  padding: 20px; margin-bottom: 30px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}
.summary-item {
  display: flex; flex-direction: column; gap: 4px;
  padding: 0 20px; border-right: 1px solid var(--border-color);
}
.summary-item:last-child { border-right: none; }
.summary-item .label { font-size: 14px; color: var(--text-secondary); }
.summary-item .value { font-size: 18px; font-weight: 500; color: var(--text-primary); }

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
.record-item:last-child { border-bottom: none; }

/* --- 问答卡片样式 (复用 ShortAnswerPlayer.vue 的结果卡片样式) --- */
/* --- 問題區塊 --- */
.question-block {
  margin-bottom: 40px;
}
.question-header {
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
}

/* --- 結果網格 (桌面端) --- */
.results-grid {
  display: grid;
  grid-template-areas:
    "user standard"
    "feedback score";
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.result-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}
.user-answer { grid-area: user; }
.standard-answer { grid-area: standard; }
.ai-feedback { grid-area: feedback; }
.score-card { grid-area: score; }

.result-card h3 {
  font-size: 14px; font-weight: 600; text-transform: uppercase;
  color: var(--text-secondary); margin-bottom: 12px;
  padding-bottom: 10px; border-bottom: 1px solid var(--border-color);
}
.result-card p, .result-card :deep(.markdown-body) {
  font-size: 16px; line-height: 1.7; color: var(--text-primary);
}
.score-card { text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.score-label { font-size: 16px; color: var(--text-secondary); margin-bottom: 8px; }
.score-value { font-size: 48px; font-weight: 700; color: var(--active-glow); }

.marking-scheme-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.marking-item { border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
.marking-item:last-child { border-bottom: none; padding-bottom: 0; }
.criterion-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.criterion-title { font-weight: 600; color: var(--text-primary); }
.criterion-score { font-weight: 700; color: var(--active-glow); background: var(--active-bg); padding: 2px 8px; border-radius: 4px; font-size: 14px; }
.criterion-comment { font-size: 14px; color: var(--text-secondary); }
.user-answer-text { white-space: pre-wrap; }

/* --- [核心] 移動端響應式樣式 --- */
@media (max-width: 768px) {
  .review-container {
    position: static;
    display: flex;
    flex-direction: column;

    /* [关键] 添加滚动能力 */
    overflow-y: auto;
    
    background: var(--panel-bg);
    border-radius: 12px;
    padding: 30px;
    border: 1px solid var(--border-color);
    z-index: 1;
  }

  .exam-review-page {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
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
  .page-title { font-size: 22px; }
  .page-subtitle { font-size: 13px; }
  
  .overall-summary-card h2 { font-size: 24px; }
  .overall-summary-card p { font-size: 14px; }
  
  .question-header { font-size: 16px; }

  /* 將網格變為單列 */
  .results-grid {
    grid-template-areas:
      "user"
      "standard"
      "feedback"
      "score";
    grid-template-columns: 1fr;
    gap: 16px;
  }
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