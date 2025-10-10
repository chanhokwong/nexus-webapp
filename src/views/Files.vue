<template>
  <div>
    <header class="page-header">
      <h1 class="page-title">{{ $t('files.title') }}</h1>
      <button class="btn-upload" @click="isUploadModalVisible = true">
        <el-icon><Upload /></el-icon>
        <span>{{ $t('files.upload_button') }}</span>
      </button>
    </header>

    <div class="function-bar">
      <div class="search-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input type="search" class="filter-input" :placeholder="searchPlaceholder" v-model="searchQuery">
      </div>
      <div class="sort-options">
        <el-select 
          v-model="sortBy" 
          class="filter-select" 
          placeholder="排序方式"
          popper-class="nexus-select-popper"
        >
          <el-option :label="sortByUpdate" value="date" />
          <el-option :label="sortByName" value="name" />
        </el-select>
      </div>
    </div>

    <div class="file-list-panel">
      <div class="table-header-wrapper">
        <table class="file-table">
          <thead>
            <tr>
              <th>{{ $t('files.doc_name') }}</th>
              <th>{{ $t('files.attr') }}</th>
              <th>{{ $t('files.size') }}</th>
              <th>{{ $t('files.ai_note') }}</th>
              <th>{{ $t('files.actions') }}</th>
            </tr>
          </thead>
        </table>
      </div>
      <!-- 2. 独立的、可滚动的内容区域 -->
      <div class="table-body-wrapper" ref="scrollContainerRef" @scroll="updateScrollButtons">
        <table class="file-table">
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="loading-state">{{ $t('files.load_data') }}</td>
            </tr>
            <tr v-else-if="filteredAndSortedFiles.length === 0">
               <td colspan="5" class="empty-state">{{ $t('files.no_files') }}</td>
            </tr>
            <tr v-for="file in filteredAndSortedFiles" :key="file.id" @click="previewFile(file)" style="cursor: pointer;">
              <td>
                <div class="file-info">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span>{{ file.filename }}</span>
                </div>
              </td>
              <!-- [核心] 添加默认值 -->
              <td><span class="pill" :class="file.file_type.toLowerCase()">{{ file.file_type }}</span></td>
              <td>{{ file.size_mb.toFixed(2) }}MB</td>
              <td><div class="summary-cell">{{ file.ai_summary || 'NULL' }}</div></td>
              <td>
                <div class="action-buttons">
                  <a :href="file.url" :download="file.filename" target="_blank" rel="noopener noreferrer" @click.stop>
                    <button :title="downloadText" class="action-btn">
                      <el-icon><Download /></el-icon>
                    </button>
                  </a>
                  <button :title="deleteText" class="action-btn" @click.stop="handleDelete(file)"><el-icon><Delete /></el-icon></button>
                  <button :title="moreText" class="action-btn"><el-icon><MoreFilled /></el-icon></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="scroll-controls" v-show="canScroll">
        <button class="scroll-btn" @click="scrollUp" :disabled="!canScrollUp" title="向上滾動">
          <el-icon><ArrowUp /></el-icon>
        </button>
        <button class="scroll-btn" @click="scrollDown" :disabled="!canScrollDown" title="向下滾動">
          <el-icon><ArrowDown /></el-icon>
        </button>
      </div>
    </div>
  </div>

  <!-- [核心] 新增文件上传的弹窗 -->
  <el-dialog
    v-model="isUploadModalVisible"
    :title="uploadNewFile"
    width="500"
    center
    :modal-class="'nexus-dialog-modal'"
    class="nexus-dialog"
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
        {{ $t('files.upload_msg1') }} <em>{{ $t('files.upload_msg2') }}</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          {{ $t('files.upload_msg3') }}
        </div>
      </template>
    </el-upload>
  </el-dialog>

  <!-- [核心] 新增文件预览弹窗 -->
  <el-dialog 
  v-model="isPreviewModalVisible" 
  :title="previewingFile?.filename" 
  width="80%" 
  top="5vh"
  destroy-on-close
  :modal-class="'nexus-dialog-modal'" 
  class="nexus-dialog preview-dialog"
