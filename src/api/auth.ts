// 導入我們配置好的 Axios 實例
import apiClient from './axios';
// 導入我們定義的類型
import type { 
  RegisterPayload, 
  LoginPayload, 
  GoogleLoginPayload,
  TokenResponse,
  User 
} from '../types/api';

/**
 * 1.1 用戶註冊
 * @param data - 包含 email 和 password 的對象
 */
export const register = (data: RegisterPayload): Promise<User> => {
  return apiClient.post('/users/', data);
};

/**
 * 1.2 用戶名密碼登錄
 * @param data - 包含 email 和 password 的對象
 */
export const login = (data: LoginPayload): Promise<TokenResponse> => {
  // API 文檔要求 Content-Type 為 application/x-www-form-urlencoded
  // 我們需要手動將 JS 對象轉換為 FormData 或 URLSearchParams 格式
  const formData = new URLSearchParams();
  formData.append('username', data.email); // 注意：API 字段名是 'username'
  formData.append('password', data.password);

  return apiClient.post('/login', formData, {
    // 覆蓋 apiClient 實例的默認 Content-Type
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

/**
 * 1.3 Google 賬號登錄
 * @param data - 包含 Google ID Token 的對象
 */
export const loginWithGoogle = (data: GoogleLoginPayload): Promise<TokenResponse> => {
  return apiClient.post('/login/google', data);
};

/**
 * 1.4 獲取當前用戶信息
 * 這個請求會自動被請求攔截器加上 Authorization 頭
 */
export const fetchCurrentUser = (): Promise<User> => {
  return apiClient.get('/users/me');
};

/**
 * [确认] 1.5 - 修改密码
 */
export const changePassword = (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
  return apiClient.post('/users/change-password', data);
};

/**
 * [确认] 1.6 - 注销（删除）账户
 */
export const deleteAccount = (): Promise<void> => {
  return apiClient.delete('/users/me');
};