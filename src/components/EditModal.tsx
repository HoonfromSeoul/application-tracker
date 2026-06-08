import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { STAGES, TIERS, REGIONS, REMOTES } from '../lib/data'
import { Field, TextInput, Select, UrlInput, inputBase } from './Form'
import {
  CloseIcon, CoinsIcon, CalendarIcon, ClockIcon,
  ArrowRightIcon, TrashIcon,
} from './icons'

interface Props {
  card: Card
  isNew: boolean
  onSave: (c: Card) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function EditModal({ card, isNew, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Card>(card)
  const set = <K extends keyof Card>(k: K) => (v: Card[K]) => setDraft(d => ({ ...d, [k]: v }))
  const valid = draft.company.trim() && draft.position.trim()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--m-material-dimmer)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'ktrack-fade .2s ease',
      }}
    >
      <div
        role="dialog" aria-modal="true"
        style={{
          width: 'min(620px, 100%)', maxHeight: 'calc(100vh - 48px)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--m-bg-elevated)', borderRadius: 'var(--m-radius-20)',
          boxShadow: 'var(--m-shadow-xlarge)', overflow: 'hidden',
          animation: 'ktrack-rise .24s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '0.5px solid var(--m-line-normal)',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--m-label-normal)' }}>
            {isNew ? '포지션 추가' : '포지션 수정'}
          </h2>
          <button className="ktrack-iconbtn" onClick={onClose} aria-label="닫기"
            style={{ display: 'flex', padding: 6, border: 'none', background: 'transparent', borderRadius: 'var(--m-radius-8)', cursor: 'pointer', color: 'var(--m-label-neutral)' }}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="회사"><TextInput value={draft.company} onChange={set('company')} placeholder="회사명" /></Field>
          <Field label="포지션"><TextInput value={draft.position} onChange={set('position')} placeholder="포지션명" /></Field>

          <Field label="공고 / LinkedIn URL" full>
            <UrlInput value={draft.url} onChange={set('url')} placeholder="https://" />
          </Field>

          <Field label="단계">
            <Select value={draft.stage} onChange={set('stage')} options={STAGES.map(s => ({ value: s.id, label: s.label }))} />
          </Field>
          <Field label="티어">
            <Select value={draft.tier} onChange={set('tier')} options={(Object.keys(TIERS) as (keyof typeof TIERS)[]).map(t => ({ value: t, label: `${t} · ${TIERS[t].desc}` }))} />
          </Field>

          <Field label="지역">
            <Select value={draft.region} onChange={set('region')} options={REGIONS.map(r => ({ value: r, label: r }))} />
          </Field>
          <Field label="근무형태">
            <Select value={draft.remote} onChange={set('remote')} options={REMOTES.map(r => ({ value: r, label: r }))} />
          </Field>

          <Field label="Expected salary" full>
            <TextInput value={draft.salary} onChange={set('salary')} placeholder="예) SGD 140–170K" icon={CoinsIcon} />
          </Field>

          <Field label="지원 날짜"><TextInput value={draft.applied} onChange={set('applied')} placeholder="2026-06-01" icon={CalendarIcon} /></Field>
          <Field label="면접 일정"><TextInput value={draft.interview} onChange={set('interview')} placeholder="2026-06-10 08:30" icon={ClockIcon} /></Field>

          <Field label="면접 링크 (Zoom · Meet · Teams 등)" full>
            <UrlInput value={draft.interviewUrl} onChange={set('interviewUrl')} placeholder="https://zoom.us/j/…" />
          </Field>

          <Field label="다음 액션" full>
            <TextInput value={draft.nextAction} onChange={set('nextAction')} placeholder="예) 수 8:30 폰스크리닝" icon={ArrowRightIcon} />
          </Field>

          <Field label="회사 조사 메모" full>
            <textarea
              value={draft.note} onChange={(e) => set('note')(e.target.value)}
              placeholder="공고 분석 · 연봉 리서치 · 준비 메모…"
              rows={4}
              style={{ ...inputBase, resize: 'vertical', minHeight: 92, lineHeight: '22px' }}
            />
          </Field>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderTop: '0.5px solid var(--m-line-normal)', gap: 12,
        }}>
          <div>
            {!isNew && (
              <button className="ktrack-btn-danger" onClick={() => onDelete(draft.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', border: '0.5px solid var(--m-red-80)',
                  background: 'transparent', color: 'var(--m-red-40)',
                  borderRadius: 'var(--m-radius-8)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>
                <TrashIcon size={16} /> 삭제
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ktrack-btn-ghost" onClick={onClose}
              style={{
                padding: '9px 16px', border: '0.5px solid var(--m-line-normal)',
                background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
                borderRadius: 'var(--m-radius-8)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>취소</button>
            <button className="ktrack-btn-primary" disabled={!valid} onClick={() => onSave(draft)}
              style={{
                padding: '9px 18px', border: 'none',
                background: valid ? 'var(--m-primary-normal)' : 'var(--m-interaction-disable)',
                color: valid ? '#fff' : 'var(--m-label-disable)',
                borderRadius: 'var(--m-radius-8)', fontSize: 14, fontWeight: 700,
                cursor: valid ? 'pointer' : 'not-allowed',
              }}>저장</button>
          </div>
        </div>
      </div>
    </div>
  )
}
