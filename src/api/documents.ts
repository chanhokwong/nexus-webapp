import apiClient, { uploadApiClient } from './axios';

// --- 类型定义 ---

// 用于表示文档列表中的基本信息
export interface DocumentInfo {
  id: number;
  filename: string;
  url: string; // 根据 API v2.1 文档 (2.2)，这个字段是存在的
  // 假设后端也会提供这些，用于详情页显示
  file_type: 'PDF' | 'TXT' | string;
  size_mb: number;
  updated_at?: string;
  created_at: string; // 用于排序
  ai_summary?: string | null;
}

export interface DocumentContent {
  id: number;
  filename: string;
  content: string;
}

// --- API 函数 ---

/**
 * [新增] 2.1 - 上传并处理文档
 * @param file - 要上传的文件对象
 */
export const uploadDocument = (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  // [核心] 使用专门的上传客户端
  return uploadApiClient.post('/documents/upload-and-process', formData);
  // 不再需要在这里手动设置 headers，因为实例已经配置好了
};

/**
 * [新增] 2.2 - 获取用户所有文档列表
 * 用于“添加文件到工作台”弹窗中，展示所有可选项
 */
export const getAllUserDocuments = (): Promise<DocumentInfo[]> => {
  // 假设 DocumentInfo 类型与 Workspace 内的文档类型一致
  return apiClient.get('/documents/');
};

/**
 * 2.4 - 获取单个文档的完整文本内容
 * 用于在工作台详情页中点击文件时，加载其内容进行预览
 */
export const getDocumentContent = (id: number): Promise<DocumentContent> => {
  return apiClient.get(`/documents/${id}/content`);
};

/** [新增] 2.5 - 永久删除单个文档 */
export const deleteDocument = (id: number): Promise<void> => {
  return apiClient.delete(`/documents/${id}`);
};

