package com.personal.cloudbackup.worker

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * مجدول مهام الخلفية الرسمي عبر Jetpack WorkManager:
 * - يضمن عمل المزامنة التلقائية الدورية.
 * - يفرض القيود الرسمية (Constraints): توفر الإنترنت + عدم انخفاض البطارية.
 * - يمنع تكرار المهام عبر Unique Work Policies (KEEP / REPLACE).
 */
object WorkScheduler {

    private const val PERIODIC_WORK_NAME = "PersonalCloudBackup_Periodic"
    private const val IMMEDIATE_WORK_NAME = "PersonalCloudBackup_Immediate"

    /**
     * جدولة مهمة دورية للمزامنة في الخلفية
     * ملاحظة نظام Android: الحد الأدنى الدوري المسموح به في WorkManager هو 15 دقيقة
     */
    fun schedulePeriodicBackup(context: Context, wifiOnly: Boolean = false) {
        val networkType = if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(networkType)
            .setRequiresBatteryNotLow(true)
            .build()

        val periodicRequest = PeriodicWorkRequestBuilder<BackupWorker>(
            1, TimeUnit.HOURS,
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            periodicRequest
        )
    }

    /**
     * تشغيل مزامنة فورية لمرة واحدة عند الحاجة (مثلاً بعد منح الصلاحيات)
     */
    fun triggerImmediateSync(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val immediateRequest = OneTimeWorkRequestBuilder<BackupWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            IMMEDIATE_WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            immediateRequest
        )
    }
}
