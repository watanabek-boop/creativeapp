# Creative App - 介入判断ダッシュボード

## プロジェクト概要

経営者が「今日、誰に・どの仕事に・何分だけ介入すべきか」を1画面で判断できる Web アプリケーション。

既存の SaaS（Salesforce/ジョブカン/SmartHR/カオナビ）を置き換えず、管理や進捗率/KPI を扱わない。このアプリは**「介入判断」だけ**に特化している。

## 🌐 URL

- **開発サーバー**: https://3000-iq5cwww3s65s5jb9lsl9i-cbeee0f9.sandbox.novita.ai
- **GitHub**: https://github.com/[username]/creative-app (作成予定)

## 🎯 MVP機能（実装済み）

### 1. ユーザー認証
- **役割**: Executive（経営者）/ Member（社員）
- メール + パスワード認証（Supabase Auth）
- ログイン後、役割に応じて画面を自動出し分け

### 2. Work 作成（Member 画面）
仕事を作る時の入力は3つだけ：
- **goal_state**: ゴール（「状態」で書く）
- **unknowns**: 未確定なこと（複数行テキスト）
- **waiting_on**: 判断待ちの相手（名前/役割）

### 3. 日次チェックイン（Member 画面）
1日1回、各 Work に対してチェックイン可能。5つの選択肢から1つ選択：
- ✓ **未確定が減った** (unknowns_decreased)
- → **判断が進んだ** (decision_progressed)
- − **変化なし** (no_change)
- ↑ **未確定が増えた** (unknowns_increased)
- ✗ **判断が止まった** (decision_stalled)

### 4. 介入判断ダッシュボード（Executive 画面）
経営者画面は**1ページのみ**。各 Work を以下で表示：
- **レベル**: 🟢放置OK / 🟡そろそろ確認 / 🔴今すぐ介入
- **理由**（2〜3行の箇条書き）
- **推奨アクション**（例：10分ヒアリング）

点数やランキングは不要。目標は「赤信号だけが見える」こと。

## 📊 データベース構造

### Supabase テーブル

#### `profiles`
- `id`: UUID (auth.users と紐付け)
- `role`: 'executive' | 'member'
- `email`: メールアドレス
- `full_name`: フルネーム
- `created_at`: 作成日時

#### `works`
- `id`: UUID
- `user_id`: UUID (profiles と紐付け)
- `goal_state`: ゴール状態（TEXT）
- `unknowns`: 未確定事項（TEXT）
- `waiting_on`: 判断待ちの相手（TEXT）
- `status`: 'open' | 'closed'
- `created_at`, `updated_at`: 日時

#### `checkins`
- `id`: UUID
- `work_id`: UUID (works と紐付け)
- `user_id`: UUID (profiles と紐付け)
- `unknowns_decreased`: BOOLEAN
- `unknowns_increased`: BOOLEAN
- `decision_progressed`: BOOLEAN
- `decision_stalled`: BOOLEAN
- `no_change`: BOOLEAN
- `created_at`: 日時

### Row Level Security (RLS)
- Member: 自分の works/checkins のみ参照・更新可能
- Executive: 全員の works/checkins を参照可能（更新は不可）

## 🚦 介入レベル判定ロジック

チェックイン履歴と経過日数でルールベース判定：

### 🔴 今すぐ介入
- `decision_stalled` が直近で発生し、かつ2日以上継続
- `no_change` が3回以上連続
- `unknowns_increased` が発生し、その後改善がない

### 🟡 そろそろ確認
- `no_change` が2回連続
- `unknowns_increased` が発生
- 最終チェックインから2日以上経過

### 🟢 放置OK
- 直近で `unknowns_decreased` または `decision_progressed` がある
- 特に問題が見られない

## 🛠️ 技術スタック

- **フレームワーク**: Hono (Cloudflare Workers 最適化)
- **デプロイ**: Cloudflare Pages
- **認証・DB**: Supabase (Auth + PostgreSQL + RLS)
- **フロントエンド**: Vanilla JS + Axios + TailwindCSS
- **開発環境**: PM2 + Wrangler

## 📂 プロジェクト構造

