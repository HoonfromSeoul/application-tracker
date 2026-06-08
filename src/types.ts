export type Stage =
  | 'planned' | 'review' | 'phone' | 'onsite'
  | 'final' | 'offer' | 'passed' | 'rejected'

export type Tier = 'S' | 'A' | 'B' | 'C'
export type Remote = 'Full Remote' | 'Hybrid' | 'Onsite'
export type Region = '한국' | 'SG' | 'HK' | 'APAC' | 'US' | '기타'

export interface Card {
  id: string
  company: string
  position: string
  url: string
  stage: Stage
  tier: Tier
  salary: string
  remote: Remote
  region: Region
  applied: string
  interview: string
  interviewUrl: string
  nextAction: string
  note: string
}

export type LpLocation = 'Singapore' | 'Hong Kong' | 'South Korea' | 'Remote'
export type LpExperience = '경력 무관' | 'Associate' | 'Senior' | 'Director' | 'Executive'
export type LpWorkType = '근무형태 무관' | 'On-site' | 'Remote' | 'Hybrid'
export type LpDatePosted = '기간 무관' | '24시간' | '7일' | '30일'

export interface KeywordTerm {
  term: string
  exclude?: boolean
}
export type KeywordJoin = 'AND' | 'OR'

export interface Preset {
  id: string
  name: string
  keywords: KeywordTerm[]
  keywordJoin: KeywordJoin
  location: LpLocation
  experience: LpExperience
  workType: LpWorkType
  datePosted: LpDatePosted
  fullTime: boolean
  latestSort: boolean
  under10: boolean
}

// v1 preset shape — string keywords, no keywordJoin. Used only by the migration.
export interface LegacyPreset extends Omit<Preset, 'keywords' | 'keywordJoin'> {
  keywords: string | KeywordTerm[]
  keywordJoin?: KeywordJoin
}

export interface AppData {
  version: number
  stages?: Stage[]
  cards: Card[]
  presets: Preset[]
}

export type Tab = 'board' | 'launchpad'
export type View = 'kanban' | 'table'
export interface Filters {
  tier: Tier[]
  region: Region[]
  remote: Remote[]
}
export interface Sort {
  key: keyof Card
  dir: 'asc' | 'desc'
}
