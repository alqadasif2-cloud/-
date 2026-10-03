package com.personal.cloudbackup.cloud

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import com.personal.cloudbackup.auth.AppAuthManager
import com.personal.cloudbackup.model.BackupPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * مزود التخزين السحابي عبر REST API الخاص بـ Backend:
 *
 * 1. لا يتصل إطلاقاً بـ Firebase من هاتف الأندرويد.
 * 2. يرسل البيانات عبر HTTPS REST API إلى خادم Node.js / Express.
 * 3. يرفق رمز التحقق الآمن JWT في ترويسة الطلب: Authorization: Bearer <token>.
 * 4. يتكفل خادم Backend بتخزين البيانات في Cloud Firestore مباشرة عبر Firebase Admin SDK دون الحاجة إلى Firebase Storage أو خطة Blaze.
 */
class BackendRestCloudStorageProvider(
    private val context: Context
) : CloudStorageProvider {

    private val gson: Gson = GsonBuilder().create()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    override suspend fun checkConnection(): Boolean = withContext(Dispatchers.IO) {
        val serverUrl = AppAuthManager.getServerUrl(context)
        val token = AppAuthManager.getAuthToken(context) ?: return@withContext false

        try {
            val request = Request.Builder()
                .url("$serverUrl/api/health")
                .header("Authorization", "Bearer $token")
                .get()
                .build()

            httpClient.newCall(request).execute().use { response ->
                response.isSuccessful
            }
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun uploadBackupPayload(payload: BackupPayload): CloudUploadResult = withContext(Dispatchers.IO) {
        val serverUrl = AppAuthManager.getServerUrl(context)
        val token = AppAuthManager.getAuthToken(context)
            ?: return@withContext CloudUploadResult.Failure("لم يتم تسجيل الدخول في حساب التطبيق بعد", canRetry = false)

        try {
            val jsonPayload = gson.toJson(payload)
            val requestBody = jsonPayload.toRequestBody(jsonMediaType)

            val request = Request.Builder()
                .url("$serverUrl/api/upload/backup")
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .post(requestBody)
                .build()

            httpClient.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()

                if (response.isSuccessful) {
                    val jsonResponse = try {
                        gson.fromJson(bodyString, JsonObject::class.java)
                    } catch (e: Exception) {
                        null
                    }

                    val uploadedCount = jsonResponse?.get("uploadedItemsCount")?.asInt
                        ?: (payload.callLogs.size + payload.conversations.sumOf { it.messages.size })

                    CloudUploadResult.Success(
                        uploadedItemsCount = uploadedCount,
                        serverTimestamp = payload.backupMetadata.syncTimestamp
                    )
                } else {
                    val errorMsg = when (response.code) {
                        401 -> "انتهت صلاحية جلسة تسجيل الدخول (رمز JWT غير صالح)"
                        403 -> "غير مصرح لك بالوصول إلى هذا الحساب"
                        else -> "خطأ من خادم الـ Backend (رمز ${response.code}): $bodyString"
                    }
                    CloudUploadResult.Failure(errorMsg, canRetry = response.code >= 500)
                }
            }
        } catch (e: IOException) {
            CloudUploadResult.Failure("تعذر الاتصال بخادم الـ Backend: ${e.localizedMessage}", canRetry = true)
        } catch (e: Exception) {
            CloudUploadResult.Failure("خطأ غير متوقع: ${e.localizedMessage}", canRetry = false)
        }
    }

    override suspend fun fetchCloudLastSyncTimestamp(): Long? = withContext(Dispatchers.IO) {
        val serverUrl = AppAuthManager.getServerUrl(context)
        val token = AppAuthManager.getAuthToken(context) ?: return@withContext null

        try {
            val request = Request.Builder()
                .url("$serverUrl/api/backup/latest")
                .header("Authorization", "Bearer $token")
                .get()
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val bodyString = response.body?.string().orEmpty()
                val jsonResponse = gson.fromJson(bodyString, JsonObject::class.java)
                jsonResponse.get("lastSyncTimestamp")?.asLong
            }
        } catch (e: Exception) {
            null
        }
    }
}
