package com.personal.cloudbackup.reader

import android.content.Context
import android.database.Cursor
import android.provider.Telephony
import com.personal.cloudbackup.model.SmsConversation
import com.personal.cloudbackup.model.SmsDirection
import com.personal.cloudbackup.model.SmsRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest

/**
 * قارئ رسائل SMS الرسمي (SmsReader):
 * - يستخدم ContentResolver مع Telephony.Sms.CONTENT_URI الرسمي.
 * - يلتزم التزاماً كاملاً بصلاحية android.permission.READ_SMS.
 * - يدعم القراءة التزايدية (Incremental): جلب الرسائل الأحدث فقط من آخر وقت مزامنة.
 * - يوفر دالة لتجميع الرسائل في محادثات (Conversations) وفق Thread ID ومرتبة زمنيًا.
 */
class SmsReader(private val context: Context) {

    private val projection = arrayOf(
        Telephony.Sms._ID,
        Telephony.Sms.THREAD_ID,
        Telephony.Sms.ADDRESS,
        Telephony.Sms.BODY,
        Telephony.Sms.DATE,
        Telephony.Sms.TYPE,
        Telephony.Sms.READ
    )

    suspend fun readSmsSince(lastSyncTimestamp: Long): List<SmsRecord> = withContext(Dispatchers.IO) {
        val records = mutableListOf<SmsRecord>()

        val selection = "${Telephony.Sms.DATE} > ?"
        val selectionArgs = arrayOf(lastSyncTimestamp.toString())
        val sortOrder = "${Telephony.Sms.DATE} ASC"

        val cursor: Cursor? = try {
            context.contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )
        } catch (e: SecurityException) {
            return@withContext emptyList()
        } catch (e: Exception) {
            return@withContext emptyList()
        }

        cursor?.use {
            val idIndex = it.getColumnIndexOrThrow(Telephony.Sms._ID)
            val threadIdIndex = it.getColumnIndexOrThrow(Telephony.Sms.THREAD_ID)
            val addressIndex = it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
            val bodyIndex = it.getColumnIndexOrThrow(Telephony.Sms.BODY)
            val dateIndex = it.getColumnIndexOrThrow(Telephony.Sms.DATE)
            val typeIndex = it.getColumnIndexOrThrow(Telephony.Sms.TYPE)
            val readIndex = it.getColumnIndexOrThrow(Telephony.Sms.READ)

            while (it.moveToNext()) {
                val id = it.getLong(idIndex).toString()
                val threadId = it.getLong(threadIdIndex).toString()
                val address = it.getString(addressIndex) ?: "UNKNOWN"
                val body = it.getString(bodyIndex) ?: ""
                val date = it.getLong(dateIndex)
                val rawType = it.getInt(typeIndex)
                val isRead = it.getInt(readIndex) == 1

                val direction = SmsDirection.fromRawType(rawType)
                val hash = generateHash("SMS_${id}_${threadId}_${date}")

                records.add(
                    SmsRecord(
                        androidId = id,
                        threadId = threadId,
                        address = address,
                        contactName = null, // يمكن ربطه عبر ContactsContract إن توفرت الصلاحية
                        body = body,
                        timestamp = date,
                        direction = direction,
                        rawType = rawType,
                        isRead = isRead,
                        hash = hash
                    )
                )
            }
        }

        records
    }

    /**
     * تجميع قائمة الرسائل في محادثات مرتبة زمنيًا
     */
    fun groupIntoConversations(messages: List<SmsRecord>): List<SmsConversation> {
        val groupedByThread = messages.groupBy { it.threadId }

        return groupedByThread.map { (threadId, threadMessages) ->
            val sortedMessages = threadMessages.sortedBy { it.timestamp }
            val lastMessage = sortedMessages.last()

            SmsConversation(
                threadId = threadId,
                participantAddress = lastMessage.address,
                participantName = lastMessage.contactName,
                messageCount = sortedMessages.size,
                lastMessageTimestamp = lastMessage.timestamp,
                messages = sortedMessages
            )
        }.sortedByDescending { it.lastMessageTimestamp }
    }

    private fun generateHash(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = digest.digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
