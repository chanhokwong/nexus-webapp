// 扩展全局的 Window 接口
declare global {
  interface Window {
    // 告诉 TypeScript，window 对象上可能有一个 google 属性
    google?: any; 
    // 告诉 TypeScript，window 对象上会有一个我们自己定义的回调函数
    handleGoogleCredentialResponse?: (response: any) => void;
  }
}

// 导出空对象以确保这是一个模块文件
export {};