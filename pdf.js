/* 계약서 PDF 만들기 — 브라우저에서 A4 이미지로 그린 뒤 PDF로 묶습니다. */
window.HJPDF = (function () {
  var W = 1240, H = 1754, FONT = "'Pretendard', sans-serif";

  function b64(dataUrl) {
    var b = atob(dataUrl.split(',')[1]), out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }

  function buildPdf(jpegs) {
    var enc = new TextEncoder(), chunks = [], len = 0, offs = [];
    var push = function (x) { var b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; };
    push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    var n = jpegs.length, kids = [];
    for (var k = 0; k < n; k++) kids.push((3 + 3 * k) + ' 0 R');
    offs[1] = len; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offs[2] = len; push('2 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>\nendobj\n');
    for (var i = 0; i < n; i++) {
      var p = 3 + 3 * i, im = p + 1, ct = p + 2;
      offs[p] = len; push(p + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>\nendobj\n');
      offs[im] = len; push(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegs[i].length + ' >>\nstream\n');
      push(jpegs[i]); push('\nendstream\nendobj\n');
      var cs = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
      offs[ct] = len; push(ct + ' 0 obj\n<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream\nendobj\n');
    }
    var total = 3 + 3 * n, xref = len;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var j = 1; j < total; j++) x += ('0000000000' + offs[j]).slice(-10) + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var out = new Uint8Array(len), o = 0;
    chunks.forEach(function (c) { out.set(c, o); o += c.length; });
    return out;
  }

  // 칠통령 종이 계약서와 같은 칸 배치를 선명하게 새로 그리고, 그 안에 계약 내용을 적어요.
  // 좌표는 종이 계약서(774×1096) 기준이고 A4(1240×1754)로 늘려서 그려요.
  function renderClean(doc, sigImg, logoImg) {
    var U = W / 774, VU = H / 1096;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d');
    cx.fillStyle = '#FFFFFF'; cx.fillRect(0, 0, W, H);
    var INK = '#111111', SUB = '#444444', CELL = '#EFEFEF', RULE = '#1A1A1A', THIN = '#B8B8B8', PEN = '#16306B';
    var biz = doc.biz || {};
    var X = function (u) { return u * U; }, Y = function (u) { return u * VU; };
    var font = function (w, s) { cx.font = w + ' ' + (s * U).toFixed(1) + 'px ' + FONT; };
    var text = function (x, y, t, o) {
      o = o || {};
      if (t == null || t === '') return;
      font(o.w || 500, o.s || 14); cx.fillStyle = o.c || INK;
      cx.textAlign = o.a === 'r' ? 'right' : o.a === 'c' ? 'center' : 'left';
      var s = String(t);
      if (o.max) { while (o.s > 9 && cx.measureText(s).width > X(o.max)) { o.s -= 0.5; font(o.w || 500, o.s); } }
      cx.fillText(s, X(x), Y(y)); cx.textAlign = 'left';
    };
    var hline = function (x1, x2, y, t, c) { cx.fillStyle = c || THIN; cx.fillRect(X(x1), Y(y) - (t || 1) * U / 2, X(x2 - x1), (t || 1) * U); };
    var label = function (x, w, y1, y2, t) {
      cx.fillStyle = CELL; cx.fillRect(X(x), Y(y1), X(w), Y(y2 - y1));
      text(x + 12, (y1 + y2) / 2 + 5, t, { w: 700, s: 13.5 });
    };
    var spaced = function (t) { return t.length <= 3 ? t.split('').join('   ') : t.length === 4 ? t.split('').join(' ') : t; };
    var box = function (x, y, on, t) {
      cx.strokeStyle = INK; cx.lineWidth = 1.3 * U; cx.strokeRect(X(x), Y(y - 7), X(13), X(13));
      if (on) {
        cx.beginPath(); cx.moveTo(X(x + 2.5), Y(y)); cx.lineTo(X(x + 5.5), Y(y + 3.5)); cx.lineTo(X(x + 11.5), Y(y - 5));
        cx.lineWidth = 2.2 * U; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = PEN; cx.stroke();
      }
      text(x + 18, y + 5, t, { w: on ? 700 : 500, s: 13.5, c: on ? PEN : INK });
    };
    var korDate = function (v) { if (!v) return ''; var p = v.split('-'); return p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일'; };
    var man = function (n) { return n ? Number(n).toLocaleString('ko-KR') : ''; };
    var L = 45, R = 730, MID1 = 380, MID2 = 395, LW = 95;

    // 머리: 로고 · 제목 · 계약번호
    if (logoImg) { var lh = 112, lw = logoImg.width * lh / logoImg.height; cx.drawImage(logoImg, X(40), Y(18), X(lw), Y(lh)); }
    text(405, 104, '계   약   서', { w: 900, s: 46, a: 'c' });
    hline(290, 520, 120, 2.2, INK); hline(290, 520, 125.5, 1.2, INK);
    text(R, 30, '계약번호 ' + doc.no, { s: 9, c: '#8A8A8A', a: 'r' });

    // 1. 기본정보
    text(L, 165, '1. 기본정보', { w: 800, s: 20 });
    text(R, 165, korDate(doc.todayRaw), { w: 600, s: 16, a: 'r', c: PEN });
    hline(L, MID1, 176, 2.6, RULE); hline(MID2, R, 176, 2.6, RULE);
    var rows1 = [[176, 216, '고객명', doc.name, '아파트명', doc.apt], [216, 256, '연락처', doc.phone, '동 / 호수', doc.dongHo], [256, 295, '입주예정일', korDate(doc.moveInRaw), '시공일', korDate(doc.workDateRaw)]];
    rows1.forEach(function (r, i) {
      label(L, LW, r[0] + 1, r[1] - 1, spaced(r[2])); label(MID2, LW, r[0] + 1, r[1] - 1, spaced(r[4]));
      var my = (r[0] + r[1]) / 2 + 5;
      text(L + LW + 15, my, r[3], { w: 600, s: 14.5, c: PEN, max: MID1 - L - LW - 25 });
      text(MID2 + LW + 15, my, r[5], { w: 600, s: 14.5, c: PEN, max: R - MID2 - LW - 25 });
      if (i < 2) { hline(L, MID1, r[1], 1); hline(MID2, R, r[1], 1); }
    });
    hline(L, MID1, 295, 2.6, RULE); hline(MID2, R, 295, 2.6, RULE);
    var notes = HJ.CONTRACT.notes;
    font(500, 12.5); cx.fillStyle = INK;
    text(L, 318, '※ 시공순서 : ', { s: 12.5 });
    font(500, 12.5); var ox = L + cx.measureText('※ 시공순서 : ').width / U;
    text(ox, 318, '탄성코트', { w: 800, s: 12.5 });
    font(800, 12.5); ox += cx.measureText('탄성코트').width / U;
    text(ox, 318, ' > 줄눈 > 청소 > 나노코팅 > 입주', { s: 12.5 });
    text(L, 336, '※ ' + notes[1], { s: 12.5 });
    text(L + 14, 354, '(' + notes[2] + ')', { s: 12.5 });

    // 2. 계약제품
    text(L, 390, '2. 계약제품', { w: 800, s: 20 });
    hline(L, R, 401, 2.6, RULE);
    label(L, LW, 402, 433, spaced('시공제품'));
    [['cosel', 157], ['care', 263], ['pro', 405]].forEach(function (p) { box(p[1], 418, doc.product === p[0], HJ.PRODUCTS.find(function (x) { return x[0] === p[0]; })[1]); });
    hline(L, R, 434, 1);
    label(L, LW, 435, 467, spaced('색상'));
    text(L + LW + 15, 456, doc.color, { w: 600, s: 14.5, c: PEN, max: 230 });
    label(MID2 + 20, LW, 435, 467, spaced('시공면적'));
    text(R - 30, 456, doc.area, { w: 600, s: 14.5, c: PEN, a: 'r' });
    text(R - 8, 456, 'm²', { s: 13.5, a: 'r' });
    hline(L, R, 468, 1);
    label(L, LW, 469, 501, spaced('시공장소'));
    [['balcony', 157], ['laundry', 246], ['outdoor', 353], ['shelter', 456]].forEach(function (p) { box(p[1], 486, !!doc.places[p[0]], HJ.PLACES.find(function (x) { return x[0] === p[0]; })[1]); });
    hline(L, R, 502, 2.6, RULE);

    // 3. 시공가격 및 납부방법
    text(L, 536, '3. 시공가격 및 납부방법', { w: 800, s: 20 });
    hline(L, R, 547, 2.6, RULE);
    var memo = [];
    if (doc.priceMemo) {
      font(600, 14);
      doc.priceMemo.split('\n').forEach(function (para) {
        var line = '';
        for (var i = 0; i < para.length; i++) { var t = line + para[i]; if (cx.measureText(t).width > X(R - L - 30) && line) { memo.push(line); line = para[i]; } else line = t; }
        memo.push(line);
      });
    }
    [581, 615].forEach(function (y) { hline(L, R, y, 1); });
    memo.slice(0, 3).forEach(function (m, i) { text(L + 14, 570 + i * 34, m, { w: 600, s: 14, c: PEN }); });
    hline(L, R, 649, 1.6, RULE);
    label(L, LW, 650, 682, spaced('총금액'));
    text(355, 671, man(doc.total), { w: 700, s: 14.5, c: PEN, a: 'r' });
    text(380, 671, '만원', { s: 13.5, a: 'r' });
    text(R - 8, 671, '총 금액 - 할인 = 최종 금액', { s: 11.5, c: '#8A8A8A', a: 'r' });
    hline(L, R, 683, 1);
    label(L, LW, 684, 716, spaced('할인내역'));
    var dx = L + LW + 15;
    doc.disc.forEach(function (d) {
      var head = d[0] + '(', val = d[1] ? ' ' + d[1] + '만원 ' : '        ';
      text(dx, 705, head, { s: 13.5 }); font(500, 13.5); dx += cx.measureText(head).width / U;
      text(dx, 705, val, { w: 700, s: 13.5, c: PEN }); font(700, 13.5); dx += cx.measureText(val).width / U;
      text(dx, 705, ')', { s: 13.5 }); dx += 26;
    });
    if (doc.discSum) text(R - 8, 705, '합계 -' + doc.discSum + '만원', { w: 700, s: 13.5, c: '#B03A2E', a: 'r' });
    hline(L, R, 717, 1);
    var rows3 = [[717, 751, '최종금액', man(doc.amount), '곰팡이항균SV'], [751, 785, '계약금', man(doc.deposit), '입금자명'], [785, 819, '잔금', doc.amount ? man(doc.balance) || '0' : '', '결제방법']];
    rows3.forEach(function (r, i) {
      label(L, LW, r[0] + 1, r[1] - 1, spaced(r[2]));
      var my = (r[0] + r[1]) / 2 + 5;
      text(355, my, r[3], { w: 700, s: 14.5, c: PEN, a: 'r' });
      text(380, my, '만원', { s: 13.5, a: 'r' });
      label(390, LW, r[0] + 1, r[1] - 1, r[4] === '곰팡이항균SV' ? r[4] : spaced(r[4]));
      if (i === 0) { box(501, my - 5, !!doc.sv.dress, '드레스룸'); box(613, my - 5, !!doc.sv.pantry, '펜트리'); }
      if (i === 1) text(500, my, doc.payer, { w: 600, s: 14.5, c: PEN, max: 220 });
      if (i === 2) { box(501, my - 5, doc.pay === 'cash', '현금'); box(613, my - 5, doc.pay === 'card', '카드'); }
      hline(L, R, r[1], 1);
    });
    var pb = doc.payback ? HJ.won(doc.payback) : '__________원';
    var full = HJ.CONTRACT.payback(pb), cut = full.indexOf(pb), segs = [[full.slice(0, cut), 500, INK], [pb, doc.payback ? 700 : 500, doc.payback ? PEN : INK], [full.slice(cut + pb.length), 500, INK]];
    var tw = 0; segs.forEach(function (g) { font(g[1], 13.5); g.push(cx.measureText(g[0]).width); tw += g[3]; });
    var sx0 = X((L + R) / 2) - tw / 2;
    segs.forEach(function (g) { font(g[1], 13.5); cx.fillStyle = g[2]; cx.textAlign = 'left'; cx.fillText(g[0], sx0, Y(841)); sx0 += g[3]; });
    hline(L, R, 854, 2.6, RULE);

    // 계약 조항
    cx.strokeStyle = RULE; cx.lineWidth = 1.8 * U; cx.strokeRect(X(L + 2), Y(876), X(R - L - 4), Y(124));
    var terms = HJ.CONTRACT.terms(doc.asYears ? ' ' + doc.asYears + ' ' : '');
    text(L + 16, 896, '◆ ' + HJ.CONTRACT.lead, { w: 700, s: 11.5 });
    var ty = 917;
    terms.forEach(function (t) {
      text(L + 16, ty, t[0], { w: 800, s: 12.5 }); ty += 18;
      font(600, 11.5); var line = '', out = [];
      for (var i = 0; i < t[1].length; i++) { var s2 = line + t[1][i]; if (cx.measureText(s2).width > X(R - L - 40) && line) { out.push(line); line = t[1][i]; } else line = s2; }
      out.push(line);
      out.forEach(function (ln) { text(L + 16, ty, ln, { w: 600, s: 11.5 }); ty += 16; });
      ty += 3;
    });

    // 서명
    text(L + 2, 1024, '계약일   ' + korDate(doc.todayRaw), { s: 12.5, c: SUB });
    text(L + 2, 1042, '시공사(을)   ' + (biz.name || '칠통령 탄성코트'), { s: 12.5, c: SUB });
    text(410, 1033, '계약자(갑)   ' + doc.name + '   (서명)', { s: 12.5, c: SUB });
    cx.strokeStyle = '#C4C4C4'; cx.lineWidth = 1 * U; cx.strokeRect(X(585), Y(1009), X(R - 585), Y(36));
    if (sigImg) {
      var rr = Math.min(X(R - 590) / sigImg.width, Y(32) / sigImg.height);
      var sw = sigImg.width * rr, sh = sigImg.height * rr;
      cx.drawImage(sigImg, X((585 + R) / 2) - sw / 2, Y(1027) - sh / 2, sw, sh);
    }

    // 꼬리 띠
    cx.fillStyle = '#7F7F7F'; cx.fillRect(X(L), Y(1053), X(R - L), Y(36));
    text((L + R) / 2, 1080, (biz.name || '칠통령 탄성코트') + (biz.phone ? '      ' + biz.phone : ''), { w: 800, s: 25, c: '#FFFFFF', a: 'c' });
    return [cv];
  }

  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  // doc: 계약 내용, sigUrl: 서명 PNG dataURL → PDF 바이트(Uint8Array)
  function make(doc, sigUrl) {
    var fonts = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load("500 25px 'Pretendard'"), document.fonts.load("700 30px 'Pretendard'"), document.fonts.load("800 54px 'Pretendard'"), document.fonts.load("900 76px 'Pretendard'")]).catch(function () {})
      : Promise.resolve();
    return fonts.then(function () {
      return Promise.all([loadImg(sigUrl), loadImg('assets/contract-logo.png')]);
    }).then(function (imgs) {
      var pages = renderClean(doc, imgs[0], imgs[1]);
      var jpegs = pages.map(function (c) { return c.toDataURL('image/jpeg', 0.9); });
      var out = buildPdf(jpegs.map(b64));
      out.image = jpegs[0]; // 카카오톡 안처럼 PDF를 못 받는 곳에서 보여줄 그림
      return out;
    });
  }

  return { make: make };
})();
