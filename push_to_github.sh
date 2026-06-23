#!/bin/bash
# 自動化：初始化/清理/commit 並推送到遠端 repository
# 使用方式（在專案根目錄執行）：
#   bash push_to_github.sh
# 建議在 Git Bash 或 WSL / macOS / Linux 執行。

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_URL="https://github.com/s24113126-beep/123.git"

cd "$REPO_DIR"

echo "Working directory: $REPO_DIR"

# 初始化 git repo（若尚未）
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
fi

# 確保 .gitignore 包含 .env 與 node_modules/
if ! grep -q "^\\.env$" .gitignore 2>/dev/null; then
  echo ".env" >> .gitignore
fi
if ! grep -q "^node_modules/" .gitignore 2>/dev/null; then
  echo "node_modules/" >> .gitignore
fi
git add .gitignore || true
git commit -m "chore: ensure .gitignore" --allow-empty || true

# 若不小心已將敏感檔案加入索引，從 index 中移除（保留本機檔案）
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "Removing .env from git index..."
  git rm --cached .env || true
fi
if git ls-files --error-unmatch node_modules >/dev/null 2>&1; then
  echo "Removing node_modules from git index..."
  git rm -r --cached node_modules || true
fi

# 新增全部檔案並 commit（若沒有變更，建立一個 empty commit 作為 initial）
git add .
if git diff --staged --quiet; then
  echo "No staged changes. Creating an empty initial commit..."
  git commit --allow-empty -m "chore: initial commit"
else
  git commit -m "chore: prepare repo for push" || echo "Commit failed or nothing to commit"
fi

# 設定 remote
if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin exists, setting URL to $REMOTE_URL"
  git remote set-url origin "$REMOTE_URL"
else
  echo "Adding remote origin $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

# 切換到 main 並推送
git branch -M main
echo "Pushing to origin main (you may be prompted for credentials - use PAT if using HTTPS)"
git push -u origin main

echo "Done. Check your GitHub repo: $REMOTE_URL"
