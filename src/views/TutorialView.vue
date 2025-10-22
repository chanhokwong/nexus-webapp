<template>
  <div class="tutorial-view-container">
    <header class="page-header">
      <h1 class="page-title">{{ tutorialTitle }}</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
    </header>

    <div class="steps-list-container" ref="scrollContainerRef" @scroll="updateScrollButtons">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <span>正在加載教程...</span>
      </div>
      <div v-else-if="steps.length > 0" class="steps-list">
        <div v-for="(step, index) in steps" :key="step.step_number" class="step-item">
          <div class="step-header" @click="toggleStep(index)">
            <span class="step-number">{{ String(step.step_number).padStart(2, '0') }}</span>
            <h2 class="step-title">{{ step.title }}</h2>
            <el-icon class="step-icon" :class="{ 'is-expanded': step.isExpanded }"><ArrowDown /></el-icon>
          </div>
          <transition name="fade-slide">
            <div v-if="step.isExpanded" class="step-content">
            
              <!-- [核心] 使用自定义加载动画 -->
              <div v-if="step.isLoading" class="loading-state">
                <div class="spinner"></div>
                <span>正在生成內容...</span>
              </div>

              <MarkdownRenderer v-else-if="step.content" :markdown="step.content" />

              <!-- [可选] 如果加载失败，可以显示一个错误提示 -->
              <div v-else class="error-state">
                <p>內容加載失敗，請嘗試重新折疊並展開此步驟。</p>
              </div>

            </div>
          </transition>
        </div>
      </div>
      <div v-else class="empty-state">未能生成或加載教程大綱。</div>
      
      <div class="scroll-controls" v-show="canScroll">
        <button class="scroll-btn" @click="scrollUp" :disabled="!canScrollUp">...</button>
        <button class="scroll-btn" @click="scrollDown" :disabled="!canScrollDown">...</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { generateStepContent, saveTutorial, getTutorialDetails, getOrGenerateStepContent } from '../api/ai';
import type { TutorialStep, CurriculumOutlineResponse } from '../api/ai';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue';

interface UITutorialStep extends TutorialStep {
  id?: number; // 历史记录中的 step 有 id
  isLoading: boolean;
  isExpanded: boolean;
}

const props = defineProps<{ workspaceId?: string; tutorialId?: string }>();

const tutorialTitle = ref('正在生成...');
const steps = ref<UITutorialStep[]>([]);
const isReviewMode = ref(false);
const isLoading = ref(true);

const scrollContainerRef = ref<HTMLElement | null>(null);
const canScroll = ref(false);
const canScrollUp = ref(false);
const canScrollDown = ref(false);
let resizeObserver: ResizeObserver | null = null;
let saveTimeout: number | null = null;

onMounted(async () => {
  if (props.tutorialId) {
    isReviewMode.value = true;
    await loadSavedTutorial(Number(props.tutorialId));
  } else if (props.workspaceId) {
    isReviewMode.value = false;
    const outline = window.history.state.outline as CurriculumOutlineResponse | undefined;
    if (outline) {
      tutorialTitle.value = outline.tutorial_title;
      steps.value = outline.steps.map(s => ({ ...s, isLoading: false, isExpanded: false }));
    } else {
      ElMessage.error("无法获取教程大纲，请返回重试。");
    }
  }
  isLoading.value = false;
  
  // 初始化滚动监听
  if (scrollContainerRef.value) {
    resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(scrollContainerRef.value);
    nextTick(updateScrollButtons);
  }
});

onUnmounted(() => {
  if (resizeObserver && scrollContainerRef.value) {
    resizeObserver.unobserve(scrollContainerRef.value);
  }
  if (saveTimeout) clearTimeout(saveTimeout);
});

const loadSavedTutorial = async (id: number) => {
  try {
    const detail = await getTutorialDetails(id);
    if (!detail) throw new Error("getTutorialDetails returned empty.");
    tutorialTitle.value = detail.title;
    steps.value = detail.steps.map(s => ({ ...s, isLoading: false, isExpanded: false }));
  } catch (err) {
    console.error("Failed to load tutorial details:", err);
  }
};

