<template>
  <div class="history-container">
    <h1 class="page-header">{{ $t('history.title') }}</h1>

    <div class="filter-bar">
      <div class="search-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input type="search" class="filter-input" :placeholder="searchPlaceholder" v-model="searchQuery">
      </div>
      <el-select v-model="activeCategory" class="filter-select" popper-class="nexus-select-popper">
        <el-option :label="allActivities" value="all" />
        <el-option :label="quizHistory" value="quiz" />
        <el-option :label="chatHistory" value="chat" />
        <el-option :label="graphHistory" value="graph" />
        <el-option :label="notesHistory" value="notes" />
      </el-select>
    </div>

    <div class="history-stream-container">
      <div v-if="isLoading" class="loading-state">{{ $t('history.loadHistoryMsg') }}</div>
      <div v-else-if="filteredHistory.length === 0" class="empty-state">{{ $t('history.noFindRelateHistory') }}</div>
      
      <div 
        v-for="(event, index) in filteredHistory" 
        :key="`${event.type}-${event.id}`"
        class="history-event" 
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div v-if="index < filteredHistory.length - 1" class="stream-connector"></div>
        <div class="event-icon">
          <el-icon><component :is="getIconForType(event.type)" /></el-icon>
        </div>
        <div class="event-card">
          <div class="event-details">
            <div class="event-title">{{ event.title }}</div>
            <div class="event-context">{{ event.context }}</div>
          </div>
          <div class="event-meta">
            <div class="event-timestamp">{{ formatTimeAgo(event.timestamp) }}</div>
            <!-- [核心] 绑定点击事件 -->
            <div class="event-action">
              <a href="#" @click.prevent="viewHistoryDetail(event)">{{ $t('history.viewDetail') }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElSelect, ElOption } from 'element-plus';
import { Search, QuestionFilled, ChatDotRound, Share, Notebook } from '@element-plus/icons-vue';
import { getAllHistory, type HistoryEvent } from '../api/history';

import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useI18n } from 'vue-i18n';

// --- 状态 ---
const router = useRouter(); // 2. 初始化 router
const allHistory = ref<HistoryEvent[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const activeCategory = ref('all');

// --- 国际化 ---
const { t } = useI18n();
const searchPlaceholder = computed(() => t('history.search_placeholder'));
const allActivities = computed(() => t('history.all_activities'));
const quizHistory = computed(() => t('history.quiz_history'));
const chatHistory = computed(() => t('history.chat_history'));
const graphHistory = computed(() => t('history.graph_history'));
const notesHistory = computed(() => t('history.notes_history'));
const loadHistoryFail = computed(() => t('history.loadHistoryFail'));
const unknowTime = computed(() => t('history.unknowTime'));

// --- 数据获取 ---
onMounted(async () => {
  isLoading.value = true;
  try {
    allHistory.value = await getAllHistory();
  } catch (error) {
    ElMessage.error(loadHistoryFail.value);
    console.error(error);
  } finally {
    isLoading.value = false;
  }
});

// --- 交互逻辑 ---
const filteredHistory = computed(() => {
  let events = [...allHistory.value];
  if (activeCategory.value !== 'all') {
    events = events.filter(e => e.type === activeCategory.value);
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    events = events.filter(e => e.title.toLowerCase().includes(query) || e.context.toLowerCase().includes(query));
  }
  return events;
});

const getIconForType = (type: HistoryEvent['type']) => {
  switch (type) {
    case 'quiz': return QuestionFilled;
    case 'chat': return ChatDotRound;
    case 'graph': return Share;
    case 'notes': return Notebook;
    default: return QuestionFilled;
  }
};

const formatTimeAgo = (timestamp: string): string => {
  if (!timestamp) return unknowTime.value;
  
  try {
    // 1. [关键] 检查字符串是否已经包含 'Z' 或时区信息
    let dateString = timestamp;
    if (!dateString.includes('T') && dateString.includes(' ')) {
        // 将 "YYYY-MM-DD HH:MM:SS" 格式替换为 "YYYY-MM-DDTHH:MM:SS"
        dateString = dateString.replace(' ', 'T');
    }
    if (!dateString.endsWith('Z')) {
        // 如果字符串末尾没有 'Z'，我们手动为它添加上
        dateString += 'Z';
    }
    
    // 2. 现在，dateString 是一个标准的 ISO 8601 (UTC) 格式字符串，例如 "2023-11-06T10:00:00Z"
    //    new Date() 在处理这种标准格式时，行为是 100% 可靠的
    const date = new Date(dateString);

    // 3. 使用 date-fns 进行格式化
    return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });

  } catch (error) {
    console.error(`Failed to format time for timestamp: "${timestamp}"`, error);
    return timestamp; 
  }
};
// [核心] 添加“查看详情”的逻辑
const viewHistoryDetail = (event: HistoryEvent) => {
  console.log("Viewing detail for:", event);

  switch (event.type) {
    case 'quiz':
      router.push(`/quiz-history/${event.id}`);
      break;
    case 'chat':
      // 假设未来会有一个聊天记录页面
      router.push(`/chat-history/${event.id}`);
      break;
    case 'graph':
      router.push(`/knowledge-graphs/${event.id}`);
      break;
    case 'notes':
      router.push(`/notes/${event.id}`);
      break;
    case 'chat':
      router.push(`/chat-history/${event.id}`);
      break;
    default:
      ElMessage.info(`查看 “${event.title}” 詳情的功能待開發。`);
  }
};
</script>

