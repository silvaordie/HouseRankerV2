/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const functions = require("firebase-functions")
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(String(process.env.STRIPE_SECRET_KEY));

// Initialize the Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

const recalculateMaxsAndStats = async (userId, field) => {
  const entriesSnap = await db.collection(`users_entries/${userId}/entries`).get();

  const newMaxs = {};
  const newStats = {};
  const maxConverter = { "Size": -1, "Typology": -1, "Price": 1 }; // Adjustable logic

  entriesSnap.forEach((doc) => {
    const entry = doc.data();
    if (entry[field] !== undefined) {
      const convertedValue = entry[field] * maxConverter[field];

      // Update maximum
      if (newMaxs[field] === undefined || convertedValue > newMaxs[field] * maxConverter[field]) {
        newMaxs[field] = entry[field];
      }

      // Update minimum
      if (newStats[field] === undefined || convertedValue < newStats[field] * maxConverter[field]) {
        newStats[field] = entry[field];
      }
    }
  });

  const userDocRef = db.collection("users_entries").doc(userId);
  await userDocRef.set({ maxs: newMaxs, stats: newStats }, { merge: true });

  console.log(`Recalculated maxs and stats for userId ${userId}:`, { newMaxs, newStats });
};


exports.myfunction = onDocumentWritten("users_entries/{userId}/entries/{entryId}", async (event) => {
  const previousData = event.data.before ? event.data.before.data() : null;
  const data = event.data.after ? event.data.after.data() : null;
  const maxConverter = { "Size": -1, "Typology": -1, "Price": 1 }
  let changed = false;
  let userData;
  let userDocRef

  if (!data) {
    userDocRef = db.collection("users_entries").doc(event.params.userId);
    const userDoc = await userDocRef.get(); // Admin SDK uses `.get()` instead of `getDoc`
    userData = userDoc.data();

    for (const [field, value] of Object.entries(previousData)) {
      if (previousData[field] === userData.stats[field] || previousData[field] === userData.maxs[field]) {
        recalculateMaxsAndStats(event.params.userId, field);
      }
    }
    return;
  }

  for (const [field, value] of Object.entries(data)) {
    if ((!previousData || value !== previousData[field]) && (field !== "Address" && field !== "Link" && field !== "Description")) {
        if (!changed) {
            changed = true;
            userDocRef = db.collection("users_entries").doc(event.params.userId);
            const userDoc = await userDocRef.get();
            userData = userDoc.data() || {};
            userData.maxs = userData.maxs || {};
            userData.stats = userData.stats || {};
        }

        console.log("Value has changed:", field, value);

        const currentMax = userData.maxs[field] !== undefined ? userData.maxs[field] * maxConverter[field] : -Infinity;
        const currentStat = userData.stats[field] !== undefined ? userData.stats[field] * maxConverter[field] : Infinity;

        if (value * maxConverter[field] > currentMax) {
            const newMaxs = { [field]: value };
            await userDocRef.set({ maxs: newMaxs }, { merge: true });
            console.log("Updated maxs:", newMaxs);
        } else if (value * maxConverter[field] < currentStat) {
            const newBests = { [field]: value };
            await userDocRef.set({ stats: newBests }, { merge: true });
            console.log("Updated stats:", newBests);
        } else if (previousData && (previousData[field] === userData.stats[field] || previousData[field] === userData.maxs[field])) {
            recalculateMaxsAndStats(event.params.userId, field);
        }
    }
  }
});

exports.calculateDistance = functions.https.onCall(async (data, context) => {
  try {

    const { entryId, poiId } = data.data; // Get data passed from the front-end
    // Validate inputs
    if (!entryId || !poiId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Both entryId and poiId are required.'
      );
    }
    // Example: Simulated calculation of distances
    const response = {
      walking: Math.floor(Math.random() * 45),
      car: Math.floor(Math.random() * 45),
      transport: Math.floor(Math.random() * 45)
    };

    // Return response
    return response;
  } catch (error) {
    console.error(error.message);
    throw new functions.https.HttpsError('internal', 'An error occurred while calculating distances.');
  }
});

exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send({ error: "Only POST requests are allowed." });
      }

      const { amount, uid } = req.body;

      if (!amount || typeof amount !== "number") {
        return res.status(400).send({ error: "Invalid or missing amount." });
      }

      // Set a timeout to prevent the request from hanging too long
      const timeout = 10000; // Timeout in milliseconds (10 seconds)
      const stripeCall = stripe.paymentIntents.create({
        amount: amount,
        currency: "chf",
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId: uid, // Replace with actual user ID
        },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request Timeout')), timeout)
      );

      const paymentIntent = await Promise.race([stripeCall, timeoutPromise]);

      res.status(200).send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating Payment Intent:", error.message);
      res.status(500).send({ error: `Internal Server Error: ${error.message}` });
    }
});

exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = "whsec_bd46jDBRQC0NKP5Au0cxJRQRaA54SK1A"; // Set this in your Stripe dashboard
  const tokens = {2050:{"pointsOfInterest":3, "entries":25}, 1550:{"pointsOfInterest":3, "entries":15}, 750:{"pointsOfInterest":0, "entries":10} };
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // Extract custom metadata or fields to identify the user
    const userId = paymentIntent.metadata.userId; // Example metadata
    const amount = paymentIntent.amount;
    try {
      const userDocRef = admin.firestore().collection("users").doc(userId);
      const userDoc = userDocRef.get()
      const data = (await userDoc).data()

      const newEntries = (data.tokens.entries || 0) + tokens[amount]["entries"];
      const newPointsOfInterest = (data.tokens.pointsOfInterest || 0) + tokens[amount]["pointsOfInterest"];
      
      await userDocRef.set({
        tokens: {
          entries: newEntries,
          pointsOfInterest: newPointsOfInterest
        }},{merge:true}
      );
    } catch (error) {
      console.error("Firestore update error:", error.message);
    }
  }

  // Acknowledge receipt of the event
  res.status(200).send("Webhook received");
});
/*try {
  const docRef = db.collection(collectionName).doc(docId);
  const docSnapshot = await docRef.get();

  if (docSnapshot.exists) {
    return { success: true, data: docSnapshot.data() };
  } else {
    return { success: false, error: "Document not found" };
  }
} catch (error) {
  console.error("Error fetching data:", error.message);
  return { success: false, error: error.message };
}*/



// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
