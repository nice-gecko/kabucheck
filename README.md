# KabuCheck 📈

X(旧Twitter)の株予想インフルエンサーを**的中率**でランキングするWebアプリです。

- **Nitter RSS** で直近60日の#株予想ポストを自動収集
- **Claude AI** が銘柄・方向・目標価格を自動抽出
- **Yahoo Finance** で実際の株価と照合し的中率を算出
- **管理画面**から候補ユーザーを追加・削除、ボタン1つでランキング更新

---

## 🚀 Vercelにデプロイする手順

### 1. リポジトリをGitHubにpush

```bash
git init
git add .
git commit -m "initial commit"
gh repo create kabucheck --public --push
```

### 2. Vercelにインポート

1. [vercel.com](https://vercel.com) にログイン（GitHubアカウントで無料登録）
2. "Add New Project" → GitHubリポジトリを選択
3. Framework Preset: **Next.js**（自動検出）

### 3. 環境変数を設定

Vercelのプロジェクト設定 → Environment Variables:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxxx`（[console.anthropic.com](https://console.anthropic.com) で取得） |

### 4. Deploy!

"Deploy" ボタンを押すだけ。約2分でデプロイ完了。

---

## 💻 ローカル開発

```bash
npm install
cp .env.local.example .env.local
# .env.local に ANTHROPIC_API_KEY を記入

npm run dev
# http://localhost:3000 で起動
```

---

## 📖 使い方

### メインページ (`/`)
- ランキング上位20名の最新ピックを表示
- 各銘柄の **現在値・目標価格・押し目買い・撤退価格** を自動表示
- 「✨ AI分析」で Claude AI による詳細分析を表示
- 「🔄 ランキング更新」でリアルタイム更新

### 管理画面 (`/admin`)
- 候補ユーザーの追加・削除
- 「🔄 今すぐランキングを更新」でNitter RSS取得 → ランキング再計算
- 更新ログで進捗確認

---

## 🏗️ 技術構成

| 要素 | 技術 | コスト |
|------|------|--------|
| フロントエンド | Next.js 14 (App Router) | 無料 |
| ホスティング | Vercel | 無料 |
| ポスト取得 | Nitter RSS | 無料 |
| AI分析 | Anthropic Claude API | 従量課金（月数百円〜） |
| 株価データ | Yahoo Finance 非公式API | 無料 |
| データストア | In-memory（Vercel KV移行可） | 無料 |

---

## ⚠️ 注意事項

- Nitter RSSはX社の非公式サービスです。X社の方針変更で突然使用不可になる場合があります
- 株価予想の自動抽出精度は100%ではありません
- 投資判断にはご利用いただけません
- Vercelのサーバーレス環境ではデータはメモリ上に保存されます。Vercel KVを使うとデータが永続化されます

---

## 🔄 データ永続化（オプション）

現在はIn-memoryストアのため、サーバー再起動でデータがリセットされます。
`lib/store.ts` を以下に差し替えることで永続化できます：

- **Vercel KV**（Redis）: 無料枠あり、最も簡単
- **PlanetScale**（MySQL）: 無料枠あり
- **Supabase**（PostgreSQL）: 無料枠あり
