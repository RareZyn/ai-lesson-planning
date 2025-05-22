// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
console.log("API KEY:", process.env.REACT_APP_FIREBASE_API_KEY);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Add additional Google scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { 
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
};