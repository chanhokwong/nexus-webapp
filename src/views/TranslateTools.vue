<template>
  <div class="bilingual-reader-container">
    <header class="page-header">
      <h1 class="page-title">{{ $t('tools.paperTransTitle') }}</h1>
      <p class="page-description">{{ $t('tools.paperTransDescribe') }}</p>
    </header>

    <!-- 翻譯控制面板 -->
    <div class="control-panel">
      <div class="file-info">
        <span v-if="selectedDocument">{{ selectedDocument.filename }}</span>
        <span v-else class="placeholder">{{ $t('tools.noFileSelected') }}</span>
      </div>
      <div class="actions">
        <!-- [新增] 語言選擇器 -->
        <el-select v-model="targetLang" placeholder="目標語言" style="width: 150px;" :disabled="isTranslating">
          <el-option :label="$t('tools.translateToChinese')" value="zh" />
          <el-option :label="$t('tools.translateToEnglish')" value="en" />
        </el-select>
        <el-button 
          type="primary" 
          @click="startTranslation" 
          :disabled="!selectedDocument || isTranslating"
          :loading="isTranslating"
        >
          {{ $t('tools.translate') }}
        </el-button>
      </div>
    </div>

    <!-- 主內容區：左右分欄 -->
    <div class="content-grid">
      <!-- 左欄：原文 -->
      <div class="panel original-panel">
        <div v-if="isLoading" class="state-overlay">
          <el-icon class="is-loading" size="2rem"><Loading /></el-icon>
          <span>{{ $t('tools.loadingFile') }}</span>
        </div>

        <!-- 初始狀態：選擇文件 -->
        <div v-else-if="!selectedDocument" class="initial-state">
          <el-button size="large" @click="isUploadModalVisible = true" :icon="Upload">
            {{ $t('tools.uploadNewFile') }}
          </el-button>
          <el-button size="large" @click="openSelectDocModal" :icon="Folder">
            {{ $t('tools.selectExistingFile') }}
          </el-button>
        </div>

        <!-- [核心修正] 顯示文件 iframe 預覽 -->
        <div v-else class="preview-wrapper">
          <iframe 
            v-if="selectedDocument.url"
            :src="selectedDocument.url"
            class="preview-iframe"
            frameborder="0"
          ></iframe>
          <div v-else class="state-overlay">
            <p>{{ $t('files.no_avaiable_preview_msg') }}</p>
          </div>
        </div>
      </div>

      <!-- 右欄：譯文 -->
      <div class="panel translation-panel" ref="translationPanelRef" @scroll="updateScrollButtons">
        <!-- [修正 1] 將加載狀態改為覆蓋層 -->
        <div v-if="isTranslating" class="state-overlay translation-loading">
          <el-icon class="is-loading" size="2rem"><Loading /></el-icon>
          <span>{{ $t('tools.translating') }}...</span>
        </div>

        <div v-if="!selectedDocument && !isTranslating" class="initial-state placeholder">
          <p>{{ $t('tools.translationPlaceholder') }}</p>
        </div>
        
        <!-- [核心修正] 使用分組結構渲染譯文 -->
        <div v-else class="text-content">
          <!-- 遍歷分組後的頁面 -->
          <div v-for="(page, pageNum) in groupedParagraphs" :key="`page-${pageNum}`" class="page-group">
            <h3 class="page-number-header">
              {{ $t('tools.page') }} {{ pageNum }}
            </h3>
            <!-- 在每頁內部遍歷段落 -->
            <p v-for="p in page" :key="p.id" :data-id="p.id">
              <span v-if="translatedParagraphs[p.id]" v-html="formatTranslation(translatedParagraphs[p.id])"></span>
              <span v-else-if="isTranslating" class="skeleton-line"></span>
            </p>
          </div>
        </div>

        <!-- [修正 3] 新增滾動按鈕 -->
        <div class="scroll-controls" v-show="canScroll">
          <button class="scroll-btn" @click="scrollUp" :disabled="!canScrollUp" :title="$t('common.scroll_up')">
            <el-icon><ArrowUp /></el-icon>
          </button>
          <button class="scroll-btn" @click="scrollDown" :disabled="!canScrollDown" :title="$t('common.scroll_down')">
            <el-icon><ArrowDown /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 彈窗：選擇現有文件 -->
    <el-dialog 
        v-model="isSelectDocModalVisible" 
        :title="$t('tools.selectExistingFile')" 
        width="600px"
        :modal-class="'nexus-dialog-modal'"
        class="nexus-dialog"
        id="nexus-dialog-add"
    >
      <div class="doc-list">
        <div 
          v-for="doc in allUserDocuments" 
          :key="doc.id" 
          class="doc-item"
          @click="handleDocumentSelect(doc)"
        >
          {{ doc.filename }}
        </div>
      </div>
    </el-dialog>


    <!-- 彈窗：上傳新文件 (復用 WorkspaceDetail 的邏輯) -->
    <el-dialog
    v-model="isUploadModalVisible"
    :title="$t('tools.uploadNewFile')"
    width="500"
    center
    :modal-class="'nexus-dialog-modal'"
    class="nexus-dialog"
    id="nexus-dialog"
  >
    <el-upload
      class="upload-dragger"
      drag
      action="#" 
      :http-request="handleUpload"
      :show-file-list="false"
      :limit="1"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        {{ $t('workspaceDetail.uploadMsg1') }}<em>{{ $t('workspaceDetail.uploadMsg2') }}</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          {{ $t('workspaceDetail.supportFileType') }}
        </div>
      </template>
    </el-upload>
  </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, onUpdated, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElDialog, ElButton, ElSelect, ElOption, ElIcon, ElUpload } from 'element-plus';
