import apiClient from './axios';
import { rawApiClient } from './axios'; // [核心] 导入 rawApiClient
import type { ChatMessage } from './ai';
import type { Flashcard } from './ai';

// --- 类型定义 ---
// 定义一个统一的历史事件类型
export interface HistoryEvent {
  type: 'quiz' | 'chat' | 'graph' | 'notes' | 'clue_sheet'; // 事件类型
  id: string; // session_id, graph_id, etc.
  title: string;
  context: string;
  timestamp: string; // ISO 8601 日期字符串
}

// 假设的后端返回类型
interface QuizHistorySession { 
  session_id: string; 
  workspace_name: string; 
  created_at: string; 
}
interface ChatHistorySession { 
  session_id: string; 
  first_message: string; 
  created_at: string; 
}
interface GraphHistoryItem { 
  id: number; 
  title: string; 
  created_at: string; 
}
interface NoteHistoryItem { 
  id: number; 
  title: string; 
  created_at: string; 
}
export interface GraphDetail {
  id: number;
  title: string;
  created_at: string;
  // content 现在是一个包含了 format 和 code 的对象
  content: {
    format: 'mermaid' | string; // 可能是 'mermaid' 或其他
    code: string;
  };
}
// [新增] 保存图谱时需要发送的数据
export interface SaveGraphPayload {
  workspace_id: number;
  title: string;
  content: {
    format: 'mermaid';
    code: string;
  };
}

// [核心] 定义单道题的作答结果结构
interface QuizAttemptResult {
  question_text: string;
  user_answer: string;
  is_correct: boolean;
  options: string[];
  correct_answer: string;
}

// [核心最终修正] 定义保存一次完整测验结果的 payload
export interface SaveQuizPayload {
  session_id: string; // 唯一标识符
  workspace_id: number;
  score: number;
  total_questions: number;
  attempts: QuizAttemptResult[]; // 包含所有题目的作答结果
}

interface ClueSheetHistoryItem { 
  id: number; 
  title: string; 
  created_at: string; 
}

// [核心] 定义 Clue Sheet 详情的类型
export interface ClueSheetDetail {
  id: number;
  title: string;
  cards: Flashcard[];
  created_at: string;
}

// [核心] 定义保存 Clue Sheet 时需要发送的数据
export interface SaveClueSheetPayload {
  title: string;
  cards: Flashcard[];
  // 假设后端也需要 workspace_id 来关联来源
  workspace_id: number;
}

/**
 * [聚合] 获取并合并所有类型的历史记录
 */
