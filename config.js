/*
 * 칠통령 웹앱 설정 — 오픈 전에 이 파일만 고치면 됩니다.
 */
window.CHIL_CONFIG = {
  // 구글 Apps Script를 "웹 앱"으로 배포한 뒤 받은 주소
  // ※ 한줄과 같은 주소를 넣으면 상담·계약·사례가 한줄 시트에 섞여요. 칠통령용 시트·스크립트를 따로 만들어 넣어주세요.
  //   비워 두면 상담 신청·계약서 전송·사례 등록만 꺼지고 나머지 화면은 그대로 동작해요.
  API_URL: 'https://script.google.com/macros/s/AKfycbwXsusQKHum-_m99RCLDxkmP-l-ENwt7MVm1mN8JKlsf13dTwsW-Al8AVcqRqe7TzLv3Q/exec',

  // 시공일 예약 규칙
  BOOKING: {
    leadDays: 21,   // 오늘부터 며칠 뒤부터 예약을 받을지 (계약서: 시공 희망일 최소 3주 전)
    asLeadDays: 2,  // A/S 신청은 오늘부터 며칠 뒤부터 받을지
    perDay: 30,     // 하루에 받을 시공 건수 — 이만큼 차면 그날은 고객 달력에 '마감'으로 보여요
    monthsAhead: 6, // 몇 달 뒤까지 예약을 받을지
    regions: ['부천', '검단', '김포', '파주', '광명', '안성', '서산', '인천', '서울'] // 예약할 때 지역 칸에 뜨는 목록 (직접 적어도 돼요)
  },

  // 사이트 하단·계약서에 들어가는 사업자 정보
  BUSINESS: {
    name: '칠통령 탄성코트',
    ceo: '[대표자명]',
    bizNo: '[사업자등록번호]',
    phone: '010-8040-4778',
    address: '[사업장 주소]',
    kakao: '' // 카카오톡 채널 주소가 있으면 넣어주세요 (예: https://pf.kakao.com/_xxxx)
  }
};
