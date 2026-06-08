import { useMemo, type CSSProperties } from 'react'
import type { Card, Sort } from '../types'
import { STAGES, STAGE_LABEL, TIER_ORDER } from '../lib/data'
import { ArrowUpRightIcon, CalendarIcon, ChevronDownIcon, ClockIcon, PlusIcon, TableIcon } from './icons'
import { looksLikeUrl, normalizeUrl } from './Form'
import { EmptyState } from './EmptyState'
import { TierBadge } from './Kanban'

interface Col {
  key: keyof Card
  label: string
  sortable: boolean
  width: number
}

const COLS: Col[] = [
  { key: 'company',    label: '회사',          sortable: true,  width: 130 },
  { key: 'position',   label: '포지션',         sortable: true,  width: 230 },
  { key: 'stage',      label: '단계',          sortable: true,  width: 110 },
  { key: 'tier',       label: '티어',          sortable: true,  width: 64 },
  { key: 'region',     label: '지역',          sortable: true,  width: 80 },
  { key: 'remote',     label: '근무',          sortable: true,  width: 110 },
  { key: 'salary',     label: 'Expected salary', sortable: false, width: 150 },
  { key: 'nextAction', label: '다음 액션',      sortable: false, width: 200 },
  { key: 'applied',    label: '지원일',         sortable: true,  width: 120 },
  { key: 'interview',  label: '면접일정',       sortable: true,  width: 140 },
]

interface TableViewProps {
  cards: Card[]
  totalCards: number
  hasFilter: boolean
  sort: Sort
  setSort: (fn: (s: Sort) => Sort) => void
  onRowClick: (c: Card) => void
  onAddCard: () => void
  onClearFilters: () => void
}

export function TableView({ cards, totalCards, hasFilter, sort, setSort, onRowClick, onAddCard, onClearFilters }: TableViewProps) {
  const sorted = useMemo(() => {
    const arr = [...cards]
    const { key, dir } = sort
    arr.sort((a, b) => {
      let av: string | number, bv: string | number
      if (key === 'stage') { av = STAGES.findIndex(s => s.id === a.stage); bv = STAGES.findIndex(s => s.id === b.stage) }
      else if (key === 'tier') { av = TIER_ORDER[a.tier]; bv = TIER_ORDER[b.tier] }
      else { av = (a[key] || '').toString().toLowerCase(); bv = (b[key] || '').toString().toLowerCase() }
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [cards, sort])

  const toggleSort = (key: keyof Card) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const th: CSSProperties = {
    textAlign: 'left', padding: '10px 14px', fontSize: 12,
    fontWeight: 700, color: 'var(--m-label-alternative)',
    borderBottom: '0.5px solid var(--m-line-normal)', whiteSpace: 'nowrap',
    background: 'var(--m-bg-normal-alt)', position: 'sticky', top: 0, zIndex: 1,
  }
  const td: CSSProperties = {
    padding: '12px 14px', fontSize: 13, color: 'var(--m-label-normal)',
    borderBottom: '0.5px solid var(--m-line-alternative)', verticalAlign: 'middle',
  }

  return (
    <div style={{
      border: '0.5px solid var(--m-line-normal)', borderRadius: 'var(--m-radius-12)',
      overflow: 'auto', background: 'var(--m-bg-normal)', height: '100%',
    }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1220 }}>
        <thead>
          <tr>
            {COLS.map(col => (
              <th key={col.key} style={{ ...th, width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {col.label}
                  {col.sortable && sort.key === col.key && (
                    <ChevronDownIcon size={13} style={{
                      transform: sort.dir === 'asc' ? 'rotate(180deg)' : 'none',
                      color: 'var(--m-primary-normal)',
                    }} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(card => (
            <tr key={card.id} className="ktrack-row" onClick={() => onRowClick(card)} style={{ cursor: 'pointer' }}>
              <td style={{ ...td, fontWeight: 700 }}>
                {looksLikeUrl(card.url) ? (
                  <a
                    href={normalizeUrl(card.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${card.company} — 공고 새 탭에서 열기`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--m-primary-strong)', textDecoration: 'none' }}
                    className="ktrack-company-link"
                  >{card.company}</a>
                ) : card.company}
              </td>
              <td style={{ ...td, color: 'var(--m-label-neutral)' }}>{card.position}</td>
              <td style={td}>
                <span style={{
                  display: 'inline-block', padding: '3px 8px', borderRadius: 'var(--m-radius-pill)',
                  background: 'var(--m-fill-normal)', fontSize: 12, fontWeight: 500,
                  color: 'var(--m-label-neutral)', whiteSpace: 'nowrap',
                }}>{STAGE_LABEL[card.stage]}</span>
              </td>
              <td style={td}><TierBadge tier={card.tier} /></td>
              <td style={{ ...td, color: 'var(--m-label-neutral)' }}>{card.region}</td>
              <td style={{ ...td, color: 'var(--m-label-neutral)' }}>{card.remote}</td>
              <td style={{ ...td, color: 'var(--m-label-neutral)' }}>{card.salary || '—'}</td>
              <td style={{ ...td, color: 'var(--m-primary-strong)', fontWeight: 500 }}>{card.nextAction || '—'}</td>
              <td style={{ ...td, color: 'var(--m-label-neutral)' }}>
                {card.applied ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <CalendarIcon size={14} style={{ opacity: 0.7 }} />{card.applied}
                  </span>
                ) : '—'}
              </td>
              <td style={{ ...td, color: 'var(--m-label-neutral)' }}>
                {card.interview ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <ClockIcon size={14} style={{ opacity: 0.7 }} />{card.interview}
                    {looksLikeUrl(card.interviewUrl) && (
                      <a
                        href={normalizeUrl(card.interviewUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="면접 링크 새 탭에서 열기"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 20, height: 20, borderRadius: 'var(--m-radius-4)',
                          color: 'var(--m-primary-strong)', textDecoration: 'none',
                        }}
                      >
                        <ArrowUpRightIcon size={13} />
                      </a>
                    )}
                  </span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        totalCards === 0 ? (
          <EmptyState
            icon={<TableIcon size={24} />}
            title="아직 추적 중인 포지션이 없어요"
            description="포지션을 추가하면 표에서 회사·단계·티어·날짜별로 정렬해 볼 수 있어요."
            action={
              <button onClick={onAddCard} className="ktrack-btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px 9px 13px', border: 'none', borderRadius: 'var(--m-radius-8)',
                  background: 'var(--m-primary-normal)', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>
                <PlusIcon size={18} /> 첫 포지션 추가
              </button>
            }
          />
        ) : hasFilter ? (
          <EmptyState
            title="조건에 맞는 포지션이 없어요"
            description={`전체 ${totalCards}개 중 현재 필터와 일치하는 카드가 없습니다.`}
            action={
              <button onClick={onClearFilters} className="ktrack-btn-ghost"
                style={{
                  padding: '9px 16px', border: '0.5px solid var(--m-line-normal)',
                  background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
                  borderRadius: 'var(--m-radius-8)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>
                필터 초기화
              </button>
            }
          />
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-label-assistive)', fontSize: 14 }}>
            조건에 맞는 포지션이 없습니다
          </div>
        )
      )}
    </div>
  )
}
