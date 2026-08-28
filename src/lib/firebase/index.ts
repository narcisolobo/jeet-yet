import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "jeet-yet.firebaseapp.com",
  projectId: "jeet-yet",
  storageBucket: "jeet-yet.firebasestorage.app",
  messagingSenderId: "758018284737",
  appId: "1:758018284737:web:3e8ca7cf848176fcd74840",
  measurementId: "G-4LZ1MY9S5C",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
}

export { auth, db, functions, googleProvider, storage };
