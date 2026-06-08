import { useState, type ReactNode } from 'react'
import type { KeywordJoin, KeywordTerm, Preset } from '../types'
import {
  buildKeywordQuery, buildLinkedInUrl, blankPreset,
  LP_LOCATIONS, LP_EXPERIENCE, LP_WORKTYPE, LP_DATEPOSTED,
} from '../lib/data'
import { Field, TextInput, Select } from './Form'
import { TrashIcon, ArrowUpRightIcon, CheckIcon, PlusIcon, CloseIcon, SearchIcon } from './icons'
import { EmptyState } from './EmptyState'

function LpChip({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 'var(--m-radius-pill)',
      background: muted ? 'var(--m-fill-alternative)' : 'var(--m-fill-normal)',
      color: muted ? 'var(--m-label-assistive)' : 'var(--m-label-neutral)',
      fontSize: 12, fontWeight: 500, lineHeight: '16px', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

// ─── Multi-term Boolean keyword input ────────────────────────────────────
interface KeywordInputProps {
  terms: KeywordTerm[]
  join: KeywordJoin
  onTerms: (t: KeywordTerm[]) => void
  onJoin: (j: KeywordJoin) => void
}

function KeywordInput({ terms, join, onTerms, onJoin }: KeywordInputProps) {
  const [text, setText] = useState('')
  const list = Array.isArray(terms) ? terms : []

  const add = () => {
    const v = text.trim()
    if (!v) return
    onTerms([...list, { term: v, exclude: false }])
    setText('')
  }
  const remove = (i: number) => onTerms(list.filter((_, idx) => idx !== i))
  const toggleExclude = (i: number) => onTerms(list.map((t, idx) => idx === i ? { ...t, exclude: !t.exclude } : t))
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    else if (e.key === 'Backspace' && !text && list.length) { remove(list.length - 1) }
  }

  const joinBtn = (val: KeywordJoin, label: string) => {
    const on = (join || 'AND') === val
    return (
      <button type="button" onClick={() => onJoin(val)}
        style={{
          padding: '3px 10px', border: 'none', borderRadius: 'var(--m-radius-pill)',
          background: on ? 'var(--m-bg-normal)' : 'transparent',
          color: on ? 'var(--m-label-normal)' : 'var(--m-label-alternative)',
          boxShadow: on ? 'var(--m-shadow-xsmall)' : 'none',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          transition: 'background .15s, color .15s, box-shadow .15s',
        }}>{label}</button>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--m-label-alternative)' }}>키워드</label>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--m-label-assistive)', whiteSpace: 'nowrap' }}>여러 키워드 조합</span>
          <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: 'var(--m-fill-normal)', borderRadius: 'var(--m-radius-pill)' }}>
            {joinBtn('AND', '모두(AND)')}
            {joinBtn('OR', '하나라도(OR)')}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        minHeight: 40, padding: '6px 8px',
        background: 'var(--m-bg-normal)', border: '0.5px solid var(--m-line-normal)',
        borderRadius: 'var(--m-radius-8)',
      }}>
        {list.map((t, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 4px 3px 9px', borderRadius: 'var(--m-radius-pill)',
            background: t.exclude ? 'var(--m-red-95)' : 'var(--kt-accent-soft)',
            color: t.exclude ? 'var(--m-red-40)' : 'var(--m-primary-strong)',
            fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            <button type="button" onClick={() => toggleExclude(i)}
              title={t.exclude ? '제외(NOT) 해제' : '제외(NOT)로 전환'}
              style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: 11 }}>
              {t.exclude ? 'NOT' : '＋'}
            </button>
            {t.term}
            <button type="button" onClick={() => remove(i)} aria-label="삭제"
              style={{ display: 'flex', border: 'none', background: 'transparent', padding: 2, cursor: 'pointer', color: 'inherit', opacity: 0.7 }}>
              <CloseIcon size={13} />
            </button>
          </span>
        ))}
        <input
          value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={add}
          placeholder={list.length ? '키워드 추가…' : '예) AI Product Manager  (Enter로 추가)'}
          style={{
            flex: 1, minWidth: 140, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: 'var(--m-label-normal)', padding: '4px 2px',
          }}
        />
      </div>
      <p style={{ margin: '6px 2px 0', fontSize: 11, color: 'var(--m-label-assistive)', lineHeight: '16px' }}>
        Enter로 키워드 추가 · 두 단어 이상은 자동으로{' '}
        <code style={{ fontFamily: 'var(--m-font-mono)' }}>"정확히 일치"</code>로 묶임 ·
        칩의 <strong>＋</strong>를 눌러{' '}
        <strong style={{ color: 'var(--m-red-40)' }}>NOT</strong>(제외)로 전환
      </p>
    </div>
  )
}

