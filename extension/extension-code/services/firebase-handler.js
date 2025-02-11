import { doc, setDoc} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { db, isEmulator } from '../background.js';


// Remove the getGeolocation function and modify exportListingToFirestore
export async function exportListingToFirestore(listing, userId) {
    try {
        const sanitizedAddress = listing.address
            .replace(/[\/\\.#$\[\]]/g, '_');

        const importedRef = doc(db, 'users_entries', userId, 'imported_entries', sanitizedAddress);
        
        const listingData = {
            url: listing.id, 
            img: listing.img,
            Price: listing.price,
            Size: listing.size,
            Typology: listing.typology,
            Address: listing.address,
            geolocation: listing.geolocation,
            environment: isEmulator ? 'emulator' : 'production'
        };
        
        await setDoc(importedRef, listingData, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error exporting listing:', error);
        return { success: false, error: error.message };
    }
}
