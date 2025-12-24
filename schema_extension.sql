-- データベーススキーマの拡張

-- 1. 拠点マスタテーブルを追加
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. profilesテーブルに拠点情報を追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES offices(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id);

-- 3. roleに'manager'を追加
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('executive', 'manager', 'member'));

-- 4. worksテーブルに割り当て情報を追加
ALTER TABLE works ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id);
ALTER TABLE works ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES offices(id);

-- 5. サンプル拠点データを挿入
INSERT INTO offices (name, region) VALUES
  ('東京本社', '関東'),
  ('大阪支社', '関西'),
  ('名古屋支店', '中部'),
  ('福岡支店', '九州')
ON CONFLICT DO NOTHING;

-- 6. 既存のユーザーに拠点を割り当て（サンプル）
-- 実際の拠点IDは SELECT * FROM offices; で確認してください
-- UPDATE profiles SET office_id = (SELECT id FROM offices WHERE name = '東京本社' LIMIT 1) 
-- WHERE email = 'admin@test.com';

-- 7. Indexを追加
CREATE INDEX IF NOT EXISTS idx_profiles_office_id ON profiles(office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_works_assigned_by ON works(assigned_by);
CREATE INDEX IF NOT EXISTS idx_works_office_id ON works(office_id);

-- 8. RLSポリシーの準備（後で有効化）
-- 現在は無効化されているので、後で設定します

COMMENT ON COLUMN profiles.office_id IS '所属拠点ID';
COMMENT ON COLUMN profiles.manager_id IS '直属の上司（Manager）のID';
COMMENT ON COLUMN works.assigned_by IS 'このWorkを割り当てた人のID';
COMMENT ON COLUMN works.office_id IS 'このWorkが所属する拠点ID';
