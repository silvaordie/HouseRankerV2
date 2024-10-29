// ResetPassword.js
import React, { useState } from 'react';
import Spinner from './Spinner';

import "./App.css"

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // State to track loading

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        try {
            const response = await fetch('https://http://localhost:5000/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setMessage('Check your email for the reset code!');
            } else {
                setMessage('Error sending reset email.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        }finally{
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                />
                <button type="submit">Send Reset Code</button>
            </form>
            {message && <p>{message}</p>}
            {loading && <Spinner />} {/* Show spinner while loading */}
        </div>
    );
};

export default ResetPassword;
