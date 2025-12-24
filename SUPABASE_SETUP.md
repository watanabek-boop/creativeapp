# Supabase メール認証設定ガイド

## 問題: "Email address is invalid" エラー

このエラーは Supabase のメール認証設定が原因です。

### 解決方法 1: メール確認を無効化（開発環境推奨）

#### 手順:

1. **Supabase ダッシュボードにログイン**
   - https://app.supabase.com/

2. **プロジェクトを選択**
   - `niensxdvrokegaolqtlf` プロジェクトを開く

3. **Authentication 設定を開く**
   - 左サイドバーから「Authentication」をクリック
   - 「Settings」タブをクリック

4. **Email 設定を変更**
   - 「Email」セクションを見つける
   - **"Enable email confirmations"** を **OFF** にする
   - 「Save」をクリック

#### この設定により：
- ✅ メール確認なしでサインアップ可能
- ✅ 開発・テストが簡単になる
- ⚠️ 本番環境では ON に戻すことを推奨

---

## 解決方法 2: カスタムドメインのメール設定（本番環境向け）

本番環境でメール確認を有効にする場合：

1. **SMTP 設定を行う**
   - Authentication → Settings → Email
   - Custom SMTP を設定
   - SendGrid、Mailgun、AWS SES などを使用

2. **メールテンプレートをカスタマイズ**
   - Authentication → Email Templates
   - Confirm signup テンプレートを編集

---

## 解決方法 3: 許可するメールドメインを設定

1. **Authentication → Settings**
2. 「Email Auth」セクション
3. **"Allow list of email domains"** に以下を追加：
   ```
   gmail.com, yahoo.com, outlook.com, example.com
   ```
4. または空欄にして全ドメインを許可

---

## テスト方法

設定変更後、以下でテスト：

### ブラウザから:
1. アプリの URL を開く: https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai
2. 「サインアップ」タブをクリック
3. 以下の情報を入力：
   - メール: `admin@test.com`
   - 氏名: `管理者`
   - パスワード: `admin123`
   - 役割: `Executive`
4. 「サインアップ」をクリック

### cURL から:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","role":"executive","full_name":"管理者"}'
```

成功すれば以下のようなレスポンスが返ります：
```json
{
  "user": {
    "id": "...",
    "email": "admin@test.com",
    ...
  },
  "session": {
    "access_token": "...",
    ...
  }
}
```

---

## Supabase テーブルの確認

サインアップ成功後、Supabase で確認：

1. **Table Editor** を開く
2. **profiles** テーブルを確認
   - 新しいレコードが追加されているはず
   - `email`, `full_name`, `role` が正しいか確認

---

## 推奨設定（開発環境）

開発中は以下の設定を推奨：

- ✅ **Enable email confirmations**: OFF
- ✅ **Enable phone confirmations**: OFF
- ✅ **Minimum password length**: 6
- ✅ **Allow list of email domains**: 空欄（全許可）

本番環境では：
- ✅ **Enable email confirmations**: ON
- ✅ Custom SMTP を設定
- ✅ 強固なパスワードポリシー

---

## 次のステップ

1. ✅ Supabase で "Enable email confirmations" を OFF にする
2. ✅ ブラウザでアプリを開く（キャッシュクリア済み）
3. ✅ Executive と Member の両方のアカウントを作成
4. ✅ Member で Work を作成してチェックイン
5. ✅ Executive でダッシュボードを確認

---

## よくある質問

**Q: メール確認を OFF にしても安全？**
A: 開発・テスト環境では問題ありません。本番環境では ON にして、SMTP を設定してください。

**Q: 既に作成したユーザーはどうなる？**
A: Supabase の Authentication → Users から手動で確認済みにするか、削除して再作成してください。

**Q: RLS ポリシーは動作する？**
A: はい、メール確認の有無に関係なく RLS は正常に動作します。
