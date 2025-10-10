<template>
  <div 
    class="mermaid-container" 
    ref="containerRef"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @wheel.prevent="handleWheel"
  >
    <div 
      class="transform-wrapper"
      :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
    >
      <vue-mermaid-string :key="graphString" :value="graphString" :options="mermaidOptions" @error="handleError" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import VueMermaidString from 'vue-mermaid-string';

defineProps<{ graphString: string }>();

const containerRef = ref<HTMLElement | null>(null);
const pan = ref({ x: 0, y: 0 });
const zoom = ref(1);
const isPanning = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });

const mermaidOptions = ref({
  theme: 'dark',
  flowchart: { useMaxWidth: false },
});

const handleMouseDown = (event: MouseEvent) => {
  // 确保不是在拖动滚动条等其他元素
  if (event.target !== containerRef.value && (event.target as HTMLElement).tagName !== 'svg') return;
  isPanning.value = true;
  lastMousePos.value = { x: event.clientX, y: event.clientY };
  if(containerRef.value) containerRef.value.style.cursor = 'grabbing';
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isPanning.value) return;
  // [优化] 不再除以 zoom，直接 1:1 移动
  const dx = event.clientX - lastMousePos.value.x;
  const dy = event.clientY - lastMousePos.value.y;
  pan.value.x += dx;
  pan.value.y += dy;
  lastMousePos.value = { x: event.clientX, y: event.clientY };
};

const handleMouseUp = () => {
  isPanning.value = false;
  if(containerRef.value) containerRef.value.style.cursor = 'grab';
};

const handleWheel = (event: WheelEvent) => {
  event.preventDefault();
  const scaleAmount = 1.1;
  const newZoom = event.deltaY > 0 ? zoom.value / scaleAmount : zoom.value * scaleAmount;
  zoom.value = Math.max(0.1, Math.min(5, newZoom));
};

const handleError = (_error: any) => { /* ... */ };

// [核心最终修正] 优化的 centerView 方法
const centerView = () => {
  if (containerRef.value) {
    const svg = containerRef.value.querySelector('svg');
    const transformWrapper = containerRef.value.querySelector('.transform-wrapper');

    if (svg && transformWrapper) {
      // 1. 重置所有变换
      zoom.value = 1;
      pan.value = { x: 0, y: 0 };

      // 2. 等待 DOM 更新以获取真实尺寸
      setTimeout(() => {
        const containerRect = containerRef.value!.getBoundingClientRect();
        const svgRect = svg.getBBox(); // 使用 getBBox() 获取 SVG 内容的真实尺寸

        if (svgRect.width === 0) return; // Mermaid 可能还未完全渲染尺寸

        // 3. 计算最佳初始缩放比例
        const scaleX = containerRect.width / (svgRect.width + 100); // 左右留 50px 边距
        const scaleY = containerRect.height / (svgRect.height + 100); // 上下留 50px 边距
        const initialZoom = Math.min(1, scaleX, scaleY); // 取最小值确保完全可见，且不超过100%
        zoom.value = initialZoom;

        // 4. 计算居中位置
        // (容器中心点) - (缩放后SVG中心点)
        const newX = (containerRect.width / 2) - ((svgRect.width / 2) * initialZoom);
        const newY = (containerRect.height / 2) - ((svgRect.height / 2) * initialZoom);
        pan.value = { x: newX, y: newY };
      }, 100); // 延迟确保 Mermaid 完成尺寸计算
    }
  }
};

defineExpose({ centerView });

onMounted(() => {
    setTimeout(centerView, 200);
});
</script>

<style scoped>
.mermaid-container {
  width: 100%; height: 100%;
  overflow: hidden;
  cursor: grab;
}
.transform-wrapper {
  transform-origin: 0 0;
  /* 移除 display:flex, 因为我们手动计算位置 */
}
:deep(.v-mermaid-string) {
  display: inline-block;
  line-height: 0;
}
</style>