<template>
  <div class="user-avatar" :style="{ backgroundColor: color }">
    <span class="initial">{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  email?: string | null;
}>();

// 計算首字母
const initial = computed(() => {
  if (props.email && props.email.length > 0) {
    return props.email[0].toUpperCase();
  }
  return '?'; // 如果沒有郵箱，顯示問號
});

// 根據首字母生成一個穩定的背景顏色
const color = computed(() => {
  if (!props.email) return '#8a91b4';
  
  const colors = [
    '#4a00e0', '#00d4ff', '#7c4dff', '#00779B',
    '#ff4081', '#ffc107', '#4caf50', '#f44336'
  ];
  const charCode = props.email.charCodeAt(0);
  return colors[charCode % colors.length];
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