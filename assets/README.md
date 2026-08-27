# 문서용 이미지

README에서 참조하는 다이어그램과 화면 캡처를 둡니다.
`docs/` 는 `.gitignore` 로 제외되므로 **GitHub에서 보여야 하는 이미지는 반드시 이 폴더**에 넣습니다.

## 파일 이름 규칙

| 폴더 | 파일 | 내용 |
|---|---|---|
| `diagrams/` | `architecture.png` | 시스템 아키텍처 구성도 |
| `diagrams/` | `usecase.png` | 유스케이스 다이어그램 |
| `diagrams/` | `sequence-enrollment.png` | 실증 신청 → 결제 → 확정 시퀀스 |
| `diagrams/` | `sequence-review.png` | 상호 평가 등록 시퀀스 |
| `screenshots/` | `01-landing.png` | 랜딩 |
| `screenshots/` | `02-login.png` | 로그인 |
| `screenshots/` | `03-testbed-list.png` | 테스트베드 목록 |
| `screenshots/` | `04-testbed-detail.png` | 슬롯 상세 |
| `screenshots/` | `05-apply.png` | 실증 신청 |
| `screenshots/` | `06-applications.png` | 내 실증 신청 목록 |
| `screenshots/` | `07-review.png` | 상호 평가 |
| `screenshots/` | `08-reputation.png` | 평판 확인 |

번호를 붙이는 이유는 README의 동작 과정 순서와 화면 순서를 맞추기 위함입니다.

## 캡처 기준

- 브라우저 창 **1440px 폭**, 배율 100%
- 시드 데이터를 넣은 상태에서 캡처합니다 (빈 목록은 시연이 되지 않습니다)
- 개인정보가 보이는 계정은 쓰지 않습니다. `student@lecture.com` 으로 캡처하세요
- PNG 로 저장하고, 한 장이 1MB 를 넘으면 폭을 1440px 로 리사이즈합니다

명령줄에서 캡처하려면:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,1000 --virtual-time-budget=8000 \
  --screenshot=assets/screenshots/01-landing.png \
  http://localhost:3000/
```

로그인이 필요한 화면은 브라우저에서 직접 찍는 편이 빠릅니다.

## 다이어그램

README 안에는 mermaid 로 그린 다이어그램이 이미 들어 있어 GitHub 에서 바로 보입니다.
발표 자료용으로 따로 그린 이미지가 있으면 위 이름으로 이 폴더에 넣고,
README 의 해당 위치에서 mermaid 블록 아래 이미지 링크의 주석을 풀면 됩니다.
