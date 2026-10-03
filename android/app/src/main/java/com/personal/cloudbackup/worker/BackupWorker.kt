package com.personal.cloudbackup.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.personal.cloudbackup.data.repository.BackupRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * منقّذ المزامنة في الخلفية (BackupWorker):
 * - يعتمد رسمياً على Jetpack CoroutineWorker.
 * - ينفذ عملية النسخ التزايدي والمقارنة بذكاء عبر BackupRepository.
 * - يضمن عدم استهلاك البطارية أو الإنترنت في حال عدم وجود عناصر جديدة.
 * - يعيد المحاولة تلقائياً (Result.retry()) في حال انقطاع الشبكة أو حدوث خطأ طارئ.
 */
class BackupWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val repository = BackupRepository(appContext)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val result = repository.performSync()

        if (result.isSuccess) {
            Result.success()
        } else {
            // إعادة المحاولة التلقائية وفق خوارزمية Exponential Backoff
            Result.retry()
        }
    }
}
