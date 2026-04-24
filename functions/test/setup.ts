// Firebase Admin requires these env vars when running outside of a real project.
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'adsmart-test'
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
