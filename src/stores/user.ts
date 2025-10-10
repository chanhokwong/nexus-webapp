import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '../api/auth'; // 導入我們封裝的所有 auth API 函數
import type { LoginPayload, RegisterPayload, User } from '../types/api';

// 使用 Pinia 的 setup store 語法，更符合 Vue 3 Composition API 的習慣
export const useUserStore = defineStore('user', () => {
  // === STATE ===
  // ref() 對應 state
  const token = ref<string | null>(localStorage.getItem('nexus-token'));
  const currentUser = ref<User | null>(null);
  const status = ref<'idle' | 'loading' | 'error' | 'init'>('init');

  // === GETTERS ===
  // computed() 對應 getters
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value);
  const authHeader = computed(() => ({
    headers: { Authorization: `Bearer ${token.value}` },
  }));
  const userName = computed(() => currentUser.value?.email || 'Guest');

  // === ACTIONS ===
  // function() 對應 actions
  
  /**
   * 設置 token 並將其存儲到 localStorage
   * @param newToken - 從 API 獲取的 token
   */
  function setToken(newToken: string | null) {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('nexus-token', newToken);
    } else {
      localStorage.removeItem('nexus-token');
    }
  }

  /**
   * 處理用戶登錄
   * @param credentials - 登錄所需的用戶名和密碼
   */
  async function handleLogin(credentials: LoginPayload) {
    status.value = 'loading';
    try {
      const response = await authApi.login(credentials);
      setToken(response.access_token);
      await fetchAndSetCurrentUser(); // 登錄成功後立即獲取用戶信息
      status.value = 'idle';
      return Promise.resolve();
    } catch (error) {
      status.value = 'error';
      logout();
      console.error('Login failed:', error);
      return Promise.reject(error);
    }
  }

  /**
   * 處理用戶註冊
   * @param userData - 註冊所需的用戶信息
   */
  async function handleRegister(userData: RegisterPayload) {
    try {
      status.value = 'loading';
      // 註冊成功後，API 直接返回了 User 對象，但不包含 token
      const user = await authApi.register(userData);
      // 所以我們需要引導用戶去登錄
      status.value = 'idle';
      return Promise.resolve(user);
    } catch (error) {
      status.value = 'error';
      console.error('Registration failed:', error);
      return Promise.reject(error);
    }
  }

  /**
   * 獲取當前用戶信息並存儲到 store
   */
  async function fetchAndSetCurrentUser() {
    // 必須先有 token 才能獲取用戶信息
    if (!token.value) {
      return;
    }
    try {
      const user = await authApi.fetchCurrentUser();
      currentUser.value = user;
    } catch (error) {
      // 如果獲取用戶信息失敗 (例如 token 過期)，則視為登出
      console.error('Failed to fetch user info, logging out:', error);
      logout();
      throw error;
    }
  }

  /**
   * 檢查用戶認證狀態 (在應用程序啟動時調用)
   */
  async function checkAuthStatus() {
    console.log("[Auth] Checking authentication status...");
    // 检查本地存储中是否有 token
    if (token.value) {
      try {
        // 如果有 token，尝试用它来获取用户信息
        status.value = 'loading';
        await fetchAndSetCurrentUser();
        status.value = 'idle';
        console.log("[Auth] Status restored successfully.");
      } catch (error) {
        // 如果获取失败（token过期/无效），logout() 会被调用，状态会被清理
        console.log("[Auth] Status check failed, user is logged out.");
      }
    } else {
      // 如果没有 token，什么都不做，保持未登录状态
      console.log("[Auth] No token found, user is not logged in.");
      status.value = 'idle';
    }
  }
  
  /**
   * 處理用戶登出
   */
  function logout() {
    setToken(null);
    currentUser.value = null;
    // 在組件中使用 router 實例進行跳轉，這裡只負責清理狀態
    // const router = useRouter(); // 不推薦在 store 中直接使用 router
    // router.push('/login');
    console.log('User logged out, state cleared.');
  }

  // 將所有需要暴露給外部的 state, getters, actions 返回
  return {
    token,
    currentUser,
    status,
    isLoggedIn,
    authHeader,
    userName,
    handleLogin,
    handleRegister,
    logout,
    checkAuthStatus,
    setToken,
    fetchAndSetCurrentUser,
  };
});