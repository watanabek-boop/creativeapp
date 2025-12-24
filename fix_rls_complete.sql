-- RLSポリシーの完全な修正（無限再帰を回避）

-- 既存のポリシーを削除
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

-- Profiles policies（修正版）
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Executives can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'executive'
      LIMIT 1
    )
  );

-- Works policies（修正版）
CREATE POLICY "Members can view their own works"
  ON works FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create their own works"
  ON works FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update their own works"
  ON works FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Executives can view all works"
  ON works FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'executive'
      LIMIT 1
    )
  );

-- Check-ins policies（修正版）
CREATE POLICY "Members can view their own checkins"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create their own checkins"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Executives can view all checkins"
  ON checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'executive'
      LIMIT 1
    )
  );
