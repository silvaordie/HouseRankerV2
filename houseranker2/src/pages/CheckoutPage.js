import React, { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useAuth } from "../AuthContext";
import "./SelectPlan.css"; // Import the CSS file
import { functions, httpsCallable } from '../firebase';

const CheckoutPage = (amount) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      const amount_value = amount.amount;
      setClientSecret(null);
  
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
  
      createPaymentIntent({
        amount: amount_value,
        uid: currentUser.uid,
      })
        .then((result) => {
          setClientSecret(result.data); // Set the client secret received from the callable function
        })
        .catch((error) => {
          console.error('Error calling createPaymentIntent:', error);
        });
    }
  }, [amount]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(submitError.message);
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: process.env.REACT_APP_ENV == "PROD" ? `https://housepickerv2.web.app/select-plan` : `http://localhost:3000/select-plan`,
      },
    });

    if (error) {
      // This point is only reached if there's an immediate error when
      // confirming the payment. Show the error to your customer (for example, payment details incomplete)
      setErrorMessage(error.message);
    } else {
      // The payment UI automatically closes with a success animation.
      // Your customer is redirected to your `return_url`.
    }

    setLoading(false);
  };

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="return-button"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const paymentElementOptions = {
    layout: "accordion"
  }

  return (
    <>
      <form className="checkout-wrapper" id="payment-form" onSubmit={handleSubmit}>
        <PaymentElement id="payment-element" options={paymentElementOptions} />
        <div className="buttons">
          <button className="return-button" disabled={!stripe || !elements} id="submit">
            <span id="button-text">
              {"Pay now"}
            </span>
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="return-button"
          >
            Return to Dashboard
          </button>
        </div>
      </form>

    </>
  );
};

export default CheckoutPage;