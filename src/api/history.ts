import apiClient from './axios';
import { rawApiClient } from './axios'; // [核心] 导入 rawApiClient
import type { ChatMessage } from './ai';
import type { Flashcard } from './ai';
import type { GradedLongAnswerResponse } from './ai';

// --- 类型定义 ---
// 定义一个统一的历史事件类型
export interface HistoryEvent {
  type: 'quiz' | 'chat' | 'graph' | 'notes' | 'clue_sheet' | 'tutorial' | 'short_answer'; // 事件类型
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
  started_at: string; 
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

// 新增：用于解析 GET /tutorials/ 响应的接口
interface TutorialHistoryItem { 
  id: number; 
  title: string; 
  created_at: string; 
  workspace_id: number; // 后端也返回了这个，我们可以利用它
}

export interface TutorialStepDetail {
  id: number;
  step_number: number;
  title: string;
  content: string | null;
  is_completed: boolean;
}

export interface TutorialDetail {
  id: number;
  title: string;
  workspace_id: number;
  owner_id: number;
  created_at: string;
  steps: TutorialStepDetail[];
}

// --- [核心] Short Answer 相关的类型定义 (与后端 V2 Schema 完全匹配) ---
export interface SaveShortAnswerPayload {
  session_id: string;
  workspace_id: number;
  question: string;
  user_answer: string;
  score: number;
  feedback: string;
  standard_answer: string;
}

export interface ShortAnswerRecord {
  question: string;
  user_answer: string;
  score: number;
  feedback: string;
  standard_answer: string;
}

export interface ShortAnswerDetail {
  session_id: string;
  workspace_name: string;
  created_at: string;
  records: ShortAnswerRecord[];
}

interface ShortAnswerSessionInfo {
  session_id: string;
  workspace_name: string;
  created_at: string;
  record_count: number;
}

// [核心] 新增长答题历史相关的类型定义
interface LongAnswerSessionInfo {
  session_id: string;
  workspace_name: string;
  created_at: string;
  record_count: number;
}

export interface LongAnswerRecordDetail {
  question: string;
  user_answer: string;
  grading_result: GradedLongAnswerResponse; // 嵌套完整的批改结果
}

export interface LongAnswerDetail {
  session_id: string;
  workspace_name: string;
  created_at: string;
  records: LongAnswerRecordDetail[];
}


/**
 * [聚合] 获取并合并所有类型的历史记录
 */
export const getAllHistory = async (): Promise<HistoryEvent[]> => {
  const allEvents: HistoryEvent[] = [];

  const [quizResult, chatResult, graphResult, noteResult, clueSheetResult, tutorialResult, shortAnswerResult, longAnswerResult] = await Promise.allSettled([
    rawApiClient.get<QuizHistorySession[]>('/quiz-history/sessions'), // << 确保这一行没有被删除或注释
    rawApiClient.get<ChatHistorySession[]>('/chat-history/sessions'),
    rawApiClient.get<GraphHistoryItem[]>('/knowledge-graphs/'),
    rawApiClient.get<NoteHistoryItem[]>('/notes/'),
    rawApiClient.get<ClueSheetHistoryItem[]>('/clue-sheets/'),
    rawApiClient.get<TutorialHistoryItem[]>('/tutorials/'),
    rawApiClient.get<ShortAnswerSessionInfo[]>('/short-answer-history/sessions'),
    rawApiClient.get<LongAnswerSessionInfo[]>('/long-answer-history/sessions'),
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
      .filter(s => s && s.session_id) // << 过滤
      .map(s => ({
        type: 'chat', 
        id: s.session_id!,
        title: '與 AI 導師聊天',
        context: `主題: ${(s.first_message || '無主題').substring(0, 50)}...`, 
        timestamp: s.started_at || new Date().toISOString()
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

  if (tutorialResult.status === 'fulfilled' && Array.isArray(tutorialResult.value.data)) {
    const data = tutorialResult.value.data;
    const tutorials: HistoryEvent[] = data
      .filter(t => t && t.id != null) // 过滤掉无效数据
      .map(t => ({
        type: 'tutorial', // <-- 定义新的类型
        id: t.id!.toString(),
        title: '生成學習教程', // 或者使用 t.title
        context: `教程標題: ${t.title || '無標題'}`, 
        timestamp: t.created_at || new Date().toISOString()
      }));
    allEvents.push(...tutorials);
  } else if (tutorialResult.status === 'rejected') {
     console.error("Failed to fetch tutorial history:", tutorialResult.reason);
  }

  // [核心] 更新处理短答题历史的逻辑
  if (shortAnswerResult.status === 'fulfilled' && Array.isArray(shortAnswerResult.value.data)) {
    const data = shortAnswerResult.value.data;
    const shortAnswers: HistoryEvent[] = data.map(s => ({
      type: 'short_answer', // type 保持不变
      id: s.session_id,
      title: '短答題練習',
      context: `源自工作台: ${s.workspace_name} (${s.record_count} 題)`, // 显示题目数量
      timestamp: s.created_at
    }));
    allEvents.push(...shortAnswers);
  } else if (shortAnswerResult.status === 'rejected') {
     console.error("Failed to fetch short answer history:", shortAnswerResult.reason);
  }

  if (longAnswerResult.status === 'fulfilled' && Array.isArray(longAnswerResult.value.data)) {
    const data = longAnswerResult.value.data;
    // @ts-ignore
    const longAnswers: HistoryEvent[] = data.map(s => ({
      type: 'long_answer', // 定义新的类型
      id: s.session_id,
      title: '長答題練習',
      context: `源自工作台: ${s.workspace_name} (${s.record_count} 題)`,
      timestamp: s.created_at
    }));
    allEvents.push(...longAnswers);
  } else if (longAnswerResult.status === 'rejected') {
     console.error("Failed to fetch long answer history:", longAnswerResult.reason);
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

/**
 * 获取单个已保存教程的完整详情 (最终、简化版)
 */
export const getTutorialDetails = (tutorialId: number): Promise<TutorialDetail> => {
  // **关键修复：保持与 getGraphById 等函数完全相同的实现风格**
  // 我们依赖 apiClient 的全局拦截器来处理 data 的解包和错误
  console.log(`--- [API] Fetching details for Tutorial ID: ${tutorialId} ---`);
  return apiClient.get(`/tutorials/${tutorialId}`);
};

/**
 * [核心] 保存一次完整的短答题作答记录
 */
export const saveShortAnswerRecord = (data: SaveShortAnswerPayload): Promise<any> => {
  return apiClient.post('/short-answer-history/save-record', data);
};

/**
 * [核心] 获取单个短答题会话的完整记录
 */
export const getShortAnswerHistoryById = (sessionId: string): Promise<ShortAnswerDetail> => {
  return apiClient.get(`/short-answer-history/${sessionId}`);
};

/**
 * [新增] 获取单个长答题会话的完整记录
 */
export const getLongAnswerHistoryById = (sessionId: string): Promise<LongAnswerDetail> => {
  return apiClient.get(`/long-answer-history/${sessionId}`);
};