import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import CheckoutPage from "./CheckoutPage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchParams } from "react-router-dom";

if (process.env.REACT_APP_STRIPE_PUBLIC_KEY === undefined) {
  throw new Error("REACT_APP_STRIPE_PUBLIC_KEY is not defined");
}
const stripePromise = loadStripe(String(process.env.REACT_APP_STRIPE_PUBLIC_KEY));
function SelectPlan() {
  const [selectedPlan, setSelectedPlan] = useState("2-tier");
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status"); // 'succeeded' or 'failed'
    if (redirectStatus) {
      setPaymentStatus(redirectStatus);
    }
  }, [searchParams]);


  const prices = {"1-tier": 7.5, "2-tier": 15.5, "3-tier": 20.5}
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
    <div style={styles.page}>
      <h1>Select Your Plan</h1>
      <div style={styles.cardContainer}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              ...styles.card,
              ...(selectedPlan === plan.id ? styles.selectedCard : {}),
            }}
            onClick={() => handleSelect(plan.id)}
          >
            <h2>{plan.title}</h2>
            <ul>
              {plan.description.map((desc, index) => (
                <li key={index}>{desc}</li>
              ))}
            </ul>
            <Typography variant="h6">{prices[plan.id] + "$"}</Typography>

          </div>
        ))}
      </div>
      {paymentStatus === "succeeded" && (
        <div style={{ color: "green" }}>
          <p>🎉 Your payment was successful! Thank you for your purchase.</p>
        </div>
      )}
      {paymentStatus === "failed" && (
        <div style={{ color: "red" }}>
          <p>⚠️ Payment failed. Please try again.</p>
        </div>
      )}
      <Elements
        stripe={stripePromise}
        options={{
          mode: "payment",
          amount: prices[selectedPlan]*100,
          currency: "chf",
        }}
      >
        <CheckoutPage amount={prices[selectedPlan]*100} />
        <button onClick={() => (window.location.href = "/dashboard")}>
        Return to Dashboard
      </button>
      </Elements>
    </div>
  );
}

const styles = {
  page: {
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    border: "2px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    width: "200px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
  },
  selectedCard: {
    borderColor: "#007bff",
    transform: "scale(1.05)",
  },
  selectButton: {
    marginTop: "10px",
    padding: "10px 15px",
    backgroundColor: "#ddd",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.2s, color 0.2s",
  },
  selectedButton: {
    backgroundColor: "#007bff",
    color: "#fff",
  },
};

export default SelectPlan;
