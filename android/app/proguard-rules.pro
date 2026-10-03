# Proguard rules for Personal Cloud Backup
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.Dao *;
    @androidx.room.Entity *;
}
-keep class * extends androidx.room.RoomDatabase
-keep class com.personal.cloudbackup.model.** { *; }
-keep class com.personal.cloudbackup.data.local.** { *; }
-keep class com.google.gson.** { *; }

# OkHttp Rules
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn androidx.work.**
