import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user'; // 導入 user store

// 懶加載導入頁面組件
import MainLayout from '../layouts/MainLayout.vue';
// 導入登入頁面組件
const Login = () => import('../views/Login.vue');
// 導入注冊頁面組件
const Register = () => import('../views/Register.vue');
// 導入操作頁頁面組件
const Dashboard = () => import('../views/Dashboard.vue');
// 導入工作台頁面組件
const WorkspaceList = () => import('../views/WorkspaceList.vue');
const WorkspaceDetail = () => import('../views/WorkspaceDetail.vue');
// 導入文件頁面組件
const Files = () => import('../views/Files.vue');
// 導入歷史回顧頁面組件
const History = () => import('../views/History.vue');
const QuizReview = () => import('../views/QuizReview.vue');
const NoteReview = () => import('../views/NoteReview.vue');
const GraphReview = () => import('../views/GraphReview.vue');
// 導入探索工具頁面組件
const Tools = () => import('../views/Tools.vue');
// 導入設置頁面組件
const Settings = () => import('../views/Settings.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  // 需要主佈局的頁面
  {
    path: '/',
    component: MainLayout, // 使用 MainLayout 作為父級組件
    redirect: '/dashboard',
    meta: { requiresAuth: true }, // 在父級路由上添加守衛
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
      },
      // 工作台相關路由
      {
        path: 'workspaces', // 列表頁的路徑
        name: 'WorkspaceList',
        component: WorkspaceList,
      },
      {
        path: 'workspaces/:id', // 詳情頁的動態路徑
        name: 'WorkspaceDetail',
        component: WorkspaceDetail,
      },
      { path: 'files', 
        name: 'Files', 
        component: Files, 
      },
      { path: 'history', 
        name: 'History', 
        component: History,
      },
      { 
        path: 'quiz-history/:id', // 动态路由，匹配 session_id
        name: 'QuizReview', 
        component: QuizReview 
      },
      { 
        path: 'notes/:id', // 动态路由，匹配 note_id
        name: 'NoteReview', 
        component: NoteReview 
      },
      { 
        path: 'knowledge-graphs/:id', // 动态路由，匹配 graph_id
        name: 'GraphReview', 
        component: GraphReview 
      },
      { path: 'tools', 
        name: 'Tools', 
        component: Tools, 
      },
      { path: 'settings',
        name: 'Settings', 
        component: Settings, 
      },
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置導航守衛
router.beforeEach((to, from, next) => {
  // **關鍵：必須在守衛內部獲取 store 實例**
  // 因為 Pinia 實例在 router 創建之後才被掛載到 app 上
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isLoggedIn) {
    // 如果目標路由需要認證，但用戶未登錄
    // 則重定向到登錄頁
    next({ name: 'Login' });
  } else if ((to.name === 'Login' || to.name === 'Register') && isLoggedIn) {
    // 如果用戶已登錄，但試圖訪問登錄或註冊頁
    // 則重定向到儀表盤
    next({ name: 'Dashboard' });
  } else {
    // 其他情況，正常放行
    next();
  }
});

export default router;