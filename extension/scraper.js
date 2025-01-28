function scrapeListings() {
    console.log('ScraperFactory in scraper.js:', window.ScraperFactory);

    const currentDomain = window.location.hostname.replace('www.', '');
    const scraper = ScraperFactory.getScraper(currentDomain);
    if (!scraper) {
      return { success: false, error: 'Website not supported' };
    }
  
    console.log(`Starting scraping process for ${scraper.name}...`);
    
    const result = scraper.getListings();
    
    if (result.success && result.data.length > 0) {
      const jsonContent = JSON.stringify(result.data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scraper.name.toLowerCase()}-listings.json`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, count: result.data.length };
    }
  
    return result;
}
