<template>
  <div class="user-avatar" :style="{ backgroundColor: color }">
    <span class="initial">{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  email: string | null | undefined;
}>();

// 計算首字母
const initial = computed(() => {
  const emailVal = props.email;
  // 1. 确保 emailVal 是一个“真”值 (非 null, undefined, 空字符串)
  if (emailVal) {
    // 2. 使用 charAt(0) 来安全地获取第一个字符
    return emailVal.charAt(0).toUpperCase();
  }
  return '?';
});

// 根據首字母生成一個穩定的背景顏色
const color = computed(() => {
  const emailVal = props.email;
  if (emailVal) {
    const colors = [
      '#4a00e0', '#00d4ff', '#7c4dff', '#00779B',
      '#ff4081', '#ffc107', '#4caf50', '#f44336'
    ];
    // 3. 使用 charCodeAt(0) 来安全地获取字符编码
    const charCode = emailVal.charCodeAt(0);
    return colors[charCode % colors.length];
  }
  return '#8a91b4'; // 默认颜色
});
</script>

<style scoped>
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0; /* 防止在 flex 佈局中被壓縮 */
}
.initial {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Jura', sans-serif;
}
</style>