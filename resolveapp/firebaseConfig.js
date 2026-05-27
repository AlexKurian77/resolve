// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth,initializeAuth,getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "./firebase_env";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// Firestore
const db = getFirestore(app);

// Export
export { auth, db };