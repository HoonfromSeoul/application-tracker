import { useEffect, useMemo, useState } from 'react'
import type { AppData, Card, Filters, Preset, Sort, Stage, Tab, View } from './types'
import { loadData, saveData } from './lib/storage'
import { STAT_GROUPS, TIERS, REGIONS, REMOTES, blankCard, migrateCard, migratePreset } from './lib/data'
import { FilterDropdown, StatCard, ViewToggle } from './components/Controls'
import { KanbanBoard } from './components/Kanban'
import { TableView } from './components/Table'
import { EditModal } from './components/EditModal'
import { LaunchpadView } from './components/Launchpad'
import { PlusIcon } from './components/icons'
import { useAuth } from './lib/auth'
import { resetStorageState } from './lib/storage'

const SESS = { tab: 'ktrack-tab', view: 'ktrack-view' }

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem(SESS.tab) as Tab) || 'board')
  const [view, setView] = useState<View>(() => (sessionStorage.getItem(SESS.view) as View) || 'kanban')
  const [filters, setFilters] = useState<Filters>({ tier: [], region: [], remote: [] })
  const [sort, setSort] = useState<Sort>({ key: 'tier', dir: 'asc' })
  const [editing, setEditing] = useState<{ card: Card; isNew: boolean } | null>(null)

  useEffect(() => {
    loadData().then(d => {
      const rawCards = (d.cards || []) as unknown[]
      const migratedCards = rawCards.map(migrateCard)
      const cardsNext = migratedCards.map(m => m.card)
      const rawPresets = (d.presets || []) as unknown[]
      const migratedPresets = rawPresets.map(migratePreset)
      const presetsNext = migratedPresets.map(m => m.preset)
      const migratedAny =
        migratedCards.some(m => m.changed) || migratedPresets.some(m => m.changed)
      setCards(cardsNext)
      setPresets(presetsNext)
      setLoaded(true)
      // One-shot v1 → v2.2 migration: persist new shape immediately
      // so subsequent loads skip the conversion.
      if (migratedAny) {
        saveData({ version: 2, cards: cardsNext, presets: presetsNext })
          .catch(err => console.error('Migration save failed', err))
      }
    }).catch(err => {
      console.error('Failed to load data.json', err)
      setLoaded(true)
    })
  }, [])

  // Quick-add via URL params: ?add=1&company=...&position=...&region=...&url=...
  // (bookmarklet + manual paste fallback both land here)
  useEffect(() => {
    if (!loaded) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('add') !== '1') return
    const c = blankCard()
    const get = (k: string) => params.get(k) || ''
    c.company = get('company')
    c.position = get('position')
    c.url = get('url')
    const region = get('region')
    if (['한국','SG','HK','APAC','US','기타'].includes(region)) c.region = region as Card['region']
    setEditing({ card: c, isNew: true })
    setTab('board')
    // strip query so a reload doesn't re-open the modal
    window.history.replaceState({}, '', window.location.pathname)
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    const data: AppData = { version: 2, cards, presets }
    saveData(data).catch(err => console.error('Save failed', err))
  }, [loaded, cards, presets])

  useEffect(() => { sessionStorage.setItem(SESS.tab, tab) }, [tab])
  useEffect(() => { sessionStorage.setItem(SESS.view, view) }, [view])

  const openAdd = () => setEditing({ card: blankCard(), isNew: true })
  const openEdit = (card: Card) => setEditing({ card, isNew: false })
  const saveCard = (draft: Card) => {
    setCards(cs => cs.some(c => c.id === draft.id) ? cs.map(c => c.id === draft.id ? draft : c) : [...cs, draft])
    setEditing(null)
  }
  const deleteCard = (id: string) => { setCards(cs => cs.filter(c => c.id !== id)); setEditing(null) }

  const moveCard = (id: string, to: Stage) => {
    setCards(cs => cs.map(c => c.id === id && c.stage !== to ? { ...c, stage: to } : c))
  }

  const addPreset = (p: Preset) => setPresets(ps => [...ps, p])
  const deletePreset = (id: string) => setPresets(ps => ps.filter(p => p.id !== id))

  const filtered = useMemo(() => cards.filter(c =>
    (filters.tier.length === 0 || filters.tier.includes(c.tier)) &&
    (filters.region.length === 0 || filters.region.includes(c.region)) &&
    (filters.remote.length === 0 || filters.remote.includes(c.remote)),
  ), [cards, filters])

  const anyFilter = filters.tier.length || filters.region.length || filters.remote.length
  const stat = (g: keyof typeof STAT_GROUPS) => cards.filter(c => STAT_GROUPS[g].includes(c.stage)).length

  if (!loaded) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', color: 'var(--m-label-alternative)', fontSize: 14 }}>
        불러오는 중…
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <nav style={{
        display: 'flex', alignItems: 'flex-end', gap: 4,
        padding: '14px 28px 0', flexShrink: 0,
        borderBottom: '0.5px solid var(--m-line-normal)',
      }}>
        {([['board', '지원 보드'], ['launchpad', '검색 런치패드']] as [Tab, string][]).map(([id, label]) => {
          const on = tab === id
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{
                position: 'relative', padding: '8px 14px 12px', border: 'none', background: 'transparent',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                color: on ? 'var(--m-label-normal)' : 'var(--m-label-alternative)',
                transition: 'color .15s',
              }}>
              {label}
              <span style={{
                position: 'absolute', left: 6, right: 6, bottom: -0.5, height: 2,
                borderRadius: '2px 2px 0 0',
                background: on ? 'var(--m-primary-normal)' : 'transparent',
                transition: 'background .15s',
              }} />
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', paddingBottom: 10 }}>
          <AccountMenu />
        </div>
      </nav>

      {tab === 'launchpad' ? (
        <main style={{ flex: 1, minHeight: 0, paddingTop: 16 }}>
          <LaunchpadView presets={presets} onAdd={addPreset} onDelete={deletePreset} />
        </main>
      ) : (
        <>
          <header style={{ padding: '20px 28px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--m-label-normal)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                지원 트래커
              </h1>
              <span style={{ fontSize: 14, color: 'var(--m-label-assistive)' }}>
                {cards.length}개 포지션 추적 중
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <StatCard label="진행 중" value={stat('inProgress')} />
              <StatCard label="면접 단계" value={stat('interviewing')} accent="var(--m-primary-strong)" />
              <StatCard label="지원 예정" value={stat('planned')} accent="var(--m-orange-39)" />
              <StatCard label="탈락 / 마감" value={stat('closed')} accent="var(--m-label-alternative)" />
            </div>
          </header>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '16px 28px', flexShrink: 0, flexWrap: 'wrap',
          }}>
            <button onClick={openAdd} className="ktrack-btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px 9px 13px', border: 'none', borderRadius: 'var(--m-radius-8)',
                background: 'var(--m-primary-normal)', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
              <PlusIcon size={18} /> 포지션 추가
            </button>

            <div style={{ width: 1, height: 24, background: 'var(--m-line-normal)', margin: '0 2px' }} />

            <FilterDropdown label="티어" options={Object.keys(TIERS) as (keyof typeof TIERS)[]}
              selected={filters.tier} onChange={v => setFilters(f => ({ ...f, tier: v }))} />
            <FilterDropdown label="지역" options={REGIONS}
              selected={filters.region} onChange={v => setFilters(f => ({ ...f, region: v }))} />
            <FilterDropdown label="근무" options={REMOTES}
              selected={filters.remote} onChange={v => setFilters(f => ({ ...f, remote: v }))} />

            {anyFilter ? (
              <button onClick={() => setFilters({ tier: [], region: [], remote: [] })}
                style={{ padding: '8px 10px', border: 'none', background: 'transparent', color: 'var(--m-label-alternative)', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--m-radius-8)' }}>
                필터 초기화
              </button>
            ) : null}

            <div style={{ marginLeft: 'auto' }}>
              <ViewToggle view={view} setView={setView} />
            </div>
          </div>

          <main style={{ flex: 1, minHeight: 0, padding: '0 28px 24px' }}>
            {view === 'kanban' ? (
              <KanbanBoard
                cards={filtered} totalCards={cards.length} hasFilter={!!anyFilter}
                onCardClick={openEdit} onMove={moveCard}
                onAddCard={openAdd}
                onClearFilters={() => setFilters({ tier: [], region: [], remote: [] })}
              />
            ) : (
              <TableView
                cards={filtered} totalCards={cards.length} hasFilter={!!anyFilter}
                sort={sort} setSort={setSort} onRowClick={openEdit}
                onAddCard={openAdd}
                onClearFilters={() => setFilters({ tier: [], region: [], remote: [] })}
              />
            )}
          </main>
        </>
      )}

      {editing && (
        <EditModal
          card={editing.card} isNew={editing.isNew}
          onSave={saveCard} onDelete={deleteCard} onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function AccountMenu() {
  const { profile, signOut } = useAuth()
  if (!profile) return null
  const goAdmin = () => { window.location.hash = '#/admin' }
  const out = async () => { await signOut(); resetStorageState() }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {profile.role === 'admin' && (
        <button onClick={goAdmin}
          style={{
            padding: '5px 10px', border: '0.5px solid var(--m-line-normal)',
            background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
            borderRadius: 'var(--m-radius-8)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>Admin</button>
      )}
      <span style={{ fontSize: 12, color: 'var(--m-label-alternative)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {profile.email}
      </span>
      <button onClick={out}
        style={{
          padding: '5px 10px', border: '0.5px solid var(--m-line-normal)',
          background: 'var(--m-bg-normal)', color: 'var(--m-label-normal)',
          borderRadius: 'var(--m-radius-8)', fontSize: 12, fontWeight: 700,
          cursor: 'pointer',
        }}>로그아웃</button>
    </div>
  )
}
