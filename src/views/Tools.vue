<template>
  <div class="tools-container">
    <h1 class="page-header">{{ $t('tools.smartToolbox') }}</h1>

    <nav class="tool-tabs">
      <button 
        v-for="category in categories" 
        :key="category.id"
        class="tab-item"
        :class="{ active: activeCategory === category.id }"
        @click="activeCategory = category.id"
      >
        {{ category.name }}
      </button>
    </nav>

    <div class="tool-grid">
      <div 
        v-for="tool in filteredTools" 
        :key="tool.id" 
        class="tool-card"
        :class="{ disabled: tool.disabled }"
        @click="handleToolClick(tool)"
      >
        <div class="card-icon-wrapper" :style="{ color: tool.color, backgroundColor: tool.bgColor }">
          <el-icon><component :is="tool.icon" /></el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ tool.title }}</h3>
          <p class="card-description">{{ tool.description }}</p>
        </div>
        <span v-if="tool.badge" class="card-badge" :style="{ backgroundColor: tool.badgeColor || '#e53935' }">
          {{ tool.badge }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
// 导入所有需要的图标
import { Reading, AlarmClock, MagicStick, DocumentCopy } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

// --- 國際化 ---
const { t } = useI18n();

const all = computed(() => t('tools.all'));
const translation = computed(() => t('tools.translation'));
const productivity = computed(() => t('tools.productivity'));
const generation = computed(() => t('tools.generation'));
const extraction = computed(() => t('tools.extraction'));
const paperTransTitle = computed(() => t('tools.paperTransTitle'));
const paperTransDescribe = computed(() => t('tools.paperTransDescribe'));
const comingSoon = computed(() => t('tools.comingSoon'));
const paperTransUnableUse = computed(() => t('tools.paperTransUnableUse'));
const pomodoro = computed(() => t('tools.pomodoro'));
const pomodoroDescribe = computed(() => t('tools.pomodoroDescribe'));
const pomodoroUnableUse = computed(() => t('tools.pomodoroUnableUse'));
const planGeneration = computed(() => t('tools.planGeneration'));
const planGenerationDescribe = computed(() => t('tools.planGenerationDescribe'));
const planGenerationUnableUse = computed(() => t('tools.planGenerationUnableUse'));
const dataExtract = computed(() => t('tools.dataExtract'));
const dataExtractDescribe = computed(() => t('tools.dataExtractDescribe'));
const dataExtractUnableUse = computed(() => t('tools.dataExtractUnableUse'));
const functionComingSoonMsg = computed(() => t('tools.functionComingSoonMsg'));

// --- 1. 数据结构定义 ---
interface Tool {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'all' | 'translation' | 'productivity' | 'generation' | 'extraction';
  color: string;
  bgColor: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
  action: () => void; // 每个工具都有一个点击后执行的动作
}


// 定义分类
const categories = ref([
  { id: 'all', name: all.value },
  { id: 'translation', name: translation.value },
  { id: 'productivity', name: productivity.value },
  { id: 'generation', name: generation.value },
  { id: 'extraction', name: extraction.value },
]);
const activeCategory = ref('all');

// [核心] 定义所有可用的工具
const allTools = ref<Tool[]>([
  { 
    id: 'paper-translation', title: paperTransTitle.value, description: paperTransDescribe.value, 
    icon: Reading, category: 'translation', 
    color: '#4FC3F7', bgColor: 'rgba(79, 195, 247, 0.1)',
    disabled: true, badge: comingSoon.value,
    action: () => ElMessage.info(paperTransUnableUse.value)
  },
  { 
    id: 'pomodoro-clock', title: pomodoro.value, description: pomodoroDescribe.value, 
    icon: AlarmClock, category: 'productivity',
    color: '#FFB74D', bgColor: 'rgba(255, 183, 77, 0.1)',
    disabled: true, badge: comingSoon.value,
    action: () => {
      // 可以在这里创建一个新路由 /tools/pomodoro，或者弹出一个模态框
      ElMessage.info(pomodoroUnableUse.value);
    }
  },
  { 
    id: 'plan-generation', title: planGeneration.value, description: planGenerationDescribe.value, 
    icon: MagicStick, category: 'generation',
    color: '#BA68C8', bgColor: 'rgba(186, 104, 200, 0.1)',
    disabled: true, badge: comingSoon.value,
    action: () => ElMessage.info(planGenerationUnableUse.value)
  },
  { 
    id: 'datasheet-extraction', title: dataExtract.value, description: dataExtractDescribe.value, 
    icon: DocumentCopy, category: 'extraction',
    color: '#4DB6AC', bgColor: 'rgba(77, 182, 172, 0.1)',
    disabled: true, badge: comingSoon.value,
    action: () => ElMessage.info(dataExtractUnableUse.value)
  },
]);

// --- 2. 交互逻辑 ---
const filteredTools = computed(() => {
  if (activeCategory.value === 'all') {
    return allTools.value;
  }
  return allTools.value.filter(tool => tool.category === activeCategory.value);
});

const handleToolClick = (tool: Tool) => {
  if (tool.disabled) {
    ElMessage.info(`“${tool.title}”`+functionComingSoonMsg.value);
    return;
  }
  tool.action(); // 执行工具定义好的动作
};
</script>

<style scoped>
/* --- 2. 主內容區 --- */
.tools-container {
  height: 100%;
}
.page-header {
    margin-bottom: 20px;
    font-size: 32px;
    font-weight: 700;
}

/* --- 3. 標籤導航 (Tabs) --- */
.tool-tabs {
    display: flex;
    gap: 16px;
    margin-bottom: 30px;
    border-bottom: 1px solid var(--border-color);
}
.tab-item {
    padding: 12px 4px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.3s, border-bottom-color 0.3s;
    flex-shrink: 0;
}
.tab-item:hover {
    color: var(--text-primary);
}
.tab-item.active {
    color: var(--text-primary);
    border-bottom-color: var(--active-glow);
}

/* --- 4. 工具網格 (Grid) --- */
.tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
}
.tool-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background-color: var(--card-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
    position: relative;
    overflow: hidden; /* 確保 badge 不會溢出圓角 */
}
.tool-card:hover {
    transform: translateY(-5px);
    border-color: var(--active-glow);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.card-icon-wrapper {
    width: 48px; height: 48px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
}
.card-icon-wrapper .el-icon { font-size: 24px; }

.card-content { flex-grow: 1; }
.card-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: var(--text-primary); }
.card-description { font-size: 13px; color: var(--text-secondary); }

.card-badge {
    position: absolute;
    top: 12px; right: 12px;
    background-color: #e53935;
    color: white;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    border-radius: 4px;
}
/* [新增] 为禁用状态的卡片添加样式 */
.tool-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tool-card.disabled:hover {
  transform: none;
  border-color: var(--border-color);
  box-shadow: none;
}

/* --- [新增] 響應式樣式 --- */
@media (max-width: 768px) {
  /* 1. 調整頁面標題 */
  .page-header {
    font-size: 28px;
  }

  /* 2. 核心：讓標籤導航可水平滾動 */
  .tool-tabs {
    overflow-x: auto; /* 允許水平滾動 */
    padding-bottom: 10px; /* 為滾動條留出空間，防止遮擋下邊框 */
    margin-bottom: 20px;
    /* 隱藏滾動條的樣式 (可選，但能提升美觀度) */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .tool-tabs::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  /* 3. 將網格變為單列列表 */
  .tool-grid {
    grid-template-columns: 1fr; /* 單列佈局 */
    gap: 16px; /* 調整卡片間距 */
  }
}
</style>