import { Loading, Upload, Folder, UploadFilled, ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { getAllUserDocuments, uploadDocument as apiUploadDocument, type DocumentInfo } from '../api/documents';
import { getDocumentAsParagraphs, translateText, type Paragraph } from '../api/translate';

const { t } = useI18n();



// --- 狀態管理 ---
const isLoading = ref(false);
const isTranslating = ref(false);
const allUserDocuments = ref<DocumentInfo[]>([]);
const selectedDocument = ref<DocumentInfo | null>(null);
const originalParagraphs = ref<Paragraph[]>([]);
const translatedParagraphs = reactive<Record<string, string>>({});
const targetLang = ref<'zh' | 'en'>('zh');

// --- 彈窗狀態 ---
const isSelectDocModalVisible = ref(false);
const isUploadModalVisible = ref(false);

// --- [新增] 滾動相關狀態 ---
const translationPanelRef = ref<HTMLElement | null>(null);
const canScroll = ref(false);
const canScrollUp = ref(false);
const canScrollDown = ref(false);
let resizeObserver: ResizeObserver | null = null;

// --- 方法 ---

// 打開選擇文件彈窗
const openSelectDocModal = async () => {
  try {
    allUserDocuments.value = await getAllUserDocuments();
    isSelectDocModalVisible.value = true;
  } catch (error) {
    ElMessage.error(t('errors.fetchDocListFailed'));
  }
};

// 處理文件上傳
const handleUpload = async (options: any) => {
  const file = options.file;
  isUploadModalVisible.value = false;
  isLoading.value = true;
  try {
    const response = await apiUploadDocument(file);
    // 上傳成功後，需要獲取完整的 DocumentInfo 對象
    const allDocs = await getAllUserDocuments();
    const newDoc = allDocs.find(d => d.id === response.document_id);
    if (newDoc) {
      await handleDocumentSelect(newDoc);
    }
    ElMessage.success(t('tools.uploadSuccess'));
  } catch (error) {
    ElMessage.error(t('tools.uploadFailed'));
  } finally {
    isLoading.value = false;
  }
};

// 處理文件選擇 (無論是上傳還是選擇)
const handleDocumentSelect = async (doc: DocumentInfo) => {
  isSelectDocModalVisible.value = false;
  isLoading.value = true;
  selectedDocument.value = doc;
  
  // 清空舊數據
  originalParagraphs.value = [];
  Object.keys(translatedParagraphs).forEach(key => delete translatedParagraphs[key]);
  
  try {
    const response = await getDocumentAsParagraphs(doc.id);
    originalParagraphs.value = response.paragraphs;
  } catch (error) {
    ElMessage.error(t('errors.parseFileFailed'));
    selectedDocument.value = null; // 失敗時重置
  } finally {
    isLoading.value = false;
  }
};

const startTranslation = async () => {
  if (!originalParagraphs.value.length) return;

  isTranslating.value = true;
  // 清空舊的翻譯結果，以便骨架屏能正確顯示
  Object.keys(translatedParagraphs).forEach(key => delete translatedParagraphs[key]);

  const translationPromises = originalParagraphs.value.map(p =>
    translateText({ text: p.original, target_lang: targetLang.value })
      .then(response => {
        translatedParagraphs[p.id] = response.translation;
      })
      .catch(err => {
        console.error(`Failed to translate paragraph ${p.id}:`, err);
        translatedParagraphs[p.id] = `[${t('tools.translationFailed')}]`;
      })
  );
  
  await Promise.allSettled(translationPromises);
  
  isTranslating.value = false;
  ElMessage.success(t('tools.translationCompleted'));
};

// [核心修正] 新增一個輔助函數，用於格式化翻譯文本
const formatTranslation = (text: string | undefined) => {
  if (!text) return '';
  // 使用正則表達式，全局查找 (g) ▪、✓ 或 ➢ 這些符號
  // 然後將它們替換為 "符號自身" + "<br>" 換行標籤
  // $& 代表正則表達式匹配到的那個符號本身
  return text.replace(/[▪✓➢•❖]/g, '<br>$&');
};

// [核心修正] 新增一個計算屬性，將段落按頁碼分組
const groupedParagraphs = computed(() => {
  if (!originalParagraphs.value.length) {
    return {};
  }
  // 使用 reduce 將扁平的段落數組轉換為按頁碼分組的對象
  return originalParagraphs.value.reduce((acc, p) => {
    const page = p.page_number;
    if (!acc[page]) {
      acc[page] = []; // 如果這個頁碼的數組還不存在，就創建它
    }
    acc[page].push(p); // 將當前段落推入對應頁碼的數組
    return acc;
  }, {} as Record<number, Paragraph[]>);
});

// --- [新增] 滾動邏輯 ---
function updateScrollButtons() {
  const el = translationPanelRef.value;
  if (!el) return;
  const hasScrollbar = el.scrollHeight > el.clientHeight;
  canScroll.value = hasScrollbar;
  if (hasScrollbar) {
    canScrollUp.value = el.scrollTop > 5;
    canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 5;
  } else {
    canScrollUp.value = false;
    canScrollDown.value = false;
  }
}

function scrollUp() {
  translationPanelRef.value?.scrollBy({ top: -300, behavior: 'smooth' });
}

function scrollDown() {
  translationPanelRef.value?.scrollBy({ top: 300, behavior: 'smooth' });
}

// --- [新增] 生命周期鉤子來管理滾動監聽 ---
onMounted(() => {
  const el = translationPanelRef.value;
  if (el) {
    resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);
    updateScrollButtons();
  }
});

