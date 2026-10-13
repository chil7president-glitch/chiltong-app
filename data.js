/* 칠통령 기본 데이터 — 견적 단가·색상·계약서 문구를 바꾸려면 이 파일을 고치세요.
 * ※ 아래 금액과 안내 문구는 처음 세팅용 초안이에요. 오픈 전에 실제 단가·정책으로 꼭 바꿔주세요. */
window.HJ = (function () {
  // 견적 단가표: [id, 시공 공간, 코셀코트, 시그니처-케어, 시그니처-프로]
  // ※ 금액은 임시예요. 실제 단가로 바꿔주세요.
  var ITEMS = [
    ['laundry', '다용도실', 150000, 200000, 250000],
    ['outdoorShelter', '실외기실+대피공간', 150000, 200000, 250000],
    ['masterBalcony', '안방 발코니', 150000, 200000, 250000],
    ['shelterSep', '대피공간 (따로 있는 경우)', 100000, 130000, 160000]
  ];
  var PRICE_COL = { cosel: 2, care: 3, pro: 4 }; // 탄성코트 재료(PRODUCTS의 id) → 단가표 열

  // [id, 이름, 색, 한마디]
  var COLORS = [
    ['white', '퓨어화이트', '#F3F2EE', '가장 많이 골라요'],
    ['lgray', '라이트그레이', '#D4D7D7', '때가 덜 보여요'],
    ['violet', '바이올렛', '#C9B8E3', '산뜻한 포인트']
  ];

  // 입주 준비 코스: [이름, 한 줄 설명] — 이 순서대로 화면에 보여요
  var GUIDE = [
    ['탄성코트', '베란다·다용도실 벽과 천장을 코팅해 곰팡이와 결로 얼룩을 막아요'],
    ['줄눈', '욕실·현관 타일 사이를 메워 물때와 오염을 막아요'],
    ['입주청소', '공사 먼지와 자재 찌꺼기를 깨끗하게 치워요'],
    ['나노코팅', '욕실 도기와 주방 상판에 얼룩 방지 코팅을 해요'],
    ['새집증후군', '새 자재에서 나오는 유해물질을 줄여요']
  ];

  // ---------- 계약서 (종이 계약서와 같은 내용) ----------
  var PRODUCTS = [['cosel', '코셀코트'], ['care', '시그니처-케어'], ['pro', '시그니처-프로']];
  var PLACES = [['balcony', '발코니'], ['laundry', '다용도실'], ['outdoor', '실외기실'], ['shelter', '대피공간']];
  var SV = [['dress', '드레스룸'], ['pantry', '펜트리']]; // 곰팡이항균SV
  var PAYS = [['cash', '현금'], ['card', '카드']];
  var CONTRACT = {
    notes: [
      '시공순서 : 탄성코트 > 줄눈 > 청소 > 나노코팅 > 입주',
      '아파트 잔금날짜나 입주날짜가 확정되시면 칠통령 탄성코트로 바로 전화 부탁드립니다.',
      '시공 희망일 최소 3주 전에는 칠통령 탄성코트로 전화 주셔야 합니다.'
    ],
    lead: '탄성코트시공 계약자를 "갑"으로 하고 칠통령을 "을"이라 하여 다음과 같이 계약을 체결한다.',
    terms: function (years) {
      return [
        ['제1조 [계약금 및 잔금납부]', '"갑"은 계약서에 서명 날인 후에 당일 계약금을 지불하며, 공사완료 후 3일 이내에 "을"에게 잔금을 지불한다.'],
        ['제2조 [하자보수]', '"갑"의 사용, 관리상의 하자를 제외한 "을"의 시공상의 하자에 대하여 공사완료일로부터 (' + (years || '   ') + ')년간 "을"이 하자보수 책임을 진다. 단, "갑"의 사용상 과실에 의한 하자와 외부요인(크랙, 누수, 균열 등)에 의한 하자는 유상으로 보수한다.']
      ];
    },
    payback: function (amt) { return '시공이 끝난 후 잔금 완결하시고 시공후기를 카페에 작성하여 주시면 ' + (amt || '______') + ' 페이백 해드립니다.'; }
  };

  // 서버(구글 시트)에 사례가 하나도 없을 때만 보여주는 예시
  var SAMPLE_CASES = [
    { id: 'sample1', apt: '[예시] 칠통령센트럴', svcs: ['탄성코트'], color: '퓨어화이트', memo: '전후 비교 예시예요. 사진 위를 좌우로 밀어보세요.', before: 'assets/case-before.jpg', after: 'assets/case-white.jpg', date: '2026.10.12' },
    { id: 'sample2', apt: '[예시] 칠통령센트럴', svcs: ['탄성코트'], color: '바이올렛', memo: '같은 단지 바이올렛 탄성코트 예시예요.', before: 'assets/case-before.jpg', after: 'assets/case-violet.jpg', date: '2026.10.12' }
  ];

  function man(n) { return Number(n || 0).toLocaleString('ko-KR') + '만원'; }
  function won(n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; }
  function num(v) { var n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; }
  function item(id) { return ITEMS.find(function (x) { return x[0] === id; }); }
  function color(id) { return COLORS.find(function (x) { return x[0] === id || x[1] === id; }); }

  // 견적: 고른 공간 단가를 재료에 맞춰 더하기
  function bestPrice(ids, mat) {
    var col = PRICE_COL[mat] || 2;
    return { total: ids.reduce(function (s, id) { var it = item(id); return s + (it ? it[col] : 0); }, 0), pack: '' };
  }

  return { ITEMS: ITEMS, COLORS: COLORS, GUIDE: GUIDE, PRODUCTS: PRODUCTS, PLACES: PLACES, SV: SV, PAYS: PAYS, CONTRACT: CONTRACT, SAMPLE_CASES: SAMPLE_CASES, won: won, man: man, num: num, item: item, color: color, bestPrice: bestPrice };
})();
