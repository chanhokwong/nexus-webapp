<template>
  <div class="bilingual-reader-container">
    <header class="page-header">
      <h1 class="page-title">{{ $t('tools.paperTransTitle') }}</h1>
      <p class="page-description">{{ $t('tools.paperTransDescribe') }}</p>
    </header>

    <!-- [改造] 统一的控制面板 -->
    <div class="control-panel">
      <!-- 桌面端文件信息 -->
      <div class="file-info desktop-view">
        <span v-if="selectedDocument">{{ selectedDocument.filename }}</span>
        <span v-else class="placeholder">{{ $t('tools.noFileSelected') }}</span>
      </div>
      
      <div class="actions">
        <!-- 语言选择器 -->
        <div class="lang-select-group">
          <el-select v-model="sourceLang" popper-class="nexus-select-popper">
            <el-option v-for="lang in allLanguages" :key="`src-${lang.value}`" :label="lang.label" :value="lang.value" />
          </el-select>
          <el-icon class="swap-icon"><Switch /></el-icon>
          <el-select v-model="targetLang" :disabled="isTranslating" popper-class="nexus-select-popper">
            <el-option v-for="lang in allLanguages" :key="`tgt-${lang.value}`" :label="lang.label" :value="lang.value" />
          </el-select>
        </div>
        
        <!-- 翻译按钮 -->
        <el-button 
          type="primary" 
          @click="startTranslation" 
          :disabled="!selectedDocument || isTranslating"
          :loading="isTranslating"
          class="translate-btn"
        >
          <span class="tran-txt">{{ $t('tools.translate') }}</span>
          <el-icon class="mobile-only"><DArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 移動端專用內容切換選項卡 -->
    <div class="content-tabs mobile-view">
      <button class="tab-btn" :class="{active: activeTab === 'original'}" @click="activeTab = 'original'">{{ $t('tools.original_text') }}</button>
      <button class="tab-btn" :class="{active: activeTab === 'translation'}" @click="activeTab = 'translation'">{{ $t('tools.translated_text') }}</button>
    </div>

    <!-- 主內容區 -->
    <div class="content-grid">
      <!-- 1. 原文面板 -->
      <div class="panel original-panel" v-show="activeTab === 'original' || !isMobile">
        <div v-if="isLoading" class="state-overlay">
          <el-icon class="is-loading" size="2rem"><Loading /></el-icon><span>{{ $t('tools.loadingFile') }}</span>
        </div>
        <div v-else-if="!selectedDocument" class="initial-state">
          <el-button size="large" @click="isUploadModalVisible = true" :icon="Upload">{{ $t('tools.uploadNewFile') }}</el-button>
          <el-button size="large" @click="openSelectDocModal" :icon="Folder">{{ $t('tools.selectExistingFile') }}</el-button>
        </div>
        <div v-else class="preview-wrapper">
          <iframe v-if="selectedDocument.url" :src="selectedDocument.url" class="preview-iframe" frameborder="0"></iframe>
          <div v-else class="state-overlay"><p>{{ $t('files.no_avaiable_preview_msg') }}</p></div>
        </div>
      </div>

      <!-- 2. 譯文面板 -->
      <div class="panel translation-panel" v-show="activeTab === 'translation' || !isMobile" ref="translationPanelRef">
        <div v-if="isTranslating" class="state-overlay translation-loading">
          <el-icon class="is-loading" size="2rem"><Loading /></el-icon><span>{{ $t('tools.translating') }}...</span>
        </div>
        <div v-if="!selectedDocument && !isTranslating" class="initial-state placeholder">
          <p>{{ $t('tools.translationPlaceholder') }}</p>
        </div>
        <div v-else class="text-content">
          <div v-for="(page, pageNum) in groupedParagraphs" :key="`page-${pageNum}`" class="page-group">
            <h3 class="page-number-header">{{ $t('tools.page') }} {{ pageNum }}</h3>
            <p v-for="p in page" :key="p.id" :data-id="p.id">
              <span v-if="translatedParagraphs[p.id]" v-html="formatTranslation(translatedParagraphs[p.id])"></span>
              <span v-else-if="isTranslating" class="skeleton-line"></span>
            </p>
          </div>
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElDialog, ElButton, ElSelect, ElOption, ElIcon, ElUpload } from 'element-plus';
import { Switch, Loading, Upload, Folder, UploadFilled  } from '@element-plus/icons-vue';
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

// --- 彈窗狀態 ---
const isSelectDocModalVisible = ref(false);
const isUploadModalVisible = ref(false);

// --- [新增] 滾動相關狀態 ---
const translationPanelRef = ref<HTMLElement | null>(null);

// --- 語言選項數據 ---
// 1. 定義一個包含所有可用語言的靜態列表
const allLanguages = computed(() => [
  { label: t('tools.lang_zh'), value: 'zh' },
  { label: t('tools.lang_en'), value: 'en' },
]);

