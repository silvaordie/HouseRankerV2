// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app); // Initialize Firestore and export it

export { auth };
