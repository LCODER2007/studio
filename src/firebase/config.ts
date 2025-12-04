// Firebase configuration using environment variables
// This allows for different configurations per environment (dev, staging, prod)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCuZq7jm4lMIFq-E6SxjpmkvkjEKMaphxM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-2819594368-36cb9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-2819594368-36cb9",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:110620089235:web:1ecf600b42c279b5aca666",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "110620089235",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Environment configuration
export const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

// Emulator configuration for local development
export const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
export const firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
