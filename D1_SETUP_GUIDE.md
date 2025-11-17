# Cloudflare D1 데이터베이스 생성 가이드

## 문제 상황
현재 API 토큰에 D1 데이터베이스 생성 권한이 없어서 자동 생성이 불가능합니다.

## 해결 방법 (2가지 옵션)

---

## 옵션 1: Cloudflare Dashboard에서 직접 생성 (권장) ⭐

### 1단계: Cloudflare Dashboard 접속
https://dash.cloudflare.com/764ebfb0ce23114e62876b1873e2154f

### 2단계: D1 메뉴로 이동
- 좌측 사이드바에서 **Workers & Pages** 클릭
- **D1 SQL Database** 클릭

### 3단계: 데이터베이스 생성
- **"Create database"** 버튼 클릭
- Database name: `studiojuai-db` 입력
- **"Create"** 버튼 클릭

### 4단계: Database ID 복사
- 생성된 데이터베이스를 클릭
- **Database ID** 를 복사 (예: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 5단계: ID를 알려주세요
Database ID를 복사해서 저에게 알려주시면, 즉시 통합 작업을 진행하겠습니다!

---

## 옵션 2: API 토큰 권한 업그레이드

### 1단계: API Tokens 페이지 접속
https://dash.cloudflare.com/764ebfb0ce23114e62876b1873e2154f/api-tokens

### 2단계: 현재 토큰 수정
- 사용 중인 토큰의 **"Edit"** 클릭

### 3단계: 권한 추가
다음 권한들을 추가해야 합니다:
- ✅ **Account** - **D1** - **Edit**
- ✅ **Account** - **Workers Scripts** - **Edit**
- ✅ **Zone** - **Workers Routes** - **Edit**

### 4단계: 토큰 저장 후 재시도
권한을 추가한 후 다시 시도하면 자동 생성이 가능합니다.

---

## 어떤 방법을 선택하시겠습니까?

**옵션 1 (권장)**: 빠르고 간단. Dashboard에서 생성 후 ID만 알려주시면 됩니다.
**옵션 2**: API 토큰 권한 추가 필요. 향후 자동화에 유리합니다.

## 다음 단계 (ID를 받은 후)

1. `wrangler.jsonc` 업데이트
2. D1 마이그레이션 실행 (스키마 생성)
3. 시드 데이터 주입
4. API 코드를 D1으로 변경
5. 빌드 & 배포
6. 프로덕션 테스트

---

**대기 중**: Database ID 또는 토큰 권한 업그레이드 🔑
