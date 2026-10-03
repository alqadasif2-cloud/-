import JSZip from 'jszip';
import { ANDROID_SOURCE_FILES } from '../data/androidSourceFiles';

export async function generateAndDownloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Android Root Files
  zip.file('android/settings.gradle.kts', `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PersonalCloudBackup"
include(":app")
`);

  zip.file('android/build.gradle.kts', `plugins {
    id("com.android.application") version "8.3.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.23" apply false
    id("com.google.devtools.ksp") version "1.9.23-1.0.20" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
`);

  zip.file('android/gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`);

  // Add all project source files
  ANDROID_SOURCE_FILES.forEach(file => {
    if (file.path.startsWith('app/')) {
      zip.file('android/' + file.path, file.content);
    } else {
      zip.file(file.path, file.content);
    }
  });

  // Generate blob
  const content = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PersonalCloudBackup-Android-Kotlin.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
