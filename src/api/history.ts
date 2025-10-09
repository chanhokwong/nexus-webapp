import apiClient from './axios';

// --- 类型定义 ---
// 定义一个统一的历史事件类型
export interface HistoryEvent {
  type: 'quiz' | 'chat' | 'graph' | 'notes'; // 事件类型
  id: string; // session_id, graph_id, etc.
  title: string;
  context: string;
  timestamp: string; // ISO 8601 日期字符串
}

// 假设的后端返回类型
interface QuizHistorySession { 
  id: string; 
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


/**
 * [聚合] 获取并合并所有类型的历史记录
 */
export const getAllHistory = async (): Promise<HistoryEvent[]> => {
  console.log("--- [DEBUG] Starting to fetch all history ---");

  const results = await Promise.allSettled([
    apiClient.get<QuizHistorySession[]>('/quiz-history/sessions'),
    apiClient.get<ChatHistorySession[]>('/chat-history/sessions'),
    apiClient.get<GraphHistoryItem[]>('/knowledge-graphs/'),
    apiClient.get<NoteHistoryItem[]>('/notes/'),
  ]);

  const allEvents: HistoryEvent[] = [];

  // 1. 处理测验历史
  if (results[0].status === 'fulfilled') {
    // [核心修正] 直接在 value (即数据数组) 上调用 .map()
    const quizzes: HistoryEvent[] = results[0].value.map(s => ({
      type: 'quiz', id: s.session_id, title: '完成一次測驗',
      context: `源自工作台: ${s.workspace_name}`, timestamp: s.created_at
    }));
    allEvents.push(...quizzes);
    console.log(`[DEBUG] Fetched ${quizzes.length} quiz histories.`);
  } else {
    console.error("Failed to fetch quiz history:", results[0].reason);
  }

  // 2. 处理聊天历史
  if (results[1].status === 'fulfilled') {
    // [核心修正] 移除 .data
    const chats: HistoryEvent[] = results[1].value.map(s => ({
      type: 'chat', id: s.id, title: '與 AI 導師聊天',
      context: `主題: ${s.first_message.substring(0, 50)}...`,
      timestamp: s.created_at
    }));
    allEvents.push(...chats);
    console.log(`[DEBUG] Fetched ${chats.length} chat histories.`);
  } else {
    console.error("Failed to fetch chat history:", results[1].reason);
  }

  // 3. 处理知识图谱历史
  if (results[2].status === 'fulfilled') {
    // [核心修正] 移除 .data
    const graphs: HistoryEvent[] = results[2].value.map(g => ({
      type: 'graph', id: g.id.toString(), title: '生成知識圖譜',
      context: `標題: ${g.title}`, timestamp: g.created_at
    }));
    allEvents.push(...graphs);
    console.log(`[DEBUG] Fetched ${graphs.length} graph histories.`);
  } else {
    console.error("Failed to fetch graph history:", results[2].reason);
  }

  // 4. 处理笔记历史
  if (results[3].status === 'fulfilled') {
    // [核心修正] 移除 .data
    const notes: HistoryEvent[] = results[3].value.map(n => ({
      type: 'notes', id: n.id.toString(), title: '生成學習筆記',
      context: `標題: ${n.title}`, timestamp: n.created_at
    }));
    allEvents.push(...notes);
    console.log(`[DEBUG] Fetched ${notes.length} note histories.`);
  } else {
    console.error("Failed to fetch note history:", results[3].reason);
  }
  
  // 合并后按时间倒序排序
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  console.log(`[DEBUG] Total formatted history events: ${allEvents.length}`);
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