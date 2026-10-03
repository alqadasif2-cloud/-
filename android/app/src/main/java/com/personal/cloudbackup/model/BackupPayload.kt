package com.personal.cloudbackup.model

/**
 * بنية النسخة الاحتياطية المطابقة لطلبك:
 * Backup/
 *   ├── CallLogs/
 *   ├── SMS/
 *   │   ├── Conversations/
 *   │   └── Metadata/
 *   └── BackupMetadata/
 */
data class BackupPayload(
    val callLogs: List<CallRecord>,
    val conversations: List<SmsConversation>,
    val smsMetadata: SmsContainerMetadata,
    val backupMetadata: BackupSessionMetadata
)

data class SmsContainerMetadata(
    val totalThreads: Int,
    val totalMessages: Int,
    val lastUpdated: Long
)

data class BackupSessionMetadata(
    val deviceId: String,
    val deviceModel: String,
    val androidVersion: String,
    val syncTimestamp: Long,
    val newCallsCount: Int,
    val newSmsCount: Int,
    val totalSyncedItems: Int,
    val status: String
)
