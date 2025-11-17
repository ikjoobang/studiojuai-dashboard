import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ===== 데모 데이터 =====

// 작업 데이터
const demoTasks = [
  {
    id: '1',
    client_id: '1',
    client_name: '카페 더 라운지',
    title: '신메뉴 프로모션 영상',
    description: '봄 시즌 신메뉴 론칭 프로모션용 숏폼 영상 제작',
    prompt: 'A cozy modern cafe interior showcasing new spring menu items with pastel colors and warm lighting, targeting 20-30s female audience, friendly and comfortable tone.',
    status: 'in_progress',
    package_id: 'B',
    created_at: '2025-11-15',
    due_date: '2025-11-20'
  },
  {
    id: '2',
    client_id: '2',
    client_name: '김민지',
    title: '뷰티 튜토리얼 콘텐츠',
    description: '가을 메이크업 튜토리얼 영상 - 데일리 룩',
    prompt: 'A trendy and lively beauty tutorial showing autumn makeup look, targeting 10-20s audience, fun and friendly tone with vibrant colors.',
    status: 'completed',
    package_id: 'A',
    created_at: '2025-11-10',
    due_date: '2025-11-17',
    completed_at: '2025-11-16'
  },
  {
    id: '3',
    client_id: '1',
    client_name: '카페 더 라운지',
    title: '고객 후기 영상',
    description: '단골 고객 인터뷰 및 매장 분위기 촬영',
    prompt: '',
    status: 'pending',
    package_id: 'B',
    created_at: '2025-11-17',
    due_date: '2025-11-25'
  },
  {
    id: '4',
    client_id: '3',
    client_name: '피트니스 헬스클럽',
    title: '회원 모집 광고',
    description: '11월 회원 모집 이벤트 광고 영상',
    prompt: 'A dynamic and professional fitness club promotional video showing workout sessions, targeting 20-40s, motivating tone with energetic music.',
    status: 'pending',
    package_id: 'C',
    created_at: '2025-11-17',
    due_date: '2025-11-22'
  }
];

// 고객 데이터
const demoClients = [
  {
    id: '1',
    name: '카페 더 라운지',
    type: 'brand',
    category: '카페/음료',
    package_id: 'B',
    username: 'cafe_lounge',
    status: 'active',
    channels: {
      instagram: '@cafe_lounge',
      naver_blog: 'https://blog.naver.com/cafe_lounge'
    },
    brand_info: {
      industry: '카페',
      target_audience: '20-30대 여성',
      style: ['모던', '감성적'],
      tone: '친근하고 편안한'
    },
    created_at: '2025-01-10'
  },
  {
    id: '2',
    name: '김민지',
    type: 'individual',
    category: '뷰티/패션',
    package_id: 'A',
    username: 'minji_beauty',
    status: 'active',
    channels: {
      instagram: '@minji_beauty',
      youtube: 'https://youtube.com/@minjibeauty',
      tiktok: '@minji_beauty_official'
    },
    brand_info: {
      industry: '뷰티 크리에이터',
      target_audience: '10-20대',
      style: ['트렌디', '발랄'],
      tone: '친근하고 재미있는'
    },
    created_at: '2025-01-15'
  },
  {
    id: '3',
    name: '피트니스 헬스클럽',
    type: 'brand',
    category: '건강/운동',
    package_id: 'C',
    username: 'fitness_club',
    status: 'paused',
    channels: {
      instagram: '@fitness_healthclub'
    },
    brand_info: {
      industry: '피트니스',
      target_audience: '20-40대',
      style: ['역동적', '전문적'],
      tone: '동기부여하는'
    },
    created_at: '2025-01-05'
  }
];

// ===== API 라우트 =====

// 고객 목록 조회
app.get('/api/clients', (c) => {
  const type = c.req.query('type');
  const status = c.req.query('status');
  
  let filtered = [...demoClients];
  
  if (type) {
    filtered = filtered.filter(client => client.type === type);
  }
  
  if (status) {
    filtered = filtered.filter(client => client.status === status);
  }
  
  return c.json({
    success: true,
    data: filtered,
    total: filtered.length
  });
});

// 고객 상세 조회
app.get('/api/clients/:id', (c) => {
  const id = c.req.param('id');
  const client = demoClients.find(c => c.id === id);
  
  if (!client) {
    return c.json({
      success: false,
      message: '고객을 찾을 수 없습니다.'
    }, 404);
  }
  
  return c.json({
    success: true,
    data: client
  });
});