const toggleStep = async (index: number) => {
  const step = steps.value[index];
  // @ts-ignore
  step.isExpanded = !step.isExpanded;
  setTimeout(updateScrollButtons, 400); // 动画结束后更新

  // @ts-ignore
  if (step.isExpanded && !step.content) {
    // @ts-ignore
    step.isLoading = true;
    try {
      let content = '';
      // @ts-ignore
      if (isReviewMode.value && step.id) {
        // @ts-ignore
        const updatedStep = await getOrGenerateStepContent(step.id);
        content = updatedStep.content || '';
      } else if (props.workspaceId) {
        // @ts-ignore
        const response = await generateStepContent(props.workspaceId, step.title);
        content = response.content;
      }
      // @ts-ignore
      step.content = content;
      if (!isReviewMode.value) handleAutoSave(); // 只有新生成的才自动保存
    } catch (error) {
      // @ts-ignore
      step.content = '加載內容失敗，請重試。';
      console.error(error);
    } finally {
      // @ts-ignore
      step.isLoading = false;
    }
  }
};

const handleAutoSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(async () => {
    if (!props.workspaceId) return;
    try {
      await saveTutorial(props.workspaceId, tutorialTitle.value, steps.value);
      ElMessage.success({ message: '教程進度已自動保存', duration: 500 });
    } catch (error) {
      console.error('Failed to auto-save tutorial:', error);
      ElMessage.error('自動保存失敗');
    }
  }, 3000);
};

// --- [核心] 滚动逻辑 (与 Files.vue 完全一致) ---
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
function scrollUp() {
  scrollContainerRef.value?.scrollBy({ top: -400, behavior: 'smooth' });
}
function scrollDown() {
  scrollContainerRef.value?.scrollBy({ top: 400, behavior: 'smooth' });
}

</script>

<style scoped>
/* --- [核心最终修正] 采用 Fixed 定位布局 --- */
:global(.main-content .page-header),
:global(.main-content .function-bar),
:global(.main-content .file-list-panel) {
  left: calc(var(--sidebar-width) + 40px);
  right: 40px;
  transition: left 0.3s ease-in-out;
}
:global(.sidebar.collapsed ~ .main-content .page-header),
:global(.sidebar.collapsed ~ .main-content .function-bar),
:global(.sidebar.collapsed ~ .main-content .file-list-panel) {
  left: calc(var(--sidebar-width-collapsed) + 40px);
}

/* --- 布局与样式 --- */
.tutorial-view-container { height: 100%; }
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-shrink: 0;
}
.page-title { font-size: 32px; font-weight: 700; }
.header-actions { margin-left: auto; }
.btn-back { 
  position: fixed;
  right: 40px;
  top: 50px;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background-color: transparent;
  color: var(--text-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}

.steps-list-container {
  position: fixed;
  top: 110px;
  bottom: 40px;
  width: 1370px;
  z-index: 2;

  background-color: var(--panel-bg); backdrop-filter: blur(10px);
  border: 1px solid var(--border-color); border-radius: 12px;
  display: flex; flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.steps-list { 
  flex-grow: 1; /* 占据所有剩余空间 */
  overflow-y: auto; /* [关键] 滚动发生在这里 */
  min-height: 0; 
}
.step-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  padding: 6px;
}
.step-header {
  display: flex; align-items: center; gap: 20px;
  padding: 16px; cursor: pointer;
  background-color: rgba(255, 255, 255, 0.03);
  transition: background-color 0.2s;
}
.step-header:hover { background-color: var(--active-bg); }
.step-number { font-size: 18px; font-weight: 700; color: var(--active-glow); }
.step-title { flex-grow: 1; font-size: 18px; font-weight: 500; }
.step-icon { font-size: 16px; transition: transform 0.3s ease; }
.step-icon.is-expanded { transform: rotate(180deg); }

.step-content {
  padding: 0 24px;
  border-top: 1px solid var(--border-color);
}
.loading-state { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
.loading-state, .error-state {
  display: flex;
  flex-direction: column; /* 让 spinner 和文本垂直排列 */
  justify-content: center;
  align-items: center;
  gap: 15px; /* 动画和文本之间的间距 */
  padding: 40px 0; /* 增加垂直空间 */
  color: var(--text-secondary);
  font-size: 14px;
}
.spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(88, 94, 227, 0.3);
  border-top-color: var(--active-glow);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; max-height: 1000px; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); max-height: 0; }

.scroll-controls {
    position: absolute; bottom: 20px; right: 20px;
    display: flex; flex-direction: column; gap: 8px; z-index: 2;
}
.scroll-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex; /* v-show 会控制显示/隐藏 */
    flex-direction: column;
    gap: 8px;
    z-index: 2;
}
</style>