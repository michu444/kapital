/* Mój Kapitał — service worker
   Uwaga: celowo BEZ cache'owania plików. Apkę aktualizujesz często,
   a cache w service workerze potrafi serwować starą wersję i trudno go
   potem wyczyścić na iOS. Ten worker służy wyłącznie do powiadomień. */

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (e) {
  var d = { title: "Mój Kapitał", body: "Przypomnienie" };
  if (e.data) {
    try { var j = e.data.json(); for (var k in j) d[k] = j[k]; }
    catch (err) { d.body = e.data.text(); }
  }
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: "icon-180.png",
      badge: "icon-180.png",
      tag: d.tag || "kapital",
      data: { url: d.url || "./" }
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
