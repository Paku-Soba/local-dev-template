# local-dev-template
Local Development

# explain
現時点、TLS証明書問題で外部パッケージ取得ができない状態の為、Node標準機能だけで動くローカル完結のHTTPサーバー構築検証。
プロジェクト構成の全体像及びコード内容は、ChatGPTプロンプト実行による回答結果を参照。

# Goal
・静的HTML/CSS/JSの表示
・APIのモック提供
・JSONの読み書き
・フォーム送信
・ローカつでの画面遷移確認
・開発用の簡易ルーティング
・CORSやContent-Typeの制御
フレームワークなしで「画面」と「API」を同一Nodeプロセス上で持つ