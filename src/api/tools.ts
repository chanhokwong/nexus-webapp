import apiClient from './axios';

// 这是一个占位文件，用于未来存放与工具箱相关的 API 调用。
// 例如，"Datasheet 数据提取" 可能需要一个这样的函数：

export interface DatasheetExtractionPayload {
  file_id: number;
  query_fields: string[];
}

export const extractFromDatasheet = (payload: DatasheetExtractionPayload): Promise<any> => {
  return apiClient.post('/tools/extract-datasheet', payload);
};