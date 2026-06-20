# Health Tracker

毎日の体重・水分・歩数・睡眠・気分を記録できる、依存ゼロの静的 Web アプリです。
データはブラウザの `localStorage` にのみ保存され、サーバーには送信されません。

## 構成

- `index.html` — 画面とフォーム
- `styles.css` — スタイル
- `app.js` — 記録・集計・描画ロジック（ビルド不要のバニラ JS）
- `.nojekyll` — GitHub Pages の Jekyll 処理を無効化

## ローカルで動かす

ビルド不要です。ブラウザで `index.html` を直接開くか、簡易サーバーで配信します。

```bash
cd health-tracker
python -m http.server 8080
# http://localhost:8080 を開く
```

## GitHub Pages への公開

`.github/workflows/health-tracker-pages.yml` が、`main` ブランチの
`health-tracker/**` 変更時に `health-tracker/` ディレクトリを GitHub Pages へ
デプロイします（手動実行も可）。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定してください。公開 URL は次の形式です:

```
https://<owner>.github.io/<repo>/
```
