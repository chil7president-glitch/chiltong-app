/* 칠통령 서비스워커 — 화면 파일을 저장해 두어 빠르게 열리고, 인터넷이 약해도 기본 화면은 보이게 합니다.
   사이트를 고친 뒤에는 VERSION 숫자를 하나 올려주세요. */
var VERSION = 'chil-v27';
var FILES = [
  './', './index.html', './styles.css', './config.js', './data.js', './sites.js', './pdf.js', './coat.js', './app.js', './privacy.html', './manifest.webmanifest',
  './assets/logo.png', './assets/mark.png', './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png', './assets/favicon-32.png',
  './assets/PretendardVariable.woff2', './assets/veranda.jpg', './assets/contract-logo.png', './assets/veranda-mask.png',
  './assets/case-before.jpg', './assets/case-white.jpg', './assets/case-violet.jpg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 구글 시트 서버·사진은 항상 새로 받기
  // 네트워크 우선, 안 되면 저장본
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
  }));
});
