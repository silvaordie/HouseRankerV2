class IdealistaScraper extends BaseScraper {
    constructor() {
        super();
        this.websiteUrl = 'https://www.idealista.pt';
        this.name = 'Idealista';
        this.domain = 'idealista.pt';
    }

    parseAddress(addressString) {
        const naIndex = addressString.indexOf('na ');
        const emIndex = addressString.indexOf('em ');
        const noIndex = addressString.indexOf('no ');
        const startIndex = Math.max(naIndex, emIndex, noIndex);
        return startIndex !== -1 ? addressString.substring(startIndex + 3).trim() : addressString;
    }

    getListings() {
        if (!document || !document.querySelector) {
            return { success: false, error: 'Document is not ready or accessible' };
        }

        try {
            const container = document.querySelector('section.items-container.items-list');
            if (!container) {
                return { success: false, error: 'Listings container not found' };
            }

            const listings = container.querySelectorAll('article.item.extended-item.item-multimedia-container');
            if (!listings || listings.length === 0) {
                return { success: false, error: 'No listings found' };
            }

            const scrapedData = Array.from(listings).map(listing => {
                try {
                    const linkElement = listing.querySelector('a.item-link[role="heading"]');
                    if (!linkElement) {
                        throw new Error('Link element not found');
                    }

                    const id = linkElement.getAttribute('href') || '';
                    const address = linkElement.getAttribute('title') || 'N/A';

                    const priceElement = listing.querySelector('span.item-price.h2-simulated');
                    const priceRaw = priceElement ? priceElement.textContent.trim() : '0';

                    const detailElements = listing.querySelectorAll('div.item-detail-char span.item-detail');
                    const typologyRaw = detailElements[0] ? detailElements[0].textContent.trim() : '0';
                    const sizeRaw = detailElements[1] ? detailElements[1].textContent.trim() : '0';

                    const imgElement = listing.querySelector('picture.item-multimedia div.video-listing-container.is-clickable img');
                    const img = imgElement ? imgElement.src : '';

                    return this.formatListingData(id, address, img, priceRaw, sizeRaw, typologyRaw);
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
