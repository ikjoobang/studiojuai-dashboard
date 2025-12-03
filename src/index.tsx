import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// 환경 변수 타입 정의
type Env = {
  DB: D1Database;
  OPENAI_API_KEY: string;
  MP4_API_KEY: string;
  MP4_API_BASE: string;
}

const app = new Hono<{ Bindings: Env }>()

// CORS 설정 - 모든 도메인 허용 (MP4 서버 연동 포함)
app.use('/api/*', cors({
  origin: ['https://studiojuai-dashboard.pages.dev', 'https://studiojuai-mp4.pages.dev', '*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
  maxAge: 86400
}))

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ===== 헬퍼 함수 =====

// JSON 문자열을 안전하게 파싱
function parseJSON(str: string | null) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ===== API 라우트 =====

// 고객 목록 조회
app.get('/api/clients', async (c) => {
  try {
    const type = c.req.query('type');
    const status = c.req.query('status');
    
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params: string[] = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    // JSON 필드 파싱
    const clients = results.map((row: any) => ({
      ...row,
      channels: parseJSON(row.channels),
      brand_info: parseJSON(row.brand_info)
    }));
    
    return c.json({
      success: true,
      data: clients,
      total: clients.length
    });
  } catch (error) {
    console.error('D1 Error:', error);
    return c.json({
      success: false,
      message: '고객 목록 조회에 실패했습니다.',
      error: String(error)
    }, 500);
  }
});

// 고객 상세 조회
app.get('/api/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    const client = {
      ...results[0],
      channels: parseJSON(results[0].channels),
      brand_info: parseJSON(results[0].brand_info)
    };
    
    return c.json({
      success: true,
      data: client
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '고객 조회에 실패했습니다.'
    }, 500);
  }
});

// 고객 생성
app.post('/api/clients', async (c) => {
  try {
    const body = await c.req.json();
    
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (name, type, category, package_id, username, status, channels, brand_info)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      body.name,
      body.type,
      body.category,
      body.package_id,
      body.username,
      JSON.stringify(body.channels || {}),
      JSON.stringify(body.brand_info || {})
    ).run();
    
    // 생성된 고객 조회
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(result.meta.last_row_id).all();
    
    const newClient = {
      ...results[0],
      channels: parseJSON(results[0].channels),
      brand_info: parseJSON(results[0].brand_info)
    };
    
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
    
    await c.env.DB.prepare(`
      UPDATE clients 
      SET name = ?, type = ?, category = ?, package_id = ?, username = ?, 
          status = ?, channels = ?, brand_info = ?
      WHERE id = ?
    `).bind(
      body.name,
      body.type,
      body.category,
      body.package_id,
      body.username,
      body.status,
      JSON.stringify(body.channels || {}),
      JSON.stringify(body.brand_info || {}),
      id
    ).run();
    
    // 수정된 고객 조회
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    const updatedClient = {
      ...results[0],
      channels: parseJSON(results[0].channels),
      brand_info: parseJSON(results[0].brand_info)
    };
    
    return c.json({
      success: true,
      data: updatedClient,
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
app.delete('/api/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      'DELETE FROM clients WHERE id = ?'
    ).bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '고객이 삭제되었습니다.'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '고객 삭제에 실패했습니다.'
    }, 500);
  }
});

// 프롬프트 생성 (OpenAI GPT-4o-mini)
app.post('/api/prompts/generate', async (c) => {
  try {
    const { client_id, request } = await c.req.json();
    const { env } = c;
    
    // D1에서 고객 조회
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(client_id).all();
    
    if (results.length === 0) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    const clientRow: any = results[0];
    const client = {
      ...clientRow,
      channels: parseJSON(clientRow.channels),
      brand_info: parseJSON(clientRow.brand_info)
    };
    
    if (!client) {
      return c.json({
        success: false,
        message: '고객을 찾을 수 없습니다.'
      }, 404);
    }
    
    // OpenAI API 호출
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '당신은 영상 제작을 위한 AI 프롬프트 생성 전문가입니다. 고객의 브랜드 정보와 요청사항을 바탕으로 영상 생성 AI(예: Sora, Runway)에 사용할 상세하고 전문적인 영어 프롬프트를 생성합니다. 프롬프트는 시각적 요소, 분위기, 타겟 관객, 톤 앤 매너를 포함해야 합니다.'
            },
            {
              role: 'user',
              content: `고객 정보:
- 이름: ${client.name}
- 유형: ${client.type === 'brand' ? '업체' : '개인'}
- 산업: ${client.brand_info.industry}
- 타겟: ${client.brand_info.target_audience}
- 스타일: ${client.brand_info.style.join(', ')}
- 톤: ${client.brand_info.tone}

요청사항: ${request}

위 정보를 바탕으로 영상 생성 AI를 위한 상세한 영어 프롬프트를 생성해주세요. 프롬프트만 작성하고 다른 설명은 하지 마세요.`
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });
      
      if (!openaiResponse.ok) {
        throw new Error('OpenAI API 호출 실패');
      }
      
      const openaiData = await openaiResponse.json();
      const generatedPrompt = openaiData.choices[0].message.content.trim();
      
      return c.json({
        success: true,
        prompt: generatedPrompt,
        message: 'AI 프롬프트가 생성되었습니다.'
      });
    } catch (openaiError) {
      // OpenAI 실패 시 템플릿 폴백
      console.error('OpenAI Error:', openaiError);
      const fallbackPrompt = `A ${client.brand_info.style.join(' and ')} ${client.brand_info.industry} video showing ${request}, targeting ${client.brand_info.target_audience}, with a ${client.brand_info.tone} tone.`;
      
      return c.json({
        success: true,
        prompt: fallbackPrompt,
        message: '프롬프트가 생성되었습니다 (템플릿 모드).'
      });
    }
  } catch (error) {
    return c.json({
      success: false,
      message: '프롬프트 생성에 실패했습니다.'
    }, 500);
  }
});

// ===== 작업 관리 API =====

// 작업 목록 조회
app.get('/api/tasks', async (c) => {
  try {
    const client_id = c.req.query('client_id');
    const status = c.req.query('status');
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: string[] = [];
    
    if (client_id) {
      query += ' AND client_id = ?';
      params.push(client_id);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '작업 목록 조회에 실패했습니다.'
    }, 500);
  }
});

