package com.personal.cloudbackup.cloud

import com.personal.cloudbackup.model.BackupPayload

/**
 * نتيجة رفع النسخة إلى السحابة
 */
sealed class CloudUploadResult {
    data class Success(val uploadedItemsCount: Int, val serverTimestamp: Long) : CloudUploadResult()
    data class Failure(val errorMessage: String, val canRetry: Boolean) : CloudUploadResult()
}

/**
 * واجهة طبقة التخزين السحابي المستقلة:
 * تم تصميمها كواجهة مجردة (Interface) وفق طلبك الصريح:
 * "تجهيز طبقة مستقلة للتخزين السحابي، بحيث يمكن ربطها بمزود السحابة لاحقاً.
 * لا تبدأ بإضافة مزود سحابي محدد حتى أحدده لك لاحقاً."
 */
interface CloudStorageProvider {

    /**
     * التحقق من توفر الاتصال بخدمة التخزين السحابي المحددة
     */
    suspend fun checkConnection(): Boolean

    /**
     * رفع حزمة النسخ الاحتياطي بالبنية المحددة
     */
    suspend fun uploadBackupPayload(payload: BackupPayload): CloudUploadResult

    /**
     * جلب تاريخ آخر نسخة مسجلة على السحابة (إن وُجدت)
     */
    suspend fun fetchCloudLastSyncTimestamp(): Long?
}
