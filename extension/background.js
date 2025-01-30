import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

chrome.runtime.onInstalled.addListener(() => {
    console.log('Property Scraper Extension installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'initializeExtension') {
        // Handle any initialization if needed
        sendResponse({ status: 'initialized' });
    }

    if (request.type === 'EXPORT_LISTING') {
        exportListing(request.listing)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
    
    // Keep the message channel open for async responses
    return true;
});

async function exportListing(listing) {
    try {
        const listingRef = doc(db, 'exported_listings', listing.address);
        const listingData = {
            id: listing.id,
            img: listing.img,
            price: listing.price,
            size: listing.size,
            typology: listing.typology,
            exportedAt: new Date().toISOString()
        };
        
        await setDoc(listingRef, listingData);
        return { success: true };
    } catch (error) {
        console.error('Error exporting listing:', error);
        return { success: false, error: error.message };
    }
}