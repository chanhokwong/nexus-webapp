<template>
  <div class="splash-screen" :class="{ 'fade-out': isFadingOut }">
    <div class="splash-content">
      <h1 class="splash-text animated-chars" ref="mainTextContainer"></h1>
      <h2 class="splash-subtext animated-chars" ref="subTextContainer"></h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 創建 Template Refs 來獲取 DOM 元素的引用
const mainTextContainer = ref<HTMLElement | null>(null);
const subTextContainer = ref<HTMLElement | null>(null);
const isFadingOut = ref(false);

// 定義 emit，以便通知父組件動畫已完成
const emit = defineEmits(['animation-finished']);

// 將原生 JS 邏輯封裝在 onMounted 鉤子中
onMounted(() => {
  const mainText = "Nexus";
  const subText = "你的學習伴侶";

  // 確保 DOM 元素已準備好
  if (!mainTextContainer.value || !subTextContainer.value) return;

  // 將字符包裹在 span 中的函數
  function wrapCharsInSpans(text: string, container: HTMLElement, initialDelay = 0) {
    container.innerHTML = text.split('').map((char, index) => {
      const delay = initialDelay + index * 0.1;
      if (char === ' ') return ' ';
      return `<span style="animation-delay: ${delay}s">${char}</span>`;
    }).join('');
  }

  // 啟動主標題和副標題的動畫
  wrapCharsInSpans(mainText, mainTextContainer.value, 0.5);
  const mainAnimationDuration = 0.5 + mainText.length * 0.1 + 0.2;
  wrapCharsInSpans(subText, subTextContainer.value, mainAnimationDuration);
  
  // 設置一個定時器，在動畫結束後觸發
  // 總時長約 3.5 秒後開始淡出，4 秒後徹底結束
  setTimeout(() => {
    isFadingOut.value = true;
  }, 3500);

  setTimeout(() => {
    emit('animation-finished');
  }, 4000);
});
</script>

<style scoped>
/* --- [修正] 開場動畫美化 --- */
.splash-screen {
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex; justify-content: center;
    align-items: center; flex-direction: column;
    z-index: 9999;
    /* [修正] 與登錄頁背景色保持一致 */
    background-color: #1a237e; 
    transition: opacity 1s ease-out;
}

.splash-screen.fade-out {
    opacity: 0;
    pointer-events: none;
}

.splash-text, .splash-subtext {
    width: 100%; /* 確保容器佔滿寬度以便居中 */
    text-align: center; /* 強制文本居中 */
}

.splash-text {
    font-family: 'Cinzel', serif;
    /* [修正] 使用 clamp() 實現響應式且有衝擊力的字體大小 */
    font-size: clamp(56px, 9vw, 120px);
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 8px;
    margin-bottom: 25px;
    text-shadow: 0 0 8px #fff, 0 0 20px var(--primary-glow), 0 0 40px rgba(64, 196, 255, 0.5);
}
.splash-subtext {
    font-family: 'Noto Serif TC', serif;
    /* [修正] 使用 clamp() */
    font-size: clamp(20px, 3vw, 32px);
    font-style: italic;
    color: var(--text-color);
    letter-spacing: 5px;
}

.animated-chars :deep(span) {
    display: inline-block;
    opacity: 0;
    animation: fadeInUp 0.8s ease-out forwards;
}
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>