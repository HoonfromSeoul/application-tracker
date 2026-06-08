import type {
  Card, Preset, Stage, Tier, Region, Remote,
  LpExperience, LpWorkType, LpDatePosted, LpLocation,
  KeywordTerm, KeywordJoin,
} from '../types'

export const STAGES: { id: Stage; label: string }[] = [
  { id: 'planned',  label: '지원 예정' },
  { id: 'review',   label: '이력서 검토' },
  { id: 'phone',    label: '폰스크리닝' },
  { id: 'onsite',   label: '대면면접' },
  { id: 'final',    label: '최종면접' },
  { id: 'offer',    label: '오퍼협상' },
  { id: 'passed',   label: '합격' },
  { id: 'rejected', label: '탈락/마감' },
]
export const STAGE_LABEL = Object.fromEntries(STAGES.map(s => [s.id, s.label])) as Record<Stage, string>

export const TIERS: Record<Tier, { label: Tier; desc: string; fg: string; bg: string }> = {
  S: { label: 'S', desc: '진짜 가고 싶음', fg: 'var(--m-red-40)',         bg: 'var(--m-red-95)' },
  A: { label: 'A', desc: '좋은 기회',        fg: 'var(--m-orange-39)',      bg: 'var(--m-orange-95)' },
  B: { label: 'B', desc: '되면 좋고',        fg: 'var(--m-blue-45)',        bg: 'var(--m-blue-95)' },
  C: { label: 'C', desc: '보험/연습용',      fg: 'var(--m-coolneutral-50)', bg: 'var(--m-fill-normal)' },
}
export const TIER_ORDER: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 }

export const REGIONS: Region[] = ['한국', 'SG', 'HK', 'APAC', 'US', '기타']
export const REMOTES: Remote[] = ['Full Remote', 'Hybrid', 'Onsite']

export const blankCard = (stage: Stage = 'planned'): Card => ({
  id: 'c' + Math.random().toString(36).slice(2, 9),
  company: '', position: '', url: '', stage, tier: 'A',
  salary: '', remote: 'Onsite', region: '한국',
  applied: '', interview: '', interviewUrl: '', nextAction: '', note: '',
})

export const STAT_GROUPS: Record<'inProgress' | 'interviewing' | 'planned' | 'closed', Stage[]> = {
  inProgress:   ['review', 'phone', 'onsite', 'final', 'offer'],
  interviewing: ['phone', 'onsite', 'final', 'offer'],
  planned:      ['planned'],
  closed:       ['rejected'],
}

// ─── Launchpad LinkedIn option maps ──────────────────────────────────────
export const LP_LOCATIONS: LpLocation[] = ['Singapore', 'Hong Kong', 'South Korea', 'Remote']
export const LP_EXPERIENCE: { label: LpExperience; code: string }[] = [
  { label: '경력 무관', code: '' },
  { label: 'Associate', code: '3' },
  { label: 'Senior', code: '4' },
  { label: 'Director', code: '5' },
  { label: 'Executive', code: '6' },
]
export const LP_WORKTYPE: { label: LpWorkType; code: string }[] = [
  { label: '근무형태 무관', code: '' },
  { label: 'On-site', code: '1' },
  { label: 'Remote', code: '2' },
  { label: 'Hybrid', code: '3' },
]
export const LP_DATEPOSTED: { label: LpDatePosted; code: string }[] = [
  { label: '기간 무관', code: '' },
  { label: '24시간', code: 'r86400' },
  { label: '7일', code: 'r604800' },
  { label: '30일', code: 'r2592000' },
]

// Wrap multi-word terms in quotes for LinkedIn exact-phrase matching.
export function quoteIfPhrase(t: string): string {
  const v = (t || '').trim()
  if (!v) return ''
  return /\s/.test(v) && !/^".*"$/.test(v) ? `"${v}"` : v
}

// Assemble a LinkedIn Boolean keyword query from a preset's keyword model.
// Backward-compatible with a plain string `keywords` (legacy v1 data).
export function buildKeywordQuery(p: Pick<Preset, 'keywords' | 'keywordJoin'> | { keywords: unknown; keywordJoin?: KeywordJoin }): string {
  const kw = p.keywords
  if (typeof kw === 'string') return kw.trim()
  const terms = Array.isArray(kw) ? (kw as KeywordTerm[]) : []
  const inc = terms.filter(t => t.term && t.term.trim() && !t.exclude).map(t => quoteIfPhrase(t.term))
  const exc = terms.filter(t => t.term && t.term.trim() && t.exclude).map(t => 'NOT ' + quoteIfPhrase(t.term))
  const join = p.keywordJoin === 'OR' ? ' OR ' : ' AND '
  let s = ''
  if (inc.length) s = (inc.length > 1 && exc.length) ? '(' + inc.join(join) + ')' : inc.join(join)
  if (exc.length) s = (s ? s + ' ' : '') + exc.join(' ')
  return s.trim()
}

export function buildLinkedInUrl(p: Preset): string {
  const base = 'https://www.linkedin.com/jobs/search/'
  const params: [string, string][] = []
  params.push(['keywords', buildKeywordQuery(p)])
  if (p.location) params.push(['location', p.location])
  const exp = LP_EXPERIENCE.find(e => e.label === p.experience)
  if (exp && exp.code) params.push(['f_E', exp.code])
  const wt = LP_WORKTYPE.find(w => w.label === p.workType)
  if (wt && wt.code) params.push(['f_WT', wt.code])
  const tpr = LP_DATEPOSTED.find(d => d.label === p.datePosted)
  if (tpr && tpr.code) params.push(['f_TPR', tpr.code])
  if (p.fullTime) params.push(['f_JT', 'F'])
  if (p.under10) params.push(['f_JIYN', 'true'])
  if (p.latestSort) params.push(['sortBy', 'DD'])
  return base + '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
}

export const blankPreset = (): Preset => ({
  id: 'p' + Math.random().toString(36).slice(2, 9),
  name: '', keywords: [], keywordJoin: 'AND', location: 'Singapore',
  experience: '경력 무관', workType: '근무형태 무관', datePosted: '7일',
  fullTime: true, latestSort: true, under10: false,
})

// Ensure cards have all fields the current Card shape requires.
// Returns the normalized card and whether anything was added.
export function migrateCard(raw: unknown): { card: Card; changed: boolean } {
  const c = raw as Record<string, unknown>
  if (typeof c.interviewUrl === 'string') return { card: c as unknown as Card, changed: false }
  return { card: { ...(c as unknown as Card), interviewUrl: '' }, changed: true }
}

// v1 → v2.2 migration. Converts legacy string `keywords` to KeywordTerm[].
// Returns the normalized preset and whether anything actually changed.
export function migratePreset(raw: unknown): { preset: Preset; changed: boolean } {
  const p = raw as Record<string, unknown>
  let changed = false
  let keywords: KeywordTerm[]
  const rawKw = p.keywords
  if (typeof rawKw === 'string') {
    const s = rawKw.trim()
    keywords = s ? [{ term: s }] : []
    changed = true
  } else if (Array.isArray(rawKw)) {
    keywords = rawKw as KeywordTerm[]
  } else {
    keywords = []
    changed = true
  }
  const keywordJoin: KeywordJoin = p.keywordJoin === 'OR' ? 'OR' : 'AND'
  if (p.keywordJoin !== keywordJoin) changed = true
  return {
    preset: { ...(p as unknown as Preset), keywords, keywordJoin },
    changed,
  }
}
