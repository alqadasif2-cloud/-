package com.personal.cloudbackup.model

/**
 * حالة المزامنة وسجل العمليات الداخلية وفق النقطة 11
 */
data class SyncResult(
    val isSuccess: Boolean,
    val syncedCallsCount: Int,
    val syncedSmsCount: Int,
    val timestamp: Long,
    val errorMessage: String? = null
)
