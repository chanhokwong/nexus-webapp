import { useUserStore } from '../stores/user';
import { useLocaleStore } from '../stores/locale';
import apiClient, { longTimeoutApiClient } from './axios';
// import apiClient, { longTimeoutApiClient } from './axios';
import { saveClueSheet, type SaveClueSheetPayload } from './history';
import { ElMessage } from 'element-plus';

// --- [核心修正] 更新类型定义 ---
// 我们不再需要 Node 和 Edge，只需要 Mermaid 响应类型
export interface KnowledgeGraphMermaidResponse {
  mermaid_code: string;
}

export interface NotesResponse {
  content: string;
  workspace_id: number;
}

export interface QuizResponse {
  questions: {
    question: string;
    options: string[];
    answer: string;
  }[];
}

// [核心] 定义卡片和响应的类型
export interface Flashcard {
  title: string;
  content: string;
}
export interface ClueSheetResponse {
  title: string;
  cards: Flashcard[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface Source {
  document_id: number;
  filename: string;
  page_number?: number;
}
export interface QueryResponse {
  answer: string;
  sources: Source[];
  session_id: string;
}
export interface TutorialStep {
  step_number: number;
  title: string;
  content?: string | null; // content 是可选的，按需加载
}
export interface CurriculumOutlineResponse {
  tutorial_title: string;
  steps: TutorialStep[];
}
export interface GeneratedContentResponse {
  content: string;
  workspace_id: number;
}
// 用于 GET /tutorials/ 列表接口的响应
export interface TutorialInfo {
  id: number;
  title: string;
  created_at: string; // ISO DateTime string
  workspace_id: number;
}

// 用于 GET /tutorials/{id} 详情接口的响应
export interface TutorialDetail {
  id: number;
  title: string;
  workspace_id: number;
  owner_id: number;
  created_at: string;
  steps: TutorialStep[]; // TutorialStep 应该包含可选的 id, content, is_completed
}

// --- API 函数 ---

/**
 * [核心修正] 生成知识图谱 (Mermaid 格式)
 * 此函数现在调用新的、为 Web 优化的 API 端点
 */
export const generateKnowledgeGraph = (workspaceId: number | string): Promise<KnowledgeGraphMermaidResponse> => {
  return longTimeoutApiClient.post(`/workspaces/${workspaceId}/generate-knowledge-graph-mermaid`);
};

/**
 * 生成笔记 (保持不变)
 */
export const generateNotes = (workspaceId: number | string): Promise<NotesResponse> => {
  return longTimeoutApiClient.post(`/workspaces/${workspaceId}/generate-notes`);
};

/**
 * 生成测验 (保持不变)
 */
export const generateQuiz = (workspaceId: number | string): Promise<QuizResponse> => {
  return longTimeoutApiClient.post(`/workspaces/${workspaceId}/generate-quiz`);
};

/**
 * [核心] 3.8 - 工作台内 AI 导师对话 (流式)
 * @param workspaceId - 工作台 ID
 * @param query - 用户的问题
 * @param history - 聊天历史
 * @param sessionId - [新增] 标识当前或历史会话的 ID
 * @param onDelta - 接收到一小块数据时的回调函数
 * @param onComplete - 整个流结束时的回调函数
 */
export const streamWorkspaceQuery = async (
  workspaceId: number | string,
  query: string,
  history: ChatMessage[],
  sessionId: string,
  onDelta: (chunk: string) => void,
  onComplete: () => void,
) => {
  const userStore = useUserStore();
  const localeStore = useLocaleStore();
  
  const response = await fetch(`https://api.nexus-ai-edu.app/workspaces/${workspaceId}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userStore.token}`,
      'Accept-Language': localeStore.currentLocale,
    },
    body: JSON.stringify({
      query: query,
      history: history,
      session_id: sessionId,
      stream: true, // [关键] 告诉后端我们需要流式响应
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get readable stream.");
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onComplete(); // 流结束
      break;
    }
    const chunk = decoder.decode(value);
    onDelta(chunk); // 处理每一小块数据
  }
};

/**
 * [核心最终修正] 3.9 - 生成记忆卡片 (Clue Sheet)
 */
export const generateClueSheet = async (workspaceId: number | string): Promise<ClueSheetResponse> => {
  const responseData = await longTimeoutApiClient.post<ClueSheetResponse>(`/workspaces/${workspaceId}/generate-clue-sheet`);
  // @ts-ignore
  if (responseData && responseData.cards && Array.isArray(responseData.cards)) {
    // 自动保存
    try {
      const payload: SaveClueSheetPayload = {
        // @ts-ignore
        title: responseData.title || `工作台 ${workspaceId} - 記憶卡片`,
        // @ts-ignore
        cards: responseData.cards,
        workspace_id: Number(workspaceId)
      };
      saveClueSheet(payload).then(saved => {
        console.log("Clue sheet auto-saved with ID:", saved.id);
        ElMessage.success({ message: '記憶卡片已自動保存', duration: 2000 });
      });
    } catch(e) { console.error("Auto-save clue sheet failed:", e); }
    // @ts-ignore
    return responseData;
  } else {
    throw new Error("Invalid Clue Sheet response format.");
  }
};

/**
 * [新增] (Planner LLM) 为工作台生成课程大纲
 */
export const generateTutorialOutline = (workspaceId: number | string): Promise<CurriculumOutlineResponse> => {
  // 生成大纲可能也需要较长时间
  return longTimeoutApiClient.post(`/tutorials/generate-outline/workspace/${workspaceId}`);
};

/**
 * [新增] (Tutor LLM) 为教程的某一步生成详细内容
 */
export const generateStepContent = (workspaceId: number | string, stepTitle: string): Promise<GeneratedContentResponse> => {
  const encodedTitle = encodeURIComponent(stepTitle);
  return longTimeoutApiClient.get(`/tutorials/generate-step-content/workspace/${workspaceId}/step/${encodedTitle}`);
};

/**
 * [新增] 将生成的教程保存到数据库
 */
export const saveTutorial = (workspaceId: number | string, title: string, steps: TutorialStep[]): Promise<any> => {
  const payload = {
    workspace_id: Number(workspaceId),
    title: title,
    steps: steps.map(step => ({
      step_number: step.step_number,
      title: step.title,
      content: step.content,
    })),
  };
  return apiClient.post('/tutorials/save', payload);
};

/**
 * 获取所有已保存的教程列表
 */
export async function getSavedTutorials(): Promise<TutorialInfo[]> {
  const response = await apiClient.get<TutorialInfo[]>('/tutorials/');
  return response.data;
}

/**
 * 获取单个已保存教程的完整详情 (最终、简化版)
 */
export const getTutorialDetails = (tutorialId: number): Promise<TutorialDetail> => {
  // **关键修复：保持与 generateKnowledgeGraph 等函数完全相同的实现风格**
  // 我们依赖 apiClient 的全局拦截器来处理 data 的解包和错误
  console.log(`--- [API] Fetching details for Tutorial ID: ${tutorialId} ---`);
  return apiClient.get(`/tutorials/${tutorialId}`);
};

/**
 * 按需获取或生成单个已保存步骤的内容，并将其持久化
 */
export async function getOrGenerateStepContent(stepId: number): Promise<TutorialStep> {
  return apiClient.put(`/tutorials/step/${stepId}/content`);
}