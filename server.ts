import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './backend/src/routes/auth';
import { uploadRouter } from './backend/src/routes/upload';
import { backupRouter } from './backend/src/routes/backup';
import { runRealHealthCheck } from './backend/src/firebase';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware & Security
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // REST API: GET /api/health
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const result = await runRealHealthCheck();
      const isHealthy = result.firestore === 'connected';

      if (!result.serviceAccount && !isHealthy) {
        return res.status(503).json({
          ...result,
          message: 'الخادم يعمل، ولكن بانتظار تزويد ملف مفتاح الخدمة الخاص serviceAccountKey.json لتفعيل الاتصال الكامل بـ Firebase.',
          error: result.details || 'بيانات اعتماد الخدمة (Service Account) غير متوفرة أو تفتقر إلى الأذونات.',
          actionRequired: [
            '1. افتح Firebase Console: https://console.firebase.google.com/',
            '2. انتقل إلى Project Settings -> Service accounts.',
            '3. اضغط على Generate new private key.',
            '4. ضع الملف المنزّل داخل backend/credentials/serviceAccountKey.json',
            '5. تأكد من تفعيل Cloud Firestore في لوحة تحكم مشروعك.'
          ]
        });
      }

      return res.status(isHealthy ? 200 : 503).json(result);
    } catch (error: any) {
      return res.status(500).json({
        backend: 'online',
        firestore: 'error',
        serviceAccount: false,
        error: error.message || 'حدث خطأ غير متوقع أثناء فحص الاتصال بـ Firebase'
      });
    }
  });

  // REST API Routes
  app.use('/api', authRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/backup', backupRouter);

  // Vite middleware for frontend development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم: ' + (err.message || 'Unknown error')
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Personal Cloud Backup Full-Stack Server is running!`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log(`🔗 REST API: /api/login, /api/register, /api/upload/backup, /api/health`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
