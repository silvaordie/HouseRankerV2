import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import CheckoutPage from "./CheckoutPage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchParams } from "react-router-dom";
import "./SelectPlan.css"; // Import the CSS file
import { useCaptchaVerification } from "../components/verifyCaptcha";

if (process.env.REACT_APP_STRIPE_PUBLIC_KEY === undefined) {
  throw new Error("REACT_APP_STRIPE_PUBLIC_KEY is not defined");
}
const stripePromise = loadStripe(String(process.env.REACT_APP_STRIPE_PUBLIC_KEY));
function SelectPlan() {
  const [selectedPlan, setSelectedPlan] = useState("2-tier");
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const captchaVerified = useCaptchaVerification();

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status"); // 'succeeded' or 'failed'
    if (redirectStatus) {
      setPaymentStatus(redirectStatus);
    }
  }, [searchParams]);

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

  const prices = { "1-tier": 7.5, "2-tier": 15.5, "3-tier": 20.5 }
  const plans = [
    {
      id: "1-tier",
      title: "1-Tier",
      description: ["+10 House entries"],
    },
    {
      id: "2-tier",
      title: "2-Tier",
      description: ["+3 Points of Interest", "+15 House entries",],
    },
    {
      id: "3-tier",
      title: "3-Tier",
      description: ["+3 Points of interest", "+25 House entries"],
    },
  ];

  const handleSelect = (id) => {
    setSelectedPlan(id);
  };

  return (
    <div className="page">
      {/* Left Side: Plan Selection */}
      <div className="left-panel">
        <h1>Select Your Plan</h1>
        <div className="card-container">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card ${selectedPlan === plan.id ? "selected-card" : ""}`}
              onClick={() => handleSelect(plan.id)}
            >
              <div className="card-content">
                <div className="plan-description">
                  <h2>{plan.title}</h2>
                  <ul>
                    {plan.description.map((desc, index) => (
                      <li key={index}>{desc}</li>
                    ))}
                  </ul>
                </div>
                <div className="plan-price">{prices[plan.id] + "$"}</div>
              </div>
            </div>
          ))}
        </div>
        {paymentStatus === "succeeded" && (
          <div className="payment-success">
            <p>🎉 Your payment was successful! Thank you for your purchase.</p>
          </div>
        )}
        {paymentStatus === "failed" && (
          <div className="payment-failed">
            <p>⚠️ Payment failed. Please try again.</p>
          </div>
        )}
      </div>

      {/* Right Side: CheckoutPage */}
      <div className="right-panel">
        <Elements
          stripe={stripePromise}
          options={{
            mode: "payment",
            amount: prices[selectedPlan] * 100,
            currency: "chf",
          }}
        >
          <CheckoutPage amount={prices[selectedPlan] * 100} />
        </Elements>
      </div>
    </div>
  );
}

export default SelectPlan;
