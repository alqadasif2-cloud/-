package com.personal.cloudbackup.reader

import android.content.Context
import android.database.Cursor
import android.provider.CallLog
import com.personal.cloudbackup.model.CallRecord
import com.personal.cloudbackup.model.CallType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest

/**
 * قارئ سجل المكالمات الرسمي (CallLogReader):
 * - يستخدم ContentResolver مع CallLog.Calls.CONTENT_URI الرسمي.
 * - يلتزم التزاماً كاملاً بصلاحية android.permission.READ_CALL_LOG.
 * - يدعم القراءة التزايدية (Incremental): جلب السجلات الأحدث فقط من آخر وقت مزامنة.
 * - يرتب النتائج زمنيًا وفق DATE.
 */
class CallLogReader(private val context: Context) {

    private val projection = arrayOf(
        CallLog.Calls._ID,
        CallLog.Calls.NUMBER,
        CallLog.Calls.CACHED_NAME,
        CallLog.Calls.TYPE,
        CallLog.Calls.DATE,
        CallLog.Calls.DURATION,
        CallLog.Calls.GEOCODED_LOCATION
    )

    suspend fun readCallLogsSince(lastSyncTimestamp: Long): List<CallRecord> = withContext(Dispatchers.IO) {
        val records = mutableListOf<CallRecord>()

        val selection = "${CallLog.Calls.DATE} > ?"
        val selectionArgs = arrayOf(lastSyncTimestamp.toString())
        val sortOrder = "${CallLog.Calls.DATE} ASC"

        val cursor: Cursor? = try {
            context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )
        } catch (e: SecurityException) {
            // تحدث إذا لم تُمنح الصلاحية الرسمية من المستخدم
            return@withContext emptyList()
        } catch (e: Exception) {
            return@withContext emptyList()
        }

        cursor?.use {
            val idIndex = it.getColumnIndexOrThrow(CallLog.Calls._ID)
            val numberIndex = it.getColumnIndexOrThrow(CallLog.Calls.NUMBER)
            val nameIndex = it.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME)
            val typeIndex = it.getColumnIndexOrThrow(CallLog.Calls.TYPE)
            val dateIndex = it.getColumnIndexOrThrow(CallLog.Calls.DATE)
            val durationIndex = it.getColumnIndexOrThrow(CallLog.Calls.DURATION)
            val locationIndex = it.getColumnIndex(CallLog.Calls.GEOCODED_LOCATION)

            while (it.moveToNext()) {
                val id = it.getLong(idIndex).toString()
                val number = it.getString(numberIndex) ?: "UNKNOWN"
                val name = it.getString(nameIndex)
                val rawType = it.getInt(typeIndex)
                val date = it.getLong(dateIndex)
                val duration = it.getLong(durationIndex)
                val location = if (locationIndex >= 0) it.getString(locationIndex) else null

                val callType = CallType.fromRawType(rawType)
                val hash = generateHash("CALL_${id}_${number}_${date}_${duration}")

                records.add(
                    CallRecord(
                        androidId = id,
                        phoneNumber = number,
                        contactName = name,
                        callType = callType,
                        rawType = rawType,
                        timestamp = date,
                        durationSeconds = duration,
                        geocodedLocation = location,
                        hash = hash
                    )
                )
            }
        }

        records
    }

    private fun generateHash(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = digest.digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
