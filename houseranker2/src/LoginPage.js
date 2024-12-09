// src/LoginPage.js
import "./App.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  facebookProvider,
} from "./firebase"; // Ensure FacebookAuthProvider is imported
import { setDoc, doc, getDoc } from "firebase/firestore"; // Firestore functions

// Google sign-in handler
const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    createUserData(user);
    console.log("User info:", user); // You can use this info in your app
  } catch (error) {
    console.error("Error during Google sign-in:", error);
  }
};

// Facebook sign-in handler
const handleFacebookSignIn = async () => {
   try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    createUserData(user);
    console.log("User info:", user); // You can use this info in your app
  } catch (error) {
    console.error("Error during Facebook sign-in:", error);
  }
};

const LoginPage = ({ setIsAuthenticated }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup
  const [showEmailForm, setShowEmailForm] = useState(false); // State to show/hide email login form

  return (
    <div>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {showEmailForm && (
        isLogin ? (
          <LoginForm setErrorMessage={setErrorMessage} setIsAuthenticated={setIsAuthenticated} />
        ) : (
          <SignUpForm setErrorMessage={setErrorMessage} />
        )
      )}

      <div className="signin-options">
        {!showEmailForm && (
          <button onClick={() => setShowEmailForm(true)}>Sign in with Email</button>
        )}
        <button onClick={handleGoogleSignIn}>Login with Google</button>
        <button onClick={handleFacebookSignIn}>Login with Facebook</button>
      </div>

      {showEmailForm && (
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setErrorMessage("");
          }}
          style={{ marginTop: "1rem" }}
        >
          {isLogin ? "Switch to Sign Up" : "Switch to Login"}
        </button>
      )}

      <Link to="/reset-password" style={{ display: "block", marginTop: "1rem" }}>
        Forgot/Reset Password?
      </Link>
    </div>
  );
};

// Login form component
const LoginForm = ({ setErrorMessage, setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear error on user input change
  const handleInputChange = (e) => {
    setErrorMessage("");
    const { name, value } = e.target;
    name === "email" ? setEmail(value) : setPassword(value);
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          name="email"
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          name="password"
          onChange={handleInputChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {loading && <Spinner />} {/* Show spinner if loading */}
    </div>
  );
};
const createUserData = async (user) => {
  const docRef = doc(db, "users", user.uid);
  const docSnapshot = await getDoc(docRef);
      
  if (!docSnapshot.exists()) {
    // Store additional user information in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date().toISOString(),
      tokens:{"pointsOfInterest":1, "entries":3}
    });
    await setDoc(doc(db, "users_entries", user.uid), {
      sliderValues: { Size: 0, Typology: 0, Price: 0, Coziness: 0 },
    });
  }
}
// Sign-up form component
const SignUpForm = ({ setErrorMessage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // State to track loading

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); // Show the spinner
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (userCredential) {
        createUserData(user);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setErrorMessage("");
      setLoading(false); // Hide the spinner
    }
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      {loading && <Spinner />} {/* Show spinner while loading */}
    </div>
  );
};

export default LoginPage;
