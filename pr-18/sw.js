const CACHE_NAME = 'supersuper-v1';

// Assets to cache immediately when service worker installs
const CACHE_URLS = [
  '/SuperSuper/pr-18/',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests, like those for Google Analytics
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle all other requests (assets, etc.)
  event.respondWith(handleAssetRequest(event.request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If server returns error (404, 500, etc), check cache first
    if (networkResponse.status >= 400) {
      console.log(`[ServiceWorker] API returned ${networkResponse.status}, checking cache:`, request.url);
      
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving cached response for failed API request');
        return cachedResponse;
      }
      
      // Return the actual server error if no cache
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] API request failed:', error.message, request.url);
    
    // Check if it's a timeout or network error
    const isTimeout = error.name === 'AbortError';
    const isNetworkError = error.message.includes('fetch');
    
    // Try cache for any network/timeout error
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving cached response for network failure');
      return cachedResponse;
    }
    
    // Return appropriate offline response based on error type
    const offlineResponse = {
      error: 'Service Unavailable',
      message: isTimeout 
        ? 'Request timed out - server may be unavailable' 
        : isNetworkError 
          ? 'Network error - check your connection'
          : 'Backend server is not responding',
      offline: true,
      canRetry: true,
      errorType: isTimeout ? 'timeout' : isNetworkError ? 'network' : 'backend'
    };
    
    return new Response(
      JSON.stringify(offlineResponse),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Navigation request failed, serving cached content');
    
    // If network fails, serve cached index.html
    const cachedResponse = await cache.match('/SuperSuper/pr-18/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached content, return a simple offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>SuperSuper - Offline</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 2rem;">
          <h1>You're Offline</h1>
          <p>Please check your connection and try again.</p>
          <button onclick="location.reload()">Retry</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle asset requests with cache-first strategy
async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Asset request failed:', request.url);
    
    // If it's a CSS or JS file, we might have a generic fallback
    if (request.url.includes('.css')) {
      return new Response('/* Offline CSS fallback */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    // For other assets, just fail gracefully
    return new Response('Offline', { status: 503 });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});