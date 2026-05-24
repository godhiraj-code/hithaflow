const CACHE_NAME = 'hithaflow-cache-v5';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'src/css/style.css',
  'src/js/app.js',
  'src/js/storage.js',
  'src/js/analytics.js',
  'src/js/components/bodymap.js',
  'src/js/components/breathing.js',
  'src/js/components/distraction.js',
  'src/js/components/doctorReport.js'
];

// Install Service Worker and cache all vital assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching offline assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate & remove old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache: ', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Intercept (Cache-first falling back to network)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) {
    return;
  }

  // Bypass cache entirely for serverless backend endpoints
  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          
          return cachedResponse;
        }
        
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        });
      })
  );
});

// ---------- INTERACTIVE NOTIFICATIONS & INDEXEDDB QUEUE ----------

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HithaFlowOfflineDB', 1);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_logs')) {
        db.createObjectStore('offline_logs', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

function saveOfflineLog(log) {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offline_logs', 'readwrite');
      const store = transaction.objectStore('offline_logs');
      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

// Handle notification click actions (OS / Lock-Screen Quick Log buttons)
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (!action) return;

  // Determine pain/fatigue logs based on action clicked
  let pain = 2;
  let fatigue = 2;
  let label = "Gentle Pacing (Low)";

  if (action === 'log-mid') {
    pain = 5;
    fatigue = 5;
    label = "Moderate Pacing";
  } else if (action === 'log-high') {
    pain = 8;
    fatigue = 8;
    label = "Strict Pacing (High)";
  }

  const logEntry = {
    date: new Date().toISOString().slice(0, 10),
    painLevel: pain,
    fatigueLevel: fatigue,
    mood: pain >= 8 ? "Anxious" : "Neutral",
    painLocations: [],
    tags: ["Notification log"],
    notes: `Logged directly from lock screen notification. State: ${label}`
  };

  event.waitUntil(
    saveOfflineLog(logEntry)
      .then(() => {
        // Ping all open windows of this app to sync immediately
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clientsList => {
            clientsList.forEach(client => {
              client.postMessage({ type: 'SYNC_OFFLINE_LOGS' });
            });

            // Show a feedback notification confirmation toast
            return self.registration.showNotification('HithaFlow Logged Successfully!', {
              body: `Logged Pain: ${pain}/10 & Fatigue: ${fatigue}/10 (${label}). Take care!`,
              icon: 'src/assets/icon-192.png'
            });
          });
      })
      .catch(err => {
        console.error('Error saving lock screen log:', err);
      })
  );
});

