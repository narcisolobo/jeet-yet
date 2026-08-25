import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

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
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
