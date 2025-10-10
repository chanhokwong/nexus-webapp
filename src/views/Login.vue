<template>
  <div class="login-page-container">
    <!-- [修正] 使用單一、優雅的線性漸變背景 -->
    <div class="gradient-background"></div>

    <!-- 登錄表單容器 -->
    <div class="login-container">
        <!-- 品牌 Logo -->
        <img src="../assets/nexus-logo.png" alt="Nexus Logo" class="brand-logo">
        
        <!-- 表單 -->
        <form class="form" @submit.prevent="onLoginSubmit">
            <input 
              type="email" 
              class="form-input" 
              placeholder="EMAIL" 
              required
              v-model="email"
            >
            <input 
              type="password" 
              class="form-input" 
              placeholder="PASSWORD" 
              required
              v-model="password"
            >
            <button type="submit" class="btn btn-primary">LOGIN</button>
        </form>

        <!-- [核心] 自定义 Google 按钮 (图1样式) -->
        <button class="btn btn-google" @click="triggerGoogleSignin">
          <GoogleIcon class="google-icon-svg" />
          <span>使用 GOOGLE 帳戶登入</span>
        </button>

        <!-- 
          [核心] Google 官方按钮的挂载点。
          我们将用 CSS 把它隐藏起来，但它依然存在于 DOM 中。
        -->
        <div id="google-signin-button-hidden" class="hidden-google-btn"></div>

        <!-- 註冊鏈接 -->
        <div class="footer">
            <a href="#" @click.prevent="$router.push('/register')">REGISTER ACCOUNT</a>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';
import GoogleIcon from '../assets/google-icon.svg';
import { loginWithGoogle } from '../api/auth';

// --- Vue 響應式狀態 ---
const router = useRouter();
const userStore = useUserStore();

const email = ref('');
const password = ref('');

const GOOGLE_CLIENT_ID = '432133069805-jrp0cqu0ltphuinc3h1i6enrlqb3bd79.apps.googleusercontent.com';

// 1. 定义一个全局可访问的回调函数
//    Google 的库会通过 window 对象来调用这个函数
window.handleGoogleCredentialResponse = async (response: any) => {
  const loading = ElMessage({ message: '正在通过 Google 验证...', type: 'info', duration: 0 });
  try {
    const tokenResponse = await loginWithGoogle({ id_token: response.credential });
    userStore.setToken(tokenResponse.access_token);
    await userStore.fetchAndSetCurrentUser();
    
    loading.close();
    ElMessage.success('Google 登錄成功！');
    await nextTick();
    router.push('/dashboard');
  } catch (error) {
    loading.close();
    ElMessage.error('Google 登錄失敗，請稍後再試。');
    console.error("Google login failed:", error);
  }
};


// 4. 在组件挂载后，初始化 Google 登录按钮
onMounted(() => {
  // 增加延时和重试，以应对 Google 脚本加载慢的情况
  let attempts = 0;
  const interval = setInterval(() => {
    if (typeof window.google !== 'undefined' && window.google.accounts) {
      clearInterval(interval);
      console.log("Google Identity Services loaded. Initializing...");
      
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: window.handleGoogleCredentialResponse,
        ux_mode: 'popup',
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button-hidden'),
        { theme: "outline", size: "large" }
      );
    } else if (attempts > 10) { // 超过5秒则放弃
      clearInterval(interval);
      console.error("Google Identity Services script failed to load after 5 seconds.");
    }
    attempts++;
  }, 500); // 每半秒检查一次
});

// [核心] "代理点击" 函数
const triggerGoogleSignin = () => {
  // 找到隐藏的官方按钮内部真正的 <iframe> 或 <button>
  const googleBtnContainer = document.getElementById('google-signin-button-hidden');
  const googleBtn = googleBtnContainer?.querySelector('[role="button"]') as HTMLElement | null;

  if (googleBtn) {
    googleBtn.click(); // 模拟点击
  } else {
    ElMessage.error("Google 登錄按鈕尚未初始化，請稍候...");
  }
};

// --- 登錄邏輯 ---
const onLoginSubmit = async () => {
  if (!email.value || !password.value) {
    ElMessage.warning('請填寫電子郵箱和密碼');
    return;
  }
  
  const loading = ElMessage({ message: '正在登入...', type: 'info', duration: 0 });
  
  try {
    // 调用 store 中的 handleLogin action
    await userStore.handleLogin({ email: email.value, password: password.value });
    
    loading.close();
    ElMessage.success('登錄成功！');
    
    // 2. [关键] 等待下一个 DOM 更新周期/响应式更新周期
    await nextTick();
    
    // 此时，Pinia store 的 isLoggedIn 已经更新为 true
    console.log("After nextTick, isLoggedIn is:", userStore.isLoggedIn); // 应该会打印 true
    
    // 3. 执行跳转
    router.push('/dashboard'); 
    
  } catch (error: any) {
    loading.close();
    const errorMessage = error.response?.data?.detail || '登錄失敗，請檢查您的憑證';
    ElMessage.error(errorMessage);
  }
};
</script>

