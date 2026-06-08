# Roadmap & Next Steps

> 이 파일은 다음 세션에서 컨텍스트 복원용. 결정·계획·미정 항목을 여기 모아둠.
> 새 세션 시작할 때 "ROADMAP.md 읽고 시작해" 한 마디면 컨텍스트 복원됨.

---

## 현재 상태 (as of 2026-06-08)

**완료**
- v2.2 디자인 핸드오프 그대로 구현 — 칸반/테이블/모달/런치패드/북마클릿
- GitHub: https://github.com/HoonfromSeoul/application-tracker (public)
- Vercel 배포: https://application-tracker-phi-ivory.vercel.app
- Supabase Auth (Google OAuth) + per-user DB (RLS 격리)
- Admin MVP 페이지 (#/admin, role=admin인 사용자만)
- 어뷰징 방어: 카드 500 / 프리셋 50 hard cap, banned status는 RLS에서 모든 write 차단
- 본인 계정(jamespaik93@gmail.com)에 시드 데이터 복구 완료

**미해결 / 의도적 차후 작업**
- 신규가입 mode: 현재 'approved' 즉시. 트래픽 늘면 'pending' 모드 전환 검토
- Google OAuth Consent: External + Testing 상태 (test users만 가능). Production 승급은 출시 직전
- 옛 deployment URL `application-tracker-guifu7tmg-...` 도 alias로 살아있음 (혹시 Supabase Site URL 정리 안 되어도 안전망)
- GitHub ↔ Vercel 자동 배포 미연동 (지금은 `vercel deploy --prod` 수동)

---

## 다음 단계 (사용자 진행 중)

**Council Review 대기 중** — 사용자가 다른 도구들 (Huntr/Teal/Simplify 등) 벤치마킹 후 v3 스펙을 Council Review로 확정. 결과는 `docs/v3-spec.md`로 커밋 예정.

**합의된 포지셔닝**
- 트래커 하나에 집중 (Huntr/Teal처럼 all-in-one 안 함)
- 타겟: "글로벌 채용을 진지하게 추적하는 PM/Eng (한국 → SG/HK/APAC/US 다지역)"
- 차별점 가설:
  - 한국어 UI + 글로벌 채용 추적
  - LinkedIn Boolean 검색 빌더 (Huntr/Teal에 없음)
  - 티어 시스템 (S/A/B/C) — 한국 PM 멘탈 모델
  - 가벼움 + 프라이버시 (광고 없음, 본인 데이터 본인만)

---

## 차후 로드맵 (Council Review 전 가설)

### 🔥 즉시 가치 (1~2주)
- **Stale 알림** — "Airwallex 5일째 답 대기. follow-up?" 자동 표시
- **다음 액션 자동 제안** — 단계 변경 트리거 (면접 끝 → thank-you 메일 액션 / rejected → 회고 메모)
- **타임라인 뷰** — 카드별 단계 진척 + 각 단계 머문 일수
- **.ics export** — 면접 일정 캘린더 import
- **회고 모드** — rejected 카드 묶어서 패턴 인사이트

### ⭐ 중기 (3~4주)
- **Chrome Extension** (북마클릿 업그레이드):
  - LinkedIn 공고 페이지 사이드바: "이미 추적 중" / "유사 공고" / "이 회사 회고"
  - 우클릭 → "트래커에 추가"
  - Glassdoor 회사 페이지 자동 정보 보강
- **연봉 협상 모드** — offer 단계 전용 필드 (base/equity/sign-on/relo + 비교 테이블)

### 💧 장기 (6주+)
- **이메일 forward** — `cards@yourdomain.com`으로 채용 담당자 이메일 forward → 자동 카드 매칭
- **AI JD 분석** — 공고 URL → 회사/포지션/지역 자동 추출 + 티어 추천
- **익명 연봉 인사이트** — N명 이상이면 평균 공개 (네트워크 효과)
- **Slack/Discord 알림** — 면접 1일 전

---

## 트랙션 계획 (출시 전략)

순서 (마찰 적은 순):
1. 본인 LinkedIn 1포스트 + 스크린샷 3장 — 가장 ROI 좋음, PM 네트워크
2. Disquiet / EO 메이커 커뮤니티 — 사이드 프로젝트 출시 글
3. PM 단톡방 / 슬랙
4. Product Hunt (한국 섹션)
5. Show HN (영어, LinkedIn Boolean 빌더 셀링 포인트)

---

## 알려진 한계 / 향후 개선

- Supabase Free 티어: 500MB DB, 50k MAU — 수백 명까지 OK. 그 이상이면 유료 플랜 또는 데이터 정리
- Vercel Free 티어: 100GB 대역폭/월 — 정적이라 충분
- Google OAuth Test mode: test users 100명 한도. Verify 승급 필요
- 데이터 분리는 RLS로 보장됨. 본인 admin 권한도 RLS 의존 — admin 자격 잃으면 RLS도 한계
- 모바일 대응 안 됨 (데스크톱 전용 디자인 가정). 모바일 트래픽 필요하면 별도 작업

---

## 유용한 명령 / 링크

```bash
# 로컬 개발
cd ~/Downloads/application-tracker
npm run dev                          # localhost:5173, data.json 사용

# 빌드
npm run build                        # tsc + vite build, dist/ 생성

# 배포 (수동)
vercel deploy --prod --yes           # → application-tracker-phi-ivory.vercel.app

# 환경변수 확인
vercel env ls

# 북마클릿 prod URL용 재빌드
node bookmarklet/build.mjs https://application-tracker-phi-ivory.vercel.app
```

대시보드:
- Vercel: https://vercel.com/james-paik-s-projects/application-tracker
- Supabase: https://supabase.com/dashboard/project/dyxwohrmafukxavzlkhr
- GitHub: https://github.com/HoonfromSeoul/application-tracker
- Google Cloud (OAuth): https://console.cloud.google.com/auth/clients

Admin SQL (참고):
```sql
-- 새 admin 추가
update public.profiles set role = 'admin' where email = 'user@example.com';

-- 사용자 ban
update public.profiles set status = 'banned' where email = 'spammer@example.com';

-- 사용자별 데이터량 확인
select email, card_count, preset_count from public.admin_user_stats order by card_count desc;
```
