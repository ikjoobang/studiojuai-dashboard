# StudioJuAI_Dashboard

## ❶ 프로젝트 개요

**■ 프로젝트명:** StudioJuAI Dashboard (관리 시스템)

**■ 목표:**
- 고객(업체/개인) 통합 관리
- 콘텐츠 생성 작업 관리
- AI 프롬프트 생성 및 관리
- 통계 및 사용량 모니터링

**■ 주요 기능:**
- ✔️ 고객 목록 조회 및 필터링
- ✔️ 고객 상세 정보 관리 (CRUD)
- ✔️ 실시간 통계 대시보드
- ✔️ 글래스모피즘 디자인 UI
- ✔️ 반응형 레이아웃
- ✔️ RESTful API 제공

---

## ❷ URL 정보

**■ 로컬 개발:**
- http://localhost:3001

**■ 샌드박스 테스트:**
- https://3001-if5qavji70fpyq4wva2u5-5c13a017.sandbox.novita.ai

**■ 프로덕션 (예정):**
- https://studiojuai-dashboard.pages.dev

**■ Hub 연동:**
- Hub: https://3000-if5qavji70fpyq4wva2u5-5c13a017.sandbox.novita.ai

**■ GitHub 저장소:**
- https://github.com/ikjoobang/studiojuai-dashboard

---

## ❸ API 엔드포인트

### **고객 관리 API**

```bash
# 고객 목록 조회
GET /api/clients
Query: ?type=brand|individual&status=active|paused

# 고객 상세 조회
GET /api/clients/:id

# 고객 생성
POST /api/clients
Body: { name, type, category, package_id, username, brand_info }

# 고객 수정
PUT /api/clients/:id
Body: { ...fields }

# 고객 삭제
DELETE /api/clients/:id
```

### **프롬프트 생성 API**

```bash
# AI 프롬프트 생성 (GPT-4 Mini)
POST /api/prompts/generate
Body: { client_id, request }
```

---

## ❹ 데이터 아키텍처

### **고객 데이터 모델**

```typescript
interface Client {
  id: string;
  name: string;
  type: 'brand' | 'individual';
  category: string;
  package_id: 'A' | 'B' | 'C';
  username: string;
  status: 'active' | 'paused' | 'inactive';
  brand_info: {
    industry: string;
    target_audience: string;
    style: string[];
    tone: string;
  };
  created_at: string;
}
```

### **데모 고객 데이터**

1. **카페 더 라운지** (업체, B 패키지)
2. **김민지** (개인, A 패키지) 
3. **피트니스 헬스클럽** (업체, C 패키지)

### **스토리지 서비스 (예정)**

- **Supabase**: 고객 정보, 프롬프트 저장
- **Cloudflare KV**: 세션 캐시
- **Cloudflare D1**: 작업 로그

---

## ❺ 사용 가이드

### **대시보드 접속**

1. Hub에서 로그인
2. Dashboard로 자동 리다이렉션
3. 사이드바에서 메뉴 선택

### **고객 관리**

**■ 필터링:**
- 전체 / 업체 / 개인 버튼 클릭

**■ 고객 추가:**
1. "고객 추가" 버튼 클릭
2. 폼 작성 (이름, 유형, 카테고리, 패키지, 아이디)
3. "추가" 버튼 클릭

**■ 고객 상세 보기:**
- 고객 카드 클릭 (개발 예정)

### **프롬프트 생성 (예정)**

1. 고객 선택
2. 요청사항 입력
3. GPT-4 Mini가 자동 생성
4. 프롬프트 검토 및 승인

---

## ❻ 개발 정보

### **기술 스택**

- **Backend:** Hono (Cloudflare Workers)
- **Frontend:** HTML + TailwindCSS + Vanilla JS
- **Icons:** Font Awesome
- **HTTP Client:** Axios
- **Database:** Supabase (예정)
- **Deployment:** Cloudflare Pages
- **Process Manager:** PM2

### **개발 명령어**

```bash
# 의존성 설치
npm install

# 로컬 개발 서버
npm run dev

# 빌드
npm run build

# 샌드박스 서버 시작
npm run clean-port
pm2 start ecosystem.config.cjs

# 프로덕션 배포
npm run deploy:prod

# API 테스트
curl http://localhost:3001/api/clients
```

### **환경 변수**

```bash
# .dev.vars
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
```

---

## ❼ 배포 상태

**■ 현재 상태:** ✅ 로컬 개발 완료

**■ 배포 플랫폼:** Cloudflare Pages (예정)

**■ 마지막 업데이트:** 2025-11-17

**■ 다음 단계:**
1. Supabase 데이터베이스 연동
2. OpenAI API 프롬프트 생성
3. 고객 상세 페이지 구현
4. 작업 관리 페이지 구현
5. GitHub 푸시
6. Cloudflare Pages 배포

---

## ❽ 완료된 기능

✅ Hono 프로젝트 구조 생성  
✅ 글래스모피즘 대시보드 UI  
✅ 사이드바 네비게이션  
✅ 고객 목록 조회 (데모)  
✅ 고객 통계 카드  
✅ 필터링 기능 (전체/업체/개인)  
✅ 고객 추가 모달  
✅ RESTful API (CRUD)  
✅ 반응형 디자인  
✅ PM2 프로세스 관리  
✅ Git 저장소 초기화  

---

## ❾ 미구현 기능

⏳ Supabase 실제 데이터 연동  
⏳ OpenAI GPT-4 Mini 프롬프트 생성  
⏳ 고객 상세 페이지  
⏳ 작업 관리 페이지  
⏳ 콘텐츠 관리 페이지  
⏳ 통계 차트 (Chart.js)  
⏳ 검색 기능  
⏳ 페이지네이션  
⏳ 파일 업로드  
⏳ 알림 시스템  

---

## ❿ 추천 개발 순서

1. **Supabase 설정** (clients 테이블)
2. **API 실제 연동** (Supabase CRUD)
3. **OpenAI 통합** (프롬프트 생성)
4. **고객 상세 페이지** (전체 정보 표시)
5. **작업 관리 페이지** (Task CRUD)
6. **콘텐츠 관리** (MP4 시스템 연동)
7. **통계 대시보드** (Chart.js 차트)
8. **GitHub 푸시**
9. **Cloudflare 배포**

---

## 📞 문의 및 지원

**■ 웹사이트:** https://www.studiojuai.com

**■ Twitter:** @STUDIO_JU_AI

**■ 라이선스:** © 2025. ALL RIGHTS RESERVED.

---

**🚀 StudioJuAI Dashboard - 통합 관리 시스템**