// 고객 생성
app.post('/api/clients', async (c) => {
  try {
    const body = await c.req.json();
    
    const newClient = {
      id: String(demoClients.length + 1),
      ...body,
      status: 'active',
      created_at: new Date().toISOString().split('T')[0]
    };
    
    demoClients.push(newClient);
    
    return c.json({
      success: true,
      data: newClient,
      message: '고객이 추가되었습니다.'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      message: '고객 추가에 실패했습니다.'
    }, 500);
  }
});

// 고객 수정
app.put('/api/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const index = demoClients.findIndex(client => client.id === id);
    
    if (index === -1) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    demoClients[index] = {
      ...demoClients[index],
      ...body
    };
    
    return c.json({
      success: true,
      data: demoClients[index],
      message: '고객 정보가 수정되었습니다.'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '고객 수정에 실패했습니다.'
    }, 500);
  }
});

// 고객 삭제
app.delete('/api/clients/:id', (c) => {
  const id = c.req.param('id');
  const index = demoClients.findIndex(client => client.id === id);
  
  if (index === -1) {
    return c.json({
      success: false,
      message: '고객을 찾을 수 없습니다.'
    }, 404);
  }
  
  demoClients.splice(index, 1);
  
  return c.json({
    success: true,
    message: '고객이 삭제되었습니다.'
  });
});

// 프롬프트 생성 (GPT-4 Mini 연동 예정)
app.post('/api/prompts/generate', async (c) => {
  try {
    const { client_id, request } = await c.req.json();
    
    const client = demoClients.find(cl => cl.id === client_id);
    
    if (!client) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    // TODO: OpenAI API 연동
    const generatedPrompt = `A ${client.brand_info.style.join(' and ')} ${client.brand_info.industry} video showing ${request}, targeting ${client.brand_info.target_audience}, with a ${client.brand_info.tone} tone.`;
    
    return c.json({
      success: true,
      prompt: generatedPrompt,
      message: '프롬프트가 생성되었습니다.'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '프롬프트 생성에 실패했습니다.'
    }, 500);
  }
});

// ===== 작업 관리 API =====

// 작업 목록 조회
app.get('/api/tasks', (c) => {
  const client_id = c.req.query('client_id');
  const status = c.req.query('status');
  
  let filtered = [...demoTasks];
  
  if (client_id) {
    filtered = filtered.filter(task => task.client_id === client_id);
  }
  
  if (status) {
    filtered = filtered.filter(task => task.status === status);
  }
  
  return c.json({
    success: true,
    data: filtered,
    total: filtered.length
  });
});

// 작업 상세 조회
app.get('/api/tasks/:id', (c) => {
  const id = c.req.param('id');
  const task = demoTasks.find(t => t.id === id);
  
  if (!task) {
    return c.json({
      success: false,
      message: '작업을 찾을 수 없습니다.'
    }, 404);
  }
  
  return c.json({
    success: true,
    data: task
  });
});

// 작업 생성
app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    
    const newTask = {
      id: String(demoTasks.length + 1),
      ...body,
      status: 'pending',
      created_at: new Date().toISOString().split('T')[0]
    };
    
    demoTasks.push(newTask);
    
    return c.json({
      success: true,
      data: newTask,
      message: '작업이 추가되었습니다.'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      message: '작업 추가에 실패했습니다.'
    }, 500);
  }
});

// 작업 수정
app.put('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const index = demoTasks.findIndex(task => task.id === id);
    
    if (index === -1) {
      return c.json({
        success: false,
        message: '작업을 찾을 수 없습니다.'
      }, 404);
    }
    
    demoTasks[index] = {
      ...demoTasks[index],
      ...body
    };
    
    return c.json({
      success: true,
      data: demoTasks[index],
      message: '작업 정보가 수정되었습니다.'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '작업 수정에 실패했습니다.'
    }, 500);
  }
});

// 작업 삭제
app.delete('/api/tasks/:id', (c) => {
  const id = c.req.param('id');
  const index = demoTasks.findIndex(task => task.id === id);
  
  if (index === -1) {
    return c.json({
      success: false,
      message: '작업을 찾을 수 없습니다.'
    }, 404);
  }
  
  demoTasks.splice(index, 1);
  
  return c.json({
    success: true,
    message: '작업이 삭제되었습니다.'
  });
});

