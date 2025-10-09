<template>
  <div class="settings-page-container">
    <h1 class="page-header">{{ $t('settings.title') }}</h1>

    <div class="settings-container">
      <!-- 左侧设定树 -->
      <ul class="settings-tree">
        <li class="tree-item" :class="{ active: activePanel === 'account' }">
          <a href="#" class="tree-link" @click.prevent="activePanel = 'account'">{{ $t('settings.account_security') }}</a>
        </li>
        <li class="tree-item" :class="{ active: activePanel === 'preferences' }">
          <a href="#" class="tree-link" @click.prevent="activePanel = 'preferences'">{{ $t('settings.preferences') }}</a>
        </li>
        <li class="tree-item" :class="{ active: activePanel === 'feedback' }">
          <a href="#" class="tree-link" @click.prevent="activePanel = 'feedback'">{{ $t('settings.feedback') }}</a>
        </li>
        <li class="tree-item danger" :class="{ active: activePanel === 'danger' }">
          <a href="#" class="tree-link" @click.prevent="activePanel = 'danger'">{{ $t('settings.delete_account') }}</a>
        </li>
      </ul>

      <!-- 右侧内容面板 -->
      <div class="settings-panels">
        <!-- 账户安全面板 -->
        <div id="account-panel" class="setting-panel" :class="{ active: activePanel === 'account' }">
          <div class="module-header"><h2 class="module-title">{{ $t('settings.account_security') }}</h2></div>
          <div class="setting-item">
            <label>{{ $t('settings.resetPassword') }}</label>
            <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-end;">
              <input v-model="passwords.current" type="password" class="form-input" :placeholder="currentPassword">
              <input v-model="passwords.new" type="password" class="form-input" :placeholder="newPassword">
              <button class="btn btn-primary" @click="handleChangePassword">{{ $t('settings.saveChange') }}</button>
            </div>
          </div>
        </div>

        <!-- 偏好设定面板 -->
        <div id="preferences-panel" class="setting-panel" :class="{ active: activePanel === 'preferences' }">
          <div class="module-header"><h2 class="module-title">{{ $t('settings.preferences') }}</h2></div>
          <div class="setting-item">
            <label for="language-select">{{ $t('settings.aiGeneratedLanguage') }}</label>
            <!-- 使用 ElSelect 并绑定到 Pinia store -->
            <el-select 
              id="language-select"
              v-model="localeStore.currentLocale" 
              class="form-select"
              popper-class="nexus-select-popper"
              @change="onLocaleChange"
            >
              <el-option label="繁體中文" value="zh" />
              <el-option label="English" value="en" />
            </el-select>
          </div>
          <div class="setting-item">
              <p class="module-description">{{ $t('settings.setRemindMsg') }}</p>
          </div>
        </div>

        <!-- 回馈与支持面板 -->
        <div id="feedback-panel" class="setting-panel" :class="{ active: activePanel === 'feedback' }">
          <div class="module-header">
            <h2 class="module-title">{{ $t('settings.feedback') }}</h2>
            <p class="module-description">{{ $t('settings.thankYouMsg') }}</p>
          </div>
          
          <!-- 1. Google Forms 问卷 -->
          <div class="setting-item">
            <label>{{ $t('settings.shareView') }}</label>
            <button class="btn btn-primary" @click="openGoogleForm">{{ $t('settings.fillQuestion') }}</button>
          </div>
          
          <!-- 分割线 -->
          <hr class="divider">

          <!-- 2. Formspree 联系我们表单 -->
          <form @submit.prevent="handleContactSubmit" class="contact-form">
            <h3 class="form-title">{{ $t('settings.leaveMsg') }}</h3>
            <div class="form-group">
              <label for="contact-name">{{ $t('settings.name') }}</label>
              <input v-model="contactForm.name" type="text" id="contact-name" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="contact-email">{{ $t('settings.email') }}</label>
              <input v-model="contactForm.email" type="email" id="contact-email" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="contact-message">{{ $t('settings.msgContent') }}</label>
              <textarea v-model="contactForm.message" id="contact-message" rows="4" class="form-input" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? $t('settings.sending') : $t('settings.sendMsg') }}
            </button>
            <p v-if="formStatus.message" class="form-status" :class="formStatus.type">
              {{ formStatus.message }}
            </p>
          </form>
        </div>

        <!-- 危险区域面板 -->
        <div id="danger-panel" class="setting-panel" :class="{ active: activePanel === 'danger' }" style="border-color: #E53935;">
          <div class="module-header" style="border-bottom-color: #E53935;"><h2 class="module-title" style="color: #E53935;">{{ $t('settings.cancelAc') }}</h2></div>
          <div class="setting-item">
            <p style="color: var(--text-secondary); font-size: 14px;">{{ $t('settings.cancelAcMsg') }}</p>
            <button class="btn btn-danger" @click="handleDeleteAccount">{{ $t('settings.confirmMsg') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, ElSelect, ElOption } from 'element-plus';
import { changePassword, deleteAccount } from '../api/auth';
import { useUserStore } from '../stores/user';
import { useLocaleStore, type SupportedLocale } from '../stores/locale';

// --- 状态 ---
const router = useRouter();
const userStore = useUserStore();
const activePanel = ref('account'); // 默认显示的面板
const localeStore = useLocaleStore();
const { locale } = useI18n();

// --- 國際化 ---
const { t } = useI18n();

const currentPassword = computed(() => t('settings.currentPassword'));
const newPassword = computed(() => t('settings.newPassword'));
const sending = computed(() => t('settings.sending'));
const receiveConfirmMsg = computed(() => t('settings.receiveConfirmMsg'));
const sendFailMsg = computed(() => t('settings.sendFailMsg'));
const networkErrorMsg = computed(() => t('settings.networkErrorMsg'));
const switchLanguageMsg = computed(() => t('settings.switchLanguageMsg'));
const enterPwdMsg = computed(() => t('settings.enterPwdMsg'));
const pwdEditSuccess = computed(() => t('settings.pwdEditSuccess'));
const pwdEditFail = computed(() => t('settings.pwdEditFail'));
const delConfirmMsg = computed(() => t('settings.delConfirmMsg'));
const highWarm = computed(() => t('settings.higherWarm'));
const delButtonTxt = computed(() => t('settings.delButtonTxt'));
const cancelTxt = computed(() => t('settings.cancelTxt'));
const acCancelMsg = computed(() => t('settings.acCancelMsg'));
const acCancelFail = computed(() => t('settings.acCancelFail'));

const passwords = reactive({
  current: '',
  new: '',
});

// --- [核心] 联系我们表单状态 ---
const isSubmitting = ref(false);
const contactForm = reactive({
  name: '',
  email: '',
  message: '',
});
const formStatus = reactive({
  message: '',
  type: 'success', // 'success' or 'error'
});

// --- 交互逻辑 ---

const openGoogleForm = () => {
  // 在新标签页中打开 Google Forms 链接
  window.open('https://docs.google.com/forms/d/e/1FAIpQLSfC9yZIGTQkFGuqWDjAVR7_bahuVq0DyYSHrtsjmjhmeVaLNQ/viewform', '_blank');
};

const handleContactSubmit = async () => {
  isSubmitting.value = true;
  formStatus.message = sending.value;
  formStatus.type = 'info';

  const formData = new FormData();
  formData.append('name', contactForm.name);
  formData.append('email', contactForm.email);
  formData.append('message', contactForm.message);

  try {
    const response = await fetch('https://formspree.io/f/mzzazwwk', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      formStatus.message = receiveConfirmMsg.value;
      formStatus.type = 'success';
      contactForm.name = '';
      contactForm.email = '';
      contactForm.message = '';
    } else {
      throw new Error(sendFailMsg.value);
    }
  } catch (error) {
    formStatus.message = networkErrorMsg.value;
    formStatus.type = 'error';
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};

// 3. [核心] 创建一个处理语言变化的回调
const onLocaleChange = (newLocale: SupportedLocale) => {
  // a. 更新 Pinia store (v-model 已经帮我们做了)
  localeStore.setLocale(newLocale);
  // b. 手动更新 vue-i18n 的 locale
  locale.value = newLocale;

  ElMessage.success(switchLanguageMsg.value+`${newLocale === 'zh' ? '繁體中文' : 'English'}`);
};


// --- 交互逻辑 ---
const handleChangePassword = async () => {
  if (!passwords.current || !passwords.new) {
    ElMessage.warning(enterPwdMsg.value);
    return;
  }
  try {
    const response = await changePassword({
      current_password: passwords.current,
      new_password: passwords.new,
    });
    ElMessage.success(response.message || pwdEditSuccess.value);
    passwords.current = '';
    passwords.new = '';
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || pwdEditFail.value);
  }
};

const handleDeleteAccount = () => {
  ElMessageBox.confirm(delConfirmMsg.value, highWarm.value, {
    confirmButtonText: delButtonTxt.value,
    cancelButtonText: cancelTxt.value,
    type: 'error',
    customClass: 'nexus-messagebox',
  }).then(async () => {
    try {
      await deleteAccount();
      ElMessage.success(acCancelMsg.value);
      userStore.logout(); // 清理前端状态
      router.push('/login'); // 跳转到登录页
    } catch (error) {
      ElMessage.error(acCancelFail.value);
    }
  }).catch(() => {});
};
</script>

<style scoped>
/* --- [核心] 将您提供的所有 CSS 样式复制到这里 --- */
#account-panel { 

}
#preferences-panel { 

}
.settings-page-container { 
  height: 100%; 
}
.page-header { 
  font-size: 32px; 
  font-weight: 700; 
  margin-bottom: 30px; 
}
.settings-container { 
  display: grid; 
  grid-template-columns: 250px 1fr; 
  gap: 40px; 
  height: calc(100% - 70px); 
}
.settings-tree { 
  list-style: none; 
  padding: 0; 
}
.tree-item { 
  position: relative; 
  padding: 12px 0 12px 30px; 
}
.tree-item::before { 
  content: ''; 
  position: absolute; 
  left: 10px; 
  top: 0; 
  width: 2px; 
  height: 100%; 
  background-color: var(--border-color); 
  transition: background-color 0.3s; 
}
.tree-item::after { 
  content: ''; 
  position: absolute; 
  left: 10px; 
  top: 22px; 
  width: 15px; 
  height: 2px; 
  background-color: var(--border-color); 
  transition: background-color 0.3s; 
}
.tree-item:first-child::before { 
  top: 22px; 
  height: calc(100% - 22px); 
}
.tree-item:last-child::before { 
  height: 22px; 
}
.tree-link { 
  text-decoration: none; 
  color: var(--text-secondary); 
  font-weight: 500; 
  transition: color 0.3s; 
  cursor: pointer; 
}
.tree-link:hover { 
  color: var(--text-primary); 
}
.tree-item.active .tree-link { 
  color: var(--active-glow); 
}
.tree-item.active::before, .tree-item.active::after { 
  background-color: var(--active-glow); 
}
.tree-item.danger .tree-link:hover { 
  color: #E53935; 
}
.tree-item.danger.active .tree-link { 
  color: #E53935; 
}
.tree-item.danger.active::before, .tree-item.danger.active::after { 
  background-color: #E53935; 
}
.settings-panels { 
  position: relative; 
}
.setting-panel {
    position: absolute; width: 100%;
    background-color: var(--panel-bg); backdrop-filter: blur(10px);
    border: 1px solid var(--border-color); border-radius: 12px; padding: 24px;
    opacity: 0; visibility: hidden;
    transform: translateY(10px);
    transition: opacity 0.4s, transform 0.4s, visibility 0.4s;
    right: 90px;
}
.setting-panel.active { 
  opacity: 1; visibility: visible; 
  transform: translateY(0); 
}
.module-header { 
  padding-bottom: 16px; 
  margin-bottom: 20px; 
  border-bottom: 1px solid var(--border-color); 
}
.module-title { 
  font-size: 20px; 
  font-weight: 700; 
}
.module-description { 
  font-size: 14px; 
  color: var(--text-secondary); 
  margin-top: 4px; 
}
.setting-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  gap: 20px; 
}
.setting-item:not(:last-child) { 
  margin-bottom: 20px; 
}
.form-input, .form-select { 
  background-color: rgba(0,0,0,0.2); 
  border: 1px solid var(--border-color); 
  border-radius: 6px; 
  padding: 10px 12px; 
  color: var(--text-primary);  
  min-width: 250px; 
}
.form-input:focus, .form-select:focus { 
  outline: none; 
  border-color: var(--active-glow); 
}
.btn { 
  padding: 10px 20px; 
  border: none; 
  border-radius: 6px; 
  font-weight: 500; 
  font-size: 14px; 
  cursor: pointer; 
  transition: all 0.3s; 
}
.btn-primary { 
  background-color: var(--active-glow); 
  color: white; 
}
.btn-danger { 
  background-color: #E53935; 
  color: white; 
}
.form-select :deep(.el-input__wrapper) {
  background-color: rgba(0,0,0,0.2) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: none !important;
}
.form-select :deep(.el-input__inner) {
  color: var(--text-primary) !important;
}

.setting-item > .module-description {
  width: 100%;
  text-align: right;
  font-size: 12px;
}

/* [核心] 新增样式 */
.divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 30px 0;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-secondary);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 14px;
  font-weight: 500;
}
.contact-form .form-input {
  /* 复用已有样式，但确保宽度和对齐 */
  width: 100%;
  min-width: 0;
  text-align: left;
}
textarea.form-input {
  resize: vertical;
}

.form-status {
  text-align: center;
  font-size: 14px;
  margin-top: 8px;
}
.form-status.success { color: #4caf50; }
.form-status.error { color: #f44336; }
.form-status.info { color: var(--text-secondary); }
</style>