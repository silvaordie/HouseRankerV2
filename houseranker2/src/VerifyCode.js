// VerifyCode.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import "./App.css"
const VerifyCode = () => {
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [isCodeValid, setIsCodeValid] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('https://your-backend-endpoint.com/verify-code', {
                method: 'POST',
                body: JSON.stringify({ code }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setIsCodeValid(true);
                setMessage('Code is valid. You can now reset your password.');
            } else {
                setMessage('Invalid code. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            <h2>Verify Code</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the code"
                    required
                />
                <button type="submit">Verify Code</button>
            </form>
            {message && <p>{message}</p>}
            {isCodeValid && <Link to="/change-password">Proceed to Change Password</Link>}
        </div>
    );
};

export default VerifyCode;
