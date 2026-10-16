# 3億分の1 / 1 in 300M

一番乗りだけが、いのちになる。

精子になって卵子を目指す、何人でも参加できる3Dオンライン対戦レース。ブラウザだけで遊べます。

**Play: https://seisi.satoru.net/**

A 3D online race (any number of players) where you swim as a sperm cell toward the egg. Only the first one becomes a life.

## コース / Course

膣（酸性）→ 子宮頸管（粘液・頸管腺・抗精子抗体）→ 子宮（白血球・マクロファージ・蠕動波）→ 卵管口（開閉ゲート）→ 卵管峡部（受精能獲得）→ 卵管膨大部（線毛の逆流・化学走性）→ 卵子（先体反応・融合）

コースは毎回ランダム（練習では選べます）。難易度は ゆるふわ / ふつう / 荒れ狂う / 地獄 の4段階。

- **X精子 / Y精子**：スタートでランダム。Y は速いが打たれ弱く、X は遅めだが打たれ強い。勝った精子で胎児の性別が決まる
- **双子チャンス**：たまに卵子が2個あり、2匹まで受精できる
- **アイコン**：写真を丸く切り抜いて精子の頭に巻きつけられる（貼る広さは調整可。ブラウザで 96×96 に縮めて送る）。受精すると胎児の顔にうっすら出て、メッセージにも付く
- **ランキング・実績**：コース別の自己ベストランキングと、端末に保存される実績
レース後は受精卵が胎児になるまでの演出を見ながらチャットできます。レース中に入ってきた人は、走っているCPUに憑依して途中から参戦します。

## 構成 / Structure

| ファイル | 内容 |
|---|---|
| `index.html` | 画面・HUD・CSS |
| `game.js` | 3Dクライアント（Three.js 0.160） |
| `core.js` | コース生成・ルーム管理・CPU（ブラウザとNodeで共用） |
| `server/server.js` | WebSocket 対戦サーバ（`ws`） |
| `se/` | 効果音 |
| `old2d.html` | 最初の2D版 |

## 動かし方 / Run

```sh
cd server
npm install
node server.js        # 127.0.0.1:3520 (PORT で変更可)
```

静的ファイル（`index.html` など）を Web サーバで配信し、`/ws` を `127.0.0.1:3520` に、`/api/winners`・`/api/records`・`/api/country`・`/api/icon/` をそれぞれ `:3520/winners`・`:3520/records`（クエリ付き）・`:3520/country`・`:3520/icon/` にプロキシしてください。サーバにつながらなくても「練習」はブラウザだけで動きます。

1位のメッセージは `server/data/winners.json` に保存されます（リポジトリには含めていません）。
ランキング（1人1件の自己ベスト）は `server/data/records.json` に保存されます。タイムはサーバの時計で計測し、クライアントが送る位置は理論上の最速を超えないようサーバ側でおさえています（練習・途中参戦は記録対象外）。

## クレジット / Credits

- Sound: [OtoLogic](https://otologic.jp/) (CC BY 4.0) — `se/iyan1.mp3`, `se/iyan2.mp3`
- [Three.js](https://threejs.org/) (MIT)
- Font: M PLUS Rounded 1c (Google Fonts, OFL)

## ライセンス / License

[MIT](LICENSE) © 2026 satoru.net

ただし `se/` の効果音は OtoLogic の素材で、MIT ではなく CC BY 4.0 です（利用時はクレジット表記が必要）。
The sound files in `se/` are by OtoLogic under CC BY 4.0, not MIT.
