/* 벽 사진에 탄성코트 색을 입혀 봅니다 (기기 안에서만 처리, 서버로 보내지 않음).
 * 사진에서 칠할 벽을 누르면 비슷한 색으로 이어진 면을 찾아 그 부분만 다시 칠해요. */
window.HJCoat = (function () {
  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  function openImg(src) {
    return new Promise(function (resolve, reject) {
      var isFile = typeof src !== 'string';
      var url = isFile ? URL.createObjectURL(src) : src;
      var img = new Image();
      img.onload = function () { if (isFile) URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { if (isFile) URL.revokeObjectURL(url); reject(new Error('open')); };
      img.src = url;
    });
  }

  function boxBlur(src, W, H, r) {
    var S = new Float64Array((W + 1) * (H + 1));
    for (var y = 0; y < H; y++) {
      var row = 0;
      for (var x = 0; x < W; x++) { row += src[y * W + x]; S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row; }
    }
    var out = new Float32Array(W * H);
    for (var y2 = 0; y2 < H; y2++) {
      var y0 = Math.max(0, y2 - r), y1 = Math.min(H, y2 + r + 1);
      for (var x2 = 0; x2 < W; x2++) {
        var x0 = Math.max(0, x2 - r), x1 = Math.min(W, x2 + r + 1);
        out[y2 * W + x2] = (S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]) / ((y1 - y0) * (x1 - x0));
      }
    }
    return out;
  }

  // 사진을 900px 이하로 줄여 픽셀을 읽어 둡니다
  function load(src) {
    return openImg(src).then(function (img) {
      var sc = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
      var W = Math.round(img.naturalWidth * sc), H = Math.round(img.naturalHeight * sc), N = W * H;
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, W, H);
      var px = cx.getImageData(0, 0, W, H).data;
      var L = new Float32Array(N), R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
      for (var i = 0; i < N; i++) { R[i] = px[4 * i]; G[i] = px[4 * i + 1]; B[i] = px[4 * i + 2]; L[i] = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]; }
      var r = Math.max(2, Math.round(Math.max(W, H) / 300));
      return { W: W, H: H, px: px, L: L, bR: boxBlur(R, W, H, r), bG: boxBlur(G, W, H, r), bB: boxBlur(B, W, H, r), cv: cv, cx: cx };
    });
  }

  // 준비된 마스크 사진(흰색 = 칠할 곳)으로 마스크 만들기
  function maskFromImage(st, src) {
    return openImg(src).then(function (img) {
      var cv = document.createElement('canvas'); cv.width = st.W; cv.height = st.H;
      var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, st.W, st.H);
      var d = cx.getImageData(0, 0, st.W, st.H).data, N = st.W * st.H, m = new Float32Array(N);
      for (var i = 0; i < N; i++) m[i] = d[4 * i] / 255;
      return m;
    });
  }

  // 누른 곳에서 비슷한 색으로 이어진 면 찾기
  function grow(st, seed, hard) {
    var W = st.W, H = st.H, bR = st.bR, bG = st.bG, bB = st.bB;
    var sx = Math.max(0, Math.min(W - 1, Math.round(seed[0] * (W - 1))));
    var sy = Math.max(0, Math.min(H - 1, Math.round(seed[1] * (H - 1))));
    var s = sy * W + sx, c0 = [bR[s], bG[s], bB[s]];
    var T1 = 40 * 40 * 3, T2 = 7 * 7 * 3;
    var seen = new Uint8Array(W * H), stack = new Int32Array(W * H), sp = 0, cnt = 0;
    var near = function (p) { var a = bR[p] - c0[0], b = bG[p] - c0[1], c = bB[p] - c0[2]; return a * a + b * b + c * c < T1; };
    var step = function (p, q) { var a = bR[p] - bR[q], b = bG[p] - bG[q], c = bB[p] - bB[q]; return a * a + b * b + c * c < T2; };
    stack[sp++] = s; seen[s] = 1;
    while (sp > 0) {
      var p = stack[--sp]; hard[p] = 1; cnt++;
      var x = p % W;
      var nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W];
      for (var k = 0; k < 4; k++) {
        var q = nb[k];
        if (q < 0 || q >= W * H || seen[q]) continue;
        if (near(q) && step(p, q)) { seen[q] = 1; stack[sp++] = q; }
      }
    }
    return cnt;
  }

  function dilate(m, W, H, r) {
    var tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var v = 0;
      for (var d = -r; d <= r && !v; d++) { var xx = x + d; if (xx >= 0 && xx < W && m[y * W + xx]) v = 1; }
      tmp[y * W + x] = v;
    }
    for (var y2 = 0; y2 < H; y2++) for (var x2 = 0; x2 < W; x2++) {
      var v2 = 0;
      for (var d2 = -r; d2 <= r && !v2; d2++) { var yy = y2 + d2; if (yy >= 0 && yy < H && tmp[yy * W + x2]) v2 = 1; }
      out[y2 * W + x2] = v2;
    }
    return out;
  }

  function maskFromSeeds(st, seeds) {
    var N = st.W * st.H, hard = new Uint8Array(N), cnt = 0;
    seeds.forEach(function (s) { cnt += grow(st, s, hard); });
    if (cnt < N * 0.01) throw new Error('small');
    var d = dilate(hard, st.W, st.H, 1), f = new Float32Array(N);
    for (var i = 0; i < N; i++) f[i] = d[i];
    return boxBlur(f, st.W, st.H, 1);
  }

  // 마스크 부분만 고른 색으로 칠하기 (원래 그림자·질감은 살림)
  function paint(st, mask, hex) {
    var N = st.W * st.H, c = hexRgb(hex), sum = 0, n = 0;
    for (var i = 0; i < N; i++) if (mask[i] > 0.5) { sum += st.L[i]; n++; }
    var ref = n ? sum / n : 200;
    var out = st.cx.createImageData(st.W, st.H), od = out.data, px = st.px;
    for (var q = 0; q < N; q++) {
      var m = mask[q], sh = Math.min(1.12, Math.max(0.5, st.L[q] / ref));
      od[4 * q] = px[4 * q] * (1 - m) + Math.min(255, c[0] * sh) * m;
      od[4 * q + 1] = px[4 * q + 1] * (1 - m) + Math.min(255, c[1] * sh) * m;
      od[4 * q + 2] = px[4 * q + 2] * (1 - m) + Math.min(255, c[2] * sh) * m;
      od[4 * q + 3] = 255;
    }
    st.cx.putImageData(out, 0, 0);
    return st.cv.toDataURL('image/jpeg', 0.86);
  }

  // 업로드용: 긴 변 기준으로 줄인 JPEG dataURL
  function shrink(file, maxSide) {
    return openImg(file).then(function (img) {
      var sc = Math.min(1, (maxSide || 1280) / Math.max(img.naturalWidth, img.naturalHeight));
      var cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.82);
    });
  }

  return { load: load, maskFromImage: maskFromImage, maskFromSeeds: maskFromSeeds, paint: paint, shrink: shrink };
})();
