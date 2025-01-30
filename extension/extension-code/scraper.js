function scrapeListings() {
    const currentDomain = window.location.hostname.replace('www.', '');
    const scraper = ScraperFactory.getScraper(currentDomain);
    if (!scraper) {
      return { success: false, error: 'Website not supported' };
    }
  
    console.log(`Starting scraping process for ${scraper.name}...`);
    
    const result = scraper.getListings();
    
    if (result.success && result.data.length > 0) {
      return { success: true, data: result.data };
    }
  
    return result;
}
