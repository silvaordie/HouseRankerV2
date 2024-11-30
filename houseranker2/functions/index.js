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

// Initialize the Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

const recalculateMaxsAndStats = async (userId, field) => {
  const entriesSnap = await db.collection(`users_entries/${userId}/entries`).get();

  const newMaxs = {};
  const newStats = {};
  
  entriesSnap.forEach((doc) => {

    const entry = doc.data();
      if (entry.info[field] !== undefined) {
        // Update maximum
        newMaxs[field] = Math.max(newMaxs[field] || 0, entry.info[field]);

        // Update minimum
        if (newStats[field] === undefined) {
          newStats[field] = entry.info[field];
        } else {
          newStats[field] = Math.min(newStats[field], entry.info[field]);
        }
      }
  });

  const userDocRef = db.collection("users_entries").doc(userId);
  await userDocRef.set({ maxs: newMaxs, stats: newStats }, {merge:true});

  console.log(`Recalculated maxs (set) and stats for userId ${userId}:`, { newMaxs, newStats });
};

exports.myfunction = onDocumentWritten("users_entries/{userId}/entries/{entryId}", async (event) => {
  const previousData = event.data.before ? event.data.before.data() : null;
  const data = event.data.after ? event.data.after.data() : null;
  const maxConverter = {"Size":-1, "Typology":-1, "Price":1, "Coziness":-1}
  let changed = false;
  let userData;
  let userDocRef
  const newScores = {};

  if(!data)
  {
    userDocRef = db.collection("users_entries").doc(event.params.userId);
    const userDoc = await userDocRef.get(); // Admin SDK uses `.get()` instead of `getDoc`
    userData = userDoc.data();

    for (const [field, value] of Object.entries(previousData.info)) {
      if(previousData.info[field] === userData.stats[field] || previousData.info[field] === userData.maxs[field])
      {
        recalculateMaxsAndStats(event.params.userId, field);
      }
    }
    return;
  }
 
  for (const [field, value] of Object.entries(data.info)) {

      if ((!previousData || value !== previousData.info[field]) && (field !== "Address" && field !== "Link" && field !== "Description") && data ) {
      
        if (!changed) {
          changed = true;
          userDocRef = db.collection("users_entries").doc(event.params.userId);
          const userDoc = await userDocRef.get(); // Admin SDK uses `.get()` instead of `getDoc`
          
          userData = userDoc.data();
        }
        console.log("Value has changed:", field, value);
        
          if (value*maxConverter[field] > (userData.maxs[field]*maxConverter[field])) {
            const newMaxs = {};
            newMaxs[field] = value;
            await userDocRef.set({ maxs: newMaxs }, {merge:true});
            console.log("Updated maxs:", newMaxs);
          }
          else{
  
            if(value*maxConverter[field] < userData.stats[field]*maxConverter[field])
            {
              const newBests = {};
              newBests[field] = value;
              await userDocRef.set({ stats: newBests }, {merge:true});
              console.log("Updated maxs:", newBests);              
            }
            else
            {
              if(previousData && (previousData.info[field] === userData.stats[field] || previousData.info[field] === userData.maxs[field]))
                recalculateMaxsAndStats(event.params.userId, field);
            }
          }
          newScores[field] = value;
      }
  }
  if(changed)
  {
    await event.data.after.ref.set({
      scores: newScores
    }, { merge: true });
  }
});



// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