export const getAllHistory = async (): Promise<HistoryEvent[]> => {
  const allEvents: HistoryEvent[] = [];

  const [quizResult, chatResult, graphResult, noteResult, clueSheetResult] = await Promise.allSettled([
    rawApiClient.get<QuizHistorySession[]>('/quiz-history/sessions'), // << 确保这一行没有被删除或注释
    rawApiClient.get<ChatHistorySession[]>('/chat-history/sessions'),
    rawApiClient.get<GraphHistoryItem[]>('/knowledge-graphs/'),
    rawApiClient.get<NoteHistoryItem[]>('/notes/'),
    rawApiClient.get<ClueSheetHistoryItem[]>('/clue-sheets/'),
  ]);

  // [核心最终修正] 在 .map() 之前添加 .filter() 来剔除所有无效数据

  if (quizResult.status === 'fulfilled') {
    const data = quizResult.value.data;
    if (Array.isArray(data)) {
      const quizzes: HistoryEvent[] = data
        .filter(s => s && s.session_id) // 过滤掉没有 session_id 的记录
        .map(s => ({
          type: 'quiz', 
          id: s.session_id!, // [核心] 使用正确的字段名 session_id
          title: '完成一次測驗',
          context: `源自工作台: ${s.workspace_name || '未知'}`, 
          timestamp: s.created_at || new Date().toISOString()
        }));
      allEvents.push(...quizzes);
    }
  }

  if (chatResult.status === 'fulfilled' && Array.isArray(chatResult.value.data)) {
    const data = chatResult.value.data;
    const chats: HistoryEvent[] = data
      .filter(s => s && s.session_id && s.created_at) // [核心] 确保 created_at 存在
      .map(s => ({
        type: 'chat', 
        id: s.session_id!,
        title: '與 AI 導師聊天',
        context: `主題: ${(s.first_message || '無主題').substring(0, 50)}...`, 
        timestamp: s.created_at! // [核心] 使用正确的字段
      }));
    allEvents.push(...chats);
  }
  
  if (graphResult.status === 'fulfilled' && Array.isArray(graphResult.value.data)) {
    const data = graphResult.value.data;
    const graphs: HistoryEvent[] = data
      .filter(g => g && g.id !== null && g.id !== undefined) // << 更严格的过滤
      .map(g => ({
        type: 'graph', 
        id: g.id!.toString(),
        title: '生成知識圖譜',
        context: `標題: ${g.title || '無標題'}`, 
        timestamp: g.created_at || new Date().toISOString()
      }));
    allEvents.push(...graphs);
  }

  if (noteResult.status === 'fulfilled' && Array.isArray(noteResult.value.data)) {
    const data = noteResult.value.data;
    const notes: HistoryEvent[] = data
      .filter(n => n && n.id !== null && n.id !== undefined) // << 更严格的过滤
      .map(n => ({
        type: 'notes', 
        id: n.id!.toString(),
        title: '生成學習筆記',
        context: `標題: ${n.title || '無標題'}`, 
        timestamp: n.created_at || new Date().toISOString()
      }));
    allEvents.push(...notes);
  }

  if (clueSheetResult.status === 'fulfilled' && Array.isArray(clueSheetResult.value.data)) {
    const data = clueSheetResult.value.data;
    const clueSheets: HistoryEvent[] = data
      .filter(cs => cs && cs.id !== null)
      .map(cs => ({
        type: 'clue_sheet',
        id: cs.id!.toString(),
        title: '生成記憶卡片',
        context: `標題: ${cs.title || '無標題'}`,
        timestamp: cs.created_at || new Date().toISOString()
      }));
    allEvents.push(...clueSheets);
  } else if(clueSheetResult.status === 'rejected') {
     console.error("Failed to fetch clue sheet history:", clueSheetResult.reason);
  }
  
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return allEvents;
};

/**
 * [新增] 4.4 - 获取单个已保存图谱的完整数据
 */
export const getGraphById = (id: number): Promise<GraphDetail> => {
  return apiClient.get(`/knowledge-graphs/${id}`);
};

/**
 * [新增] 4.4 - 保存一份知识图谱
 */
export const saveKnowledgeGraph = (data: SaveGraphPayload): Promise<GraphDetail> => {
  return apiClient.post('/knowledge-graphs/save', data);
};

/**
 * [核心最终修正] 4.2 - 保存一次完整的测验结果
 */
export const saveQuizResult = (data: SaveQuizPayload): Promise<any> => {
  return apiClient.post('/quiz-history/save', data);
};

/**
 * [新增] 4.1 - 获取单个会话的完整聊天记录
 */
export const getChatHistoryDetail = (sessionId: string): Promise<ChatMessage[]> => {
  return apiClient.get(`/chat-history/${sessionId}`);
};

/**
 * [新增] 4.5 - 获取单个已保存 Clue Sheet 的完整内容
 */
export const getClueSheetById = (id: number | string): Promise<ClueSheetDetail> => {
  return apiClient.get(`/clue-sheets/${id}`);
};

/**
 * [新增] 4.5 - 保存一份 Clue Sheet
 */
export const saveClueSheet = (data: SaveClueSheetPayload): Promise<any> => {
  // 根据 API 文档，端点是 /clue-sheets/save
  return apiClient.post('/clue-sheets/save', data);
};
