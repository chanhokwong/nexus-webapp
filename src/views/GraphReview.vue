<template>
  <div v-if="isLoading" class="loading-state">{{ $t('graphReview.loadKnowledghGraphMsg') }}</div>
  
  <div v-else-if="graphData && graphData.content.format === 'mermaid'" class="graph-review-container">
    <header class="page-header">
      <h1 class="page-title">{{ graphData.title }}</h1>
      <button class="btn-back" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        <span>{{ $t('graphReview.returnHistoryList') }}</span>
      </button>
    </header>
    
    <div class="graph-content-panel">
      <!-- [核心] 将 graphData.content.code 传递给子组件 -->
      <KnowledgeGraphRenderer :graph-string="graphData.content.code" />
    </div>
  </div>

  <div v-else class="empty-state">
    {{ $t('graphReview.emptyGraphMsg') }}
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
// [核心] 导入更新后的 API 函数和类型
import { getGraphById, type GraphDetail } from '../api/history'; 
import KnowledgeGraphRenderer from '../components/KnowledgeGraphRenderer.vue';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const graphData = ref<GraphDetail | null>(null);
const isLoading = ref(true);

// --- 語言 ---
const { t } = useI18n();

const invalidGraphId = computed(() => t('graphReview.invalidGraphId'));
const loadGraphDetailFail = computed(() => t('graphReview.loadGraphDetailFail'));

onMounted(async () => {
  const graphId = route.params.id as string;
  if (!graphId) {
    ElMessage.error(invalidGraphId.value);
    isLoading.value = false;
    return;
  }

  try {
    const data = await getGraphById(Number(graphId));
    graphData.value = data;
  } catch (error) {
    ElMessage.error(loadGraphDetailFail.value);
    console.error("Error fetching graph detail:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* 样式与 NoteReview.vue 完全一致，无需修改 */

.loading-state, .empty-state {
  display: flex; justify-content: center; align-items: center;
  height: 100%; color: var(--text-secondary);
}

.graph-review-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-shrink: 0;
}
.page-title { font-size: 32px; font-weight: 700; }
.btn-back {
  position: fixed;
  right: 30px;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background-color: transparent;
  color: var(--text-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.btn-back:hover {
  background-color: var(--active-bg);
  color: var(--text-primary);
}

.graph-content-panel {
  flex-grow: 1;
  background: var(--panel-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  min-height: 0;
  display: flex; /* 让子组件可以占满空间 */
}
</style>