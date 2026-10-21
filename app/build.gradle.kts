plugins {
    id("com.android.application")
}

val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "de.libero91.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "de.libero91.app"
        minSdk = 26
        targetSdk = 34
        versionCode = buildNumber
        versionName = "0.$buildNumber"
    }

    signingConfigs {
        create("hobby") {
            storeFile = rootProject.file("signing/libero91.jks")
            storePassword = "libero91"
            keyAlias = "libero91"
            keyPassword = "libero91"
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("hobby")
        }
        getByName("debug") {
            signingConfig = signingConfigs.getByName("hobby")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
