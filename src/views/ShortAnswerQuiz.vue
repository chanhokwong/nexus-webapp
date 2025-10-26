<template>
  <div class="short-quiz-container">
    <header class="page-header">
      <h1 class="page-title">引導式短答題</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回工作台</span>
      </button>
    </header>

    <div class="quiz-panel" ref="scrollContainerRef" @scroll="updateScrollButtons">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <span>{{ loadingText }}</span>
      </div>
      
      <!-- 答题阶段 -->
      <div v-else-if="!gradedResult" class="answering-phase">
        <div class="question-area">
          <p class="question-label">題目：</p>
          <p class="question-text">{{ currentQuestion }}</p>
        </div>
        <textarea
          v-model="userAnswer"
          class="answer-textarea"
          placeholder="在此輸入你的答案..."
          :disabled="isLoading"
          rows="8"
        ></textarea>
        <button class="btn-submit" @click="submitAnswer" :disabled="isLoading || !userAnswer.trim()">
          {{ isLoading ? '批改中...' : '提交批改' }}
        </button>
      </div>

      <!-- 结果展示阶段 -->
      <div v-else class="results-phase">
        <div class="result-card score-card">
          <div class="score-label">你的得分</div>
          <div class="score-value">{{ gradedResult.score }}</div>
        </div>
        <div class="result-card">
          <h3>你的答案</h3>
          <p>{{ userAnswer }}</p>
        </div>
        <div class="result-card">
          <h3>AI 評價</h3>
          <MarkdownRenderer :markdown="gradedResult.feedback" />
        </div>
        <div class="result-card">
          <h3>參考答案</h3>
          <MarkdownRenderer :markdown="gradedResult.standard_answer" />
        </div>
        <div class="result-actions">
          <button class="btn-submit retry-btn" @click="retryCurrentQuestion">
            再次回答此題
          </button>
          <button class="btn-submit next-btn" @click="getNextQuestion" :disabled="isLoading">
            {{ isLoading ? '出題中...' : '下一題' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { generateShortQuestion, gradeShortAnswer, type GradedAnswerResponse, type GradeAnswerRequest } from '../api/ai';
import { saveShortAnswerRecord, type SaveShortAnswerPayload } from '../api/history';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import { ArrowLeft } from '@element-plus/icons-vue';

const props = defineProps<{ workspaceId: string }>();

const isLoading = ref(false);
const loadingText = ref('');
const currentQuestion = ref('');
const userAnswer = ref('');
const gradedResult = ref<GradedAnswerResponse | null>(null);

const scrollContainerRef = ref<HTMLElement | null>(null);
const canScroll = ref(false);
const canScrollUp = ref(false);
const canScrollDown = ref(false);

const currentSessionId = ref<string | null>(null);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const initialQuestion = window.history.state.question as string | undefined;
  const initialSessionId = window.history.state.sessionId as string | undefined;

  if (initialQuestion && initialSessionId) {
    currentQuestion.value = initialQuestion;
    currentSessionId.value = initialSessionId;
  } else {
    // 如果直接刷新页面，重新获取一题
    getNextQuestion();
  }
  if (scrollContainerRef.value) {
    resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(scrollContainerRef.value);
    nextTick(updateScrollButtons); // 初始检查
  }
});

