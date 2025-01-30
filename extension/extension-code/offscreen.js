const FIREBASE_HOSTING_URL = 'https://housepicker-extension-auth.web.app';  // Remove trailing slash

function debugLog(message, data = '', source = 'Offscreen') {
    const timestamp = new Date().toISOString();
    
    // Send to background script first to ensure it's logged
    chrome.runtime.sendMessage({
        type: 'DEBUG_LOG',
        source: source,
        message: `[${timestamp}] ${message}`,
        data: data
    }).catch(() => {
        // If message fails, log locally
        console.log(`[${source} ${timestamp}] ${message}`, data);
    });
}

function normalizeOrigin(origin) {
    return origin.replace(/\/$/, ''); // Remove trailing slash if present
}

function isAllowedOrigin(origin) {
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedExpected = normalizeOrigin(FIREBASE_HOSTING_URL);
    return normalizedOrigin === normalizedExpected;
}

const iframe = document.createElement('iframe');
let iframeReady = false;

iframe.onload = () => {
    debugLog('Iframe loaded', { url: iframe.src }, 'IframeHandler');
    iframeReady = true;
    // Verify communication with iframe
    verifyIframeCommunication();
};

iframe.onerror = (error) => {
    debugLog('Iframe failed to load:', error);
    chrome.runtime.sendMessage({
        type: 'AUTH_RESPONSE',
        data: { error: 'Iframe failed to load' }
    });
};

iframe.src = FIREBASE_HOSTING_URL;
document.body.appendChild(iframe);

function verifyIframeCommunication() {
    try {
        debugLog('Verifying iframe communication', {
            ready: iframeReady,
            url: iframe.src,
            contentWindow: !!iframe.contentWindow
        }, 'IframeVerify');

        iframe.contentWindow.postMessage({ 
            type: 'PING',
            timestamp: Date.now()
        }, FIREBASE_HOSTING_URL);
        
        debugLog('Sent PING to iframe');
    } catch (e) {
        debugLog('Failed to send PING to iframe:', e);
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debugLog('Received chrome message', message, 'ChromeMsg');
    
    if (message.type === 'START_AUTH' && message.target === 'offscreen') {
        // Send immediate acknowledgment
        sendResponse({ status: 'processing' });
        
        if (!iframeReady) {
            debugLog('Iframe not ready yet');
            chrome.runtime.sendMessage({
                type: 'AUTH_RESPONSE',
                data: { error: 'Iframe not ready' }
            });
            return false;
        }

        debugLog('Starting auth process');
        setupIframeMessageListener();
        
        try {
            iframe.contentWindow.postMessage({
                type: 'INIT_AUTH',
                initAuth: true,
                timestamp: Date.now()
            }, FIREBASE_HOSTING_URL);
            
            chrome.runtime.sendMessage({
                type: 'AUTH_STARTED',
                timestamp: Date.now()
            });
            
            debugLog('Auth initialization sent to iframe');
        } catch (e) {
            debugLog('Failed to send auth init to iframe:', e);
            chrome.runtime.sendMessage({
                type: 'AUTH_RESPONSE',
                data: { error: 'Failed to initialize auth: ' + e.message }
            });
        }
        
        return false; // Don't keep the message channel open
    }
    return false;
});

function parseMessage(data) {
    if (typeof data === 'string') {
        // Handle Firebase's special message format
        if (data.startsWith('!_')) {
            return { type: 'FIREBASE_INTERNAL' };
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            debugLog('Failed to parse string message:', { data, error: e });
            return null;
        }
    }
    return data;
}

function setupIframeMessageListener() {
    debugLog('Setting up iframe message listener', {
        iframeUrl: iframe.src,
        hosting: FIREBASE_HOSTING_URL
    }, 'IframeSetup');

    const messageHandler = function(event) {
        const eventOrigin = normalizeOrigin(event.origin);
        
        debugLog('Raw iframe message received:', {
            origin: eventOrigin,
            expectedOrigin: FIREBASE_HOSTING_URL,
            data: event.data,
            source: event.source ? 'window' : 'unknown'
        }, 'IframeComm');

        if (!isAllowedOrigin(event.origin)) {
            debugLog('Ignoring message from unauthorized origin:', {
                received: eventOrigin,
                expected: FIREBASE_HOSTING_URL
            });
            return;
        }
        
        try {
            const data = parseMessage(event.data);
            if (!data) return; // Invalid message format
            if (data.type === 'FIREBASE_INTERNAL') return; // Ignore internal Firebase messages
            
            debugLog('Processed message data:', data, 'IframeComm');
            
            if (data.type === 'PONG') {
                debugLog('Iframe communication verified');
            } else if (data.type === 'AUTH_RESPONSE') {
                window.removeEventListener('message', messageHandler);
                // Send response immediately instead of keeping channel open
                chrome.runtime.sendMessage({
                    type: 'AUTH_RESPONSE',
                    data: data
                }).catch(e => debugLog('Failed to send AUTH_RESPONSE:', e));
            }
        } catch (e) {
            debugLog('Error handling iframe message:', e);
            chrome.runtime.sendMessage({
                type: 'AUTH_RESPONSE',
                data: { error: 'Failed to process authentication: ' + e.message }
            }).catch(e => debugLog('Failed to send error response:', e));
        }
    };

    window.addEventListener('message', messageHandler);
}

// Cleanup on unload
window.addEventListener('unload', () => {
    debugLog('Offscreen document unloading');
});