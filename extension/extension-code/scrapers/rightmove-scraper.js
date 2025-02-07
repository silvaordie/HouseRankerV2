class RightmoveScraper extends BaseScraper {
    constructor() {
        super();
        this.websiteUrl = 'https://www.rightmove.co.uk';
        this.name = 'Rightmove';
        this.domain = 'rightmove.co.uk';
        this.currency = 'GBP';  // Add currency
    }

    formatAddress(address) {
        const lastCommaIndex = address.lastIndexOf(',');
        if (lastCommaIndex === -1) return address;

        const potentialPostcode = address.substring(lastCommaIndex + 1).trim();
        // Check if the part after the last comma contains only capital letters and numbers
        if (/^[A-Z0-9\s]+$/.test(potentialPostcode)) {
            return address.substring(0, lastCommaIndex).trim();
        }
        return address;
    }

    getListings() {
        if (!document || !document.querySelector) {
            return { success: false, error: 'Document is not ready or accessible' };
        }

        try {
            const container = document.querySelector('.ResultsList_resultsSection__MVSi7');
            if (!container) {
                return { success: false, error: 'Listings container not found' };
            }

            // Updated selector for listings
            const listings = container.querySelectorAll('.PropertyCard_propertyCardContainerWrapper__mcK1Z.propertyCard-details');
            if (!listings || listings.length === 0) {
                return { success: false, error: 'No listings found' };
            }

            const scrapedData = Array.from(listings).map(listing => {
                try {
                    const linkElement = listing.querySelector('a.propertyCard-link');
                    const id = linkElement ? linkElement.getAttribute('href') : '';

                    const addressElement = listing.querySelector('.PropertyAddress_address__LYRPq');
                    const rawAddress = addressElement ? addressElement.textContent.trim() : 'N/A';
                    const address = this.formatAddress(rawAddress); // Apply address formatting

                    const typologyElement = listing.querySelector('.PropertyInformation_bedroomsCount___2b5R');
                    const typologyRaw = typologyElement ? typologyElement.textContent.trim() : '0';

                    // Updated image selector
                    const imgElement = listing.querySelector('img.PropertyCardImage_fallback__KYBHc');
                    const img = imgElement ? imgElement.src : '';

                    // Updated price selector
                    const priceElement = listing.querySelector('.PropertyPrice_price__VL65t');
                    const priceRaw = priceElement ? priceElement.textContent.trim() : '0';

                    return this.formatListingData(id, address, img, priceRaw, '0', typologyRaw);
                } catch (listingError) {
                    console.error('Error processing listing:', listingError);
                    return null;
                }
            }).filter(item => item !== null);

            if (scrapedData.length === 0) {
                return { success: false, error: 'Failed to extract any valid listings' };
            }

            return { success: true, data: scrapedData };
        } catch (error) {
            console.error('Scraping error:', error);
            return { success: false, error: error.message || 'Unknown error occurred while scraping' };
        }
    }
}
