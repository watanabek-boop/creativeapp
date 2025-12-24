-- ================================================
-- Phase 3: 3階層権限システムへの移行
-- ================================================

-- 1. profiles テーブルに region カラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;

-- 2. 既存ユーザーに地域情報を設定（office から自動取得）
UPDATE profiles 
SET region = offices.region
FROM offices
WHERE profiles.office_id = offices.id
  AND profiles.region IS NULL;

-- 3. role の制約を更新（3階層に変更）
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('regional_manager', 'base_manager', 'member'));

-- 4. 既存ユーザーの役割を変更
-- admin@test.com を地域責任者（関東）に変更
UPDATE profiles 
SET role = 'regional_manager', 
    region = '関東'
WHERE email = 'admin@test.com';

-- member@test.com はそのまま member として残す
-- （後で拠点責任者を新規作成します）

-- 5. Index を追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 6. 確認用クエリ
SELECT 
  email, 
  role, 
  region,
  offices.name as office_name,
  offices.region as office_region
FROM profiles
LEFT JOIN offices ON profiles.office_id = offices.id
ORDER BY role, email;

-- 期待される結果:
-- admin@test.com: regional_manager, 関東, 東京本社
-- member@test.com: member, 関東, 東京本社
