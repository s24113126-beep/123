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

// 新增：針對常見前端資源提供明確回應，缺檔時回傳可見的提示（方便在瀏覽器直接診斷）
app.get('/app.js', (req, res) => {
  const p = path.join(publicDir, 'app.js');
  if (fs.existsSync(p)) return res.sendFile(p);
  return res.status(404).send(`/* Missing public/app.js
Please add public/app.js to your repository, commit and push, then redeploy.
You can check /debug-files to see which files are present. */`);
});

app.get('/styles.css', (req, res) => {
  const p = path.join(publicDir, 'styles.css');
  if (fs.existsSync(p)) return res.sendFile(p);
  return res.status(404).send(`/* Missing public/styles.css
Please add public/styles.css to your repository, commit and push, then redeploy.
You can check /debug-files to see which files are present. */`);
});

// 新增：簡單日誌與靜態檔存在檢查（部署後可在 Render 的 logs 看到）
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  // 只檢查 public 下的靜態檔案是否存在，避免干擾 API 路由
  if (req.method === 'GET' && req.url.startsWith('/')) {
    const checkPath = path.join(publicDir, req.path === '/' ? 'index.html' : req.path);
    try {
      const exists = fs.existsSync(checkPath);
      console.log(`[STATIC CHECK] ${checkPath} => ${exists}`);
    } catch (e) {
      console.warn('[STATIC CHECK] error checking', checkPath, e && e.message);
    }
  }
  next();
});

// 新增：debug 端點，回傳 public 目錄檔案清單（部署後瀏覽器或 curl 試用）
app.get('/debug-files', (req, res) => {
  try {
    if (!fs.existsSync(publicDir)) return res.status(200).json({ ok: true, files: [], message: 'public directory not found' });
    const files = fs.readdirSync(publicDir);
    return res.status(200).json({ ok: true, files });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

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
    console.log('Serving index.html');
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