>
  <!-- 
    只有在 previewingFile 和 url 都存在时才渲染 iframe，
    这可以防止在弹窗打开的瞬间加载一个空的 src。
  -->
  <iframe 
    v-if="previewingFile?.url"
    :src="previewingFile.url"
    class="preview-iframe"
    frameborder="0"
  ></iframe>
  <div v-else class="preview-loading">
    {{ $t('files.preview_load') }}
  </div>
</el-dialog>

</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox, ElDialog, ElUpload, ElSelect, ElOption } from 'element-plus';
import { Upload, Search, Document, Download, Delete, MoreFilled, UploadFilled, ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { getAllUserDocuments, deleteDocument, uploadDocument, type DocumentInfo } from '../api/documents';
import { useI18n } from 'vue-i18n';

// --- 語言 ---
const { t } = useI18n();

const sortByUpdate = computed(() => t('files.sort_by_update'));
const sortByName = computed(() => t('files.sort_by_name'));
const searchPlaceholder = computed(() => t('files.search_placeholder'));
const downloadText = computed(() => t('files.download'));
const deleteText = computed(() => t('files.delete'));
const moreText = computed(() => t('files.more'));
const uploadNewFile = computed(() => t('files.upload_new_file'));
const getDocListFail = computed(() => t('files.get_doc_list_fail'));
const getDocListFail2 = computed(() => t('files.get_doc_list_fail_2'));
const delConfirmMsg1 = computed(() => t('files.del_confirm_msg1'));
const delConfirmMsg2 = computed(() => t('files.del_confirm_msg2'));
const delConfirm = computed(() => t('files.del_confirm'));
const delConfirm2 = computed(() => t('files.del_confirm_2'));
const cancel = computed(() => t('files.cancel'));
const delSuccess = computed(() => t('files.del_success'));
const delFail = computed(() => t('files.del_fail'));
const dataUploadLoad = computed(() => t('files.data_upload_load'));
const uploadSuccessMsg = computed(() => t('files.upload_success_msg'));
const uploadFailMsg = computed(() => t('files.upload_fail_msg'));
const noAvaiablePreviewMsg = computed(() => t('files.no_avaiable_preview_msg'));

// --- 状态 ---
const allFiles = ref<DocumentInfo[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const sortBy = ref('date'); // 'date' or 'name'
const isUploadModalVisible = ref(false);

// --- [核心] 预览相关状态 ---
const isPreviewModalVisible = ref(false);
const previewingFile = ref<DocumentInfo | null>(null);

// --- 滚动相关状态 ---
const scrollContainerRef = ref<HTMLElement | null>(null);
const canScroll = ref(false);
const canScrollUp = ref(false);
const canScrollDown = ref(false);
let resizeObserver: ResizeObserver | null = null;

// --- 数据获取 ---
const fetchFiles = async () => {
  isLoading.value = true;
  try {
    allFiles.value = await getAllUserDocuments();
    await nextTick();
    updateScrollButtons();
  } catch (error) {
    ElMessage.error(getDocListFail.value);
    console.error(getDocListFail2.value, error);
  } finally {
    isLoading.value = false;
  }
};
// 组件挂载时自动执行数据获取
onMounted(() => {
  fetchFiles();
  if (scrollContainerRef.value) {
    resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(scrollContainerRef.value);
  }
});
onUnmounted(() => {
  if (resizeObserver && scrollContainerRef.value) {
    resizeObserver.unobserve(scrollContainerRef.value);
  }
});

// --- 滚动逻辑 ---
function updateScrollButtons() {
  const el = scrollContainerRef.value;
  if (!el) return;
  const hasScrollbar = el.scrollHeight > el.clientHeight;
  canScroll.value = hasScrollbar;
  if (hasScrollbar) {
    canScrollUp.value = el.scrollTop > 0;
    canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  } else {
    canScrollUp.value = false;
    canScrollDown.value = false;
  }
}
function scrollUp() {
  scrollContainerRef.value?.scrollBy({ top: -300, behavior: 'smooth' });
}
function scrollDown() {
  scrollContainerRef.value?.scrollBy({ top: 300, behavior: 'smooth' });
}

// --- 搜索与排序 ---
const filteredAndSortedFiles = computed(() => {
  let files = [...allFiles.value];

  // 1. 过滤逻辑
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    files = files.filter(file => 
      file.filename.toLowerCase().includes(query) || 
      (file.ai_summary && file.ai_summary.toLowerCase().includes(query))
    );
  }

  // 2. 排序逻辑
  if (sortBy.value === 'name') {
    files.sort((a, b) => a.filename.localeCompare(b.filename));
  } else { // 默认为 'date'
    files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return files;
});

// --- 操作 ---
const handleDelete = (file: DocumentInfo) => {
  ElMessageBox.confirm(delConfirmMsg1.value+`"${file.filename}"`+delConfirmMsg2.value, delConfirm.value, {
    customClass: 'nexus-messagebox',
    confirmButtonText: delConfirm2.value,
    cancelButtonText: cancel.value,
    type: 'warning',
  })
  .then(async () => {
    try {
      await deleteDocument(file.id);
      ElMessage.success(delSuccess.value);
      // [动态更新] 直接从本地数组中移除，而不是重新请求整个列表，体验更流畅
      const index = allFiles.value.findIndex(f => f.id === file.id);
      if (index > -1) {
        allFiles.value.splice(index, 1);
      }
    } catch (error) { 
      ElMessage.error(delFail.value); 
      console.error(error);
    }
  }).catch(() => {});
};

const handleUpload = async (options: any) => {
  let loadingInstance = null; // 用于存储消息实例
  try {
    // [核心修正1] 创建一个可手动关闭的加载提示
    loadingInstance = ElMessage.info({ 
      message: dataUploadLoad.value, 
      duration: 0, // 永不自动关闭
    });
    
    await uploadDocument(options.file);
    isUploadModalVisible.value = false;
    await fetchFiles();
    
    // [核心修正2] 上传成功后，手动关闭加载提示
    loadingInstance.close(); 
    
    ElMessage.success(uploadSuccessMsg.value);
  } catch (error) { 
    // [核心修正3] 如果加载提示存在，则在出错时也关闭它
    if (loadingInstance) {
      loadingInstance.close();
    }
    ElMessage.error(uploadFailMsg.value); 
    console.error(error);
  }
};

// --- [核心] 预览函数 ---
const previewFile = (file: DocumentInfo) => {
  // 检查文件是否有可用的 URL
  if (file.url) {
    previewingFile.value = file;
    isPreviewModalVisible.value = true;
  } else {
    // 如果没有 URL，给出一个友好的提示
    ElMessage.warning(noAvaiablePreviewMsg.value);
    console.warn("Preview failed: Document object is missing a 'url' property.", file);
  }
};
</script>

<style scoped>
/* --- [核心最终修正] 采用 Fixed 定位布局 --- */
:global(.main-content .page-header),
:global(.main-content .function-bar),
:global(.main-content .file-list-panel) {
  left: calc(var(--sidebar-width) + 40px);
  right: 40px;
  transition: left 0.3s ease-in-out;
}
:global(.sidebar.collapsed ~ .main-content .page-header),
:global(.sidebar.collapsed ~ .main-content .function-bar),
:global(.sidebar.collapsed ~ .main-content .file-list-panel) {
  left: calc(var(--sidebar-width-collapsed) + 40px);
}

/* --- 页面容器 --- */
.files-container {
  height: 100%;
}

/* --- 页面头部 --- */
.page-header {
  position: fixed;
  top: 40px;
  z-index: 3;
  display: flex; justify-content: space-between; align-items: center;
}
.page-title { 
    font-size: 32px; 
    font-weight: 700; 
}
.btn-upload {
    display: flex; 
    align-items: center; 
    gap: 8px;
    padding: 10px 16px; 
    border: none; 
    border-radius: 6px;
    font-weight: 500; 
    cursor: pointer; 
    transition: all 0.3s;
    background-color: var(--active-glow); 
    color: white;
}
.btn-upload:hover { 
    filter: brightness(1.2); 
    box-shadow: 0 0 15px var(--active-glow);
}

/* --- 功能栏 --- */
.function-bar {
  position: fixed;
  top: 100px;
  z-index: 3;
  display: flex; flex-wrap: wrap; gap: 16px; align-items: center;
}
.search-wrapper { 
    position: relative; 
    flex-grow: 1; 
    min-width: 300px; 
}
.search-wrapper .search-icon {
    position: absolute; 
    left: 12px; 
    top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px; 
    color: var(--text-secondary);
}
.filter-input, .filter-select {
    background-color: var(--panel-bg); 
    border: 1px solid var(--border-color);
    border-radius: 6px; 
    padding: 10px 12px;
    color: var(--text-primary); 
    font-family: inherit;
    font-size: 14px;
    width: 100%; 
    backdrop-filter: blur(5px);
    transition: border-color 0.3s;
}
.search-wrapper .filter-input { 
    padding-left: 36px; 
}
.filter-input:focus, .filter-select:focus { 
    outline: none; 
    border-color: var(--active-glow); 
}
.sort-options { 
    display: flex; 
    gap: 16px; 
    margin-left: auto; 
}

/* [核心] 美化 ElSelect 输入框 */
/* 使用 :deep() 穿透组件样式 */
.filter-select :deep(.el-input__wrapper) {
    background-color: var(--panel-bg) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 6px !important;
    box-shadow: none !important; /* 移除默认阴影 */
    backdrop-filter: blur(5px);
}
.filter-select :deep(.el-input__inner) {
    color: var(--text-primary) !important;
}
.filter-select :deep(.el-select__caret) {
    color: var(--text-secondary) !important;
}

/* --- 文件列表面板 --- */
.file-list-panel {
  position: fixed;
  top: 160px;
  bottom: 40px;
  z-index: 2;

  background-color: var(--panel-bg); backdrop-filter: blur(10px);
  border: 1px solid var(--border-color); border-radius: 12px;
  display: flex; flex-direction: column;
  overflow: hidden;
  padding: 0;
}
/* 1. 表头包装器 */
.table-header-wrapper {
  flex-shrink: 0; /* 高度固定，不收缩 */
  padding: 16px 16px 0 16px; /* 左右和顶部内边距 */
  position: relative;
  z-index: 2;
  /* 添加一个轻微的模糊背景，增强质感 */
  background-color: rgba(29, 31, 74, 0); 
  backdrop-filter: blur(5px);
}

/* 2. 内容包装器 (可滚动) */
.table-body-wrapper {
  flex-grow: 1; /* 占据所有剩余空间 */
  overflow-y: auto; /* [关键] 滚动发生在这里 */
  padding: 0 16px 16px 16px; /* 左右和底部内边距 */
  min-height: 0;
}
.file-table { 
    width: 100%; 
    border-collapse: collapse; 
}
/* 4. 精确控制列宽 (这是关键！) */
.file-table th:nth-child(1), .file-table td:nth-child(1) { width: 35%; } /* 文件名 */
.file-table th:nth-child(2), .file-table td:nth-child(2) { width: 10%; } /* 属性 */
.file-table th:nth-child(3), .file-table td:nth-child(3) { width: 10%; } /* 大小 */
.file-table th:nth-child(4), .file-table td:nth-child(4) { width: 35%; } /* AI 摘要 */
.file-table th:nth-child(5), .file-table td:nth-child(5) { width: 10%; } /* 操作 */

.file-table th, .file-table td { 
  padding: 16px; 
  text-align: left; 
  vertical-align: middle; 
  white-space: nowrap; 
  border-bottom: 1px solid var(--border-color); 
}


/* 表头独有样式 */
.table-header-wrapper .file-table th {
  border-bottom: 2px solid var(--border-color);
  font-size: 12px; 
  color: var(--text-secondary); 
  text-transform: uppercase; 
}
.table-header-wrapper .file-table td {
    display: none; /* 隐藏表头中的 tbody (如果有的话) */
}

/* 内容独有样式 */
.table-body-wrapper .file-table td {
  border-bottom: 1px solid var(--border-color);
}
.table-body-wrapper .file-table tbody tr:hover { 
  background-color: var(--active-bg); 
}
.table-body-wrapper .file-table tbody tr:last-child td { 
  border-bottom: none; 
}

.file-info { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    font-weight: 500; 
}
.file-icon { 
    width: 24px; 
    height: 24px; 
    color: var(--text-secondary); 
    flex-shrink: 0;
}

.pill { 
    padding: 4px 10px; 
    border-radius: 12px; 
    font-size: 12px; 
    font-weight: 500; 
    text-transform: uppercase;
}
.pill.pdf { 
    background-color: rgba(255, 82, 82, 0.2); 
    color: #ff8a80; 
}
.pill.txt { 
    background-color: rgba(64, 196, 255, 0.2); 
    color: #80d8ff; 
}
/* 可以为其他文件类型添加更多样式 */
.pill.docx {
    background-color: rgba(41, 98, 255, 0.2);
    color: #82b1ff;
}

.summary-cell {
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis;
    max-width: 350px; /* 限制摘要最大寬度 */
    color: var(--text-secondary); 
    font-size: 14px;
}

.action-buttons { 
    display: flex; 
    gap: 8px; 
    
    transition: opacity 0.3s;
    color: var(--text-primary); 
}
tr:hover .action-buttons {
    opacity: 1; /* 鼠标悬停在行上时显示 */
}

.action-btn { 
    background: none; 
    border: none; 
    color: var(--text-secondary); 
    cursor: pointer; 
    padding: 4px; 
    border-radius: 50%;
    display: flex;
}
.action-btn:hover { 
    color: var(--text-primary); 
    background-color: rgba(255, 255, 255, 0.1);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 16px;
}

/* --- 預覽樣式 ---  */
:global(.preview-dialog .el-dialog__body) {
  background-color: var(--panel-bg); /* 应用面板背景色 */
  color: var(--text-secondary);
}

.preview-dialog .preview-content {
  height: 75vh;
  overflow-y: auto;
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--text-secondary);
  background-color: var(--panel-bg); /* 再次确认背景色 */
  padding: 20px;
  border-radius: 8px;
}
.preview-dialog .preview-loading {
  height: 75vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
} 

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
</style>

<style>
/* --- [核心] ElSelect 下拉菜单全局自定义样式 --- */
.el-popper.nexus-select-popper {
  background: hsl(233, 62%, 18%) !important;
  border: 1px solid rgba(88, 94, 227, 0.5) !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}
.el-select-dropdown__item {
  color: var(--text-secondary) !important;
  font-family: 'Noto Sans TC', sans-serif !important;
}
.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background-color: var(--active-bg) !important;
  color: var(--text-primary) !important;
}
.el-select-dropdown__item.selected {
  color: var(--text-primary) !important;
  font-weight: 500;
}
.el-popper.nexus-select-popper .el-popper__arrow::before {
  background: hsl(233, 62%, 18%) !important;
  border-color: transparent !important;
}

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

/* --- [核心] 弹窗和滚动条的独立样式 --- */

/* 遮罩层毛玻璃效果 */
.nexus-dialog-modal {
  backdrop-filter: blur(5px);
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
.preview-dialog .el-dialog__body {
  height: calc(85vh - 55px);
  padding: 0;
}
.preview-dialog .preview-iframe {
  width: 100%;
  height: 100%;
}
.preview-dialog .preview-loading {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary, #a0a6c0);
}

/* 预览弹窗的特定内容样式 */
.preview-dialog .preview-content,
.preview-dialog .preview-loading {
  height: 75vh;
  padding: 24px; /* 在内容区域内部添加内边距 */
  overflow-y: auto;
}
.preview-dialog .preview-content {
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--text-secondary, #a0a6c0);
}
.preview-dialog .preview-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary, #a0a6c0);
}

</style>