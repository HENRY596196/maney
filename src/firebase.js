import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project config
// You can get this from the Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyAHcuV7MUwOpgZOhsZluWjILRnrBBILSXY",
  authDomain: "maney-9d8c9.firebaseapp.com",
  projectId: "maney-9d8c9",
  storageBucket: "maney-9d8c9.firebasestorage.app",
  messagingSenderId: "636308210298",
  appId: "1:636308210298:web:7b11dbe7ef6146bbd171c3",
  measurementId: "G-P2V2MQS8W0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const db = getFirestore(app);

