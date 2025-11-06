<template>
  <div class="planning-generator-container">
    <header class="page-header">
      <h1 class="page-title">{{ $t('planning.title') }}</h1>
      <p class="page-description">{{ $t('planning.description') }}</p>
    </header>

    <div class="wizard-panel">
      <!-- [核心修正] 增加到 5 个步骤 -->
      <el-steps :active="activeStep" finish-status="success" simple class="wizard-steps desktop-view">
        <el-step :title="$t('planning.step1_title')" />
        <el-step :title="$t('planning.step2_title')" />
        <el-step :title="$t('planning.step3_title_new')" />
        <el-step :title="$t('planning.step4_title_new')" /> <!-- 新标题：字数 -->
        <el-step :title="$t('planning.step5_title_new')" /> <!-- 新标题：风格 -->
        <el-step :title="$t('planning.step6_title')" /> <!-- 新标题：知识源 -->
      </el-steps>

      <!-- 2. [核心修正] 移動端原生實現的步驟條 (仅移动端显示) -->
      <div class="mobile-steps-wrapper mobile-view">
        <div 
          v-for="(step, index) in steps" 
          :key="step" 
          class="mobile-step"
          :class="{ 'active': activeStep === index, 'completed': activeStep > index }"
        >
          {{ step }}
        </div>
      </div>

      <div class="form-content">
        <!-- 步驟 1: 方案類型 -->
        <div v-show="activeStep === 0" class="step-panel">
          <h3 class="step-question">{{ $t('planning.step1_question') }}</h3>
          <el-radio-group v-model="formData.plan_type" class="radio-group-vertical">
            <el-radio label="學術報告" size="large" border>學術報告</el-radio>
            <el-radio label="產品宣傳方案" size="large" border>產品宣傳方案</el-radio>
            <el-radio label="商業計劃書" size="large" border>商業計劃書</el-radio>
            <el-radio label="研究提案" size="large" border>研究提案</el-radio>
          </el-radio-group>
        </div>

        <!-- 步驟 2: 目標 & 風格 -->
        <div v-show="activeStep === 1" class="step-panel">
          <el-form-item :label="$t('planning.step2_question_audience')" required>
            <el-input class="text" v-model="formData.target_audience" placeholder="例如：教授、投資者、市場部同事" />
          </el-form-item>
          <el-form-item :label="$t('planning.step2_question_objective')" required>
            <el-input class="text" v-model="formData.core_objective" placeholder="例如：獲得A+成績、爭取種子輪投資" />
          </el-form-item>
        </div>

        <!-- 步驟 3: 內容大綱 -->
        <div v-show="activeStep === 2" class="step-panel">
          <el-form-item :label="$t('planning.step3_question_outline')" required>
             <template #label>
                <span>{{ $t('planning.step3_question_outline') }}</span>
            </template>
            <el-input 
              v-model="formData.outline" 
              type="textarea" 
              :rows="15" 
              :placeholder="$t('planning.step3_placeholder_outline')" 
            />
          </el-form-item>
        </div>

        <!-- [核心修正] 新增步驟 4: 期望字数 -->
        <div v-show="activeStep === 3" class="step-panel">
          <el-form-item :label="$t('planning.step4_question_word_count')">
             <template #label>
                <span>{{ $t('planning.step4_question_word_count') }}</span>
                <span class="optional-label"> ({{ $t('common.optional') }})</span>
            </template>
            <el-input-number v-model="formData.word_count" :min="100" :step="100" controls-position="right" style="width: 100%;" />
          </el-form-item>
        </div>

        <!-- 步驟 5: 風格 & 額外要求 -->
        <div v-show="activeStep === 4" class="step-panel">
          <h3 class="step-question">{{ $t('planning.step3_question_tone') }}</h3>
          <el-radio-group v-model="formData.tone_style">
            <el-radio label="專業學術">專業學術</el-radio>
            <el-radio label="輕鬆有趣">輕鬆有趣</el-radio>
            <el-radio label="正式商業">正式商業</el-radio>
            <el-radio label="客觀中立">客觀中立</el-radio>
          </el-radio-group>
          <el-form-item :label="$t('planning.step3_question_extra')">
            <template #label>
                <span>{{ $t('planning.step3_question_extra') }}</span>
                <span class="optional-label"> ({{ $t('common.optional') }})</span>
            </template>
            <el-input v-model="formData.additional_requirements" type="textarea" :rows="5" :placeholder="$t('planning.step3_placeholder_extra')" />
          </el-form-item>
        </div>
        
        <!-- 步驟 6: 選擇工作台 -->
        <div v-show="activeStep === 5" class="step-panel">
           <h3 class="step-question">{{ $t('planning.step4_question_workspace') }}</h3>
           <p class="step-description">{{ $t('planning.step4_description') }}</p>
            <el-select 
            v-model="selectedWorkspaceId" 
            :placeholder="$t('planning.selectWorkspacePlaceholder')" 
            filterable 
            style="width: 100%;"
            >
                <!-- 手动添加的“不使用工作台”选项 -->
                <el-option 
                :label="$t('planning.noWorkspaceOption')" 
                value="null" 
                />
                <!-- 循环渲染用户的工作台列表 -->
                <el-option 
                v-for="ws in workspaces" 
                :key="ws.id" 
                :label="ws.name" 
                :value="ws.id" 
                />
            </el-select>
        </div>
      </div>

      <div class="navigation-buttons">
        <el-button @click="prevStep" v-if="activeStep > 0">{{ $t('common.previous_step') }}</el-button>
        <el-button type="primary" @click="nextStep" v-if="activeStep < 5">{{ $t('common.next_step') }}</el-button>
        <el-button 
          type="success" 
          @click="submit" 
          v-if="activeStep === 5"
          :disabled="!isSubmittable"
          :loading="isGenerating"
        >
          {{ $t('planning.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElSteps, ElStep, ElRadioGroup, ElRadio, ElInput, ElButton, ElFormItem, ElSelect, ElOption, ElMessage, ElInputNumber } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getWorkspaces, type Workspace } from '../api/workspaces';
import { generatePlanningDocument, generatePlanningFromScratch } from '../api/ai';
import type { GeneratePlanningRequest } from '../api/ai';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const activeStep = ref(0);
const isGenerating = ref(false);

const steps = computed(() => [
  t('planning.step1_title'),
  t('planning.step2_title'),
  t('planning.step3_title_new'),
  t('planning.step4_title_new'),
  t('planning.step5_title_new'),
  t('planning.step6_title'),
]);

const formData = reactive({
  plan_type: '學術報告',
  target_audience: '',
  core_objective: '',
  tone_style: '專業學術',
  outline: '',
  word_count: undefined as number | undefined,
  additional_requirements: ''
});

const workspaces = ref<Workspace[]>([]);
const selectedWorkspaceId = ref<number | null>(null);

onMounted(async () => {
    try {
        workspaces.value = await getWorkspaces();
    } catch (error) {
        ElMessage.error(t('errors.fetchWorkspacesFailed'));
    }
});

const isSubmittable = computed(() => {
    return formData.plan_type 
        && formData.target_audience.trim() // 使用 trim() 避免纯空格
        && formData.core_objective.trim()
        && formData.outline.trim() // <-- 新增的验证条件
        && formData.tone_style 
        && selectedWorkspaceId.value !== undefined; // 注意：这里判断 undefined，允许 null
});

const nextStep = () => {
    if (activeStep.value === 1 && !formData.target_audience.trim()) {
        ElMessage.warning(t('planning.purposeRequiredError'));
        return; // 如果大纲为空，则阻止进入下一步
    }

    if (activeStep.value === 1 && !formData.core_objective.trim()) {
        ElMessage.warning(t('planning.purposeRequiredError'));
        return; // 如果大纲为空，则阻止进入下一步
    }

    // [核心修正] 在进入下一步之前，增加对当前步骤的验证
    if (activeStep.value === 2 && !formData.outline.trim()) {
        ElMessage.warning(t('planning.outlineRequiredError'));
        return; // 如果大纲为空，则阻止进入下一步
    }

    if (activeStep.value < 5) activeStep.value++;
};

const prevStep = () => {
  if (activeStep.value > 0) activeStep.value--;
};

const submit = async () => {
  if (!isSubmittable.value) return;
  isGenerating.value = true;
  try {
    let response;
    // 將 formData 轉換為請求體
    const requestData: GeneratePlanningRequest = { ...formData };

    // **這是關鍵的判斷邏輯**
    if (selectedWorkspaceId.value) {
      // 情況一：用戶選擇了工作台，調用基於知識庫的 API
      console.log(`Submitting with Workspace ID: ${selectedWorkspaceId.value}`);
      response = await generatePlanningDocument(selectedWorkspaceId.value, requestData);
    } else {
      // 情況二：用戶沒有選擇工作台，調用“從零開始”的 API
      console.log("Submitting from scratch (no workspace).");
      response = await generatePlanningFromScratch(requestData);
    }
    
    // 生成成功後，跳轉到結果頁面，並通過 router state 傳遞結果
    // 這避免了將大量文本放在 URL 中
    router.push({
      name: 'ContentViewer', // 我們將創建的新路由名稱
      state: { 
        title: t('planning.resultTitle', { type: formData.plan_type }),
        content: response.content,
        workspaceId: selectedWorkspaceId.value
      }
    });

  } catch (error) {
    ElMessage.error(t('errors.generationFailed'));
    console.error("Planning generation failed:", error);
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
/* --- 基礎佈局 --- */
.planning-generator-container { padding: 16px; }
.page-header { margin-bottom: 24px; text-align: center; }
.page-title { font-size: 24px; font-weight: 600; }
.page-description { font-size: 14px; color: var(--text-secondary); margin-top: 8px; max-width: 400px; margin-left: auto; margin-right: auto; }
.form-content { min-height: calc(100vh - 320px); }
.step-panel { display: flex; flex-direction: column; gap: 24px; }
.step-question { font-size: 18px; font-weight: 500; text-align: center; }
.step-description { color: var(--text-secondary); text-align: center; margin-top: -16px; }
.optional-label { color: var(--text-secondary); font-size: 0.9em; font-weight: 400; margin-left: 8px; }

/* --- 表單元素通用美化 --- */
:deep(.el-form-item__label) { color: var(--text-primary) !important; margin-bottom: 8px !important; line-height: 1.5 !important; }
:deep(.el-input__wrapper), :deep(.el-textarea__inner), :deep(.el-select .el-input__wrapper), :deep(.el-input-number) { background-color: var(--card-bg) !important; box-shadow: none !important; border: 1px solid var(--border-color) !important; border-radius: 8px !important; width: 100% !important; }
:deep(.el-radio.is-bordered) { background-color: var(--card-bg); border-color: var(--border-color); border-radius: 8px; }
:deep(.el-radio.is-bordered.is-checked) { border-color: var(--active-glow); }
:deep(.el-radio__label) { color: var(--text-secondary); }
:deep(.el-radio__input.is-checked + .el-radio__label) { color: var(--active-glow); }
.radio-group-horizontal { display: flex; flex-wrap: wrap; gap: 12px; }

/* --- 移動端樣式 (圖三) --- */
@media (max-width: 768px) {
  .desktop-view { display: none; }

  .wizard-panel { background: transparent; border: none; padding: 0; }
  .form-content { margin-top: 32px; }

  /* [核心修正] 原生實現的膠囊式步驟條 */
  .mobile-steps-wrapper {
    display: flex;
    justify-content: space-between;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 999px;
    padding: 6px;
  }
  .mobile-step {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    padding: 8px 12px;
    border-radius: 999px;
    transition: all 0.3s;
  }
  .mobile-step.active {
    background-color: var(--active-bg);
    color: var(--text-primary);
    font-weight: 600;
  }
  .mobile-step.completed {
    /* 如果需要，可以為已完成的步驟添加樣式，例如半透明 */
    opacity: 0.7;
  }

  /* 卡片式 Radio */
  .radio-group-vertical { display: flex; flex-direction: column; gap: 16px; }
  .radio-group-vertical :deep(.el-radio) { width: 100%; height: auto; margin: 0; padding: 20px; border-radius: 12px; }
  .radio-group-vertical :deep(.el-radio__input) { display: none; }
  .radio-group-vertical :deep(.el-radio__label) { font-size: 16px; font-weight: 500; color: var(--text-primary); padding: 0; }
  .radio-group-vertical :deep(.el-radio.is-checked) { border-color: var(--active-glow); background-color: var(--active-bg); box-shadow: 0 0 15px var(--active-bg); }
  
  /* 底部導航按鈕 */
  .navigation-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; padding-top: 24px; border-top: 1px solid var(--border-color); }
  .nav-btn { width: 100%; padding: 12px 0; font-size: 16px; font-weight: 500; height: auto; }
  .prev-btn { background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-secondary); }
  .next-btn, .submit-btn { border: none; }
  .navigation-buttons:has(.submit-btn:first-child) { grid-template-columns: 1fr; }
  
  :deep(.el-form-item) { display: flex; flex-direction: column; }
  :deep(.el-form-item__label) { justify-content: flex-start; text-align: left; }
  :deep(.el-form-item__content) { width: 100%; margin-left: 0 !important; }
}

/* --- 桌面端樣式 (圖一) --- */
@media (min-width: 769px) {
  .mobile-view { display: none; }

  .planning-generator-container { padding: 24px; }
  .page-header { text-align: left; }
  .page-title { font-size: 28px; }
  .page-description { margin-left: 0; max-width: none; }

  .wizard-panel { background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; }
  .wizard-steps { margin-bottom: 32px; }
  .form-content { padding: 16px; min-height: 300px; }
  
  .radio-group-vertical { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .navigation-buttons { display: flex; justify-content: center; gap: 16px; }
  .nav-btn { width: auto; }
}
</style>

<style>
/* --- [核心最终修正] 全局自定义滚动条样式 --- */

/* 
  我们为所有可能出现滚动条的 `.main-content` 区域
  以及其内部的元素定义统一的滚动条样式
*/
.main-content ::-webkit-scrollbar {
  width: 8px;
  height: 8px; /* 同时美化水平滚动条 */
}

.main-content ::-webkit-scrollbar-track {
  /* 轨道背景：设置为透明 */
  background: transparent;
}

.main-content ::-webkit-scrollbar-thumb {
  /* 滑块本身 */
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
  
  /* 添加一个最小高度，防止滑块变得过小 */
  min-height: 30px;
}

.main-content ::-webkit-scrollbar-thumb:hover {
  /* 鼠标悬停在滑块上时 */
  background-color: rgba(255, 255, 255, 0.4);
}
</style>