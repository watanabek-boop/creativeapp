-- まず、作成したユーザーのIDを確認
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- 上記で表示されたIDを使って、以下のSQLを実行
-- admin@test.com のID と member@test.com のID をコピーして貼り付けてください

-- Executive のプロフィールを挿入（IDを実際のものに置き換える）
INSERT INTO public.profiles (id, role, email, full_name)
VALUES 
  ('ここにadmin@test.comのユーザーIDを貼り付け', 'executive', 'admin@test.com', '経営者');

-- Member のプロフィールを挿入（IDを実際のものに置き換える）
INSERT INTO public.profiles (id, role, email, full_name)
VALUES 
  ('ここにmember@test.comのユーザーIDを貼り付け', 'member', 'member@test.com', '社員');

-- 確認
SELECT * FROM public.profiles;
