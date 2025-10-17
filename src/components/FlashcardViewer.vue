<template>
  <!-- [核心] 1. 确保在根元素就有 v-if 保护 -->
  <div v-if="isValid" class="flashcard-viewer">
    <div class="card-container" :class="{ flipped: isFlipped }" @click="isFlipped = !isFlipped">
      <div class="card-face card-front">
        <div class="card-content">
          <span class="card-counter">{{ currentIndex + 1 }} / {{ cards?.length }}</span>
          <!-- [核心] 2. 再次确认 currentCard 存在 -->
          <h3 v-if="currentCard" class="card-title">{{ currentCard.title }}</h3>
        </div>
      </div>
      <div class="card-face card-back">
        <div class="card-content">
          <p v-if="currentCard" class="card-text">{{ currentCard.content }}</p>
        </div>
      </div>
    </div>

    <div class="navigation-controls">
      <button @click="prevCard" :disabled="currentIndex === 0">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <span>{{ currentIndex + 1 }} / {{ cards?.length }}</span>
      <button @click="nextCard" :disabled="currentIndex === (cards?.length || 0) - 1">
        <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>

  <!-- [核心] 3. 添加一个明确的错误/空状态 -->
  <div v-else class="loading-state">
    <p>記憶卡片數據無效或為空。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import type { Flashcard } from '../api/ai';

const props = defineProps<{
  cards?: Flashcard[] | null; 
}>();

// [核心] 4. 创建一个计算属性来判断数据是否有效
const isValid = computed(() => Array.isArray(props.cards) && props.cards.length > 0);

const currentIndex = ref(0);
const isFlipped = ref(false);

const currentCard = computed(() => {
  // [核心] 5. 再次加固 computed
  if (isValid.value) {
    return props.cards![currentIndex.value]; // 使用 ! 断言 cards 此时一定存在
  }
  return null;
});

const prevCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    isFlipped.value = false;
  }
};

const nextCard = () => {
  if (isValid.value && currentIndex.value < props.cards!.length - 1) {
    currentIndex.value++;
    isFlipped.value = false;
  }
};
</script>

<style scoped>
/* 样式与我们的主题保持一致 */
.flashcard-viewer { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 30px; }
.card-container { width: 100%; max-width: 500px; height: 300px; position: relative; cursor: pointer; perspective: 1000px; }
.card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transition: transform 0.6s; transform-style: preserve-3d; display: flex; justify-content: center; align-items: center; padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); }
.card-front { z-index: 2; }
.card-back { transform: rotateY(180deg); }
.card-container.flipped .card-front { transform: rotateY(-180deg); }
.card-container.flipped .card-back { transform: rotateY(0deg); }
.card-content { text-align: center; }
.card-counter { position: absolute; top: 15px; left: 15px; font-size: 12px; color: var(--text-secondary); }
.card-title { font-size: 24px; font-weight: 700; color: var(--text-primary); }
.card-text { font-size: 16px; color: var(--text-secondary); line-height: 1.6; }
.navigation-controls { display: flex; align-items: center; gap: 20px; color: var(--text-primary); }
.navigation-controls button { background: none; border: 1px solid var(--border-color); color: var(--text-primary); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: all 0.2s; }
.navigation-controls button:hover:not(:disabled) { background: var(--active-bg); border-color: var(--active-glow); }
.navigation-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
/* [新增] 加载状态样式 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
}
</style>