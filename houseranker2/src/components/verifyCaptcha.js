// verifyCaptcha.js

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';  // Assuming you're using Firebase Functions
import { functions } from '../firebase'; // Make sure this imports your Firebase config
const GOOGLE_CAPTCHA_SITE_KEY_PROD = process.env.REACT_APP_GOOGLE_CAPTCHA_SITE_KEY_PROD;
// A utility function to check if the CAPTCHA has been completed and stored in sessionStorage
const isCaptchaVerified = () => {
    const captchaVerified = sessionStorage.getItem('captchaVerified');
    return captchaVerified === 'true'; // Returns true if CAPTCHA was verified in the current session
};

// A function to verify CAPTCHA on the backend (Firebase Functions or any backend)
const verifyCaptchaToken = async (token) => {
    try {
        const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
        const result = await verifyRecaptcha({ token });

        if (result.data.success) {
            sessionStorage.setItem('captchaVerified', 'true'); // Mark the session as verified
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error during CAPTCHA verification:', error);
        return false;
    }
};

// The main module hook for checking CAPTCHA
export const useCaptchaVerification = () => {
    const [captchaVerified, setCaptchaVerified] = useState(isCaptchaVerified()); // Initialize state based on session
    const grecaptcha = window.grecaptcha;  // Assuming you're using Google's reCAPTCHA
    console.log("grecaptcha:", window.grecaptcha);

    useEffect(() => {
        if (!captchaVerified) {
            // If CAPTCHA is not verified, execute CAPTCHA process
            const executeCaptcha = async () => {
                grecaptcha.ready(async () => {
                    try {
                        console.log("Site Key:", GOOGLE_CAPTCHA_SITE_KEY_PROD);
                        const token = await grecaptcha.execute("6LdV4L8qAAAAAFteRTJvwY1BgFR_PjmTeQNVrOvg", { action: 'login' });
                        if (!window.grecaptcha || !window.grecaptcha.execute) {
                            console.error("reCAPTCHA is not loaded yet.");
                            alert("CAPTCHA script not ready. Please try again later.");
                            return;
                        }

                        const isVerified = await verifyCaptchaToken(token);

                        if (isVerified) {
                            setCaptchaVerified(true);
                        } else {
                            alert('CAPTCHA verification failed. Please try again.');
                        }
                    } catch (error) {
                        console.error('Error executing CAPTCHA:', error);
                        alert('Something went wrong with CAPTCHA validation.');
                    }
                });
            };

            executeCaptcha();
        }
    }, [captchaVerified]);

    return captchaVerified;
};
