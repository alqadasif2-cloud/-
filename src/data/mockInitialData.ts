import { CloudStorageStructure, CallLogRecord, SmsRecord, SmsConversation } from '../types/backup';

const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

function formatDuration(sec: number): string {
  if (sec === 0) return '0 ثانية (لم يُرد)';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} ثانية`;
  return `${m} د ${s} ث`;
}

function formatDate(epoch: number): string {
  const d = new Date(epoch);
  return d.toISOString().split('T')[0];
}

function formatTime(epoch: number): string {
  const d = new Date(epoch);
  return d.toTimeString().split(' ')[0].substring(0, 5);
}

// Generate simple hash for deduplication demo
export function generateRecordHash(prefix: string, id: string, timestamp: number): string {
  return `${prefix}_${id}_${timestamp}`;
}

export const initialCallLogs: CallLogRecord[] = [
  {
    id: '1042',
    phoneNumber: '+966501234567',
    contactName: 'أحمد المحمدي (العمل)',
    callType: 'INCOMING',
    rawType: 1,
    timestamp: now - 25 * 60 * 1000,
    dateFormatted: formatDate(now - 25 * 60 * 1000),
    timeFormatted: formatTime(now - 25 * 60 * 1000),
    durationSeconds: 185,
    durationFormatted: formatDuration(185),
    geocodedLocation: 'الرياض، المملكة العربية السعودية',
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('CALL', '1042', now - 25 * 60 * 1000)
  },
  {
    id: '1041',
    phoneNumber: '+966559876543',
    contactName: 'الوالدة حفظها الله',
    callType: 'OUTGOING',
    rawType: 2,
    timestamp: now - 3 * hour,
    dateFormatted: formatDate(now - 3 * hour),
    timeFormatted: formatTime(now - 3 * hour),
    durationSeconds: 420,
    durationFormatted: formatDuration(420),
    geocodedLocation: 'جدة، المملكة العربية السعودية',
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('CALL', '1041', now - 3 * hour)
  },
  {
    id: '1040',
    phoneNumber: '+966540001122',
    contactName: null,
    callType: 'MISSED',
    rawType: 3,
    timestamp: now - 5 * hour,
    dateFormatted: formatDate(now - 5 * hour),
    timeFormatted: formatTime(now - 5 * hour),
    durationSeconds: 0,
    durationFormatted: formatDuration(0),
    geocodedLocation: 'الدمام، المملكة العربية السعودية',
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('CALL', '1040', now - 5 * hour)
  },
  {
    id: '1039',
    phoneNumber: '+966112223344',
    contactName: 'خدمة العملاء - البنك الأهلي',
    callType: 'INCOMING',
    rawType: 1,
    timestamp: now - day,
    dateFormatted: formatDate(now - day),
    timeFormatted: formatTime(now - day),
    durationSeconds: 74,
    durationFormatted: formatDuration(74),
    geocodedLocation: 'الرياض، المملكة العربية السعودية',
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('CALL', '1039', now - day)
  },
  {
    id: '1038',
    phoneNumber: '+966567788990',
    contactName: 'م. خالد الدوسري',
    callType: 'OUTGOING',
    rawType: 2,
    timestamp: now - (day + 4 * hour),
    dateFormatted: formatDate(now - (day + 4 * hour)),
    timeFormatted: formatTime(now - (day + 4 * hour)),
    durationSeconds: 310,
    durationFormatted: formatDuration(310),
    geocodedLocation: 'الخبر، المملكة العربية السعودية',
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('CALL', '1038', now - (day + 4 * hour))
  },
  {
    id: '1037',
    phoneNumber: '+966533344455',
    contactName: null,
    callType: 'REJECTED',
    rawType: 5,
    timestamp: now - (2 * day),
    dateFormatted: formatDate(now - (2 * day)),
    timeFormatted: formatTime(now - (2 * day)),
    durationSeconds: 0,
    durationFormatted: formatDuration(0),
    geocodedLocation: 'مكة المكرمة، المملكة العربية السعودية',
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('CALL', '1037', now - (2 * day))
  }
];

export const initialSmsRecords: SmsRecord[] = [
  // Thread 1: Al Rajhi Bank
  {
    id: '8091',
    threadId: '101',
    address: 'AlRajhiBank',
    contactName: 'مصرف الراجحي',
    body: 'تم إيداع مبلغ 8,500.00 ر.س في حسابك الجاري ينتهي بـ 4902. الرصيد الحالي: 14,230.50 ر.س',
    timestamp: now - 40 * 60 * 1000,
    dateFormatted: formatDate(now - 40 * 60 * 1000),
    timeFormatted: formatTime(now - 40 * 60 * 1000),
    direction: 'INBOX',
    rawType: 1,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8091', now - 40 * 60 * 1000)
  },
  {
    id: '8090',
    threadId: '101',
    address: 'AlRajhiBank',
    contactName: 'مصرف الراجحي',
    body: 'رمز التحقق الخاص بك لتسجيل الدخول إلى المباشر هو: 639145. صالح لمدة 5 دقائق. لا تشاركه مع أي شخص.',
    timestamp: now - 2 * day,
    dateFormatted: formatDate(now - 2 * day),
    timeFormatted: formatTime(now - 2 * day),
    direction: 'INBOX',
    rawType: 1,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8090', now - 2 * day)
  },
  // Thread 2: Fahad brother
  {
    id: '8089',
    threadId: '102',
    address: '+966551122334',
    contactName: 'فهد (أخي)',
    body: 'وعليكم السلام، نعم إن شاء الله سنلتقي في مجلس العائلة بعد صلاة العشاء.',
    timestamp: now - 1 * hour,
    dateFormatted: formatDate(now - 1 * hour),
    timeFormatted: formatTime(now - 1 * hour),
    direction: 'SENT',
    rawType: 2,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8089', now - 1 * hour)
  },
  {
    id: '8088',
    threadId: '102',
    address: '+966551122334',
    contactName: 'فهد (أخي)',
    body: 'السلام عليكم يا بو محمد، هل أنت قادم لاجتماع العائلة اليوم الجمعة؟ الوالد يسأل عنك.',
    timestamp: now - 2 * hour,
    dateFormatted: formatDate(now - 2 * hour),
    timeFormatted: formatTime(now - 2 * hour),
    direction: 'INBOX',
    rawType: 1,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8088', now - 2 * hour)
  },
  // Thread 3: STC
  {
    id: '8087',
    threadId: '103',
    address: 'stc',
    contactName: 'شركة الاتصالات stc',
    body: 'عزيزي العميل، تم تجديد باقتك الشهرية بنجاح. رصيد البيانات المتبقي: 55GB صالحة حتى 2026-10-25.',
    timestamp: now - day,
    dateFormatted: formatDate(now - day),
    timeFormatted: formatTime(now - day),
    direction: 'INBOX',
    rawType: 1,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8087', now - day)
  },
  // Thread 4: Delivery
  {
    id: '8086',
    threadId: '104',
    address: '+966549988776',
    contactName: 'مندوب التوصيل - أرامكس',
    body: 'السلام عليكم، معك مندوب أرامكس لتسليم الشحنة رقم 394810. أنا عند مدخل العمارة الآن.',
    timestamp: now - (2 * day + 3 * hour),
    dateFormatted: formatDate(now - (2 * day + 3 * hour)),
    timeFormatted: formatTime(now - (2 * day + 3 * hour)),
    direction: 'INBOX',
    rawType: 1,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8086', now - (2 * day + 3 * hour))
  },
  {
    id: '8085',
    threadId: '104',
    address: '+966549988776',
    contactName: 'مندوب التوصيل - أرامكس',
    body: 'تمام نازل لك حالاً، دقيقة واحدة فضلاً.',
    timestamp: now - (2 * day + 2 * hour + 58 * 60 * 1000),
    dateFormatted: formatDate(now - (2 * day + 2 * hour + 58 * 60 * 1000)),
    timeFormatted: formatTime(now - (2 * day + 2 * hour + 58 * 60 * 1000)),
    direction: 'SENT',
    rawType: 2,
    read: true,
    syncedAt: now - 15 * 60 * 1000,
    hash: generateRecordHash('SMS', '8085', now - (2 * day + 2 * hour + 58 * 60 * 1000))
  }
];

export function buildConversations(messages: SmsRecord[]): SmsConversation[] {
  const map = new Map<string, SmsRecord[]>();

  messages.forEach(msg => {
    const list = map.get(msg.threadId) || [];
    list.push(msg);
    map.set(msg.threadId, list);
  });

  const conversations: SmsConversation[] = [];

  map.forEach((threadMessages, threadId) => {
    // sort chronologically
    threadMessages.sort((a, b) => a.timestamp - b.timestamp);
    const lastMsg = threadMessages[threadMessages.length - 1];
    conversations.push({
      threadId,
      participantAddress: lastMsg.address,
      participantName: lastMsg.contactName,
      messageCount: threadMessages.length,
      lastMessageTimestamp: lastMsg.timestamp,
      lastMessageSnippet: lastMsg.body,
      messages: threadMessages
    });
  });

  // Sort conversations by last message timestamp descending
  conversations.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  return conversations;
}

export function createInitialCloudStorage(): CloudStorageStructure {
  const conversations = buildConversations(initialSmsRecords);
  return {
    Backup: {
      CallLogs: [...initialCallLogs].sort((a, b) => b.timestamp - a.timestamp),
      SMS: {
        Conversations: conversations,
        Metadata: {
          totalThreads: conversations.length,
          totalMessages: initialSmsRecords.length,
          lastUpdated: now - 15 * 60 * 1000
        }
      },
      BackupMetadata: {
        deviceId: 'SM-S928B_GALAXY_S24_ULTRA',
        deviceModel: 'Samsung Galaxy S24 Ultra',
        androidVersion: 'Android 14 (API 34)',
        appVersion: 'v1.0.0-release',
        lastSuccessfulSyncTimestamp: now - 15 * 60 * 1000,
        lastAttemptTimestamp: now - 15 * 60 * 1000,
        totalCallLogsStored: initialCallLogs.length,
        totalSmsStored: initialSmsRecords.length,
        totalConversationsStored: conversations.length,
        syncHistory: [
          {
            id: 'sync_evt_001',
            timestamp: now - 15 * 60 * 1000,
            status: 'SUCCESS',
            networkType: 'WIFI',
            batteryLevel: 88,
            isCharging: true,
            newCallLogsCount: 2,
            newSmsCount: 3,
            totalSyncedItems: 5,
            durationMs: 840
          },
          {
            id: 'sync_evt_000',
            timestamp: now - day,
            status: 'SUCCESS',
            networkType: 'WIFI',
            batteryLevel: 94,
            isCharging: true,
            newCallLogsCount: 4,
            newSmsCount: 4,
            totalSyncedItems: 8,
            durationMs: 1420
          }
        ]
      }
    }
  };
}
