import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// 定义支持的语言类型
export type SupportedLocale = 'zh' | 'en';

export const useLocaleStore = defineStore('locale', () => {
  // 1. 创建一个响应式变量，并尝试从 localStorage 初始化
  const currentLocale = ref<SupportedLocale>(
    (localStorage.getItem('nexus-user-locale') as SupportedLocale) || 'zh' // 默认语言为繁体中文
  );

  // 2. 创建一个设置语言的方法
  function setLocale(newLocale: SupportedLocale) {
    if (['zh', 'en'].includes(newLocale)) {
      currentLocale.value = newLocale;
    }
  }

  // 3. 创建一个监听器，当语言变化时，自动将其保存到 localStorage
  watch(currentLocale, (newLocale) => {
    localStorage.setItem('nexus-user-locale', newLocale);
    console.log(`語言偏好已保存: ${newLocale}`);
  });

  return {
    currentLocale,
    setLocale,
  };
});