import axios, { type InternalAxiosRequestConfig, type AxiosInstance } from 'axios';
import { useUserStore } from '../stores/user';
import { useLocaleStore } from '../stores/locale';

// --- 1. 创建两个不同超时时间的 Axios 实例 ---

// 默认客户端，用于常规、快速的 API 请求
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 30000, // 15 秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 长超时客户端，专门用于耗时的 AI 生成任务
export const longTimeoutApiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 120000, // 120 秒 = 2 分钟
  headers: {
    'Content-Type': 'application/json',
  },
});

// [核心] 创建一个专门用于文件上传的 Axios 实例
export const uploadApiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 300000, // 300,000 毫秒 = 5 分钟，为大文件上传留足时间
  headers: {
    'Content-Type': 'multipart/form-data', // 默认 Content-Type
  },
});


// --- 2. 创建一个通用的拦截器配置函数 ---

const configureInterceptors = (client: AxiosInstance) => {
  
  // A. 请求拦截器 (Request Interceptor)
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 在函数内部获取 store 实例，确保 Pinia 已初始化
      const userStore = useUserStore();
      const localeStore = useLocaleStore();

      // 如果存在 token，则添加到 Authorization 头
      if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`;
      }
      
      if (localeStore.currentLocale) {
        config.headers['Accept-Language'] = localeStore.currentLocale;
      }

      return config; // 必须返回 config
    },
    (error) => Promise.reject(error)
  );

  // B. 响应拦截器 (Response Interceptor)
  client.interceptors.response.use(
    (response) => {
      // 直接返回 response.data，简化后续调用
      return response.data;
    },
    (error) => {
      // 全局处理常见的错误
      if (error.response) {
        // 如果收到 401 Unauthorized 错误，意味着 token 失效，自动登出
        if (error.response.status === 401) {
          const userStore = useUserStore();
          // 调用登出 action，它会清理 token 并重定向到登录页
          userStore.logout();
        }
      }
      // 将错误继续抛出，以便在具体的 API 调用处可以捕获并处理
      return Promise.reject(error);
    }
  );
};


// --- 3. 将拦截器应用到两个实例上 ---

configureInterceptors(apiClient);
configureInterceptors(longTimeoutApiClient);
configureInterceptors(uploadApiClient);

// --- 4. 导出默认的客户端 ---

export default apiClient;