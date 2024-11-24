// src/LoginPage.js
import "./App.css"
import React, { useState } from 'react';
import { Link  } from 'react-router-dom';
import Spinner from './Spinner';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "./firebase"; // Make sure your Firebase config is imported
import { setDoc, doc } from "firebase/firestore"; // Import Firestore functions


const LoginPage = ({setIsAuthenticated  }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup
  
    return (
      <div>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
  
        {isLogin ? (
          <LoginForm setErrorMessage={setErrorMessage} setIsAuthenticated={setIsAuthenticated} />
        ) : (
          <SignUpForm setErrorMessage={setErrorMessage} />
        )}
  
        <button onClick={() => {setIsLogin(!isLogin); setErrorMessage('')}}>
          {isLogin ? 'Switch to Sign Up' : 'Switch to Login'}
        </button>
        <Link to="/reset-password">Forgot/Reset Password?</Link>

      </div>
    );
  };


// Login form component
const LoginForm = ({ setErrorMessage, setIsAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        setErrorMessage('');
        const { name, value } = e.target;
        name === 'email' ? setEmail(value) : setPassword(value);
    };

    return (
        <div className="container" style={{ position: 'relative' }}>
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
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            {loading && <Spinner />} {/* Show spinner if loading */}
        </div>
    );
};
// Sign-up form component
const SignUpForm = ({ setErrorMessage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // State to track loading

  
    const handleSignUp = async (e) => {
      e.preventDefault();
      setLoading(true); // Show the spinner
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        if (userCredential) {
            // Store additional user information in Firestore
            await setDoc(doc(db, "users", user.uid), { // Set document with user's UID
              email: user.email,
              createdAt: new Date().toISOString(),
              entries:{},
              entriesStats:{"maxSize":null, "maxTypology":null, "minPrice":null},
              pointsOfInterest: {}
          });
          alert("User created: " + userCredential.user.email); // Display user email instead of the user object
        }
      } catch (error) {
        await signOut(auth)
        setErrorMessage(error.message);
      } finally {
        setErrorMessage('');
        setLoading(false); // Hide the spinner
      }
    };
  
    return (
        <div className="container" style={{ position: 'relative' }}>
            <form onSubmit={handleSignUp}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Sign Up</button>
            </form>
            {loading && <Spinner />} {/* Show spinner while loading */}
        </div>
    );
  };

export default LoginPage;