// 2. 定義當前選擇的語言狀態
const sourceLang = ref('en'); // 默認源語言為中文
const targetLang = ref<'en' | 'zh'>('zh'); // 默認目標語言為英文

const activeTab = ref<'original' | 'translation'>('original');
const isMobile = ref(window.innerWidth <= 768);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

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



// --- [新增] 生命周期鉤子來管理滾動監聽 ---
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

</script>

<style scoped>
/* --- 基礎佈局 (移動端優先) --- */
.desktop-view, .desktop-only { display: none; }
.mobile-view, .mobile-only { display: block; }

.bilingual-reader-container { height: 100%; display: flex; flex-direction: column; padding: 16px; }
.page-header { margin-bottom: 16px; flex-shrink: 0; }
.page-title { font-size: 24px; font-weight: 600; }
.page-description { font-size: 14px; color: var(--text-secondary); margin-top: 8px; }

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

.lang-select-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 4px;
}
.lang-select-group :deep(.el-select) { width: 120px; }
.lang-select-group :deep(.el-input__wrapper) { background: none !important; box-shadow: none !important; }
.swap-icon { color: var(--text-secondary); }
.translate-btn { padding: 10px; min-height: 0; height: 40px; }
.tran-txt { padding-left: 12px;}
.copy-btn { background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; padding: 8px; border-radius: 8px; }

.content-tabs { display: flex; background-color: var(--card-bg); border-radius: 10px; padding: 4px; margin-bottom: 16px; flex-shrink: 0; }
.tab-btn { flex-grow: 1; padding: 10px; border: none; background: transparent; border-radius: 8px; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.tab-btn.active { background-color: var(--active-bg); color: var(--text-primary); }

.content-grid { flex-grow: 1; display: flex; min-height: 0; }
.panel {
  width: 100%;
  height: 110%;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.panel-content { flex-grow: 1; position: relative; overflow-y: auto; }
.initial-state { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px; height: 100%; padding: 20px; text-align: center; }
.preview-wrapper { width: 100%; height: 100%; }
.preview-iframe { width: 100%; height: 100%; border: none; }

.translation-panel {
    padding: 10px; /* 右側面板仍然需要內邊距 */
    overflow-y: auto;
}
.text-content { padding: 20px; }
.text-content p { line-height: 1.8; margin-bottom: 1.5em; font-size: 14px; color: var(--text-primary); }
.page-group { margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px dashed var(--border-color); }
.page-group:last-of-type { border-bottom: none; }
.page-number-header { font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); display: inline-block; }

.state-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; color: var(--text-secondary); background-color: var(--panel-bg); z-index: 5; }
.state-overlay.translation-loading { background-color: rgba(29, 31, 74, 0.8); backdrop-filter: blur(5px); }
.initial-state { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; height: 100%; }
.initial-state.placeholder { color: var(--text-secondary); font-style: italic; }
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

/* --- 桌面端樣式 --- */
@media (min-width: 769px) {
  .desktop-view, .desktop-only { display: block; }
  .mobile-view, .mobile-only { display: none; }

  .bilingual-reader-container { padding: 24px; }
  .page-title { font-size: 28px; }
  
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

  .lang-select-group {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 4px;
  }
  .lang-select-group :deep(.el-select) { width: 120px; }
  .lang-select-group :deep(.el-input__wrapper) { background: none !important; box-shadow: none !important; }
  .swap-icon { color: var(--text-secondary); }
  .lang-select-group { flex-grow: 0; }
  .lang-select-group :deep(.el-select) { width: 150px; }
  .translate-btn { min-width: 60px; }
  .tran-txt { padding-left: 0px;}
  
  .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .panel { height: auto; }
  .translation-panel {
    position: fixed;
    padding: 24px; /* 右側面板仍然需要內邊距 */
    overflow-y: auto;
    left: calc(57% + 20px); /* 調整位置以適應 grid 間距 */
    width: 650px;
    height: 585px;
  }
}
</style>

<style>
/* --- [核心最终修正] 全局自定义滚动条样式 --- */

/* 
  我们为所有可能出现滚动条的 `.main-content` 区域
  以及其内部的元素定义统一的滚动条样式
*/
.main-content ::-webkit-scrollbar {
  width: 8px;
  height: 8px; /* 同时美化水平滚动条 */
}

.main-content ::-webkit-scrollbar-track {
  /* 轨道背景：设置为透明 */
  background: transparent;
}

.main-content ::-webkit-scrollbar-thumb {
  /* 滑块本身 */
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
  
  /* 添加一个最小高度，防止滑块变得过小 */
  min-height: 30px;
}

.main-content ::-webkit-scrollbar-thumb:hover {
  /* 鼠标悬停在滑块上时 */
  background-color: rgba(255, 255, 255, 0.4);
}

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