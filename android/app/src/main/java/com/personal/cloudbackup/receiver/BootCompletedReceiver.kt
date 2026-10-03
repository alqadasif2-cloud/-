package com.personal.cloudbackup.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.personal.cloudbackup.worker.WorkScheduler

/**
 * مستقبل إشارات إقلاع النظام الرسمية:
 * يستمع إلى حدث اكتمال تشغيل الهاتف (ACTION_BOOT_COMPLETED)
 * ويقوم بإعادة جدولة مهمة WorkManager لتعمل المزامنة دون الحاجة لفتح التطبيق يدويًا.
 */
class BootCompletedReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            WorkScheduler.schedulePeriodicBackup(context)
        }
    }
}
