import { createI18n } from 'vue-i18n';
import type { Pinia } from 'pinia'; // 导入 Pinia 类型
import { useLocaleStore } from './stores/locale';

// 语言文件
import zh from './locales/zh.json';
import en from './locales/en.json';

// [核心] 将创建过程封装在一个函数中
export function setupI18n(pinia: Pinia) {
  // 在这里，我们可以安全地使用 store，因为 pinia 实例已经被传入
  const localeStore = useLocaleStore(pinia);

  const i18n = createI18n({
    legacy: false,
    locale: localeStore.currentLocale,
    fallbackLocale: 'zh',
    messages: {
      zh,
      en,
    },
  });

  return i18n;
}