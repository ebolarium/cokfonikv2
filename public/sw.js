// public/sw.js

self.addEventListener('push', function(event) {
  let data = { title: 'Yeni Duyuru', body: 'Yeni bir duyuru var!', url: '/' }; // Varsayılan değerler

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Push verisi JSON parse edilemedi:', error);
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png', // Uygulamanızın ikon yolu
    badge: '/icons/badge-72x72.png', // Uygulamanızın badge ikonu
    data: {
      url: data.url || '/', // Bildirim tıklandığında açılacak URL
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
