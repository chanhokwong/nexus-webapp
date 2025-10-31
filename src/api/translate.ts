import apiClient, { longTimeoutApiClient } from './axios';

// --- 類型定義 (與後端 schemas.py 完全對應) ---

export interface Paragraph {
  id: string;
  original: string;
  page_number: number;  // 頁碼字段
}

export interface StructuredTextResponse {
  paragraphs: Paragraph[];
}

export interface TranslationRequest {
  text: string;
  target_lang: 'en' | 'zh';
}

export interface TranslationResponse {
  translation: string;
}

// --- API 函數 ---

/**
 * 獲取指定文檔的結構化 (分段) 文本內容
 */
export const getDocumentAsParagraphs = (documentId: number | string): Promise<StructuredTextResponse> => {
  return apiClient.get(`/documents/${documentId}/structured-text`);
};

/**
 * 翻譯單段文本
 */
export const translateText = (data: TranslationRequest): Promise<TranslationResponse> => {
  // 翻譯可能耗時較長，使用 longTimeoutApiClient
  return longTimeoutApiClient.post('/translate', data);
};