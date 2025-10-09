import { longTimeoutApiClient } from './axios';
// import apiClient, { longTimeoutApiClient } from './axios';

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