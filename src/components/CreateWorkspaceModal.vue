<template>
  <el-dialog
    v-model="isDialogVisible"
    :title="createNewWorkspace"
    width="500"
    center
    :modal-class="'nexus-dialog-modal'"
    class="nexus-dialog"
    id="nexus-dialog"
  >
    <!-- [核心] 添加名稱和描述輸入框 -->
    <div class="form-content">
      <el-input
        v-model="workspaceName"
        :placeholder="enterNewWorkspaceName"
        size="large"
        class="nexus-input"
      />
      <el-input
        v-model="workspaceDescription"
        type="textarea"
        :rows="3"
        :placeholder="enterDescription"
        size="large"
        class="nexus-input"
      />
    </div>

    <template #footer>
      <!-- [核心] 使用自定義樣式的按鈕 -->
      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="closeDialog">{{ $t('createWorkspace.cancel') }}</button>
        <button class="btn btn-confirm" @click="confirmCreate">{{ $t('createWorkspace.confirmCreate') }}</button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElDialog, ElInput } from 'element-plus';
import { useI18n } from 'vue-i18n';

const workspaceName = ref('');
const workspaceDescription = ref(''); // 新增描述的 ref
const isDialogVisible = ref(false);

const { t } = useI18n();

const createNewWorkspace = computed(() => t('createWorkspace.createNewWorkspace'));
const enterNewWorkspaceName = computed(() => t('createWorkspace.enterNewWorkspaceName'));
const enterDescription = computed(() => t('createWorkspace.enterDescription'));

const emit = defineEmits(['confirm']);

const openDialog = () => {
  workspaceName.value = '';
  workspaceDescription.value = ''; // 重置描述
  isDialogVisible.value = true;
};

const closeDialog = () => {
  isDialogVisible.value = false;
};

const confirmCreate = () => {
  if (workspaceName.value.trim()) {
    // [核心] 傳遞包含名稱和描述的對象
    emit('confirm', { 
      name: workspaceName.value, 
      description: workspaceDescription.value 
    });
    closeDialog();
  }
};

defineExpose({ openDialog });
</script>

<style>
/* 
  使用非 scoped 或 :global 樣式，因為 ElDialog 的部分元素在 #app 層級渲染 
*/
.nexus-dialog-modal {
  backdrop-filter: blur(5px);
}
.nexus-dialog {
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 20px var(--active-bg);
}
.nexus-dialog .el-dialog__title {
  color: var(--text-primary) !important;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 700;
}
.nexus-dialog .el-dialog__headerbtn .el-icon { color: var(--text-primary); }
.nexus-dialog .el-dialog__body {
  padding-top: 10px;
  padding-bottom: 20px;
}
.form-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.nexus-dialog .nexus-input .el-input__wrapper {
  background-color: rgba(0,0,0,0.2) !important;
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  /* 关键：设置一个统一的内边距，让 placeholder 从顶部对齐 */
  padding: 8px 15px !important;
  height: auto !important; /* 允许高度自适应 */
}
.nexus-dialog .nexus-input .el-textarea__inner {
  background-color: rgba(0,0,0,0.2) !important;
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 15px !important; /* 与单行输入框保持一致 */
}
.nexus-dialog .nexus-input .el-input__wrapper:hover,
.nexus-dialog .nexus-input .el-textarea__inner:hover {
  border-color: var(--active-glow);
}
.nexus-dialog .nexus-input .el-input__inner {
  height: 24px; /* 确保单行输入框有足够的高度 */
  color: var(--text-primary);
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
.btn-cancel:hover {
  background-color: var(--active-bg);
  color: var(--text-primary);
}
.btn-confirm {
  background-color: var(--active-glow);
  color: var(--text-primary);
}
.btn-confirm:hover {
  filter: brightness(1.2);
  box-shadow: 0 0 10px var(--active-glow);
}
@media (max-width: 768px) {
  #nexus-dialog {
    width: 400px;
  }
}
</style>