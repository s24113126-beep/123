# 123

簡單記帳專案（Budget App）。

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
