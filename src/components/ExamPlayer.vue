<template>
  <div class="exam-player-component">
    <div v-if="isLoading" class="loading-state">
      <!-- 這裡可以使用 Element Plus 的骨架屏或簡單的加載動畫 -->
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <span>{{ loadingText }}</span>
    </div>

    <!-- 答題階段 -->
    <div v-else-if="!gradedReport" class="answering-phase">
      <h3 class="exam-title">{{ examData.title }}</h3>
      <div v-for="(question, index) in examData.questions" :key="question.id" class="question-block">
        <p class="question-header">第 {{ index + 1 }} 題 ({{ question.points }}分)</p>
        <p class="question-text">{{ question.question_text }}</p>
        
        <div v-if="question.type === 'multiple_choice'" class="answer-area">
          <el-radio-group v-model="userAnswers[question.id]">
            <el-radio v-for="opt in question.options" :key="opt" :label="opt" size="large">{{ opt }}</el-radio>
          </el-radio-group>
        </div>
        <div v-else-if="question.type === 'short_answer'" class="answer-area">
          <el-input type="textarea" :rows="5" v-model="userAnswers[question.id]" placeholder="請在此作答..."/>
        </div>
      </div>
      <div class="submission-area">
        <el-button type="primary" size="large" @click="submitForGrading" :disabled="!isAllAnswered">提交批改</el-button>
      </div>
    </div>

    <!-- 結果回顧階段 -->
    <div v-else class="review-phase">
      <div class="overall-summary-card">
        <h2>總分: {{ gradedReport.overall_score }}</h2>
        <p>{{ gradedReport.overall_feedback }}</p>
      </div>
      <div v-for="(gradedQ, index) in gradedReport.graded_questions" :key="gradedQ.id" class="graded-question-block">
        <p class="question-header">第 {{ index + 1 }} 題: {{ findQuestionText(gradedQ.id) }}</p>
        <div class="comparison-grid">
          <div><strong>你的答案:</strong><p>{{ gradedQ.user_answer }}</p></div>
          <div><strong>參考答案:</strong><p>{{ gradedQ.standard_answer }}</p></div>
          <div class="feedback-col"><strong>AI 評價:</strong><p>{{ gradedQ.feedback }}</p></div>
          <div class="score-col"><strong>得分:</strong><p class="score">{{ gradedQ.score }} / {{ findQuestionPoints(gradedQ.id) }}</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, type PropType } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { gradeExamPaper, type ExamPaperResponse, type GradedExamReport } from '../api/ai';

const props = defineProps({
  examData: {
    type: Object as PropType<ExamPaperResponse>,
    required: true
  }
});

// 元件內部狀態
const isLoading = ref(false);
const loadingText = ref('');
const userAnswers = reactive<Record<string, any>>({});
const gradedReport = ref<GradedExamReport | null>(null);

onMounted(() => {
  // 根據傳入的 prop 初始化 userAnswers 結構
  props.examData.questions.forEach(q => {
    userAnswers[q.id] = null;
  });
});

const isAllAnswered = computed(() => {
  return props.examData.questions.length > 0 && props.examData.questions.every(q => userAnswers[q.id] !== null && userAnswers[q.id] !== '');
});

const submitForGrading = async () => {
  isLoading.value = true;
  loadingText.value = 'AI 老師正在努力批改中，請稍候...';
  try {
    const report = await gradeExamPaper(props.examData.exam_session_id, { user_answers: userAnswers });
    gradedReport.value = report;
    // 可以在此處自動保存批改結果到歷史記錄
  } catch (error) {
    ElMessage.error("批改失敗，請檢查網路連線後重試。");
  } finally {
    isLoading.value = false;
  }
};

// 輔助函數
const findQuestionText = (id: string) => props.examData.questions.find(q => q.id === id)?.question_text || '';
const findQuestionPoints = (id: string) => props.examData.questions.find(q => q.id === id)?.points || 0;
</script>

<style scoped>
/* --- 根容器 --- */
.exam-player-component {
  width: 100%;
  height: 100%;
  overflow-y: auto; /* 確保內容超出時可以滾動 */
  padding: 12px 24px; /* 增加內邊距 */
  background-color: var(--panel-bg); /* 與工作台面板背景一致 */
}

/* --- 加載狀態 --- */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  height: 100%;
  color: var(--text-secondary);
  font-size: 16px;
}
.loading-state .el-icon {
  font-size: 28px;
}

/* --- 通用標題與區塊 --- */
.exam-title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 32px;
  color: var(--text-primary);
}

.question-block {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}
/* 最後一題不需要底部分隔線 */
.question-block:last-of-type {
  border-bottom: none;
}

.question-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.question-text {
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.7;
  white-space: pre-wrap; /* 保留換行 */
}

.answer-area {
  margin-top: 20px;
}

/* --- 答題階段 --- */
.answering-phase .el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
.submission-area {
  text-align: center;
  margin-top: 40px;
  padding-bottom: 20px; /* 給底部留出空間 */
}

/* --- 結果回顧階段 --- */
.review-phase {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.overall-summary-card {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}
.overall-summary-card h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--active-glow); /* 使用高亮色突出總分 */
}
.overall-summary-card p {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.graded-question-block {
  background-color: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
}
.graded-question-block .question-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
  margin-top: 16px;
}

.comparison-grid div {
  font-size: 14px;
}
.comparison-grid strong {
  color: var(--text-secondary);
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}
.comparison-grid p {
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 6px;
}

.feedback-col {
  grid-column: 1 / -1; /* 評價區塊佔滿整行 */
}

.score-col .score {
  font-size: 18px;
  font-weight: 700;
  color: var(--active-glow);
  background: none;
  padding: 0;
}
</style>