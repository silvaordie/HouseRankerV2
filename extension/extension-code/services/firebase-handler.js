import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { auth, db } from '../background.js';

export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        const result = await signInWithPopup(auth, provider);
        return {
            success: true,
            user: {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL
            }
        };
    } catch (error) {
        console.error('Google sign in error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sign in with Google'
        };
    }
}

export async function signInWithFacebook() {
    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        const result = await auth.signInWithPopup(provider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Facebook sign in error:', error);
        return { success: false, error: error.message };
    }
}

export async function signOut() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Remove the getGeolocation function and modify exportListingToFirestore
export async function exportListingToFirestore(listing, userId) {
    try {
        const sanitizedAddress = listing.address
            .replace(/[\/\\.#$\[\]]/g, '_');

        const importedRef = doc(db, 'users_entries', userId, 'imported_entries', sanitizedAddress);
        
        const listingData = {
            img: listing.img,
            Price: listing.price,
            Size: listing.size,
            Typology: listing.typology,
            Address: listing.address,
            geolocation: listing.geolocation
            // Geolocation will be added by background script
        };
        
        await setDoc(importedRef, listingData, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error exporting listing:', error);
        return { success: false, error: error.message };
    }
}
