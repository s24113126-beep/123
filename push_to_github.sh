#!/bin/bash
# 在專案根目錄執行： bash push_to_github.sh
# 注意：請勿把真實 .env 推上 GitHub。若已推上，請先在 GitHub 移除該 commit 並 rotate secrets。

# 1. 進入專案根目錄（請先切換到該目錄）
# cd "c:\Users\user\OneDrive\桌面\test\budget-app"

# 2. 初始化 git（若已是 git repo 可跳過）
git status >/dev/null 2>&1 || git init

# 3. 設定 user（如尚未設定）
# git config user.name "Your Name"
# git config user.email "you@example.com"

# 4. 確保 .gitignore 存在且包含 .env 與 node_modules
echo -e ".env\nnode_modules/\n" >> .gitignore
git add .gitignore
git commit -m "ensure .gitignore" --allow-empty || true

# 5. 若不小心已把 .env 或 node_modules 加入暫存，從 index 中移除但保留本機檔案
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env
fi
if [ -d "node_modules" ]; then
  # 只在 node_modules 被追蹤時才移除
  if git ls-files --error-unmatch node_modules >/dev/null 2>&1; then
    git rm -r --cached node_modules
  fi
fi

# 6. 新增並 commit 所有檔案
git add .
git commit -m "Initial commit" || echo "Nothing to commit"

# 7. 設定 remote（若 remote 已存在，改用 set-url）
REMOTE="https://github.com/s24113126-beep/123.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

# 8. 推送到 main（若要使用 master，請改為 master）
git branch -M main
echo "推送到遠端，系統會要求輸入 GitHub 認證（建議使用 PAT 或 SSH）"
git push -u origin main

# 若出現認證問題：請使用 GitHub PAT 或設定 SSH key
# 範例（使用 PAT，安全性較低，僅示範）：
# git remote set-url origin https://<USERNAME>:<PERSONAL_ACCESS_TOKEN>@github.com/s24113126-beep/123.git
