# StudioJuAI Dashboard

## 프로젝트 개요
StudioJuAI Dashboard는 마케팅 영상 제작 작업을 관리하는 통합 대시보드입니다.

## 주요 기능

### ✅ 1. MP4 Generator 완전 통합
- **자동 영상 생성**: 작업 상세 모달에서 직접 영상 생성 요청
- **AI 모델 선택**: Sora 2, Sora 2 Pro, Veo 3.1, Veo 3.1 Fast, Kling v2.5 Turbo/Pro
- **실시간 상태 추적**: 30초마다 자동 폴링으로 생성 상태 확인
- **프롬프트 자동 생성**: OpenAI GPT-4o-mini로 영상 프롬프트 최적화
- **다운로드 지원**: 완성된 영상 자동 다운로드 링크 제공
- **데이터베이스 연동**: video_task_id, video_status, video_url 자동 저장

### ✅ 2. 고객 상세 페이지
- **기본 정보**: 이름, 유형, 카테고리, 패키지, 상태, 등록일
- **채널 정보**: Instagram, YouTube, TikTok, Naver Blog
- **작업 통계**: 전체 작업, 대기 중, 진행 중, 완료율
- **작업 히스토리**: 해당 고객의 모든 작업 목록

### ✅ 3. 작업 상세 편집
- 작업 정보 수정 (제목, 설명, 마감일, 상태)
- 프롬프트 재생성 (OpenAI API 연동)
- 메모/노트 필드 추가
- 실시간 작업 정보 업데이트

### ✅ 4. 검색 및 필터링 강화
- **검색**: 고객명 또는 작업 제목으로 실시간 검색
- **날짜 필터**: 시작일/종료일로 작업 기간 필터링
- **패키지 필터**: A/B/C 패키지별 필터링
- **상태 필터**: 대기 중/진행 중/완료 필터링
- **초기화 버튼**: 모든 필터 한번에 초기화

### ✅ 5. 통계 대시보드 (Chart.js)
- **월별 작업 통계**: 최근 6개월 작업 추이 (Line Chart)
- **고객 유형 분포**: 업체/개인 비율 (Doughnut Chart)
- **작업 상태 분포**: 대기/진행/완료 개수 (Bar Chart)
- **패키지별 통계**: A/B/C 패키지 분포 (Pie Chart)
- **통계 카드**: 전체 고객, 전체 작업, 진행 중, 완료율
- **최근 활동**: 최근 작업 5개, 최근 고객 5개 목록

## 기술 스택

### Frontend
- **Framework**: HTML5, Tailwind CSS
- **Charts**: Chart.js 4.4.0
- **Icons**: FontAwesome 6.4.0
- **HTTP Client**: Axios 1.6.0

### Backend
- **Framework**: Hono (Cloudflare Workers)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **AI API**: 
  - OpenAI GPT-4o-mini (프롬프트 자동 생성)
  - MP4 Generator API (영상 생성 - Sora 2, Veo 3.1, Kling v2.5)

### Development
- **Build Tool**: Vite 5.0.0
- **Language**: TypeScript 5.0.0
- **Process Manager**: PM2
- **CLI**: Wrangler 3.78.0

## 데이터베이스 스키마

### Clients Table
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('brand', 'individual')),
  category TEXT NOT NULL,
  package_id TEXT NOT NULL CHECK(package_id IN ('A', 'B', 'C')),
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  channels TEXT,  -- JSON
  brand_info TEXT,  -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  package_id TEXT NOT NULL,
  notes TEXT,
  video_task_id TEXT,              -- MP4 Generator task ID
  video_status TEXT DEFAULT 'pending',  -- pending/processing/completed/failed
  video_url TEXT,                  -- 완성된 영상 URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  completed_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

## API 엔드포인트