function PresetCard({ preset, onDelete }: { preset: Preset; onDelete: (id: string) => void }) {
  const url = buildLinkedInUrl(preset)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }

  const kwTerms = (Array.isArray(preset.keywords) ? preset.keywords : [])
    .filter(t => t.term && t.term.trim())
  const incCount = kwTerms.filter(t => !t.exclude).length

  const chips: { t: string; muted?: boolean }[] = []
  if (preset.location) chips.push({ t: preset.location })
  chips.push({ t: preset.experience, muted: preset.experience === '경력 무관' })
  chips.push({ t: preset.workType, muted: preset.workType === '근무형태 무관' })
  chips.push({ t: preset.datePosted, muted: preset.datePosted === '기간 무관' })
  if (preset.fullTime) chips.push({ t: '정규직' })
  if (preset.under10) chips.push({ t: '지원자 <10' })
  if (preset.latestSort) chips.push({ t: '최신순', muted: true })

  return (
    <article style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      background: 'var(--m-bg-normal)', border: '0.5px solid var(--m-line-normal)',
      borderRadius: 'var(--m-radius-16)', padding: 18, boxShadow: 'var(--m-shadow-xsmall)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--m-label-normal)', lineHeight: '22px' }}>
          {preset.name || '이름 없는 검색'}
        </h3>
        <button className="ktrack-iconbtn" onClick={() => onDelete(preset.id)} aria-label="삭제"
          style={{ display: 'flex', flexShrink: 0, padding: 4, border: 'none', background: 'transparent', borderRadius: 'var(--m-radius-8)', cursor: 'pointer', color: 'var(--m-label-assistive)' }}>
          <TrashIcon size={16} />
        </button>
      </div>

      {kwTerms.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {kwTerms.map((t, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 9px', borderRadius: 'var(--m-radius-pill)',
              background: t.exclude ? 'var(--m-red-95)' : 'var(--kt-accent-soft)',
              color: t.exclude ? 'var(--m-red-40)' : 'var(--m-primary-strong)',
              fontSize: 12, fontWeight: 700, lineHeight: '16px', whiteSpace: 'nowrap',
            }}>{t.exclude ? 'NOT ' : ''}{t.term}</span>
          ))}
          {incCount > 1 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--m-label-assistive)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              {preset.keywordJoin === 'OR' ? 'OR 조합' : 'AND 조합'}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((c, i) => <LpChip key={i} muted={c.muted}>{c.t}</LpChip>)}
      </div>

      <div style={{
        fontFamily: 'var(--m-font-mono)', fontSize: 11.5, lineHeight: '17px',
        color: 'var(--m-label-alternative)', background: 'var(--m-bg-normal-alt)',
        border: '0.5px solid var(--m-line-neutral)', borderRadius: 'var(--m-radius-8)',
        padding: '8px 10px', wordBreak: 'break-all', userSelect: 'all',
      }}>{url}</div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ktrack-btn-primary"
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 14px', border: 'none', borderRadius: 'var(--m-radius-8)',
            background: 'var(--m-primary-normal)', color: '#fff', textDecoration: 'none',
            fontSize: 13, fontWeight: 700,
          }}>
          LinkedIn에서 검색 <ArrowUpRightIcon size={16} />
        </a>
        <button onClick={copy} className="ktrack-btn-ghost"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 14px', border: '0.5px solid var(--m-line-normal)',
            background: 'var(--m-bg-normal)', color: copied ? 'var(--m-status-positive)' : 'var(--m-label-normal)',
            borderRadius: 'var(--m-radius-8)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
          {copied ? <><CheckIcon size={16} /> 복사됨</> : 'URL 복사'}
        </button>
      </div>
    </article>
  )
}

function LpCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', position: 'relative' }}>
      <span style={{
        width: 18, height: 18, borderRadius: 'var(--m-radius-4)', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: checked ? 'none' : '1.5px solid var(--m-line-solid-normal, rgba(112,115,124,.35))',
        background: checked ? 'var(--m-primary-normal)' : 'var(--m-bg-normal)',
        color: '#fff', transition: 'background .15s',
      }}>
        {checked && <CheckIcon size={14} />}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--m-label-neutral)', fontWeight: 500 }}>{label}</span>
    </label>
  )
}

