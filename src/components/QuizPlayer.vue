<template>
  <div class="quiz-player">
    <div v-if="!isFinished">
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }"></div>
      </div>
      <div class="question-counter">{{ $t('quizPlayer.quizNum') }} {{ currentQuestionIndex + 1 }} / {{ questions.length }}</div>
      
      <div class="question-content">
        <p class="question-text">{{ currentQuestion?.question }}</p>
        <div class="options-grid">
          <button
            v-for="(option, index) in currentQuestion?.options"
            :key="index"
            class="option-btn"
            :class="getOptionClass(option)"
            @click="selectAnswer(option)"
            :disabled="!!userAnswers[currentQuestionIndex]"
          >
            <span class="option-text">{{ option }}</span>
            <el-icon v-if="getIcon(option)" class="feedback-icon">
                <component :is="getIcon(option)" />
            </el-icon>
          </button>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <button @click="nextQuestion" :disabled="!userAnswers[currentQuestionIndex] || currentQuestionIndex === questions.length - 1">
          {{ $t('quizPlayer.nextQuestion') }}
        </button>
      </div>
    </div>

    <div v-else class="quiz-summary">
      <h3 class="summary-title">{{ $t('quizPlayer.quizFinished') }}</h3>
      <p class="summary-score">{{ $t('quizPlayer.yourScore') }} {{ score }} / {{ questions.length }}</p>

      <!-- [新增] 保存状态提示 -->
      <div v-if="saveStatus === 'saving'" class="save-status">{{ $t('quizPlayer.savingQuizResult') }}</div>
      <div v-if="saveStatus === 'success'" class="save-status success">{{ $t('quizPlayer.quizSavedSuccess') }}</div>
      <div v-if="saveStatus === 'error'" class="save-status error">{{ $t('quizPlayer.quizSavedFail') }}</div>

      <div class="summary-details">
        <div v-for="(question, index) in questions" :key="index" class="summary-item">
          <p class="summary-question">{{ index + 1 }}. {{ question.question }}</p>
          <p class="summary-answer correct" v-if="userAnswers[index] === question.answer">
            {{ $t('quizPlayer.correctAnsMsg1') }} {{ userAnswers[index] }} {{ $t('quizPlayer.correctAnsMsg2') }}
          </p>
          <p class="summary-answer incorrect" v-else>
            {{ $t('quizPlayer.correctAnsMsg1') }} {{ userAnswers[index] }} {{ $t('quizPlayer.wrongAnsMsg') }} {{ question.answer }}
          </p>
        </div>
      </div>
      <button @click="restartQuiz">{{ $t('quizPlayer.requiz') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { QuizResponse } from '../api/ai'; // 导入类型
import { Check, Close } from '@element-plus/icons-vue';
import { saveQuizResult, type SaveQuizPayload } from '../api/history';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps<{
  quizData: QuizResponse;
  workspaceId: number; 
}>();

const questions = ref(props.quizData.questions);
const currentQuestionIndex = ref(0);
const userAnswers = ref<(string | null)[]>(new Array(questions.value.length).fill(null));
const isFinished = ref(false);
const quizSessionId = ref('');
const saveStatus = ref<'idle' | 'saving' | 'success' | 'error'>('idle');


onMounted(() => {
  quizSessionId.value = uuidv4();
});

const getIcon = (option: string) => {
  const selectedAnswer = userAnswers.value[currentQuestionIndex.value];
  if (!selectedAnswer) return null; // 未回答时不显示任何图标
  if (!currentQuestion.value) return; // 或者 return '';

  const correctAnswer = currentQuestion.value.answer;
  if (option === correctAnswer) return Check; // 正确答案显示对勾
  if (option === selectedAnswer && option !== correctAnswer) return Close; // 用户选错的答案显示叉号

  return null; // 其他情况不显示图标
};

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const score = computed(() => {
  return questions.value.reduce((correctCount, question, index) => {
    return userAnswers.value[index] === question.answer ? correctCount + 1 : correctCount;
  }, 0);
});

const selectAnswer = (option: string) => {
  if (userAnswers.value[currentQuestionIndex.value]) return;
  userAnswers.value[currentQuestionIndex.value] = option;
  
  if (currentQuestionIndex.value === questions.value.length - 1) {
    setTimeout(() => {
      isFinished.value = true;
      // [关键] 当测验结束后，调用保存函数
      handleSaveResult();
    }, 1000);
  }
};

// 一次性保存整个测验结果
const handleSaveResult = async () => {
  saveStatus.value = 'saving';
  try {
    // 1. 构建完整的 attempts 数组
    const attempts = questions.value.map((q, index) => ({
      question_text: q.question,
      user_answer: userAnswers.value[index] || '',
      is_correct: userAnswers.value[index] === q.answer,
      options: q.options,
      correct_answer: q.answer,
    }));

    // 2. 构建最终的 payload
    const payload: SaveQuizPayload = {
      session_id: quizSessionId.value,
      workspace_id: props.workspaceId,
      score: score.value,
      total_questions: questions.value.length,
      attempts: attempts,
    };
    
    console.log("Saving final quiz result:", payload);
    // 3. 调用 API
    await saveQuizResult(payload);
    
    saveStatus.value = 'success';
  } catch (error) {
    saveStatus.value = 'error';
    console.error("Failed to save quiz result:", error);
  }
};

const getOptionClass = (option: string) => {
  const selectedAnswer = userAnswers.value[currentQuestionIndex.value];
  if (!selectedAnswer) return '';
  if (!currentQuestion.value) return; // 或者 return '';
  const correctAnswer = currentQuestion.value.answer;
  if (option === correctAnswer) return 'correct';
  if (option === selectedAnswer && option !== correctAnswer) return 'incorrect';
  return 'disabled';
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
  }
};

const restartQuiz = () => {
  currentQuestionIndex.value = 0;
  userAnswers.value.fill(null);
  isFinished.value = false;
  quizSessionId.value = uuidv4();
  saveStatus.value = 'idle';
};
</script>

<style scoped>
.quiz-player {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* --- 答题进度 --- */
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}
.progress {
  height: 100%;
  background-color: var(--active-glow);
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
}
.question-counter {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: right;
  margin-bottom: 24px;
}

/* --- 题目和选项 --- */
.question-content {
  flex-grow: 1;
}
.question-text {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 30px;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr; /* 单列布局 */
  gap: 12px;
}
.option-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 20px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}
.option-btn:not(:disabled):hover {
  border-color: var(--active-glow);
  color: var(--text-primary);
  background-color: var(--active-bg);
}
.option-text {
  /* 允许文本换行 */
  white-space: normal;
  text-align: left;
}
.feedback-icon {
  font-size: 20px;
  flex-shrink: 0; /* 防止图标被压缩 */
  margin-left: 15px;
}
.option-btn.correct .feedback-icon {
  color: #66bb6a;
}
.option-btn.incorrect .feedback-icon {
  color: #ef5350;
}
/* 答题后选项的状态样式 */
.option-btn.correct {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
  color: #a5d6a7;
}
.option-btn.incorrect {
  border-color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
  color: #ef9a9a;
}
.option-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: transparent !important; /* 确保未选中的项不会变色 */
}