// [核心最终修正] 改造 submitAnswer 函数
const submitAnswer = async () => {
  if (!currentSessionId.value) {
    ElMessage.error("會話 ID 丢失，無法提交。");
    return;
  }
  isLoading.value = true;
  loadingText.value = '批改中...';
  
  try {
    // 1. 获取批改结果
    const gradePayload: GradeAnswerRequest = {
      session_id: currentSessionId.value,
      question: currentQuestion.value,
      user_answer: userAnswer.value,
    };
    const result = await gradeShortAnswer(props.workspaceId, gradePayload);
    
    // 2. [关键] 批改成功后，立即构建保存的 payload
    const savePayload: SaveShortAnswerPayload = {
      session_id: currentSessionId.value,
      workspace_id: Number(props.workspaceId),
      question: currentQuestion.value,
      user_answer: userAnswer.value,
      score: result.score,
      feedback: result.feedback,
      standard_answer: result.standard_answer,
    };
    
    // 3. [关键] 在后台“发射后不管”地调用保存 API
    saveShortAnswerRecord(savePayload)
      .then(() => {
        console.log("Short answer record saved successfully.");
        ElMessage.success({ message: "答題記錄已自動保存", duration: 2000 });
      })
      .catch(err => {
        console.error("Failed to auto-save short answer record:", err);
        // 这是一个非致命错误，只在控制台提示
      });

    // 4. 更新 UI 以显示批改结果
    gradedResult.value = result;

  } catch (error) { 
    ElMessage.error("批改失敗，請重試。"); 
    console.error(error);
  } finally { 
    isLoading.value = false; 
  }
};

const getNextQuestion = async () => {
  isLoading.value = true;
  loadingText.value = '正在生成新題目...';
  gradedResult.value = null;
  userAnswer.value = '';
  try {
    const response = await generateShortQuestion(props.workspaceId);
    currentQuestion.value = response.question;
    currentSessionId.value = response.session_id;
  } catch (error) { ElMessage.error("获取新题目失败，请重试。"); }
  finally { isLoading.value = false; }
};


// [核心] 新增“重答此题”的函数
const retryCurrentQuestion = () => {
  gradedResult.value = null; // 重置结果状态，返回答题界面
  userAnswer.value = '';     // 清空之前的答案
  // currentQuestion 保持不变
  nextTick(updateScrollButtons);
};

// --- 滚动逻辑 ---
function updateScrollButtons() {
  const el = scrollContainerRef.value;
  if (!el) return;
  const hasScrollbar = el.scrollHeight > el.clientHeight;
  canScroll.value = hasScrollbar;
  if (hasScrollbar) {
    canScrollUp.value = el.scrollTop > 0;
    canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  } else {
    canScrollUp.value = false;
    canScrollDown.value = false;
  }
}

</script>

<style scoped>
/* --- 整体布局 (复用 NoteReview 的成功模式) --- */
.short-quiz-container {
  position: fixed;
  /* 
    top 等于 .page-header 的高度 + 它们之间的 margin + .main-content 的 padding-top
    大约是 40px (padding) + 50px (header) + 24px (margin) = 114px
  */
  top: 50px; 
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
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

.quiz-panel {
  flex-grow: 1;
  overflow-y: auto;
  background: var(--panel-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  min-height: 0;
  padding: 30px 40px;
}

/* --- 答题阶段 --- */
.answering-phase {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.question-area {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}
.question-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.question-text {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
}

.answer-textarea {
  flex-grow: 1; /* 占据大部分剩余空间 */
  min-height: 200px;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 16px;
  line-height: 1.7;
  outline: none;
  resize: vertical;
  transition: border-color 0.3s;
}
.answer-textarea:focus {
  border-color: var(--active-glow);
}

.btn-submit {
  align-self: flex-end; /* 按钮靠右 */
  padding: 12px 24px;
  background-color: var(--active-glow);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-submit:hover:not(:disabled) {
  filter: brightness(1.2);
  box-shadow: 0 0 15px var(--active-glow);
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* --- 结果展示阶段 --- */
.results-phase {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
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

.next-btn {
  align-self: center; /* 按钮居中 */
  margin-top: 20px;
}

/* [核心] 新增操作按钮组样式 */
.result-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
.btn-submit.retry-btn {
  /* “重答”按钮使用次要样式 */
  background: transparent;
  border: 1px solid var(--active-glow);
  color: var(--active-glow);
}
.btn-submit.retry-btn:hover:not(:disabled) {
  background: var(--active-bg);
  box-shadow: none;
}
</style>