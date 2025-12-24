-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Executives can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Executives can view all works" ON works;
DROP POLICY IF EXISTS "Executives can view all checkins" ON checkins;

-- 修正版：無限再帰を避けるポリシー
-- Executivesは自分のroleをuser_metadataから直接チェック
CREATE POLICY "Executives can view all profiles"
  ON profiles FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'executive'
  );

CREATE POLICY "Executives can view all works"
  ON works FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'executive'
  );

CREATE POLICY "Executives can view all checkins"
  ON checkins FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'executive'
  );
