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

// Initialize the Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

const recalculateMaxsAndStats = async (userId, field) => {
  const entriesSnap = await db.collection(`users_entries/${userId}/entries`).get();

  const newMaxs = {};
  const newStats = {};

  entriesSnap.forEach((doc) => {

    const entry = doc.data();
    if (entry[field] !== undefined) {
      // Update maximum
      newMaxs[field] = Math.max(newMaxs[field] || 0, entry[field]);

      // Update minimum
      if (newStats[field] === undefined) {
        newStats[field] = entry[field];
      } else {
        newStats[field] = Math.min(newStats[field], entry[field]);
      }
    }
  });

  const userDocRef = db.collection("users_entries").doc(userId);
  await userDocRef.set({ maxs: newMaxs, stats: newStats }, { merge: true });

  console.log(`Recalculated maxs (set) and stats for userId ${userId}:`, { newMaxs, newStats });
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

    if ((!previousData || value !== previousData[field]) && (field !== "Coziness" && field !== "Address" && field !== "Link" && field !== "Description") && data) {
      if (!changed) {
        changed = true;
        userDocRef = db.collection("users_entries").doc(event.params.userId);
        const userDoc = await userDocRef.get(); // Admin SDK uses `.get()` instead of `getDoc`

        userData = userDoc.data();
      }
      console.log("Value has changed:", field, value);

      if (value * maxConverter[field] > (userData.maxs[field] * maxConverter[field])) {
        const newMaxs = {};
        newMaxs[field] = value;
        await userDocRef.set({ maxs: newMaxs }, { merge: true });
        console.log("Updated maxs:", newMaxs);
      }
      else {

        if (value * maxConverter[field] < userData.stats[field] * maxConverter[field]) {
          const newBests = {};
          newBests[field] = value;
          await userDocRef.set({ stats: newBests }, { merge: true });
          console.log("Updated maxs:", newBests);
        }
        else {
          if (previousData && (previousData[field] === userData.stats[field] || previousData[field] === userData.maxs[field]))
            recalculateMaxsAndStats(event.params.userId, field);
        }
      }
    }
  }
});

exports.calculateDistance = functions.https.onCall(async (data, context) => {
  // Enable CORS
  return new Promise((resolve, reject) => {
    cors((req, res) => {
      try {
        const { entryId, poiId } = data;

        // Validate inputs
        if (!entryId || !poiId) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Both entryId and poiId are required.'
          );
        }

        // Example: Simulated calculation of distances
        const response = {
          walking: 233,
          car: 244,
          transport: 255,
        };

        // Resolve the Promise with the response (this sends it back to the client)
        resolve(response);
      } catch (error) {
        console.error(error.message);
        reject(new functions.https.HttpsError('internal', 'An error occurred while calculating distances.'));
      }
    })(data, context); // Pass the data and context to CORS middleware
  });
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
