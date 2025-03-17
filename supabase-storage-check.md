# Supabaseストレージの設定確認手順

## 問題の概要

ファイルアップロード機能で以下のエラーが発生しています：
```StorageApiError: new row violates row-level security policy
```

これは、バケットへのアクセス権限がないか、バケット名が一致していないことが原因と考えられます。

## 確認手順

### 1. バケット名の確認

コード上では `contest-files` という名前のバケットを使用しています。Supabaseダッシュボードで同じ名前のバケットが存在するか確認してください。

- Supabaseダッシュボードにログイン
- 左側のメニューから「Storage」を選択
- バケット一覧に `contest-files` が表示されているか確認
- **注意**: 大文字小文字は区別されます。完全に一致している必要があります。

### 2. RLSポリシーの確認

バケットが存在する場合は、RLS（Row-Level Security）ポリシーを確認します：

1. バケット名をクリックして詳細画面を開く
2. 「Policies」タブを選択
3. 以下のポリシーが必要です：
   - **匿名ユーザー（anon）に対する読み取り権限**
   - **匿名ユーザー（anon）に対する書き込み権限**

### 3. ポリシーの追加方法

必要なポリシーがない場合は、以下の手順で追加します：

1. 「New Policy」ボタンをクリック
2. 「Get started quickly」セクションで「For full customization」を選択
3. 以下の設定を行います：

#### 読み取りポリシー
- Policy name: `allow_public_read`
- Allowed operations: `SELECT`
- Policy definition: `true`
- Definition type: `Custom`

#### 書き込みポリシー
- Policy name: `allow_public_insert`
- Allowed operations: `INSERT`
- Policy definition: `true`
- Definition type: `Custom`

### 4. バケットの作成方法

バケットが存在しない場合は、以下の手順で作成します：

1. 「New Bucket」ボタンをクリック
2. バケット名に `contest-files` を入力（大文字小文字に注意）
3. 「Public」オプションを有効にする
4. 「Create bucket」ボタンをクリック

## 環境変数の確認

`.env` ファイルに正しいSupabase URLとAPIキーが設定されているか確認してください：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## キャッシュのクリア

問題が解決しない場合は、ブラウザのキャッシュをクリアして再試行してください。

## 追加のデバッグ情報

アプリケーションを起動し、ブラウザの開発者ツールのコンソールを開いて、以下のログを確認してください：

- バケット一覧
- 権限チェック結果
- アップロード時のエラーメッセージ

これらの情報を元に、問題を特定して解決することができます。
