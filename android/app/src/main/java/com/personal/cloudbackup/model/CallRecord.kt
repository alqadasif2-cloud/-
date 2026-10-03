package com.personal.cloudbackup.model

/**
 * أنواع المكالمات المتاحة رسميًا في سجل مكالمات Android (CallLog.Calls.TYPE)
 */
enum class CallType {
    INCOMING,
    OUTGOING,
    MISSED,
    VOICEMAIL,
    REJECTED,
    BLOCKED,
    ANSWERED_EXTERNALLY,
    UNKNOWN;

    companion object {
        fun fromRawType(rawType: Int): CallType {
            return when (rawType) {
                1 -> INCOMING               // CallLog.Calls.INCOMING_TYPE
                2 -> OUTGOING               // CallLog.Calls.OUTGOING_TYPE
                3 -> MISSED                 // CallLog.Calls.MISSED_TYPE
                4 -> VOICEMAIL              // CallLog.Calls.VOICEMAIL_TYPE
                5 -> REJECTED               // CallLog.Calls.REJECTED_TYPE
                6 -> BLOCKED                // CallLog.Calls.BLOCKED_TYPE
                7 -> ANSWERED_EXTERNALLY    // CallLog.Calls.ANSWERED_EXTERNALLY_TYPE
                else -> UNKNOWN
            }
        }
    }
}

/**
 * نموذج بيانات سجل المكالمات وفق ما تسمح به واجهات Android الرسمية:
 * يحفظ الرقم، اسم جهة الاتصال، النوع، التاريخ والوقت، المدة، ومعرف أندرويد الرسمي
 */
data class CallRecord(
    val androidId: String,          // CallLog.Calls._ID
    val phoneNumber: String,        // CallLog.Calls.NUMBER
    val contactName: String?,       // CallLog.Calls.CACHED_NAME
    val callType: CallType,         // CallType Enum
    val rawType: Int,               // القيمة الرقمية الأصلية من نظام أندرويد
    val timestamp: Long,            // CallLog.Calls.DATE (Epoch Milliseconds)
    val durationSeconds: Long,      // CallLog.Calls.DURATION
    val geocodedLocation: String?,  // CallLog.Calls.GEOCODED_LOCATION (إن توفر رسميًا)
    val hash: String                // بصمة فريدة لمنع تكرار الرفع
)
