import axios, { type InternalAxiosRequestConfig, type AxiosInstance } from 'axios';
import { useUserStore } from '../stores/user';
import { useLocaleStore } from '../stores/locale';


// --- 1. 创建一个通用的拦截器配置函数 ---
const configureInterceptors = (client: AxiosInstance, returnsFullResponse: boolean = false) => {
  // A. 请求拦截器 (Request Interceptor)
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const userStore = useUserStore();
      const localeStore = useLocaleStore();
      if (userStore.token) config.headers.Authorization = `Bearer ${userStore.token}`;
      if (localeStore.currentLocale) config.headers['Accept-Language'] = localeStore.currentLocale;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // B. 响应拦截器 (Response Interceptor)
  client.interceptors.response.use(
    (response) => {
      // [关键] 根据参数决定是返回 response.data 还是完整 response
      return returnsFullResponse ? response : response.data; 
    },
    (error) => {
      if (error.response?.status === 401) {
        // 使用 try-catch 以防 store 尚未初始化
        try { useUserStore().logout(); } catch (e) {}
      }
      return Promise.reject(error);
    }
  );
};

// --- 2. 创建并配置所有需要的 Axios 实例 ---

// A. 默认客户端 (返回 data)
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 30000,
});
configureInterceptors(apiClient); // 默认 returnsFullResponse 是 false

// B. 原始客户端 (返回完整 response)
export const rawApiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 30000,
});
configureInterceptors(rawApiClient, true); // [关键] 明确指定返回完整 response

// C. 长超时客户端 (返回 data)
export const longTimeoutApiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 120000,
});
configureInterceptors(longTimeoutApiClient); // 默认返回 data

// D. 文件上传客户端 (返回 data)
export const uploadApiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.nexus-ai-edu.app',
  timeout: 300000,
  headers: { 'Content-Type': 'multipart/form-data' },
});
configureInterceptors(uploadApiClient);


// --- 3. 导出默认的客户端 ---
export default apiClient;