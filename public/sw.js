const SERVICE_WORKER_VERSION = 'unreal-bs-install-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Intentionally no fetch handler or cache. Installed users receive the same
// live application, authentication, API, and Meta attribution behavior as the
// browser version, without retaining customer or payment responses offline.
void SERVICE_WORKER_VERSION
