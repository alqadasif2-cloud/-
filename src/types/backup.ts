export type CallType = 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED' | 'BLOCKED';

export interface CallLogRecord {
  id: string; // Android CallLog.Calls._ID
  phoneNumber: string;
  contactName: string | null;
  callType: CallType;
  rawType: number; // 1: Incoming, 2: Outgoing, 3: Missed, 5: Rejected, 6: Blocked
  timestamp: number; // Milliseconds epoch
  dateFormatted: string;
  timeFormatted: string;
  durationSeconds: number;
  durationFormatted: string;
  geocodedLocation?: string;
  syncedAt: number;
  hash: string; // SHA-256 for deduplication
}

export type SmsDirection = 'INBOX' | 'SENT';

export interface SmsRecord {
  id: string; // Android Telephony.Sms._ID
  threadId: string; // Telephony.Sms.THREAD_ID
  address: string; // Phone number or sender
  contactName: string | null;
  body: string;
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  direction: SmsDirection;
  rawType: number; // 1: Inbox, 2: Sent
  read: boolean;
  syncedAt: number;
  hash: string;
}

export interface SmsConversation {
  threadId: string;
  participantAddress: string;
  participantName: string | null;
  messageCount: number;
  lastMessageTimestamp: number;
  lastMessageSnippet: string;
  messages: SmsRecord[];
}

export interface BackupSyncEvent {
  id: string;
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  networkType: 'WIFI' | 'CELLULAR' | 'NONE';
  batteryLevel: number;
  isCharging: boolean;
  newCallLogsCount: number;
  newSmsCount: number;
  totalSyncedItems: number;
  durationMs: number;
  errorMessage?: string;
}

export interface CloudBackupMetadata {
  deviceId: string;
  deviceModel: string;
  androidVersion: string;
  appVersion: string;
  lastSuccessfulSyncTimestamp: number;
  lastAttemptTimestamp: number;
  totalCallLogsStored: number;
  totalSmsStored: number;
  totalConversationsStored: number;
  syncHistory: BackupSyncEvent[];
}

export interface CloudStorageStructure {
  Backup: {
    CallLogs: CallLogRecord[];
    SMS: {
      Conversations: SmsConversation[];
      Metadata: {
        totalThreads: number;
        totalMessages: number;
        lastUpdated: number;
      };
    };
    BackupMetadata: CloudBackupMetadata;
  };
}
