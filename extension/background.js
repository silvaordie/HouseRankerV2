chrome.runtime.onInstalled.addListener(() => {
    console.log('Property Scraper Extension installed');
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'initializeExtension') {
      // Handle any initialization if needed
      sendResponse({ status: 'initialized' });
    }
    
    // Keep the message channel open for async responses
    return true;
  });