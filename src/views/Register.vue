<template>
  <div class="login-page-container">
    <!-- 背景與 Login 頁完全相同 -->
    <div class="gradient-background"></div>

    <!-- 註冊表單容器 -->
    <div class="login-container">
        <!-- 品牌 Logo -->
        <img :src="logo" alt="Nexus Logo" class="brand-logo">
        
        <!-- 表單 -->
        <form class="form" @submit.prevent="onRegisterSubmit">
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
            <!-- [文字修改] 按鈕文字改為 REGISTER -->
            <button type="submit" class="btn btn-primary">REGISTER</button>
        </form>

        <!-- [文字與鏈接修改] 鏈接改為返回登錄頁 -->
        <div class="footer">
            <a href="#" @click.prevent="$router.push('/login')">ALREADY HAVE AN ACCOUNT? LOGIN</a>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';
import logo from '../assets/nexus-logo.png'; // 同樣需要導入 Logo

// --- Vue 響應式狀態 ---
const router = useRouter();
const userStore = useUserStore();
const email = ref('');
const password = ref('');

// --- [邏輯修改] 註冊邏輯 ---
const onRegisterSubmit = async () => {
  if (!email.value || !password.value) {
    ElMessage.warning({
      message: 'Email and Password cannot be empty.',
      customClass: 'nexus-message'
    });
    return;
  }
  try {
    // 調用 store 中的 handleRegister action
    await userStore.handleRegister({ email: email.value, password: password.value });
    
    // 註冊成功後提示用戶，並跳轉到登錄頁
    ElMessage.success({
      message: 'REGISTRATION SUCCESSFUL. PLEASE LOGIN.',
      customClass: 'nexus-message'
    });
    router.push('/login'); 

  } catch (error) {
    ElMessage.error({
      message: 'REGISTRATION FAILED. PLEASE TRY AGAIN.',
      customClass: 'nexus-message nexus-message-error'
    });
  }
};

</script>

<style scoped>
/* --- [完全複用] 樣式與 Login.vue 完全相同 --- */

.login-page-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.gradient-background {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: radial-gradient(circle at 10% 20%, #4a00e0, transparent 50%),
                radial-gradient(circle at 80% 90%, #00d4ff, transparent 50%),
                radial-gradient(circle at 50% 50%, #1a237e, #0d0c22 70%);
    filter: blur(80px);
    animation: gradient-move 20s ease-in-out infinite alternate;
}

@keyframes gradient-breathe {
    from { transform: scale(1) rotate(0deg); }
    to { transform: scale(1.1) rotate(-10deg); }
}

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

.brand-logo {
    width: 100px;
    height: 100px;
    margin-bottom: 20px;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.7));
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

.form-input {
    width: 100%;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    text-align: center;
    letter-spacing: 1px;
    border-radius: 8px;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer;
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
    font-weight: 600;
}

.form-input {
    background: rgba(13, 12, 34, 0.5);
    color: #e0e0e0;
    border: 1px solid rgba(0, 212, 255, 0.3);
}
.form-input::placeholder {
    color: rgba(224, 224, 224, 0.4);
}
.form-input:focus {
    border-color: rgba(0, 212, 255, 0.8);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.btn {
    font-weight: 600;
}

.btn-primary {
    background: rgba(13, 12, 34, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #fff;
}
.btn-primary:hover {
    background: #fff;
    color: #0d0c22;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
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
</style>