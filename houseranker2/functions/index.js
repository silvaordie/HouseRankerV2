/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onDocumentWritten, onDocumentUpdated} = require("firebase-functions/v2/firestore");

exports.myfunction = onDocumentUpdated("users_entries/{userId}/{entryId}", (event) => {
  // Retrieve the current and previous value
  const data = event.data.after.data();
  const previousData = event.data.before.data();

  // We'll only update if the name has changed.
  // This is crucial to prevent infinite loops.

  if (data.info != previousData.info ) {
    Object.entries(data.info).map(async function ([field, value], index) {
      if (value != previousData.info[field]) {
        const userDocRef = doc(db, "users", event.params.userId); // Reference to the user's document
        const userDoc = await getDoc(userDocRef); // Fetch the document
        const userData = userDoc.data();
        const newScores = userData.scores;
        if (value > userData.maxs[index]) {
          const newMaxs = [...userData.maxs];
          newMaxs[index] = value;
          await updateDoc(userDocRef, { "maxs": newMaxs });
        }

        newScores[field] = value * userData.maxs[index];

        return event.data.after.ref.set({
          scores: newScores
        }, { merge: true });
      }
    });
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
