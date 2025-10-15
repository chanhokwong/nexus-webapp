<template>
  <div class="ai-tutor-chat">
    <div class="chat-history" ref="historyContainerRef">
      <div v-for="(msg, index) in messages" :key="index" class="chat-message" :class="`role-${msg.role}`">
        <div class="avatar" :class="`avatar-${msg.role}`">
          <el-icon v-if="msg.role === 'assistant'"><Avatar /></el-icon>
          <el-icon v-else><User /></el-icon>
        </div>
        <div class="message-content">
          <MarkdownRenderer :markdown="msg.content" />
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <textarea v-model="userInput" placeholder="向 AI 導師提問..." @keydown.enter.exact.prevent="sendMessage" :disabled="isLoading" rows="1" @input="autoResizeTextarea" ref="textareaRef"></textarea>
      <button @click="sendMessage" :disabled="isLoading || !userInput.trim()"><el-icon><Promotion /></el-icon></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Promotion, Avatar, User } from '@element-plus/icons-vue';
import { streamWorkspaceQuery, type ChatMessage } from '../api/ai';
import MarkdownRenderer from './MarkdownRenderer.vue';
import { v4 as uuidv4 } from 'uuid'; // [核心] 导入 uuid

const props = defineProps<{
  workspaceId?: number;
  initialMessages?: ChatMessage[];
  sessionId?: string;
}>();

const messages = ref<ChatMessage[]>([]);
const userInput = ref('');
const isLoading = ref(false);
const historyContainerRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const chatSessionId = ref('');

onMounted(() => {
  if (Array.isArray(props.initialMessages) && props.initialMessages.length > 0) {
    // 如果是，则加载历史消息
    messages.value = props.initialMessages.map(msg => ({
      ...msg,
      // @ts-ignore
      role: msg.role === 'human' ? 'user' : 'assistant'
    }));
  } else {
    messages.value.push({ role: 'assistant', content: '你好！我是你的 AI 學習導師。你可以隨時向我提問關於這個工作台的任何問題。' });
  }
  chatSessionId.value = props.sessionId || uuidv4();
  scrollToBottom();
});

const scrollToBottom = () => {
  nextTick(() => {
    if (historyContainerRef.value) {
      historyContainerRef.value.scrollTop = historyContainerRef.value.scrollHeight;
    }
  });
};

const autoResizeTextarea = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
};

const sendMessage = async () => {
  if (!props.workspaceId) {
    ElMessage.error("工作台 ID 缺失，无法发送消息。");
    console.error("sendMessage aborted: props.workspaceId is undefined.");
    return;
  }

  if (!userInput.value.trim() || isLoading.value) return;
  const userMessage: ChatMessage = { role: 'user', content: userInput.value };
  messages.value.push(userMessage);
  
  const currentInput = userInput.value;
  userInput.value = '';
  autoResizeTextarea();
  isLoading.value = true;
  await nextTick();
  scrollToBottom();

  const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
  messages.value.push(assistantMessage);
  
  let fullResponseJson = '';

  try {
    // [核心] 确保传递了正确的参数数量 (6个)
    await streamWorkspaceQuery(
      props.workspaceId,
      currentInput,
      messages.value.slice(0, -2),
      chatSessionId.value,
      (chunk: string) => { // [核心] 为 chunk 添加 string 类型
        fullResponseJson += chunk;
        try {
          const parsed = JSON.parse(fullResponseJson);
          if (parsed && parsed.answer) {
            assistantMessage.content = parsed.answer;
          }
        } catch (e) {
          // 如果 JSON 还未完整，解析会失败，这是正常现象，我们忽略它
        }
        scrollToBottom();
      },
      () => {
        // 流结束
        isLoading.value = false;
        console.log("Stream completed. Final JSON:", fullResponseJson);
        // 可以在这里处理 sources
      }
    );
  } catch (error) {
    assistantMessage.content = "抱歉，與 AI 導師的連接發生錯誤。";
    isLoading.value = false;
    ElMessage.error("請求失敗");
    console.error(error);
  }
};

</script>

<style scoped>
/* --- [核心最终修正] 完整的聊天界面样式 --- */
.ai-tutor-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
/* 自定义滚动条 */
.chat-history::-webkit-scrollbar { width: 6px; }
.chat-history::-webkit-scrollbar-track { background: transparent; }
.chat-history::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 3px; }

.chat-message {
  display: flex;
  gap: 16px;
  max-width: 85%;
}
.chat-message.role-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.chat-message.role-assistant {
  align-self: flex-start;
}

.avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; justify-content: center; align-items: center;
  flex-shrink: 0; font-size: 20px;
  color: var(--text-primary);
}
.avatar-user { background-color: var(--active-glow); }
.avatar-assistant {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
}
.chat-message.role-user .message-content {
  background-color: var(--active-bg);
  border-bottom-right-radius: 4px;
}
.chat-message.role-assistant .message-content {
  border-bottom-left-radius: 4px;
}

:deep(.markdown-body) {
  /* 覆盖 MarkdownRenderer 的默认样式 */
  color: var(--text-secondary);
  font-size: 16px;
}
:deep(.markdown-body p) { margin: 0; }

.chat-input-area {
  flex-shrink: 0;
  padding: 12px 24px 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: flex-end; /* 确保按钮和文本域底部对齐 */
  gap: 16px;
  background-color: var(--panel-bg);
  margin-top: 10px;
}

textarea {
  flex-grow: 1;
  max-height: 150px;
  resize: none;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 15px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.3s;
}
textarea:focus { border-color: var(--active-glow); }

button {
  width: 44px; height: 44px;
  border-radius: 50%; border: none;
  background-color: var(--active-glow); color: white;
  cursor: pointer; display: flex;
  justify-content: center; align-items: center;
  font-size: 20px; transition: filter 0.2s;
  flex-shrink: 0;
}
button:hover:not(:disabled) { filter: brightness(1.2); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>