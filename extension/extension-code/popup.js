let currentListings = []; // Add this at the top of the file to store listings

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const scrapeButton = document.getElementById('scrapeButton');
    const listingsContainer = document.getElementById('listingsContainer');
    const selectionControls = document.getElementById('selectionControls');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const exportBtn = document.getElementById('exportBtn');
    const authContainer = document.getElementById('authContainer');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const googleSignIn = document.getElementById('googleSignIn');
    const facebookSignIn = document.getElementById('facebookSignIn');
    const signOutBtn = document.getElementById('signOutBtn');

    // Add these variables to the top
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressText = loadingOverlay.querySelector('.progress-text');
    const statusText = loadingOverlay.querySelector('.status-text');

    // Prevent closing while exporting
    window.onbeforeunload = (e) => {
        if (loadingOverlay.style.display === 'flex') {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    };

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

        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        progressText.textContent = '0%';
        exportBtn.disabled = true;
        
        try {
            const authState = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
            if (!authState.user) {
                throw new Error('User not authenticated');
            }

            let successCount = 0;
            for (const [index, listing] of listings.entries()) {
                statusText.textContent = `Exporting listing ${index + 1} of ${listings.length}...`;
                
                const result = await chrome.runtime.sendMessage({
                    type: 'EXPORT_LISTING',
                    listing: listing,
                    userId: authState.user.uid
                });

                if (result.success) {
                    successCount++;
                    const progress = Math.round((successCount / listings.length) * 100);
                    // Update both text and visual progress
                    progressText.textContent = `${progress}%`;
                    document.querySelector('.circular-progress').style.setProperty('--progress', `${progress}%`);
                } else {
                    throw new Error(`Failed to export listing: ${result.error}`);
                }
            }

            alert(`Successfully exported ${successCount} listings!`);
        } catch (error) {
            console.error('Export error:', error);
            alert(`Export failed: ${error.message}`);
        } finally {
            loadingOverlay.style.display = 'none';
            exportBtn.disabled = false;
            exportBtn.textContent = 'Export Selected Listings';
        }
    }
    
    exportBtn.addEventListener('click', exportSelectedListings);

    // Auth event listeners
    googleSignIn.addEventListener('click', async () => {
        try {
            const result = await chrome.runtime.sendMessage({ type: 'SIGN_IN_GOOGLE' });
            
            if (result.user) {
                updateUIForAuthenticatedUser(result);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            statusDiv.className = 'status error';
            statusDiv.textContent = `\u274C Authentication failed: ${error.message}`;
        }
    });

    facebookSignIn.addEventListener('click', async () => {
        try {
            const result = await chrome.runtime.sendMessage({ type: 'SIGN_IN_FACEBOOK' });
            if (result.success) {
                updateUIForAuthenticatedUser(result.user);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            statusDiv.className = 'status error';
            statusDiv.textContent = `\u274C Authentication failed: ${error.message}`;
        }
    });

    signOutBtn.addEventListener('click', async () => {
        try {
            await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
            updateUIForUnauthenticatedUser();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    });

    function updateUIForAuthenticatedUser(user) {
        authContainer.style.display = 'none';
        userInfo.style.display = 'flex';
        userInfo.style.justifyContent = 'space-between';
        userInfo.style.width = '100%';

        // Update user info display
        const userDetails = document.createElement('div');
        userDetails.style.display = 'flex';
        userDetails.style.alignItems = 'center';
        userDetails.style.gap = '10px';
        userDetails.style.flex = '1';

        userAvatar.src = user.photoURL || 'default-avatar.png';
        userAvatar.onload = () => userAvatar.style.display = 'block';
        userAvatar.onerror = () => userAvatar.src = 'default-avatar.png';
        
        userName.textContent = user.name || user.email;
        
        userDetails.appendChild(userAvatar);
        userDetails.appendChild(userName);
        
        // Adjust signout button
        signOutBtn.style.width = '40%';
        
        // Clear and rebuild userInfo
        userInfo.innerHTML = '';
        userInfo.appendChild(userDetails);
        userInfo.appendChild(signOutBtn);

        // Only show scrape button if website is supported
        updateScrapeButtonVisibility();
    }

    function updateUIForUnauthenticatedUser() {
        authContainer.style.display = 'flex';
        userInfo.style.display = 'none';
        scrapeButton.style.display = 'none';
    }

    function updateScrapeButtonVisibility() {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            const url = new URL(tab.url);
            const domain = url.hostname.replace('www.', '');
            const isSupported = ScraperFactory.isSupported(domain);
            scrapeButton.style.display = isSupported ? 'block' : 'none';
        });
    }

    // Check auth state on popup open
    try {
        const authState = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
        if (authState.user) {
            updateUIForAuthenticatedUser(authState.user);
        } else {
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('Auth state check failed:', error);
        updateUIForUnauthenticatedUser();
    }

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
                'scrapers/idealista-scraper.js', // Add this line
                'scrapers/immo24-scraper.js',
                'scrapers/rightmove-scraper.js',
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

// ...existing code...

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
        
        // Get the current domain and find the appropriate scraper to get currency
        const domain = new URL(window.location.href).hostname.replace('www.', '');
        const scraper = ScraperFactory.getScraper(domain);
        const currency = scraper ? scraper.currency : ''; // Default to CHF if no scraper found
        
        detailsTable.innerHTML = `
            <tr><td>Price:</td><td>${listing.price} ${currency}</td></tr>
            <tr><td>Size:</td><td>${listing.size} m&sup2;</td></tr>
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