# 123

簡單記帳專案（Budget App）。

Render 部署設定（建議）
1. Build Command：
   npm install
   （或使用 npm ci 以確保與 lockfile 一致）

2. Start Command：
   npm start
   （請確認 package.json 有 "start": "node server.js"）

3. Environment Variables（於 Render 的 Service > Environment 設定）
   - MONGODB_URI  （你的 MongoDB 連線字串）
   - JWT_SECRET   （一組隨機長字串，用於 JWT 簽章）
   - PORT 可留空（Render 會自動注入），但 server.js 已讀取 process.env.PORT

注意事項
- .env 請勿推上 GitHub，請在 Render 上透過 Environment 設定真實值。
- 若部署失敗，查看 Render 的 build / runtime logs，常見問題為：缺少 start script、network/DB 連線錯誤或環境變數未設定。
- 若要本機測試：
  1. 在專案根目錄建立 .env（僅本機）：
     MONGODB_URI=你的連線字串
     JWT_SECRET=你的秘密
  2. npm install
  3. npm start

快速修正 "src refspec main does not match any" 錯誤
1. 確認目前目錄（專案根目錄）：  
   cd "c:\Users\user\OneDrive\桌面\test\budget-app"

2. 常用指令（按順序執行）：
   git status
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/s24113126-beep/123.git   # 若已設定可改用 git remote set-url origin <URL>
   git push -u origin main

   如果 git commit 因為「沒有變更」而失敗，請改用（建立空 commit）：
   git commit --allow-empty -m "initial commit"
   接著再執行 git branch -M main 與 git push -u origin main

3. 認證（如果 push 被拒）：
   - 使用 GitHub Personal Access Token (PAT) 取代密碼，或設定 SSH key，然後改用 SSH remote URL。
   - 範例使用 PAT（不建議直接把 token 放到命令列）：  
     git remote set-url origin https://<USERNAME>:<PERSONAL_ACCESS_TOKEN>@github.com/s24113126-beep/123.git

注意：
- 請確認 .gitignore 包含 .env 與 node_modules/，不要把敏感資料推上 GitHub。
- 若不慎已把 .env 推上，請先在 GitHub 刪除該 commit 並立即 rotate（更換）相關密鑰或密碼。

## 自動推送到 GitHub（範例腳本）
專案根目錄提供一個推送腳本 push_to_github.sh（在 Git Bash、WSL 或 macOS/Linux 執行）：

使用方法：
1. 開啟終端並切換到專案目錄：
   cd "c:\Users\user\OneDrive\桌面\test\budget-app"

2. 執行腳本：
   bash push_to_github.sh

腳本會：
- 確保 .gitignore 包含 .env 與 node_modules/
- 從 index 中移除已被誤加入的 .env / node_modules
- commit 並設定 remote 為 https://github.com/s24113126-beep/123.git
- 將 main 分支推送到 origin

認證提示：
- 若使用 HTTPS，請使用 GitHub Personal Access Token（PAT）作為密碼，或先設定 SSH key 並改用 SSH remote。
