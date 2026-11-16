// HMK – file chạy nền: nhận thông báo đẩy (Web Push chuẩn, không qua Firebase).
// Máy chủ Apps Script chỉ "gõ cửa" (push rỗng); file này hỏi lại máy chủ nội dung tin rồi hiện thông báo.
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

function docIds() {
  return caches.open("hmk-tb").then(function (c) { return c.match("ids"); })
    .then(function (r) { return r ? r.json() : []; }).catch(function () { return []; });
}

function layTin(x) {
  return fetch(x.api, {
    method: "POST", redirect: "follow", credentials: "omit",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ fn: "layThongBao", args: [x.id] })
  }).then(function (r) { return r.json(); })
    .then(function (j) { var d = j && j.result && j.result.data; return Array.isArray(d) ? d : []; })
    .catch(function () { return []; });
}

self.addEventListener("push", function (e) {
  e.waitUntil(docIds().then(function (ids) {
    return Promise.all(ids.map(layTin));
  }).then(function (ds) {
    var tin = [].concat.apply([], ds);
    if (!tin.length) tin = [{ t: "HMK", b: "Bạn có thông báo mới – mở app để xem." }];
    return Promise.all(tin.slice(-4).map(function (m) {
      return self.registration.showNotification(m.t || "HMK", {
        body: m.b || "", tag: m.id || undefined, icon: "/chamcong/icon-192.jpg", badge: "/chamcong/icon-192.jpg",
        data: { u: m.u || "" }
      });
    }));
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var u = (e.notification.data && e.notification.data.u) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (ds) {
    for (var i = 0; i < ds.length; i++) { if ("focus" in ds[i]) { ds[i].focus(); return; } }
    return self.clients.openWindow(u);
  }));
});
