-- 一時的な解決策：RLSを無効化してテスト
-- 本番環境では使用しないでください

-- RLSを無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE works DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkins DISABLE ROW LEVEL SECURITY;

-- すべてのポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Executives can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Members can view their own works" ON works;
DROP POLICY IF EXISTS "Members can create their own works" ON works;
DROP POLICY IF EXISTS "Members can update their own works" ON works;
DROP POLICY IF EXISTS "Executives can view all works" ON works;
DROP POLICY IF EXISTS "Members can view their own checkins" ON checkins;
DROP POLICY IF EXISTS "Members can create their own checkins" ON checkins;
DROP POLICY IF EXISTS "Executives can view all checkins" ON checkins;
