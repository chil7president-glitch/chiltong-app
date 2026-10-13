# 칠통령 웹앱

한줄(hanjul-app)과 같은 구성의 탄성코트 버전이에요. 빌드 없이 파일 그대로 Vercel에 올리면 됩니다.

## 올리는 순서
1. GitHub에서 새 저장소(예: `chiltong-app`)를 만들고 이 폴더의 파일을 전부 올려주세요.
2. Vercel → Add New Project → 그 저장소 선택 → 설정은 건드리지 않고 Deploy.

## 오픈 전에 고칠 곳
- `config.js` — 사업자 정보, 시공일 예약 규칙(BOOKING), 구글 Apps Script 주소(API_URL).
- 구글 시트 연결 — `google-apps-script/설치안내.md` 순서대로 하면 상담·예약·계약·사례가 칠통령 시트에 쌓여요. 연결 전에는 예약·상담·계약서 전송과 관리자 화면이 꺼져 있어요.
- `data.js` — 견적 단가표(시공 공간별 코셀코트·시그니처-케어·시그니처-프로 금액, 지금은 임시 금액), 색상, 계약서 문구.
- `assets/contract-logo.png` — 계약서 PDF 왼쪽 위 로고. 선명한 원본 로고로 바꾸면 더 깔끔해져요.
- `privacy.html` — 대괄호 [ ] 부분.
- `assets/logo.png`, `assets/icon-*.png` — 정식 로고가 있으면 같은 이름으로 바꿔 넣으세요.
- 파일을 고친 뒤에는 `sw.js`의 `VERSION` 숫자를 하나 올려주세요 (예: `chil-v2`).
