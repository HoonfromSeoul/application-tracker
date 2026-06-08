# 지원 트래커 (Application Tracker)

PM 1인용 글로벌 채용 지원 CRM. 칸반 보드 + LinkedIn 검색 런치패드 + 북마클릿 quick-add.

원본 디자인 핸드오프: `application tracker (1).zip` (Claude Design v2.1, Montage 토큰 기반).

## 실행

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview
```

데이터는 프로젝트 루트의 `data.json`에 영구 저장. 첫 실행 시 `data.seed.json`이 자동 복사됨.
삭제하면 다음 실행 시 시드로 다시 채워짐.

## 구조

```
src/
  App.tsx             # 탭 셸 + 상태/CRUD
  types.ts            # 도메인 타입
  lib/
    data.ts           # 상수, 시드, blank*, buildLinkedInUrl
    storage.ts        # /api/data 클라이언트 (debounced PUT)
  components/
    icons.tsx         # Montage + Lucide 아이콘 (inline svg)
    Controls.tsx      # FilterDropdown · StatCard · ViewToggle
    Form.tsx          # Field · TextInput · Select (모달/런치패드 공용)
    Kanban.tsx        # @dnd-kit 기반 카드/컬럼/보드
    Table.tsx         # 정렬 가능 9컬럼 테이블
    EditModal.tsx     # 포지션 추가/수정 모달
    Launchpad.tsx     # 검색 런치패드 + LinkedIn URL 조립
  assets/
    fonts/            # Pretendard JP OTF + fonts.css
    montage-tokens.css
bookmarklet/
  source.js           # 북마클릿 원본
  build.mjs           # → bookmarklet.txt 한 줄 url 생성
  bookmarklet.txt     # 북마크바에 드래그할 javascript: URL
vite.config.ts        # data API 미들웨어 포함
data.seed.json        # 초기 데이터 시드
data.json             # 실제 저장소 (gitignore 권장)
```

## 데이터 영속화 — Storage 어댑터

`src/lib/storage.ts`는 환경에 따라 어댑터를 자동 선택해요:

| 환경 | 어댑터 | 저장 위치 |
|---|---|---|
| `npm run dev` (로컬 개발) | **FileApiAdapter** | 프로젝트 루트 `data.json` (Vite 미들웨어 `GET/PUT /api/data`) |
| `npm run build` → 정적 호스팅 | **LocalStorageAdapter** | 브라우저 `localStorage["ktrack-data-v2"]` |
| `npm run preview` | LocalStorageAdapter | 동일 |

오버라이드: `VITE_STORAGE=local` 또는 `VITE_STORAGE=file` 환경변수.

저장은 250ms 디바운스로 변경 전체를 한 번에 PUT. 첫 방문에는 번들된 `data.seed.json`을 시드로 사용.

### 다음 단계 (미니 출시 시)
`StorageAdapter` 인터페이스만 구현해 추가하면 됩니다 — `SupabaseAdapter`(per-user JSON 또는 cards/presets 테이블), `D1Adapter` 등. App.tsx는 안 건드림.

---

## 배포

### Vercel (정적 호스팅, 무료, 5분)

1. GitHub에 푸시 (`git init && git add . && git commit -m init && gh repo create ...`).
2. https://vercel.com/new → Import 선택 → 프로젝트 클릭.
3. Framework Preset: **Vite** 자동 감지. Build Command/Output Directory도 `vercel.json`이 처리.
4. Deploy → `https://<project>.vercel.app` URL 발급.

데이터는 브라우저 localStorage에 저장 — 같은 URL로 노트북·폰 어디서나 접속, 다만 **브라우저별로 데이터 분리** (개인용으로는 충분, 다기기 sync는 미니 출시 단계에서 백엔드 추가).

### Cloudflare Pages (대안)

동일 방식. `Build command: npm run build`, `Build output: dist`. Vercel과 차이 거의 없음 — 한 곳 선택.

### 커스텀 도메인

Vercel 대시보드 → Settings → Domains → 도메인 추가 → DNS 안내대로 A/CNAME 설정.

## 북마클릿 (LinkedIn → Quick-add)

LinkedIn 공고 상세 페이지에서 회사·직무명·위치를 추출해 트래커 추가 모달을 새 탭으로 연다.

1. 한 번만 실행:
   ```bash
   # 로컬 개발용
   node bookmarklet/build.mjs
   # 배포 URL용 (예: Vercel)
   node bookmarklet/build.mjs https://your-app.vercel.app
   ```
2. `bookmarklet/bookmarklet.txt` 내용을 복사 → 브라우저 북마크바에 "지원 트래커 +"라는 이름으로 새 북마크 만들고 URL에 붙여넣기.
3. LinkedIn 공고 상세 페이지에서 그 북마크 클릭 → 새 탭에 추가 모달이 prefill 상태로 뜸 → 확인하고 [저장].

### 폴백 (셀렉터 깨졌을 때)

LinkedIn DOM이 바뀌어 추출이 실패하면 빈 모달이 뜸. 또는 직접 추가하려면 다음 URL을 주소창에 입력:

```
http://localhost:5173/?add=1&url=<공고URL>&company=<회사>&position=<직무>&region=SG
```

`region` 허용값: `한국 | SG | HK | APAC | US | 기타`.

## 상태/단계 정의

8단계 칸반: `planned → review → phone → onsite → final → offer → passed → rejected`.
티어: `S(진짜 가고 싶음) / A(좋은 기회) / B(되면 좋고) / C(보험·연습용)`.
필터 3종(티어·지역·근무) 다중 선택. 통계 카운터는 **항상 전체 데이터 기준** (필터 영향 없음).

## LinkedIn URL 조립 (런치패드)

`src/lib/data.ts::buildLinkedInUrl()` 참고. 핸드오프 §11-5 매핑 그대로:

| 폼 필드 | 파라미터 | 예시 |
|---|---|---|
| 키워드 | `keywords` | `AI Product Manager` |
| 지역 | `location` | `Singapore` |
| 경력 | `f_E` | Senior=4 |
| 근무형태 | `f_WT` | Remote=2 |
| 게시시점 | `f_TPR` | 7일=`r604800` |
| 정규직만 | `f_JT` | `F` |
| 지원자<10 | `f_JIYN` | `true` |
| 최신순 | `sortBy` | `DD` |

UI에 조립된 URL을 모노스페이스로 노출 → 점프 전 cross-check.
