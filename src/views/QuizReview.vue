<template>
  <div v-if="isLoading" class="loading-state">{{ $t('quizReview.loadQuizHistoryMsg') }}</div>
  
  <!-- [核心] 将整个页面包裹在一个 flex 容器中 -->
  <div v-else-if="quizResult" class="quiz-review-container">
    <header class="page-header">
      <h1 class="page-title">{{ $t('quizReview.historyReview') }}</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>{{ $t('quizReview.returnHistoryList') }}</span>
      </button>
    </header>
    
    <div class="summary-card">
      <div class="summary-item">
        <span class="label">{{ $t('quizReview.sourceByWorkspace') }}</span>
        <span class="value">{{ quizResult.workspace_name }}</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ $t('quizReview.finishTime') }}</span>
        <span class="value">{{ new Date(quizResult.created_at).toLocaleString() }}</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ $t('quizReview.score') }}</span>
        <span class="value score">{{ quizResult.score }} / {{ quizResult.total_questions }}</span>
      </div>
    </div>

    <!-- [核心] 题目列表现在是可滚动区域 -->
    <div class="questions-list">
      <div v-for="(attempt, index) in quizResult.attempts" :key="index" class="question-item">
        <p class="question-text">{{ index + 1 }}. {{ attempt.question_text }}</p>
        <div class="options">
          <div 
            v-for="option in attempt.options" 
            :key="option"
            class="option"
            :class="getOptionClass(option, attempt)"
          >
            <el-icon v-if="isCorrect(option, attempt)" class="feedback-icon"><Check /></el-icon>
            <el-icon v-else-if="isIncorrect(option, attempt)" class="feedback-icon"><Close /></el-icon>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">{{ $t('quizReview.noFindQuizHistory') }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Check, Close } from '@element-plus/icons-vue';
import apiClient from '../api/axios';
import { useI18n } from 'vue-i18n';

// --- 國際化 ---
const { t } = useI18n();

const invalidQuizId = computed(() => t('quizReview.invalidQuizId'));
const loadQuizDetailFail = computed(() => t('quizReview.loadQuizDetailFail'));

// --- [核心最终修正] 类型定义，与真实 API 响应完全匹配 ---
interface QuizAttempt {
  question_text: string;
  options: string[];
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
}

interface QuizResultDetail { 
  session_id: number;
  workspace_name: string; 
  score: number;
  total_questions: number;
  attempts: QuizAttempt[];
  created_at: string;
}

const route = useRoute();
const quizResult = ref<QuizResultDetail | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  const sessionId = route.params.id as string;
  if (!sessionId) {
    ElMessage.error(invalidQuizId.value);
    isLoading.value = false;
    return;
  }

  try {
    // 我们的 Axios 拦截器会直接返回 data，所以 responseData 的类型就是 QuizResultDetail
    // 后端返回的是一个对象，而不是数组
    const responseData = await apiClient.get<QuizResultDetail>(`/quiz-history/${sessionId}`);
    
    // [关键] 直接将返回的数据赋值给 quizResult
    if (responseData && responseData.session_id) {
      quizResult.value = responseData;
    } else {
      // 如果后端返回了 200 OK，但 data 是空的或无效的
      throw new Error("API returned invalid data format.");
    }

  } catch (error: any) {
    // 增加更详细的错误日志
    const errorMessage = error.response?.data?.detail || loadQuizDetailFail.value;
    ElMessage.error(errorMessage);
    console.error("Error fetching quiz review:", error);
  } finally {
    isLoading.value = false;
  }
});

// --- [核心最终修正] 辅助函数，使用新的字段名 ---
const getOptionClass = (option: string, attempt: QuizAttempt) => {
  if (option === attempt.correct_answer) {
    return 'correct';
  }
  if (option === attempt.user_answer && !attempt.is_correct) {
    return 'incorrect';
  }
  return 'neutral'; // 其他未选中的选项
};

const isCorrect = (option: string, attempt: QuizAttempt) => {
  return option === attempt.correct_answer;
};

const isIncorrect = (option: string, attempt: QuizAttempt) => {
  return option === attempt.user_answer && !attempt.is_correct;
};
</script>

<style scoped>
/* --- [核心最终修正] 完整的、美观的样式 --- */
.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
}

.quiz-review-container {
  /* 1. 建立定位上下文 */
  position: relative; 
  /* 确保它占满父容器 (.main-content) 的可用空间 */
  width: 100%;
  height: 100%;
  /* 移除 flex 布局 */
}
.page-header {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 32px;
  font-weight: 700;
}
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

.summary-card {
  display: flex;
  gap: 20px;
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid var(--border-color);
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
.summary-item .value.score {
  color: var(--active-glow);
}

.questions-list {
  /* 2. 脱离文档流，进行绝对定位 */
  position: absolute;
  
  /* 3. 手动计算位置和尺寸 */
  /* 
    这里的 top 值需要精确测量或估算.
    它等于 .page-header 的高度 + .summary-card 的高度 + 它们之间的 margin.
    一个估算值大约是: (32px + 24px) + (90px + 30px) = 176px 
    我们可以用一个稍微宽松一点的值
  */
  top: 180px; 
  left: 0;
  right: 0;
  bottom: 0;
  
  /* 4. 添加滚动能力 */
  overflow-y: auto;
  padding-right: 15px; /* 为滚动条留出空间 */
  
  display: flex; flex-direction: column; gap: 30px;
}
.question-item {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 20px;
}
.question-item:last-child {
  border-bottom: none;
}
.question-text {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
  margin-bottom: 20px;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.option {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}
.option.neutral {
  border-color: var(--border-color);
  color: var(--text-secondary);
}
.option.correct {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
  color: #a5d6a7;
  font-weight: 500;
}
.option.incorrect {
  border-color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
  color: #ef9a9a;
}
.feedback-icon {
  font-size: 20px;
}
</style>