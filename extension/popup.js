document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const scrapeButton = document.getElementById('scrapeButton');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab.url);
      const domain = url.hostname.replace('www.', '');
      
      if (ScraperFactory.isSupported(domain)) {
        const scraper = ScraperFactory.getScraper(domain);
        statusDiv.className = 'status success';
        statusDiv.textContent = `✅ Current website (${scraper.name}) is supported!`;
        scrapeButton.style.display = 'block';
        
        scrapeButton.addEventListener('click', async () => {
          try {
            scrapeButton.disabled = true;
            scrapeButton.textContent = 'Scraping...';
            statusDiv.textContent = 'Scraping in progress...';
            
            // Inject all required scripts in order
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: [
                'scrapers/base-scraper.js',
                'scrapers/immo24-scraper.js',
                'scrapers/scraper-factory.js',
                'scraper.js'
              ]
            });
            
            // Execute scraping function
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: scrapeListings
            });
            
            const scraperResult = results[0].result;
            
            if (scraperResult.success) {
              statusDiv.className = 'status success';
              statusDiv.textContent = `✅ Successfully scraped ${scraperResult.count} listings!`;
            } else {
              statusDiv.className = 'status error';
              statusDiv.textContent = `❌ Error: ${scraperResult.error}`;
            }
          } catch (error) {
            console.error('Scraping error:', error);
            statusDiv.className = 'status error';
            statusDiv.textContent = `❌ Error: ${error.message}`;
          } finally {
            scrapeButton.disabled = false;
            scrapeButton.textContent = 'Scrape Listings';
          }
        });
      } else {
        statusDiv.className = 'status error';
        statusDiv.textContent = '❌ Current website is not supported.';
      }
    } catch (error) {
      console.error('Error:', error);
      statusDiv.className = 'status error';
      statusDiv.textContent = `❌ Error: ${error.message}`;
    }
});