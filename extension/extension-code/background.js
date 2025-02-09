// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { exportListingToFirestore } from '/services/firebase-handler.js';  // Update path

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAWyWRwJYUyTfHtb85rEL29g1_AK9RfDWg",
    authDomain: "housepickerv2.firebaseapp.com",
    projectId: "housepickerv2",
    storageBucket: "housepickerv2.firebasestorage.app",
    messagingSenderId: "891340696969",
    appId: "1:891340696969:web:eafbabd1c1815f974f0558",
    measurementId: "G-ZQVS3CK4NE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Export functions for use in other parts of the extension
export { auth, db };

chrome.runtime.onInstalled.addListener(() => {
    console.log('Property Scraper Extension installed');
});

let creatingOffscreenDocument;

async function hasOffscreenDocument() {
    const matchedClients = await clients.matchAll();
    return matchedClients.some((client) => client.url.endsWith(OFFSCREEN_DOCUMENT_PATH));
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) return;

    if (creatingOffscreenDocument) {
        await creatingOffscreenDocument;
    } else {
        creatingOffscreenDocument = chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
            justification: 'Firebase Authentication'
        });
        await creatingOffscreenDocument;
        creatingOffscreenDocument = null;
    }
}

async function getAuthFromOffscreen() {
    try {
        await setupOffscreenDocument();
        console.log("Attempting to get auth from offscreen");
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                console.log('Auth request timed out - no response received');
                reject(new Error('Auth request timed out'));
            }, 60000); // Increased to 60 seconds

            const authListener = (message, sender, sendResponse) => {
                console.log('Background received message:', message);
                
                if (message.type === 'AUTH_STARTED') {
                    console.log('Auth process started in offscreen');
                    sendResponse({ received: true });
                }
                
                if (message.type === 'AUTH_RESPONSE') {
                    console.log('Auth response received:', message.data);
                    clearTimeout(timeoutId);
                    chrome.runtime.onMessage.removeListener(authListener);
                    resolve(message.data);
                    return true;
                }
            };

            chrome.runtime.onMessage.addListener(authListener);

            // Send message to offscreen and handle potential errors
            chrome.runtime.sendMessage({
                type: 'START_AUTH',
                target: 'offscreen',
                timestamp: Date.now()
            }).then(() => {
                console.log('Auth request sent to offscreen');
            }).catch(error => {
                console.error('Failed to send auth request:', error);
                clearTimeout(timeoutId);
                chrome.runtime.onMessage.removeListener(authListener);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error in getAuthFromOffscreen:', error);
        throw error;
    }
}

// Add this before the main message listener
function logFromOffscreen(source, message, data = '') {
    console.log(`[${source}]`, message, data);
}

async function getGeolocation(address) {
    try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch (error) {
        console.error('Geolocation error:', error);
        return null;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // ...existing message handlers...
    
    if (message.type === 'GET_GEOLOCATION') {
        getGeolocation(message.address)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'DEBUG_LOG') {
        logFromOffscreen(request.source || 'Offscreen', request.message, request.data);
        return true;
    }
    
    console.log('Background script received message:', request);
    
    if (request.type === 'SIGN_IN_GOOGLE') {
        // Handle Google sign-in with proper async response
        getAuthFromOffscreen()
            .then(result => {
                console.log('Auth result:', result);
                chrome.storage.local.set({user: result.user}, () => {
                    sendResponse({user: result.user});
                });
            })
            .catch(error => {
                console.error('Auth error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open
    }
    
    if (request.type === 'DEBUG_LOG') {
        console.log('[Offscreen Log]', request.message, request.data);
        return;
    }

    switch(request.type) {
        
        case 'SIGN_IN_FACEBOOK':
            signInWithFacebook()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'SIGN_OUT':
            chrome.storage.local.remove('user', () => {
                sendResponse();
            });
            return true;
        
        case 'GET_AUTH_STATE':
            chrome.storage.local.get(['user'], function (result) {
                sendResponse(result);
            });
            return true;
        
        case 'EXPORT_LISTING':
            chrome.storage.local.get(['user'], async function(result) {
                if (!result.user) {
                    sendResponse({ success: false, error: 'User not authenticated' });
                    return;
                }
                try {
                    // Get geolocation data for the listing
                    const geoData = await getGeolocation(request.listing.address);
                    
                    // Fail if no geolocation data
                    if (!geoData) {
                        sendResponse({ 
                            success: false, 
                            error: 'Could not fetch geolocation data for this address' 
                        });
                        return;
                    }
                    
                    // Add geolocation to the listing
                    const listingWithGeo = {
                        ...request.listing,
                        geolocation: geoData
                    };
                    
                    // Export to Firestore
                    const exportResult = await exportListingToFirestore(listingWithGeo, result.user.uid);
                    sendResponse(exportResult);
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            });
            return true;

        case 'initializeExtension':
            sendResponse({ status: 'initialized' });
            return true;
    }
});