// Make sure IdealistaScraper, Immoscout24Scraper, and RightmoveScraper are defined before this
class ScraperFactory {
    static scrapers = {
      'idealista.pt': IdealistaScraper,
      'immoscout24.ch': Immoscout24Scraper,
      'rightmove.co.uk': RightmoveScraper
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