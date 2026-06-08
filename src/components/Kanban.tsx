import { useState, type ComponentType, type CSSProperties } from 'react'
import {
  useDraggable, useDroppable, DndContext, DragOverlay,
  type DragEndEvent, type DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { Card, Stage } from '../types'
import { STAGES, TIERS } from '../lib/data'
import {
  ArrowRightIcon, ArrowUpRightIcon, BagIcon, CalendarIcon, ClockIcon,
  CoinsIcon, KanbanIcon, LocationIcon, PlusIcon,
} from './icons'
import { looksLikeUrl, normalizeUrl } from './Form'
import { EmptyState } from './EmptyState'

export function TierBadge({ tier, size = 'sm' }: { tier: Card['tier']; size?: 'sm' | 'md' }) {
  const t = TIERS[tier] || TIERS.C
  const dims = size === 'sm'
    ? { width: 18, height: 18, fontSize: 11 }
    : { width: 22, height: 22, fontSize: 12 }
  return (
    <span
      title={`Tier ${t.label} · ${t.desc}`}
      style={{
        ...dims, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--m-radius-4)', background: t.bg, color: t.fg,
        fontWeight: 700, flexShrink: 0,
      }}
    >{t.label}</span>
  )
}

function Chip({ icon: Icon, children }: { icon?: ComponentType<{ size?: number; style?: CSSProperties }>; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 'var(--m-radius-pill)',
      background: 'var(--m-fill-normal)', color: 'var(--m-label-neutral)',
      fontSize: 12, fontWeight: 500, lineHeight: '16px', whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon size={13} style={{ opacity: 0.7, flexShrink: 0 }} />}
      {children}
    </span>
  )
}

// Pure visual content. Reused by the in-list card and the DragOverlay clone.
function CardBody({ card }: { card: Card }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {(() => {
          const hasUrl = looksLikeUrl(card.url)
          const companyText = card.company || '—'
          const baseStyle: CSSProperties = {
            fontSize: 13, fontWeight: 700, lineHeight: '18px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0, textDecoration: 'none',
          }
          return hasUrl ? (
            <a
              href={normalizeUrl(card.url)}
              target="_blank"
              rel="noopener noreferrer"
              title={`${companyText} — 공고 새 탭에서 열기`}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ ...baseStyle, color: 'var(--m-primary-strong)' }}
              className="ktrack-company-link"
            >
              {companyText}
            </a>
          ) : (
            <span style={{ ...baseStyle, color: 'var(--m-label-normal)' }}>
              {companyText}
            </span>
          )
        })()}
        <TierBadge tier={card.tier} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--m-label-alternative)', lineHeight: '16px', marginTop: -4 }}>
        {card.position}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Chip icon={LocationIcon}>{card.region}</Chip>
        <Chip icon={BagIcon}>{card.remote}</Chip>
      </div>
      {card.salary && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--m-label-neutral)', fontSize: 12 }}>
          <CoinsIcon size={14} style={{ opacity: 0.75, flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{card.salary}</span>
        </div>
      )}
      {(card.applied || card.interview) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {card.applied && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 'var(--m-radius-pill)',
              background: 'var(--m-fill-normal)', color: 'var(--m-label-alternative)',
              fontSize: 11, fontWeight: 500, lineHeight: '16px', whiteSpace: 'nowrap',
            }}>
              <CalendarIcon size={12} style={{ opacity: 0.75, flexShrink: 0 }} />
              지원 {card.applied}
            </span>
          )}
          {card.interview && (() => {
            const hasUrl = looksLikeUrl(card.interviewUrl)
            const inner = (
              <>
                <ClockIcon size={12} style={{ flexShrink: 0 }} />
                면접 {card.interview}
                {hasUrl && <ArrowUpRightIcon size={12} style={{ flexShrink: 0 }} />}
              </>
            )
            const chipStyle: CSSProperties = {
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 'var(--m-radius-pill)',
              background: 'var(--m-blue-95)', color: 'var(--m-primary-strong)',
              fontSize: 11, fontWeight: 700, lineHeight: '16px', whiteSpace: 'nowrap',
              textDecoration: 'none',
            }
            return hasUrl ? (
              <a
                href={normalizeUrl(card.interviewUrl)}
                target="_blank"
                rel="noopener noreferrer"
                title="면접 링크 새 탭에서 열기"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={chipStyle}
              >{inner}</a>
            ) : (
              <span style={chipStyle}>{inner}</span>
            )
          })()}
        </div>
      )}
      {card.nextAction && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 6,
          color: 'var(--m-primary-strong)', fontSize: 12, fontWeight: 500,
          lineHeight: '16px',
        }}>
          <ArrowRightIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{card.nextAction}</span>
        </div>
      )}
    </>
  )
}

