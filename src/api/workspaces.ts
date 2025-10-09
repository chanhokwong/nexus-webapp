import apiClient from './axios';
import type { DocumentInfo } from './documents';

// 根據您的 API 文檔定義類型 (可以在 src/types/api.ts 中)
export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  created_at: string; // 后端返回的是 datetime，前端接收为 string
  updated_at: string;
  owner_id: number;
  document_count: number;
  documents: DocumentInfo[];
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}

// [新增] 用於更新工作台的類型
export interface UpdateWorkspacePayload {
  name: string;
  description?: string;
}

// [新增] 用于 Dashboard 的轻量级工作台信息
export interface WorkspaceQuickInfo {
  id: number;
  name: string;
  updated_at: string;
}

// --- API 函数 ---
/**
 * [新增] 获取最近的工作台 (封装现有 API)
 * @param limit - 要获取的数量，默认为 5
 */
export const getRecentWorkspaces = async (limit: number = 5): Promise<WorkspaceQuickInfo[]> => {
  // 我们调用已有的 getWorkspaces()，它返回按更新时间排序的完整列表
  const allWorkspaces = await getWorkspaces();
  // 然后在前端截取前 limit 个
  return allWorkspaces.slice(0, limit);
};

/**
 * 3.1 & 3.2 - 獲取所有工作台列表
 */
export const getWorkspaces = (): Promise<Workspace[]> => {
  return apiClient.get('/workspaces/');
};

/**
 * 3.1 - 創建一個新的工作台
 * @param data - 包含名稱和描述的對象
 */
export const createWorkspace = (data: CreateWorkspacePayload): Promise<Workspace> => {
  return apiClient.post('/workspaces/', data);
};

/**
 * 3.3 - 獲取單個工作台的詳細信息
 * @param id - 工作台的 ID
 */
export const getWorkspaceById = (id: number | string): Promise<Workspace> => {
  return apiClient.get(`/workspaces/${id}`);
};

/**
 * [新增] 3.4 - 更新一個工作台
 * @param id - 工作台的 ID
 * @param data - 包含新名稱和/或描述的對象
 */
export const updateWorkspace = (id: number, data: UpdateWorkspacePayload): Promise<Workspace> => {
  return apiClient.put(`/workspaces/${id}`, data);
};

/**
 * [新增] 3.5 - 刪除一個工作台
 * @param id - 工作台的 ID
 */
export const deleteWorkspace = (id: number): Promise<void> => {
  // 刪除操作通常返回 204 No Content，所以 Promise 的類型是 void
  return apiClient.delete(`/workspaces/${id}`);
};

/**
 * [新增] 3.6 - 向工作台添加文档
 * @param workspaceId - 工作台 ID
 * @param documentIds - 要添加的文档 ID 数组
 */
export const addDocumentsToWorkspace = (workspaceId: number | string, documentIds: number[]): Promise<any> => {
  return apiClient.post(`/workspaces/${workspaceId}/documents/`, { document_ids: documentIds });
};

/**
 * [新增] 3.7 - 从工作台移除文档
 * @param workspaceId - 工作台 ID
 * @param documentId - 要移除的文档 ID
 */
export const removeDocumentFromWorkspace = (workspaceId: number | string, documentId: number): Promise<void> => {
  return apiClient.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
};
