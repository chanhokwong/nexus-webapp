<template>
  <div v-if="isLoading" class="loading-state">正在加載聊天紀錄...</div>
  <div v-else-if="workspaceId !== null && initialMessages" class="chat-review-container">
    <header class="page-header">
      <h1 class="page-title">聊天紀錄回顧</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回歷史列表</span>
      </button>
    </header>
    <div class="chat-panel">
      <AiTutorChat 
        :workspace-id="workspaceId"
        :initial-messages="initialMessages"
        :session-id="sessionId"
      />
    </div>
  </div>
  <div v-else class="empty-state">
    找不到該聊天紀錄的詳細訊息。<br>
    <span v-if="errorMessage" class="error-detail">{{ errorMessage }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import type { ChatMessage } from '../api/ai';
import AiTutorChat from '../components/AiTutorChat.vue';
import apiClient from '../api/axios';

// --- [核心] 类型定义，与真实 API 响应完全匹配 ---
interface ChatHistoryDetail {
  session_id: string;
  messages: ChatMessage[];
  workspace_id: number | null;
}

const route = useRoute();
const isLoading = ref(true);
// [核心] 我们只需要获取初始数据，然后传递给子组件
const initialMessages = ref<ChatMessage[] | null>(null);
const workspaceId = ref<number | null>(null);
const sessionId = ref('');
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  sessionId.value = route.params.id as string;
  if (!sessionId.value || sessionId.value === 'undefined') {
    errorMessage.value = "无效的聊天 ID。";
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    
    // 1. 我们期望得到的是一个对象，而不是数组
    const responseData = await apiClient.get<ChatHistoryDetail>(`/chat-history/${sessionId.value}`);
    
    // 2. [关键] 对 workspace_id 和 messages 进行严格检查
    // @ts-ignore
    if (responseData && responseData.messages && responseData.workspace_id !== null && responseData.workspace_id !== undefined) {
      // @ts-ignore
      initialMessages.value = responseData.messages;
      // @ts-ignore
      workspaceId.value = responseData.workspace_id;
    // @ts-ignore
    } else if (responseData && responseData.messages) {
      // 兼容旧数据：如果返回了消息但没有 workspace_id
      errorMessage.value = "此為舊版聊天紀錄，無法繼續對話。";
      // @ts-ignore
      initialMessages.value = responseData.messages;
      workspaceId.value = 0; // 给一个占位符，但后续 sendMessage 会失败
      ElMessage.warning('此為舊版聊天紀錄，僅供查看，無法繼續對話。');
    } else {
      throw new Error("API 响应格式不完整。");
    }

  } catch (error: any) {
    const msg = error.response?.data?.detail || "加載聊天紀錄失敗";
    ElMessage.error(msg);
    errorMessage.value = msg;
    console.error("Error fetching chat detail:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- [核心最终修正] 采用与 NoteReview.vue 一致的 Flexbox 滚动布局 --- */

.loading-state, .empty-state {
  display: flex; justify-content: center; align-items: center;
  height: 100%; color: var(--text-secondary);
}

/* 1. 根容器设置为 flex，并占满父级高度 */
.chat-review-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 2. 头部设置为固定高度，不允许收缩 */
.page-header {
  display: flex; justify-content: space-between; align-items: center;
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

/* 3. [关键] 内容面板占据所有剩余空间 */
.chat-panel {
  position: fixed;
  /* 
    top 等于 .page-header 的高度 + 它们之间的 margin + .main-content 的 padding-top
    大约是 40px (padding) + 50px (header) + 24px (margin) = 114px
  */
  top: 120px; 
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
.chat-input-area {
  padding-bottom: 50px;
}
</style>