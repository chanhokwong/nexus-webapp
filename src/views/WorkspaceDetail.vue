<template>
  <!-- [核心] 骨架屏加载状态 -->
  <div v-if="isLoading" class="workspace-skeleton">
    <div class="skeleton-header">
      <div class="skeleton-line title"></div>
      <div class="skeleton-line text"></div>
    </div>
    <div class="collaboration-canvas">
      <div class="canvas-panel skeleton-panel" v-for="i in 3" :key="i"></div>
    </div>
  </div>
  
  <!-- 数据加载完成后显示 -->
  <div v-else-if="workspace" class="workspace-detail-container">
    <header class="page-header">
      <h1 class="page-title">{{ workspace.name }}</h1>
      <p class="page-description">{{ workspace.description }}</p>
    </header>

    <div class="collaboration-canvas">
      <!-- 第一栏：文件库 -->
      <div class="canvas-panel">
        <div class="panel-header">
        <h2 class="panel-title">{{ $t('workspaceDetail.docStore') }}</h2>

        <!-- [核心] 将按钮改造为下拉菜单 -->
        <el-dropdown trigger="click" @command="handleFileCommand">
          <button class="add-btn" :title="addFile">
            <el-icon><Plus /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <!-- [核心] 添加图标 -->
              <el-dropdown-item command="upload">
                <el-icon><Upload /></el-icon>
                <span>{{ $t('workspaceDetail.uploadAndAddDoc') }}</span> <!-- 优化文本 -->
              </el-dropdown-item>
              <el-dropdown-item command="add_existing">
                <el-icon><FolderAdd /></el-icon>
                <span>{{ $t('workspaceDetail.uploadAtExitDoc') }}</span> <!-- 优化文本 -->
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
        <ul class="file-library-list">
          <!-- [核心] 为每个文件项添加一个“移除”按钮 -->
          <li 
            v-for="doc in workspace.documents" 
            :key="doc.id"
            class="file-item" 
            @click="previewFile(doc)"
          >
            <div class="file-info">
              <div class="file-name">{{ doc.filename }}</div>
              <!-- <div class="file-meta">{{ formatDocMeta(doc) }}</div> -->
            </div>
            <button class="remove-btn" @click.stop="handleRemoveDocument(doc)" :title="removeDoc">
              <el-icon><Close /></el-icon>
            </button>
          </li>
        </ul>
      </div>

      <!-- 第二栏：内容预览 -->
      <div class="canvas-panel content-preview" :class="{ 'fullscreen': isFullscreen }">
        <div class="panel-header">
          <h2 class="panel-title">{{ $t('workspaceDetail.contentPreview') }}</h2>
          <button 
            v-if="aiResultType === 'graph' || isFullscreen" 
            class="fullscreen-btn" 
            @click="toggleFullscreen"
            :title="isFullscreen ? exitFullScreen : watchFullScreen"
          >
            <el-icon v-if="!isFullscreen"><FullScreen /></el-icon>
            <el-icon v-else><Close /></el-icon>
          </button>
        </div>

        <!-- [核心] .preview-content 是所有内容的容器 -->
        <div class="preview-content">
          <!-- [核心] 自定义加载状态层 -->
          <div v-if="isUploading || isPreviewLoading || isAiLoading" class="loading-overlay">
            <div class="spinner"></div>
            <h3 class="loading-text">{{ loadingText }}</h3>
            <p class="loading-subtext">{{ $t('workspaceDetail.processDataMsg') }}</p>
          </div>

          <!-- 只有在非加载状态下才渲染其他内容 -->
          <div v-else-if="aiResultType === 'quiz' && aiResult" class="view-wrapper">
            <QuizPlayer :quiz-data="aiResult" :workspace-id="workspace.id" />
          </div>
          
          <div v-else-if="aiResultType === 'notes' && previewContent" class="view-wrapper scrollable">
            <MarkdownRenderer :markdown="previewContent" />
          </div>

          <div v-else-if="aiResultType === 'graph' && aiResult" class="view-wrapper graph-wrapper">
            <KnowledgeGraphRenderer :graph-string="aiResult.mermaid_code" />
          </div>

          <div v-else-if="aiResultType === 'chat'" class="view-wrapper">
            <AiTutorChat :workspace-id="workspace.id" />
          </div>

          <div v-else-if="aiResultType === 'clue_sheet' && aiResult?.cards" class="view-wrapper">
            <FlashcardViewer :cards="aiResult.cards" />
          </div>

          <div v-else-if="aiResultType === 'short_quiz' && aiResult" class="view-wrapper scrollable">
            <ShortAnswerPlayer :workspace-id="workspace.id" :initial-question="aiResult.question" :initial-session-id="aiResult.session_id" />
          </div>

          <div v-else-if="aiResultType === 'long_quiz'" class="view-wrapper scrollable">
            <LongAnswerPlayer v-if="workspace" :workspace-id="workspace.id" />
          </div>

          <div v-else-if="aiResultType === 'exam' && aiResult" class="view-wrapper scrollable">
            <ExamPlayer :exam-data="aiResult" />
          </div>

          <div v-else-if="previewContent" class="view-wrapper scrollable">
            <div class="content-text">{{ previewContent }}</div>
          </div>

          <div v-else class="view-wrapper">
            <div class="empty-state">
              <p>{{ $t('workspaceDetail.commandDescribe1') }}<br>{{ $t('workspaceDetail.commandDescribe2') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三栏：智能工具箱 -->
      <div class="canvas-panel ai-toolbox">
        <div class="panel-header">
          <h2 class="panel-title">{{ $t('workspaceDetail.smartControl') }}</h2>
          <!-- [新增] 加载指示器 -->
          <el-icon v-if="isAiLoading" class="is-loading"><Loading /></el-icon>
        </div>
        <div class="ai-toolbox-list">
        <!-- 
          [核心] 
          1. 绑定 @click 事件，调用 runAiTool 函数并传入工具类型
          2. 绑定 :disabled 状态，防止在 AI 处理期间重复点击，或在未选择文件时点击
        -->
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('graph')">
            <div class="tool-title">{{ $t('workspaceDetail.generateKnowledgeGraph') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.generateKnowledgeGraphDescribe') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('notes')">
            <div class="tool-title">{{ $t('workspaceDetail.generateNotes') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.generateNotesDescribe') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('quiz')">
            <div class="tool-title">{{ $t('workspaceDetail.generateQuiz') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.generateQuizDescribe') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('clue_sheet')">
            <div class="tool-title">{{ $t('workspaceDetail.gen_clue_sheet_title') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.gen_clue_sheet_desc') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('chat')">
            <div class="tool-title">{{ $t('workspaceDetail.ai_tutor_title') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.ai_tutor_desc') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('tutorial')">
            <div class="tool-title">{{ $t('workspaceDetail.gen_tutorial_title') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.gen_tutorial_desc') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('short_quiz')">
            <div class="tool-title">{{ $t('workspaceDetail.gen_short_quiz_title') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.gen_short_quiz_desc') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('long_quiz')">
            <div class="tool-title">{{ $t('workspaceDetail.gen_long_quiz_title') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.gen_long_quiz_desc') }}</div>
          </button>
          <button class="ai-tool" :disabled="isAiLoading" @click="runAiTool('exam')">
            <div class="tool-icon"><i class="fas fa-file-alt"></i></div>
            <div class="tool-title">{{ $t('workspaceDetail.gen_exam_title') }}</div>
            <div class="tool-description">{{ $t('workspaceDetail.gen_exam_desc') }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- [核心] 添加文件的弹窗 (使用 ElDialog) -->
  <el-dialog
    v-model="isAddDocModalVisible"
    :title="addFileToWorkspace"
    width="600"
    center
    :modal-class="'nexus-dialog-modal'"
    class="nexus-dialog"
    id="nexus-dialog-add"
  >
    <div class="doc-selection-list">
      <div 
        v-for="doc in availableDocuments" 
        :key="doc.id" 
        class="doc-selection-item"
        :class="{ 'selected': selectedDocIds.includes(doc.id) }"
        @click="toggleDocSelection(doc.id)"
      >
        <span>{{ doc.filename }}</span>
        <!-- [新增] 复选框图标，提供更清晰的视觉反馈 -->
        <el-icon>
          <Select v-if="selectedDocIds.includes(doc.id)" />
          <CircleCheck v-else />
        </el-icon>
      </div>
      <div v-if="availableDocuments.length === 0" class="empty-docs-state">
        {{ $t('workspaceDetail.allFileExitWorspace') }}
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="isAddDocModalVisible = false">{{ $t('workspaceDetail.cancel') }}</button>
        <button class="btn btn-confirm" @click="confirmAddDocuments" :disabled="selectedDocIds.length === 0">
          {{ $t('workspaceDetail.confirmAdd') }} {{ selectedDocIds.length > 0 ? `(${selectedDocIds.length})` : '' }}
        </button>
      </div>
    </template>
  </el-dialog>

  <!-- [核心] 新增文件上传的弹窗 -->
  <el-dialog
    v-model="isUploadModalVisible"
    :title="addNewDoc"
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
      {{ $t('workspaceDetail.readyPreviewMsg') }}
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// [核心] 导入 ElDialog 和新的图标
import { ElDialog, ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Close, Select, CircleCheck, Loading, FullScreen, UploadFilled, Upload, FolderAdd } from '@element-plus/icons-vue';

// [核心] 导入新的 API 函数
import { getWorkspaceById, addDocumentsToWorkspace, removeDocumentFromWorkspace, type Workspace } from '../api/workspaces';
import { getAllUserDocuments, uploadDocument, type DocumentInfo } from '../api/documents';

// [核心] 导入所有 AI 相关的 API 函数
import { generateKnowledgeGraph, generateNotes, generateQuiz, generateClueSheet, type ClueSheetResponse, type QuizResponse, type KnowledgeGraphMermaidResponse, generateTutorialOutline, generateShortQuestion, generateExamPaper } from '../api/ai';

// [核心] 导入新的 API 函数和类型
import { saveKnowledgeGraph, type SaveGraphPayload, saveClueSheet, type SaveClueSheetPayload } from '../api/history';

// [核心] 导入 saveNote 和新的 SaveNotePayload 类型
import { saveNote, type SaveNotePayload } from '../api/notes';

// 导入子组件
import QuizPlayer from '../components/QuizPlayer.vue';
import MarkdownRenderer from '../components/MarkdownRenderer.vue'; 
import KnowledgeGraphRenderer from '../components/KnowledgeGraphRenderer.vue';
import AiTutorChat from '../components/AiTutorChat.vue';
import FlashcardViewer from '../components/FlashcardViewer.vue';
import ShortAnswerPlayer from '../components/ShortAnswerPlayer.vue';
import LongAnswerPlayer from '../components/LongAnswerPlayer.vue';
import ExamPlayer from '../components/ExamPlayer.vue';

import { useI18n } from 'vue-i18n';


// --- 基础状态 ---
const route = useRoute();
const router = useRouter();
const workspace = ref<Workspace | null>(null);
const isLoading = ref(true);
const isPreviewLoading = ref(false);

const selectedDocumentId = ref<number | null>(null);
const previewContent = ref<string | null>(null);

// --- [核心] 新增弹窗相关状态 ---
const isAddDocModalVisible = ref(false);
const availableDocuments = ref<DocumentInfo[]>([]); // 存储所有可用文档
const selectedDocIds = ref<number[]>([]); // 存储在弹窗中选择的文档ID

const isAiLoading = ref(false); // 控制AI工具的加载状态

// [核心] 新增 ref 来存储 AI 结果
const aiResultType = ref<'quiz' | 'notes' | 'graph' | 'chat' | 'clue_sheet' | 'short_quiz' | 'long_quiz' | 'exam' |null>(null);
const aiResult = ref<any | null>(null); // 用于存储原始的 AI 结果对象

// 添加全屏状态
const isFullscreen = ref(false);

const graphRendererRef = ref<InstanceType<typeof KnowledgeGraphRenderer> | null>(null);

const isUploadModalVisible = ref(false); // 控制上传弹窗的显示

// [核心] 新增一个专门用于上传加载状态的 ref
const isUploading = ref(false);
const aiToolName = ref('');

// [核心] 更新状态
const isPreviewModalVisible = ref(false);
const previewingFile = ref<DocumentInfo | null>(null);

// --- 國際化 ---
const { t } = useI18n();

const addFile = computed(() => t('workspaceDetail.addFile'));
const removeDoc = computed(() => t('workspaceDetail.removeDoc'));
const exitFullScreen = computed(() => t('workspaceDetail.exitFullScreen'));
const watchFullScreen = computed(() => t('workspaceDetail.watchFullScreen'));
const addFileToWorkspace = computed(() => t('workspaceDetail.addFileToWorkspace'));
const addNewDoc = computed(() => t('workspaceDetail.addNewDoc'));
const noPreviewLink = computed(() => t('workspaceDetail.noPreviewLink'));
const uploadFileMsg = computed(() => t('workspaceDetail.uploadFileMsg'));
const loadContentMsg = computed(() => t('workspaceDetail.loadContentMsg'));
const generatedMsg = computed(() => t('workspaceDetail.generatedMsg'));
const loading = computed(() => t('workspaceDetail.loading'));
const loadWorkspaceContentFail = computed(() => t('workspaceDetail.loadWorkspaceContentFail'));
const uploadSuccessButProcessFail = computed(() => t('workspaceDetail.uploadSuccessButProcessFail'));
const uploadSuccessMsg = computed(() => t('workspaceDetail.uploadSuccessMsg'));
const uploadFailMsg = computed(() => t('workspaceDetail.uploadFailMsg'));
const workspaceDataNotExist = computed(() => t('workspaceDetail.workspaceDataNotExist'));
const knwoledgeGraph = computed(() => t('workspaceDetail.knwoledgeGraph'));
const notes = computed(() => t('workspaceDetail.notes'));
const quiz = computed(() => t('workspaceDetail.quiz'));
const graphAutoSaveMsg = computed(() => t('workspaceDetail.graphAutoSaveMsg'));
const autoSaveFail = computed(() => t('workspaceDetail.autoSaveFail'));
const unknownError = computed(() => t('workspaceDetail.unknownError'));
const networkErrorMsg = computed(() => t('workspaceDetail.networkErrorMsg'));
const generateSuccess = computed(() => t('workspaceDetail.generateSuccess'));
const generateFail1 = computed(() => t('workspaceDetail.generateFail1'));
const generateFail2 = computed(() => t('workspaceDetail.generateFail2'));
const generateFailMsg = computed(() => t('workspaceDetail.generateFailMsg'));
const getDocListFail = computed(() => t('workspaceDetail.getDocListFail'));
const addDocSuccess = computed(() => t('workspaceDetail.addDocSuccess'));
const addDocFail = computed(() => t('workspaceDetail.addDocFail'));
const confirmRemoveMsg1 = computed(() => t('workspaceDetail.confirmRemoveMsg1'));
const confirmRemoveMsg2 = computed(() => t('workspaceDetail.confirmRemoveMsg2'));
const removeConfirm = computed(() => t('workspaceDetail.removeConfirm'));
const confirmRemove = computed(() => t('workspaceDetail.confirmRemove'));
const cancel = computed(() => t('workspaceDetail.cancel'));
const fileRemoveSuccess = computed(() => t('workspaceDetail.fileRemoveSuccess'));
const fileRemoveFail = computed(() => t('workspaceDetail.fileRemoveFail'));
const notesStoreTitle = computed(() => t('workspaceDetail.notesStoreTitle'));
const noteSavedMsg = computed(() => t('workspaceDetail.noteSavedMsg'));
const clue_sheet = computed(() => t('workspaceDetail.gen_clue_sheet_title'));
const tutorial = computed(() => t('workspaceDetail.gen_tutorial_title'));
const gen_short_quiz_title = computed(() => t('workspaceDetail.gen_short_quiz_title'));
const gen_long_quiz_title = computed(() => t('workspaceDetail.gen_long_quiz_title'));
const gen_exam_title = computed(() => t('workspaceDetail.gen_exam_title'));


// --- 数据获取与刷新 ---

// [核心] `previewFile` 函数 (与 Files.vue 完全一致)
const previewFile = (doc: DocumentInfo) => {
  // 因为现在 doc 对象是完整的，包含了 url，所以这个判断会成功
  if (doc.url) {
    previewingFile.value = doc;
    isPreviewModalVisible.value = true;
  } else {
    ElMessage.warning(noPreviewLink.value);
    console.warn("Preview failed: Document object is missing a 'url' property.", doc);
  }
};

// 统一的刷新函数
// [核心] 创建一个计算属性来动态生成加载文本
const loadingText = computed(() => {
  if (isUploading.value) {
    return uploadFileMsg.value;
  }
  if (isPreviewLoading.value) {
    return loadContentMsg.value;
  }
  if (isAiLoading.value) {
    return generatedMsg.value+`${aiToolName.value}...`;
  }
  return loading.value; // 默认文本
});

const fetchWorkspaceData = async () => {
  const workspaceId = route.params.id as string;
  isLoading.value = true;
  try {
    // 1. 并行发起两个 API 请求
    const [workspaceData, allDocsData] = await Promise.all([
      getWorkspaceById(workspaceId),
      getAllUserDocuments()
    ]);

    // 2. 创建一个以文档 ID 为键的完整文档信息查找表 (Map)
    const fullDocsMap = new Map<number, DocumentInfo>();
    allDocsData.forEach(doc => {
      fullDocsMap.set(doc.id, doc);
    });

    // 3. 遍历从工作台 API 返回的不完整文档列表
    if (workspaceData.documents) {
      workspaceData.documents = workspaceData.documents.map(shortDoc => {
        // 4. 从 Map 中找到对应的完整信息
        const fullDoc = fullDocsMap.get(shortDoc.id);
        // 5. 如果找到了，就用完整信息替换；如果没找到，保留原始信息
        return fullDoc || shortDoc;
      });
    }
    
    // 6. 将合并后的、包含完整文档信息的工作台数据赋值给 ref
    workspace.value = workspaceData;

  } catch (error) { 
    console.error(loadWorkspaceContentFail.value, error); 
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchWorkspaceData);

// --- 文件预览逻辑 ---
// [核心] 添加命令处理函数
const handleFileCommand = (command: 'upload' | 'add_existing') => {
  if (command === 'add_existing') {
    openAddDocModal();
  } else if (command === 'upload') {
    isUploadModalVisible.value = true; // 打开上传弹窗
  }
};

// [核心] 自定义上传处理函数
const handleUpload = async (options: any) => {
  const file = options.file;

  // 1. 开始上传，立即更新状态
  isUploading.value = true;
  isUploadModalVisible.value = false; // 立刻关闭上传弹窗

  try {
    const response = await uploadDocument(file);

    // [核心调试] 打印出上传成功后，后端到底返回了什么
    console.log("Document upload successful. API Response:", response);

    // [修正] 从 response.document_id 中获取 ID
    const newDocId = response.document_id;

    // 上传成功后，我们还需要将这个新文档添加到当前工作台中
    if (workspace.value && newDocId) {
      await addDocumentsToWorkspace(workspace.value.id, [newDocId]);
    } else {
      // 添加一个错误日志，以防万一
      console.error("Failed to add to workspace: workspace.value or newDocId is missing.");
      ElMessage.warning(uploadSuccessButProcessFail.value);
    }

    await fetchWorkspaceData(); // 刷新整个工作台数据
    ElMessage.success(`${file.name}`+uploadSuccessMsg.value);
  } catch (error) {
    ElMessage.error(`${file.name}`+uploadFailMsg.value);
    console.error(error);
  } finally {
    // 5. 无论成功还是失败，最后都关闭加载动画
    isUploading.value = false;
  }
};

// --- [核心最终修正] AI 工具调用主函数 ---
const runAiTool = async (toolType: 'graph' | 'notes' | 'quiz' | 'chat' | 'clue_sheet' | 'tutorial' | 'short_quiz' | 'long_quiz' | 'exam') => {
  if (!workspace.value) return;

  // 路标 1: 函数开始
  console.log(`--- [DEBUG] 1. 'runAiTool' started for type: "${toolType}" ---`);

  // 检查工作台是否存在
  if (!workspace.value) {
    console.error("[DEBUG] Error: Workspace data is missing. Function aborted.");
    ElMessage.error(workspaceDataNotExist.value);
    return;
  }
  // 路标 2: 工作台检查通过
  console.log(`[DEBUG] 2. Workspace check passed. Workspace ID: ${workspace.value.id}`);

  if (toolType === 'chat' || toolType === 'long_quiz') {
    aiResultType.value = toolType;
    aiResult.value = null;
    previewContent.value = null;
    selectedDocumentId.value = null;
    console.log(`[DEBUG] Switched to interactive tool view: ${toolType}`);
    return; // 直接退出，不执行下面的 API 调用逻辑
  }

  isAiLoading.value = true;
  isPreviewLoading.value = false;
  isUploading.value = false;
  
  let toolName = '';
  switch (toolType) {
    case 'graph': toolName = knwoledgeGraph.value; break;
    case 'notes': toolName = notes.value; break;
    case 'quiz': toolName = quiz.value; break;
    case 'clue_sheet': toolName = clue_sheet.value; break;
    case 'tutorial': toolName = tutorial.value; break;
    case 'short_quiz': toolName = gen_short_quiz_title.value; break;
    // @ts-ignore
    case 'long_quiz': toolName = gen_long_quiz_title.value; break;
    case 'exam': toolName = gen_exam_title.value; break;
    default: toolName = 'AI Tool'; break;
  }
  
  // @ts-ignore
  aiResultType.value = toolType; // 先设置类型，以便 UI 切换
  aiResult.value = null;
  previewContent.value = null;

  // 路标 3: UI 状态已更新
  console.log(`[DEBUG] 3. UI state updated to loading for "${toolName}".`);

  try {
    const workspaceId = workspace.value.id;
    let toolName = '...';

    switch (toolType) {
      case 'graph':
        toolName = knwoledgeGraph.value;;
        // [核心] 确保调用的是新的 API 函数
        const graphResponse: KnowledgeGraphMermaidResponse = await generateKnowledgeGraph(workspaceId);
        
        // 2. [核心新增] 自动调用保存 API
        if (graphResponse && graphResponse.mermaid_code) {
          // 准备要保存的数据
          const payload: SaveGraphPayload = {
            workspace_id: workspaceId,
            title: `${workspace.value.name} - `+knwoledgeGraph.value,
            content: {
              format: 'mermaid',
              code: graphResponse.mermaid_code,
            }
          };
          
          console.log("Attempting to auto-save knowledge graph with NEW payload:", payload);

          // 保存逻辑保持不变
          saveKnowledgeGraph(payload)
            .then(savedGraph => {
              console.log("Knowledge graph saved successfully with ID:", savedGraph.id);
              ElMessage.success({ message: graphAutoSaveMsg.value, duration: 2000 });
            })
            .catch(saveError => {
              // ... 更详细的错误处理 ...
              if (saveError.response && saveError.response.data) {
                console.error("Failed to auto-save graph. Validation error:", saveError.response.data);
                ElMessage.error(autoSaveFail.value+ (saveError.response.data.detail || unknownError.value));
              } else {
                console.error("Failed to auto-save graph with a network or unknown error:", saveError);
                ElMessage.error(networkErrorMsg.value);
              }
            });
        }
        
        // [核心] 将包含 mermaid_code 的整个对象存入 aiResult
        aiResult.value = graphResponse;
        previewContent.value = null; // 清空文本内容
        break;
      
      case 'notes':
        toolName = notes.value;
        const notesResponse = await generateNotes(workspaceId);

        // 2. [核心新增] 自动调用保存 API
        if (notesResponse && notesResponse.content) {
          // 准备要保存的数据
          const payload: SaveNotePayload = {
            workspace_id: workspaceId,
            // 我们可以用工作台的名称加上“笔记”作为默认标题
            title: `${workspace.value.name}`+notesStoreTitle.value,
            content: notesResponse.content,
          };

          console.log("Attempting to auto-save note with payload:", payload);
          
          try {
            // 在后台悄悄保存，不需要 await 阻塞 UI
            saveNote(payload).then(savedNote => {
              console.log("Note saved successfully with ID:", savedNote.id);
              ElMessage.success({ message: noteSavedMsg.value, duration: 2000 });
            });
          } catch (saveError) {
            console.error("Failed to auto-save note:", saveError);
            // 保存失败是一个非致命错误，只在控制台记录
          }
        }

        aiResult.value = notesResponse;
        previewContent.value = notesResponse.content;
        break;
      
      case 'quiz':
        toolName = quiz.value;
        const quizResponse: QuizResponse = await generateQuiz(workspaceId);
        aiResult.value = quizResponse; // [关键] 存储原始的 quiz 对象
        previewContent.value = null;
        break;

      case 'clue_sheet':
        const clueSheetResponse: ClueSheetResponse = await generateClueSheet(workspaceId);
        aiResultType.value = 'clue_sheet'; 

        // 2. [关键] 自动调用保存 API
        if (clueSheetResponse && clueSheetResponse.cards) {
          
          // 准备要保存的数据
          const payload: SaveClueSheetPayload = {
            title: clueSheetResponse.title || `${workspace.value.name} - 記憶卡片`,
            cards: clueSheetResponse.cards,
            workspace_id: workspaceId,
          };

          try {
            // 在后台悄悄保存，不阻塞 UI
            saveClueSheet(payload).then(savedClueSheet => {
              console.log("Clue sheet saved successfully with ID:", savedClueSheet.id);
              ElMessage.success({ message: '記憶卡片已自動保存', duration: 2000 });
            });
          } catch (saveError) {
            console.error("Failed to auto-save clue sheet:", saveError);
          }
        }

        aiResult.value = clueSheetResponse; // clueSheetResponse 现在是正确的对象 { title, cards }
        break;

      case 'tutorial':
        toolName = tutorial.value;
        // 1. 调用 API 生成大纲
        const outlineResponse = await generateTutorialOutline(workspaceId);
        
        // 2. [关键] 获取到大纲后，跳转到新页面并携带数据
        router.push({
          name: 'TutorialView', // 我们将要创建的路由名称
          params: { workspaceId: workspaceId },
          // 将大纲数据暂存在路由 state 中，避免 URL 过长
          // @ts-ignore
          state: { outline: outlineResponse } 
        });
        // 注意：成功提示将由 TutorialView 页面自己处理，这里不需要
        return; // 提前退出，不执行下面的通用成功提示

      case 'short_quiz':
        toolName = gen_short_quiz_title.value;
        // 1. 调用 API 获取第一道题
        const response = await generateShortQuestion(workspaceId);
        // 2. 将返回的数据存入 aiResult
        aiResult.value = response;
        // 3. aiResultType 已经被设置为 'short_quiz'，Vue 会自动渲染新组件
        break;

      // @ts-ignore
      case 'long_quiz':
        // [核心] 长答题是交互式工具，我们只切换视图，不在此处调用 API
        // 逻辑与 'chat' 完全一致
        toolName = gen_long_quiz_title.value;
        // aiResultType 已经在函数开头被设置，这里无需重复
        console.log(`[DEBUG] Switched to Long Answer Quiz view.`);
        // [关键] 移除所有 API 调用和 router.push，然后直接返回
        return;

      case 'exam':
        toolName = gen_exam_title.value; // 確保 i18n key 正確
        const examResponse = await generateExamPaper(workspaceId);
        aiResult.value = examResponse; // 將包含試卷數據的完整對象存入 aiResult
        // aiResultType 已在 switch 之前設置，Vue 會自動渲染新元件
        break;
    }
    
    selectedDocumentId.value = null;
    ElMessage.success(`${toolName}`+generateSuccess.value);
    // 路标 6: 成功处理
    console.log("[DEBUG] 6. UI updated with successful result.");

  } catch (error: any) {
    // 路标 7: 发生错误
    console.error(`[DEBUG] 7. An error occurred in 'runAiTool' for "${toolType}"!`, error);
    const errorMessage = error.response?.data?.detail || generateFail1.value+`${toolName}`+generateFail2.value;
    ElMessage.error(errorMessage);
    previewContent.value = generateFailMsg.value+`${errorMessage}`;
    aiResultType.value = null; // 失败时重置类型
    aiResult.value = null;
  } finally {
    isAiLoading.value = false;
    isPreviewLoading.value = false;
    // 路标 8: 函数结束
    console.log(`--- [DEBUG] 8. 'runAiTool' finished for type: "${toolType}" ---`);
  }
};

// [核心] 更新 toggleFullscreen
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  // 切换后，让子组件自己居中
  setTimeout(() => {
    graphRendererRef.value?.centerView();
  }, 300);
};

// --- [核心] 添加/移除文件逻辑 ---

// 打开“添加文件”弹窗
const openAddDocModal = async () => {
  try {
    const allDocs = await getAllUserDocuments();
    const currentDocIds = workspace.value?.documents.map(d => d.id) || [];
    // 过滤掉当前工作台已有的文档
    availableDocuments.value = allDocs.filter(d => !currentDocIds.includes(d.id));
    selectedDocIds.value = [];
    isAddDocModalVisible.value = true;
  } catch (error) {
    ElMessage.error(getDocListFail.value);
    console.error(error);
  }
};

// 在弹窗中切换文档选择
const toggleDocSelection = (docId: number) => {
  const index = selectedDocIds.value.indexOf(docId);
  if (index > -1) {
    selectedDocIds.value.splice(index, 1);
  } else {
    selectedDocIds.value.push(docId);
  }
};


// 确认添加选中的文件
const confirmAddDocuments = async () => {
  if (selectedDocIds.value.length === 0 || !workspace.value) return;
  try {
    await addDocumentsToWorkspace(workspace.value.id, selectedDocIds.value);
    await fetchWorkspaceData(); // 成功后刷新工作台数据
    isAddDocModalVisible.value = false;
    ElMessage.success(addDocSuccess.value);
  } catch (error) {
    ElMessage.error(addDocFail.value);
    console.error(error);
  }
};

// 处理移除单个文件的操作
const handleRemoveDocument = (doc: DocumentInfo) => {
  if (!workspace.value) return;
  ElMessageBox.confirm(confirmRemoveMsg1.value+`"${doc.filename}"`+confirmRemoveMsg2.value, removeConfirm.value, {
    customClass: 'nexus-messagebox',
    confirmButtonText: confirmRemove.value,
    cancelButtonText: cancel.value,
    type: 'warning',
  })
  .then(async () => {
    try {
      await removeDocumentFromWorkspace(workspace.value!.id, doc.id);
      await fetchWorkspaceData(); // 成功后刷新
      // 如果移除的是当前正在预览的文件，则清空预览
      if (selectedDocumentId.value === doc.id) {
        selectedDocumentId.value = null;
        previewContent.value = null;
      }
      ElMessage.success(fileRemoveSuccess.value);
    } catch (error) {
      ElMessage.error(fileRemoveFail.value);
      console.error(error);
    }
  }).catch(() => {});
};

</script>

<style scoped>
/* --- 骨架屏样式 --- */
.workspace-skeleton .skeleton-header { margin-bottom: 20px; }
.workspace-skeleton .skeleton-line { background: linear-gradient(90deg, var(--panel-bg) 25%, rgba(45, 48, 102, 0.8) 50%, var(--panel-bg) 75%); background-size: 200% 100%; border-radius: 6px; animation: shimmer 1.5s infinite; }
.workspace-skeleton .skeleton-line.title { height: 36px; width: 40%; margin-bottom: 15px; }
.workspace-skeleton .skeleton-line.text { height: 16px; width: 60%; }
.workspace-skeleton .skeleton-panel { animation: shimmer 1.5s infinite; background: var(--panel-bg); }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* --- 主布局 --- */
.workspace-detail-container { height: 100%; display: flex; flex-direction: column; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 36px; font-weight: 700; }
.page-description { font-size: 16px; color: var(--text-secondary); margin-top: 8px; font-style: italic; margin-bottom: 20px; }

.collaboration-canvas {
    flex-grow: 1; display: grid;
    grid-template-columns: 300px 1fr 300px;
    gap: 24px; min-height: 0;
}
.canvas-panel {
    background-color: var(--panel-bg); backdrop-filter: blur(10px);
    border: 1px solid var(--border-color); border-radius: 12px;
    padding: 24px; display: flex; flex-direction: column;
    overflow: hidden;
}

/* --- 面板头部 --- */
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-shrink: 0;
}
.panel-title { font-size: 18px; font-weight: 500; color: var(--text-secondary); margin: 0; }
.add-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; justify-content: center; align-items: center;
  transition: all 0.2s;
}
.add-btn:hover {
  background-color: var(--active-bg);
  color: var(--text-primary);
}
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.panel-header .el-icon.is-loading { font-size: 20px; color: var(--text-secondary); animation: rotate 2s linear infinite; }

/* --- 文件库 --- */
.file-library-list { flex-grow: 1; overflow-y: auto; list-style: none; display: flex; flex-direction: column; gap: 12px; padding: 0; }
.file-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.3s; }
.file-info { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-item:hover { background-color: rgba(255, 255, 255, 0.05); }
.file-item.active { border-color: var(--active-glow); background-color: var(--active-bg); box-shadow: 0 0 10px rgba(88, 94, 227, 0.3); }
.file-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-meta { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.remove-btn { width: 24px; height: 24px; border-radius: 50%; background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; justify-content: center; align-items: center; flex-shrink: 0; opacity: 0; transition: all 0.2s; }
.file-item:hover .remove-btn { opacity: 1; }
.remove-btn:hover { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }

/* --- 内容预览区 --- */
.content-preview {
  /* [優化] 為內容預覽面板增加最小高度，避免在空狀態下過於扁平 */
  min-height: 400px;
}
.content-preview .preview-content {
  flex-grow: 1;
  position: relative; /* 为 panzoom 提供上下文 */
  overflow: hidden; /* 父容器必须隐藏溢出 */
}

.content-preview .preview-content:has(> .v-mermaid-string):active {
  cursor: grabbing;
}

.empty-state, .loading-state { width: 100%; text-align: center; color: var(--text-secondary); }
.content-text { width: 100%; white-space: pre-wrap; }

/* --- 智能工具箱 --- */
.ai-toolbox { overflow-y: auto; }
.ai-toolbox-list { display: flex; flex-direction: column; gap: 16px; position: fixed; top: 70px; }
.ai-tool { padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); background-color: transparent; color: var(--text-primary); text-align: left; cursor: pointer; transition: all 0.3s; font-family: inherit; }
.ai-tool:hover:not(:disabled) { border-color: var(--active-glow); background-color: var(--active-bg); }
.tool-title { font-size: 16px; font-weight: 700; }
.tool-description { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.ai-tool:disabled { opacity: 0.4; cursor: not-allowed; }

/* --- 全屏模式 --- */
.content-preview.fullscreen {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  padding: 20px;
  border-radius: 0;
}
.fullscreen-btn {
  background: none; border: none; color: var(--text-secondary);
  cursor: pointer; font-size: 18px; padding: 5px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
  /* [核心] 确保按钮在自己的层级之上 */
  position: relative;
  z-index: 2;
}
.fullscreen-btn:hover {
  background: var(--active-bg);
  color: var(--text-primary);
}
/* [核心] 全屏时，将按钮定位到右上角，并确保它在最顶层 */
.content-preview.fullscreen .panel-header {
  position: absolute;
  top: 20px;
  right: 20px;
  width: auto;
  margin-bottom: 0;
  z-index: 102; /* 高于图谱的 z-index */
}
.content-preview.fullscreen .panel-title {
  display: none;
}
.content-preview.fullscreen .preview-content {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 101; /* 图谱的 z-index */
}

/* 下拉樣式 */
/* [新增] 所有视图的通用包装器 */
.view-wrapper {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

/* [新增] 需要滚动的视图包装器 */
.view-wrapper.scrollable {
  overflow-y: auto;
  padding-right: 10px; /* 为滚动条留出空间 */
}

/* [新增] 图谱的视图包装器 */
.view-wrapper.graph-wrapper {
  cursor: grab;
}
.view-wrapper.graph-wrapper:active {
  cursor: grabbing;
}

/* 确保 empty-state 和 loading-state 居中 */
.empty-state, .loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%; height: 100%;
  color: var(--text-secondary);
}

/* --- [核心] 自定义加载层样式 --- */
.loading-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  backdrop-filter: blur(5px);
  z-index: 10;
  padding: 20px;
  text-align: center;
}

/* 自定义 Spinner 动画 */
.spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(88, 94, 227, 0.3);
  border-top-color: var(--active-glow);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.loading-subtext {
  font-size: 14px;
  color: var(--text-secondary);
}

/* [核心] 为 iframe 添加样式 */
.view-wrapper {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
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

/* --- [優化] 響應式佈局 --- */

/* 平板尺寸 (1024px 以下): 縮小側邊欄，讓中間區域更大 */
@media (max-width: 1024px) {
  .collaboration-canvas {
    grid-template-columns: 240px 1fr 240px; /* 縮小左右兩欄 */
    gap: 16px; /* 減小間距 */
  }
  .canvas-panel {
    padding: 16px; /* 減小面板內邊距 */
  }
}

/* 手機尺寸 (768px 以下): 徹底變為單欄垂直堆疊 */
@media (max-width: 768px) {
  /* 1. 調整頁面頭部 */
  .page-header {
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 28px;
  }
  .page-description {
    font-size: 14px;
    margin-bottom: 20px;
  }

  /* 2. [核心] 將三欄網格變為單欄垂直佈局 */
  .collaboration-canvas {
    grid-template-columns: 1fr; /* 變為單欄 */
    min-height: auto; /* 移除最小高度，讓高度自適應 */
    flex-grow: 0; /* 讓容器高度由內容決定，不再填充剩餘空間 */
  }

  /* 3. [優化] 為每個面板設置最小高度，並確保滾動 */
  .canvas-panel {
    min-height: 300px; /* 給每個面板一個合理的最小高度 */
    padding-bottom: 70px;
  }
  
  /* 內容預覽區在手機上需要特別設定高度，避免過高或過低 */
  .content-preview {
    height: 60vh; /* 設置一個基於視口的高度，提供良好的預覽體驗 */
    min-height: 600px; /* 確保最低高度 */
  }

  .file-library-list, .ai-toolbox-list {
    /* 在手機上，讓這兩個列表能完整顯示內容，而不是內部滾動 */
    overflow-y: visible;
    flex-grow: 0;
  }
  #nexus-dialog-up {
    width: 300px;
  }
}

</style>

<style>
/* Mermaid 主题化样式 */
:root {
  --mermaid-theme: base;
  --mermaid-font-family: 'Noto Sans TC', sans-serif;
  --mermaid-background: transparent;
  --mermaid-node-background: var(--card-bg, #1D1F4A);
  --mermaid-node-text-color: var(--text-primary, #f0f2f5);
  --mermaid-node-border: var(--active-glow, #585EE3);
  --mermaid-line-color: var(--active-glow, #585EE3);
  --mermaid-arrowhead-color: var(--active-glow, #585EE3);
}
/* ... 弹窗、滚动条等其他全局样式 ... */

/* ... MessageBox 全局自定义样式 (如果存在) ... */

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

/* --- [核心] 弹窗内部样式 --- */
.doc-selection-list {
  max-height: 40vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.doc-selection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}
.doc-selection-item:hover {
  background-color: var(--active-bg);
}
.doc-selection-item.selected {
  border-color: var(--active-glow);
  background-color: var(--active-bg);
  color: var(--text-primary);
}
.empty-docs-state {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
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
</style>