<style scoped>
/* --- [核心修正] 容器與全新背景 --- */
.login-page-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    overflow: hidden; /* 確保漸變動畫的邊緣被裁切 */
}

.gradient-background {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: radial-gradient(circle at 10% 20%, #4a00e0, transparent 50%),
                radial-gradient(circle at 80% 90%, #00d4ff, transparent 50%),
                radial-gradient(circle at 50% 50%, #1a237e, #0d0c22 70%);
    filter: blur(80px); /* 關鍵的模糊效果，創造柔和過渡 */
    animation: gradient-move 20s ease-in-out infinite alternate;
}


@keyframes gradient-breathe {
    from { transform: scale(1) rotate(0deg); }
    to { transform: scale(1.1) rotate(-10deg); }
}

/* --- 登錄介面 --- */
.login-container {
    font-family: 'Jura', sans-serif;
    width: 100%;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px;
    position: relative;
    z-index: 1;
    padding: 20px;
}

/* [修正] Logo 樣式，確保輝光效果正確 */
.brand-logo {
    width: 100px;
    height: 100px;
    margin-bottom: 20px;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.7)); /* 使用白色輝光 */
    animation: logo-breathe 5s ease-in-out infinite;
}

@keyframes logo-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* --- [核心修正] 表單元素樣式 --- */
.form-input {
    width: 100%;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    text-align: center;
    letter-spacing: 1px;
    /* text-transform: uppercase; 已移除 */
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer; /* 在 input 上保留 cursor pointer 也可以 */
    
    /* 從下方複製過來的獨立樣式 */
    background: rgba(13, 12, 34, 0.5);
    color: #e0e0e0;
    border: 1px solid rgba(0, 212, 255, 0.3);
}

.btn {
    width: 100%;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    text-align: center;
    letter-spacing: 1px;
    text-transform: uppercase; /* <--- 規則只保留在這裡 */
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer;
    
    /* 從下方複製過來的獨立樣式 */
    font-weight: 600;
}

.form-input {
    /* [修正] 使用更深的半透明背景和輝光邊框 */
    background: rgba(13, 12, 34, 0.5); /* 深色半透明背景 */
    color: #e0e0e0;
    border: 1px solid rgba(0, 212, 255, 0.3); /* 細膩的邊框 */
}
.form-input::placeholder {
    color: rgba(224, 224, 224, 0.4);
}
.form-input:focus {
    border-color: rgba(0, 212, 255, 0.8);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3); /* 聚焦時的輝光 */
}

/* [修正] 按鈕樣式 */
.btn {
    font-weight: 600;
}

.btn-primary { /* 主按鈕 */
    background: rgba(13, 12, 34, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #fff;
}
.btn-primary:hover {
    background: #fff;
    color: #0d0c22;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.btn-google { /* Google 按鈕 */
    width: 100%;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    text-align: center;
    letter-spacing: 1px;
    text-transform: uppercase; /* <--- 規則只保留在這裡 */
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer;
    
    /* 從下方複製過來的獨立樣式 */
    font-weight: 600;
}
.btn-google:hover {
    border-color: #fff;
    color: #fff;
    background-color: rgba(255, 255, 255, 0.05);
}
.google-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}
.google-icon-svg {
  width: 20px;
  height: 20px;
}
/* [核心] 隐藏官方按钮的样式 */
.hidden-google-btn {
  /* 
    使用一种对可访问性友好的方式来隐藏元素。
    它依然存在于 DOM 中，但视觉上不可见。
  */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.footer {
    font-size: 12px;
    font-weight: 300;
}
.footer a {
    color: var(--primary-glow);
    text-decoration: none;
    font-weight: 500;
}
.footer a:hover {
    text-decoration: underline;
}

/* ElMessage 全局自定義樣式 */
:global(.nexus-message) {
    background-color: rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    backdrop-filter: blur(10px);
    color: #fff !important;
    font-family: 'Jura', sans-serif !important;
}
:global(.nexus-message-error) {
  border-color: #ff4d4d !important;
}
#google-signin-button {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 1rem;
}
</style>