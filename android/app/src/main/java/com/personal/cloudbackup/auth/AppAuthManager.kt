package com.personal.cloudbackup.auth

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * مدير المصادقة الخاص بالتطبيق (Custom App Authentication):
 *
 * 1. يتصل حصراً بخادم Backend عبر HTTPS REST API (POST /api/login و POST /api/register).
 * 2. لا يستدعي أي كود لـ Firebase أو Google نهائياً.
 * 3. يستقبل رمز JWT الآمن ويحفظه في SharedPreferences.
 * 4. يتيح ضبط عنوان خادم Backend (سواء كان Cloud Run أو VPS أو عنواناً محلياً).
 */
object AppAuthManager {

    private const val PREFS_NAME = "personal_cloud_app_auth"
    private const val KEY_USERNAME = "app_username"
    private const val KEY_JWT_TOKEN = "app_jwt_token"
    private const val KEY_SERVER_URL = "app_server_url"
    private const val KEY_IS_LOGGED_IN = "app_is_logged_in"

    // العنوان الافتراضي لخادم Backend (يمكن تعديله في الإنتاج مثل Cloud Run أو النطاق المخصص)
    // 10.0.2.2 هو عنوان المضيف المحلي لجهاز المطور عند استخدام محاكي الأندرويد، أو النطاق الفعلي
    const val DEFAULT_SERVER_URL = "https://backend-api.local"

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun isLoggedIn(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_IS_LOGGED_IN, false) && !getAuthToken(context).isNullOrBlank()
    }

    fun getUsername(context: Context): String? {
        return getPrefs(context).getString(KEY_USERNAME, null)
    }

    fun getAuthToken(context: Context): String? {
        return getPrefs(context).getString(KEY_JWT_TOKEN, null)
    }

    fun getServerUrl(context: Context): String {
        return getPrefs(context).getString(KEY_SERVER_URL, null) ?: DEFAULT_SERVER_URL
    }

    fun setServerUrl(context: Context, url: String) {
        val cleanUrl = url.trim().removeSuffix("/")
        getPrefs(context).edit().putString(KEY_SERVER_URL, cleanUrl).apply()
    }

    /**
     * تسجيل الدخول أو إنشاء حساب عبر خادم Backend
     */
    suspend fun loginOrRegister(
        context: Context,
        username: String,
        password: String,
        customServerUrl: String? = null
    ): Result<String> = withContext(Dispatchers.IO) {
        val cleanUser = username.trim().lowercase()
        val cleanPass = password.trim()

        if (cleanUser.length < 3) {
            return@withContext Result.failure(IllegalArgumentException("اسم المستخدم يجب ألا يقل عن 3 أحرف"))
        }
        if (cleanPass.length < 4) {
            return@withContext Result.failure(IllegalArgumentException("كلمة المرور يجب ألا تقل عن 4 خانات"))
        }

        val baseUrl = customServerUrl?.trim()?.removeSuffix("/") ?: getServerUrl(context)
        setServerUrl(context, baseUrl)

        val deviceId = "${Build.MANUFACTURER}_${Build.MODEL}_${Build.ID}"

        val requestPayload = JsonObject().apply {
            addProperty("username", cleanUser)
            addProperty("password", cleanPass)
            addProperty("deviceId", deviceId)
        }

        val requestBody = gson.toJson(requestPayload).toRequestBody(jsonMediaType)

        // 1. محاولة تسجيل الدخول
        try {
            val loginRequest = Request.Builder()
                .url("$baseUrl/api/login")
                .post(requestBody)
                .build()

            val loginResponse = httpClient.newCall(loginRequest).execute()
            val loginBody = loginResponse.body?.string().orEmpty()

            if (loginResponse.isSuccessful) {
                val json = gson.fromJson(loginBody, JsonObject::class.java)
                val token = json.get("token")?.asString
                    ?: return@withContext Result.failure(IllegalStateException("لم يتم استلام رمز JWT"))

                saveSession(context, cleanUser, token)
                return@withContext Result.success(cleanUser)
            } else if (loginResponse.code == 404 || loginResponse.code == 400) {
                // إذا لم يكن الحساب موجوداً، نقوم بتسجيل حساب جديد تلقائياً
                val registerRequest = Request.Builder()
                    .url("$baseUrl/api/register")
                    .post(requestBody)
                    .build()

                val registerResponse = httpClient.newCall(registerRequest).execute()
                val registerBody = registerResponse.body?.string().orEmpty()

                if (registerResponse.isSuccessful) {
                    val json = gson.fromJson(registerBody, JsonObject::class.java)
                    val token = json.get("token")?.asString
                        ?: return@withContext Result.failure(IllegalStateException("لم يتم استلام رمز JWT"))

                    saveSession(context, cleanUser, token)
                    return@withContext Result.success(cleanUser)
                } else {
                    return@withContext Result.failure(SecurityException("فشل إنشاء الحساب: $registerBody"))
                }
            } else {
                return@withContext Result.failure(SecurityException("خطأ في تسجيل الدخول (رمز ${loginResponse.code}): $loginBody"))
            }
        } catch (e: IOException) {
            // في حال عدم توفر اتصال بالخادم، يتم إرجاع الخطأ ليظهر للمستخدم
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun saveSession(context: Context, username: String, token: String) {
        getPrefs(context).edit()
            .putString(KEY_USERNAME, username)
            .putString(KEY_JWT_TOKEN, token)
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply()
    }

    fun logout(context: Context) {
        getPrefs(context).edit()
            .remove(KEY_USERNAME)
            .remove(KEY_JWT_TOKEN)
            .putBoolean(KEY_IS_LOGGED_IN, false)
            .apply()
    }
}