// ===== 페이지 라우트 =====

// 업체 관리 페이지
app.get('/brands', (c) => {
  return c.redirect('/?type=brand');
});

// 개인 관리 페이지
app.get('/individuals', (c) => {
  return c.redirect('/?type=individual');
});

// 작업 관리 페이지
app.get('/tasks', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudioJuAI - 작업 관리</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        
        * {
            font-family: 'Noto Sans KR', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .glass-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .sidebar {
            background: rgba(26, 26, 46, 0.8);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-item {
            transition: all 0.3s ease;
        }
        
        .sidebar-item:hover {
            background: rgba(255, 255, 255, 0.05);
            padding-left: 2rem;
        }
        
        .sidebar-item.active {
            background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%);
            border-left: 3px solid #667eea;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .status-pending {
            background: rgba(234, 179, 8, 0.2);
            color: #fbbf24;
        }
        
        .status-in_progress {
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
        }
        
        .status-completed {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }
        
        .status-pending .status-dot {
            background: #fbbf24;
        }
        
        .status-in_progress .status-dot {
            background: #60a5fa;
        }
        
        .status-completed .status-dot {
            background: #4ade80;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .filter-btn {
            transition: all 0.3s ease;
        }
        
        .filter-btn:hover {
            transform: translateY(-2px);
        }
        
        /* Modal styles */
        .modal-content {
            background: white;
        }
        
        .modal-label {
            color: #374151;
            font-weight: 500;
        }
        
        .modal-input {
            background: #f9fafb;
            border: 1px solid #d1d5db;
            color: #111827;
        }
        
        .modal-input:focus {
            outline: none;
            border-color: #3b82f6;
            ring: 2px;
            ring-color: rgba(59, 130, 246, 0.2);
        }
        
        .modal-textarea {
            background: #f9fafb;
            border: 1px solid #d1d5db;
            color: #111827;
            min-height: 100px;
        }
        
        .modal-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            ring: 2px;
            ring-color: rgba(59, 130, 246, 0.2);
        }
    </style>
</head>
<body>
    <div class="flex h-screen">
        <!-- Sidebar -->
        <aside class="sidebar w-64 p-6 flex flex-col">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-white">StudioJuAI</h1>
                <p class="text-gray-400 text-sm mt-1">Dashboard</p>
            </div>
            
            <nav class="flex-1">
                <a href="/" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
                    <i class="fas fa-home w-5"></i>
                    <span>대시보드</span>
                </a>
                <a href="/brands" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
                    <i class="fas fa-building w-5"></i>
                    <span>업체 관리</span>
                </a>
                <a href="/individuals" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
                    <i class="fas fa-user w-5"></i>
                    <span>개인 관리</span>
                </a>
                <a href="/tasks" class="sidebar-item active flex items-center gap-3 px-4 py-3 rounded-lg text-white mb-2">
                    <i class="fas fa-tasks w-5"></i>
                    <span>작업 관리</span>
                </a>
            </nav>
            
            <button onclick="logout()" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition">
                <i class="fas fa-sign-out-alt w-5"></i>
                <span>로그아웃</span>
            </button>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1 p-8 overflow-y-auto">
            <header class="mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">작업 관리</h2>
                <p class="text-gray-400">진행 중인 작업과 프로젝트를 관리하세요</p>
            </header>
            
            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">전체 작업</p>
                            <p class="text-3xl font-bold text-white mt-2" id="totalTasks">0</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-clipboard-list text-blue-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">대기 중</p>
                            <p class="text-3xl font-bold text-yellow-400 mt-2" id="pendingTasks">0</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-clock text-yellow-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">진행 중</p>
                            <p class="text-3xl font-bold text-blue-400 mt-2" id="inProgressTasks">0</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-spinner text-blue-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">완료</p>
                            <p class="text-3xl font-bold text-green-400 mt-2" id="completedTasks">0</p>
                        </div>
                        <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-400 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 필터 및 추가 버튼 -->
            <div class="flex flex-wrap gap-4 mb-6">
                <button onclick="filterTasks('all')" class="filter-btn active px-4 py-2 rounded-lg bg-blue-500 text-white">
                    전체
                </button>
                <button onclick="filterTasks('pending')" class="filter-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                    대기 중
                </button>
                <button onclick="filterTasks('in_progress')" class="filter-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                    진행 중
                </button>
                <button onclick="filterTasks('completed')" class="filter-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                    완료
                </button>
                
                <button onclick="openAddTaskModal()" class="btn-primary ml-auto px-6 py-2 rounded-lg text-white font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    작업 추가
                </button>
            </div>
            
            <!-- 작업 목록 -->
            <div id="tasksList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- JavaScript로 동적 생성 -->
            </div>
        </main>
    </div>
    
    <!-- 작업 추가 모달 -->
    <div id="addTaskModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="modal-content rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">새 작업 추가</h3>
            <form id="addTaskForm" class="space-y-4">
                <div>
                    <label class="modal-label block text-sm mb-2">고객 선택 *</label>
                    <select name="client_id" id="clientSelect" required class="modal-input w-full px-4 py-2 rounded-lg" onchange="updateClientInfo()">
                        <option value="">선택하세요</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1" id="clientInfo"></p>
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">작업 제목 *</label>
                    <input type="text" name="title" required placeholder="예: 신제품 프로모션 영상" class="modal-input w-full px-4 py-2 rounded-lg">
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">작업 설명 *</label>
                    <textarea name="description" required placeholder="작업에 대한 상세한 설명을 입력하세요" class="modal-textarea w-full px-4 py-2 rounded-lg"></textarea>
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">마감일</label>
                    <input type="date" name="due_date" class="modal-input w-full px-4 py-2 rounded-lg">
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">프롬프트 (선택)</label>
                    <textarea name="prompt" placeholder="AI 프롬프트를 입력하거나 자동 생성" class="modal-textarea w-full px-4 py-2 rounded-lg"></textarea>
                    <button type="button" onclick="generatePrompt()" class="mt-2 text-sm text-blue-600 hover:text-blue-700">
                        <i class="fas fa-magic mr-1"></i>
                        프롬프트 자동 생성
                    </button>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button type="button" onclick="closeAddTaskModal()" class="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition">
                        취소
                    </button>
                    <button type="submit" class="flex-1 btn-primary px-4 py-2 rounded-lg text-white font-medium">
                        추가
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allTasks = [];
        let allClients = [];
        let currentFilter = 'all';
        
        // 초기 로드
        async function loadData() {
            try {
                // 작업 목록 로드
                const tasksResponse = await axios.get('/api/tasks');
                allTasks = tasksResponse.data.data;
                
                // 고객 목록 로드
                const clientsResponse = await axios.get('/api/clients');
                allClients = clientsResponse.data.data;
                
                updateStats();
                renderTasks();
                populateClientSelect();
            } catch (error) {
                console.error('데이터 로드 실패:', error);
            }
        }
        
        // 통계 업데이트
        function updateStats() {
            document.getElementById('totalTasks').textContent = allTasks.length;
            document.getElementById('pendingTasks').textContent = allTasks.filter(t => t.status === 'pending').length;
            document.getElementById('inProgressTasks').textContent = allTasks.filter(t => t.status === 'in_progress').length;
            document.getElementById('completedTasks').textContent = allTasks.filter(t => t.status === 'completed').length;
        }
        
        // 작업 목록 렌더링
        function renderTasks() {
            const container = document.getElementById('tasksList');
            
            let filtered = allTasks;
            if (currentFilter !== 'all') {
                filtered = allTasks.filter(t => t.status === currentFilter);
            }
            
            if (filtered.length === 0) {
                container.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">표시할 작업이 없습니다.</p>';
                return;
            }
            
            container.innerHTML = filtered.map(task => \`
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-white mb-1">\${task.title}</h3>
                            <p class="text-sm text-gray-400">\${task.client_name}</p>
                        </div>
                        <span class="status-badge status-\${task.status}">
                            <span class="status-dot"></span>
                            \${getStatusText(task.status)}
                        </span>
                    </div>
                    
                    <p class="text-sm text-gray-300 mb-4 line-clamp-2">\${task.description}</p>
                    
                    <div class="space-y-2 text-sm mb-4">
                        <div class="flex items-center gap-2 text-gray-400">
                            <i class="fas fa-box w-4"></i>
                            <span>\${task.package_id} 패키지</span>
                        </div>
                        <div class="flex items-center gap-2 text-gray-400">
                            <i class="fas fa-calendar w-4"></i>
                            <span>마감: \${task.due_date || '미정'}</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 pt-4 border-t border-white/10">
                        <button onclick="viewTask('\${task.id}')" class="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition">
                            <i class="fas fa-eye mr-1"></i>
                            상세
                        </button>
                        <button onclick="changeStatus('\${task.id}', '\${getNextStatus(task.status)}')" class="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm transition">
                            <i class="fas fa-arrow-right mr-1"></i>
                            \${getNextStatusText(task.status)}
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        // 상태 텍스트 변환
        function getStatusText(status) {
            const statusMap = {
                'pending': '대기 중',
                'in_progress': '진행 중',
                'completed': '완료'
            };
            return statusMap[status] || status;
        }
        
        // 다음 상태
        function getNextStatus(currentStatus) {
            const statusFlow = {
                'pending': 'in_progress',
                'in_progress': 'completed',
                'completed': 'completed'
            };
            return statusFlow[currentStatus];
        }
        
        // 다음 상태 버튼 텍스트
        function getNextStatusText(currentStatus) {
            const textMap = {
                'pending': '시작',
                'in_progress': '완료',
                'completed': '완료됨'
            };
            return textMap[currentStatus] || '변경';
        }
        
        // 상태 변경
        async function changeStatus(taskId, newStatus) {
            try {
                const task = allTasks.find(t => t.id === taskId);
                if (task.status === 'completed') {
                    alert('이미 완료된 작업입니다.');
                    return;
                }
                
                const updateData = { status: newStatus };
                if (newStatus === 'completed') {
                    updateData.completed_at = new Date().toISOString().split('T')[0];
                }
                
                const response = await axios.put(\`/api/tasks/\${taskId}\`, updateData);
                
                if (response.data.success) {
                    loadData();
                }
            } catch (error) {
                alert('상태 변경 실패');
            }
        }
        
        // 필터 적용
        function filterTasks(status) {
            currentFilter = status;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-white/5', 'text-gray-400');
            });
            
            event.target.classList.add('active', 'bg-blue-500', 'text-white');
            event.target.classList.remove('bg-white/5', 'text-gray-400');
            
            renderTasks();
        }
        
        // 작업 상세 보기
        function viewTask(id) {
            const task = allTasks.find(t => t.id === id);
            if (task) {
                alert(\`작업 상세 정보:\\n\\n제목: \${task.title}\\n고객: \${task.client_name}\\n설명: \${task.description}\\n프롬프트: \${task.prompt || '없음'}\`);
            }
        }
        
        // 고객 선택 목록 채우기
        function populateClientSelect() {
            const select = document.getElementById('clientSelect');
            select.innerHTML = '<option value="">선택하세요</option>' + 
                allClients.map(client => \`
                    <option value="\${client.id}" data-package="\${client.package_id}" data-name="\${client.name}">
                        \${client.name} (\${client.type === 'brand' ? '업체' : '개인'} - \${client.package_id} 패키지)
                    </option>
                \`).join('');
        }
        
        // 고객 정보 업데이트
        function updateClientInfo() {
            const select = document.getElementById('clientSelect');
            const selectedOption = select.options[select.selectedIndex];
            const info = document.getElementById('clientInfo');
            
            if (selectedOption.value) {
                const packageId = selectedOption.dataset.package;
                info.textContent = \`선택됨: \${selectedOption.dataset.name} (\${packageId} 패키지)\`;
                info.classList.remove('text-gray-500');
                info.classList.add('text-blue-600');
            } else {
                info.textContent = '';
            }
        }
        
        // 프롬프트 자동 생성
        async function generatePrompt() {
            const clientId = document.getElementById('clientSelect').value;
            const description = document.querySelector('[name="description"]').value;
            
            if (!clientId || !description) {
                alert('고객과 작업 설명을 먼저 입력해주세요.');
                return;
            }
            
            try {
                const response = await axios.post('/api/prompts/generate', {
                    client_id: clientId,
                    request: description
                });
                
                if (response.data.success) {
                    document.querySelector('[name="prompt"]').value = response.data.prompt;
                }
            } catch (error) {
                alert('프롬프트 생성 실패');
            }
        }
        
        // 모달 열기/닫기
        function openAddTaskModal() {
            document.getElementById('addTaskModal').classList.remove('hidden');
        }
        
        function closeAddTaskModal() {
            document.getElementById('addTaskModal').classList.add('hidden');
            document.getElementById('addTaskForm').reset();
            document.getElementById('clientInfo').textContent = '';
        }
        
        // 작업 추가
        document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const clientId = formData.get('client_id');
            const client = allClients.find(c => c.id === clientId);
            
            if (!client) {
                alert('고객을 선택해주세요.');
                return;
            }
            
            const data = {
                client_id: clientId,
                client_name: client.name,
                title: formData.get('title'),
                description: formData.get('description'),
                prompt: formData.get('prompt') || '',
                due_date: formData.get('due_date') || null,
                package_id: client.package_id
            };
            
            try {
                const response = await axios.post('/api/tasks', data);
                if (response.data.success) {
                    closeAddTaskModal();
                    loadData();
                }
            } catch (error) {
                alert('작업 추가 실패');
            }
        });
        
        // 로그아웃
        function logout() {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = 'https://studiojuai-hub.pages.dev';
        }
        
        // 페이지 로드 시 실행
        loadData();
    </script>
</body>
</html>
  `);
});