function AddPresetForm({ onSave }: { onSave: (p: Preset) => void }) {
  const [draft, setDraft] = useState<Preset>(blankPreset)
  const set = <K extends keyof Preset>(k: K) => (v: Preset[K]) => setDraft(d => ({ ...d, [k]: v }))
  const hasKeyword = draft.keywords.some(t => t.term && t.term.trim())
  const valid = draft.name.trim() && hasKeyword
  const submit = () => { if (valid) { onSave(draft); setDraft(blankPreset()) } }

  return (
    <section style={{
      background: 'var(--m-bg-normal-alt)', border: '0.5px solid var(--m-line-neutral)',
      borderRadius: 'var(--m-radius-16)', padding: 20,
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--m-label-normal)' }}>
        새 검색 기준 추가
      </h3>

      <div style={{ marginBottom: 14 }}>
        <KeywordInput
          terms={draft.keywords} join={draft.keywordJoin}
          onTerms={set('keywords')} onJoin={set('keywordJoin')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Field label="이름"><TextInput value={draft.name} onChange={set('name')} placeholder="예) SG · AI PM" /></Field>
        <Field label="지역">
          <Select value={draft.location} onChange={set('location')} options={LP_LOCATIONS.map(o => ({ value: o, label: o }))} />
        </Field>
        <Field label="경력 (f_E)">
          <Select value={draft.experience} onChange={set('experience')} options={LP_EXPERIENCE.map(o => ({ value: o.label, label: o.label }))} />
        </Field>

        <Field label="근무형태 (f_WT)">
          <Select value={draft.workType} onChange={set('workType')} options={LP_WORKTYPE.map(o => ({ value: o.label, label: o.label }))} />
        </Field>
        <Field label="게시시점 (f_TPR)">
          <Select value={draft.datePosted} onChange={set('datePosted')} options={LP_DATEPOSTED.map(o => ({ value: o.label, label: o.label }))} />
        </Field>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, margin: '16px 0 18px' }}>
        <LpCheckbox checked={draft.fullTime} onChange={set('fullTime')} label="정규직만 (f_JT=F)" />
        <LpCheckbox checked={draft.latestSort} onChange={set('latestSort')} label="최신순 정렬 (sortBy=DD)" />
        <LpCheckbox checked={draft.under10} onChange={set('under10')} label="지원자 10명 미만 (f_JIYN)" />
      </div>

      {hasKeyword && (
        <div style={{ marginBottom: 18, fontSize: 12, color: 'var(--m-label-alternative)' }}>
          <span style={{ fontWeight: 700 }}>keywords →</span>{' '}
          <span style={{ fontFamily: 'var(--m-font-mono)', color: 'var(--m-label-neutral)' }}>{buildKeywordQuery(draft)}</span>
        </div>
      )}

      <button onClick={submit} disabled={!valid} className="ktrack-btn-primary"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', border: 'none', borderRadius: 'var(--m-radius-8)',
          background: valid ? 'var(--m-primary-normal)' : 'var(--m-interaction-disable)',
          color: valid ? '#fff' : 'var(--m-label-disable)',
          fontSize: 14, fontWeight: 700,
          cursor: valid ? 'pointer' : 'not-allowed',
        }}>
        <PlusIcon size={17} /> 기준 저장
      </button>
    </section>
  )
}

interface LaunchpadProps {
  presets: Preset[]
  onAdd: (p: Preset) => void
  onDelete: (id: string) => void
}

export function LaunchpadView({ presets, onAdd, onDelete }: LaunchpadProps) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '4px 28px 32px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--m-label-normal)' }}>
            검색 런치패드
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--m-label-alternative)', lineHeight: '22px', maxWidth: 720 }}>
            자주 쓰는 검색 기준을 프리셋으로 저장하고, 버튼 한 번으로 LinkedIn 채용 검색 결과로 점프한다.
            점프 전 조립된 URL을 직접 확인할 수 있다.
          </p>
        </div>

        {presets.length === 0 ? (
          <div style={{
            border: '0.5px dashed var(--m-line-normal)', borderRadius: 'var(--m-radius-16)',
            background: 'var(--m-bg-normal-alt)', marginBottom: 28,
          }}>
            <EmptyState
              icon={<SearchIcon size={24} />}
              title="저장된 검색 기준이 없어요"
              description="자주 쓰는 LinkedIn 검색 조건을 프리셋으로 저장하면, 버튼 한 번으로 같은 검색 결과로 점프할 수 있어요. 아래에서 첫 프리셋을 추가하세요."
            />
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16, marginBottom: 28,
          }}>
            {presets.map(p => <PresetCard key={p.id} preset={p} onDelete={onDelete} />)}
          </div>
        )}

        <AddPresetForm onSave={onAdd} />
      </div>
    </div>
  )
}
