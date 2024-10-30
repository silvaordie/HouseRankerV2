// src/LoginPage.js
import "./App.css"
import React, { useState } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import Spinner from './Spinner';

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
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and expiration time
                localStorage.setItem('token', data.token);
                localStorage.setItem('tokenExpiration', Date.now() + data.expiresIn * 1000); // Set expiration

                setIsAuthenticated(true); // Update auth state
                navigate('/dashboard'); // Redirect to dashboard
            } else {
                setErrorMessage(data.message || 'Login failed');
                setIsAuthenticated(false);
            }
        } catch (error) {
            setErrorMessage('Error connecting to the server');
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
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
  
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          setErrorMessage('');
        } else {
          setErrorMessage(data.message);
        }
      } catch (error) {
        setErrorMessage('Error connecting to the server');
      } finally {
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
