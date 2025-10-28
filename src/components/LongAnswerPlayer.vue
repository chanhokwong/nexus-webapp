<template>
  <div class="long-quiz-player">
    <div v-if="isLoading && !gradedResult" class="loading-state">
      <div class="spinner"></div>
      <span>{{ loadingText }}</span>
    </div>

    <!-- 答题阶段 -->
    <div v-else-if="!gradedResult && currentQuestion" class="answering-phase">
      <div class="question-area">
        <p class="question-label">題目：</p>
        <p class="question-text">{{ currentQuestion }}</p>
      </div>
      <textarea
        v-model="userAnswer"
        class="answer-textarea"
        placeholder="在此輸入你的詳細論述..."
        rows="15"
      ></textarea>
      <!-- [核心] 确保 :disabled 的逻辑是正确的 -->
      <button class="btn-submit" @click="submitAnswer" :disabled="isLoading || !userAnswer.trim()">
        {{ isLoading ? '批改中...' : '提交批改' }}
      </button>
    </div>

    <!-- [核心] 结果展示阶段 (全新布局) -->
    <div v-else-if="gradedResult" class="results-phase">
      <!-- 1. 左侧：总分 + 评分细则 -->
      <div class="results-panel">
        <div class="result-card score-card">
          <div class="score-label">綜合得分</div>
          <div class="score-value">{{ gradedResult.overall_score }}</div>
        </div>
        <div class="result-card">
          <h3>評分標準 (Marking Scheme)</h3>
          <ul class="marking-scheme-list">
            <li v-for="(item, index) in gradedResult.marking_scheme" :key="index" class="marking-item">
              <div class="criterion-header">
                <span class="criterion-title">{{ item.criterion }}</span>
                <span class="criterion-score">{{ item.score }} / {{ item.max_score }}</span>
              </div>
              <p class="criterion-comment">{{ item.comment }}</p>
            </li>
          </ul>
        </div>

        <div class="result-card">
          <h3>AI 深度評價</h3>
          <MarkdownRenderer :markdown="gradedResult.feedback" />
        </div>
        <div class="result-card">
          <h3>你的答案</h3>
          <p class="user-answer-text">{{ userAnswer }}</p>
        </div>
        <div class="result-card">
          <h3>參考答案</h3>
          <MarkdownRenderer :markdown="gradedResult.standard_answer" />
        </div>
        <!-- 底部操作按钮 -->
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
    
    <div v-else class="empty-state">未能加載題目，請返回重試。</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { generateLongQuestion, gradeLongAnswer, type GradedLongAnswerResponse, type GradeLongAnswerRequest } from '../api/ai';
import MarkdownRenderer from './MarkdownRenderer.vue';

const props = defineProps<{ workspaceId: number }>();

const isLoading = ref(true);
const loadingText = ref('');
const currentQuestion = ref('');
const userAnswer = ref('');
const gradedResult = ref<GradedLongAnswerResponse | null>(null);
const currentSessionId = ref<string | null>(null);

onMounted(() => {
  getNextQuestion();
});

