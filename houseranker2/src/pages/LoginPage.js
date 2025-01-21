import "../App.css"; // Ensure this file contains the new styles for the landing page
import React, { useState, useRef, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { functions, httpsCallable, auth, db, googleProvider, facebookProvider } from "../firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useCaptchaVerification } from "../components/verifyCaptcha";

const LoginPage = () => {
  const [loading, setLoading] = useState(false); // To manage loading state
  const captchaVerified = useCaptchaVerification();

  useEffect(() => {
    if (!captchaVerified) {
      // If the CAPTCHA is not verified, you might want to display a loading indicator
      // or something that tells the user that CAPTCHA is being validated.
      console.log('Verifying CAPTCHA...');
    }
  }, [captchaVerified]);

  if (!captchaVerified) {
    // You can show a loading screen or a message here while CAPTCHA is being verified
    return <div>Verifying CAPTCHA...</div>;
  }
  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      try {
        // Proceed with Google Sign-In
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Create user data if not already created
        createUserData(user);
        console.log("User info:", user);
      } catch (error) {
        if (error.code === "auth/popup-closed-by-user") {
          alert("The sign-in popup was closed. Please try again.");
        } else {
          console.error("Error during Google sign-in:", error);
          alert("Something went wrong during login.");
        }
      }

    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("Something went wrong during login.");
    } finally {
      setLoading(false);
    }
  };

  // Handle the Facebook Sign-in logic
  const handleFacebookSignIn = async () => {
    if (!captchaVerified) {
      alert("Please complete the CAPTCHA.");
      return;
    }
    try {
      setLoading(true); // Start loading indicator
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      createUserData(user);
      console.log("User info:", user);
      setLoading(false); // Stop loading indicator
    } catch (error) {
      console.error("Error during Facebook sign-in:", error);
      setLoading(false); // Stop loading indicator
    }
  };

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
            <i className="fas fa-search item-icon"></i>
            <h3>Discover</h3>
            <p>Find houses and apartments that fit the criteria you are looking for.</p>
          </div>
          <div className="item">
            <i className="fas fa-compass item-icon"></i>
            <h3>Plan ahead</h3>
            <p>Plan how long it will take to commute to the Interest Points in your daily routine.</p>
          </div>
          <div className="item">
            <i className="fas fa-heart item-icon"></i>
            <h3>Find the best</h3>
            <p>We showcase you the best houses based on how important every detail regarding your next house is.</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="landing-right">
        <h2>Login</h2>
        <div className="signin-options">
          <button
            className="signin-button"
            onClick={handleGoogleSignIn}
            disabled={loading} // Disable while loading
          >
            <img src="google-icon.png" alt="Google" className="icon" />
            Login with Google
          </button>
          <button
            className="signin-button"
            onClick={handleFacebookSignIn}
            disabled={loading} // Disable while loading
          >
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
