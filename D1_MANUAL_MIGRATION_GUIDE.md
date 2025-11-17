# D1 데이터베이스 수동 마이그레이션 가이드

## ⚠️ API 토큰 권한 문제
프로덕션 D1 마이그레이션에 필요한 API 권한이 없어서 수동으로 진행해야 합니다.

## ✅ Cloudflare Dashboard에서 SQL 실행

### 1단계: Console 탭으로 이동
현재 `studiojuai-production` 데이터베이스 페이지에서:
- 상단 탭에서 **"Console"** 클릭

### 2단계: SQL 파일 내용 복사
아래 파일의 전체 내용을 복사하세요:
📁 `/home/user/studiojuai-dashboard/d1_complete_migration.sql`

또는 아래 SQL을 직접 복사:

---

```sql
-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('brand', 'individual')),
  category TEXT NOT NULL,
  package_id TEXT NOT NULL CHECK(package_id IN ('A', 'B', 'C')),
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'inactive')),
  channels TEXT,
  brand_info TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  package_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  completed_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_package ON clients(package_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Triggers
CREATE TRIGGER IF NOT EXISTS update_clients_updated_at
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Demo Data
INSERT INTO clients (name, type, category, package_id, username, status, channels, brand_info) VALUES 
('카페 더 라운지', 'brand', '카페/음료', 'B', 'cafe_lounge', 'active',
 '{"instagram":"@cafe_lounge","naver_blog":"https://blog.naver.com/cafe_lounge"}',
 '{"industry":"카페","target_audience":"20-30대 여성","style":["모던","감성적"],"tone":"친근하고 편안한"}'),
('김민지', 'individual', '뷰티/패션', 'A', 'minji_beauty', 'active',
 '{"instagram":"@minji_beauty","youtube":"https://youtube.com/@minjibeauty","tiktok":"@minji_beauty_official"}',
 '{"industry":"뷰티 크리에이터","target_audience":"10-20대","style":["트렌디","발랄"],"tone":"친근하고 재미있는"}'),
('피트니스 헬스클럽', 'brand', '건강/운동', 'C', 'fitness_club', 'paused',
 '{"instagram":"@fitness_healthclub"}',
 '{"industry":"피트니스","target_audience":"20-40대","style":["역동적","전문적"],"tone":"동기부여하는"}');

INSERT INTO tasks (client_id, client_name, title, description, prompt, status, package_id, created_at, due_date) VALUES
(1, '카페 더 라운지', '신메뉴 프로모션 영상', '봄 시즌 신메뉴 론칭 프로모션용 숏폼 영상 제작',
 'A cozy modern cafe interior showcasing new spring menu items with pastel colors and warm lighting, targeting 20-30s female audience, friendly and comfortable tone.',
 'in_progress', 'B', '2025-11-15', '2025-11-20'),
(2, '김민지', '뷰티 튜토리얼 콘텐츠', '가을 메이크업 튜토리얼 영상 - 데일리 룩',
 'A trendy and lively beauty tutorial showing autumn makeup look, targeting 10-20s audience, fun and friendly tone with vibrant colors.',
 'completed', 'A', '2025-11-10', '2025-11-17'),
(1, '카페 더 라운지', '고객 후기 영상', '단골 고객 인터뷰 및 매장 분위기 촬영', '',
 'pending', 'B', '2025-11-17', '2025-11-25'),
(3, '피트니스 헬스클럽', '회원 모집 광고', '11월 회원 모집 이벤트 광고 영상',
 'A dynamic and professional fitness club promotional video showing workout sessions, targeting 20-40s, motivating tone with energetic music.',
 'pending', 'C', '2025-11-17', '2025-11-22');

UPDATE tasks SET completed_at = '2025-11-16' WHERE id = 2;
```

---

### 3단계: Console에 붙여넣고 실행
1. Console 입력창에 위 SQL을 붙여넣기
2. **"Execute"** 또는 **"Run"** 버튼 클릭
3. 성공 메시지 확인

### 4단계: 확인
다음 SQL로 데이터 확인:
```sql
SELECT * FROM clients;
SELECT * FROM tasks;
```

---

## ✅ 완료 후
SQL 실행이 완료되면 저에게 알려주세요!
다음 단계: API 코드를 D1으로 변경하고 배포하겠습니다. 🚀
