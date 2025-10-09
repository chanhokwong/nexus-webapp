// 1.1 用戶註冊的請求體
export interface RegisterPayload {
  email: string;
  password: string;
}

// 1.2 用戶名密碼登錄的請求體
export interface LoginPayload {
  email: string; // 在 API 中這個字段叫 'username'
  password: string;
}

// 1.3 Google 登錄的請求體
export interface GoogleLoginPayload {
  id_token: string;
}

// API 返回的 Token 對象
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// API 返回的用戶對象 (根據需要補充完整字段)
export interface User {
  id: number;
  email: string;
  is_active: boolean;
  // ... 其他用戶字段
}