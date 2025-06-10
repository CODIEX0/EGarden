import 'dotenv/config';

export default {
  expo: {
    name: "eGarden",
    slug: "egarden",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2E7D32"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.egarden.app",
      buildNumber: "1",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to take photos of your plants for identification and care tracking.",
        NSPhotoLibraryUsageDescription: "This app accesses your photo library to select plant images for identification and sharing.",
        NSLocationWhenInUseUsageDescription: "This app uses location to provide weather information and find local garden centers.",
        NSFaceIDUsageDescription: "Use Face ID to securely access your garden data."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#2E7D32"
      },
      package: "com.egarden.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "USE_FINGERPRINT",
        "USE_BIOMETRIC",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow eGarden to access your photos to upload plant images.",
          cameraPermission: "Allow eGarden to access your camera to take plant photos."
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow eGarden to use your location to provide weather and local garden center information."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#2E7D32",
          sounds: ["./assets/notification.wav"]
        }
      ],
      [
        "expo-secure-store",
        {}
      ],
      [
        "expo-font",
        {
          fonts: ["./assets/fonts/Roboto-Regular.ttf"]
        }
      ]
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "your-project-id"
      },
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      },
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      plantNetApiKey: process.env.PLANTNET_API_KEY,
      openAiApiKey: process.env.OPENAI_API_KEY
    },
    hooks: {
      postPublish: [
        {
          file: "sentry-expo/upload-sourcemaps",
          config: {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN
          }
        }
      ]
    },
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 10000
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};