onUnmounted(() => {
  if (resizeObserver && translationPanelRef.value) {
    resizeObserver.unobserve(translationPanelRef.value);
  }
});

onUpdated(() => {
  // 當翻譯內容更新後，DOM 需要時間渲染，然後我們再檢查滾動狀態
  updateScrollButtons();
});
</script>

<style scoped>

.bilingual-reader-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
}
.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 700; }
.page-description { font-size: 16px; color: var(--text-secondary); margin-top: 8px; }

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}
.file-info { font-size: 16px; font-weight: 500; }
.file-info .placeholder { color: var(--text-secondary); font-style: italic; }
.actions { display: flex; align-items: center; gap: 16px; }

.content-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  overflow: hidden; /* 關鍵：讓子元素可以獨立滾動 */
}

.panel {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0; 
  overflow-y: hidden; /* 關鍵：使面板內容可滾動 */
  position: relative; /* 用於覆蓋層定位 */
}

/* [核心修正] 為 iframe 預覽添加樣式 */
.preview-wrapper {
  width: 100%;
  height: 100%;
  background-color: var(--panel-bg);
}
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.translation-panel {
    position: fixed;
    padding: 24px; /* 右側面板仍然需要內邊距 */
    overflow-y: auto;
    left: calc(57% + 20px); /* 調整位置以適應 grid 間距 */
    width: 650px;
    height: 585px;
}

