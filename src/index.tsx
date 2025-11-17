import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ===== 데모 데이터 =====
const demoClients = [
  {
    id: '1',
    name: '카페 더 라운지',
    type: 'brand',
    category: '카페/음료',
    package_id: 'B',
    username: 'cafe_lounge',
    status: 'active',
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
  return c.html('<h1 style="color: white; padding: 50px; text-align: center;">작업 관리 페이지 (개발 예정)</h1>');
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
                    <select name="package_id" required class="modal-input w-full px-4 py-2 rounded-lg">
                        <option value="A">A 패키지</option>
                        <option value="B">B 패키지</option>
                        <option value="C">C 패키지</option>
                    </select>
                </div>
                <div>
                    <label class="modal-label block text-sm mb-2">아이디</label>
                    <input type="text" name="username" required class="modal-input w-full px-4 py-2 rounded-lg">
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
        
        // 고객 추가
        document.getElementById('addClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                type: formData.get('type'),
                category: formData.get('category'),
                package_id: formData.get('package_id'),
                username: formData.get('username'),
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
