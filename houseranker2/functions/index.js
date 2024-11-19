/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onDocumentWritten, onDocumentUpdated} = require("firebase-functions/v2/firestore");

const updateScore = (data) => {
  let score = data.score ? (data.score):();
  return score
}

exports.myfunction = onDocumentUpdated("users/{userId}", (event) => {
  // Retrieve the current and previous value
  const data = event.data.after.data();
  const previousData = event.data.before.data();

  // We'll only update if the name has changed.
  // This is crucial to prevent infinite loops.
  if (data.sliderValues != previousData.sliderValues ) {
    data.sliderValues.map((slider, i) => {
      if (slider != previousData.sliderValues[i])
      {
        const dif = slider - previousData.sliderValues[i];
      }
    });
  }
  else
  {

    return event.data.after.ref.set({
      Score: updateScore(data)
    }, {merge: true});
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