/* --- 导航按钮 --- */
.navigation-buttons {
  margin-top: 30px;
  text-align: right;
}
.navigation-buttons button, .quiz-summary button {
  padding: 10px 20px;
  background-color: var(--active-glow);
  border: none;
  border-radius: 6px;
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.2s;
}
.navigation-buttons button:hover, .quiz-summary button:hover {
  filter: brightness(1.2);
}
.navigation-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: none;
}

/* --- 测验总结回顾 --- */
.quiz-summary {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.summary-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 8px;
}
.summary-score {
  font-size: 18px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 30px;
}
.summary-details {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}
.summary-item {
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(88, 94, 227, 0.1);
}
.summary-question {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
}
.summary-answer {
  padding-left: 15px;
  font-size: 14px;
}
.summary-answer.correct {
  color: #a5d6a7; /* 绿色 */
  border-left: 3px solid #4caf50;
}
.summary-answer.incorrect {
  color: #ef9a9a; /* 红色 */
  border-left: 3px solid #f44336;
}
.quiz-summary button {
  margin-top: 20px;
  align-self: center;
}

/* [新增] 保存状态提示样式 */
.save-status {
  text-align: center;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 8px;
  border-radius: 6px;
  color: var(--text-secondary);
}
.save-status.success {
  background-color: rgba(76, 175, 80, 0.1);
  color: #a5d6a7;
}
.save-status.error {
  background-color: rgba(244, 67, 54, 0.1);
  color: #ef9a9a;
}
</style>