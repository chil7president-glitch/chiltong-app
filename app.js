/* 칠통령 웹앱 — 화면과 동작 */
(function () {
  'use strict';
  var CFG = window.CHIL_CONFIG || {};
  var BIZ = CFG.BUSINESS || {};
  var app = document.getElementById('app');

  // ---------- helpers ----------
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(key, fallback) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function fmtPhone(v) {
    var n = String(v || '').replace(/\D/g, '').slice(0, 11);
    return n.length < 4 ? n : n.length < 8 ? n.slice(0, 3) + '-' + n.slice(3) : n.slice(0, 3) + '-' + n.slice(3, n.length - 4) + '-' + n.slice(-4);
  }
  function pad(n) { return ('0' + n).slice(-2); }
  function todayKo() { var d = new Date(); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function stamp() { var d = new Date(); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  var toastTimer = null;
  function toast(msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }

  // ---------- server (Google Apps Script) ----------
  var API = {
    ready: !!CFG.API_URL,
    get: function (action) {
      if (!CFG.API_URL) return Promise.reject(new Error('noapi'));
      return fetch(CFG.API_URL + '?action=' + encodeURIComponent(action), { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'fail'); return j; });
    },
    post: function (payload) {
      if (!CFG.API_URL) return Promise.reject(new Error('noapi'));
      return fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'fail'); return j; });
    }
  };

  // ---------- icons ----------
  var I = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>',
    cal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    doc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 17c1.5-2 2.5-2 3.5 0s2 2 3.5-.5"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    photo: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
    camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    pen: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    ok: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#E2AE5A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    tick: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrows: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>',
    chev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B53A5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    mark: '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="6" fill="#1E3354"/><rect x="5.5" y="7" width="13" height="5" rx="1.6" fill="#E2AE5A"/><path d="M18.5 9.5h2v4.2H13v3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><rect x="11.6" y="16.4" width="2.8" height="4.6" rx="1" fill="#fff"/></svg>',
    wrench: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.5 1.5 0 0 0 2.1 2.1l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.6-.6-2.1z"/></svg>',
    paint: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h2.5v5H11v3.5"/><rect x="9.5" y="14.5" width="3" height="6.5" rx="1"/></svg>'
  };

  // ---------- state ----------
  var now = new Date();
  var S = {
    route: '',
    home: load('chil-home', { apt: '', dong: '', ho: '', date: '' }),
    homeDraft: null,
    color: { room: 'livingV', coat: HJ.color(load('chil-coat', 'lgray')) ? load('chil-coat', 'lgray') : 'lgray', mode: 'sample', url: '', busy: false, err: '' },
    quote: {
      svc: { grout: true, clean: false }, build: 'new', size: 34, material: 'cosel',
      spots: { laundry: true, outdoorShelter: true, masterBalcony: true, shelterSep: false },
      view: { y: now.getFullYear(), m: now.getMonth() }, day: null,
      sheet: null, phone: '', memo: '', agree: false, formErr: '', sending: false
    },
    cases: { list: null, loading: false, error: '', filter: null, pos: {}, tab: 'sites', area: 'all', q: '', open: {} },
    contract: null,
    book: null,
    as: null,
    admin: { pw: sessionStorage.getItem('chil-admin') || '', authed: !!sessionStorage.getItem('chil-admin'), tab: 'book', list: null, books: null, closed: [], techs: [], closeDay: '', showPast: false, form: null, err: '', busy: false, loginErr: '' },
    install: null
  };

  // ---------- routing ----------
  function go(route) { location.hash = '#/' + route; }
  function currentRoute() {
    var r = location.hash.replace(/^#\/?/, '');
    if (!r) return load('chil-intro-seen', false) ? 'home' : 'intro';
    return r;
  }
  window.addEventListener('hashchange', function () { S.route = currentRoute(); onEnter(); render(true); });

  function onEnter() {
    if (S.route === 'cases') loadCases();
    if (S.route === 'color') { if (!COAT.sample) coatPrepare(); else S.color.url = coatSrc(); }
    if (S.route === 'quote' && S.quote.sheet === 'done') { S.quote.sheet = null; S.quote.memo = ''; S.quote.agree = false; }
    if (S.route === 'contract' && !S.contract) S.contract = newContract();
    if (S.route === 'book') { if (!S.book) S.book = newBooking(); if (!S.book.sched) loadSchedule(); }
    if (S.route === 'as') { if (!S.as) S.as = newAS(); }
    if (S.route === 'mybook') { if (!S.my) S.my = newMy(); if (S.my.list === null && S.my.name && S.my.phone && API.ready) myFind(); }
    if (S.route === 'admin' && S.admin.authed && !S.admin.list) adminLoad();
  }

  // ---------- render with focus restore ----------
  var sigStrokes = [];
  function render(scrollTop) {
    var active = document.activeElement, fid = active && active.id, sel = null;
    if (fid && active.setSelectionRange && typeof active.selectionStart === 'number') sel = [active.selectionStart, active.selectionEnd];
    var view = ({ intro: viewIntro, home: viewHome, color: viewColor, quote: viewQuote, book: viewBook, mybook: viewMy, as: viewAS, guide: viewGuide, cases: viewCases, contract: viewContract, admin: viewAdmin })[S.route] || viewHome;
    app.innerHTML = view();
    if (scrollTop) window.scrollTo(0, 0);
    if (fid) {
      var el = document.getElementById(fid);
      if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) { try { var L = el.value.length; el.setSelectionRange(Math.min(sel[0], L), Math.min(sel[1], L)); } catch (e) {} } }
    }
    afterRender();
  }

  function afterRender() {
    if (S.route === 'intro') setupIntro();
    if (S.route === 'contract') setupSig();
    document.title = ({ intro: '칠통령', home: '칠통령 — 베란다·다용도실 탄성코트', color: '탄성코트 색 고르기 · 칠통령', quote: '견적·상담 예약 · 칠통령', book: '시공일 예약 · 칠통령', mybook: '내 예약 · 칠통령', as: 'A/S 신청 · 칠통령', guide: '입주 준비 코스 · 칠통령', cases: '시공 사례 · 칠통령', contract: '시공 계약서 · 칠통령', admin: '관리자 · 칠통령' })[S.route] || '칠통령';
  }

  // ---------- shared pieces ----------
  function topbar(title, right) {
    return '<header class="topbar"><div class="left"><a class="icon-btn" href="#/home" aria-label="홈으로">' + I.back + '</a><h1>' + esc(title) + '</h1></div>' + (right || '') + '</header>';
  }
  function tabbar(active) {
    var tabs = [['home', '홈', I.home], ['color', '색상', I.paint], ['book', '예약', I.cal], ['contract', '계약', I.doc], ['guide', '준비', I.check]];
    return '<nav class="tabbar" aria-label="메뉴">' + tabs.map(function (t) {
      return '<a href="#/' + t[0] + '"' + (active === t[0] ? ' aria-current="page"' : '') + '>' + t[2] + t[1] + '</a>';
    }).join('') + '</nav>';
  }
  function chip(label, on, act, data, cls) {
    return '<button type="button" class="chip' + (cls ? ' ' + cls : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-act="' + act + '"' + (data || '') + '>' + esc(label) + '</button>';
  }
  function bizFooter() {
    var parts = [BIZ.name || '칠통령', BIZ.ceo ? '대표 ' + BIZ.ceo : '', BIZ.bizNo ? '사업자등록번호 ' + BIZ.bizNo : '', BIZ.phone ? '고객센터 ' + BIZ.phone : '', BIZ.address || ''].filter(Boolean);
    return '<div class="biz">' + esc(parts.join(' · ')) + '<br><a href="privacy.html">개인정보처리방침</a>' + (BIZ.kakao ? ' · <a href="' + esc(BIZ.kakao) + '" target="_blank" rel="noopener">카카오톡 상담</a>' : '') + '</div>';
  }

  // ======================================================
  // 진입 화면
  // ======================================================
  function viewIntro() {
    return '<div class="splash" id="splash"><div class="track"><div class="stage">' +
      '<div class="gold-line" id="sp-line" style="transform:scaleX(0)"></div>' +
      '<img class="logo" id="sp-logo" src="assets/logo.png" alt="칠통령 로고" style="transform:scale(1.55)">' +
      '<p class="copy" id="sp-copy" style="opacity:0">새 집 베란다, 칠통령이 책임져요</p>' +
      '<div class="hint" id="sp-hint"><span>아래로 스크롤</span><span class="bob">' + I.chev + '</span></div>' +
      '<div class="cta" id="sp-cta" style="opacity:0;pointer-events:none"><a class="btn btn-primary block" href="#/home" data-act="introDone">시작하기</a><span>베란다 · 다용도실 결로방지 만능 해결사</span></div>' +
      '</div></div></div>';
  }
  function setupIntro() {
    var sp = document.getElementById('splash');
    if (!sp) return;
    var logo = document.getElementById('sp-logo'), copy = document.getElementById('sp-copy'), line = document.getElementById('sp-line'), hint = document.getElementById('sp-hint'), cta = document.getElementById('sp-cta');
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
    var update = function () {
      var max = sp.scrollHeight - sp.clientHeight, p = max > 0 ? sp.scrollTop / max : 0;
      var z = clamp(p / 0.75), e = 1 - Math.pow(1 - z, 3);
      logo.style.transform = 'scale(' + (1.55 - 0.55 * e).toFixed(3) + ')';
      var late = clamp((p - 0.6) / 0.3), end = clamp((p - 0.8) / 0.2);
      copy.style.opacity = late; copy.style.transform = 'translateY(' + ((1 - late) * 12) + 'px)';
      line.style.transform = 'scaleX(' + late + ')';
      hint.style.opacity = 1 - clamp(p / 0.15);
      cta.style.opacity = end; cta.style.pointerEvents = end > 0.5 ? 'auto' : 'none';
      cta.style.transform = 'translateY(' + ((1 - end) * 16) + 'px)';
    };
    sp.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ======================================================
  // 홈
  // ======================================================
  function homeLabel() {
    var h = S.home;
    return h.apt ? h.apt + (h.dong ? ' ' + h.dong + '동' : '') + (h.ho ? ' ' + h.ho + '호' : '') : '우리 집 정보 입력';
  }
  function ddayLabel() {
    if (!S.home.date) return '입주일을 입력해 주세요';
    var p = S.home.date.split('-'), t = new Date(+p[0], +p[1] - 1, +p[2]), n0 = new Date(); n0.setHours(0, 0, 0, 0);
    var n = Math.round((t - n0) / 86400000);
    return n > 0 ? 'D-' + n : n === 0 ? 'D-Day · 오늘 입주해요' : '입주 ' + (-n) + '일째';
  }
  function viewHome() {
    var cases = (S.cases.list && S.cases.list.length ? S.cases.list : HJ.SAMPLE_CASES).slice(0, 2);
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var installCard = '';
    if (!standalone) {
      var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      installCard = '<section class="card" style="flex-direction:row;align-items:center;gap:14px"><img src="assets/icon-192.png" alt="" width="48" height="48" style="border-radius:12px;flex:none;box-shadow:0 0 0 1px #E3E7EE"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">칠통령을 앱처럼 쓰기</b><span class="hint">' +
        (S.install ? '홈 화면에 아이콘을 추가해 두면 바로 열 수 있어요' : ios ? '사파리 아래 공유 버튼 → "홈 화면에 추가"를 눌러주세요' : '브라우저 메뉴(⋮) → "홈 화면에 추가"를 눌러주세요') +
        '</span></div>' + (S.install ? '<button type="button" class="chip" aria-pressed="true" data-act="install">추가</button>' : '') + '</section>';
    }
    return '<div class="screen with-tabbar">' +
      '<header class="topbar"><div class="brand"><img src="assets/mark.png" alt="" width="44" height="12" style="height:auto">칠통령</div><a class="icon-btn" href="#/cases" aria-label="시공 사례">' + I.photo + '</a></header>' +
      '<main class="content">' +
      '<section class="hero-copy"><p class="kicker">새 집 베란다, 칠통령이 책임져요</p><h1>베란다·다용도실 탄성코트<br>결로와 곰팡이 걱정을 끝내요</h1></section>' +
      '<section class="dday" aria-label="입주 D-day"><div class="top"><span class="lbl">입주까지</span><button type="button" class="edit" data-act="openHome">' + esc(homeLabel()) + ' ' + I.pen + '</button></div>' +
      '<div class="num">' + esc(ddayLabel()) + '</div>' +
      '<div class="foot" style="gap:10px;align-items:center"><span style="font-size:12px;line-height:1.5;min-width:0">입주 준비 코스 · ' + HJ.GUIDE.map(function (st) { return esc(st[0]); }).join(' → ') + '</span><a href="#/guide" style="white-space:nowrap;flex:none">보기 →</a></div></section>' +
      '<section class="grid2">' +
      door('guide', I.check, '입주 준비 코스', '탄성코트부터 새집증후군까지') +
      door('color', I.paint, '탄성코트 색 고르기', '우리 집 사진에 미리 칠해보기') +
      door('quote', I.doc, '견적·상담 예약', '공간만 고르면 바로 계산') +
      door('book', I.cal, '시공일 예약', '날짜만 고르면 끝') +
      door('as', I.wrench, 'A/S 신청', '증상·사진 올리고 접수') +
      door('cases', I.photo, '시공 사례', '우리 단지 시공 사진') +
      '</section>' +
      myBookingCard() +
      '<section style="display:flex;flex-direction:column;gap:10px"><div class="section-head"><h2>시공 사례</h2><a href="#/cases" style="font-size:13px;font-weight:600">단지별로 보기</a></div>' +
      '<div class="thumbs">' + cases.map(function (c) {
        return '<a href="#/cases" data-act="toPhotos"><img src="' + esc(c.after) + '" alt="' + esc(c.apt) + ' 시공 사진" loading="lazy">' + esc(c.apt.replace('[예시] ', '')) + (c.color ? ' · ' + esc(c.color) : '') + '</a>';
      }).join('') + '</div></section>' +
      installCard + bizFooter() +
      '</main>' + tabbar('home') + (S.homeDraft ? sheetHome() : '') + '</div>';
  }
  function door(route, icon, t, s) {
    return '<a class="door" href="#/' + route + '"><span style="color:var(--green)">' + icon.replace('width="22" height="22"', 'width="28" height="28"') + '</span><span style="display:flex;flex-direction:column;gap:2px"><span class="t">' + t + '</span><span class="s">' + s + '</span></span></a>';
  }
  function sheetHome() {
    var d = S.homeDraft;
    return '<div class="sheet-wrap"><button type="button" class="scrim" aria-label="닫기" data-act="closeHome"></button><div class="sheet" role="dialog" aria-modal="true" aria-label="우리 집 입주 정보"><div class="grabber"></div>' +
      '<div class="sheet-head"><h2>우리 집 입주 정보</h2><button type="button" class="icon-btn" aria-label="닫기" data-act="closeHome">' + I.close + '</button></div>' +
      '<label class="field" for="h-apt">아파트 단지명<input class="input" id="h-apt" type="text" placeholder="예) 칠통령센트럴" value="' + esc(d.apt) + '" data-bind="homeDraft.apt"></label>' +
      '<div class="field"><span>동 · 호수</span><div class="row"><input class="input small" id="h-dong" type="text" inputmode="numeric" maxlength="4" aria-label="동" placeholder="101" value="' + esc(d.dong) + '" data-bind="homeDraft.dong" data-fmt="digits"><span style="margin-right:10px">동</span>' +
      '<input class="input small" id="h-ho" type="text" inputmode="numeric" maxlength="4" aria-label="호수" placeholder="1203" value="' + esc(d.ho) + '" data-bind="homeDraft.ho" data-fmt="digits"><span>호</span></div></div>' +
      '<label class="field" for="h-date">입주 예정일<input class="input" id="h-date" type="date" value="' + esc(d.date) + '" data-bind="homeDraft.date"><span class="hint" style="font-weight:500">입주일만 고르면 남은 일수는 자동으로 계산돼요</span></label>' +
      '<button type="button" class="btn btn-primary" data-act="saveHome">저장하기</button></div></div>';
  }

  // ======================================================
  // 탄성코트 색 고르기
  // ======================================================
  // 사진 픽셀 데이터는 화면 상태(S)와 따로 보관해요
  var COAT = { sample: null, mine: null };
  function coatSrc() {
    var c = S.color, src = c.mode === 'mine' ? COAT.mine : COAT.sample;
    if (!src) return '';
    var col = HJ.color(c.coat);
    return src.mask ? HJCoat.paint(src.st, src.mask, col[2]) : src.orig;
  }
  function coatRefresh() { S.color.url = coatSrc(); render(); }
  function coatPrepare() {
    if (COAT.sample || S.color.busy) return;
    S.color.busy = true;
    HJCoat.load('assets/veranda.jpg').then(function (st) {
      return HJCoat.maskFromImage(st, 'assets/veranda-mask.png').then(function (mask) { COAT.sample = { st: st, mask: mask }; });
    }).catch(function () { S.color.err = '예시 사진을 열지 못했어요.'; })
      .then(function () { S.color.busy = false; if (S.route === 'color') coatRefresh(); });
  }
  var ROOMS = [['livingV', '거실 베란다'], ['masterV', '안방 베란다'], ['laundry', '다용도실'], ['outdoor', '실외기실']];
  function viewColor() {
    var c = S.color;
    var g = HJ.color(c.coat);
    var r = ROOMS.find(function (x) { return x[0] === c.room; });
    var mine = c.mode === 'mine' && COAT.mine;
    var hint = mine ? (COAT.mine.mask ? '다른 벽도 누르면 같이 칠해져요' : '칠할 벽을 눌러주세요') : '';
    var preview = '<div class="preview coat">' +
      (c.url ? '<img src="' + esc(c.url) + '" alt="' + (mine ? '내 사진' : '예시 베란다') + '에 ' + esc(g[1]) + ' 탄성코트를 칠한 사진"' + (mine ? ' data-act="coatTap" style="cursor:crosshair"' : '') + '>' : '<div class="ph-box"></div>') +
      '<span class="badge">' + (mine ? '내 사진' : '예시 사진') + ' · ' + esc(g[1]) + '</span>' +
      (hint && !c.busy ? '<span class="tap-hint">' + esc(hint) + '</span>' : '') +
      (c.busy ? '<div class="busy">' + (mine ? '벽 찾는 중…' : '사진 준비 중…') + '</div>' : '') + '</div>';
    return '<div class="screen with-tabbar">' + topbar('탄성코트 색 고르기') +
      '<main class="content">' +
      '<div class="wrap">' + ROOMS.map(function (x) { return chip(x[1], x[0] === c.room, 'colorRoom', ' data-v="' + x[0] + '"'); }).join('') + '</div>' +
      preview +
      (c.err ? '<p class="note-err" role="alert">' + esc(c.err) + '</p>' : '') +
      '<div class="sel-info"><div class="a"><small>' + esc(r[1]) + ' · 탄성코트</small><b>' + esc(g[1]) + '</b></div><span class="tip">' + esc(g[3]) + '</span></div>' +
      '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="section-title">탄성코트 색상</h2><div class="grid3">' +
      HJ.COLORS.map(function (x) {
        return '<button type="button" class="swatch" aria-pressed="' + (x[0] === c.coat) + '" data-act="colorCoat" data-v="' + x[0] + '"><span class="dot" style="background:' + x[2] + '"></span>' + x[1] + '</button>';
      }).join('') + '</div></section>' +
      '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="section-title">우리 집 사진에 칠해보기</h2>' +
      (COAT.mine ? '<div class="row">' + chip('예시 사진', c.mode !== 'mine', 'colorMode', ' data-v="sample"') + chip('내 사진', c.mode === 'mine', 'colorMode', ' data-v="mine"') + '</div>' : '') +
      '<label class="upload">' + I.camera + (COAT.mine ? '다른 베란다 사진 올리기' : '우리 집 베란다 사진 올리기') + '<input type="file" accept="image/*" aria-label="우리 집 베란다 사진" data-file="colorPhoto"></label>' +
      (mine && COAT.mine.mask ? '<button type="button" class="btn btn-ghost" data-act="coatClear">칠한 곳 지우고 다시 고르기</button>' : '') +
      '<p class="hint">사진을 올린 뒤 칠할 벽이나 천장을 눌러주세요. 밝고 그림자가 적은 사진일수록 정확해요. 사진은 휴대폰 안에서만 처리되고 어디에도 올라가지 않아요.</p></section>' +
      '<a class="btn btn-primary" href="#/quote">이 색으로 견적 받기</a>' +
      '</main>' + tabbar('color') + '</div>';
  }

  // ======================================================
  // 견적·예약
  // ======================================================
  var MATS_Q = HJ.PRODUCTS; // 코셀코트 · 시그니처-케어 · 시그니처-프로
  var SPOTS = HJ.ITEMS.map(function (it) { return [it[0], it[1]]; });
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  function quoteCalc() {
    var q = S.quote, want = SPOTS.filter(function (sp) { return q.spots[sp[0]]; }).map(function (sp) { return sp[0]; });
    var best = HJ.bestPrice(want, q.material);
    var chosen = [];
    if (q.svc.grout) chosen.push('탄성코트');
    var mat = MATS_Q.find(function (m) { return m[0] === q.material; });
    var summary = (chosen.length ? chosen.join('+') : '서비스 선택') + (q.svc.grout && mat ? '(' + mat[1] + ')' : '') + ' ' + (q.build === 'new' ? '신축' : '구축') + q.size + '평' + (q.svc.grout ? ' · ' + HJ.color(S.color.coat)[1] : '');
    var vague = q.build === 'old';
    var estimate = q.svc.grout && want.length ? '예상 ' + best.total.toLocaleString('ko-KR') + '원' + (vague ? '~' : '') : '시공 공간을 골라주세요';
    var note = q.svc.grout && want.length ? [q.build === 'old' ? '구축 곰팡이·도막 처리 별도' : ''].filter(Boolean).join(' · ') || '탄성코트 시공 기준' : '';
    var dateLabel = '';
    if (q.day) { var p = q.day.split('-'), dd = new Date(+p[0], +p[1] - 1, +p[2]); dateLabel = p[1] + '월 ' + p[2] + '일 (' + DOW[dd.getDay()] + ')'; }
    return { chosen: chosen, mat: mat, summary: summary, estimate: estimate, note: note, dateLabel: dateLabel, best: best };
  }
  function quoteRecord() {
    var q = S.quote, c = quoteCalc();
    return {
      services: c.chosen, material: q.svc.grout && c.mat ? c.mat[1] : '', product: q.svc.grout ? q.material : '', color: q.svc.grout ? HJ.color(S.color.coat)[1] : '', build: q.build === 'new' ? '신축' : '구축',
      size: q.size, spots: q.svc.grout ? SPOTS.filter(function (sp) { return q.spots[sp[0]]; }).map(function (sp) { return sp[1]; }) : [],
      date: c.dateLabel, day: q.day || '', phone: q.phone, memo: q.memo || '', estimate: c.estimate + (c.note ? ' (' + c.note + ')' : ''),
      home: S.home.apt ? homeLabel() : '', moveIn: S.home.date || ''
    };
  }
  function calendar() {
    var q = S.quote, v = q.view, t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var first = new Date(v.y, v.m, 1).getDay(), nDays = new Date(v.y, v.m + 1, 0).getDate();
    var curMonth = v.y === t0.getFullYear() && v.m === t0.getMonth();
    var html = '<div class="cal-head"><button type="button" class="icon-btn" aria-label="이전 달" data-act="calPrev"' + (curMonth ? ' disabled style="opacity:.3"' : '') + '>' + I.back + '</button><b>' + v.y + '년 ' + (v.m + 1) + '월</b><button type="button" class="icon-btn" aria-label="다음 달" data-act="calNext">' + I.next + '</button></div><div class="cal">';
    DOW.forEach(function (d, i) { html += '<span class="dow' + (i === 0 ? ' sun' : '') + '">' + d + '</span>'; });
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= nDays; d++) {
      var dt = new Date(v.y, v.m, d), wd = dt.getDay();
      var off = dt < t0, key = v.y + '-' + pad(v.m + 1) + '-' + pad(d);
      var cls = (dt.getTime() === t0.getTime() ? 'today ' : '') + (wd === 0 ? 'sun' : '');
      html += '<button type="button" class="' + cls + '" aria-pressed="' + (q.day === key) + '" aria-label="' + (v.m + 1) + '월 ' + d + '일' + (off ? ' 선택 불가' : '') + '"' + (off ? ' disabled' : ' data-act="pickDay" data-v="' + key + '"') + '>' + d + '</button>';
    }
    return html + '</div>';
  }
  function viewQuote() {
    var q = S.quote, c = quoteCalc();
    var stepper = function (label, val, key) {
      return '<div class="stepper"><span style="font-size:15px">' + label + '</span><div class="ctrl"><button type="button" aria-label="' + label + ' 줄이기" data-act="step" data-k="' + key + '" data-d="-1">−</button><span class="val">' + val + '</span><button type="button" aria-label="' + label + ' 늘리기" data-act="step" data-k="' + key + '" data-d="1">+</button></div></div>';
    };
    var step = 2;
    var html = '<div class="screen with-footer">' + topbar('예약') + '<main class="content">' + bookSeg('quote') +
      '<p class="hint" style="margin:0">견적을 계산해 보고, 상담받고 싶은 날짜를 골라 신청하세요. 칠통령에서 전화드려요.</p>' +
      '<section class="card" style="gap:4px"><h2 style="margin-bottom:6px">1. 집 정보</h2>' +
      '<div class="stepper"><span style="font-size:15px">건물</span><div class="ctrl">' + [['new', '신축'], ['old', '구축']].map(function (b) {
        return '<button type="button" class="tile center" style="min-height:44px;min-width:64px;font-size:14px;font-weight:600" aria-pressed="' + (q.build === b[0]) + '" data-act="build" data-v="' + b[0] + '">' + b[1] + '</button>';
      }).join('') + '</div></div>' +
      stepper('평수', q.size + '평', 'size') + '</section>';
    if (q.svc.grout) {
      html += '<section class="card"><h2>' + (step++) + '. 탄성코트 재료와 시공 공간</h2><span style="font-size:13px;font-weight:600;color:var(--muted)">탄성코트 재료</span><div class="wrap">' +
        MATS_Q.map(function (m) { return chip(m[1], q.material === m[0], 'material', ' data-v="' + m[0] + '"'); }).join('') +
        '</div><span style="font-size:13px;font-weight:600;color:var(--muted)">시공 공간</span><div class="wrap">' +
        SPOTS.map(function (sp) { return chip(sp[1], !!q.spots[sp[0]], 'spot', ' data-v="' + sp[0] + '"', 'soft'); }).join('') + '</div>' +
        '<div class="sel-info" style="padding:10px 12px;background:var(--line-2)"><div class="a" style="flex-direction:row;align-items:center;gap:8px"><span class="dot-lg" style="background:' + HJ.color(S.color.coat)[2] + '"></span><b style="font-size:15px">' + esc(HJ.color(S.color.coat)[1]) + '</b></div><a href="#/color" style="font-size:13px;font-weight:600">색 바꾸기 →</a></div></section>';
    } else step++;
    html += '<section class="card" style="gap:10px"><h2>' + step + '. 희망 날짜</h2>' + calendar() +
      (c.dateLabel ? '<p style="margin:0;font-size:14px;font-weight:600;color:var(--green)">선택한 날짜: ' + c.dateLabel + '</p>' : '') +
      '<p class="hint">탄성코트는 건조·환기 시간이 필요해서 입주 최소 3일 전에 하는 걸 추천해요. 토·일요일도 시공해요.</p></section>' +
      '</main><div class="footer-bar"><div class="sum-line"><span class="l">' + esc(c.summary) + '</span><span class="r">' + esc(c.estimate) + '</span></div>' +
      (c.note ? '<span class="note-gold" style="margin-top:-6px">' + esc(c.note) + '</span>' : '') +
      '<button type="button" class="btn btn-primary" data-act="openConsult">상담 예약 신청</button>' +
      '<button type="button" class="btn btn-ghost" style="min-height:36px" data-act="toBook">상담 없이 바로 시공일 예약하기 →</button></div>' +
      (q.sheet ? sheetConsult(c) : '') + '</div>';
    return html;
  }
  function sheetConsult(c) {
    var q = S.quote;
    var inner;
    if (q.sheet === 'done') {
      inner = '<div class="done-box"><div class="mark">' + I.ok + '</div><h2>상담 신청이 접수됐어요</h2><p>' + esc(q.phone) + ' 번호로<br>담당자가 곧 연락드릴게요.</p></div><a class="btn btn-primary" href="#/home" data-act="closeConsult">홈으로</a>';
    } else {
      inner = '<div class="sheet-head"><h2>상담 예약 신청</h2><button type="button" class="icon-btn" aria-label="닫기" data-act="closeConsult">' + I.close + '</button></div>' +
        '<div class="callout" style="display:flex;flex-direction:column;gap:4px"><span style="font-size:12px;font-weight:600;color:var(--gold-t)">신청 내용</span><b style="font-size:14px;color:var(--ink)">' + esc(c.summary) + '</b><span style="font-size:13px;color:var(--muted)">희망 날짜: ' + esc(c.dateLabel || '상담 때 정하기') + ' · ' + esc(c.estimate) + '</span></div>' +
        '<label class="field" for="q-phone">연락처<input class="input" id="q-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(q.phone) + '" data-bind="quote.phone" data-fmt="phone"></label>' +
        '<label class="field" for="q-memo">문의 내용<textarea class="textarea" id="q-memo" rows="4" placeholder="예) 거실·안방 베란다랑 다용도실 탄성코트 하고 싶어요. 오후 시간 통화가 편해요." data-bind="quote.memo">' + esc(q.memo) + '</textarea></label>' +
        '<label class="check"><input type="checkbox" data-check="quote.agree"' + (q.agree ? ' checked' : '') + '>상담을 위한 개인정보(연락처) 수집·이용에 동의해요 <a href="privacy.html" target="_blank" style="font-size:12px;margin-left:auto">보기</a></label>' +
        (q.formErr ? '<p class="note-err" role="alert">' + esc(q.formErr) + '</p>' : '') +
        '<button type="button" class="btn btn-primary" data-act="sendConsult"' + (q.sending ? ' disabled' : '') + '>' + (q.sending ? '보내는 중…' : '신청하기') + '</button>';
    }
    return '<div class="sheet-wrap"><button type="button" class="scrim" aria-label="닫기" data-act="closeConsult"></button><div class="sheet" role="dialog" aria-modal="true" aria-label="상담 예약 신청"><div class="grabber"></div>' + inner + '</div></div>';
  }

  // ======================================================
  // 시공일 예약 (날짜만 고르고, 시간은 칠통령이 연락해서 정함)
  // ======================================================
  // 카카오톡·네이버·인스타 등 앱 안 브라우저 (파일 내려받기가 막혀 있어요)
  var IS_KAKAO = /KAKAOTALK/i.test(navigator.userAgent || '');
  var IN_APP = /KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(navigator.userAgent || '');
  var BOOK = Object.assign({ leadDays: 7, changeLeadDays: 7, perDay: 1, monthsAhead: 6 }, CFG.BOOKING || {});
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayLabel(key) {
    if (!key) return '';
    var p = key.split('-'), dd = new Date(+p[0], +p[1] - 1, +p[2]);
    return (+p[1]) + '월 ' + (+p[2]) + '일 (' + DOW[dd.getDay()] + ')';
  }
  function bookRange(lead) {
    var first = new Date(); first.setHours(0, 0, 0, 0); first.setDate(first.getDate() + (lead == null ? BOOK.leadDays : lead));
    var last = new Date(); last.setHours(0, 0, 0, 0); last.setMonth(last.getMonth() + BOOK.monthsAhead);
    return { first: first, last: last };
  }
  function newBooking() {
    var h = S.home, rg = bookRange(), draft = load('chil-quote', null);
    return {
      view: { y: rg.first.getFullYear(), m: rg.first.getMonth() }, day: null,
      product: draft && draft.material && HJ.PRODUCTS.some(function (p) { return p[1] === draft.material; }) ? draft.material : '',
      color: draft && draft.color && HJ.color(draft.color) ? HJ.color(draft.color)[1] : (S.color && S.color.coat && HJ.color(S.color.coat) ? HJ.color(S.color.coat)[1] : ''),
      access: '', julnun: '', clean: '',
      name: '', phone: draft && draft.phone ? draft.phone : '', region: '', apt: h.apt || '', dong: h.dong || '', ho: h.ho || '', memo: '',
      quote: draft && draft.services && draft.services.length ? draft : null,
      agree: false, err: '', sending: false, sched: null, schedErr: '', loading: false, done: null
    };
  }
  // 마감 정보는 앱을 열 때 미리 받아 둬요 → 예약 화면에 들어가면 바로 보여요
  var schedP = null, schedAt = 0;
  function fetchSchedule(fresh) {
    if (!API.ready) return Promise.reject(new Error('noapi'));
    if (fresh || !schedP || Date.now() - schedAt > 120000) {
      schedAt = Date.now();
      schedP = API.get('schedule');
      schedP.catch(function () { schedP = null; });
    }
    return schedP;
  }
  function loadSchedule(b, routeName, fresh) {
    b = b || S.book; routeName = routeName || 'book';
    if (!API.ready || b.loading) return;
    b.loading = true;
    fetchSchedule(fresh).then(function (j) { b.sched = { counts: j.counts || {}, closed: j.closed || [] }; b.schedErr = ''; })
      .catch(function () { b.schedErr = '마감된 날짜를 불러오지 못했어요. 신청 후 날짜가 안 되면 다시 연락드릴게요.'; })
      .then(function () { b.loading = false; if (S.route === routeName) render(); });
  }
  function dayState(key, dt, b, lead) {
    var rg = bookRange(lead), sc = (b || S.book).sched;
    if (dt < rg.first || dt > rg.last) return 'off';
    if (sc && (sc.closed.indexOf(key) >= 0 || (sc.counts[key] || 0) >= BOOK.perDay)) return 'full';
    return 'open';
  }
  function bookCalendar(b, pre, lead) {
    b = b || S.book; pre = pre || 'bk';
    var v = b.view, rg = bookRange(lead), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var first = new Date(v.y, v.m, 1).getDay(), nDays = new Date(v.y, v.m + 1, 0).getDate();
    var canPrev = new Date(v.y, v.m, 1) > new Date(rg.first.getFullYear(), rg.first.getMonth(), 1);
    var canNext = new Date(v.y, v.m + 1, 1) <= rg.last;
    var html = '<div class="cal-head"><button type="button" class="icon-btn" aria-label="이전 달" data-act="' + pre + 'Prev"' + (canPrev ? '' : ' disabled style="opacity:.3"') + '>' + I.back + '</button><b>' + v.y + '년 ' + (v.m + 1) + '월</b><button type="button" class="icon-btn" aria-label="다음 달" data-act="' + pre + 'Next"' + (canNext ? '' : ' disabled style="opacity:.3"') + '>' + I.next + '</button></div><div class="cal bk">';
    DOW.forEach(function (d, i) { html += '<span class="dow' + (i === 0 ? ' sun' : '') + '">' + d + '</span>'; });
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= nDays; d++) {
      var dt = new Date(v.y, v.m, d), key = dayKey(dt), st = dayState(key, dt, b, lead);
      var cls = (dt.getTime() === t0.getTime() ? 'today ' : '') + (dt.getDay() === 0 ? 'sun ' : '') + (st === 'full' ? 'full' : '');
      html += '<button type="button" class="' + cls + '" aria-pressed="' + (b.day === key) + '" aria-label="' + (v.m + 1) + '월 ' + d + '일' + (st === 'full' ? ' 마감' : st === 'off' ? ' 선택 불가' : '') + '"' +
        (st === 'open' ? ' data-act="' + pre + 'Day" data-v="' + key + '"' : ' disabled') + '>' + d + (st === 'full' ? '<small>마감</small>' : '') + '</button>';
    }
    return html + '</div>';
  }
  // 예약 탭 위쪽: 상담 예약 / 시공일 예약 전환
  function bookSeg(active) {
    return '<nav class="seg" aria-label="예약 종류">' + [['quote', '상담 예약'], ['book', '시공일 예약'], ['as', 'A/S 신청']].map(function (t) {
      return '<a href="#/' + t[0] + '"' + (active === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
    }).join('') + '</nav>';
  }
  // 예약할 때 · 예약을 바꿀 때 같이 쓰는 칸들
  var ACCESS = ['임시키', '잔금 치르고 현관 비밀번호'];
  function pickChips(list, cur, key) {
    return '<div class="wrap">' + list.map(function (v) { return chip(v, cur === v, 'pick', ' data-k="' + key + '" data-v="' + esc(v) + '"'); }).join('') + '</div>';
  }
  function productColorFields(b, key) {
    return '<div class="field"><span>시공 제품</span>' + pickChips(HJ.PRODUCTS.map(function (p) { return p[1]; }), b.product, key + '.product') + '</div>' +
      '<div class="field"><span>시공 색상 <a href="#/color" style="font-size:12px;font-weight:600;margin-left:6px">색 미리보기 →</a></span>' + pickChips(HJ.COLORS.map(function (c) { return c[1]; }), b.color, key + '.color') + '</div>';
  }
  function extraFields(b, key, idp) {
    return '<div class="field"><span>출입 방법</span>' + pickChips(ACCESS, b.access, key + '.access') + '<span class="hint" style="font-weight:500">현관 비밀번호는 잔금 치른 뒤 칠통령에 따로 알려주세요</span></div>' +
      '<div class="row" style="gap:10px;align-items:flex-start">' +
      '<label class="field" for="' + idp + '-jul" style="flex:1;min-width:0">줄눈 시공 일정<input class="input" id="' + idp + '-jul" type="text" placeholder="예) 11월 20일" value="' + esc(b.julnun) + '" data-bind="' + key + '.julnun"></label>' +
      '<label class="field" for="' + idp + '-cln" style="flex:1;min-width:0">입주청소 일정<input class="input" id="' + idp + '-cln" type="text" placeholder="예) 미정" value="' + esc(b.clean) + '" data-bind="' + key + '.clean"></label></div>' +
      '<label class="field" for="' + idp + '-memo">남길 말 · 특이사항 (선택)<textarea class="textarea" id="' + idp + '-memo" rows="3" placeholder="탄성은 첫날 잡으시는 게 좋아요 :)&#10;부탁하실 내용이나 특이사항을 적어주세요 !" data-bind="' + key + '.memo">' + esc(b.memo) + '</textarea></label>';
  }
  function viewBook() {
    var b = S.book;
    if (b.done) return viewBookDone();
    var phone = BIZ.phone && BIZ.phone.indexOf('[') < 0 ? BIZ.phone : '';
    return '<div class="screen with-footer">' + topbar('예약') + '<main class="content">' + bookSeg('book') +
      '<div class="callout">시공 <b>날짜만</b> 골라주세요. 시간은 칠통령에서 미리 연락드려 정해요.</div>' +
      '<a class="card my-link" href="#/mybook"><span style="color:var(--green)">' + I.cal + '</span><span style="flex:1;min-width:0"><b>이미 예약하셨나요?</b><span class="hint">내 예약 확인 · 날짜 변경 · 취소</span></span>' + I.next + '</a>' +
      '<section class="card"><h2>1. 시공 제품 · 색상</h2>' + productColorFields(b, 'book') +
      (b.quote ? '<div class="sel-info" style="padding:10px 12px;background:var(--line-2)"><div class="a"><small>견적 내용</small><b style="font-size:14px">' + esc((b.quote.spots || []).join(', ') || b.quote.services.join(', ')) + '</b></div><a href="#/quote" style="font-size:13px;font-weight:600;white-space:nowrap">고치기 →</a></div>' : '') + '</section>' +
      '<section class="card" style="gap:10px"><h2>2. 시공 날짜</h2>' + bookCalendar() +
      '<div class="row" style="gap:14px;font-size:12px;color:var(--muted)"><span class="row" style="gap:6px"><i class="lg lg-open"></i>예약 가능</span><span class="row" style="gap:6px"><i class="lg lg-full"></i>마감</span><span class="row" style="gap:6px"><i class="lg lg-off"></i>선택 불가</span></div>' +
      (b.schedErr ? '<p class="note-err">' + esc(b.schedErr) + '</p>' : '') +
      '<p class="hint">시공 희망일 최소 1주 전에 예약해 주세요. 1주 안쪽 날짜는 ' + (phone ? '<b>' + esc(phone) + '</b>로 ' : '') + '전화 문의해 주세요.<br>토·일요일도 시공해요.</p></section>' +
      '<section class="card"><h2>3. 예약하시는 분</h2>' +
      '<label class="field" for="b-name">이름<input class="input" id="b-name" type="text" autocomplete="name" placeholder="홍길동" value="' + esc(b.name) + '" data-bind="book.name"></label>' +
      '<label class="field" for="b-phone">연락처<input class="input" id="b-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(b.phone) + '" data-bind="book.phone" data-fmt="phone"></label>' +
      '<label class="field" for="b-region">지역 (시·구)<input class="input" id="b-region" type="text" list="region-list" placeholder="예) 부천, 천안, 부산" value="' + esc(b.region) + '" data-bind="book.region"><span class="hint" style="font-weight:500">같은 지역 고객끼리 묶어서 기사님이 찾아가요</span></label>' +
      '<datalist id="region-list">' + (BOOK.regions || []).map(function (r) { return '<option value="' + esc(r) + '">'; }).join('') + '</datalist>' +
      '<label class="field" for="b-apt">아파트명<input class="input" id="b-apt" type="text" placeholder="예) 칠통령센트럴" value="' + esc(b.apt) + '" data-bind="book.apt"></label>' +
      '<div class="field"><span>동 / 호수</span><div class="row"><input class="input small" id="b-dong" type="text" inputmode="numeric" maxlength="4" aria-label="동" placeholder="101" value="' + esc(b.dong) + '" data-bind="book.dong" data-fmt="digits"><span style="margin-right:10px">동</span>' +
      '<input class="input small" id="b-ho" type="text" inputmode="numeric" maxlength="4" aria-label="호수" placeholder="1203" value="' + esc(b.ho) + '" data-bind="book.ho" data-fmt="digits"><span>호</span></div></div>' +
      '</section><section class="card"><h2>4. 출입 · 일정 · 남길 말</h2>' + extraFields(b, 'book', 'b') +
      '<label class="check"><input type="checkbox" data-check="book.agree"' + (b.agree ? ' checked' : '') + '>예약을 위한 개인정보(이름·연락처·주소) 수집·이용에 동의해요 <a href="privacy.html" target="_blank" style="font-size:12px;margin-left:auto">보기</a></label></section>' +
      (b.err ? '<p class="note-err" role="alert" style="font-size:13px">' + esc(b.err) + '</p>' : '') +
      '</main><div class="footer-bar"><div class="sum-line"><span class="l">시공 희망일</span><span class="r">' + esc(b.day ? dayLabel(b.day) : '날짜를 골라주세요') + '</span></div>' +
      '<button type="button" class="btn btn-primary" data-act="bkSend"' + (b.sending ? ' disabled' : '') + '>' + (b.sending ? '보내는 중…' : '시공일 예약 신청') + '</button></div></div>';
  }
  function viewBookDone() {
    var d = S.book.done;
    return '<div class="screen with-tabbar">' + topbar('시공일 예약') + '<main class="content">' +
      '<div class="done-box"><div class="mark">' + I.ok + '</div><h2>예약 신청이 접수됐어요</h2><p><b style="color:var(--ink)">' + esc(dayLabel(d.day)) + '</b> 시공으로 신청하셨어요.<br>칠통령에서 ' + esc(d.phone) + ' 번호로 연락드려<br>시간을 정하고 예약을 확정해 드릴게요.</p></div>' +
      (d.sendErr ? '<div class="callout" role="alert" style="color:var(--err)">' + esc(d.sendErr) + '</div>' : '') +
      '<a class="btn btn-primary" href="#/home">홈으로</a>' +
      '<a class="btn btn-ghost" href="#/mybook">내 예약 확인 · 변경 · 취소</a>' +
      '</main>' + tabbar('book') + '</div>';
  }
  // ---------- 내 예약: 확인 · 변경 · 취소 ----------
  function newMy() {
    var bk = load('chil-booking', null) || {};
    return { name: bk.name || '', phone: bk.phone || '', list: null, busy: false, err: '', edit: null, sched: null, loading: false, changeDays: 3 };
  }
  function myFind() {
    var m = S.my;
    if (!API.ready) { m.err = '아직 서버 연결 전이에요.'; return render(); }
    m.busy = true; m.err = ''; render();
    API.post({ action: 'myBookings', name: m.name.trim(), phone: m.phone }).then(function (j) {
      m.list = j.bookings || []; m.changeDays = j.changeDays || 3;
      syncHomeCards(m.list);
      if (m.openId) { // A/S 신청 완료 화면에서 왔으면 그 신청의 수정 화면을 바로 열어요
        var want = m.list.find(function (x) { return x.id === m.openId; }) || m.list.filter(function (x) { return x.kind === 'AS'; }).pop();
        m.openId = null;
        if (want && !want.locked) { m.busy = false; ACT.myEdit({ dataset: { v: want.id } }); return; }
      }
    }).catch(function () { m.err = '예약을 불러오지 못했어요. 잠시 뒤 다시 눌러주세요.'; })
      .then(function () { m.busy = false; render(); });
  }
  var MY_ERR = { locked: '시공일이 가까워서 앱에서는 바꿀 수 없어요. 전화로 말씀해 주세요.', lead: '오늘부터 ' + BOOK.changeLeadDays + '일 뒤 날짜부터 고를 수 있어요.', full: '그날은 마감됐어요. 다른 날짜를 골라주세요.', auth: '이름과 연락처가 예약할 때와 달라요.', cancelled: '이미 취소된 예약이에요.' };
  function viewMy() {
    var m = S.my, phone = BIZ.phone && BIZ.phone.indexOf('[') < 0 ? BIZ.phone : '';
    var top = '<div class="screen with-tabbar">' + topbar('내 예약') + '<main class="content">';
    var end = '</main>' + tabbar('book') + '</div>';
    if (m.edit) return '<div class="screen with-footer">' + topbar(m.edit.isAS ? 'A/S 신청 수정' : '예약 바꾸기') + '<main class="content">' + (m.edit.isAS ? viewMyEditAS() : viewMyEdit()) + '</main>' +
      '<div class="footer-bar">' + (m.edit.isAS ? '' : '<div class="sum-line"><span class="l">시공일</span><span class="r">' + esc(dayLabel(m.edit.day)) + '</span></div>') +
      '<div class="row" style="gap:8px"><button type="button" class="btn btn-ghost" style="flex:1" data-act="myEditClose">닫기</button><button type="button" class="btn btn-primary" style="flex:2" data-act="mySave"' + (m.busy ? ' disabled' : '') + '>' + (m.busy ? '저장 중…' : '바꾼 내용 저장') + '</button></div></div></div>';
    var find = '<section class="card"><h2>예약할 때 적은 이름 · 연락처</h2>' +
      '<label class="field" for="m-name">이름<input class="input" id="m-name" type="text" autocomplete="name" placeholder="홍길동" value="' + esc(m.name) + '" data-bind="my.name"></label>' +
      '<label class="field" for="m-phone">연락처<input class="input" id="m-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(m.phone) + '" data-bind="my.phone" data-fmt="phone"></label>' +
      (m.err ? '<p class="note-err" role="alert">' + esc(m.err) + '</p>' : '') +
      '<button type="button" class="btn btn-primary" data-act="myFind"' + (m.busy ? ' disabled' : '') + '>' + (m.busy ? '찾는 중…' : '내 예약 찾기') + '</button></section>';
    if (m.list === null) return top + '<div class="callout">시공일 예약과 A/S 신청을 확인하고 <b>날짜 변경 · 내용 수정 · 취소</b>를 할 수 있어요.</div>' + find + end;
    var html = top;
    if (m.err) html += '<p class="note-err" role="alert">' + esc(m.err) + '</p>';
    if (!m.list.length) html += '<div class="empty"><b>확인할 예약 · A/S 신청이 없어요</b><span>이름과 연락처를 예약할 때와 똑같이 적었는지 확인해 주세요.</span></div>' + find;
    m.list.forEach(function (b) {
      var addr = b.apt + (b.dong ? ' ' + b.dong + '동' : '') + (b.ho ? ' ' + b.ho + '호' : '');
      var line = function (k, v) { return v ? '<div class="my-row"><span>' + k + '</span><b>' + esc(v) + '</b></div>' : ''; };
      if (b.kind === 'AS') {
        html += '<section class="card my-bk"><div class="top"><b style="font-size:18px"><span class="rg as" style="vertical-align:3px">A/S</span> ' + esc(b.day ? dayLabel(b.day) + ' 방문' : '방문 일정 조율 중') + '</b><span class="st ' + (b.status === '확정' ? 'st-ok' : 'st-wait') + '">' + (b.status === '확정' ? '방문 확정' : '접수됨') + '</span></div>' +
          '<div class="my-rows">' + line('주소', addr) + line('증상', b.symptom) + line('내용', b.memo) + line('시공 시기', b.when) + '</div>' +
          ((b.photos || []).length ? '<span class="bk-photos">' + b.photos.map(function (u, i) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '=w400" alt="A/S 사진 ' + (i + 1) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + esc(u) + '\'"></a>'; }).join('') + '</span>' : '') +
          (b.locked ? '<div class="callout">방문일이 가까워서 앱에서는 바꿀 수 없어요. ' + (phone ? '<b>' + esc(phone) + '</b>로 ' : '') + '전화 주세요.</div>' :
            '<div class="row" style="gap:8px"><button type="button" class="btn btn-primary" style="flex:2;min-height:48px" data-act="myEdit" data-v="' + esc(b.id) + '">내용 · 사진 수정</button><button type="button" class="btn btn-ghost" style="flex:1;min-height:48px;color:var(--err)" data-act="myCancel" data-v="' + esc(b.id) + '">신청 취소</button></div>') +
          '</section>';
        return;
      }
      html += '<section class="card my-bk"><div class="top"><b style="font-size:18px">' + esc(dayLabel(b.day)) + '</b><span class="st ' + (b.status === '확정' ? 'st-ok' : 'st-wait') + '">' + (b.status === '확정' ? '예약 확정' : '시간 조율 중') + '</span></div>' +
        '<div class="my-rows">' + line('주소', addr) + line('시공 제품', b.product) + line('색상', b.color) + line('출입 방법', b.access) + line('줄눈 시공', b.julnun) + line('입주청소', b.clean) + line('남길 말', b.memo) + '</div>' +
        (b.locked ? '<div class="callout">시공 ' + m.changeDays + '일 전부터는 앱에서 바꿀 수 없어요. ' + (phone ? '<b>' + esc(phone) + '</b>로 ' : '') + '전화 주세요.</div>' :
          '<div class="row" style="gap:8px"><button type="button" class="btn btn-primary" style="flex:2;min-height:48px" data-act="myEdit" data-v="' + esc(b.id) + '">날짜 · 내용 바꾸기</button><button type="button" class="btn btn-ghost" style="flex:1;min-height:48px;color:var(--err)" data-act="myCancel" data-v="' + esc(b.id) + '">예약 취소</button></div>') +
        '</section>';
    });
    if (m.list.length) html += '<p class="hint" style="text-align:center">날짜를 바꾸면 칠통령에서 다시 연락드려 시간을 정해요.<br>시공 ' + m.changeDays + '일 전까지 앱에서 바꿀 수 있어요.</p>' +
      '<button type="button" class="btn btn-ghost" data-act="myReset">다른 이름 · 번호로 찾기</button>';
    return html + end;
  }
  function viewMyEdit() {
    var e = S.my.edit;
    return '<section class="card" style="gap:10px"><h2>시공 날짜</h2>' + bookCalendar(e, 'my', BOOK.changeLeadDays) +
      '<div class="row" style="gap:14px;font-size:12px;color:var(--muted)"><span class="row" style="gap:6px"><i class="lg lg-open"></i>예약 가능</span><span class="row" style="gap:6px"><i class="lg lg-full"></i>마감</span><span class="row" style="gap:6px"><i class="lg lg-off"></i>선택 불가</span></div>' +
      (e.day !== e.orig.day ? '<p class="hint" style="color:var(--err)">' + esc(dayLabel(e.orig.day)) + ' → <b>' + esc(dayLabel(e.day)) + '</b> 로 바뀌어요. 칠통령에서 다시 연락드려 시간을 정해요.</p>' : '<p class="hint">날짜는 그대로 두고 아래 내용만 바꿔도 돼요.</p>') + '</section>' +
      '<section class="card"><h2>시공 제품 · 색상</h2>' + productColorFields(e, 'my.edit') + '</section>' +
      '<section class="card"><h2>출입 · 일정 · 남길 말</h2>' + extraFields(e, 'my.edit', 'me') + '</section>' +
      (S.my.err ? '<p class="note-err" role="alert" style="font-size:13px">' + esc(S.my.err) + '</p>' : '');
  }
  function viewMyEditAS() {
    var e = S.my.edit;
    return '<div class="callout">방문 날짜는 칠통령에서 연락드려 정해요. 증상 · 내용 · 사진만 고칠 수 있어요.</div>' +
      '<section class="card"><h2>어떤 문제가 있나요?</h2><div class="wrap">' +
      AS_SYMPTOMS.map(function (x) { return chip(x[1], !!e.sym[x[0]], 'mySym', ' data-v="' + x[0] + '"', 'soft'); }).join('') + '</div>' +
      '<label class="field" for="me-memo">자세한 내용<textarea class="textarea" id="me-memo" rows="3" data-bind="my.edit.memo">' + esc(e.memo) + '</textarea></label>' +
      '<div class="field"><span>사진 (최대 3장)</span><div class="as-photos">' +
      e.photos.map(function (p, i) { var src = /^data:/.test(p) ? p : p + '=w400'; return '<div class="as-ph"><img src="' + esc(src) + '" alt="사진 ' + (i + 1) + '" referrerpolicy="no-referrer"><button type="button" aria-label="사진 ' + (i + 1) + ' 빼기" data-act="myPhotoDel" data-v="' + i + '">' + I.close + '</button></div>'; }).join('') +
      (e.photos.length < 3 ? '<label class="as-add">' + I.camera + '<span>사진 추가</span><input type="file" accept="image/*" aria-label="문제 부분 사진" data-file="myPhoto"></label>' : '') + '</div></div>' +
      '<label class="field" for="me-when">시공받은 시기 (선택)<input class="input" id="me-when" type="text" placeholder="예) 2025년 3월쯤" value="' + esc(e.when) + '" data-bind="my.edit.when"></label></section>' +
      (S.my.err ? '<p class="note-err" role="alert" style="font-size:13px">' + esc(S.my.err) + '</p>' : '');
  }
  function homeCard(icon, title, hint) {
    return '<a class="card" href="#/mybook" style="flex-direction:row;align-items:center;gap:12px;text-decoration:none;color:inherit"><span style="color:var(--green)">' + icon + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">' + title + '</b><span class="hint">' + hint + '</span></span>' + I.next + '</a>';
  }
  function notPast(day) {
    var p = String(day).split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    return dt >= t0;
  }
  function myBookingCard() {
    var bk = load('chil-booking', null), as = load('chil-as', null), html = '';
    if (bk && bk.day && notPast(bk.day)) html += homeCard(I.cal, '내 시공 예약 · ' + esc(dayLabel(bk.day)), '눌러서 확인 · 날짜 변경 · 취소');
    if (as && as.n && (!as.day || notPast(as.day)))
      html += homeCard(I.wrench, '내 A/S 신청 · ' + (as.day ? esc(dayLabel(as.day)) + ' 방문' : '방문 일정 조율 중') + (as.n > 1 ? ' 외 ' + (as.n - 1) + '건' : ''), '눌러서 확인 · 내용 수정 · 취소');
    return html;
  }
  // 내 예약을 불러오거나 바꾼 뒤 홈 카드 정보를 맞춰요
  function syncHomeCards(list) {
    var books = list.filter(function (x) { return x.kind !== 'AS'; }), ass = list.filter(function (x) { return x.kind === 'AS'; });
    save('chil-booking', Object.assign(load('chil-booking', {}) || {}, { name: S.my.name.trim(), phone: S.my.phone, day: books[0] ? books[0].day : '' }));
    save('chil-as', ass.length ? { n: ass.length, day: ass[0].day || '' } : null);
  }

  // ======================================================
  // A/S 신청 (시공 후 하자 · 날짜만 고르고, 시간은 칠통령이 연락)
  // ======================================================
  var AS_SYMPTOMS = [['peel', '들뜸·벗겨짐'], ['crack', '갈라짐'], ['mold', '곰팡이 재발'], ['stain', '얼룩·변색'], ['etc', '기타']];
  function newAS() {
    var h = S.home, rg = bookRange(BOOK.asLeadDays), last = load('chil-booking', null) || {};
    return {
      view: { y: rg.first.getFullYear(), m: rg.first.getMonth() }, day: null,
      name: last.name || '', phone: last.phone || '', region: '', apt: h.apt || '', dong: h.dong || '', ho: h.ho || '',
      when: '', sym: {}, memo: '', photos: [], agree: false, err: '', sending: false, sched: null, schedErr: '', loading: false, done: null
    };
  }
  function viewAS() {
    var a = S.as;
    if (a.done) return viewASDone();
    var phone = BIZ.phone && BIZ.phone.indexOf('[') < 0 ? BIZ.phone : '';
    return '<div class="screen with-footer">' + topbar('예약') + '<main class="content">' + bookSeg('as') +
      '<div class="callout">칠통령에서 시공한 곳에 문제가 생겼나요? <b>증상과 사진</b>을 남겨주시면 확인 후 칠통령에서 연락드려 <b>방문 일정을 잡아드려요</b>.<br><span style="display:block;margin-top:6px">A/S는 시공 일정 사이에 방문해야 해서 <b>일정을 잡기까지 시간이 걸릴 수 있어요.</b> 너그러운 양해 부탁드려요.</span></div>' +
      '<a class="card my-link" href="#/mybook"><span style="color:var(--green)">' + I.wrench + '</span><span style="flex:1;min-width:0"><b>이미 신청하셨나요?</b><span class="hint">내 A/S 신청 확인 · 수정 · 취소</span></span>' + I.next + '</a>' +
      '<section class="card"><h2>1. 어떤 문제가 있나요?</h2><div class="wrap">' +
      AS_SYMPTOMS.map(function (x) { return chip(x[1], !!a.sym[x[0]], 'asSym', ' data-v="' + x[0] + '"', 'soft'); }).join('') + '</div>' +
      '<label class="field" for="a-memo">자세한 내용<textarea class="textarea" id="a-memo" rows="3" placeholder="예) 다용도실 천장 모서리가 들떠서 벗겨지고 있어요." data-bind="as.memo">' + esc(a.memo) + '</textarea></label>' +
      '<div class="field"><span>사진 (선택 · 최대 3장)</span><div class="as-photos">' +
      a.photos.map(function (p, i) { return '<div class="as-ph"><img src="' + p + '" alt="첨부 사진 ' + (i + 1) + '"><button type="button" aria-label="사진 ' + (i + 1) + ' 빼기" data-act="asPhotoDel" data-v="' + i + '">' + I.close + '</button></div>'; }).join('') +
      (a.photos.length < 3 ? '<label class="as-add">' + I.camera + '<span>사진 추가</span><input type="file" accept="image/*" aria-label="문제 부분 사진" data-file="asPhoto"></label>' : '') +
      '</div><span class="hint" style="font-weight:500">문제 부분이 잘 보이게 찍어주시면 확인이 빨라요</span></div></section>' +
      '<p class="hint" style="margin:0">급한 경우' + (phone ? ' <b>' + esc(phone) + '</b>로' : '') + ' 바로 전화 주세요. 사용상 과실이나 외부요인(크랙·누수·균열)으로 생긴 문제는 유상으로 보수돼요.</p>' +
      '<section class="card"><h2>2. 시공받으신 곳</h2>' +
      '<label class="field" for="a-name">이름<input class="input" id="a-name" type="text" autocomplete="name" placeholder="홍길동" value="' + esc(a.name) + '" data-bind="as.name"></label>' +
      '<label class="field" for="a-phone">연락처<input class="input" id="a-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(a.phone) + '" data-bind="as.phone" data-fmt="phone"></label>' +
      '<label class="field" for="a-region">지역 (시·구)<input class="input" id="a-region" type="text" list="region-list" placeholder="예) 부천, 검단, 파주" value="' + esc(a.region) + '" data-bind="as.region"></label>' +
      '<datalist id="region-list">' + (BOOK.regions || []).map(function (r) { return '<option value="' + esc(r) + '">'; }).join('') + '</datalist>' +
      '<label class="field" for="a-apt">아파트명<input class="input" id="a-apt" type="text" placeholder="예) 칠통령센트럴" value="' + esc(a.apt) + '" data-bind="as.apt"></label>' +
      '<div class="field"><span>동 / 호수</span><div class="row"><input class="input small" id="a-dong" type="text" inputmode="numeric" maxlength="4" aria-label="동" placeholder="101" value="' + esc(a.dong) + '" data-bind="as.dong" data-fmt="digits"><span style="margin-right:10px">동</span>' +
      '<input class="input small" id="a-ho" type="text" inputmode="numeric" maxlength="4" aria-label="호수" placeholder="1203" value="' + esc(a.ho) + '" data-bind="as.ho" data-fmt="digits"><span>호</span></div></div>' +
      '<label class="field" for="a-when">시공받은 시기 (선택)<input class="input" id="a-when" type="text" placeholder="예) 2025년 3월쯤" value="' + esc(a.when) + '" data-bind="as.when"></label>' +
      '<label class="check"><input type="checkbox" data-check="as.agree"' + (a.agree ? ' checked' : '') + '>A/S 접수를 위한 개인정보(이름·연락처·주소·사진) 수집·이용에 동의해요 <a href="privacy.html" target="_blank" style="font-size:12px;margin-left:auto">보기</a></label></section>' +
      (a.err ? '<p class="note-err" role="alert" style="font-size:13px">' + esc(a.err) + '</p>' : '') +
      '</main><div class="footer-bar">' +
      '<button type="button" class="btn btn-primary" data-act="asSend"' + (a.sending ? ' disabled' : '') + '>' + (a.sending ? '보내는 중…' : 'A/S 신청하기') + '</button></div></div>';
  }
  function viewASDone() {
    var d = S.as.done;
    return '<div class="screen with-tabbar">' + topbar('A/S 신청') + '<main class="content">' +
      '<div class="done-box"><div class="mark">' + I.ok + '</div><h2>A/S 신청이 접수됐어요</h2><p>보내주신 증상과 사진을 확인하고<br>칠통령에서 ' + esc(d.phone) + ' 번호로 연락드려<br>방문 일정을 잡아드릴게요.</p><p style="font-size:13px;margin-top:10px">시공 일정 사이에 방문하다 보니 일정을 잡기까지<br>시간이 걸릴 수 있어요. 양해 부탁드려요.</p></div>' +
      (d.sendErr ? '<div class="callout" role="alert" style="color:var(--err)">' + esc(d.sendErr) + '</div>' : '') +
      '<a class="btn btn-primary" href="#/home">홈으로</a>' +
      '<button type="button" class="btn btn-ghost" data-act="asOpenMine">내 A/S 신청 확인 · 수정</button>' +
      '</main>' + tabbar('book') + '</div>';
  }

  // ======================================================
  // 입주 준비 코스
  // ======================================================
  function viewGuide() {
    return '<div class="screen with-tabbar">' + topbar('입주 준비 코스') + '<main class="content">' +
      '<p class="hint" style="font-size:14px;margin:0">새 집 입주 전에는 보통 이 순서로 준비해요.</p>' +
      '<ol class="course">' + HJ.GUIDE.map(function (st, i) {
        return '<li><span class="n">' + (i + 1) + '</span><div class="tx"><b>' + esc(st[0]) + '</b><span>' + esc(st[1]) + '</span></div></li>';
      }).join('') + '</ol>' +
      '<a class="btn btn-primary" href="#/book">탄성코트 시공일 예약</a>' +
      '</main>' + tabbar('guide') + '</div>';
  }

  // ======================================================
  // 시공 사례
  // ======================================================
  function loadCases() {
    if (S.cases.loading) return;
    if (!API.ready) { if (!S.cases.list) S.cases.list = []; return; }
    S.cases.loading = true;
    API.get('cases').then(function (j) {
      S.cases.list = j.cases || []; S.cases.error = '';
      save('chil-cases-cache', S.cases.list);
    }).catch(function () {
      S.cases.list = load('chil-cases-cache', []);
      S.cases.error = '사례를 불러오지 못했어요. 잠시 후 다시 열어주세요.';
    }).then(function () { S.cases.loading = false; if (S.route === 'cases' || S.route === 'home') render(); });
  }
  function caseCard(c, i) {
    var col = c.color ? HJ.color(c.color) : null;
    var pos = S.cases.pos[c.id] != null ? S.cases.pos[c.id] : 50;
    var media = c.before && c.after
      ? '<div class="compare" data-cmp="' + esc(c.id) + '"><img src="' + esc(c.after) + '" alt="' + esc(c.apt) + ' 시공 후" loading="lazy"><img class="bf" src="' + esc(c.before) + '" alt="' + esc(c.apt) + ' 시공 전" loading="lazy" style="clip-path:inset(0 ' + (100 - pos) + '% 0 0)"><div class="line" style="left:' + pos + '%"><span class="knob">' + I.arrows + '</span></div><span class="lab b">시공 전</span><span class="lab a">시공 후</span><input type="range" min="0" max="100" value="' + pos + '" aria-label="시공 전후 비교, 좌우로 밀어서 보기" data-range="' + esc(c.id) + '"></div>'
      : '<img class="single" src="' + esc(c.after) + '" alt="' + esc(c.apt) + ' 시공 사진" loading="lazy">';
    return '<article class="case">' + media + '<div class="body"><div class="title"><b>' + esc(c.apt) + '</b><small>' + esc(c.date) + '</small></div><div class="wrap" style="gap:6px">' +
      (c.svcs || []).map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join('') +
      (c.color ? '<span class="tag gold"><span class="dot" style="background:' + (col ? col[2] : '#D4D7D7') + '"></span>탄성코트 ' + esc(c.color) + '</span>' : '') +
      '</div>' + (c.memo ? '<p>' + esc(c.memo) + '</p>' : '') + '</div></article>';
  }
  // ---------- 전국 시공 현장 리스트 (sites.js) ----------
  function viewSites() {
    var cs = S.cases, AREAS = window.CHIL_SITES || [];
    var all = 0, hh = 0, groups = 0;
    AREAS.forEach(function (a) { a[1].forEach(function (g) { groups++; g[1].forEach(function (x) { all++; hh += x[1]; }); }); });
    var q = cs.q.replace(/\s+/g, '').toLowerCase();
    var match = function (n) { return !q || n.replace(/\s+/g, '').toLowerCase().indexOf(q) >= 0; };
    var shownCount = 0, first = true;
    var body = AREAS.filter(function (a) { return cs.area === 'all' || cs.area === a[0]; }).map(function (a) {
      return a[1].map(function (g) {
        var items = g[1].filter(function (x) { return match(x[0]); });
        if (!items.length) return '';
        shownCount += items.length;
        var sum = items.reduce(function (t, x) { return t + x[1]; }, 0);
        var key = a[0] + '/' + g[0];
        var open = q ? true : (cs.open[key] != null ? cs.open[key] : (first && cs.area === 'all' ? true : cs.area !== 'all'));
        first = false;
        return '<details class="site-g"' + (open ? ' open' : '') + ' data-key="' + esc(key) + '"><summary><b>' + esc(g[0]) + '</b><span>' + items.length + '곳 · ' + sum.toLocaleString('ko-KR') + '세대</span></summary><ul>' +
          items.map(function (x) { return '<li><span class="n">' + esc(x[0]) + '</span><span class="u">' + x[1].toLocaleString('ko-KR') + '세대</span></li>'; }).join('') + '</ul></details>';
      }).join('');
    }).join('');
    return '<section class="site-hero"><span class="k">전국 시공 실적으로 증명하는 기술력</span><h2>전국 시공 현장</h2>' +
      '<div class="nums"><div><b>' + all.toLocaleString('ko-KR') + '</b><span>시공 단지</span></div><div><b>' + hh.toLocaleString('ko-KR') + '</b><span>세대</span></div><div><b>' + groups + '</b><span>시·도 지역</span></div></div></section>' +
      '<label class="field" for="site-q" style="gap:0"><span class="sr-only">아파트 이름으로 찾기</span><input class="input" id="site-q" type="search" placeholder="아파트 이름으로 찾기 (예: 운정, 힐스테이트)" value="' + esc(cs.q) + '" data-bind="cases.q" data-fmt="live"></label>' +
      '<div class="chip-row" role="group" aria-label="권역">' + chip('전체', cs.area === 'all', 'siteArea', ' data-v="all"') + AREAS.map(function (a) { return chip(a[0], cs.area === a[0], 'siteArea', ' data-v="' + esc(a[0]) + '"'); }).join('') + '</div>' +
      (q ? '<p class="hint" style="font-size:13px;margin:0">"' + esc(cs.q) + '" 검색 결과 ' + shownCount + '곳</p>' : '') +
      (body || '<div class="empty"><b>목록에서 찾지 못했어요</b><span>목록에 없는 단지도 시공할 수 있어요.</span><a class="btn btn-primary" href="#/quote" style="margin-top:8px">상담 예약하기</a></div>') +
      '<p class="hint" style="font-size:12px">칠통령 회사 소개서 기준 시공 현장이에요.</p>';
  }
  function viewCases() {
    var cs = S.cases;
    var list = cs.list && cs.list.length ? cs.list : (cs.list ? HJ.SAMPLE_CASES : []);
    var apts = [];
    list.forEach(function (x) { if (apts.indexOf(x.apt) < 0) apts.push(x.apt); });
    if (cs.filter === null && cs.list) cs.filter = apts.indexOf(S.home.apt) >= 0 ? S.home.apt : 'all';
    var filter = cs.filter || 'all';
    var shown = list.filter(function (x) { return filter === 'all' || x.apt === filter; });
    var body;
    if (cs.loading && !cs.list) body = '<div class="skeleton"></div><div class="skeleton"></div>';
    else if (!shown.length) body = '<div class="empty"><b>아직 이 단지 사례가 없어요</b><span>곧 시공 사진을 올려드릴게요</span></div>';
    else body = shown.map(caseCard).join('');
    var seg = '<div class="seg" role="group" aria-label="시공 사례 보기">' + [['sites', '전국 시공 현장'], ['photos', '시공 사진']].map(function (t) { return '<button type="button" aria-pressed="' + (cs.tab === t[0]) + '" data-act="caseTab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (cs.tab === 'sites') return '<div class="screen with-tabbar">' + topbar('시공 사례') + '<main class="content">' + seg + viewSites() + '</main>' + tabbar('') + '</div>';
    return '<div class="screen with-tabbar">' + topbar('시공 사례') + '<main class="content">' + seg +
      '<div class="chip-row" role="group" aria-label="아파트 단지">' + chip('전체', filter === 'all', 'caseFilter', ' data-v="all"') + apts.map(function (a) { return chip(a, filter === a, 'caseFilter', ' data-v="' + esc(a) + '"'); }).join('') + '</div>' +
      '<p class="hint" style="font-size:13px">' + esc(filter === 'all' ? '전체 단지' : filter) + ' · 사례 ' + shown.length + '건</p>' +
      (cs.error ? '<p class="note-err">' + esc(cs.error) + '</p>' : '') + body +
      '</main>' + tabbar('') + '</div>';
  }

  // ======================================================
  // 계약서
  // ======================================================
  function newContract() {
    var q = load('chil-quote', null), h = S.home, places = {};
    if (q && q.spots) {
      q.spots.forEach(function (sp) {
        if (/발코니|베란다/.test(sp)) places.balcony = true;
        if (/다용도실/.test(sp)) places.laundry = true;
        if (/실외기실/.test(sp)) places.outdoor = true;
        if (/대피공간/.test(sp)) places.shelter = true;
      });
    }
    sigStrokes = [];
    return {
      fromQuote: !!(q && q.spots && q.spots.length),
      name: '', phone: q && q.phone ? q.phone : '', apt: h.apt || '', dong: h.dong || '', ho: h.ho || '',
      moveIn: h.date || '', workDate: (load('chil-booking', null) || {}).day || (q && q.day) || '',
      product: q && q.product && HJ.PRODUCTS.some(function (p) { return p[0] === q.product; }) ? q.product : '', color: q && q.color ? q.color : HJ.color(S.color.coat)[1], area: '', places: places,
      priceMemo: '', discCoupon: '', discReview: '', discSite: '', sv: {},
      total: '', deposit: '', payer: '', pay: '', payback: '', asYears: '',
      agreeTerms: false, agreePriv: false, err: '', sending: false, done: null
    };
  }
  function contractCalc() {
    var k = S.contract, total = HJ.num(k.total), deposit = HJ.num(k.deposit);
    var disc = [['쿠폰할인', HJ.num(k.discCoupon)], ['후기할인', HJ.num(k.discReview)], ['현장할인', HJ.num(k.discSite)]];
    var discSum = disc.reduce(function (s, d) { return s + d[1]; }, 0), amount = Math.max(0, total - discSum);
    var pick = function (list, map) { return list.filter(function (x) { return map[x[0]]; }).map(function (x) { return x[1]; }); };
    var product = HJ.PRODUCTS.find(function (p) { return p[0] === k.product; });
    var pay = HJ.PAYS.find(function (p) { return p[0] === k.pay; });
    return {
      total: total, discSum: discSum, amount: amount, deposit: deposit, balance: Math.max(0, amount - deposit), disc: disc,
      places: pick(HJ.PLACES, k.places), sv: pick(HJ.SV, k.sv),
      product: product ? product[1] : '', pay: pay ? pay[1] : '', payback: HJ.num(k.payback)
    };
  }
  function fmtDate(v) { if (!v) return ''; var p = v.split('-'); return p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일'; }
  function viewContract() {
    var k = S.contract;
    if (k.done) return viewContractDone();
    var c = contractCalc();
    var input = function (id, label, key, ph, extra) {
      return '<label class="field" for="' + id + '">' + label + '<input class="input" id="' + id + '" type="text" placeholder="' + ph + '" value="' + esc(k[key]) + '" data-bind="contract.' + key + '"' + (extra || '') + '></label>';
    };
    var dateInput = function (id, label, key) {
      return '<label class="field" for="' + id + '" style="flex:1;min-width:0">' + label + '<input class="input" id="' + id + '" type="date" value="' + esc(k[key]) + '" data-bind="contract.' + key + '"></label>';
    };
    var amountRow = function (id, label, key, unit, hint) {
      return '<label class="money-row" for="' + id + '"><span style="display:flex;flex-direction:column;gap:2px">' + label + (hint ? '<small class="hint" style="font-weight:500">' + hint + '</small>' : '') + '</span><span class="row" style="gap:6px"><input class="input money" id="' + id + '" type="text" inputmode="numeric" placeholder="0" value="' + (k[key] ? HJ.num(k[key]).toLocaleString('ko-KR') : '') + '" data-bind="contract.' + key + '" data-fmt="money"><span style="min-width:30px">' + unit + '</span></span></label>';
    };
    var chips = function (list, map, act) {
      return '<div class="wrap">' + list.map(function (x) { return chip(x[1], !!map[x[0]], act, ' data-v="' + x[0] + '"', 'soft'); }).join('') + '</div>';
    };
    var sub = function (t) { return '<span style="font-size:13px;font-weight:700;color:var(--green)">' + t + '</span>'; };
    var terms = HJ.CONTRACT.terms(k.asYears);
    return '<div class="screen with-footer">' + topbar('시공 계약서') + '<main class="content">' +
      (k.fromQuote ? '<div class="callout">상담 신청 내용으로 일부 칸을 미리 채워 뒀어요. 상담 내용과 다르면 고쳐주세요.</div>' : '') +

      '<section class="card"><div class="section-head"><h2>1. 기본정보</h2><span class="hint">' + todayKo() + '</span></div>' +
      input('k-name', '고객명', 'name', '홍길동', ' autocomplete="name"') +
      '<label class="field" for="k-phone">연락처<input class="input" id="k-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(k.phone) + '" data-bind="contract.phone" data-fmt="phone"></label>' +
      input('k-apt', '아파트명', 'apt', '예) 칠통령센트럴') +
      '<div class="field"><span>동 / 호수</span><div class="row"><input class="input small" id="k-dong" type="text" inputmode="numeric" maxlength="4" aria-label="동" placeholder="101" value="' + esc(k.dong) + '" data-bind="contract.dong" data-fmt="digits"><span style="margin-right:10px">동</span>' +
      '<input class="input small" id="k-ho" type="text" inputmode="numeric" maxlength="4" aria-label="호수" placeholder="1203" value="' + esc(k.ho) + '" data-bind="contract.ho" data-fmt="digits"><span>호</span></div></div>' +
      '<div class="row" style="gap:10px;align-items:flex-start">' + dateInput('k-movein', '입주예정일', 'moveIn') + dateInput('k-work', '시공일', 'workDate') + '</div>' +
      '<div class="notice">' + HJ.CONTRACT.notes.map(function (l) { return '<span>※ ' + esc(l) + '</span>'; }).join('') + '</div></section>' +

      '<section class="card"><h2>2. 계약제품</h2>' + sub('시공제품') +
      '<div class="wrap">' + HJ.PRODUCTS.map(function (p) { return chip(p[1], k.product === p[0], 'kProduct', ' data-v="' + p[0] + '"'); }).join('') + '</div>' +
      sub('색상') + '<div class="wrap">' + HJ.COLORS.map(function (x) {
        return '<button type="button" class="chip" aria-pressed="' + (k.color === x[1]) + '" data-act="kColor" data-v="' + x[1] + '" style="display:inline-flex;align-items:center;gap:6px"><span class="dot-sm" style="background:' + x[2] + '"></span>' + x[1] + '</button>';
      }).join('') + '</div>' +
      '<input class="input" id="k-color" type="text" aria-label="색상 직접 입력" placeholder="다른 색이면 직접 적어주세요" value="' + esc(k.color) + '" data-bind="contract.color">' +
      '<label class="money-row" for="k-area"><span>시공면적</span><span class="row" style="gap:6px"><input class="input money" id="k-area" type="text" inputmode="decimal" placeholder="0" value="' + esc(k.area) + '" data-bind="contract.area"><span style="min-width:30px">m²</span></span></label>' +
      sub('시공장소') + chips(HJ.PLACES, k.places, 'kPlace') + '</section>' +

      '<section class="card"><h2>3. 시공가격 및 납부방법</h2>' +
      '<label class="field" for="k-memo">시공가격 내용<textarea class="textarea" id="k-memo" rows="3" placeholder="예) 발코니 2곳 + 다용도실 + 실외기실 / 시그니처-케어" data-bind="contract.priceMemo">' + esc(k.priceMemo) + '</textarea></label>' +
      amountRow('k-total', '<b>총 금액</b>', 'total', '만원', '할인 전 시공 금액') +
      sub('할인내역') +
      amountRow('k-dc1', '쿠폰할인', 'discCoupon', '만원') + amountRow('k-dc2', '후기할인', 'discReview', '만원') + amountRow('k-dc3', '현장할인', 'discSite', '만원') +
      '<div class="price-sum"><div class="r"><span>총 금액</span><span>' + HJ.man(c.total) + '</span></div>' +
      '<div class="r minus"><span>할인 합계</span><span>' + (c.discSum ? '- ' + HJ.man(c.discSum) : '0만원') + '</span></div>' +
      '<div class="r final"><span>최종 금액</span><span>' + HJ.man(c.amount) + '</span></div></div>' +
      sub('곰팡이항균SV') + chips(HJ.SV, k.sv, 'kSv') +
      '<div class="kv" style="border-top:1px solid var(--line-2);padding-top:4px">' +
      amountRow('k-dep', '계약금', 'deposit', '만원') +
      '<div class="r strong"><span class="k">잔금 (최종 금액 - 계약금)</span><span class="v">' + HJ.man(c.balance) + '</span></div></div>' +
      input('k-payer', '입금자명', 'payer', '계약금 입금하신 분 이름') +
      sub('결제방법') + '<div class="row">' + HJ.PAYS.map(function (p) { return chip(p[1], k.pay === p[0], 'kPay', ' data-v="' + p[0] + '"'); }).join('') + '</div>' +
      amountRow('k-pb', '후기 페이백', 'payback', '원', '잔금 완결 + 카페 후기 작성 시') + '</section>' +

      '<section class="card"><h2>4. 계약 조항</h2>' +
      '<div class="notice"><b>◆ ' + esc(HJ.CONTRACT.lead) + '</b>' + terms.map(function (t) { return '<b style="margin-top:6px">' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span>'; }).join('') + '</div>' +
      '<label class="money-row" for="k-as"><span>하자보수 기간</span><span class="row" style="gap:6px"><input class="input money" id="k-as" type="text" inputmode="numeric" maxlength="2" placeholder="0" value="' + esc(k.asYears) + '" data-bind="contract.asYears" data-fmt="money"><span style="min-width:30px">년</span></span></label>' +
      '<label class="check"><input type="checkbox" data-check="contract.agreeTerms"' + (k.agreeTerms ? ' checked' : '') + '>위 계약 조항을 모두 확인했고 동의해요 (필수)</label>' +
      '<label class="check"><input type="checkbox" data-check="contract.agreePriv"' + (k.agreePriv ? ' checked' : '') + '>계약 이행을 위한 개인정보 수집·이용에 동의해요 (필수) <a href="privacy.html" target="_blank" style="font-size:12px;margin-left:auto">보기</a></label></section>' +

      '<section class="card" style="gap:10px"><div class="section-head"><h2 style="font-size:15px">5. 서명 (갑)</h2><button type="button" class="btn btn-ghost" style="min-height:36px;padding:0" data-act="clearSig">다시 쓰기</button></div>' +
      '<div class="sigpad"><span class="ph" id="sig-ph"' + (sigStrokes.length ? ' hidden' : '') + '>여기에 손가락으로 서명해 주세요</span><canvas id="sig" aria-label="서명 입력 칸"></canvas></div>' +
      '<span class="hint">계약일 ' + todayKo() + '</span></section>' +
      (k.err ? '<p class="note-err" role="alert" style="font-size:13px">' + esc(k.err) + '</p>' : '') +
      '</main><div class="footer-bar"><div class="sum-line"><span class="l" style="font-size:13px">최종 금액 · 잔금 ' + HJ.man(c.balance) + '</span><span class="r" style="font-size:20px;color:var(--green)">' + HJ.man(c.amount) + '</span></div>' +
      '<button type="button" class="btn btn-primary" data-act="signContract"' + (k.sending ? ' disabled' : '') + '>' + (k.sending ? '계약서 만드는 중…' : '서명하고 계약하기') + '</button></div></div>';
  }
  function viewContractDone() {
    var d = S.contract.done;
    return '<div class="screen with-tabbar">' + topbar('시공 계약서') + '<main class="content">' +
      '<div class="done-box"><div class="mark">' + I.ok + '</div><h2>계약이 완료됐어요</h2><p>' + esc(d.name) + '님, 시공일에 맞춰<br>담당자가 다시 연락드릴게요.</p></div>' +
      '<div class="pdf-card"><div class="ic" style="color:var(--gold-t)">' + I.doc.replace('width="22" height="22"', 'width="26" height="26"') + '</div><div class="tx"><b>계약서 PDF</b><small>' + esc(d.fileName) + '</small></div></div>' +
      (IN_APP ? (d.url ? '<a class="btn btn-gold" href="' + esc(d.download || d.url) + '">' + I.down + '계약서 PDF 받기</a>' +
          (IS_KAKAO ? '<a class="btn btn-ghost" href="kakaotalk://web/openExternal?url=' + encodeURIComponent(d.url) + '">크롬 · 사파리로 열어서 받기</a>' : '<a class="btn btn-ghost" href="' + esc(d.url) + '" target="_blank" rel="noopener">계약서 PDF 열어보기</a>') +
          '' + (IS_KAKAO ? '<p class="hint" style="text-align:center;margin:0">안 받아지면 <b>크롬 · 사파리로 열어서 받기</b>를 눌러 주세요.</p>' : '') + ''
        : '<button type="button" class="btn btn-gold" disabled>' + I.down + (d.sendErr ? 'PDF를 준비하지 못했어요' : 'PDF 준비 중…') + '</button>') +
        (d.image ? '<button type="button" class="btn btn-ghost" data-act="pdfImg">' + (d.showImg ? '계약서 그림 접기' : '사진으로 저장하기 (그림을 길게 눌러 저장)') + '</button>' + (d.showImg ? '<img class="contract-img" src="' + d.image + '" alt="칠통령 시공 계약서">' : '') : '')
        : '<button type="button" class="btn btn-gold" data-act="pdfSave">' + I.down + '계약서 PDF 받기</button>') +
      (!IN_APP && navigator.canShare ? '<button type="button" class="btn btn-ghost" data-act="pdfShare">' + I.share + ' 카카오톡 등으로 보내기</button>' : '') +
      (d.sendErr ? '<div class="callout" role="alert" style="color:var(--err)">' + esc(d.sendErr) + ' <button type="button" class="btn btn-ghost" style="min-height:32px;padding:0 4px" data-act="retrySend">다시 보내기</button></div>' : '') +
      '<section class="card" style="gap:4px"><div class="kv">' + d.rows.map(function (r) { return '<div class="r"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>'; }).join('') + '</div>' +
      '<span class="hint" style="margin-top:8px">고객 서명</span><img class="sig-img" src="' + d.sig + '" alt="고객 서명"></section>' +
      '<a class="btn btn-primary" href="#/home">홈으로</a>' +
      '<button type="button" class="btn btn-ghost" data-act="newContract">새 계약서 작성</button>' +
      '</main>' + tabbar('contract') + '</div>';
  }

  // signature pad (strokes survive re-render)
  function setupSig() {
    var cv = document.getElementById('sig');
    if (!cv) return;
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var cx = cv.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.lineWidth = 2.6; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#141B26';
    var redraw = function () {
      cx.clearRect(0, 0, w, h);
      sigStrokes.forEach(function (st) {
        cx.beginPath(); cx.moveTo(st[0][0] * w, st[0][1] * h);
        if (st.length === 1) cx.lineTo(st[0][0] * w + 0.1, st[0][1] * h);
        for (var i = 1; i < st.length; i++) cx.lineTo(st[i][0] * w, st[i][1] * h);
        cx.stroke();
      });
    };
    redraw();
    var cur = null;
    var pt = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault(); cur = [pt(e)]; sigStrokes.push(cur);
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var ph = document.getElementById('sig-ph'); if (ph) ph.hidden = true;
      redraw();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!cur) return;
      var p = pt(e), last = cur[cur.length - 1];
      cur.push(p);
      cx.beginPath(); cx.moveTo(last[0] * w, last[1] * h); cx.lineTo(p[0] * w, p[1] * h); cx.stroke();
    });
    var end = function () { cur = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('pointerleave', end);
  }
  function sigDataUrl() {
    var w = 620, h = 300, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'); cx.lineWidth = 5; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#141B26';
    sigStrokes.forEach(function (st) {
      cx.beginPath(); cx.moveTo(st[0][0] * w, st[0][1] * h);
      if (st.length === 1) cx.lineTo(st[0][0] * w + 0.5, st[0][1] * h);
      for (var i = 1; i < st.length; i++) cx.lineTo(st[i][0] * w, st[i][1] * h);
      cx.stroke();
    });
    return cv.toDataURL('image/png');
  }

  function signContract() {
    var k = S.contract, c = contractCalc();
    var fail = function (m) { k.err = m; render(); };
    if (!k.name.trim()) return fail('고객명을 적어주세요.');
    if (k.phone.replace(/\D/g, '').length < 10) return fail('연락처를 정확히 적어주세요.');
    if (!k.apt.trim()) return fail('아파트명을 적어주세요.');
    if (!k.product) return fail('시공제품을 골라주세요.');
    if (!c.places.length) return fail('시공장소를 하나 이상 골라주세요.');
    if (!c.total) return fail('총 금액을 적어주세요.');
    if (c.discSum > c.total) return fail('할인 합계가 총 금액보다 커요. 금액을 확인해 주세요.');
    if (!HJ.num(k.asYears)) return fail('하자보수 기간(년)을 적어주세요.');
    if (!k.agreeTerms || !k.agreePriv) return fail('필수 동의 항목을 모두 체크해 주세요.');
    if (!sigStrokes.length) return fail('서명 칸에 서명해 주세요.');
    k.err = ''; k.sending = true; render();

    var d = new Date(), ymd = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    var no = 'CT-' + ymd + '-' + String(Math.floor(1000 + Math.random() * 9000));
    var sig = sigDataUrl();
    var dongHo = (k.dong ? k.dong + '동 ' : '') + (k.ho ? k.ho + '호' : '');
    var doc = {
      no: no, today: todayKo(), biz: BIZ, name: k.name.trim(), phone: k.phone, apt: k.apt.trim(), dongHo: dongHo.trim(),
      moveIn: fmtDate(k.moveIn), workDate: fmtDate(k.workDate), moveInRaw: k.moveIn, workDateRaw: k.workDate,
      todayRaw: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), dong: k.dong, ho: k.ho,
      product: k.product, color: k.color.trim(), area: k.area.trim(), places: k.places, sv: k.sv, pay: k.pay,
      priceMemo: k.priceMemo.trim(), disc: c.disc, total: c.total, discSum: c.discSum, amount: c.amount, deposit: c.deposit, balance: c.balance,
      payer: k.payer.trim(), payback: c.payback, asYears: HJ.num(k.asYears)
    };
    var fileName = '칠통령_시공계약서_' + doc.name.replace(/[\\/:*?"<>|]/g, '') + '_' + ymd + '.pdf';
    HJPDF.make(doc, sig).then(function (bytes) {
      var discText = c.disc.filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ' ' + HJ.man(x[1]); }).join(', ');
      var record = {
        no: no, name: doc.name, phone: doc.phone, apt: doc.apt, dongHo: doc.dongHo, moveIn: k.moveIn, workDate: k.workDate,
        product: c.product, color: doc.color, area: doc.area, places: c.places.join(', '), sv: c.sv.join(', '),
        priceMemo: doc.priceMemo, total: c.total, discount: discText, amount: c.amount, deposit: c.deposit, balance: c.balance,
        payer: doc.payer, pay: c.pay, payback: c.payback, asYears: doc.asYears
      };
      k.sending = false;
      k.done = {
        no: no, name: doc.name, fileName: fileName, bytes: bytes, image: bytes.image || '', url: '', sig: sig, record: record, sendErr: '',
        rows: [['계약번호', no], ['고객명', doc.name], ['연락처', doc.phone], ['아파트', doc.apt + (doc.dongHo ? ' ' + doc.dongHo : '')], ['시공일', doc.workDate || '-'], ['시공제품', c.product], ['색상', doc.color || '-'], ['시공장소', c.places.join(', ')], ['총 금액', HJ.man(c.total)], ['할인', c.discSum ? '- ' + HJ.man(c.discSum) : '없음'], ['최종 금액', HJ.man(c.amount)], ['계약금', HJ.man(c.deposit)], ['잔금', HJ.man(c.balance)], ['계약일', doc.today]]
      };
      render(true);
      sendContract();
    }).catch(function () { k.sending = false; fail('계약서를 만들지 못했어요. 다시 시도해 주세요.'); });
  }
  function bytesToB64(bytes) {
    var s = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(s);
  }
  function sendContract() {
    var d = S.contract.done;
    if (!API.ready) { d.sendErr = '아직 서버(구글 시트) 연결 전이라 계약서가 칠통령에 전송되지 않았어요.'; render(); return; }
    d.sendErr = '';
    API.post({ action: 'contract', data: d.record, pdf: bytesToB64(d.bytes), fileName: d.fileName })
      .then(function (j) { d.url = (j && j.url) || ''; d.download = (j && j.download) || ''; toast('계약서가 칠통령에 전달됐어요'); render(); })
      .catch(function () { d.sendErr = '계약서를 칠통령에 보내지 못했어요. 인터넷 연결을 확인하고 다시 보내주세요.'; render(); });
  }
  function pdfBlob() { return new Blob([S.contract.done.bytes], { type: 'application/pdf' }); }

  // ======================================================
  // 관리자 (시공 사례 등록)
  // ======================================================
  function adminLoad() {
    var a = S.admin; a.busy = true;
    Promise.all([
      API.get('cases').then(function (j) { a.list = j.cases || []; }).catch(function () { a.list = a.list || []; a.err = '사례 목록을 불러오지 못했어요.'; }),
      API.post({ action: 'bookings', password: a.pw }).then(function (j) { a.books = j.bookings || []; a.closed = j.closed || []; a.techs = j.techs || []; }).catch(function () { a.books = a.books || []; a.err = '예약 목록을 불러오지 못했어요.'; })
    ]).then(function () { a.busy = false; render(); });
  }
  var BK_ST = { '접수': 'st-wait', '확정': 'st-ok', '취소': 'st-no' };
  function adminBookings(mode) {
    var a = S.admin, t0 = dayKey(new Date()), isAS = mode === 'as';
    var list = (a.books || []).filter(function (b) { return isAS ? b.kind === 'AS' : b.kind !== 'AS'; }).sort(function (x, y) { return x.day < y.day ? -1 : x.day > y.day ? 1 : 0; });
    var asWait = list.filter(function (b) { return b.kind === 'AS' && !b.day && b.status !== '취소'; });
    var upcoming = list.filter(function (b) { return b.day && b.day >= t0 && b.status !== '취소'; });
    var rest = list.filter(function (b) { return b.day ? !(b.day >= t0 && b.status !== '취소') : b.status === '취소'; }).reverse();
    var waiting = upcoming.filter(function (b) { return b.status === '접수'; }).length;
    var techOf = function (n) { return (a.techs || []).find(function (t) { return t.name === n; }); };
    var item = function (b) {
      var addr = b.apt + (b.dong ? ' ' + b.dong + '동' : '') + (b.ho ? ' ' + b.ho + '호' : '');
      var tc = techOf(b.tech);
      return '<div class="bk-item"' + (tc ? ' style="box-shadow:inset 5px 0 0 ' + tc.color + '"' : '') + '><div class="top"><b>' + (b.kind === 'AS' ? '<span class="rg as">A/S</span>' : '') + (b.region ? '<span class="rg">' + esc(b.region) + '</span>' : '') + esc(b.day ? dayLabel(b.day) : '일정 미정') + '</b><span class="st ' + (BK_ST[b.status] || 'st-wait') + '">' + esc(b.status || '접수') + '</span></div>' +
        '<div class="meta"><b style="color:var(--ink)">' + esc(b.name) + '</b> · ' + esc(b.phone) + '<br>' + esc(addr) + ' · ' + esc((b.services || []).join(', ')) +
        (b.symptom ? '<br><b style="color:var(--err)">증상: ' + esc(b.symptom) + '</b>' : '') + (b.when ? '<br>시공 시기: ' + esc(b.when) : '') +
        (b.product || b.color ? '<br>제품·색상: ' + esc([b.product, b.color].filter(Boolean).join(' · ')) : '') + (b.access ? '<br>출입: ' + esc(b.access) : '') +
        (b.julnun ? '<br>줄눈: ' + esc(b.julnun) : '') + (b.clean ? '<br>입주청소: ' + esc(b.clean) : '') + (b.callTime ? '<br>통화: ' + esc(b.callTime) : '') +
        (b.quote ? '<br>견적: ' + esc(b.quote) : '') + (b.memo ? '<br>' + (b.kind === 'AS' ? '내용' : '남긴 말') + ': ' + esc(b.memo) : '') +
        ((b.photos || []).length ? '<span class="bk-photos">' + b.photos.map(function (u, i) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="사진 ' + (i + 1) + '번 크게 보기"><img src="' + esc(u) + '=w400" alt="A/S 사진 ' + (i + 1) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + esc(u) + '\'"></a>'; }).join('') + '</span>' : '') +
        (b.edited ? '<br><span style="color:#B45309;font-weight:600">고객 수정: ' + esc(String(b.edited).split('\n').pop()) + '</span>' : '') +
        '<br><span style="color:' + (b.cell ? 'var(--green)' : 'var(--err)') + '">' + (b.cell ? '일정표 ' + esc(b.cell) + ' 칸에 적었어요' : (b.status === '취소' ? '일정표에서 지웠어요' : !b.day ? '방문 날짜를 정하면 일정표에 적혀요' : '일정표에 이 날짜 칸이 없어 예약 탭에만 있어요')) + '</span></div>' +
        (b.kind === 'AS' && b.status !== '취소' ? '<div class="as-day"><input class="input" type="date" id="asd-' + esc(b.id) + '" aria-label="방문 날짜" value="' + esc(b.day || '') + '"><button type="button" class="chip" aria-pressed="true" data-act="asSetDay" data-v="' + esc(b.id) + '">' + (b.day ? '날짜 바꾸기' : '이 날로 일정 잡기') + '</button></div>' : '') +
        (b.status !== '취소' && (a.techs || []).length ? '<div class="techs"><span>기사님</span>' + a.techs.map(function (t) {
          return '<button type="button" class="chip tech" aria-pressed="' + (b.tech === t.name) + '" data-act="bkTech" data-v="' + esc(b.id) + '" data-t="' + esc(t.name) + '"><i style="background:' + t.color + '"></i>' + esc(t.name) + '</button>';
        }).join('') + '</div>' : '') +
        '<div class="acts">' + (b.status !== '확정' ? '<button type="button" class="chip" aria-pressed="true" data-act="bkSet" data-v="' + esc(b.id) + '" data-s="확정">확정</button>' : '') +
        (b.status !== '취소' ? '<button type="button" class="chip" aria-pressed="false" data-act="bkSet" data-v="' + esc(b.id) + '" data-s="취소">취소</button>' : '<button type="button" class="chip" aria-pressed="false" data-act="bkSet" data-v="' + esc(b.id) + '" data-s="접수">되돌리기</button>') + '</div></div>';
    };
    var reload = '<button type="button" class="chip" aria-pressed="false" style="min-height:32px;font-size:12px" data-act="bkReload"' + (a.busy ? ' disabled' : '') + '>' + (a.busy ? '불러오는 중…' : '새로고침') + '</button>';
    var html = isAS ? '<div class="callout">고객이 올린 A/S 신청이에요. 증상과 사진을 확인하고 전화로 방문 날짜를 정한 뒤 <b>이 날로 일정 잡기</b>를 누르면 일정표 그날 칸에 <b>A/S</b>로 적혀요.</div>' +
      '<div class="section-head"><h2>일정 미정 ' + asWait.length + '건</h2>' + reload + '</div>' +
      (!a.books ? '' : asWait.length ? asWait.map(item).join('') : '<div class="empty"><b>날짜를 정할 A/S가 없어요</b><span>고객이 A/S를 신청하면 여기에 보여요.</span></div>') +
      '<div class="section-head"><h2>방문 예정 A/S ' + upcoming.length + '건</h2>' + (waiting ? '<span class="st st-wait">확정 대기 ' + waiting + '</span>' : '') + '</div>' :
      '<div class="callout">홈페이지 예약은 시공 일정표의 그 날짜 칸에 바로 적혀요. 기사님을 정하면 칸이 <b>그 기사님 색</b>으로, 정하기 전엔 <b>연한 파랑</b>이에요. 일정표에서 칸 색을 직접 바꿔도 기사님이 따라 바뀌어요. 전화로 시간을 정한 뒤 <b>확정</b>을 누르고, <b>취소</b>하면 칸이 비워져요. 일정표 칸이 하루 ' + BOOK.perDay + '개 차거나 마감한 날은 고객 달력에 마감으로 보여요.</div>' +
      ((a.techs || []).length ? '<section class="card" style="gap:8px"><h2 style="font-size:15px">기사님 색</h2><div class="wrap">' + a.techs.map(function (t) {
        return '<span class="chip tech" aria-pressed="false" style="cursor:default"><i style="background:' + t.color + '"></i>' + esc(t.name) + (t.regions && t.regions.length ? ' · ' + esc(t.regions.join(', ')) : '') + '</span>';
      }).join('') + '</div><span class="hint">예약마다 기사님을 누르면 일정표 칸이 그 색으로 바뀌어요. 맡을 지역을 정해 두면 새 예약이 자동으로 그 기사님 색으로 들어가요.</span></section>' : '') +
      '<section class="card" style="gap:10px"><h2 style="font-size:15px">예약 안 받는 날</h2>' +
      '<div class="row" style="gap:8px"><input class="input" id="a-close" type="date" style="flex:1;min-width:0" value="' + esc(a.closeDay) + '" data-bind="admin.closeDay"><button type="button" class="btn btn-primary" style="min-height:48px;padding:0 16px" data-act="bkClose">마감하기</button></div>' +
      (a.closed.length ? '<div class="wrap">' + a.closed.slice().sort().filter(function (d) { return d >= t0; }).map(function (d) { return '<button type="button" class="chip" aria-pressed="false" data-act="bkOpen" data-v="' + d + '">' + esc(dayLabel(d)) + ' ✕</button>'; }).join('') + '</div>' : '<span class="hint">휴무일이나 일정이 꽉 찬 날을 골라 마감하세요.</span>') + '</section>' +
      '<div class="section-head"><h2>다가오는 시공 ' + upcoming.length + '건</h2><span class="row" style="gap:6px">' + (waiting ? '<span class="st st-wait">확정 대기 ' + waiting + '</span>' : '') + reload + '</span></div>';
    if (!a.books) html += '<div class="skeleton" style="height:120px"></div>';
    else if (!upcoming.length) html += isAS ? '<div class="empty"><b>방문 예정 A/S가 없어요</b><span>날짜를 정한 A/S가 여기에 보여요.</span></div>' : '<div class="empty"><b>다가오는 시공이 없어요</b><span>고객이 시공일 예약을 신청하면 여기에 보여요.</span></div>';
    else {
      var days = [];
      upcoming.forEach(function (b) { if (days.indexOf(b.day) < 0) days.push(b.day); });
      days.forEach(function (d) {
        var its = upcoming.filter(function (b) { return b.day === d; });
        var regs = [], cnt = {};
        its.forEach(function (b) { var r = b.region || '기타'; if (!cnt[r]) { cnt[r] = 0; regs.push(r); } cnt[r]++; });
        its.sort(function (x, y) { return regs.indexOf(x.region || '기타') - regs.indexOf(y.region || '기타'); });
        html += '<div class="day-head"><div><b>' + esc(dayLabel(d)) + ' · ' + its.length + '건</b><span>' + regs.map(function (r) { return esc(r) + ' ' + cnt[r]; }).join(' · ') + '</span></div>' +
          (isAS ? '' : '<button type="button" class="chip" aria-pressed="false" data-act="bkRegroup" data-v="' + d + '">일정표 지역별로 모으기</button>') + '</div>' + its.map(item).join('');
      });
    }
    if (rest.length) {
      html += '<button type="button" class="btn btn-ghost" data-act="bkPast">' + (a.showPast ? '지난·취소 ' + (isAS ? 'A/S' : '예약') + ' 숨기기' : '지난·취소 ' + (isAS ? 'A/S' : '예약') + ' ' + rest.length + '건 보기') + '</button>';
      if (a.showPast) html += rest.map(item).join('');
    }
    return html;
  }
  function viewAdmin() {
    var a = S.admin;
    if (!API.ready) {
      return '<div class="screen">' + topbar('관리자') + '<main class="content"><div class="callout">config.js에 구글 Apps Script 주소(API_URL)를 먼저 넣어야 관리자 화면을 쓸 수 있어요. 설치 안내서의 2단계를 확인해 주세요.</div></main></div>';
    }
    if (!a.authed) {
      return '<div class="screen">' + topbar('관리자') + '<main class="content"><section class="card"><h2>칠통령 관리자 로그인</h2>' +
        '<label class="field" for="a-pw">비밀번호<input class="input" id="a-pw" type="password" autocomplete="current-password" value="' + esc(a.pw) + '" data-bind="admin.pw"></label>' +
        (a.loginErr ? '<p class="note-err" role="alert">' + esc(a.loginErr) + '</p>' : '') +
        '<button type="button" class="btn btn-primary" data-act="adminLogin"' + (a.busy ? ' disabled' : '') + '>' + (a.busy ? '확인 중…' : '들어가기') + '</button></section></main></div>';
    }
    var list = a.list;
    var html = '<div class="screen">' + topbar('관리자', a.tab === 'cases' ? '<button type="button" class="chip" aria-pressed="true" data-act="adminNew" style="margin-right:8px">' + I.plus + ' 사례 등록</button>' : '') + '<main class="content">' +
      '<div class="seg" role="group" aria-label="관리 메뉴">' + [['book', '시공 예약'], ['as', 'A/S'], ['cases', '시공 사례']].map(function (t) {
        var n = t[0] === 'as' ? (a.books || []).filter(function (b) { return b.kind === 'AS' && !b.day && b.status !== '취소'; }).length : 0;
        return '<button type="button" aria-pressed="' + (a.tab === t[0]) + '" data-act="adminTab" data-v="' + t[0] + '">' + t[1] + (n ? ' <span class="seg-n">' + n + '</span>' : '') + '</button>'; }).join('') + '</div>' +
      (a.err ? '<p class="note-err" role="alert">' + esc(a.err) + '</p>' : '');
    if (a.tab === 'book' || a.tab === 'as') return html + adminBookings(a.tab) + '<button type="button" class="btn btn-ghost" data-act="adminLogout">로그아웃</button></main></div>';
    html += '<div class="callout">상담 신청과 계약서는 연결한 구글 시트의 <b>상담신청</b> · <b>계약</b> 탭에 쌓여요. 계약서 PDF는 구글 드라이브 "칠통령 계약서" 폴더에 저장돼요.</div>';
    if (!list) html += '<div class="skeleton" style="height:90px"></div>';
    else if (!list.length) html += '<div class="empty"><b>등록된 사례가 없어요</b><span>오른쪽 위 "사례 등록"으로 첫 사진을 올려주세요. 그 전까지 고객 화면에는 예시 사례가 보여요.</span></div>';
    else html += list.map(function (c) {
      return '<div class="admin-item"><img src="' + esc(c.after) + '" alt=""><div class="tx"><b>' + esc(c.apt) + '</b><span>' + esc((c.svcs || []).join(', ')) + (c.color ? ' · ' + esc(c.color) : '') + '</span><span class="hint">' + esc(c.date) + (c.before ? ' · 전후 비교' : '') + '</span></div><button type="button" class="chip" aria-pressed="false" data-act="adminDelete" data-v="' + esc(c.id) + '">삭제</button></div>';
    }).join('');
    html += '<button type="button" class="btn btn-ghost" data-act="adminLogout">로그아웃</button></main>' + (a.form ? sheetAdminForm() : '') + '</div>';
    return html;
  }
  function sheetAdminForm() {
    var f = S.admin.form, apts = [];
    (S.admin.list || []).forEach(function (x) { if (apts.indexOf(x.apt) < 0) apts.push(x.apt); });
    var slot = function (key, title, hint) {
      return '<div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:700">' + title + '</span><label class="photo-slot">' +
        (f[key] ? '<img src="' + f[key] + '" alt="' + title + ' 미리보기">' : I.photo + '<span>' + hint + '</span>') +
        '<input type="file" accept="image/*" aria-label="' + title + '" data-file="admin-' + key + '"></label></div>';
    };
    return '<div class="sheet-wrap"><button type="button" class="scrim" aria-label="닫기" data-act="adminClose"></button><div class="sheet" role="dialog" aria-modal="true" aria-label="시공 사례 등록"><div class="grabber"></div>' +
      '<div class="sheet-head"><h2>시공 사례 등록</h2><button type="button" class="icon-btn" aria-label="닫기" data-act="adminClose">' + I.close + '</button></div>' +
      '<div class="grid2" style="gap:10px">' + slot('before', '시공 전', '전 사진 (선택)') + slot('after', '시공 후', '후 사진 (필수)') + '</div>' +
      '<label class="field" for="f-apt">아파트 단지명<input class="input" id="f-apt" type="text" list="apt-list" placeholder="예) 칠통령센트럴" value="' + esc(f.apt) + '" data-bind="admin.form.apt"></label>' +
      '<datalist id="apt-list">' + apts.map(function (a) { return '<option value="' + esc(a) + '">'; }).join('') + '</datalist>' +
      '<div class="field"><span>시공 내용</span><div class="wrap">' + ['탄성코트', '줄눈', '나노코팅', '새집증후군'].map(function (s) { return chip(s, f.svcs.indexOf(s) >= 0, 'adminSvc', ' data-v="' + s + '"'); }).join('') + '</div></div>' +
      '<div class="field"><span>탄성코트 색</span><div class="wrap">' + HJ.COLORS.map(function (g) { return '<button type="button" class="chip" aria-pressed="' + (f.color === g[1]) + '" data-act="adminColor" data-v="' + g[1] + '" style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:' + g[2] + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)"></span>' + g[1] + '</button>'; }).join('') + '</div></div>' +
      '<label class="field" for="f-memo">한 줄 설명<textarea class="textarea" id="f-memo" rows="2" placeholder="예) 34평 거실·안방 베란다 + 다용도실, 아이보리로 환하게" data-bind="admin.form.memo">' + esc(f.memo) + '</textarea></label>' +
      (f.err ? '<p class="note-err" role="alert">' + esc(f.err) + '</p>' : '') +
      '<button type="button" class="btn btn-primary" data-act="adminSubmit"' + (f.busy ? ' disabled' : '') + '>' + (f.busy ? '올리는 중…' : '등록하기') + '</button></div></div>';
  }

  // ======================================================
  // events
  // ======================================================
  function setPath(path, val) {
    var parts = path.split('.'), o = S;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }

  var ACT = {
    introDone: function () { save('chil-intro-seen', true); },
    install: function () {
      if (!S.install) return;
      S.install.prompt(); S.install.userChoice.finally(function () { S.install = null; render(); });
    },
    openHome: function () { S.homeDraft = Object.assign({}, S.home); render(); },
    closeHome: function () { S.homeDraft = null; render(); },
    saveHome: function () { S.home = S.homeDraft; S.homeDraft = null; save('chil-home', S.home); render(); toast('입주 정보를 저장했어요'); },

    colorRoom: function (el) { S.color.room = el.dataset.v; render(); },
    colorCoat: function (el) { S.color.coat = el.dataset.v; save('chil-coat', S.color.coat); coatRefresh(); },
    colorMode: function (el) { S.color.mode = el.dataset.v; S.color.err = ''; coatRefresh(); },
    coatClear: function () { if (COAT.mine) { COAT.mine.mask = null; COAT.mine.seeds = []; } S.color.err = ''; coatRefresh(); },
    coatTap: function (el, e) {
      var m = COAT.mine;
      if (!m || S.color.busy) return;
      var r = el.getBoundingClientRect();
      var pt = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
      S.color.busy = true; S.color.err = ''; render();
      setTimeout(function () {
        try { m.mask = HJCoat.maskFromSeeds(m.st, m.seeds.concat([pt])); m.seeds.push(pt); }
        catch (er) { S.color.err = '그 부분은 칠할 면을 찾지 못했어요. 벽 한가운데를 눌러주세요.'; }
        S.color.busy = false; coatRefresh();
      }, 30);
    },

    svc: function (el) { var k = el.dataset.v; S.quote.svc[k] = !S.quote.svc[k]; render(); },
    build: function (el) { S.quote.build = el.dataset.v; render(); },
    step: function (el) {
      var k = el.dataset.k, d = +el.dataset.d, q = S.quote;
      if (k === 'size') q.size = Math.max(10, Math.min(80, q.size + d));
      render();
    },
    material: function (el) { S.quote.material = el.dataset.v; render(); },
    spot: function (el) { var k = el.dataset.v; S.quote.spots[k] = !S.quote.spots[k]; render(); },
    calPrev: function () { var v = S.quote.view; S.quote.view = v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; render(); },
    calNext: function () { var v = S.quote.view; S.quote.view = v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; render(); },
    pickDay: function (el) { S.quote.day = el.dataset.v; render(); },
    toBook: function () { save('chil-quote', quoteRecord()); S.book = newBooking(); go('book'); },
    bkPrev: function () { var v = S.book.view; S.book.view = v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; render(); },
    bkNext: function () { var v = S.book.view; S.book.view = v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; render(); },
    bkDay: function (el) { S.book.day = el.dataset.v; S.book.err = ''; render(); },
    bkNew: function () { S.book = newBooking(); loadSchedule(null, null, true); render(true); },
    bkSend: function () {
      var b = S.book, fail = function (m) { b.err = m; render(); };
      var svcs = ['탄성코트'];
      if (!b.day) return fail('시공 날짜를 골라주세요.');
      if (!b.name.trim()) return fail('이름을 적어주세요.');
      if (b.phone.replace(/\D/g, '').length < 10) return fail('연락처를 정확히 적어주세요.');
      if (!b.region.trim()) return fail('지역을 적어주세요. (예: 부천, 검단)');
      if (!b.apt.trim()) return fail('아파트명을 적어주세요.');
      if (!b.agree) return fail('개인정보 수집·이용에 동의해 주세요.');
      var rec = {
        day: b.day, services: svcs, name: b.name.trim(), phone: b.phone, region: b.region.trim(), apt: b.apt.trim(), dong: b.dong, ho: b.ho, memo: b.memo.trim(),
        product: b.product, access: b.access, julnun: b.julnun.trim(), clean: b.clean.trim(),
        quote: b.quote ? (b.quote.spots || []).join(', ') + (b.quote.estimate ? ' / ' + b.quote.estimate : '') : '', moveIn: S.home.date || '',
        color: b.color || (b.quote && b.quote.color ? b.quote.color : ''), spots: b.quote ? (b.quote.spots || []).join(', ') : ''
      };
      var finish = function (id, sendErr) {
        b.sending = false;
        save('chil-booking', { id: id || '', day: rec.day, name: rec.name, phone: rec.phone });
        b.done = { day: rec.day, phone: rec.phone, sendErr: sendErr || '' };
        render(true);
      };
      if (!API.ready) return finish('', '아직 서버(구글 시트) 연결 전이라 예약이 칠통령에 전달되지 않았어요.');
      b.sending = true; b.err = ''; render();
      API.post({ action: 'book', data: rec }).then(function (j) { finish(j.id); }).catch(function (e) {
        b.sending = false;
        if (e && e.message === 'full') { b.day = null; b.sched = null; loadSchedule(null, null, true); return fail('방금 다른 예약으로 그날이 마감됐어요. 다른 날짜를 골라주세요.'); }
        fail('예약을 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.');
      });
    },
    pick: function (el) { var k = el.dataset.k, v = el.dataset.v, parts = k.split('.'), o = S; for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]]; o[parts[parts.length - 1]] = o[parts[parts.length - 1]] === v ? '' : v; render(); },
    myFind: function () {
      var m = S.my;
      if (!m.name.trim()) { m.err = '이름을 적어주세요.'; return render(); }
      if (m.phone.replace(/\D/g, '').length < 10) { m.err = '연락처를 정확히 적어주세요.'; return render(); }
      myFind();
    },
    myReset: function () { S.my.list = null; S.my.err = ''; render(); },
    myEdit: function (el) {
      var m = S.my, b = (m.list || []).find(function (x) { return x.id === el.dataset.v; });
      if (!b) return;
      if (b.kind === 'AS') {
        var sym = {}; String(b.symptom || '').split(', ').forEach(function (t) { var f = AS_SYMPTOMS.find(function (x) { return x[1] === t; }); if (f) sym[f[0]] = true; });
        m.edit = { id: b.id, isAS: true, orig: b, sym: sym, memo: b.memo, when: b.when, photos: (b.photos || []).slice() };
        m.err = ''; return render(true);
      }
      var p = b.day.split('-');
      m.edit = { id: b.id, orig: b, day: b.day, view: { y: +p[0], m: +p[1] - 1 }, product: b.product, color: b.color, access: b.access, julnun: b.julnun, clean: b.clean, memo: b.memo, sched: null, loading: false };
      m.err = ''; loadSchedule(m.edit, 'mybook'); render(true);
    },
    myEditClose: function () { S.my.edit = null; S.my.err = ''; render(true); },
    myPrev: function () { var e = S.my.edit, v = e.view; e.view = v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; render(); },
    myNext: function () { var e = S.my.edit, v = e.view; e.view = v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; render(); },
    myDay: function (el) { S.my.edit.day = el.dataset.v; S.my.err = ''; render(); },
    asOpenMine: function () { // 방금 신청한 A/S 수정 화면으로 바로 가요
      var a = S.as, bk = load('chil-booking', {}) || {};
      S.my = newMy(); S.my.name = a.name.trim() || bk.name || ''; S.my.phone = a.phone || bk.phone || ''; S.my.openId = a.lastId || 'AS';
      go('mybook');
    },
    mySym: function (el) { var e = S.my.edit; e.sym[el.dataset.v] = !e.sym[el.dataset.v]; render(); },
    myPhotoDel: function (el) { S.my.edit.photos.splice(+el.dataset.v, 1); render(); },
    mySave: function () {
      var m = S.my, e = m.edit;
      if (e.isAS) {
        var syms = AS_SYMPTOMS.filter(function (x) { return e.sym[x[0]]; }).map(function (x) { return x[1]; });
        if (!syms.length && !(e.memo || '').trim()) { m.err = '어떤 문제인지 골라주거나 적어주세요.'; return render(); }
      }
      var data = e.isAS ? { symptom: syms.join(', '), memo: (e.memo || '').trim(), when: (e.when || '').trim(), photos: e.photos.slice() } : { day: e.day, product: e.product, color: e.color, access: e.access, julnun: (e.julnun || '').trim(), clean: (e.clean || '').trim(), memo: (e.memo || '').trim() };
      m.busy = true; m.err = ''; render();
      API.post({ action: 'myUpdate', id: e.id, name: m.name.trim(), phone: m.phone, data: data }).then(function (j) {
        m.busy = false; m.edit = null; schedP = null;
        m.list = m.list.map(function (x) { return x.id === j.booking.id ? j.booking : x; });
        syncHomeCards(m.list);
        toast(j.moved ? dayLabel(j.booking.day) + '로 날짜를 바꿨어요' : e.isAS ? 'A/S 신청 내용을 고쳤어요' : '예약 내용을 바꿨어요'); render(true);
      }).catch(function (er) {
        m.busy = false; m.err = MY_ERR[er && er.message] || '저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.';
        if (er && er.message === 'full') { e.sched = null; loadSchedule(e, 'mybook', true); }
        render();
      });
    },
    myCancel: function (el) {
      var m = S.my, b = (m.list || []).find(function (x) { return x.id === el.dataset.v; });
      if (!b || !confirm(b.kind === 'AS' ? 'A/S 신청을 취소할까요?' : dayLabel(b.day) + ' 시공 예약을 취소할까요?')) return;
      m.busy = true; m.err = ''; render();
      API.post({ action: 'myCancel', id: b.id, name: m.name.trim(), phone: m.phone }).then(function () {
        m.list = m.list.filter(function (x) { return x.id !== b.id; }); schedP = null;
        syncHomeCards(m.list);
        toast(b.kind === 'AS' ? 'A/S 신청을 취소했어요' : '예약을 취소했어요');
      }).catch(function (er) { m.err = MY_ERR[er && er.message] || '취소하지 못했어요. 다시 눌러주세요.'; })
        .then(function () { m.busy = false; render(); });
    },
    asSym: function (el) { var k = el.dataset.v; S.as.sym[k] = !S.as.sym[k]; S.as.err = ''; render(); },
    asPrev: function () { var v = S.as.view; S.as.view = v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; render(); },
    asNext: function () { var v = S.as.view; S.as.view = v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; render(); },
    asDay: function (el) { S.as.day = el.dataset.v; S.as.err = ''; render(); },
    asPhotoDel: function (el) { S.as.photos.splice(+el.dataset.v, 1); render(); },
    asNew: function () { S.as = newAS(); render(true); },
    asSend: function () {
      var a = S.as, fail = function (m) { a.err = m; render(); };
      var syms = AS_SYMPTOMS.filter(function (x) { return a.sym[x[0]]; }).map(function (x) { return x[1]; });
      if (!syms.length && !a.memo.trim()) return fail('어떤 문제인지 골라주거나 적어주세요.');
      if (!a.name.trim()) return fail('이름을 적어주세요.');
      if (a.phone.replace(/\D/g, '').length < 10) return fail('연락처를 정확히 적어주세요.');
      if (!a.region.trim()) return fail('지역을 적어주세요. (예: 부천, 검단)');
      if (!a.apt.trim()) return fail('아파트명을 적어주세요.');
      if (!a.agree) return fail('개인정보 수집·이용에 동의해 주세요.');
      var rec = { day: '', services: ['A/S'], kind: 'AS', name: a.name.trim(), phone: a.phone, region: a.region.trim(), apt: a.apt.trim(), dong: a.dong, ho: a.ho,
        symptom: syms.join(', '), memo: a.memo.trim(), when: a.when.trim(), photos: a.photos.slice() };
      var finish = function (sendErr) { a.sending = false; save('chil-booking', Object.assign(load('chil-booking', {}) || {}, { name: rec.name, phone: rec.phone })); if (!sendErr) { var oa = load('chil-as', null); save('chil-as', { n: (oa && oa.n || 0) + 1, day: oa && oa.day || '' }); } if (S.my) S.my.list = null; a.done = { day: rec.day, phone: rec.phone, sendErr: sendErr || '' }; render(true); };
      if (!API.ready) return finish('아직 서버(구글 시트) 연결 전이라 A/S 신청이 칠통령에 전달되지 않았어요.');
      a.sending = true; a.err = ''; render();
      API.post({ action: 'as', data: rec }).then(function (j) { a.lastId = j && j.id; finish(); }).catch(function (e) {
        a.sending = false;
        fail('신청을 보내지 못했어요. 사진 용량이나 인터넷 연결을 확인하고 다시 눌러주세요.');
      });
    },
    openConsult: function () { S.quote.sheet = 'form'; S.quote.formErr = ''; render(); },
    closeConsult: function () { S.quote.sheet = null; render(); },
    sendConsult: function () {
      var q = S.quote, c = quoteCalc();
      if (q.phone.replace(/\D/g, '').length < 10) { q.formErr = '연락처를 정확히 적어주세요.'; return render(); }
      if (!q.agree) { q.formErr = '개인정보 수집·이용에 동의해 주세요.'; return render(); }
      var rec = quoteRecord();
      save('chil-quote', rec);
      var finish = function () { q.sending = false; q.sheet = 'done'; render(); };
      if (!API.ready) { finish(); toast('아직 서버 연결 전이라 신청이 저장되지 않았어요'); return; }
      q.sending = true; q.formErr = ''; render();
      API.post({ action: 'consult', data: rec }).then(finish).catch(function () {
        q.sending = false; q.formErr = '신청을 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.'; render();
      });
    },

    toPhotos: function () { S.cases.tab = 'photos'; },
    caseTab: function (el) { S.cases.tab = el.dataset.v; render(); },
    siteArea: function (el) { S.cases.area = el.dataset.v; S.cases.open = {}; render(); },
    caseFilter: function (el) { S.cases.filter = el.dataset.v; render(); },

    kProduct: function (el) { S.contract.product = el.dataset.v; S.contract.err = ''; render(); },
    kColor: function (el) { S.contract.color = el.dataset.v; render(); },
    kPlace: function (el) { var p = S.contract.places, v = el.dataset.v; p[v] = !p[v]; S.contract.err = ''; render(); },
    kSv: function (el) { var p = S.contract.sv, v = el.dataset.v; p[v] = !p[v]; render(); },
    kPay: function (el) { var v = el.dataset.v; S.contract.pay = S.contract.pay === v ? '' : v; render(); },
    clearSig: function () { sigStrokes = []; render(); },
    signContract: signContract,
    retrySend: sendContract,
    newContract: function () { S.contract = newContract(); render(true); },
    pdfImg: function () { var d = S.contract.done; d.showImg = !d.showImg; render(); },
    pdfSave: function () {
      var url = URL.createObjectURL(pdfBlob()), a = document.createElement('a');
      a.href = url; a.download = S.contract.done.fileName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    },
    pdfShare: function () {
      var file = new File([pdfBlob()], S.contract.done.fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: '칠통령 시공 계약서' }).catch(function () {});
      else ACT.pdfSave();
    },

    adminLogin: function () {
      var a = S.admin; a.busy = true; a.loginErr = ''; render();
      API.post({ action: 'checkPassword', password: a.pw }).then(function () {
        a.authed = true; sessionStorage.setItem('chil-admin', a.pw); a.busy = false; adminLoad();
      }).catch(function () { a.busy = false; a.loginErr = '비밀번호가 맞지 않아요.'; render(); });
    },
    adminLogout: function () { sessionStorage.removeItem('chil-admin'); S.admin = { pw: '', authed: false, tab: 'book', list: null, books: null, closed: [], techs: [], closeDay: '', showPast: false, form: null, err: '', busy: false, loginErr: '' }; render(); },
    adminTab: function (el) { S.admin.tab = el.dataset.v; S.admin.err = ''; render(); },
    bkPast: function () { S.admin.showPast = !S.admin.showPast; render(); },
    bkSet: function (el) {
      var a = S.admin, id = el.dataset.v, st = el.dataset.s;
      if (st === '취소' && !el.dataset.sure) { el.dataset.sure = '1'; el.textContent = '한 번 더 누르면 취소'; return; }
      API.post({ action: 'setBooking', password: a.pw, id: id, status: st }).then(function () {
        (a.books || []).forEach(function (b) { if (b.id === id) b.status = st; });
        toast(st === '확정' ? '예약을 확정했어요' : st === '취소' ? '예약을 취소했어요' : '접수 상태로 되돌렸어요'); render();
      }).catch(function (e) { toast(e && e.message === 'full' ? '그날 일정표 칸이 꽉 차서 되돌리지 못했어요' : '바꾸지 못했어요. 다시 눌러주세요'); });
    },
    bkReload: function () { adminLoad(); render(); },
    asSetDay: function (el) {
      var a = S.admin, id = el.dataset.v, inp = document.getElementById('asd-' + id), d = inp && inp.value;
      if (!d) { toast('방문 날짜를 골라주세요'); return; }
      el.disabled = true; el.textContent = '일정표에 적는 중…';
      API.post({ action: 'setDay', password: a.pw, id: id, day: d }).then(function (j) {
        (a.books || []).forEach(function (b) { if (b.id === id) { b.day = d; b.cell = j.cell || ''; } });
        toast(dayLabel(d) + ' A/S 일정을 일정표에 적었어요'); render();
      }).catch(function (e) { el.disabled = false; el.textContent = '이 날로 일정 잡기'; toast(e && e.message === 'full' ? '그날 일정표 칸이 꽉 찼어요. 다른 날짜를 골라주세요' : '일정을 잡지 못했어요'); });
    },
    bkTech: function (el) {
      var a = S.admin, id = el.dataset.v, t = el.dataset.t, b = (a.books || []).find(function (x) { return x.id === id; });
      var next = b && b.tech === t ? '' : t;
      API.post({ action: 'setTech', password: a.pw, id: id, tech: next }).then(function () {
        if (b) b.tech = next; toast(next ? next + ' 색으로 일정표 칸을 바꿨어요' : '기사님 지정을 뺐어요'); render();
      }).catch(function () { toast('바꾸지 못했어요. 다시 눌러주세요'); });
    },
    bkRegroup: function (el) {
      var a = S.admin, d = el.dataset.v;
      if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = '한 번 더 누르면 칸을 다시 늘어놓아요'; return; }
      el.disabled = true; el.textContent = '정리하는 중…';
      API.post({ action: 'regroup', password: a.pw, date: d }).then(function (j) {
        toast(j.moved ? dayLabel(d) + ' 칸을 지역별로 모았어요' : '이미 지역별로 모여 있어요'); adminLoad();
      }).catch(function (e) { toast(e && e.message === 'nodate' ? '일정표에서 그 날짜 칸을 찾지 못했어요' : '정리하지 못했어요'); render(); });
    },
    bkClose: function () {
      var a = S.admin, d = a.closeDay;
      if (!d) { toast('마감할 날짜를 골라주세요'); return; }
      API.post({ action: 'setClosed', password: a.pw, date: d, closed: true }).then(function () {
        if (a.closed.indexOf(d) < 0) a.closed.push(d); a.closeDay = ''; S.book = null; toast(dayLabel(d) + ' 마감했어요'); render();
      }).catch(function () { toast('마감하지 못했어요'); });
    },
    bkOpen: function (el) {
      var a = S.admin, d = el.dataset.v;
      API.post({ action: 'setClosed', password: a.pw, date: d, closed: false }).then(function () {
        a.closed = a.closed.filter(function (x) { return x !== d; }); S.book = null; toast(dayLabel(d) + ' 마감을 풀었어요'); render();
      }).catch(function () { toast('마감을 풀지 못했어요'); });
    },
    adminNew: function () { S.admin.form = { apt: '', svcs: ['탄성코트'], color: '라이트그레이', memo: '', before: '', after: '', err: '', busy: false }; render(); },
    adminClose: function () { S.admin.form = null; render(); },
    adminSvc: function (el) { var f = S.admin.form, v = el.dataset.v, i = f.svcs.indexOf(v); if (i >= 0) f.svcs.splice(i, 1); else f.svcs.push(v); render(); },
    adminColor: function (el) { var f = S.admin.form; f.color = f.color === el.dataset.v ? '' : el.dataset.v; render(); },
    adminSubmit: function () {
      var f = S.admin.form;
      if (!f.apt.trim()) { f.err = '아파트 단지명을 적어주세요.'; return render(); }
      if (!f.after) { f.err = '시공 후 사진을 올려주세요.'; return render(); }
      if (!f.svcs.length) { f.err = '시공 내용을 하나 이상 골라주세요.'; return render(); }
      f.busy = true; f.err = ''; render();
      API.post({ action: 'addCase', password: S.admin.pw, data: { apt: f.apt.trim(), svcs: f.svcs, color: f.svcs.indexOf('탄성코트') >= 0 ? f.color : '', memo: f.memo.trim(), before: f.before, after: f.after } })
        .then(function () { S.admin.form = null; S.cases.list = null; toast('사례를 등록했어요'); adminLoad(); })
        .catch(function (e) { f.busy = false; f.err = e.message === 'auth' ? '비밀번호가 바뀌었어요. 다시 로그인해 주세요.' : '등록하지 못했어요. 사진 용량이나 인터넷 연결을 확인해 주세요.'; render(); });
    },
    adminDelete: function (el) {
      if (!confirm('이 사례를 삭제할까요? 사진도 함께 지워져요.')) return;
      API.post({ action: 'deleteCase', password: S.admin.pw, id: el.dataset.v })
        .then(function () { S.cases.list = null; toast('삭제했어요'); adminLoad(); })
        .catch(function () { toast('삭제하지 못했어요'); });
    }
  };

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    var fn = ACT[el.dataset.act];
    if (fn) { if (el.tagName === 'BUTTON') e.preventDefault(); fn(el, e); }
  });

  app.addEventListener('input', function (e) {
    var el = e.target, path = el.dataset.bind;
    if (path) {
      var v = el.value, fmt = el.dataset.fmt;
      if (fmt === 'phone') v = fmtPhone(v);
      if (fmt === 'digits') v = v.replace(/\D/g, '');
      if (fmt === 'money') v = v.replace(/\D/g, '');
      setPath(path, v);
      if (S.route === 'quote') S.quote.formErr = '';
      if (S.route === 'contract') S.contract.err = '';
      if (S.route === 'book') S.book.err = '';
      if (S.route === 'as') S.as.err = '';
      if (S.route === 'mybook') S.my.err = '';
      // 금액·형식이 바뀌는 칸만 다시 그림 (나머지는 그대로 두어 입력이 끊기지 않게)
      if (fmt === 'live') { render(); return; }
      if (fmt === 'phone' || fmt === 'money') {
        render();
        var el2 = el.id && document.getElementById(el.id);
        if (el2) { var L = el2.value.length; try { el2.setSelectionRange(L, L); } catch (er) {} }
      }
      return;
    }
    var rid = el.dataset.range;
    if (rid) {
      var box = el.closest('.compare'), p = +el.value;
      S.cases.pos[rid] = p;
      box.querySelector('.bf').style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
      box.querySelector('.line').style.left = p + '%';
    }
  });

  app.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.check) { setPath(el.dataset.check, el.checked); if (S.contract) S.contract.err = ''; if (S.book) S.book.err = ''; if (S.as) S.as.err = ''; S.quote.formErr = ''; render(); return; }
    var fk = el.dataset.file;
    if (!fk) return;
    var file = el.files && el.files[0];
    el.value = '';
    if (!file) return;
    if (fk === 'colorPhoto') {
      S.color.busy = true; S.color.err = ''; S.color.mode = 'mine'; render();
      HJCoat.load(file).then(function (st) {
        COAT.mine = { st: st, orig: st.cv.toDataURL('image/jpeg', 0.86), mask: null, seeds: [] };
        S.color.busy = false; coatRefresh();
      }).catch(function () {
        S.color.busy = false; S.color.mode = 'sample';
        S.color.err = '사진을 열지 못했어요. 다른 사진으로 해볼까요?';
        coatRefresh();
      });
    }
    if (fk === 'myPhoto') {
      HJCoat.shrink(file, 1280).then(function (url) { var e = S.my && S.my.edit; if (e && e.photos.length < 3) e.photos.push(url); render(); })
        .catch(function () { S.my.err = '사진을 열 수 없어요. 다른 사진으로 해볼까요?'; render(); });
      return;
    }
    if (fk === 'asPhoto') {
      HJCoat.shrink(file, 1280).then(function (url) { if (S.as.photos.length < 3) S.as.photos.push(url); S.as.err = ''; render(); })
        .catch(function () { S.as.err = '사진을 열 수 없어요. 다른 사진으로 해볼까요?'; render(); });
      return;
    }
    if (fk.indexOf('admin-') === 0) {
      var key = fk.slice(6);
      HJCoat.shrink(file, 1600).then(function (url) { S.admin.form[key] = url; S.admin.form.err = ''; render(); })
        .catch(function () { S.admin.form.err = '사진을 열 수 없어요.'; render(); });
    }
  });

  app.addEventListener('toggle', function (e) {
    var d = e.target; if (!d || d.tagName !== 'DETAILS' || !d.dataset.key) return;
    S.cases.open[d.dataset.key] = d.open;
  }, true);

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); S.install = e; if (S.route === 'home') render(); });

  // ---------- start ----------
  S.route = currentRoute();
  onEnter();
  if (S.route === 'home' && API.ready) loadCases();
  render(true);
  if (API.ready && S.route !== 'admin') setTimeout(function () { fetchSchedule().catch(function () {}); }, 400); // 예약 화면용 마감 정보 미리 받기
})();
