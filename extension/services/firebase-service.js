import { db } from './firebase-config.js';
import { doc, setDoc } from 'firebase/firestore';

export async function exportListingToFirestore(listing) {
    try {
        const projectId = 'your-project-id';
        const collectionName = 'exported_listings';
        const documentId = encodeURIComponent(listing.address);
        
        const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${documentId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_ACCESS_TOKEN' // You'll need to implement token generation
                },
                body: JSON.stringify({
                    fields: {
                        id: { stringValue: listing.id },
                        img: { stringValue: listing.img },
                        price: { integerValue: listing.price },
                        size: { doubleValue: listing.size },
                        typology: { doubleValue: listing.typology },
                        exportedAt: { timestampValue: new Date().toISOString() }
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error exporting listing:', error);
        return { success: false, error: error.message };
    }
}