// ===== 메인 페이지 =====
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudioJuAI_Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        
        * {
            font-family: 'Noto Sans KR', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }
        
        .glass-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .sidebar {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-item {
            transition: all 0.2s;
        }
        
        .sidebar-item:hover, .sidebar-item.active {
            background: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-active {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .status-paused {
            background: rgba(234, 179, 8, 0.1);
            color: #eab308;
            border: 1px solid rgba(234, 179, 8, 0.3);
        }
        
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }
        
        .status-active .status-dot {
            background: #22c55e;
            box-shadow: 0 0 8px #22c55e;
        }
        
        .status-paused .status-dot {
            background: #eab308;
            box-shadow: 0 0 8px #eab308;
        }
        
        .btn-primary {
            background: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.2s;
        }
        
        .btn-primary:hover {
            background: #2563eb;
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            transform: translateY(-1px);
        }
        
        /* 모달 스타일 */
        .modal-content {
            background: white;
        }
        
        .modal-label {
            color: #374151;
            font-weight: 500;
        }
        
        .modal-input {
            background: #f9fafb;
            border: 1px solid #d1d5db;
            color: #111827;
        }
        
        .modal-input:focus {
            outline: none;
            border-color: #3b82f6;
            ring: 2px;
            ring-color: rgba(59, 130, 246, 0.2);
        }
    </style>
</head>
<body>
    <div class="flex min-h-screen">
        <!-- 사이드바 -->
        <aside class="sidebar w-64 fixed left-0 top-0 h-full">
            <div class="p-6 border-b border-white/10">
                <h1 class="text-2xl font-bold text-white">StudioJuAI</h1>
                <p class="text-xs text-gray-400 mt-1">Dashboard</p>
            </div>
            
            <nav class="p-4 space-y-2">
                <a href="/" class="sidebar-item active flex items-center gap-3 px-4 py-3 rounded-lg text-white">
                    <i class="fas fa-home w-5"></i>
                    <span>대시보드</span>
                </a>
                <a href="/brands" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white">
                    <i class="fas fa-building w-5"></i>
                    <span>업체 관리</span>
                </a>
                <a href="/individuals" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white">
                    <i class="fas fa-users w-5"></i>
                    <span>개인 관리</span>
                </a>
                <a href="/tasks" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white">
                    <i class="fas fa-tasks w-5"></i>
                    <span>작업 관리</span>
                </a>
            </nav>
            
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <button onclick="logout()" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white w-full">
                    <i class="fas fa-sign-out-alt w-5"></i>
                    <span>로그아웃</span>
                </button>
            </div>
        </aside>
        
        <!-- 메인 콘텐츠 -->
        <main class="ml-64 flex-1 p-8">
            <!-- 헤더 -->
            <header class="mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">고객 관리</h2>
                <p class="text-gray-400">전체 고객 목록을 확인하고 관리하세요</p>
            </header>
            
            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">전체 고객</p>
                            <p class="text-3xl font-bold text-white mt-2" id="totalClients">0</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-users text-blue-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">활성 고객</p>
                            <p class="text-3xl font-bold text-green-400 mt-2" id="activeClients">0</p>
                        </div>
                        <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">일시중지</p>
                            <p class="text-3xl font-bold text-yellow-400 mt-2" id="pausedClients">0</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-pause-circle text-yellow-400 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 필터 및 추가 버튼 -->
            <div class="flex flex-wrap gap-4 mb-6">
                <button onclick="filterClients('all')" class="filter-btn active px-4 py-2 rounded-lg bg-blue-500 text-white">
                    전체
                </button>
                <button onclick="filterClients('brand')" class="filter-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                    업체
                </button>
                <button onclick="filterClients('individual')" class="filter-btn px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                    개인
                </button>
                
                <button onclick="openAddClientModal()" class="btn-primary ml-auto px-6 py-2 rounded-lg text-white font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    고객 추가
                </button>
            </div>
            
            <!-- 고객 목록 -->
            <div id="clientsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- JavaScript로 동적 생성 -->
            </div>
        </main>
    </div>
    
    <!-- 고객 추가 모달 (간단 버전) -->
    <div id="addClientModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="modal-content rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">새 고객 추가</h3>
            <form id="addClientForm" class="space-y-4">
                <div>
                    <label class="modal-label block text-sm mb-2">고객명</label>
                    <input type="text" name="name" required class="modal-input w-full px-4 py-2 rounded-lg">
                </div>
                <div>
                    <label class="modal-label block text-sm mb-2">유형</label>
                    <select name="type" required class="modal-input w-full px-4 py-2 rounded-lg">
                        <option value="brand">업체</option>
                        <option value="individual">개인</option>
                    </select>
                </div>
                <div>
                    <label class="modal-label block text-sm mb-2">카테고리</label>
                    <input type="text" name="category" required class="modal-input w-full px-4 py-2 rounded-lg">
                </div>
                <div>
                    <label class="modal-label block text-sm mb-2">패키지</label>
                    <select name="package_id" id="packageSelect" required class="modal-input w-full px-4 py-2 rounded-lg" onchange="updateChannelFields()">
                        <option value="">선택하세요</option>
                        <option value="A">A 패키지 (Instagram, YouTube, TikTok)</option>
                        <option value="B">B 패키지 (Instagram, Naver Blog)</option>
                        <option value="C">C 패키지 (Instagram)</option>
                    </select>
                </div>
                
                <!-- 동적 SNS 채널 입력 필드 -->
                <div id="channelFields" class="space-y-4">
                    <!-- JavaScript로 동적 생성 -->
                </div>
                <div class="flex gap-3 mt-6">
                    <button type="button" onclick="closeAddClientModal()" class="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition">
                        취소
                    </button>
                    <button type="submit" class="flex-1 btn-primary px-4 py-2 rounded-lg text-white font-medium">
                        추가
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allClients = [];
        let currentFilter = 'all';
        
        // 초기 로드
        async function loadClients() {
            try {
                const response = await axios.get('/api/clients');
                allClients = response.data.data;
                updateStats();
                renderClients();
            } catch (error) {
                console.error('고객 로드 실패:', error);
            }
        }
        
        // 통계 업데이트
        function updateStats() {
            document.getElementById('totalClients').textContent = allClients.length;
            document.getElementById('activeClients').textContent = allClients.filter(c => c.status === 'active').length;
            document.getElementById('pausedClients').textContent = allClients.filter(c => c.status === 'paused').length;
        }
        
        // 고객 목록 렌더링
        function renderClients() {
            const container = document.getElementById('clientsList');
            
            let filtered = allClients;
            if (currentFilter !== 'all') {
                filtered = allClients.filter(c => c.type === currentFilter);
            }
            
            container.innerHTML = filtered.map(client => \`
                <div class="glass-card rounded-xl p-6 cursor-pointer" onclick="viewClient('\${client.id}')">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-white">\${client.name}</h3>
                            <p class="text-sm text-gray-400 mt-1">\${client.category}</p>
                        </div>
                        <span class="status-badge status-\${client.status}">
                            <span class="status-dot"></span>
                            \${client.status === 'active' ? '활성' : '일시중지'}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center gap-2 text-gray-400">
                            <i class="fas fa-\${client.type === 'brand' ? 'building' : 'user'} w-4"></i>
                            <span>\${client.type === 'brand' ? '업체' : '개인'}</span>
                        </div>
                        <div class="flex items-center gap-2 text-gray-400">
                            <i class="fas fa-box w-4"></i>
                            <span>\${client.package_id} 패키지</span>
                        </div>
                        <div class="flex items-center gap-2 text-gray-400">
                            <i class="fas fa-calendar w-4"></i>
                            <span>\${client.created_at}</span>
                        </div>
                    </div>
                </div>
            \`).join('');
        }
        
        // 필터 적용
        function filterClients(type) {
            currentFilter = type;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-white/5', 'text-gray-400');
            });
            
            event.target.classList.add('active', 'bg-blue-500', 'text-white');
            event.target.classList.remove('bg-white/5', 'text-gray-400');
            
            renderClients();
        }
        
        // 고객 상세 보기
        function viewClient(id) {
            alert('고객 상세 페이지 (개발 예정): ' + id);
        }
        
        // 모달 열기/닫기
        function openAddClientModal() {
            document.getElementById('addClientModal').classList.remove('hidden');
        }
        
        function closeAddClientModal() {
            document.getElementById('addClientModal').classList.add('hidden');
        }
        
        // 패키지 선택 시 채널 입력 필드 동적 생성
        function updateChannelFields() {
            const packageId = document.getElementById('packageSelect').value;
            const container = document.getElementById('channelFields');
            
            if (!packageId) {
                container.innerHTML = '';
                return;
            }
            
            const packageChannels = {
                'A': [
                    { id: 'instagram', label: 'Instagram', placeholder: '@username 또는 URL' },
                    { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
                    { id: 'tiktok', label: 'TikTok', placeholder: '@username 또는 URL' }
                ],
                'B': [
                    { id: 'instagram', label: 'Instagram', placeholder: '@username 또는 URL' },
                    { id: 'naver_blog', label: 'Naver Blog', placeholder: 'https://blog.naver.com/...' }
                ],
                'C': [
                    { id: 'instagram', label: 'Instagram', placeholder: '@username 또는 URL' }
                ]
            };
            
            const channels = packageChannels[packageId] || [];
            
            container.innerHTML = channels.map(channel => \`
                <div>
                    <label class="modal-label block text-sm mb-2">\${channel.label}</label>
                    <input 
                        type="text" 
                        name="channel_\${channel.id}" 
                        placeholder="\${channel.placeholder}"
                        required 
                        class="modal-input w-full px-4 py-2 rounded-lg"
                    >
                </div>
            \`).join('');
        }
        
        // 고객 추가
        document.getElementById('addClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const packageId = formData.get('package_id');
            
            // 채널 정보 수집
            const channels = {};
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('channel_')) {
                    const channelName = key.replace('channel_', '');
                    channels[channelName] = value;
                }
            }
            
            const data = {
                name: formData.get('name'),
                type: formData.get('type'),
                category: formData.get('category'),
                package_id: packageId,
                username: formData.get('name').toLowerCase().replace(/\s+/g, '_'),
                channels: channels,
                brand_info: {
                    industry: formData.get('category'),
                    target_audience: '',
                    style: [],
                    tone: ''
                }
            };
            
            try {
                const response = await axios.post('/api/clients', data);
                if (response.data.success) {
                    closeAddClientModal();
                    loadClients();
                    e.target.reset();
                    document.getElementById('channelFields').innerHTML = '';
                }
            } catch (error) {
                alert('고객 추가 실패');
            }
        });
        
        // 페이지 전환
        function showPage(page) {
            // 사이드바 활성화 상태 변경
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active', 'text-white');
                item.classList.add('text-gray-400');
            });
            
            event.target.closest('.sidebar-item').classList.add('active', 'text-white');
            event.target.closest('.sidebar-item').classList.remove('text-gray-400');
            
            // 페이지별 동작
            if (page === 'dashboard') {
                currentFilter = 'all';
                renderClients();
            } else if (page === 'brands') {
                currentFilter = 'brand';
                renderClients();
            } else if (page === 'individuals') {
                currentFilter = 'individual';
                renderClients();
            } else if (page === 'tasks') {
                alert('작업 관리 페이지 (개발 예정)');
            }
        }
        
        // 로그아웃
        function logout() {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = 'https://studiojuai-hub.pages.dev';
        }
        
        // 페이지 로드 시 실행
        loadClients();
    </script>
</body>
</html>
  `);
});

export default app
