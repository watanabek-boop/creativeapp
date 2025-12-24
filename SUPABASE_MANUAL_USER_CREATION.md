# Supabase でユーザーを直接作成する方法

Email 確認の設定が見つからない場合、Supabase Dashboard から直接ユーザーを作成できます。

## 手順

### 1. Authentication → Users に移動

1. 左サイドバーの **「Authentication」** をクリック
2. **「Users」** をクリック

### 2. 新規ユーザーを作成

1. 右上の **「Add user」** または **「Create user」** ボタンをクリック
2. **「Create new user」** を選択
3. 以下の情報を入力：

**Executive（経営者）アカウント:**
```
Email: admin@test.com
Password: admin123456
Auto confirm user: ✅ ON にする（重要！）
```

**Member（社員）アカウント:**
```
Email: member@test.com
Password: member123456
Auto confirm user: ✅ ON にする（重要！）
```

4. **「Create user」** をクリック

### 3. プロフィールを手動で追加

ユーザー作成後、`profiles` テーブルに手動でレコードを追加する必要があります。

#### Table Editor で profiles を編集

1. 左サイドバーの **「Table Editor」** をクリック
2. **「profiles」** テーブルを選択
3. 右上の **「Insert」** → **「Insert row」** をクリック
4. 以下の情報を入力：

**Executive の場合:**
```
id: [Authentication → Users から admin@test.com のユーザーIDをコピー]
role: executive
email: admin@test.com
full_name: 経営者
```

**Member の場合:**
```
id: [Authentication → Users から member@test.com のユーザーIDをコピー]
role: member
email: member@test.com
full_name: 社員
```

5. **「Save」** をクリック

---

## より簡単な方法: SQL で一括作成

または、SQL Editor で以下のコマンドを実行：

### 1. ユーザーIDを確認

```sql
-- 作成したユーザーのIDを確認
SELECT id, email FROM auth.users;
```

### 2. プロフィールを挿入

```sql
-- admin@test.com のユーザーID を使う
INSERT INTO public.profiles (id, role, email, full_name)
VALUES 
  ('ここにadminのユーザーIDを貼り付け', 'executive', 'admin@test.com', '経営者');

-- member@test.com のユーザーID を使う  
INSERT INTO public.profiles (id, role, email, full_name)
VALUES 
  ('ここにmemberのユーザーIDを貼り付け', 'member', 'member@test.com', '社員');
```

---

## ログインしてテスト

1. アプリにアクセス: https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai
2. 「ログイン」タブをクリック
3. 作成したユーザーでログイン：
   - Executive: `admin@test.com` / `admin123456`
   - Member: `member@test.com` / `member123456`

---

## トラブルシューティング

### エラー: "User not confirmed"

ユーザー作成時に「Auto confirm user」を ON にし忘れた場合：

1. Authentication → Users を開く
2. ユーザーの行をクリック
3. **「Email confirmed at」** に現在の日時を設定
4. Save

### エラー: プロフィールが見つからない

`profiles` テーブルにレコードが追加されているか確認：

```sql
SELECT * FROM public.profiles;
```

空の場合、上記の SQL で挿入してください。
