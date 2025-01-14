// src/LoginPage.js
import "./App.css"; // Ensure this file contains the new styles for the landing page
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  auth,
  db,
  googleProvider,
  facebookProvider,
} from "./firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";

const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    createUserData(user);
    console.log("User info:", user);
  } catch (error) {
    console.error("Error during Google sign-in:", error);
  }
};

const handleFacebookSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    createUserData(user);
    console.log("User info:", user);
  } catch (error) {
    console.error("Error during Facebook sign-in:", error);
  }
};

const LoginPage = () => {
  return (
    <div className="landing-page">
      {/* Left Section */}
      <div className="landing-left">
        <h1 className="homefinder-title">
          <span className="home-text">Home</span>Finder
        </h1>
        <p className="landing-paragraph">
          Welcome to HomeFinder! Discover the best places, explore options, and find your next home with ease.
        </p>
        {/* Bar with 3 items */}
        <div className="items-bar">
          <div className="item">
            <i className="fas fa-search item-icon"></i> {/* Example icon: Search */}
            <h3>Discover</h3>
            <p>Explore various locations and homes at your fingertips.</p>
          </div>
          <div className="item">
            <i className="fas fa-compass item-icon"></i> {/* Example icon: Compass */}
            <h3>Compare</h3>
            <p>Compare options based on your preferences and needs.</p>
          </div>
          <div className="item">
            <i className="fas fa-heart item-icon"></i> {/* Example icon: Heart */}
            <h3>Save</h3>
            <p>Save your favorite homes and locations for easy access.</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="landing-right">
        <h2>Login</h2>
        <div className="signin-options">
          <button className="signin-button" onClick={handleGoogleSignIn}>
            <img src="google-icon.png" alt="Google" className="icon" />
            Login with Google
          </button>
          <button className="signin-button" onClick={handleFacebookSignIn}>
            <img src="facebook-icon.png" alt="Facebook" className="icon" />
            Login with Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

const createUserData = async (user) => {
  const docRef = doc(db, "users", user.uid);
  const docSnapshot = await getDoc(docRef);

  if (!docSnapshot.exists()) {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date().toISOString(),
      tokens: { pointsOfInterest: 1, entries: 3 },
    });
    await setDoc(doc(db, "users_entries", user.uid), {
      sliderValues: { Size: 0, Typology: 0, Price: 0, Coziness: 0 },
    });
  }
};

export default LoginPage;

