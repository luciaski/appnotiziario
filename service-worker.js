const CACHE_NAME = 'notiziario-ia-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Aggiungi qui altri percorsi a file statici (CSS, JS principali) se non sono caricati da CDN
  // Esempio: '/index.tsx', '/style.css'
  // Le risorse da CDN (tailwindcss, esm.sh) saranno gestite dalla cache del browser,
  // ma potresti volerle aggiungere qui se hai problemi di connettività molto instabile
  // e se la loro policy CORS lo permette (non sempre per i service worker).
  // Per ora, ci concentriamo sui file locali.
  // Le icone definite nel manifest.json verranno richieste dal browser.
  // Se hai file icona locali (es. /icons/icon-192x192.png), aggiungili qui.
  // Data URI icons in manifest are fine.
];

// Installazione del Service Worker: apri la cache e aggiungi i file principali.
self.addEventListener('install', event => {
  console.log('Service Worker: Installazione...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aperta, aggiunta dei file principali...');
        // Molti host non permettono di fare cache di /index.tsx direttamente perche' non e' servito come file statico
        // ma e' parte del bundle. Per importmap setup, index.html e' la chiave.
        // I moduli importati da esm.sh verranno gestiti dalla cache del browser o dalla loro CDN.
        return cache.addAll(urlsToCache.filter(url => !url.endsWith('.tsx'))); // Filtra .tsx se non servito staticamente
      })
      .then(() => {
        console.log('Service Worker: File principali aggiunti alla cache.');
        return self.skipWaiting(); // Forza l'attivazione del nuovo SW
      })
      .catch(error => {
        console.error('Service Worker: Errore durante l\'installazione della cache', error);
      })
  );
});

// Attivazione del Service Worker: pulisci le vecchie cache.
self.addEventListener('activate', event => {
  console.log('Service Worker: Attivazione...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Rimozione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Cache aggiornata.');
      return self.clients.claim(); // Prende il controllo immediato delle pagine client
    })
  );
});

// Intercettazione delle richieste di fetch.
self.addEventListener('fetch', event => {
  const { request } = event;
  // Per le richieste API (es. Gemini), usa sempre la rete.
  // Identifica le richieste API in base al dominio o al percorso se necessario.
  // Qui, per semplicità, non intercettiamo specificamente le chiamate API di Gemini,
  // assumendo che vadano gestite online.
  // Se la richiesta e' per Google GenAI API, non provare a servirla dalla cache.
  if (request.url.includes('generativelanguage.googleapis.com')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Strategia Cache-First per le altre richieste (principalmente per l'app shell e asset locali)
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Se la risorsa è in cache, restituiscila.
        if (cachedResponse) {
          // console.log('Service Worker: Risorsa trovata in cache:', request.url);
          return cachedResponse;
        }
        // Altrimenti, recuperala dalla rete.
        // console.log('Service Worker: Risorsa non in cache, fetch dalla rete:', request.url);
        return fetch(request).then(networkResponse => {
          // Opzionale: aggiungi la nuova risorsa alla cache per usi futuri.
          // Non farlo per tutte le richieste, solo per quelle che vuoi esplicitamente cachare.
          // if (networkResponse && networkResponse.status === 200 && urlsToCache.includes(request.url)) {
          //   const responseToCache = networkResponse.clone();
          //   caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          // }
          return networkResponse;
        });
      })
      .catch(error => {
        // Fallback per offline se necessario (es. una pagina offline personalizzata)
        console.error('Service Worker: Errore durante il fetch:', error, request.url);
        // Se sei offline e la richiesta non è in cache, potresti voler restituire una pagina di fallback.
        // Per ora, lasciamo che l'errore di rete si propaghi.
        // E.g., return caches.match('/offline.html');
      })
  );
});
