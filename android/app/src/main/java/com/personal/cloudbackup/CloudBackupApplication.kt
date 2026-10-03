package com.personal.cloudbackup

import android.app.Application
import com.personal.cloudbackup.worker.WorkScheduler

class CloudBackupApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // تهيئة جدولة WorkManager التلقائية لتعمل في الخلفية
        WorkScheduler.schedulePeriodicBackup(this)
    }
}
