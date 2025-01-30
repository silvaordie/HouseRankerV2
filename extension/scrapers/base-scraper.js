class BaseScraper {
    constructor() {
        this.websiteUrl = '';
        this.name = '';
        this.domain = '';
    }

    // Should be implemented by child classes
    getListings() {
        throw new Error('getListings must be implemented');
    }

    // Common parsing methods that can be used by all scrapers
    parsePrice(priceString) {
        try {
            const numericString = priceString
                .replace(/[^\d.]/g, '')
                .trim();
            return parseInt(numericString) || 0;
        } catch (error) {
            console.error('Error parsing price:', error);
            return 0;
        }
    }

    parseSize(sizeString) {
        try {
            const numericString = sizeString
                .replace('m²', '')
                .replace(/[^\d.]/g, '')
                .trim();
            return parseFloat(numericString) || 0;
        } catch (error) {
            console.error('Error parsing size:', error);
            return 0;
        }
    }

    parseTypology(typologyString) {
        try {
            const numericString = typologyString
                .replace('rooms', '')
                .replace('room', '')
                .trim();
            return parseFloat(numericString) || 0;
        } catch (error) {
            console.error('Error parsing typology:', error);
            return 0;
        }
    }

    // Common method to format the final data
    formatListingData(id, address, img, priceRaw, sizeRaw, typologyRaw) {
        console.log(img)
        return {
            id: this.websiteUrl + id,
            address,
            img,
            price: this.parsePrice(priceRaw),
            size: this.parseSize(sizeRaw),
            typology: this.parseTypology(typologyRaw),
        };
    }
}