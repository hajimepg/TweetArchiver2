ツイート保存アプリ プロトタイプ1
====

### 概要

引数で指定したURLのツイートをアイコンや添付画像と一緒にローカルにアーカイブします。(複数ツイート対応)

### 使い方

以下の環境変数を設定します。

- TWITTER_ACCESS_TOKEN_KEY
- TWITTER_ACCESS_TOKEN_SECRET
- TWITTER_CONSUMER_KEY
- TWITTER_CONSUMER_SECRET

コマンドライン引数

$ dist/index.js add tweet_url

指定したツイートをデータベースに追加します

$ dist/index.js remove tweet_url

指定したツイートをデータベースから削除します

$ dist/index.js output

データベースに保存されているすべてのツイートをHTMLに出力します
