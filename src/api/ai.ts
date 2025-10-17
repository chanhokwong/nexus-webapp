import { useUserStore } from '../stores/user';
import { useLocaleStore } from '../stores/locale';
import { longTimeoutApiClient } from './axios';
// import apiClient, { longTimeoutApiClient } from './axios';
import { saveClueSheet, type SaveClueSheetPayload } from './history';

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
  
  if (responseData && responseData.cards && Array.isArray(responseData.cards)) {
    // 自动保存
    try {
      const payload: SaveClueSheetPayload = {
        title: responseData.title || `工作台 ${workspaceId} - 記憶卡片`,
        cards: responseData.cards,
        workspace_id: Number(workspaceId)
      };
      saveClueSheet(payload).then(saved => {
        console.log("Clue sheet auto-saved with ID:", saved.id);
        ElMessage.success({ message: '記憶卡片已自動保存', duration: 2000 });
      });
    } catch(e) { console.error("Auto-save clue sheet failed:", e); }

    return responseData;
  } else {
    throw new Error("Invalid Clue Sheet response format.");
  }
};