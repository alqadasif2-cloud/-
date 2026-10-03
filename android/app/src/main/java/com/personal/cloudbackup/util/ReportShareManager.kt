package com.personal.cloudbackup.util

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.personal.cloudbackup.data.local.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * مدير إنشاء ومشاركة تقارير النسخ الاحتياطي الرسمية:
 * 1. يعتمد على FileProvider لمنع حدوث FileUriExposedException في Android 7.0+ وحتى Android 14+.
 * 2. يجمع إحصائيات المزامنة الفعلية من قاعدة بيانات Room المحلية.
 * 3. يولد ملف تقرير نصي واضح ومنسق بصيغة UTF-8.
 * 4. يمنح أذونات القراءة FLAG_GRANT_READ_URI_PERMISSION لتطبيقات المشاركة.
 */
object ReportShareManager {

    private const val FILE_PROVIDER_SUFFIX = ".fileprovider"
    private const val REPORTS_FOLDER = "reports"

    /**
     * توليد التقرير وحفظه في مجلد cacheDir/reports/
     */
    suspend fun generateReportFile(context: Context, username: String? = null): File = withContext(Dispatchers.IO) {
        val reportsDir = File(context.cacheDir, REPORTS_FOLDER).apply {
            if (!exists()) mkdirs()
        }

        val database = AppDatabase.getInstance(context)
        val totalCalls = database.syncDao().getRecordCount("call")
        val totalSms = database.syncDao().getRecordCount("sms")
        val lastSyncMeta = database.syncDao().getMetadata("last_sync_timestamp")

        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val nowFormatted = dateFormat.format(Date())

        val lastSyncText = lastSyncMeta?.value?.toLongOrNull()?.let {
            dateFormat.format(Date(it))
        } ?: "لم تتم المزامنة بعد"

        val reportContent = buildString {
            appendLine("==================================================")
            appendLine("📊 تقرير النسخ الاحتياطي والمزامنة السحابية")
            appendLine("==================================================")
            appendLine("📅 تاريخ التقرير: $nowFormatted")
            appendLine("👤 اسم المستخدم: ${username ?: "غير محدد"}")
            appendLine("📱 طراز الجهاز: ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            appendLine("⚙️ إصدار أندرويد: Android ${android.os.Build.VERSION.RELEASE} (API ${android.os.Build.VERSION.SDK_INT})")
            appendLine("--------------------------------------------------")
            appendLine("📈 إحصائيات العناصر المزامنة محلياً:")
            appendLine("   • سجلات المكالمات: $totalCalls سجل")
            appendLine("   • الرسائل النصية القصيرة SMS: $totalSms رسالة")
            appendLine("   • إجمالي السجلات الفريدة: ${totalCalls + totalSms}")
            appendLine("--------------------------------------------------")
            appendLine("🔄 آخر مزامنة ناجحة: $lastSyncText")
            appendLine("☁️ المحرك السحابي: Cloud Firestore (Spark Free Tier)")
            appendLine("🔒 الحماية: تشفير الهاشات SHA-256 محلياً + مصادقة JWT")
            appendLine("==================================================")
        }

        val fileName = "backup_report_${System.currentTimeMillis()}.txt"
        val reportFile = File(reportsDir, fileName)

        FileOutputStream(reportFile).use { fos ->
            fos.write(reportContent.toByteArray(Charsets.UTF_8))
        }

        reportFile
    }

    /**
     * إنشاء Intent مشاركة التقرير عبر FileProvider بشكل آمن
     */
    suspend fun createShareIntent(context: Context, username: String? = null): Intent {
        val reportFile = generateReportFile(context, username)
        val authority = "${context.packageName}$FILE_PROVIDER_SUFFIX"

        val contentUri = FileProvider.getUriForFile(context, authority, reportFile)

        return Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "تقرير النسخ الاحتياطي السحابي - ${reportFile.name}")
            putExtra(Intent.EXTRA_TEXT, "مرفق تقرير النسخ الاحتياطي السحابي للجهاز.")
            putExtra(Intent.EXTRA_STREAM, contentUri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    /**
     * تشغيل نافذة المشاركة (Share Chooser) بشكل آمن
     */
    suspend fun shareReport(context: Context, username: String? = null): Boolean {
        return try {
            val shareIntent = createShareIntent(context, username)
            val chooser = Intent.createChooser(shareIntent, "مشاركة تقرير النسخ الاحتياطي").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
