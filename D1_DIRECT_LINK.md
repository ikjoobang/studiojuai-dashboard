# 🔗 Cloudflare D1 Console 직접 링크

## 📍 studiojuai-production 데이터베이스 Console

👉 **https://dash.cloudflare.com/764ebfb0ce23114e62876b1873e2154f/workers/d1/bbb5a632-10a7-4b1e-ba0e-12f945fa9107**

---

## 🎯 빠른 실행 가이드

### 1. 위 링크 클릭
### 2. Console 탭 클릭 (상단 메뉴)
### 3. 아래 SQL 복사 & 붙여넣기
### 4. Execute 버튼 클릭

---

## 📋 실행할 SQL

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

CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_package ON clients(package_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

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

## ✅ 실행 완료 후
저에게 "완료"라고 알려주시면 다음 단계를 진행하겠습니다! 🚀
