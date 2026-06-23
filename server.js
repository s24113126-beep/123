// Render 部署建議：Build Command = npm install（或 npm ci）；Start Command = npm start
// Git push 提示：若出現 "src refspec main does not match any" 請在專案根目錄執行：
// git add .
// git commit -m "initial commit"                # 若沒有檔案可改用 --allow-empty
// git branch -M main
// git remote add origin https://github.com/s24113126-beep/123.git
// git push -u origin main

// git remote: https://github.com/s24113126-beep/123.git
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// 嘗試選擇性載入 dotenv（生產環境如 Render 會由平台注入 env，若未安裝 dotenv 不會讓程式崩潰）
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed — that's fine on hosting platforms that provide env vars
}

const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');

// normalizeRouter: 從各種可能的 module 形態（直接 export / default / router 屬性）取得可用的 Express router
function normalizeRouter(mod, name) {
  if (!mod) throw new Error(`${name} module is empty`);
  // 如果本身就是 router 或 middleware function / router-like object
  if (typeof mod === 'function' || (typeof mod === 'object' && typeof mod.use === 'function')) return mod;
  // commonjs -> es module default
  if (mod.default) {
    const d = mod.default;
    if (typeof d === 'function' || (typeof d === 'object' && typeof d.use === 'function')) return d;
  }
  // 常見自訂屬性
  if (typeof mod === 'object') {
    for (const key of ['router', 'routes', 'defaultRouter']) {
      if (mod[key] && typeof mod[key].use === 'function') return mod[key];
    }
  }
  throw new Error(`${name} does not export an Express router. Check routes/${name}.js exports.`);
}

let authRouter, recordsRouter;
try {
  authRouter = normalizeRouter(authRoutes, 'auth');
  recordsRouter = normalizeRouter(recordRoutes, 'records');
} catch (err) {
  console.error('Router initialization error:', err.message);
  // 明確失敗早點結束，方便在 Render logs 找到問題
  process.exit(1);
}

const app = express();

// 使用環境變數為優先，避免將敏感字串硬編到程式
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/budget-app';
const rawUri = process.env.MONGODB_URI;
const MONGODB_URI = rawUri || DEFAULT_URI;
const PORT = process.env.PORT || 3000;

// 小函式：遮蔽 URI 中的使用者/密碼段，避免在日誌輸出明文
function maskUri(uri) {
  try {
    if (!uri) return '';
    // 將 user:pass@ 部分替換成 ***:***@
    return uri.replace(/\/\/([^:@\/]+):([^@\/]+)@/, '//***:***@');
  } catch (e) {
    return '***';
  }
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected (' + (rawUri ? 'env MONGODB_URI: ' + maskUri(MONGODB_URI) : 'default local') + ')'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // 若無法連線，保留 exit 行為以便在部署平台或 dev 時能察覺錯誤
    process.exit(1);
  });

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/records', recordsRouter);

// serve static SPA
const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.warn('public/index.html not found. Serving placeholder response. 確認 public 資料夾已加入 repo 並包含 index.html');
  app.get('*', (req, res) => {
    res.status(200).send(`<!doctype html>
      <html><head><meta charset="utf-8"><title>App not deployed</title></head>
      <body style="font-family:Arial,sans-serif;padding:24px;">
        <h1>應用未部署（前端檔案遺失）</h1>
        <p>public/index.html 不存在。請確認已將前端檔案加入 repository 並推上 GitHub，然後重新部署。</p>
        <p>建議步驟：</p>
        <ol>
          <li>在專案根目錄放置 <code>public/index.html</code>（或完整 public 資料夾）</li>
          <li>git add public && git commit -m "add frontend" && git push</li>
          <li>在 Render 重新部署</li>
        </ol>
        <p>參考 repo README 或檢查 Render logs 以取得更多資訊。</p>
      </body></html>`);
  });
} else {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 優雅關閉：在收到 SIGINT（Ctrl+C）時斷開 mongoose 並結束
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  try {
    await mongoose.disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (e) {
    console.error('Error during shutdown', e);
    process.exit(1);
  }
});
