<template>
  <div v-if="isLoading" class="loading-state">正在加載模擬卷回顧...</div>
  
  <div v-else-if="historyData" class="review-container">
    <header class="page-header">
      <h1 class="page-title">{{ historyData.title }}</h1>
      <p class="page-subtitle">
        完成於 {{ formattedDate }}，源自工作台: {{ historyData.workspace_name }}
      </p>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
    </header>

    <div class="review-content">
      <div class="overall-summary-card">
        <h2>總分: {{ historyData.grading_report?.overall_score ?? 'N/A' }}</h2>
        <p>{{ historyData.grading_report?.overall_feedback ?? '無總體評價。' }}</p>
      </div>

      <div v-for="question in historyData.paper_content.questions" :key="question.id" class="record-item">
        <div class="question-header">
          <strong>題目:</strong> {{ question.question_text }} ({{ question.points }} 分)
        </div>
        
        <div class="results-phase">
          <!-- 這裡的佈局和樣式將復用 LongAnswerReview.vue 的風格 -->
          <div class="result-card">
            <h3>你的答案</h3>
            <p>{{ getUserAnswer(question.id) || '未作答' }}</p>
          </div>
          <div class="result-card">
            <h3>參考答案</h3>
            <MarkdownRenderer :markdown="getGrading(question.id)?.standard_answer || '無參考答案'" />
          </div>
          <div class="result-card wide">
            <h3>AI 深度評價</h3>
            <MarkdownRenderer :markdown="getGrading(question.id)?.feedback || '無評價'" />
          </div>
          <div class="result-card score-card">
            <div class="score-label">得分</div>
            <div class="score-value">{{ getGrading(question.id)?.score ?? '?' }} / {{ question.points }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">無法加載該模擬卷的歷史記錄。</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getExamSessionById, type ExamSessionDetail } from '../api/history';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import { ArrowLeft } from '@element-plus/icons-vue';

const route = useRoute();
const isLoading = ref(true);
const historyData = ref<ExamSessionDetail | null>(null);

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
/* --- 整体布局 (复用 NoteReview/QuizReview 的成功模式) --- */
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
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-shrink: 0;
}
.page-title { font-size: 32px; font-weight: 700; }
.btn-back {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background-color: transparent;
  color: var(--text-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.btn-back:hover { background-color: var(--active-bg); color: var(--text-primary); }

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
.question-header { margin-bottom: 20px; }
.question-number { font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; }
.question-text { font-size: 20px; font-weight: 500; color: var(--text-primary); line-height: 1.6; }

.results-phase {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}
.results-left-panel, .results-right-panel {
  display: flex; flex-direction: column;
  gap: 24px;
}
.result-card {
  background-color: rgba(17, 19, 44, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}
.result-card h3 {
  font-size: 14px; font-weight: 700; text-transform: uppercase;
  color: var(--text-secondary); margin-bottom: 12px;
  padding-bottom: 10px; border-bottom: 1px solid var(--border-color);
}
.result-card p, .result-card :deep(.markdown-body) {
  font-size: 16px; line-height: 1.7; color: var(--text-primary);
}
.score-card { text-align: center; padding: 24px; border-color: var(--active-glow); }
.score-label { font-size: 16px; color: var(--text-secondary); margin-bottom: 8px; }
.score-value { font-size: 64px; font-weight: 700; color: var(--active-glow); }

.marking-scheme-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.marking-item { border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
.marking-item:last-child { border-bottom: none; padding-bottom: 0; }
.criterion-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.criterion-title { font-weight: 600; color: var(--text-primary); }
.criterion-score { font-weight: 700; color: var(--active-glow); background: var(--active-bg); padding: 2px 8px; border-radius: 4px; font-size: 14px; }
.criterion-comment { font-size: 14px; color: var(--text-secondary); }
.user-answer-text { white-space: pre-wrap; }
</style>