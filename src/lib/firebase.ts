import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCFK5dLawDm3fOf90hSlestu0KRx7dJA4",
  authDomain: "between-us-fcd44.firebaseapp.com",
  projectId: "between-us-fcd44",
  storageBucket: "between-us-fcd44.firebasestorage.app",
  messagingSenderId: "503538001510",
  appId: "1:503538001510:web:2a7b61eac002d882d7efa7",
  measurementId: "G-RENFHNPFH1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
