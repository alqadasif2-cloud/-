package com.personal.cloudbackup.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface SyncDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertSyncedRecords(records: List<SyncedRecordEntity>): List<Long>

    @Query("SELECT recordHash FROM synced_records WHERE recordHash IN (:hashes)")
    suspend fun getExistingHashes(hashes: List<String>): List<String>

    @Query("SELECT value FROM sync_metadata WHERE key = :key")
    suspend fun getMetadata(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setMetadata(metadata: SyncMetadataEntity)

    @Query("SELECT COUNT(*) FROM synced_records WHERE recordType = 'CALL'")
    suspend fun getSyncedCallsCount(): Int

    @Query("SELECT COUNT(*) FROM synced_records WHERE recordType = 'SMS'")
    suspend fun getSyncedSmsCount(): Int
}