.text-content p {
  line-height: 1.8;
  margin-bottom: 1.5em;
  font-size: 16px;
}

.translation-panel .text-content {
  color: var(--text-primary);
}

/* [核心修正] 為頁碼標題和頁面分組添加樣式 */
.page-group {
  margin-bottom: 32px; /* 頁與頁之間的間距 */
  padding-bottom: 24px;
  border-bottom: 1px dashed var(--border-color); /* 頁分隔線 */
}
.page-group:last-of-type {
  border-bottom: none;
}

.page-number-header {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  display: inline-block; /* 讓下邊框只跟隨文字長度 */
}

.state-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  color: var(--text-secondary);
  background-color: var(--panel-bg);
  z-index: 5;
}
/* [新增] 為翻譯加載覆蓋層添加半透明效果 */
.state-overlay.translation-loading {
    background-color: rgba(29, 31, 74, 0.8); /* 使用帶透明度的面板背景色 */
    backdrop-filter: blur(5px);
}
.initial-state {
    /* initial-state 樣式與 state-overlay 幾乎相同 */
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; flex-direction: column; justify-content: center;
    align-items: center; gap: 20px; color: var(--text-secondary);
    
}
.initial-state.placeholder {
    color: var(--text-secondary);
    font-style: italic;
}

/* 翻譯佔位符骨架屏 */
.skeleton-line {
  display: inline-block;
  width: 90%;
  height: 1em;
  background: linear-gradient(90deg, var(--border-color) 25%, rgba(45, 48, 102, 0.8) 50%, var(--border-color) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* --- 上下滑动按钮 --- */
.scroll-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex; /* v-show 会控制显示/隐藏 */
    flex-direction: column;
    gap: 8px;
    z-index: 2;
}
.scroll-btn {
    width: 36px; height: 36px;
    background-color: var(--panel-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex; justify-content: center; align-items: center;
    transition: all 0.3s;
}
.scroll-btn:hover:not(:disabled) {
    border-color: var(--active-glow);
    color: var(--text-primary);
    transform: scale(1.1);
}
.scroll-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}


/* 彈窗樣式 */
.doc-list { max-height: 50vh; overflow-y: auto; }
.doc-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--text-primary);
}
.doc-item:hover { background-color: var(--active-bg); }
</style>

<style>

/* 弹窗主体样式 */
.nexus-dialog {
  background: var(--card-bg, #1D1F4A) !important;
  border: 1px solid var(--border-color, rgba(88, 94, 227, 0.3)) !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 20px var(--active-bg, rgba(88, 94, 227, 0.2)) !important;
}
.nexus-dialog .el-dialog__header {
  border-bottom: 1px solid var(--border-color, rgba(88, 94, 227, 0.3));
  margin-right: 0; /* 覆盖 Element Plus 默认 margin */
  padding: 16px 24px;
}
.nexus-dialog .el-dialog__title {
  color: var(--text-primary, #f0f2f5);
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 700;
}
.nexus-dialog .el-dialog__headerbtn .el-icon {
  color: var(--text-primary, #f0f2f5);
  font-size: 18px;
}
.nexus-dialog .el-dialog__body {
  padding: 0;
}

/* --- Iframe 样式 --- */
.preview-iframe { width: 100%; height: 100%; border-radius: 8px; }

/* [核心] 为上传组件添加主题化样式 (可以放在 MainLayout.vue 的全局样式中) */
.upload-dragger .el-upload {
  width: 100%;
}
.upload-dragger .el-upload-dragger {
  width: 100% !important;
  background: rgba(0,0,0,0.2) !important;
  border: 1px dashed var(--border-color) !important;
  transition: border-color 0.3s;
}
.upload-dragger .el-upload-dragger:hover {
  border-color: var(--active-glow) !important;
}
.upload-dragger .el-icon--upload {
  font-size: 50px;
  color: var(--text-secondary);
}
.upload-dragger .el-upload__text {
  color: var(--text-secondary);
}
.upload-dragger .el-upload__text em {
  color: var(--active-glow);
}
.upload-dragger .el-upload__tip {
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 10px;
}
</style>