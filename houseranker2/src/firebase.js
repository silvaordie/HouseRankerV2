// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWyWRwJYUyTfHtb85rEL29g1_AK9RfDWg",
  authDomain: "housepickerv2.firebaseapp.com",
  projectId: "housepickerv2",
  storageBucket: "housepickerv2.firebasestorage.app",
  messagingSenderId: "891340696969",
  appId: "1:891340696969:web:eafbabd1c1815f974f0558",
  measurementId: "G-ZQVS3CK4NE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore and export it
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const functions = getFunctions(app);

if (  process.env.NODE_ENV === "development" ) 
{
  try {
    console.log("Connecting to Firebase emulators...");
    functions.useEmulator("localhost", 5001); // Replace 5001 with the correct emulator port
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
  } catch (e) {
    console.error("Failed to connect to Firebase emulators:", e);
  }
}

export { httpsCallable, functions, db, auth, app, googleProvider, facebookProvider, signInWithPopup };
