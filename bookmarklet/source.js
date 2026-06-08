// LinkedIn 공고 상세 페이지 → 지원 트래커 Quick-add
// 회사·직무명·위치를 추출해 트래커 URL의 ?add=1&… 으로 새 탭을 연다.
// 매핑은 README §북마클릿 참고. 셀렉터가 깨질 경우 추출 실패해도 빈 모달이 뜨므로 폴백 OK.
(function () {
  var APP = 'http://localhost:5173';

  var text = function (el) { return el ? (el.textContent || '').trim().replace(/\s+/g, ' ') : ''; };
  var pick = function (sels) {
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el && text(el)) return text(el);
    }
    return '';
  };

  // LinkedIn job detail page selectors (2026 — may drift)
  var position = pick([
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title',
    'h1.t-24',
    'h1',
  ]);
  var company = pick([
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
  ]);
  var location = pick([
    '.job-details-jobs-unified-top-card__bullet',
    '.job-details-jobs-unified-top-card__primary-description-container .tvm__text--low-emphasis',
    '.jobs-unified-top-card__bullet',
  ]);

  // Map LinkedIn location text → our Region enum
  var region = '기타';
  var L = location.toLowerCase();
  if (/(korea|seoul|서울|한국)/i.test(location)) region = '한국';
  else if (/singapore|싱가포르/i.test(location)) region = 'SG';
  else if (/hong kong|홍콩/i.test(location)) region = 'HK';
  else if (/(japan|tokyo|taiwan|thailand|bangkok|indonesia|jakarta|vietnam|hanoi|philippines|manila|malaysia|kuala)/i.test(L)) region = 'APAC';
  else if (/(united states|usa|new york|san francisco|seattle|austin|boston)/i.test(L)) region = 'US';

  var q = new URLSearchParams({
    add: '1',
    company: company,
    position: position,
    region: region,
    url: location.href ? '' : '',
  });
  q.set('url', window.location.href);

  window.open(APP + '/?' + q.toString(), '_blank', 'noopener');
})();
