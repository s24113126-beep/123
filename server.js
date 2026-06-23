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

require('dotenv').config();

const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');

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
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);

// serve static SPA
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
