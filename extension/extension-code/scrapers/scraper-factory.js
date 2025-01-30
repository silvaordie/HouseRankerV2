class ScraperFactory {
    static scrapers = {
      'immoscout24.ch': Immoscout24Scraper,
      // Add more scrapers here
    };
  
    static getScraper(domain) {
      const ScraperClass = this.scrapers[domain];
      return ScraperClass ? new ScraperClass() : null;
    }
  
    static isSupported(domain) {
      return domain in this.scrapers;
    }
  
    static getSupportedWebsites() {
      return Object.values(this.scrapers).map(Scraper => {
        const instance = new Scraper();
        return {
          name: instance.name,
          domain: instance.domain
        };
      });
    }
}