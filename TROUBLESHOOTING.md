# トラブルシューティングガイド

## 問題: URLでアプリが開かない

### 解決方法 1: ブラウザキャッシュのクリア

**Chrome / Edge:**
1. `Ctrl + Shift + Delete` (Windows) / `Cmd + Shift + Delete` (Mac)
2. 「キャッシュされた画像とファイル」を選択
3. 「データを削除」をクリック

**または、強制リロード:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 解決方法 2: シークレット/プライベートモードで開く

**Chrome:**
- `Ctrl + Shift + N` (Windows) / `Cmd + Shift + N` (Mac)

**Firefox:**
- `Ctrl + Shift + P` (Windows) / `Cmd + Shift + P` (Mac)

シークレットモードで以下のURLを開く：
```
https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai
```

### 解決方法 3: 開発者ツールでエラー確認

1. ブラウザで `F12` を押して開発者ツールを開く
2. 「Console」タブを確認
3. エラーメッセージがあればスクリーンショットを撮る

### 解決方法 4: 直接ファイルにアクセスして確認

以下のURLが開くか確認：
- **HTML**: https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai
- **JavaScript**: https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai/static/app.js

もし JavaScript ファイルが表示されれば、サーバーは正常に動作しています。

---

## Supabase 連携の確認

### 1. Supabase ダッシュボードで確認

1. https://app.supabase.com/ にログイン
2. プロジェクトを選択
3. 左サイドバーの「Table Editor」をクリック
4. 以下のテーブルが存在するか確認：
   - `profiles`
   - `works`
   - `checkins`

### 2. RLS ポリシーの確認

1. 「Authentication」→「Policies」
2. 各テーブルに以下のポリシーが設定されているか確認：
   - ✅ Members can view their own works
   - ✅ Executives can view all works
   - ✅ など（`supabase_schema.sql` 参照）

### 3. メール設定の確認

Supabase のメール認証設定：
1. 「Authentication」→「Email Templates」
2. 「Enable email confirmations」の状態を確認

**開発中は無効化することを推奨**：
1. 「Authentication」→「Settings」
2. 「Enable email confirmations」を **OFF** にする
3. これでメール確認なしでサインアップできます

---

## API 接続テスト

### ローカルでテスト

```bash
# サインアップのテスト
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@test.com","password":"password123","role":"member","full_name":"Test User"}'

# レスポンス例（成功）:
# {"user":{...},"session":{...}}

# レスポンス例（エラー）:
# {"error":"Email address is invalid"}
```

もし "Email address is invalid" エラーが出る場合：
→ Supabase で「Enable email confirmations」を OFF にしてください

---

## よくある問題

### 問題: "Invalid token" エラー

**原因**: localStorage に古いトークンが残っている

**解決**:
1. ブラウザの開発者ツールを開く（F12）
2. Console タブで以下を実行：
   ```javascript
   localStorage.clear()
   location.reload()
   ```

### 問題: CORS エラー

**原因**: API リクエストがブロックされている

**解決**: すでに CORS 設定済みなので、ブラウザキャッシュをクリアしてください

### 問題: 404 Not Found

**原因**: 静的ファイルのパスが間違っている

**解決**: すでに修正済み（`/static/app.js`）

---

## サーバーの再起動

問題が解決しない場合、サーバーを再起動：

```bash
cd /home/user/webapp
pm2 delete all
fuser -k 3000/tcp 2>/dev/null || true
npm run build
pm2 start ecosystem.config.cjs
```

---

## サポート

それでも問題が解決しない場合：
1. ブラウザの開発者ツールのスクリーンショット
2. Supabase のエラーログ
3. PM2 のログ（`pm2 logs --nostream`）

を共有してください。