```
webapp/
├── src/
│   └── index.tsx           # Hono バックエンド API
├── public/
│   └── static/
│       └── app.js          # フロントエンド JavaScript
├── supabase_schema.sql     # Supabase スキーマ定義
├── ecosystem.config.cjs    # PM2 設定
├── wrangler.jsonc          # Cloudflare 設定
├── .dev.vars               # 環境変数（ローカル開発用）
└── package.json
```

## 🚀 セットアップ手順

### 1. Supabase データベースのセットアップ

1. Supabase ダッシュボードで SQL Editor を開く
2. `supabase_schema.sql` の内容を実行
3. テーブル、RLS ポリシー、トリガーが自動的に作成される

### 2. ローカル開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# PM2 でサーバー起動
pm2 start ecosystem.config.cjs

# サーバーテスト
curl http://localhost:3000
```

### 3. 環境変数

`.dev.vars` ファイル（ローカル開発用）:
```
SUPABASE_URL=https://niensxdvrokegaolqtlf.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 4. テストユーザーの作成

アプリにアクセスして「サインアップ」から：
- **Executive（経営者）**: role を "Executive" で登録
- **Member（社員）**: role を "Member" で登録（デフォルト）

## 📖 使い方

### Member（社員）の操作

1. **ログイン**後、Work 一覧が表示される
2. **「新規 Work 作成」**をクリック
   - ゴール状態を入力（例: 新規顧客3社と契約が完了している）
   - 未確定事項を入力（例: 価格設定が未確定）
   - 判断待ちの相手を入力（例: 営業部長）
3. **日次チェックイン**
   - Work をクリックして詳細画面へ
   - 今日の状況を5つの選択肢から選択
   - 1日1回のチェックインを推奨

### Executive（経営者）の操作

1. **ログイン**後、介入判断ダッシュボードが表示される
2. **Work は介入レベル順**（🔴→🟡→🟢）に並んでいる
3. **各 Work カード**には以下が表示：
   - 介入レベル（信号）
   - 判定理由（箇条書き）
   - 推奨アクション（具体的な介入方法）
   - Work 詳細（クリックで展開）
4. **赤信号の Work に優先的に介入**

## 🎨 UI 特徴

- **シンプルで高速**: TailwindCSS + Vanilla JS
- **スマホ対応**: レスポンシブデザイン
- **直感的な色分け**:
  - 🔴 赤 = 緊急（今すぐ介入）
  - 🟡 黄 = 注意（そろそろ確認）
  - 🟢 緑 = 安全（放置OK）

## 🔐 セキュリティ

- Supabase RLS により、Member は自分のデータのみアクセス可能
- Executive は全データを参照可能だが、編集は不可
- フロントエンドに service role key を置かない
- JWT トークンによる認証

## 📝 完了した機能

✅ ユーザー認証（signup/signin/signout）
✅ プロフィール管理（role による出し分け）
✅ Work 作成（Member）
✅ Work 一覧表示（Member: 自分のみ / Executive: 全員）
✅ 日次チェックイン（5種類の状態選択）
✅ チェックイン履歴表示
✅ 介入レベル判定ロジック（ルールベース）
✅ Executive ダッシュボード（レベル別ソート、理由、推奨アクション）
✅ 今日チェックイン未完了の Work をハイライト
✅ レスポンシブ UI（スマホ対応）

## 🚧 未実装の機能（将来的な拡張）

- Work のクローズ機能
- チェックイン通知機能（Slack/メール）
- AI による推奨アクション生成
- 介入履歴の記録
- Work の優先度設定
- チームやプロジェクトでのグループ化
- グラフ・チャートでの可視化

## 🎯 次の推奨ステップ

1. **実際のデータでテスト**
   - Executive と Member の両方のアカウントを作成
   - 複数の Work を作成してチェックインを試す
   - 介入レベル判定が正しく動作するか確認

2. **Cloudflare Pages へのデプロイ**
   - Production 環境へのデプロイ
   - Cloudflare Secrets の設定（SUPABASE_URL, SUPABASE_ANON_KEY）

3. **フィードバック収集**
   - 実際のユーザー（経営者・社員）に使ってもらう
   - 介入レベル判定ロジックの調整

4. **機能追加**
   - 通知機能
   - AI 統合
   - モバイルアプリ化

## 📄 ライセンス

MIT

## 🙋 サポート

質問や問題があれば、GitHub Issues で報告してください。

---

**最終更新**: 2024-12-24
**デプロイ状況**: ✅ ローカル開発環境で動作中
