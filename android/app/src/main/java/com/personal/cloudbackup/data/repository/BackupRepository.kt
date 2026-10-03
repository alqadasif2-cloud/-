package com.personal.cloudbackup.data.repository

import android.content.Context
import android.os.Build
import com.personal.cloudbackup.cloud.BackendRestCloudStorageProvider
import com.personal.cloudbackup.cloud.CloudStorageProvider
import com.personal.cloudbackup.cloud.CloudUploadResult
import com.personal.cloudbackup.data.local.AppDatabase
import com.personal.cloudbackup.data.local.SyncMetadataEntity
import com.personal.cloudbackup.data.local.SyncedRecordEntity
import com.personal.cloudbackup.model.*
import com.personal.cloudbackup.reader.CallLogReader
import com.personal.cloudbackup.reader.SmsReader
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * مستودع المزامنة والنسخ الاحتياطي (BackupRepository):
 * - يربط بين طبقة القراءة (Readers) وطبقة منع التكرار (Room DB) وطبقة خادم Backend (REST API).
 * - يستخدم BackendRestCloudStorageProvider افتراضياً دون أي اتصال مباشر بـ Firebase من الهاتف.
 */
class BackupRepository(
    private val context: Context,
    private val cloudProvider: CloudStorageProvider = BackendRestCloudStorageProvider(context)
) {

    private val db = AppDatabase.getInstance(context)
    private val syncDao = db.syncDao()
    private val callLogReader = CallLogReader(context)
    private val smsReader = SmsReader(context)

    suspend fun performSync(): SyncResult = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()

        try {
            // 1. قراءة وقت آخر مزامنة مسجل محلياً
            val lastCallSyncTime = syncDao.getMetadata("last_call_sync_timestamp")?.toLongOrNull() ?: 0L
            val lastSmsSyncTime = syncDao.getMetadata("last_sms_sync_timestamp")?.toLongOrNull() ?: 0L

            // 2. جلب العناصر الجديدة من مزودات Android الرسمية
            val rawCalls = callLogReader.readCallLogsSince(lastCallSyncTime)
            val rawSms = smsReader.readSmsSince(lastSmsSyncTime)

            // 3. منع التكرار بفحص الـ Hashes الموجودة مسبقاً في قاعدة بيانات Room بأمان ضد حدود متغيرات SQLite
            val callHashes = rawCalls.map { it.hash }
            val existingCallHashes = if (callHashes.isNotEmpty()) {
                callHashes.chunked(500).flatMap { syncDao.getExistingHashes(it) }.toSet()
            } else emptySet()

            val smsHashes = rawSms.map { it.hash }
            val existingSmsHashes = if (smsHashes.isNotEmpty()) {
                smsHashes.chunked(500).flatMap { syncDao.getExistingHashes(it) }.toSet()
            } else emptySet()

            val newCalls = rawCalls.filterNot { existingCallHashes.contains(it.hash) }
            val newSms = rawSms.filterNot { existingSmsHashes.contains(it.hash) }

            // إذا لم تكن هناك أي عناصر جديدة، نكتفي بتحديث وقت الفحص ولا نستهلك إنترنت أو بطارية
            if (newCalls.isEmpty() && newSms.isEmpty()) {
                syncDao.setMetadata(SyncMetadataEntity("last_attempt_timestamp", now.toString()))
                return@withContext SyncResult(
                    isSuccess = true,
                    syncedCallsCount = 0,
                    syncedSmsCount = 0,
                    timestamp = now
                )
            }

            // 4. تنظيم الرسائل على شكل محادثات (Conversations)
            val conversations = smsReader.groupIntoConversations(newSms)

            // 5. تجهيز حزمة النسخ بالهيكلية الشجرية المحددة:
            // Backup/
            //   ├── CallLogs/
            //   ├── SMS/Conversations/
            //   └── BackupMetadata/
            val payload = BackupPayload(
                callLogs = newCalls,
                conversations = conversations,
                smsMetadata = SmsContainerMetadata(
                    totalThreads = conversations.size,
                    totalMessages = newSms.size,
                    lastUpdated = now
                ),
                backupMetadata = BackupSessionMetadata(
                    deviceId = Build.MODEL,
                    deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}",
                    androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                    syncTimestamp = now,
                    newCallsCount = newCalls.size,
                    newSmsCount = newSms.size,
                    totalSyncedItems = newCalls.size + newSms.size,
                    status = "SUCCESS"
                )
            )

            // 6. رفع الحزمة إلى خادم Backend REST API عبر المزود
            when (val uploadResult = cloudProvider.uploadBackupPayload(payload)) {
                is CloudUploadResult.Success -> {
                    // 7. حفظ بصمات العناصر في Room DB لمنع رفعها مجدداً نهائياً مع تجزئة الحزم للأمان
                    val callEntities = newCalls.map {
                        SyncedRecordEntity(it.hash, "CALL", it.androidId, it.timestamp)
                    }
                    val smsEntities = newSms.map {
                        SyncedRecordEntity(it.hash, "SMS", it.androidId, it.timestamp)
                    }

                    val allEntities = callEntities + smsEntities
                    allEntities.chunked(200).forEach { chunk ->
                        syncDao.insertSyncedRecords(chunk)
                    }

                    // تحديث أختام الوقت
                    val maxCallTimestamp = newCalls.maxOfOrNull { it.timestamp } ?: lastCallSyncTime
                    val maxSmsTimestamp = newSms.maxOfOrNull { it.timestamp } ?: lastSmsSyncTime

                    syncDao.setMetadata(SyncMetadataEntity("last_call_sync_timestamp", maxCallTimestamp.toString()))
                    syncDao.setMetadata(SyncMetadataEntity("last_sms_sync_timestamp", maxSmsTimestamp.toString()))
                    syncDao.setMetadata(SyncMetadataEntity("last_success_timestamp", now.toString()))
                    syncDao.setMetadata(SyncMetadataEntity("last_attempt_timestamp", now.toString()))

                    SyncResult(
                        isSuccess = true,
                        syncedCallsCount = newCalls.size,
                        syncedSmsCount = newSms.size,
                        timestamp = now
                    )
                }
                is CloudUploadResult.Failure -> {
                    syncDao.setMetadata(SyncMetadataEntity("last_error", uploadResult.errorMessage))
                    syncDao.setMetadata(SyncMetadataEntity("last_attempt_timestamp", now.toString()))
                    SyncResult(
                        isSuccess = false,
                        syncedCallsCount = 0,
                        syncedSmsCount = 0,
                        timestamp = now,
                        errorMessage = uploadResult.errorMessage
                    )
                }
            }

        } catch (e: Exception) {
            syncDao.setMetadata(SyncMetadataEntity("last_error", e.localizedMessage ?: "Unknown error"))
            SyncResult(
                isSuccess = false,
                syncedCallsCount = 0,
                syncedSmsCount = 0,
                timestamp = now,
                errorMessage = e.message
            )
        }
    }
}