const cardShellStyle: CSSProperties = {
  background: 'var(--m-bg-normal)',
  border: '0.5px solid var(--m-line-normal)',
  borderRadius: 'var(--m-radius-12)',
  padding: 12,
  display: 'flex', flexDirection: 'column', gap: 8,
  boxShadow: 'var(--m-shadow-xsmall)',
}

// In-list card. Motion is handled by DragOverlay, so we don't translate here —
// we only fade the source while it's being dragged.
function DraggableKanbanCard({ card, onClick }: { card: Card; onClick: (c: Card) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id, data: { card } })
  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="ktrack-card"
      style={{
        ...cardShellStyle,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
      onClick={(e) => {
        if (!isDragging) onClick(card)
        e.stopPropagation()
      }}
    >
      <CardBody card={card} />
    </article>
  )
}

// Overlay clone — visually identical but lifted with a stronger shadow + tilt.
function OverlayCard({ card }: { card: Card }) {
  return (
    <article
      style={{
        ...cardShellStyle,
        width: 248, // column inner width (264 minus 8px left/right gutter)
        cursor: 'grabbing',
        boxShadow: 'var(--m-shadow-large)',
        transform: 'rotate(1.5deg)',
        pointerEvents: 'none',
      }}
    >
      <CardBody card={card} />
    </article>
  )
}

function KanbanColumn({ stage, cards, onCardClick }: { stage: { id: Stage; label: string }; cards: Card[]; onCardClick: (c: Card) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id })
  return (
    <section
      ref={setNodeRef}
      style={{
        flex: '0 0 264px', width: 264,
        display: 'flex', flexDirection: 'column',
        background: isOver ? 'var(--m-blue-99)' : 'var(--m-bg-normal-alt)',
        border: isOver ? '1px dashed var(--m-primary-normal)' : '0.5px solid var(--m-line-neutral)',
        borderRadius: 'var(--m-radius-12)',
        maxHeight: '100%',
        transition: 'border-color .15s, background .15s',
      }}
    >
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 8px',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--m-label-normal)' }}>
          {stage.label}
        </span>
        <span style={{
          minWidth: 20, height: 20, padding: '0 6px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--m-radius-pill)', background: 'var(--m-fill-normal)',
          color: 'var(--m-label-alternative)', fontSize: 12, fontWeight: 700,
        }}>{cards.length}</span>
      </header>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '4px 8px 12px', overflowY: 'auto',
      }}>
        {cards.map(c => (
          <DraggableKanbanCard key={c.id} card={c} onClick={onCardClick} />
        ))}
        {cards.length === 0 && (
          <div style={{
            border: '1px dashed var(--m-line-normal)', borderRadius: 'var(--m-radius-8)',
            padding: '16px 12px', textAlign: 'center',
            color: 'var(--m-label-assistive)', fontSize: 12,
          }}>비어 있음</div>
        )}
      </div>
    </section>
  )
}

interface KanbanBoardProps {
  cards: Card[]
  totalCards: number      // total before filtering, for empty-state messaging
  hasFilter: boolean
  onCardClick: (c: Card) => void
  onMove: (cardId: string, toStage: Stage) => void
  onAddCard: () => void
  onClearFilters: () => void
}

export function KanbanBoard({ cards, totalCards, hasFilter, onCardClick, onMove, onAddCard, onClearFilters }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeCard = activeId ? cards.find(c => c.id === activeId) ?? null : null

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }
  const onDragEnd = (e: DragEndEvent) => {
    const over = e.over?.id as Stage | undefined
    const id = e.active.id as string
    if (over) onMove(id, over)
    setActiveId(null)
  }
  const onDragCancel = () => setActiveId(null)

  // Empty states — board level
  if (totalCards === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon={<KanbanIcon size={24} />}
          title="아직 추적 중인 포지션이 없어요"
          description="지원할 포지션을 카드로 추가해 단계별로 추적하세요. 칸반 카드는 드래그로 단계를 옮길 수 있습니다."
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
      </div>
    )
  }
  if (cards.length === 0 && hasFilter) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
      <div style={{ display: 'flex', gap: 12, height: '100%', overflowX: 'auto', paddingBottom: 4 }}>
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.id} stage={stage}
            cards={cards.filter(c => c.stage === stage.id)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeCard ? <OverlayCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
