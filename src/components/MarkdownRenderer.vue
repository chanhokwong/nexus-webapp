<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  markdown: string;
}>();

const renderedHtml = computed(() => {
  if (!props.markdown) return '';
  // 配置 marked，例如添加 GFM (GitHub Flavored Markdown) 支持
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  return marked.parse(props.markdown);
});
</script>

<style>
/* 
  我们使用非 scoped 样式，因为 v-html 渲染出的内容不受 scoped 限制。
  .markdown-body 类会确保样式只作用于此组件内部。
*/
.markdown-body {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-secondary);
}
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  color: var(--text-primary);
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}
.markdown-body h1 { font-size: 1.8em; }
.markdown-body h2 { font-size: 1.5em; }
.markdown-body h3 { font-size: 1.25em; }

.markdown-body p {
  margin-bottom: 1em;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 2em;
  margin-bottom: 1em;
}

.markdown-body li {
  margin-bottom: 0.5em;
}
.markdown-body li::marker {
  color: var(--active-glow);
}

.markdown-body blockquote {
  border-left: 4px solid var(--active-glow);
  padding-left: 1em;
  margin: 0 0 1em 0;
  color: var(--text-primary);
  background-color: rgba(88, 94, 227, 0.05);
  padding: 1em;
  border-radius: 8px;
}

.markdown-body code {
  background-color: rgba(0,0,0,0.3);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}

.markdown-body pre {
  background-color: rgba(0,0,0,0.3);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}
.markdown-body pre code {
  padding: 0;
  background: none;
}
.markdown-body a {
  color: var(--primary-glow);
  text-decoration: none;
}
.markdown-body a:hover {
  text-decoration: underline;
}
</style>