<style scoped>
/* [移除] 全局 fixed 定位，改為在媒體查詢中處理 */
/* 桌面端仍然需要 fixed 定位 */
@media (min-width: 769px) {
  .page-header,
  .filter-bar,
  .history-stream-container {
    position: fixed;
    transition: left 0.3s ease-in-out;
    left: calc(var(--sidebar-width) + 40px);
    right: 40px;
  }
  .sidebar.collapsed ~ .main-content .page-header,
  .sidebar.collapsed ~ .main-content .filter-bar,
  .sidebar.collapsed ~ .main-content .history-stream-container {
    left: calc(var(--sidebar-width-collapsed) + 40px);
  }

  .page-header { top: 40px; }
  .filter-bar { top: 110px; }
  .history-stream-container { top: 180px; bottom: 40px; }
}

/* --- 主内容区 --- */
.history-container { 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
}
.page-header {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 24px;
    padding-left: 20px;
    flex-shrink: 0;
}

.search-wrapper, .search-wrapper svg, .filter-input, .filter-select { 
    background-color: var(--panel-bg); 
    border: 1px solid var(--border-color);
    border-radius: 6px; 
    padding: 10px 12px;
    color: var(--text-primary); 
    font-family: inherit;
    font-size: 14px;
    width: 100%; 
    backdrop-filter: blur(5px);
    transition: border-color 0.3s; 
  }
.search-wrapper .filter-input { padding-left: 36px; }

.filter-input:focus, .filter-select:focus { 
    outline: none; 
    border-color: var(--active-glow); 
}

/* --- 记忆之流 --- */
.history-stream-container { 
  position: fixed;
  top: 270px; /* header + filter-bar 高度 + 间距 */
  bottom: 40px; /* main-content 的 padding-bottom */
  
  overflow-y: auto;
  padding: 0 20px;
  z-index: 1;
}
.history-event {
    display: flex; align-items: flex-start; gap: 20px;
    position: relative; padding-bottom: 30px;
    opacity: 0; transform: translateY(30px);
    animation: slideInUp 0.6s ease-out forwards;
}
@keyframes slideInUp { to { opacity: 1; transform: translateY(0); } }

.stream-connector {
    position: absolute; top: 40px; left: 20px; width: 2px;
    height: calc(100% - 20px);
    background: linear-gradient(to bottom, var(--border-color), transparent);
}
.event-icon {
    flex-shrink: 0; width: 42px; height: 42px;
    border-radius: 50%; display: flex; justify-content: center; align-items: center;
    background-color: var(--panel-bg); border: 1px solid var(--border-color);
    position: relative;
    font-size: 20px;
}
.event-icon::before {
    content: ''; position: absolute; width: 10px; height: 10px;
    border-radius: 50%; background-color: var(--active-glow);
    animation: pulse-dot 2.5s infinite;
}
@keyframes pulse-dot {
    0% { box-shadow: 0 0 0 0 var(--active-glow); }
    70% { box-shadow: 0 0 0 10px rgba(104, 91, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(104, 91, 255, 0); }
}

.event-card {
    flex-grow: 1; background-color: var(--panel-bg);
    backdrop-filter: blur(10px); border: 1px solid var(--border-color);
    border-radius: 12px; padding: 20px;
    display: flex; justify-content: space-between; align-items: center;
    transition: all 0.3s;
}
.history-event:hover .event-card {
    transform: translateX(10px);
    box-shadow: inset 0 0 20px var(--active-bg), 0 5px 20px rgba(0,0,0,0.2);
    border-color: var(--active-glow);
}

.event-title { font-size: 18px; font-weight: 700; }
.event-context { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
.event-meta { text-align: right; }
.event-timestamp { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.event-action a { color: var(--active-glow); text-decoration: none; font-weight: 500; }

.loading-state, .empty-state { text-align: center; padding: 40px; color: var(--text-secondary); }


/* --- [新增] 響應式樣式 --- */
@media (max-width: 768px) {
  .page-header {
    font-size: 28px;
    margin-bottom: 20px;
  }

  /* 2. 篩選欄變為垂直堆疊 */
  .filter-bar {
    flex-direction: column;
    align-items: stretch; /* 讓子元素撐滿寬度 */
  }
  .filter-select {
    width: 100%; /* 佔滿寬度 */
  }

  /* 3. 調整時間流佈局 */
  .history-stream-container {
    overflow-y: auto;
    padding: 20px 20px;
    z-index: 1;
    flex-grow: 1; /* 讓其填充剩餘空間 */
  }
  .history-event {
    gap: 15px; /* 減小圖標和卡片的間距 */
  }
  .stream-connector {
    left: 17px; /* 根據圖標寬度調整 */
  }
  .event-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  /* 4. [核心] 事件卡片內部變為垂直佈局 */
  .event-card {
    flex-direction: column;
    align-items: flex-start; /* 左對齊 */
    padding: 16px;
    width: 380px;
  }
  .event-meta {
    width: 100%;
    text-align: left; /* 左對齊 */
    padding-left: 0;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color); /* 添加分割線 */
    display: flex; /* 讓時間和按鈕在同一行 */
    justify-content: space-between; /* 兩端對齊 */
    align-items: center;
  }
  .event-timestamp {
    margin-bottom: 0; /* 移除底部 margin */
  }
  
  .history-event:hover .event-card {
    transform: none; /* 在移動端移除懸停位移效果 */
  }
}
</style>

<style>
.el-popper.nexus-select-popper {
  background: hsl(233, 62%, 18%) !important;
  border: 1px solid rgba(88, 94, 227, 0.3) !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  padding: 6px !important;
}
.el-select-dropdown__item {
  color: var(--text-secondary) !important;
}
</style>