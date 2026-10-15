# 3億分の1 / 1 in 300M

一番乗りだけが、いのちになる。

精子になって卵子を目指す、最大8人の3Dオンライン対戦レース。ブラウザだけで遊べます。

**Play: https://seisi.satoru.net/**

A 3D online race (up to 8 players) where you swim as a sperm cell toward the egg. Only the first one becomes a life.

## コース / Course

膣（酸性）→ 子宮頸管（粘液・頸管腺・抗精子抗体）→ 子宮（白血球・マクロファージ・蠕動波）→ 卵管口（開閉ゲート）→ 卵管峡部（受精能獲得）→ 卵管膨大部（線毛の逆流・化学走性）→ 卵子（先体反応・融合）

コースは毎回ランダムで、難易度は ゆるふわ / ふつう / 荒れ狂う / 地獄 の4段階。レース後は受精卵が胎児になるまでの演出を見ながらチャットできます。レース中に入ってきた人は、走っているCPUに憑依して途中から参戦します。

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

静的ファイル（`index.html` など）を Web サーバで配信し、`/ws` を `127.0.0.1:3520` に、`/api/winners` と `/api/country` をそれぞれ `:3520/winners` と `:3520/country` にプロキシしてください。サーバにつながらなくても「練習」はブラウザだけで動きます。

1位のメッセージは `server/data/winners.json` に保存されます（リポジトリには含めていません）。

## クレジット / Credits

- Sound: [OtoLogic](https://otologic.jp/) (CC BY 4.0) — `se/iyan1.mp3`, `se/iyan2.mp3`
- [Three.js](https://threejs.org/) (MIT)
- Font: M PLUS Rounded 1c (Google Fonts, OFL)

© 2026 satoru.net