// [核心最终修正] 加固并调试 submitAnswer
const submitAnswer = async () => {
  console.log("--- [DEBUG] 1. submitAnswer function CALLED! ---");

  // 1. 严格的前置条件检查
  if (!currentSessionId.value) {
    ElMessage.error("会话 ID 丢失，无法提交。请刷新重试。");
    console.error("[DEBUG] Submit aborted: currentSessionId is null or undefined.");
    return;
  }
  if (!currentQuestion.value.trim()) {
    ElMessage.error("题目丢失，无法提交。请刷新重试。");
    console.error("[DEBUG] Submit aborted: currentQuestion is empty.");
    return;
  }
  if (!userAnswer.value.trim()) {
    ElMessage.warning("答案不能为空。");
    return;
  }

  isLoading.value = true;
  loadingText.value = '批改中...';
  
  try {
    // 2. 构建 payload
    const payload: GradeLongAnswerRequest = {
      session_id: currentSessionId.value,
      question: currentQuestion.value,
      user_answer: userAnswer.value,
    };
    
    // 3. [关键] 在发送前打印出所有参数
    console.log("[DEBUG] 2. Submitting to gradeLongAnswer with:");
    console.log("   - workspaceId:", props.workspaceId);
    console.log("   - payload:", payload);

    // 4. 调用 API
    const result = await gradeLongAnswer(props.workspaceId, payload);

    console.log("[DEBUG] 3. Grading API success. Result:", result);
    gradedResult.value = result;

  } catch (error: any) { 
    console.error("[DEBUG] 4. Error grading answer:", error);
    // [关键] 打印出后端返回的具体错误详情
    if (error.response && error.response.data) {
      console.error("   - Backend validation error:", error.response.data);
      ElMessage.error(`批改失敗: ${error.response.data.detail || '未知錯誤'}`);
    } else {
      ElMessage.error("批改失敗，請重試。");
    }
  } finally { 
    isLoading.value = false;
  }
};

const getNextQuestion = async () => {
  isLoading.value = true;
  loadingText.value = '正在生成新題目...';
  gradedResult.value = null;
  userAnswer.value = '';
  currentQuestion.value = '';
  try {
    const response = await generateLongQuestion(props.workspaceId);
    currentQuestion.value = response.question;
    currentSessionId.value = response.session_id;
  } catch (error) { 
    ElMessage.error("获取新题目失败，请重试。");
    console.error("Error getting next question:", error);
  } finally { 
    isLoading.value = false; 
  }
};

// [核心] 新增“重答此题”的函数
const retryCurrentQuestion = () => {
  gradedResult.value = null; // 重置结果状态，返回答题界面
  userAnswer.value = '';     // 清空之前的答案
  // currentQuestion 和 currentSessionId 保持不变
};
</script>

<style scoped>
/* --- 整体布局 --- */
.long-quiz-player {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* --- 加载与空状态 --- */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  height: 100%;
  color: var(--text-secondary);
}
.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(88, 94, 227, 0.3);
  border-top-color: var(--active-glow);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
  flex-shrink: 0; /* 防止被压缩 */
}
.question-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.question-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
}

.answer-textarea {
  flex-grow: 1; /* 占据大部分剩余空间 */
  min-height: 300px; /* 确保有足够大的初始输入区域 */
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
  display: grid;
  gap: 24px;
  height: 100%;
}
.results-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto; /* 左右两栏各自独立滚动 */
  padding-bottom: 20px;
}

.result-card {
  background-color: rgba(17, 19, 44, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  flex-shrink: 0; /* 防止卡片被压缩 */
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

/* 让“你的答案”和“参考答案”占据整行 */
.result-card.full-width {
  grid-column: 1 / -1;
}

.result-actions {
  grid-column: 1 / -1; /* 让按钮组横跨两栏 */
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 20px;
}
.btn-submit.retry-btn {
  /* “重答”按钮使用次要样式 */
  background: transparent;
  border: 1px solid var(--active-glow);
  color: var(--active-glow);
}
.btn-submit.retry-btn:hover:not(:disabled) {
  background: var(--active-bg);
  box-shadow: none; /* 移除主要按钮的辉光效果 */
}
.next-btn {
  align-self: center; /* 按钮居中 */
  margin-top: 20px;
}
/* 评分细则列表 */
.marking-scheme-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.marking-item { border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
.marking-item:last-child { border-bottom: none; padding-bottom: 0; }
.criterion-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.criterion-title { font-weight: 600; color: var(--text-primary); }
.criterion-score { font-weight: 700; color: var(--active-glow); background: var(--active-bg); padding: 2px 8px; border-radius: 4px; font-size: 14px; }
.criterion-comment { font-size: 14px; color: var(--text-secondary); }

.user-answer-text { white-space: pre-wrap; } /* 保持用户答案的换行 */
</style>