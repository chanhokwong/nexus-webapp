<template>
  <div class="chat-review-page">
    <div v-if="isLoading" class="loading-state">{{ $t('chatReview.loading') }}</div>
    
    <div v-else-if="workspaceId !== null && initialMessages" class="chat-review-container">
      <header class="page-header">
        <h1 class="page-title">{{ $t('chatReview.title') }}</h1>
        <button class="btn-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span class="desktop-only">{{ $t('chatReview.return_history') }}</span>
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
      {{ $t('chatReview.load_fail') }}<br>
      <span v-if="errorMessage" class="error-detail">{{ errorMessage }}</span>
    </div>
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
import { useI18n } from 'vue-i18n';

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
const { t } = useI18n();


onMounted(async () => {
  sessionId.value = route.params.id as string;
  if (!sessionId.value || sessionId.value === 'undefined') {
    errorMessage.value = t('chatReview.invalid_id');
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
      errorMessage.value = t('chatReview.legacy_chat');
      // @ts-ignore
      initialMessages.value = responseData.messages;
      workspaceId.value = 0; // 给一个占位符，但后续 sendMessage 会失败
      ElMessage.warning(t('chatReview.legacy_chat_warning'));
    } else {
      throw new Error("API response format is incomplete.");
    }

  } catch (error: any) {
    const msg = error.response?.data?.detail || t('chatReview.load_fail_api');
    ElMessage.error(msg);
    errorMessage.value = msg;
    console.error("Error fetching chat detail:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- 基礎佈局 --- */
.chat-review-page {
  height: 100%;
}

.loading-state, .empty-state {
  display: flex; flex-direction: column; /* 讓錯誤信息換行 */ 
  justify-content: center; align-items: center;
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

/* --- [核心] 移動端響應式樣式 --- */
@media (max-width: 768px) {
  /* 讓整個頁面容器在移動端有內邊距 */
  .chat-review-page {
    padding: 16px;
  }
  
  .page-header {
    margin-bottom: 16px;
  }
  .page-title {
    font-size: 24px;
  }
  .btn-back {
    padding: 8px;
    border-radius: 50%;
  }
  .desktop-only {
    display: none;
  }

  .chat-panel {
    position: static;
    overflow-y: auto;
    background: var(--panel-bg);
    border-radius: 12px;
    padding: 10px;
    border: 1px solid var(--border-color);
    z-index: 1;
  }
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