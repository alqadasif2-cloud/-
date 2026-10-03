import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth';
import { adminFirestore } from '../firebase';

export const uploadRouter = Router();

// تطبيق الحماية بـ JWT على جميع مسارات الرفع
uploadRouter.use(authenticateJwt);

/**
 * رفع حزمة النسخ الاحتياطي الكاملة (المكالمات، الرسائل، البيانات الوصفية)
 * POST /api/upload/backup
 */
uploadRouter.post('/backup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const payload = req.body;
    if (!payload || !payload.backupMetadata) {
      return res.status(400).json({ success: false, error: 'هيكل بيانات النسخ غير مكتمل' });
    }

    const userDocRef = adminFirestore.collection('users').doc(username);
    let uploadedCount = 0;

    // 1. معالجة وحفظ سجل المكالمات في Cloud Firestore مع منع التكرار بواسطة بصمة الهاش SHA-256
    const callLogs: any[] = payload.callLogs || [];
    if (callLogs.length > 0) {
      const callLogsCol = userDocRef.collection('call_logs');
      const callChunks = chunkArray<any>(callLogs, 400);

      for (const chunk of callChunks) {
        const batch = adminFirestore.batch();
        for (const call of chunk) {
          const docId = (call as any).hash || `call_${(call as any).timestamp}_${(call as any).phoneNumber}`;
          const docRef = callLogsCol.doc(docId);
          batch.set(docRef, {
            ...call,
            uploadedAt: Date.now()
          }, { merge: true });
        }
        await batch.commit();
      }
      uploadedCount += callLogs.length;
    }

    // 2. معالجة وحفظ رسائل SMS مقسمة إلى محادثات ورسائل فردية مع منع التكرار
    const conversations: any[] = payload.conversations || [];
    if (conversations.length > 0) {
      const convsCol = userDocRef.collection('sms_conversations');

      for (const conv of conversations) {
        const convDocRef = convsCol.doc(String(conv.threadId));
        await convDocRef.set({
          threadId: conv.threadId,
          participantAddress: conv.participantAddress,
          participantName: conv.participantName,
          messageCount: conv.messageCount,
          lastMessageTimestamp: conv.lastMessageTimestamp,
          lastUpdated: Date.now()
        }, { merge: true });

        const messages: any[] = conv.messages || [];
        if (messages.length > 0) {
          const messagesCol = convDocRef.collection('messages');
          const msgChunks = chunkArray<any>(messages, 400);

          for (const chunk of msgChunks) {
            const batch = adminFirestore.batch();
            for (const msg of chunk) {
              const docId = (msg as any).hash || `msg_${(msg as any).timestamp}_${(msg as any).address}`;
              const docRef = messagesCol.doc(docId);
              batch.set(docRef, {
                ...msg,
                uploadedAt: Date.now()
              }, { merge: true });
            }
            await batch.commit();
          }
          uploadedCount += messages.length;
        }
      }
    }

    // 3. حفظ بيانات جلسة المزامنة
    const syncTimestamp = payload.backupMetadata.syncTimestamp || Date.now();
    const sessionDocRef = userDocRef.collection('backup_sessions').doc(`session_${syncTimestamp}`);
    await sessionDocRef.set({
      ...payload.backupMetadata,
      syncTimestamp,
      createdAt: Date.now()
    });

    // 4. تحديث مؤشر المزامنة العام في Firestore
    await userDocRef.collection('metadata').doc('sync_state').set({
      lastSyncTimestamp: syncTimestamp,
      deviceModel: payload.backupMetadata.deviceModel || 'Android Device',
      androidVersion: payload.backupMetadata.androidVersion || '',
      updatedAt: Date.now()
    }, { merge: true });

    return res.json({
      success: true,
      message: 'تم حفظ النسخة الاحتياطية بنجاح داخل Cloud Firestore بطريقة مجزأة ومنظمة',
      uploadedItemsCount: uploadedCount,
      serverTimestamp: syncTimestamp
    });
  } catch (error: any) {
    console.error('Error in /api/upload/backup:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل رفع النسخة الاحتياطية: ' + error.message
    });
  }
});

/**
 * رفع سجلات المكالمات بشكل مستقل
 * POST /api/upload/calllogs
 */
uploadRouter.post('/calllogs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, error: 'غير مصرح' });

    const callLogs: any[] = req.body.callLogs || [];
    const callLogsCol = adminFirestore.collection('users').doc(username).collection('call_logs');

    const chunks = chunkArray<any>(callLogs, 400);
    for (const chunk of chunks) {
      const batch = adminFirestore.batch();
      for (const call of chunk) {
        const docId = (call as any).hash || `call_${(call as any).timestamp}_${(call as any).phoneNumber}`;
        batch.set(callLogsCol.doc(docId), { ...call, uploadedAt: Date.now() }, { merge: true });
      }
      await batch.commit();
    }

    return res.json({ success: true, count: callLogs.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * رفع رسائل SMS بشكل مستقل
 * POST /api/upload/sms
 */
uploadRouter.post('/sms', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) return res.status(401).json({ success: false, error: 'غير مصرح' });

    const messages: any[] = req.body.messages || [];
    const userDocRef = adminFirestore.collection('users').doc(username);

    const chunks = chunkArray<any>(messages, 400);
    for (const chunk of chunks) {
      const batch = adminFirestore.batch();
      for (const msg of chunk) {
        const threadId = String((msg as any).threadId || 'default');
        const docId = (msg as any).hash || `msg_${(msg as any).timestamp}_${(msg as any).address}`;
        const docRef = userDocRef.collection('sms_conversations').doc(threadId).collection('messages').doc(docId);
        batch.set(docRef, { ...msg, uploadedAt: Date.now() }, { merge: true });
      }
      await batch.commit();
    }

    return res.json({ success: true, count: messages.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
