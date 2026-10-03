import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth';
import { adminFirestore } from '../firebase';

export const backupRouter = Router();

backupRouter.use(authenticateJwt);

/**
 * جلب تفاصيل أحدث نسخة احتياطية
 * GET /api/backup/latest
 */
backupRouter.get('/latest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, error: 'غير مصرح' });

    const syncStateDoc = await adminFirestore
      .collection('users')
      .doc(username)
      .collection('metadata')
      .doc('sync_state')
      .get();

    if (!syncStateDoc.exists) {
      return res.json({
        success: true,
        lastSyncTimestamp: null,
        message: 'لا توجد نسخ احتياطية مسجلة حتى الآن'
      });
    }

    const data = syncStateDoc.data();
    return res.json({
      success: true,
      lastSyncTimestamp: data?.lastSyncTimestamp || null,
      deviceModel: data?.deviceModel,
      updatedAt: data?.updatedAt
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تصدير وتنزيل النسخة الاحتياطية الكاملة مباشرة من Cloud Firestore
 * GET /api/backup/export
 * يسترجع كافة سجلات المكالمات والمحادثات والرسائل مجمعة من Firestore دون الحاجة لأي Firebase Storage
 */
backupRouter.get('/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, error: 'غير مصرح' });

    const userDocRef = adminFirestore.collection('users').doc(username);

    // 1. جلب البيانات الوصفية وحالة المزامنة
    const syncStateDoc = await userDocRef.collection('metadata').doc('sync_state').get();
    const syncState = syncStateDoc.exists ? syncStateDoc.data() : null;

    // 2. جلب سجلات المكالمات
    const callLogsSnap = await userDocRef.collection('call_logs').orderBy('timestamp', 'desc').get();
    const callLogs = callLogsSnap.docs.map(doc => doc.data());

    // 3. جلب خيوط المحادثات والرسائل التابعة لها
    const convsSnap = await userDocRef.collection('sms_conversations').orderBy('lastMessageTimestamp', 'desc').get();
    const conversations = [];

    for (const convDoc of convsSnap.docs) {
      const convData = convDoc.data();
      const messagesSnap = await convDoc.ref.collection('messages').orderBy('timestamp', 'asc').get();
      const messages = messagesSnap.docs.map(mDoc => mDoc.data());

      conversations.push({
        ...convData,
        messages
      });
    }

    // 4. تجميع كائن النسخة الاحتياطية الكامل بنفس هيكل التطبيق الأصلي
    const fullBackup = {
      backupMetadata: {
        username,
        deviceId: syncState?.deviceId || 'android_device',
        deviceModel: syncState?.deviceModel || 'Android Device',
        androidVersion: syncState?.androidVersion || '',
        syncTimestamp: syncState?.lastSyncTimestamp || Date.now(),
        totalCallsCount: callLogs.length,
        totalSmsCount: conversations.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0),
        storageEngine: 'Cloud Firestore (Spark Free Tier)',
        exportedAt: Date.now()
      },
      callLogs,
      conversations
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${username}_${Date.now()}.json"`);
    return res.json(fullBackup);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * جلب سجل جلسات النسخ الاحتياطي السابقة
 * GET /api/backup/history
 */
backupRouter.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, error: 'غير مصرح' });

    const sessionsSnap = await adminFirestore
      .collection('users')
      .doc(username)
      .collection('backup_sessions')
      .orderBy('syncTimestamp', 'desc')
      .limit(50)
      .get();

    const sessions = sessionsSnap.docs.map((doc: any) => doc.data());

    return res.json({
      success: true,
      sessionsCount: sessions.length,
      sessions
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
