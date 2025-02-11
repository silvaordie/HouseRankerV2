import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

// Add environment configuration
const USE_EMULATOR = true; // Toggle this to switch between prod/emulator
const EMULATOR_HOST = 'http://localhost';
const EMULATOR_AUTH_PORT = 9099;

const firebaseConfig = {
  apiKey: "AIzaSyAWyWRwJYUyTfHtb85rEL29g1_AK9RfDWg",
  authDomain: "housepickerv2.firebaseapp.com",
  projectId: "housepickerv2",
  storageBucket: "housepickerv2.firebasestorage.app",
  messagingSenderId: "891340696969",
  appId: "1:891340696969:web:eafbabd1c1815f974f0558",
  measurementId: "G-ZQVS3CK4NE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to emulator if enabled
if (USE_EMULATOR) {
    connectAuthEmulator(auth, `${EMULATOR_HOST}:${EMULATOR_AUTH_PORT}`, { disableWarnings: true });
    debugLog('Connected to Auth emulator');
}

const provider = new GoogleAuthProvider();

// Add this after Firebase initialization
provider.setCustomParameters({
    prompt: 'select_account',
    // Add auth domain for the extension
    auth_domain: 'housepicker-extension-auth.web.app'
});

// Get allowed parent origin
const PARENT_ORIGIN = document.location.ancestorOrigins[0] || '*';

// Add console logging helper
function debugLog(message, data = null) {
  console.log(`[Firebase Auth] ${message}`, data);
}

// Ensure we're running in the correct context
debugLog('Auth page loaded', { 
  location: window.location.href,
  parent: document.location.ancestorOrigins[0]
});

function formatAuthResponse(result) {
  return {
    type: 'AUTH_RESPONSE',
    user: {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    },
    credential: {
      accessToken: result.credential?.accessToken,
      idToken: result.credential?.idToken
    },
    environment: USE_EMULATOR ? 'emulator' : 'production'
  };
}

// Update error handling to be more verbose
function handleAuthError(error) {
  debugLog('Auth error details:', error);
  return {
    type: 'AUTH_RESPONSE',
    error: {
      code: error.code,
      message: error.message,
      details: error.customData?.message || error.toString()
    }
  };
}

// Modified sendMessageToParent function with logging and error handling
function sendMessageToParent(data) {
  try {
    debugLog('Sending message to parent:', {
      data: data,
      targetOrigin: PARENT_ORIGIN
    });
    
    // Ensure data is properly structured
    const message = {
      ...data,
      timestamp: Date.now()
    };
    
    window.parent.postMessage(message, PARENT_ORIGIN);
  } catch (e) {
    console.error('Error sending message:', e);
    // Send error response
    window.parent.postMessage({
      type: 'AUTH_RESPONSE',
      error: {
        code: 'MESSAGE_ERROR',
        message: e.message
      },
      timestamp: Date.now()
    }, PARENT_ORIGIN);
  }
}

// Handle incoming messages
window.addEventListener('message', async (event) => {
  try {
    debugLog('Received message:', {
      data: event.data,
      origin: event.origin,
      source: event.source ? 'window' : 'unknown'
    });

    const message = event.data;

    if (message.type === 'PING') {
      debugLog('Received PING, sending PONG');
      sendMessageToParent({ type: 'PONG' });
      return;
    }

    if (message.type === 'INIT_AUTH' || message.initAuth) {
      debugLog('Starting auth process');
      try {
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        const result = await signInWithPopup(auth, provider);
        sendMessageToParent(formatAuthResponse(result));
      } catch (error) {
        debugLog('Auth error:', error);
        sendMessageToParent(handleAuthError(error));
      }
    }
  } catch (e) {
    console.error('Message handling error:', e);
    sendMessageToParent({
      type: 'AUTH_RESPONSE',
      error: {
        code: 'MESSAGE_HANDLING_ERROR',
        message: e.message
      }
    });
  }
});

// Send ready message when loaded
debugLog('Sending ready message');
sendMessageToParent({ 
    type: 'AUTH_PAGE_READY',
    environment: USE_EMULATOR ? 'emulator' : 'production'
});