### Clients
- `GET /api/clients` - 고객 목록 조회
- `GET /api/clients/:id` - 고객 상세 조회
- `POST /api/clients` - 고객 추가
- `PUT /api/clients/:id` - 고객 수정
- `DELETE /api/clients/:id` - 고객 삭제

### Tasks
- `GET /api/tasks` - 작업 목록 조회
- `GET /api/tasks?client_id=1` - 특정 고객의 작업 조회
- `GET /api/tasks?status=pending` - 상태별 작업 조회
- `GET /api/tasks/:id` - 작업 상세 조회
- `POST /api/tasks` - 작업 추가
- `PUT /api/tasks/:id` - 작업 수정
- `DELETE /api/tasks/:id` - 작업 삭제

### AI & Video Generation
- `POST /api/prompt/generate` - AI 프롬프트 자동 생성 (OpenAI GPT-4o-mini)
- `POST /api/video/generate` - 영상 생성 요청 (MP4 Generator)
- `GET /api/video/status/:videoTaskId` - 영상 생성 상태 확인

## 로컬 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.dev.vars` 파일 생성:
```
OPENAI_API_KEY=your-openai-api-key
MP4_API_KEY=your-mp4-generator-api-key
MP4_API_BASE=https://studiojuai-mp4.pages.dev/api/external
```

### 3. 데이터베이스 마이그레이션
```bash
# 로컬 D1 데이터베이스 마이그레이션
npx wrangler d1 migrations apply studiojuai-production --local
```

### 4. 개발 서버 실행
```bash
# 빌드
npm run build

# PM2로 실행
pm2 start ecosystem.config.cjs
```

### 5. 테스트
```bash
# API 테스트
curl http://localhost:3000/api/clients
curl http://localhost:3000/api/tasks

# 페이지 테스트
open http://localhost:3000/dashboard
```

## 프로덕션 배포

### Cloudflare Pages 배포
```bash
# 1. 빌드
npm run build

# 2. 배포
npm run deploy
```

### 환경 변수 설정
Cloudflare Pages 대시보드에서 설정:
- `OPENAI_API_KEY`: OpenAI API 키
- `MP4_API_KEY`: MP4 Generator API 키
- `MP4_API_BASE`: MP4 Generator API 엔드포인트
- D1 Database: `studiojuai-production` 바인딩

## 디렉토리 구조
```
studiojuai-dashboard/
├── src/
│   └── index.tsx              # 메인 애플리케이션
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_seed_data.sql
│   ├── 0003_add_notes_column.sql
│   └── 0004_add_video_fields.sql
├── public/                    # 정적 파일
├── dist/                      # 빌드 출력
├── ecosystem.config.cjs       # PM2 설정
├── wrangler.jsonc            # Cloudflare 설정
├── package.json
├── tsconfig.json
└── README.md
```

## 성능 메트릭
- API 응답 시간: 5-17ms
- 데이터베이스 쿼리: 0-1ms
- 페이지 로드: <100ms
- 프롬프트 생성: ~5.7초 (OpenAI GPT-4o-mini)
- 영상 생성 요청: ~1.7초 (MP4 Generator)
- 영상 생성 완료: 2-5분 (AI 모델에 따라 다름)

## 테스트 상태
✅ 프론트엔드: 3/3 페이지 정상
✅ 백엔드 API: 8/8 엔드포인트 정상 (Clients 5개 + Tasks 3개)
✅ 데이터베이스: 연결 및 쿼리 정상
✅ 미들웨어: CORS, Logging 정상
✅ 기능 구현: 5/5 완료
✅ MP4 Generator 통합: OpenAI + 영상 생성 API 정상
✅ 외부 API: OpenAI API, MP4 Generator API 연결 확인

**전체 테스트 통과율: 100%**

상세 테스트 리포트: [MP4_INTEGRATION_TEST.md](./MP4_INTEGRATION_TEST.md)

## 라이선스
Private

## 개발자
StudioJuAI Team

## 마지막 업데이트
2025-11-19
