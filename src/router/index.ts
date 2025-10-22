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
const ChatReview = () => import('../views/ChatReview.vue');
const ClueSheetReview = () => import('../views/ClueSheetReview.vue');
const TutorialView = () => import('../views/TutorialView.vue');
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
      { 
        path: 'chat-history/:id', // 动态路由，匹配 session_id
        name: 'ChatReview', 
        component: ChatReview 
      },
      { 
        path: 'clue-sheets/:id', // 动态路由，匹配 clue_sheet_id
        name: 'ClueSheetReview', 
        component: ClueSheetReview 
      },
      {
        path: 'workspaces/:workspaceId/tutorial', // 使用 workspaceId 动态路由
        name: 'TutorialView',
        component: TutorialView,
        props: true // 允许将路径参数 :workspaceId 作为 props 传入组件
      },
      {
        // 我们合并两个路径，通过 props 来区分
        path: '/workspace/:workspaceId/tutorial/:tutorialId?', // tutorialId 设为可选
        name: 'TutorialView',
        component: () => import('../views/TutorialView.vue'),
        props: true 
      },
      // **方案B (更清晰): 为历史回顾创建一个专门的路由**
      {
        path: '/tutorials/:tutorialId', // 新的路径
        name: 'TutorialDetail',        // 新的、专门的名字
        component: () => import('../views/TutorialView.vue'),
        props: true // **关键：将路径参数 :tutorialId 映射为组件的 props**
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

// [核心最终修正] 添加详细的调试日志
router.beforeEach((to, from, next) => {
  console.log(`--- [Router Guard] Navigating ---`);
  console.log(`From: ${from.path}`);
  console.log(`To: ${to.path}`);

  // 关键：在守卫内部获取 store 的最新状态
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;
  console.log(`isLoggedIn status: ${isLoggedIn}`);

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  console.log(`Route requires auth: ${requiresAuth}`);

  if (requiresAuth && !isLoggedIn) {
    console.log("[Router Guard Decision]: Redirecting to /login (auth required but not logged in).");
    next({ name: 'Login' });
  } else if ((to.name === 'Login' || to.name === 'Register') && isLoggedIn) {
    console.log("[Router Guard Decision]: Redirecting to /dashboard (already logged in).");
    next({ name: 'Dashboard' });
  } else {
    console.log("[Router Guard Decision]: Allowing navigation.");
    next(); // 正常放行
  }
});

export default router;