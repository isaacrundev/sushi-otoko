# 專案規則

## 改完一定要推上 GitHub

這個 repo 是**已上線**的 PWA。GitHub Pages 由 GitHub Actions 部署（`.github/workflows/deploy.yml`）：
https://isaacrundev.github.io/sushi-otoko/

**只 commit 不算改完。** 沒推上去，使用者拿到的還是舊版，這次改動等於不存在。

`main` 不接受直接 push（guard-git hook 會擋）。流程固定是：

1. `bun test` 要全過（PR 上也會再跑一次，紅燈不會部署）
2. 開分支：`git switch -c feat/xxx`
3. Commit，Conventional Commits 訊息，例：`feat(extras): 其他項目改為 tap 加減數量`
4. `git push -u origin feat/xxx`
5. 開 PR 並 squash merge：
   `gh pr create --fill` → `gh pr merge --squash --delete-branch`
6. 合併後確認部署跑完而且是綠的，不是推上去就當作生效：
   `gh run list --workflow=deploy.yml --limit 1`
7. 有動到前端檔案（`index.html`／`app.js`／`calc.js`／`presets.js`）時，`sw.js` 的 `CACHE` 要往上加一版，否則已安裝的使用者會被快取餵舊檔。

只上線網站檔案：`.github`、`PRD.md`、`AGENTS.md`、`tools/`、`*.test.js` 不會被部署（見 workflow 的 rsync 條件）。

## 其他

- PRD.md 是「為什麼」的正式記錄。決策改變就改對應段落，並在 §13 決策紀錄留一行（見 PRD §更新規則）。
- 動到 `calc.js`／`presets.js` 的邏輯要補 `bun test`。
