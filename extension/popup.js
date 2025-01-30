let currentListings = []; // Add this at the top of the file to store listings

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const scrapeButton = document.getElementById('scrapeButton');
    const listingsContainer = document.getElementById('listingsContainer');
    const selectionControls = document.getElementById('selectionControls');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const exportBtn = document.getElementById('exportBtn');

    function toggleAllCheckboxes(checked) {
        const checkboxes = listingsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = checked);
    }

    selectAllBtn.addEventListener('click', () => toggleAllCheckboxes(true));
    deselectAllBtn.addEventListener('click', () => toggleAllCheckboxes(false));

    async function exportSelectedListings() {
        const listings = [];
        const checkboxes = listingsContainer.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                listings.push(currentListings[index]);
            }
        });
        
        if (listings.length === 0) {
            alert('Please select at least one listing to export');
            return;
        }
        
        exportBtn.disabled = true;
        exportBtn.textContent = 'Exporting...';
        
        try {
            for (const listing of listings) {
                const result = await chrome.runtime.sendMessage({
                    type: 'EXPORT_LISTING',
                    listing: listing
                });
                if (!result.success) {
                    throw new Error(`Failed to export listing: ${result.error}`);
                }
            }
            alert(`Successfully exported ${listings.length} listings!`);
        } catch (error) {
            console.error('Export error:', error);
            alert(`Export failed: ${error.message}`);
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = 'Export Selected Listings';
        }
    }
    
    exportBtn.addEventListener('click', exportSelectedListings);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab.url);
      const domain = url.hostname.replace('www.', '');
      
      if (ScraperFactory.isSupported(domain)) {
        const scraper = ScraperFactory.getScraper(domain);
        statusDiv.className = 'status success';
        statusDiv.textContent = `\u2705 Current website (${scraper.name}) is supported!`;
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
              statusDiv.textContent = `\u2705 Successfully scraped ${scraperResult.data.length} listings!`;
              selectionControls.style.display = 'flex';
              displayListings(scraperResult.data);
              exportBtn.style.display = 'block';
              currentListings = scraperResult.data; // Store listings for export
            } else {
              statusDiv.className = 'status error';
              statusDiv.textContent = `\u274C Error: ${scraperResult.error}`;
            }
          } catch (error) {
            console.error('Scraping error:', error);
            statusDiv.className = 'status error';
            statusDiv.textContent = `\u274C Error: ${error.message}`;
          } finally {
            scrapeButton.disabled = false;
            scrapeButton.textContent = 'Scrape Listings';
          }
        });
      } else {
        statusDiv.className = 'status error';
        statusDiv.textContent = '\u274C Current website is not supported.';
      }
    } catch (error) {
      console.error('Error:', error);
      statusDiv.className = 'status error';
      statusDiv.textContent = `\u274C Error: ${error.message}`;
    }
});

function displayListings(listings) {
    listingsContainer.innerHTML = '';
    listings.forEach(listing => {
        const listingElement = document.createElement('div');
        listingElement.className = 'listing';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'listing-header';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        
        const img = document.createElement('img');
        img.src = listing.img;
        
        const address = document.createElement('span');
        address.className = 'listing-address';
        address.textContent = listing.address;
        
        headerDiv.appendChild(checkbox);
        headerDiv.appendChild(img);
        headerDiv.appendChild(address);
        
        const details = document.createElement('div');
        details.className = 'listing-details';
        
        const detailsTable = document.createElement('table');
        detailsTable.style.width = '100%';
        detailsTable.innerHTML = `
            <tr><td>Price:</td><td>${listing.price} CHF</td></tr>
            <tr><td>Size:</td><td>${listing.size} m²</td></tr>
            <tr><td>Typology:</td><td>${listing.typology} rooms</td></tr>
        `;
        details.appendChild(detailsTable);
        
        listingElement.appendChild(headerDiv);
        listingElement.appendChild(details);
        
        listingElement.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        listingsContainer.appendChild(listingElement);
    });
}