// 작업 상세 조회
app.get('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ?'
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({
        success: false,
        message: '작업을 찾을 수 없습니다.'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '작업 조회에 실패했습니다.'
    }, 500);
  }
});

// 작업 생성
app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json();
    
    const result = await c.env.DB.prepare(`
      INSERT INTO tasks (client_id, client_name, title, description, prompt, status, package_id, due_date)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      body.client_id,
      body.client_name,
      body.title,
      body.description || '',
      body.prompt || '',
      body.package_id,
      body.due_date || null
    ).run();
    
    // 생성된 작업 조회
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ?'
    ).bind(result.meta.last_row_id).all();
    
    return c.json({
      success: true,
      data: results[0],
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
    
    // 완료 상태로 변경 시 completed_at 설정
    const completedAt = body.status === 'completed' ? new Date().toISOString().split('T')[0] : body.completed_at || null;
    
    await c.env.DB.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, prompt = ?, status = ?, due_date = ?, completed_at = ?, notes = ?
      WHERE id = ?
    `).bind(
      body.title,
      body.description || '',
      body.prompt || '',
      body.status,
      body.due_date || null,
      completedAt,
      body.notes || null,
      id
    ).run();
    
    // 수정된 작업 조회
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ?'
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({
        success: false,
        message: '작업을 찾을 수 없습니다.'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: results[0],
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
app.delete('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      'DELETE FROM tasks WHERE id = ?'
    ).bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        message: '작업을 찾을 수 없습니다.'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '작업이 삭제되었습니다.'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '작업 삭제에 실패했습니다.'
    }, 500);
  }
});

// ===== MP4 Generator API =====

// 영상 생성 요청
app.post('/api/video/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { taskId, model, prompt, autoPrompt, aspectRatio, duration, audioUrl, referenceImage } = body;
    
    if (!taskId || !model || !prompt) {
      return c.json({
        success: false,
        message: 'taskId, model, prompt는 필수 항목입니다.'
      }, 400);
    }

    // MP4 Generator API 호출
    const response = await fetch(`${c.env.MP4_API_BASE}/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.MP4_API_KEY}`
      },
      body: JSON.stringify({
        model,
        prompt,
        autoPrompt: autoPrompt || false,
        aspectRatio: aspectRatio || '16:9',
        duration: duration || '5',
        audioUrl: audioUrl || '',
        referenceImage: referenceImage || ''
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        success: false,
        message: 'MP4 Generator API 호출 실패',
        error: errorText
      }, response.status);
    }

    const data = await response.json();
    
    // 작업에 video_task_id 저장
    await c.env.DB.prepare(
      'UPDATE tasks SET video_task_id = ?, video_status = ? WHERE id = ?'
    ).bind(data.taskId, 'processing', taskId).run();
    
    return c.json({
      success: true,
      data: {
        taskId: data.taskId,
        status: data.status,
        provider: data.provider,
        model: data.model,
        estimatedTime: data.estimatedTime
      }
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({
      success: false,
      message: '영상 생성 요청에 실패했습니다.',
      error: String(error)
    }, 500);
  }
});

