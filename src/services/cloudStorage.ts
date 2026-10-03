import { CloudStorageStructure, CallLogRecord, SmsRecord, BackupSyncEvent } from '../types/backup';
import { createInitialCloudStorage, buildConversations } from '../data/mockInitialData';

const STORAGE_KEY = 'android_personal_cloud_backup_v1';

export class CloudStorageService {
  private static instance: CloudStorageService;
  private state: CloudStorageStructure;
  private listeners: (() => void)[] = [];

  private constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch {
        this.state = createInitialCloudStorage();
      }
    } else {
      this.state = createInitialCloudStorage();
    }
  }

  public static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  public getState(): CloudStorageStructure {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.listeners.forEach(l => l());
  }

  public resetData() {
    this.state = createInitialCloudStorage();
    this.notify();
  }

  public performIncrementalSync(
    pendingCalls: CallLogRecord[],
    pendingSms: SmsRecord[],
    networkType: 'WIFI' | 'CELLULAR' | 'NONE' = 'WIFI',
    batteryLevel: number = 85
  ): { syncedCalls: number; syncedSms: number; totalNew: number } {
    const existingCallHashes = new Set(this.state.Backup.CallLogs.map(c => c.hash));
    const allExistingSms: SmsRecord[] = [];
    this.state.Backup.SMS.Conversations.forEach(c => allExistingSms.push(...c.messages));
    const existingSmsHashes = new Set(allExistingSms.map(s => s.hash));

    const newCalls = pendingCalls.filter(c => !existingCallHashes.has(c.hash));
    const newSms = pendingSms.filter(s => !existingSmsHashes.has(s.hash));

    const syncTime = Date.now();

    // Append calls
    const updatedCalls = [...this.state.Backup.CallLogs, ...newCalls].sort((a, b) => b.timestamp - a.timestamp);

    // Rebuild conversations with new SMS
    const combinedSms = [...allExistingSms, ...newSms];
    const updatedConversations = buildConversations(combinedSms);

    const syncEvent: BackupSyncEvent = {
      id: `sync_evt_${syncTime}`,
      timestamp: syncTime,
      status: 'SUCCESS',
      networkType,
      batteryLevel,
      isCharging: true,
      newCallLogsCount: newCalls.length,
      newSmsCount: newSms.length,
      totalSyncedItems: newCalls.length + newSms.length,
      durationMs: Math.floor(400 + Math.random() * 500)
    };

    this.state = {
      Backup: {
        CallLogs: updatedCalls,
        SMS: {
          Conversations: updatedConversations,
          Metadata: {
            totalThreads: updatedConversations.length,
            totalMessages: combinedSms.length,
            lastUpdated: syncTime
          }
        },
        BackupMetadata: {
          ...this.state.Backup.BackupMetadata,
          lastSuccessfulSyncTimestamp: syncTime,
          lastAttemptTimestamp: syncTime,
          totalCallLogsStored: updatedCalls.length,
          totalSmsStored: combinedSms.length,
          totalConversationsStored: updatedConversations.length,
          syncHistory: [syncEvent, ...this.state.Backup.BackupMetadata.syncHistory].slice(0, 30)
        }
      }
    };

    this.notify();

    return {
      syncedCalls: newCalls.length,
      syncedSms: newSms.length,
      totalNew: newCalls.length + newSms.length
    };
  }

  public exportBackupJson(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
