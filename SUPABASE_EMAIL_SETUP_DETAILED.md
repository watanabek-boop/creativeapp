# Supabase Email 設定の修正手順（スクリーンショット付き）

## 現在の画面について

スクリーンショットに表示されているのは：
- **Authentication → Email → SMTP Settings**

これはカスタムSMTPサーバーの設定ですが、今回必要なのは別の設定です。

---

## 正しい設定手順

### ステップ 1: Providers 設定に移動

1. 左サイドバーの **「Authentication」** をクリック（現在いる場所）
2. その下の **「Providers」** をクリック（左サイドバーに表示されているはず）

または：

1. 左サイドバーの **「Configuration」** セクションを見つける
2. **「Sign In / Providers」** をクリック

### ステップ 2: Email Provider を設定

「Providers」画面で：

1. **「Email」** プロバイダーを見つける
2. Email プロバイダーの行をクリックして設定を開く
3. 以下の設定を確認・変更：

```
✅ Enable Email provider: ON（有効にする）
✅ Enable email confirmations: OFF（無効にする）← これが重要！
✅ Enable email OTP: OFF（無効にする）
✅ Secure email change: ON でも OFF でも OK
```

4. 下にスクロールして **「Save」** ボタンをクリック

---

## もう一つの確認箇所：Settings

または、以下の場所で確認できます：

1. 左サイドバーの **「Authentication」** 
2. その下の **「Settings」** をクリック
3. **「Auth Providers」** セクションを探す
4. **Email** の設定を確認

---

## 設定のチェックリスト

以下の設定が推奨です（開発環境）：

### Email Provider:
- ✅ **Enable Email provider**: ON
- ❌ **Enable email confirmations**: OFF ← 必須！
- ❌ **Enable email OTP**: OFF
- ✅ **Double confirm email changes**: ON または OFF

### Password Requirements:
- **Minimum password length**: 6

### Advanced Settings:
- **Email rate limit**: 制限なし（開発環境）

---

## 設定完了後のテスト

1. ブラウザで新しいタブを開く（シークレットモード推奨）
2. アプリにアクセス：
   ```
   https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai
   ```
3. 「サインアップ」をクリック
4. 以下の情報で登録：
   - メール: `admin@test.com`
   - 氏名: `管理者`
   - パスワード: `admin123`
   - 役割: `Executive`

成功すれば、すぐにログインしてダッシュボードが表示されます！

---

## よくある間違い

❌ **SMTP Settings** を変更する → これは別の機能です
✅ **Providers の Email 設定** を変更する → これが正解です

---

## まだ見つからない場合

画面上部の検索バー（Search... ⌘K）で以下を検索：
```
email confirmations
```

または、URLを直接開く：
```
https://supabase.com/dashboard/project/niensxdvrokegaolqtlf/auth/providers
```

---

## 次に共有していただきたいスクリーンショット

**Providers** 画面または **Email Provider** の設定画面のスクリーンショットを共有してください。

具体的には、以下が表示されている画面：
- "Enable email confirmations" のトグルスイッチ
- Email Provider の詳細設定