// 영상 생성 상태 확인
app.get('/api/video/status/:videoTaskId', async (c) => {
  try {
    const videoTaskId = c.req.param('videoTaskId');
    
    // MP4 Generator API 상태 확인
    const response = await fetch(`${c.env.MP4_API_BASE}/video/status/${videoTaskId}`, {
      headers: {
        'Authorization': `Bearer ${c.env.MP4_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        success: false,
        message: 'MP4 Generator API 호출 실패',
        error: errorText
      }, response.status);
    }

    const data = await response.json();
    
    // 데이터베이스 업데이트
    if (data.status === 'completed' && data.videoUrl) {
      await c.env.DB.prepare(
        'UPDATE tasks SET video_status = ?, video_url = ?, completed_at = ? WHERE video_task_id = ?'
      ).bind('completed', data.videoUrl, new Date().toISOString().split('T')[0], videoTaskId).run();
    } else if (data.status === 'failed') {
      await c.env.DB.prepare(
        'UPDATE tasks SET video_status = ? WHERE video_task_id = ?'
      ).bind('failed', videoTaskId).run();
    }
    
    return c.json({
      success: true,
      data: {
        taskId: data.taskId,
        status: data.status,
        videoUrl: data.videoUrl || null,
        duration: data.duration,
        provider: data.provider,
        model: data.model,
        error: data.error || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt || null
      }
    });
  } catch (error) {
    console.error('Video status check error:', error);
    return c.json({
      success: false,
      message: '영상 상태 확인에 실패했습니다.',
      error: String(error)
    }, 500);
  }
});

// 프롬프트 자동 생성 (OpenAI GPT)
app.post('/api/prompt/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { title, description } = body;
    
    if (!title) {
      return c.json({
        success: false,
        message: 'title은 필수 항목입니다.'
      }, 400);
    }

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 숏폼 영상 제작 전문가입니다. 주어진 제목과 설명을 바탕으로 AI 영상 생성에 최적화된 영문 프롬프트를 작성해주세요. 프롬프트는 구체적이고, 시각적이며, 영상의 구도, 색감, 움직임을 포함해야 합니다.'
          },
          {
            role: 'user',
            content: `제목: ${title}\n설명: ${description || '없음'}\n\n위 내용을 바탕으로 30초 이내의 숏폼 영상을 만들기 위한 영문 프롬프트를 작성해주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        success: false,
        message: 'OpenAI API 호출 실패',
        error: errorText
      }, response.status);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;
    
    return c.json({
      success: true,
      prompt: generatedPrompt
    });
  } catch (error) {
    console.error('Prompt generation error:', error);
    return c.json({
      success: false,
      message: '프롬프트 생성에 실패했습니다.',
      error: String(error)
    }, 500);
  }
});

// ===== 페이지 라우트 =====

// 대시보드 (루트)
app.get('/', (c) => {
  return c.redirect('/dashboard');
});

// 업체 관리 페이지
app.get('/brands', (c) => {
  return c.redirect('/clients?type=brand');
});

// 개인 관리 페이지
app.get('/individuals', (c) => {
  return c.redirect('/clients?type=individual');
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
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
                <a href="/dashboard" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
                    <i class="fas fa-home w-5"></i>
                    <span>대시보드</span>
                </a>
                <a href="/clients" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
                    <i class="fas fa-users w-5"></i>
                    <span>고객 관리</span>
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
            
            <!-- 검색 및 필터 -->
            <div class="glass-card rounded-xl p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div class="md:col-span-2">
                        <label class="text-sm text-gray-400 mb-2 block">고객 검색</label>
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="고객명 또는 작업 제목으로 검색..." 
                                class="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                onkeyup="applyFilters()"
                            >
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-sm text-gray-400 mb-2 block">시작일</label>
                        <input 
                            type="date" 
                            id="startDate" 
                            class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            onchange="applyFilters()"
                        >
                    </div>
                    
                    <div>
                        <label class="text-sm text-gray-400 mb-2 block">종료일</label>
                        <input 
                            type="date" 
                            id="endDate" 
                            class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            onchange="applyFilters()"
                        >
                    </div>
                </div>
                
                <div class="flex items-center gap-3">
                    <label class="text-sm text-gray-400">패키지:</label>
                    <button onclick="filterByPackage('all')" class="package-filter-btn active px-3 py-1 rounded text-sm bg-blue-500 text-white">
                        전체
                    </button>
                    <button onclick="filterByPackage('A')" class="package-filter-btn px-3 py-1 rounded text-sm bg-white/5 text-gray-400 hover:bg-white/10">
                        A 패키지
                    </button>
                    <button onclick="filterByPackage('B')" class="package-filter-btn px-3 py-1 rounded text-sm bg-white/5 text-gray-400 hover:bg-white/10">
                        B 패키지
                    </button>
                    <button onclick="filterByPackage('C')" class="package-filter-btn px-3 py-1 rounded text-sm bg-white/5 text-gray-400 hover:bg-white/10">
                        C 패키지
                    </button>
                    
                    <button onclick="clearFilters()" class="ml-auto px-4 py-1 rounded text-sm text-gray-400 hover:text-white">
                        <i class="fas fa-redo mr-1"></i>
                        초기화
                    </button>
                </div>
            </div>
            
            <!-- 상태 필터 및 추가 버튼 -->
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
    
    <!-- 작업 상세/편집 모달 -->
    <div id="taskDetailModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="modal-content rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">작업 상세 정보</h3>
                <button onclick="closeTaskDetailModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <form id="editTaskForm" class="space-y-4">
                <input type="hidden" id="editTaskId" name="id">
                
                <div>
                    <label class="modal-label block text-sm mb-2">작업 제목 *</label>
                    <input type="text" id="editTitle" name="title" required class="modal-input w-full px-4 py-2 rounded-lg">
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">작업 설명 *</label>
                    <textarea id="editDescription" name="description" required class="modal-textarea w-full px-4 py-2 rounded-lg" rows="4"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="modal-label block text-sm mb-2">고객</label>
                        <input type="text" id="editClientName" disabled class="modal-input w-full px-4 py-2 rounded-lg bg-gray-100">
                    </div>
                    <div>
                        <label class="modal-label block text-sm mb-2">패키지</label>
                        <input type="text" id="editPackage" disabled class="modal-input w-full px-4 py-2 rounded-lg bg-gray-100">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="modal-label block text-sm mb-2">마감일</label>
                        <input type="date" id="editDueDate" name="due_date" class="modal-input w-full px-4 py-2 rounded-lg">
                    </div>
                    <div>
                        <label class="modal-label block text-sm mb-2">상태</label>
                        <select id="editStatus" name="status" class="modal-input w-full px-4 py-2 rounded-lg">
                            <option value="pending">대기 중</option>
                            <option value="in_progress">진행 중</option>
                            <option value="completed">완료</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">프롬프트</label>
                    <textarea id="editPrompt" name="prompt" class="modal-textarea w-full px-4 py-2 rounded-lg" rows="6"></textarea>
                    <button type="button" onclick="regeneratePrompt()" class="mt-2 text-sm text-blue-600 hover:text-blue-700">
                        <i class="fas fa-sync-alt mr-1"></i>
                        프롬프트 재생성
                    </button>
                </div>
                
                <div>
                    <label class="modal-label block text-sm mb-2">메모</label>
                    <textarea id="editNotes" name="notes" placeholder="작업 관련 메모나 추가 정보를 입력하세요" class="modal-textarea w-full px-4 py-2 rounded-lg" rows="3"></textarea>
                </div>
                
                <!-- 영상 생성 섹션 -->
                <div class="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <i class="fas fa-video mr-2 text-purple-600"></i>
                        MP4 영상 생성
                    </h4>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="modal-label block text-sm mb-2">AI 모델</label>
                            <select id="videoModel" class="modal-input w-full px-4 py-2 rounded-lg">
                                <option value="sora-2">Sora 2 (빠름)</option>
                                <option value="sora-2-pro">Sora 2 Pro (고품질)</option>
                                <option value="veo-3.1">Veo 3.1</option>
                                <option value="veo-3.1-fast">Veo 3.1 Fast</option>
                                <option value="kling-v2.5-turbo">Kling v2.5 Turbo</option>
                                <option value="kling-v2.5-pro">Kling v2.5 Pro</option>
                            </select>
                        </div>
                        <div>
                            <label class="modal-label block text-sm mb-2">화면 비율</label>
                            <select id="videoAspectRatio" class="modal-input w-full px-4 py-2 rounded-lg">
                                <option value="16:9">16:9 (가로)</option>
                                <option value="9:16">9:16 (세로)</option>
                                <option value="1:1">1:1 (정사각형)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="modal-label block text-sm mb-2">영상 길이</label>
                            <select id="videoDuration" class="modal-input w-full px-4 py-2 rounded-lg">
                                <option value="5">5초</option>
                                <option value="10">10초</option>
                            </select>
                        </div>
                        <div>
                            <label class="modal-label block text-sm mb-2 flex items-center">
                                <input type="checkbox" id="videoAutoPrompt" class="mr-2">
                                GPT 프롬프트 최적화
                            </label>
                        </div>
                    </div>
                    
                    <div id="videoStatusSection" class="hidden mb-4 p-3 bg-white rounded-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-spinner fa-spin text-purple-600 mr-2"></i>
                                <span id="videoStatusText" class="text-sm font-medium text-gray-700">영상 생성 중...</span>
                            </div>
                            <span id="videoProgress" class="text-xs text-gray-500"></span>
                        </div>
                    </div>
                    
                    <div id="videoResultSection" class="hidden mb-4">
                        <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-green-700">
                                    <i class="fas fa-check-circle mr-2"></i>
                                    영상 생성 완료!
                                </span>
                                <a id="videoDownloadLink" href="#" target="_blank" class="text-sm text-blue-600 hover:text-blue-700">
                                    <i class="fas fa-download mr-1"></i>
                                    다운로드
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" id="generateVideoBtn" onclick="generateVideo()" class="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg">
                        <i class="fas fa-magic mr-2"></i>
                        영상 생성하기
                    </button>
                </div>
                
                <div class="flex gap-3 mt-6 pt-4 border-t">
                    <button type="button" onclick="closeTaskDetailModal()" class="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition">
                        취소
                    </button>
                    <button type="submit" class="flex-1 btn-primary px-4 py-2 rounded-lg text-white font-medium">
                        <i class="fas fa-save mr-2"></i>
                        저장
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
        let currentEditingTask = null;
        let currentPackageFilter = 'all';
        let searchQuery = '';
        let startDateFilter = '';
        let endDateFilter = '';
        
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
            
            // 상태 필터
            if (currentFilter !== 'all') {
                filtered = filtered.filter(t => t.status === currentFilter);
            }
            
            // 패키지 필터
            if (currentPackageFilter !== 'all') {
                filtered = filtered.filter(t => t.package_id === currentPackageFilter);
            }
            
            // 검색어 필터
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(t => 
                    t.title.toLowerCase().includes(query) || 
                    t.client_name.toLowerCase().includes(query) ||
                    (t.description && t.description.toLowerCase().includes(query))
                );
            }
            
            // 날짜 범위 필터
            if (startDateFilter) {
                filtered = filtered.filter(t => t.created_at >= startDateFilter);
            }
            if (endDateFilter) {
                filtered = filtered.filter(t => t.created_at <= endDateFilter);
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
                        \${task.video_status ? \`
                        <div class="flex items-center gap-2 \${task.video_status === 'completed' ? 'text-green-400' : task.video_status === 'processing' ? 'text-yellow-400' : task.video_status === 'failed' ? 'text-red-400' : 'text-gray-400'}">
                            <i class="fas fa-video w-4"></i>
                            <span>영상: \${task.video_status === 'completed' ? '완료' : task.video_status === 'processing' ? '생성 중' : task.video_status === 'failed' ? '실패' : '대기'}</span>
                            \${task.video_url ? \`<a href="\${task.video_url}" target="_blank" class="ml-2 text-blue-400 hover:text-blue-300"><i class="fas fa-download"></i></a>\` : ''}
                        </div>
                        \` : ''}
                    </div>
                    
                    <div class="flex gap-2 pt-4 border-t border-white/10">
                        <button onclick="viewTask('\${task.id}')" class="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition">
                            <i class="fas fa-eye mr-1"></i>
                            상세
                        </button>
                        \${task.prompt ? \`
                        <button onclick="sendToMP4Generator('\${task.id}')" class="flex-1 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm transition">
                            <i class="fas fa-video mr-1"></i>
                            영상 생성
                        </button>
                        \` : ''}
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
        
        // 패키지 필터
        function filterByPackage(packageId) {
            currentPackageFilter = packageId;
            
            document.querySelectorAll('.package-filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-white/5', 'text-gray-400');
            });
            
            event.target.classList.add('active', 'bg-blue-500', 'text-white');
            event.target.classList.remove('bg-white/5', 'text-gray-400');
            
            renderTasks();
        }
        
        // 통합 필터 적용
        function applyFilters() {
            searchQuery = document.getElementById('searchInput').value;
            startDateFilter = document.getElementById('startDate').value;
            endDateFilter = document.getElementById('endDate').value;
            renderTasks();
        }
        
        // 필터 초기화
        function clearFilters() {
            // 검색어 초기화
            document.getElementById('searchInput').value = '';
            searchQuery = '';
            
            // 날짜 필터 초기화
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            startDateFilter = '';
            endDateFilter = '';
            
            // 패키지 필터 초기화
            currentPackageFilter = 'all';
            document.querySelectorAll('.package-filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-white/5', 'text-gray-400');
            });
            document.querySelectorAll('.package-filter-btn')[0].classList.add('active', 'bg-blue-500', 'text-white');
            document.querySelectorAll('.package-filter-btn')[0].classList.remove('bg-white/5', 'text-gray-400');
            
            // 상태 필터 초기화
            currentFilter = 'all';
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-white/5', 'text-gray-400');
            });
            document.querySelectorAll('.filter-btn')[0].classList.add('active', 'bg-blue-500', 'text-white');
            document.querySelectorAll('.filter-btn')[0].classList.remove('bg-white/5', 'text-gray-400');
            
            renderTasks();
        }
        
        // 작업 상세 보기
        function viewTask(id) {
            const task = allTasks.find(t => t.id == id);
            if (!task) return;
            
            currentEditingTask = task;
            
            // 폼 필드 채우기
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('editTitle').value = task.title || '';
            document.getElementById('editDescription').value = task.description || '';
            document.getElementById('editClientName').value = task.client_name || '';
            document.getElementById('editPackage').value = task.package_id + ' 패키지';
            document.getElementById('editDueDate').value = task.due_date || '';
            document.getElementById('editStatus').value = task.status || 'pending';
            document.getElementById('editPrompt').value = task.prompt || '';
            document.getElementById('editNotes').value = task.notes || '';
            
            // 모달 열기
            document.getElementById('taskDetailModal').classList.remove('hidden');
        }
        
        // 프롬프트 재생성
        async function regeneratePrompt() {
            if (!currentEditingTask) return;
            
            const title = document.getElementById('editTitle').value;
            const description = document.getElementById('editDescription').value;
            
            if (!title || !description) {
                alert('제목과 설명을 먼저 입력해주세요.');
                return;
            }
            
            const promptField = document.getElementById('editPrompt');
            const originalText = promptField.value;
            promptField.value = '프롬프트 생성 중...';
            promptField.disabled = true;
            
            try {
                const response = await axios.post('/api/prompt/generate', {
                    title: title,
                    description: description
                });
                
                if (response.data.success) {
                    promptField.value = response.data.prompt;
                } else {
                    alert('프롬프트 생성에 실패했습니다.');
                    promptField.value = originalText;
                }
            } catch (error) {
                alert('프롬프트 생성 중 오류가 발생했습니다.');
                promptField.value = originalText;
            } finally {
                promptField.disabled = false;
            }
        }
        
        // 영상 생성
        let pollingInterval = null;
        
        async function generateVideo() {
            if (!currentEditingTask) return;
            
            const prompt = document.getElementById('editPrompt').value;
            const model = document.getElementById('videoModel').value;
            const aspectRatio = document.getElementById('videoAspectRatio').value;
            const duration = document.getElementById('videoDuration').value;
            const autoPrompt = document.getElementById('videoAutoPrompt').checked;
            
            if (!prompt) {
                alert('프롬프트를 먼저 입력해주세요.');
                return;
            }
            
            // UI 상태 변경
            document.getElementById('generateVideoBtn').disabled = true;
            document.getElementById('videoStatusSection').classList.remove('hidden');
            document.getElementById('videoResultSection').classList.add('hidden');
            
            try {
                // 영상 생성 요청
                const response = await axios.post('/api/video/generate', {
                    taskId: currentEditingTask.id,
                    model: model,
                    prompt: prompt,
                    autoPrompt: autoPrompt,
                    aspectRatio: aspectRatio,
                    duration: duration
                });
                
                if (response.data.success) {
                    const videoTaskId = response.data.data.taskId;
                    document.getElementById('videoProgress').textContent = 
                        '예상 소요시간: ' + response.data.data.estimatedTime;
                    
                    // 폴링 시작 (30초마다 상태 확인)
                    startVideoPolling(videoTaskId);
                } else {
                    alert('영상 생성 요청에 실패했습니다: ' + response.data.message);
                    resetVideoUI();
                }
            } catch (error) {
                console.error('영상 생성 오류:', error);
                alert('영상 생성 중 오류가 발생했습니다.');
                resetVideoUI();
            }
        }
        
        function startVideoPolling(videoTaskId) {
            // 기존 폴링 제거
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            
            // 즉시 한 번 확인
            checkVideoStatus(videoTaskId);
            
            // 30초마다 확인
            pollingInterval = setInterval(() => {
                checkVideoStatus(videoTaskId);
            }, 30000);
        }
        
        async function checkVideoStatus(videoTaskId) {
            try {
                const response = await axios.get('/api/video/status/' + videoTaskId);
                
                if (response.data.success) {
                    const data = response.data.data;
                    
                    if (data.status === 'completed') {
                        // 완료
                        clearInterval(pollingInterval);
                        document.getElementById('videoStatusSection').classList.add('hidden');
                        document.getElementById('videoResultSection').classList.remove('hidden');
                        document.getElementById('videoDownloadLink').href = data.videoUrl;
                        document.getElementById('generateVideoBtn').disabled = false;
                        
                        // 작업 목록 새로고침
                        loadData();
                    } else if (data.status === 'failed') {
                        // 실패
                        clearInterval(pollingInterval);
                        alert('영상 생성에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
                        resetVideoUI();
                    } else {
                        // 진행 중
                        document.getElementById('videoStatusText').textContent = 
                            '영상 생성 중... (' + data.status + ')';
                    }
                }
            } catch (error) {
                console.error('상태 확인 오류:', error);
            }
        }
        
        function resetVideoUI() {
            document.getElementById('generateVideoBtn').disabled = false;
            document.getElementById('videoStatusSection').classList.add('hidden');
            document.getElementById('videoResultSection').classList.add('hidden');
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        }
        
        function closeTaskDetailModal() {
            document.getElementById('taskDetailModal').classList.add('hidden');
            currentEditingTask = null;
            resetVideoUI();
        }
        
        // 작업 편집 폼 제출
        document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const taskId = document.getElementById('editTaskId').value;
            const formData = new FormData(e.target);
            
            const updateData = {
                title: formData.get('title'),
                description: formData.get('description'),
                due_date: formData.get('due_date') || null,
                status: formData.get('status'),
                prompt: formData.get('prompt') || null,
                notes: formData.get('notes') || null
            };
            
            // 완료 상태로 변경 시 완료일 설정
            if (updateData.status === 'completed' && currentEditingTask.status !== 'completed') {
                updateData.completed_at = new Date().toISOString().split('T')[0];
            }
            
            try {
                const response = await axios.put('/api/tasks/' + taskId, updateData);
                
                if (response.data.success) {
                    closeTaskDetailModal();
                    loadData();
                } else {
                    alert('작업 수정에 실패했습니다.');
                }
            } catch (error) {
                console.error('작업 수정 실패:', error);
                alert('작업 수정 중 오류가 발생했습니다.');
            }
        });
        
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
            const clientIdStr = formData.get('client_id');
            
            // 고객 ID 유효성 검사
            if (!clientIdStr || clientIdStr === '') {
                alert('고객을 선택해주세요.');
                return;
            }
            
            const clientId = parseInt(clientIdStr, 10);
            const client = allClients.find(c => c.id === clientId);
            
            if (!client) {
                alert('선택한 고객을 찾을 수 없습니다. 페이지를 새로고침 해주세요.');
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
                    alert('저장 완료! 작업이 추가되었습니다.');
                    closeAddTaskModal();
                    loadData();
                }
            } catch (error) {
                console.error('작업 추가 오류:', error);
                alert('작업 추가 실패: ' + (error.response?.data?.message || error.message));
            }
        });
        
        // MP4 Generator로 프롬프트 전송
        function sendToMP4Generator(taskId) {
            const task = allTasks.find(t => t.id == taskId);
            if (!task || !task.prompt) {
                alert('프롬프트가 없습니다. 먼저 프롬프트를 생성해주세요.');
                return;
            }
            
            // MP4 Generator URL에 프롬프트 및 옵션을 쿼리 파라미터로 전달
            const mp4Url = 'https://studiojuai-mp4.pages.dev/';
            const params = new URLSearchParams({
                prompt: task.prompt,
                title: task.title || '',
                client: task.client_name || '',
                ratio: '16:9',
                autoFill: 'true'
            });
            
            // 새 탭에서 MP4 Generator 열기
            window.open(mp4Url + '?' + params.toString(), '_blank');
            
            console.log('MP4 Generator로 전달:', {
                prompt: task.prompt.substring(0, 50) + '...',
                title: task.title,
                client: task.client_name
            });
        }
        
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

// ===== 대시보드 페이지 =====
app.get('/dashboard', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudioJuAI - 대시보드</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
    </style>
</head>
<body class="font-sans">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <aside class="sidebar w-64 p-6 flex flex-col">
            <h1 class="text-2xl font-bold text-white mb-8">StudioJuAI</h1>
            
            <nav class="flex-1">
                <a href="/dashboard" class="sidebar-item active flex items-center gap-3 px-4 py-3 rounded-lg text-white mb-2">
                    <i class="fas fa-home w-5"></i>
                    <span>대시보드</span>
                </a>
                <a href="/clients" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
                    <i class="fas fa-users w-5"></i>
                    <span>고객 관리</span>
                </a>
                <a href="/tasks" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 mb-2">
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
                <h2 class="text-3xl font-bold text-white mb-2">대시보드</h2>
                <p class="text-gray-400">전체 통계 및 현황을 한눈에 확인하세요</p>
            </header>
            
            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                            <p class="text-gray-400 text-sm">전체 작업</p>
                            <p class="text-3xl font-bold text-white mt-2" id="totalTasks">0</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-clipboard-list text-purple-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">진행 중</p>
                            <p class="text-3xl font-bold text-yellow-400 mt-2" id="inProgressTasks">0</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-spinner text-yellow-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">완료율</p>
                            <p class="text-3xl font-bold text-green-400 mt-2" id="completionRate">0%</p>
                        </div>
                        <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-400 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 차트 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- 월별 작업 통계 -->
                <div class="glass-card rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-4">월별 작업 통계</h3>
                    <canvas id="monthlyTasksChart"></canvas>
                </div>
                
                <!-- 고객 유형 분포 -->
                <div class="glass-card rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-4">고객 유형 분포</h3>
                    <canvas id="clientTypeChart"></canvas>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- 작업 상태 분포 -->
                <div class="glass-card rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-4">작업 상태 분포</h3>
                    <canvas id="taskStatusChart"></canvas>
                </div>
                
                <!-- 패키지별 통계 -->
                <div class="glass-card rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-4">패키지별 통계</h3>
                    <canvas id="packageChart"></canvas>
                </div>
            </div>
            
            <!-- 최근 작업 및 고객 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 최근 작업 -->
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">최근 작업</h3>
                        <a href="/tasks" class="text-sm text-blue-400 hover:text-blue-300">전체 보기 →</a>
                    </div>
                    <div id="recentTasks" class="space-y-3">
                        <!-- JavaScript로 동적 생성 -->
                    </div>
                </div>
                
                <!-- 최근 고객 -->
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">최근 고객</h3>
                        <a href="/clients" class="text-sm text-blue-400 hover:text-blue-300">전체 보기 →</a>
                    </div>
                    <div id="recentClients" class="space-y-3">
                        <!-- JavaScript로 동적 생성 -->
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let clients = [];
        let tasks = [];
        
        // 데이터 로드
        async function loadData() {
            try {
                const [clientsRes, tasksRes] = await Promise.all([
                    axios.get('/api/clients'),
                    axios.get('/api/tasks')
                ]);
                
                clients = clientsRes.data.data;
                tasks = tasksRes.data.data;
                
                updateStats();
                renderCharts();
                renderRecentTasks();
                renderRecentClients();
            } catch (error) {
                console.error('데이터 로드 실패:', error);
            }
        }
        
        // 통계 업데이트
        function updateStats() {
            document.getElementById('totalClients').textContent = clients.length;
            document.getElementById('totalTasks').textContent = tasks.length;
            document.getElementById('inProgressTasks').textContent = tasks.filter(t => t.status === 'in_progress').length;
            
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
            document.getElementById('completionRate').textContent = completionRate + '%';
        }
        
        // 차트 렌더링
        function renderCharts() {
            renderMonthlyTasksChart();
            renderClientTypeChart();
            renderTaskStatusChart();
            renderPackageChart();
        }
        
        // 월별 작업 통계 차트
        function renderMonthlyTasksChart() {
            const monthCounts = {};
            const currentDate = new Date();
            
            // 최근 6개월 초기화
            for (let i = 5; i >= 0; i--) {
                const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                monthCounts[key] = 0;
            }
            
            // 작업 개수 카운트
            tasks.forEach(task => {
                if (task.created_at) {
                    const month = task.created_at.substring(0, 7);
                    if (monthCounts.hasOwnProperty(month)) {
                        monthCounts[month]++;
                    }
                }
            });
            
            const labels = Object.keys(monthCounts).map(k => k.substring(5) + '월');
            const data = Object.values(monthCounts);
            
            const ctx = document.getElementById('monthlyTasksChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '작업 수',
                        data: data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: { color: '#fff' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }
        
        // 고객 유형 분포 차트
        function renderClientTypeChart() {
            const brandCount = clients.filter(c => c.type === 'brand').length;
            const individualCount = clients.filter(c => c.type === 'individual').length;
            
            const ctx = document.getElementById('clientTypeChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['업체', '개인'],
                    datasets: [{
                        data: [brandCount, individualCount],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(168, 85, 247, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#fff', padding: 20 }
                        }
                    }
                }
            });
        }
        
        // 작업 상태 분포 차트
        function renderTaskStatusChart() {
            const pending = tasks.filter(t => t.status === 'pending').length;
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            const completed = tasks.filter(t => t.status === 'completed').length;
            
            const ctx = document.getElementById('taskStatusChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['대기 중', '진행 중', '완료'],
                    datasets: [{
                        label: '작업 수',
                        data: [pending, inProgress, completed],
                        backgroundColor: [
                            'rgba(234, 179, 8, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#9ca3af' },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        // 패키지별 통계 차트
        function renderPackageChart() {
            const packageA = clients.filter(c => c.package_id === 'A').length;
            const packageB = clients.filter(c => c.package_id === 'B').length;
            const packageC = clients.filter(c => c.package_id === 'C').length;
            
            const ctx = document.getElementById('packageChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['A 패키지', 'B 패키지', 'C 패키지'],
                    datasets: [{
                        data: [packageA, packageB, packageC],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#fff', padding: 20 }
                        }
                    }
                }
            });
        }
        
        // 최근 작업 렌더링
        function renderRecentTasks() {
            const container = document.getElementById('recentTasks');
            const recentTasks = tasks.slice(0, 5);
            
            if (recentTasks.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-400 py-4">작업이 없습니다</p>';
                return;
            }
            
            container.innerHTML = recentTasks.map(task => 
                '<div class="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition cursor-pointer" onclick="goToTasks()">' +
                    '<div class="flex items-start justify-between mb-2">' +
                        '<div class="flex-1">' +
                            '<h4 class="text-white font-medium text-sm">' + task.title + '</h4>' +
                            '<p class="text-xs text-gray-400 mt-1">' + task.client_name + '</p>' +
                        '</div>' +
                        '<span class="status-badge status-' + task.status + ' text-xs ml-2">' +
                            '<span class="status-dot"></span>' +
                            getStatusText(task.status) +
                        '</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-3 text-xs text-gray-400 mt-2">' +
                        '<span><i class="fas fa-calendar mr-1"></i>' + task.created_at + '</span>' +
                        '<span><i class="fas fa-box mr-1"></i>' + task.package_id + ' 패키지</span>' +
                    '</div>' +
                '</div>'
            ).join('');
        }
        
        // 최근 고객 렌더링
        function renderRecentClients() {
            const container = document.getElementById('recentClients');
            const recentClients = clients.slice(0, 5);
            
            if (recentClients.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-400 py-4">고객이 없습니다</p>';
                return;
            }
            
            container.innerHTML = recentClients.map(client => 
                '<div class="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition cursor-pointer" onclick="goToClients()">' +
                    '<div class="flex items-start justify-between mb-2">' +
                        '<div class="flex-1">' +
                            '<h4 class="text-white font-medium text-sm">' + client.name + '</h4>' +
                            '<p class="text-xs text-gray-400 mt-1">' + client.category + '</p>' +
                        '</div>' +
                        '<span class="status-badge status-' + client.status + ' text-xs ml-2">' +
                            '<span class="status-dot"></span>' +
                            (client.status === 'active' ? '활성' : '일시중지') +
                        '</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-3 text-xs text-gray-400 mt-2">' +
                        '<span><i class="fas fa-' + (client.type === 'brand' ? 'building' : 'user') + ' mr-1"></i>' +
                            (client.type === 'brand' ? '업체' : '개인') +
                        '</span>' +
                        '<span><i class="fas fa-box mr-1"></i>' + client.package_id + ' 패키지</span>' +
                        '<span><i class="fas fa-calendar mr-1"></i>' + client.created_at + '</span>' +
                    '</div>' +
                '</div>'
            ).join('');
        }
        
        // 상태 텍스트
        function getStatusText(status) {
            const map = {
                'pending': '대기 중',
                'in_progress': '진행 중',
                'completed': '완료'
            };
            return map[status] || status;
        }
        
        // 페이지 이동 함수
        function goToTasks() {
            window.location.href = '/tasks';
        }
        
        function goToClients() {
            window.location.href = '/clients';
        }
        
        // 로그아웃
        function logout() {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = 'https://studiojuai-hub.pages.dev';
        }
        
        // 페이지 로드 시 실행
        document.addEventListener('DOMContentLoaded', function() {
            console.log('대시보드 로드 시작...');
            loadData();
        });
        
        // 즉시 실행 (DOMContentLoaded가 이미 발생한 경우 대비)
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            console.log('대시보드 즉시 로드...');
            setTimeout(loadData, 100);
        }
    </script>
</body>
</html>
  `);
});

// ===== 메인 페이지 =====
// 고객 관리 페이지
app.get('/clients', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudioJuAI_Dashboard</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
                <a href="/dashboard" class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white">
                    <i class="fas fa-home w-5"></i>
                    <span>대시보드</span>
                </a>
                <a href="/clients" class="sidebar-item active flex items-center gap-3 px-4 py-3 rounded-lg text-white">
                    <i class="fas fa-users w-5"></i>
                    <span>고객 관리</span>
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
    
    <!-- 고객 상세 모달 -->
    <div id="clientDetailModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="modal-content rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">고객 상세 정보</h3>
                <button onclick="closeClientDetailModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div id="clientDetailContent">
                <!-- JavaScript로 동적 생성 -->
            </div>
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
        async function viewClient(id) {
            try {
                // 고객 정보 가져오기
                const client = allClients.find(c => c.id === id);
                if (!client) return;
                
                // 해당 고객의 작업 목록 가져오기
                const tasksResponse = await axios.get('/api/tasks?client_id=' + id);
                const clientTasks = tasksResponse.data.data;
                
                // 통계 계산
                const totalTasks = clientTasks.length;
                const completedTasks = clientTasks.filter(t => t.status === 'completed').length;
                const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                const inProgressTasks = clientTasks.filter(t => t.status === 'in_progress').length;
                const pendingTasks = clientTasks.filter(t => t.status === 'pending').length;
                
                // 채널 정보 파싱
                let channelsHTML = '';
                try {
                    const channels = JSON.parse(client.channels || '{}');
                    channelsHTML = Object.entries(channels)
                        .map(([key, value]) => 
                            '<div class="flex items-center gap-2 text-sm">' +
                                '<i class="fas fa-' + getChannelIcon(key) + ' w-4 text-gray-400"></i>' +
                                '<span class="text-gray-300">' + formatChannelName(key) + ': ' + value + '</span>' +
                            '</div>'
                        ).join('');
                } catch (e) {
                    channelsHTML = '<p class="text-sm text-gray-400">채널 정보 없음</p>';
                }
                
                // 작업 히스토리 HTML
                const tasksHTML = clientTasks.length > 0 
                    ? clientTasks.map(task => 
                        '<div class="bg-white/5 rounded-lg p-4 border border-white/10">' +
                            '<div class="flex items-start justify-between mb-2">' +
                                '<div class="flex-1">' +
                                    '<h4 class="text-white font-medium">' + task.title + '</h4>' +
                                    '<p class="text-sm text-gray-400 mt-1">' + task.description + '</p>' +
                                '</div>' +
                                '<span class="status-badge status-' + task.status + ' ml-2">' +
                                    '<span class="status-dot"></span>' +
                                    getStatusText(task.status) +
                                '</span>' +
                            '</div>' +
                            '<div class="flex items-center gap-4 text-xs text-gray-400 mt-3">' +
                                '<span><i class="fas fa-calendar mr-1"></i>' + task.created_at + '</span>' +
                                (task.due_date ? '<span><i class="fas fa-clock mr-1"></i>마감: ' + task.due_date + '</span>' : '') +
                                (task.completed_at ? '<span><i class="fas fa-check mr-1"></i>완료: ' + task.completed_at + '</span>' : '') +
                            '</div>' +
                        '</div>'
                    ).join('')
                    : '<p class="text-center text-gray-400 py-8">작업 이력이 없습니다</p>';
                
                // 모달 내용 채우기
                document.getElementById('clientDetailContent').innerHTML = 
                    '<div class="space-y-6">' +
                        '<!-- 기본 정보 -->' +
                        '<div>' +
                            '<h4 class="text-lg font-semibold text-white mb-4">기본 정보</h4>' +
                            '<div class="grid grid-cols-2 gap-4">' +
                                '<div>' +
                                    '<p class="text-sm text-gray-400 mb-1">고객명</p>' +
                                    '<p class="text-white font-medium">' + client.name + '</p>' +
                                '</div>' +
                                '<div>' +
                                    '<p class="text-sm text-gray-400 mb-1">유형</p>' +
                                    '<p class="text-white font-medium">' +
                                        '<i class="fas fa-' + (client.type === 'brand' ? 'building' : 'user') + ' mr-1"></i>' +
                                        (client.type === 'brand' ? '업체' : '개인') +
                                    '</p>' +
                                '</div>' +
                                '<div>' +
                                    '<p class="text-sm text-gray-400 mb-1">카테고리</p>' +
                                    '<p class="text-white font-medium">' + client.category + '</p>' +
                                '</div>' +
                                '<div>' +
                                    '<p class="text-sm text-gray-400 mb-1">패키지</p>' +
                                    '<p class="text-white font-medium">' + client.package_id + ' 패키지</p>' +
                                '</div>' +
                                '<div>' +
                                    '<p class="text-sm text-gray-400 mb-1">상태</p>' +
                                    '<span class="status-badge status-' + client.status + '">' +
                                        '<span class="status-dot"></span>' +
                                        (client.status === 'active' ? '활성' : '일시중지') +
                                    '</span>' +
                                '</div>' +
                                '<div>' +
                                    '<p class="text-sm text-gray-400 mb-1">등록일</p>' +
                                    '<p class="text-white font-medium">' + client.created_at + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- 채널 정보 -->' +
                        '<div>' +
                            '<h4 class="text-lg font-semibold text-white mb-4">채널 정보</h4>' +
                            '<div class="space-y-2">' +
                                channelsHTML +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- 통계 -->' +
                        '<div>' +
                            '<h4 class="text-lg font-semibold text-white mb-4">작업 통계</h4>' +
                            '<div class="grid grid-cols-4 gap-4">' +
                                '<div class="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">' +
                                    '<p class="text-sm text-blue-400 mb-1">전체 작업</p>' +
                                    '<p class="text-2xl font-bold text-white">' + totalTasks + '</p>' +
                                '</div>' +
                                '<div class="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">' +
                                    '<p class="text-sm text-yellow-400 mb-1">대기 중</p>' +
                                    '<p class="text-2xl font-bold text-white">' + pendingTasks + '</p>' +
                                '</div>' +
                                '<div class="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">' +
                                    '<p class="text-sm text-purple-400 mb-1">진행 중</p>' +
                                    '<p class="text-2xl font-bold text-white">' + inProgressTasks + '</p>' +
                                '</div>' +
                                '<div class="bg-green-500/10 rounded-lg p-4 border border-green-500/20">' +
                                    '<p class="text-sm text-green-400 mb-1">완료율</p>' +
                                    '<p class="text-2xl font-bold text-white">' + completionRate + '%</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- 작업 히스토리 -->' +
                        '<div>' +
                            '<h4 class="text-lg font-semibold text-white mb-4">작업 히스토리</h4>' +
                            '<div class="space-y-3 max-h-96 overflow-y-auto">' +
                                tasksHTML +
                            '</div>' +
                        '</div>' +
                    '</div>';
                
                // 모달 열기
                document.getElementById('clientDetailModal').classList.remove('hidden');
            } catch (error) {
                console.error('고객 상세 정보 로드 실패:', error);
                alert('고객 상세 정보를 불러올 수 없습니다.');
            }
        }
        
        // 채널 아이콘 매핑
        function getChannelIcon(channel) {
            const icons = {
                'instagram': 'instagram',
                'youtube': 'youtube',
                'tiktok': 'video',
                'naver_blog': 'blog',
                'facebook': 'facebook'
            };
            return icons[channel] || 'link';
        }
        
        // 채널 이름 포맷팅
        function formatChannelName(channel) {
            const names = {
                'instagram': 'Instagram',
                'youtube': 'YouTube',
                'tiktok': 'TikTok',
                'naver_blog': 'Naver Blog',
                'facebook': 'Facebook'
            };
            return names[channel] || channel;
        }
        
        // 상태 텍스트
        function getStatusText(status) {
            const map = {
                'pending': '대기 중',
                'in_progress': '진행 중',
                'completed': '완료'
            };
            return map[status] || status;
        }
        
        // 고객 상세 모달 닫기
        function closeClientDetailModal() {
            document.getElementById('clientDetailModal').classList.add('hidden');
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
