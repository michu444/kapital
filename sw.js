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
  var d = { title: "", body: "Przypomnienie" };
  if (e.data) {
    try { var j = e.data.json(); for (var k in j) d[k] = j[k]; }
    catch (err) { d.body = e.data.text(); }
  }
  // iOS dokleja linię "from <nazwa apki>" i nie da się jej usunąć.
  // Pokazuje za to tylko te pola, które faktycznie wypełnisz — więc
  // pusty title albo pusty body daje układ dwuliniowy zamiast trzyliniowego.
  var opts = {
    icon: "icon-180.png",
    badge: "icon-180.png",
    tag: d.tag || "kapital",
    data: { url: d.url || "./" }
  };
  if (d.body) opts.body = d.body;

  e.waitUntil(self.registration.showNotification(d.title || "", opts));
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
