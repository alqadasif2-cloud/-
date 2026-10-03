package com.personal.cloudbackup.model

/**
 * تنظيم الرسائل على شكل محادثات مجمعة وفق Thread ID
 * بحيث يمكن معرفة الرسائل التابعة لكل جهة اتصال وترتيبها زمنيًا
 */
data class SmsConversation(
    val threadId: String,
    val participantAddress: String,
    val participantName: String?,
    val messageCount: Int,
    val lastMessageTimestamp: Long,
    val messages: List<SmsRecord>
)
