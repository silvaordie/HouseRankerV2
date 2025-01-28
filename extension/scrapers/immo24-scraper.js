class Immoscout24Scraper extends BaseScraper {
    constructor() {
        super();
        this.websiteUrl = 'https://www.immoscout24.ch';
        this.name = 'ImmoScout24';
        this.domain = 'immoscout24.ch';
    }

    getListings() {
        try {
            const listings = document.querySelectorAll('a.HgCardElevated_content_uir_2.HgCardElevated_link_EHfr7');

            if (listings.length === 0) {
                return { success: false, error: 'No listings found' };
            }

            const scrapedData = Array.from(listings).map(listing => {
                const id = listing.getAttribute('href') || '';

                const addressElement = listing.querySelector('address');
                const address = addressElement ? addressElement.textContent.trim() : 'N/A';

                const priceElement = listing.querySelector('.HgListingRoomsLivingSpacePrice_price_u9Vee');
                const priceRaw = priceElement ? priceElement.textContent.trim() : '0';

                const sizeElement = listing.querySelector('.HgListingRoomsLivingSpacePrice_roomsLivingSpacePrice_M6Ktp strong[title="Wohnfläche"]');
                const sizeRaw = sizeElement ? sizeElement.textContent.trim() : '0';

                const typologyElement = listing.querySelector('.HgListingRoomsLivingSpacePrice_roomsLivingSpacePrice_M6Ktp strong:not([title])');
                const typologyRaw = typologyElement ? typologyElement.textContent.trim() : '0';

                return this.formatListingData(id, address, priceRaw, sizeRaw, typologyRaw);
            });

            return { success: true, data: scrapedData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}