import apiClient from './axios';

// --- 类型定义 ---
export interface NoteInfo {
  id: number;
  title: string;
  // 假设列表接口也会返回一个内容摘要和更新时间
  summary: string; 
  updated_at: string;
}

export interface NoteDetail extends NoteInfo {
  content: string; // 详情接口会返回完整内容
}

// [核心] 定义保存笔记时需要发送的数据
// 假设 API 需要 title 和 content
export interface SaveNotePayload {
  workspace_id: number;
  title: string;
  content: string;
}

/**
 * [新增] 4.3 - 获取所有已保存笔记的列表
 */
export const getAllNotes = (): Promise<NoteInfo[]> => {
  return apiClient.get('/notes/');
};

/**
 * [新增] 4.3 - 获取单个笔记的完整内容
 */
export const getNoteById = (id: number): Promise<NoteDetail> => {
  return apiClient.get(`/notes/${id}`);
};

/**
 * [新增] 4.3 - 保存一份学习笔记
 * 返回值是保存后的笔记对象，包含了由后端生成的 id 等信息
 */
export const saveNote = (data: SaveNotePayload): Promise<NoteDetail> => {
  return apiClient.post('/notes/save', data);
};

/**
 * [新增] 4.3 - 更新笔记
 */
export const updateNote = (id: number, data: { title?: string; content?: string }): Promise<NoteDetail> => {
  return apiClient.put(`/notes/${id}`, data);
};

/**
 * [新增] 删除笔记的 API (假设存在)
 */
export const deleteNote = (id: number): Promise<void> => {
    return apiClient.delete(`/notes/${id}`);
};

