package com.personal.cloudbackup.model

/**
 * اتجاه الرسالة النصية: واردة أو صادرة
 */
enum class SmsDirection {
    INCOMING,
    OUTGOING,
    UNKNOWN;

    companion object {
        fun fromRawType(rawType: Int): SmsDirection {
            return when (rawType) {
                1 -> INCOMING  // Telephony.Sms.MESSAGE_TYPE_INBOX
                2 -> OUTGOING  // Telephony.Sms.MESSAGE_TYPE_SENT
                else -> UNKNOWN
            }
        }
    }
}

/**
 * نموذج بيانات رسائل SMS وفق ما تسمح به واجهات Android الرسمية:
 * يحفظ الرقم، اسم جهة الاتصال، النص، التاريخ والوقت، الاتجاه، معرف الرسالة، ومعرف المحادثة
 */
data class SmsRecord(
    val androidId: String,          // Telephony.Sms._ID
    val threadId: String,           // Telephony.Sms.THREAD_ID (معرف المحادثة)
    val address: String,            // Telephony.Sms.ADDRESS (رقم المرسل أو المستقبل)
    val contactName: String?,       // اسم جهة الاتصال إن وُجد
    val body: String,               // محتوى الرسالة
    val timestamp: Long,            // Telephony.Sms.DATE (Epoch Milliseconds)
    val direction: SmsDirection,    // اتجاه الرسالة
    val rawType: Int,               // القيمة الرقمية الأصلية من نظام أندرويد
    val isRead: Boolean,            // هل تمت قراءتها
    val hash: String                // بصمة فريدة لمنع تكرار الرفع
)
