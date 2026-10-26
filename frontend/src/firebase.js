import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9GjG_aXquvohUZC0riXHiTLsLH2_ILmY",
  authDomain: "food-delivery-app-cf3cd.firebaseapp.com",
  projectId: "food-delivery-app-cf3cd",
  storageBucket: "food-delivery-app-cf3cd.firebasestorage.app",
  messagingSenderId: "610045899720",
  appId: "1:610045899720:web:486dbf5d38340617a8c6fd",
  measurementId: "G-T937BSSCKT"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// NOTE: Firestore (db) is intentionally NOT exported here.
// The frontend must NOT access the database directly.
// All data operations go through the FastAPI backend via /frontend/src/services/api.js
