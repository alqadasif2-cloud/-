package com.personal.cloudbackup.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * جدول لتخزين بصمات العناصر التي تمت مزامنتها مسبقاً (Deduplication Hashes)
 * يضمن عدم إعادة رفع أي مكالمة أو رسالة تكراراً
 */
@Entity(tableName = "synced_records")
data class SyncedRecordEntity(
    @PrimaryKey
    val recordHash: String,
    val recordType: String, // "CALL" أو "SMS"
    val androidId: String,
    val timestamp: Long,
    val syncedAt: Long = System.currentTimeMillis()
)

/**
 * جدول لتخزين البيانات الوصفية للمزامنة (آخر وقت فحص، وقت النجاح، الأخطاء)
 */
@Entity(tableName = "sync_metadata")
data class SyncMetadataEntity(
    @PrimaryKey
    val key: String,
    val value: String
)
