// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Verificar se deve usar emuladores
const shouldUseEmulator = import.meta.env.DEV && 
  window.location.hostname === 'localhost' && 
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Conectar aos emuladores apenas em desenvolvimento E se explicitamente habilitado
if (shouldUseEmulator) {
  // Evitar múltiplas conexões
  if (!window.__FIREBASE_EMULATOR_CONNECTED__) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('🔧 Conectado aos emuladores do Firebase');
    window.__FIREBASE_EMULATOR_CONNECTED__ = true;
  }
} else {
  console.log('🌐 Usando Firebase em produção');
}

// Declarar tipo global
declare global {
  interface Window {
    __FIREBASE_EMULATOR_CONNECTED__?: boolean;
  }
}

export default app;