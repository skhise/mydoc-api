import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

// Log Firebase configuration for debugging
console.log('🔥 Firebase Admin SDK Configuration:');
console.log('  Project ID:', serviceAccount.project_id);
console.log('  Client Email:', serviceAccount.client_email);
console.log('  Expected Sender ID (from google-services.json): 797229091241');

// Check if Firebase is already initialized to avoid re-initialization errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id, // Explicitly set project ID
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
} else {
  console.log('⚠️ Firebase Admin SDK already initialized');
}

export default admin;
