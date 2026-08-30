import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  Languages,
  MoreHorizontal,
  Plus,
  Search,
  Sigma,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { deleteRecord, getAllRecords, isDuplicate, primaryValue, saveRecord } from './db'
import type { Category, DraftRecord, LearningRecord } from './types'

const categoryMeta = {
  chinese: { title: '中文', subtitle: '汉字、词语和拼音', Icon: BookOpenText, tone: 'coral' },
  english: { title: '英文', subtitle: '单词和短语', Icon: Languages, tone: 'blue' },
  math: { title: '数学', subtitle: '认识阿拉伯数字', Icon: Sigma, tone: 'yellow' },
} as const

const emptyDraft = (category: Category): DraftRecord => {
  if (category === 'chinese') return { category, text: '', pinyin: '', note: '' }
  if (category === 'english') return { category, term: '', meaning: '', example: '' }
  return { category, numeral: '' }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  )
}

export default function App() {
  const [records, setRecords] = useState<LearningRecord[]>([])
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [editing, setEditing] = useState<LearningRecord | null | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LearningRecord | null>(null)
  const [showNotice, setShowNotice] = useState(() => localStorage.getItem('storage-notice-seen') !== 'yes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllRecords().then(setRecords).finally(() => setLoading(false))
  }, [])

  const filteredRecords = useMemo(() => {
    if (!activeCategory) return []
    const normalized = query.trim().toLocaleLowerCase()
    return records.filter((record) => {
      if (record.category !== activeCategory) return false
      if (!normalized) return true
      return Object.values(record).some(
        (value) => typeof value === 'string' && value.toLocaleLowerCase().includes(normalized),
      )
    })
  }, [activeCategory, query, records])

  function enterCategory(category: Category) {
    setActiveCategory(category)
    setQuery('')
    setMenuId(null)
  }

  function goHome() {
    setActiveCategory(null)
    setQuery('')
    setMenuId(null)
  }

  async function handleSave(draft: DraftRecord, current?: LearningRecord) {
    const saved = await saveRecord(draft, current)
    setRecords((previous) =>
      [saved, ...previous.filter((record) => record.id !== saved.id)].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    )
    setEditing(undefined)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteRecord(deleteTarget.id)
    setRecords((previous) => previous.filter((record) => record.id !== deleteTarget.id))
    setDeleteTarget(null)
    setMenuId(null)
  }

  if (loading) {
    return <main className="app-shell loading-screen">正在打开学习小本…</main>
  }

  return (
    <div className="app-shell">
      <div className="paper-grain" />
      {!activeCategory ? (
        <Home records={records} onOpen={enterCategory} />
      ) : (
        <CategoryPage
          category={activeCategory}
          records={filteredRecords}
          query={query}
          onQuery={setQuery}
          onBack={goHome}
          onAdd={() => setEditing(null)}
          menuId={menuId}
          onMenu={setMenuId}
          onEdit={(record) => {
            setEditing(record)
            setMenuId(null)
          }}
          onDelete={(record) => setDeleteTarget(record)}
        />
      )}

      {editing !== undefined && activeCategory && (
        <RecordForm
          category={activeCategory}
          existing={editing ?? undefined}
          records={records}
          onClose={() => setEditing(undefined)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog record={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}

      {showNotice && (
        <div className="notice-backdrop" role="presentation">
          <section className="notice-card" role="dialog" aria-modal="true" aria-labelledby="notice-title">
            <div className="notice-icon"><Sparkles size={22} /></div>
            <h2 id="notice-title">欢迎使用学习小本</h2>
            <p>所有记录只保存在这台设备上。清除浏览器数据或更换手机后，记录将无法恢复。</p>
            <button
              className="primary-button"
              onClick={() => {
                localStorage.setItem('storage-notice-seen', 'yes')
                setShowNotice(false)
              }}
            >
              我知道了
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

function Home({ records, onOpen }: { records: LearningRecord[]; onOpen: (category: Category) => void }) {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="eyebrow"><Sparkles size={15} /> 每一点进步都值得收藏</div>
        <h1>孩子的<br /><span>学习小本</span></h1>
        <p>把今天认识的新内容，轻轻记下来。</p>
      </header>

      <section className="category-grid" aria-label="学习分类">
        {(Object.keys(categoryMeta) as Category[]).map((category) => {
          const { title, subtitle, Icon, tone } = categoryMeta[category]
          const count = records.filter((record) => record.category === category).length
          return (
            <button key={category} className={`category-card ${tone}`} onClick={() => onOpen(category)}>
              <span className="category-icon"><Icon size={28} strokeWidth={1.8} /></span>
              <span className="category-copy">
                <strong>{title}</strong>
                <small>{subtitle}</small>
                <span className="category-count">已经记录 {count} 条</span>
              </span>
              <ChevronRight className="category-arrow" size={22} />
            </button>
          )
        })}
      </section>

      <footer className="home-footer"><span />每天认识一点点，慢慢长成大大的世界<span /></footer>
    </main>
  )
}

interface CategoryPageProps {
  category: Category
  records: LearningRecord[]
  query: string
  onQuery: (value: string) => void
  onBack: () => void
  onAdd: () => void
  menuId: string | null
  onMenu: (id: string | null) => void
  onEdit: (record: LearningRecord) => void
  onDelete: (record: LearningRecord) => void
}

function CategoryPage(props: CategoryPageProps) {
  const { title, subtitle, Icon, tone } = categoryMeta[props.category]
  return (
    <main className={`list-page ${tone}`} onClick={() => props.menuId && props.onMenu(null)}>
      <header className="list-header">
        <button className="icon-button" aria-label="返回首页" onClick={props.onBack}><ArrowLeft /></button>
        <div className="list-title-mark"><Icon size={23} /><div><h1>{title}</h1><p>{subtitle}</p></div></div>
        <span className="header-spacer" />
      </header>

      <div className="search-box">
        <Search size={19} />
        <input
          value={props.query}
          onChange={(event) => props.onQuery(event.target.value)}
          placeholder={`搜索${title}记录`}
          aria-label={`搜索${title}记录`}
        />
        {props.query && <button aria-label="清空搜索" onClick={() => props.onQuery('')}><X size={17} /></button>}
      </div>

      <div className="list-summary"><span>{props.query ? '搜索结果' : '全部记录'}</span><span>{props.records.length} 条</span></div>

      {props.records.length ? (
        <section className="record-list">
          {props.records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              menuOpen={props.menuId === record.id}
              onMenu={() => props.onMenu(props.menuId === record.id ? null : record.id)}
              onEdit={() => props.onEdit(record)}
              onDelete={() => props.onDelete(record)}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <span className="empty-icon"><Icon size={34} /></span>
          <h2>{props.query ? '没有找到相关内容' : `还没有${title}记录`}</h2>
          <p>{props.query ? '换一个关键词试试看吧。' : '点击下方按钮，记下第一个学习内容。'}</p>
        </section>
      )}

      <button className="floating-add" onClick={props.onAdd}><Plus size={22} /> 新增{title}</button>
    </main>
  )
}

function RecordCard({ record, menuOpen, onMenu, onEdit, onDelete }: {
  record: LearningRecord
  menuOpen: boolean
  onMenu: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="record-card">
      <div className="record-primary">
        <h2>{primaryValue(record)}</h2>
        {record.category === 'chinese' && record.pinyin && <span className="pinyin">{record.pinyin}</span>}
      </div>
      {record.category === 'chinese' && record.note && <p>{record.note}</p>}
      {record.category === 'english' && (
        <>{record.meaning && <p className="meaning">{record.meaning}</p>}{record.example && <p className="example">“{record.example}”</p>}</>
      )}
      <div className="record-meta"><CalendarDays size={14} /> {formatDate(record.createdAt)}</div>
      <div className="menu-wrap">
        <button className="menu-button" aria-label="记录操作" aria-expanded={menuOpen} onClick={(event) => { event.stopPropagation(); onMenu() }}><MoreHorizontal /></button>
        {menuOpen && (
          <div className="record-menu" onClick={(event) => event.stopPropagation()}>
            <button onClick={onEdit}>编辑记录</button>
            <button className="danger" onClick={onDelete}><Trash2 size={16} /> 删除记录</button>
          </div>
        )}
      </div>
    </article>
  )
}

function RecordForm({ category, existing, records, onClose, onSave }: {
  category: Category
  existing?: LearningRecord
  records: LearningRecord[]
  onClose: () => void
  onSave: (draft: DraftRecord, existing?: LearningRecord) => Promise<void>
}) {
  const [draft, setDraft] = useState<DraftRecord>(() => existing ? recordToDraft(existing) : emptyDraft(category))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const meta = categoryMeta[category]

  function setField(field: string, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }) as DraftRecord)
    setError('')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = draft.category === 'chinese' ? draft.text : draft.category === 'english' ? draft.term : draft.numeral
    if (!value.trim()) return setError(`请填写${category === 'chinese' ? '汉字或词语' : category === 'english' ? '单词或短语' : '数字'}`)
    if (category === 'math' && !/^\d+$/.test(value.trim())) return setError('数学记录只能填写阿拉伯数字，例如 1、12 或 100')
    if (isDuplicate(records, category, value, existing?.id)) return setError('这条内容已经记录过了')
    setSaving(true)
    await onSave(trimDraft(draft), existing)
  }

  return (
    <div className="form-page" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <header className="form-header">
        <button className="icon-button" aria-label="关闭" onClick={onClose}><X /></button>
        <h1 id="form-title">{existing ? '编辑' : '新增'}{meta.title}</h1>
        <span className="header-spacer" />
      </header>
      <form onSubmit={submit}>
        <div className={`form-symbol ${meta.tone}`}><meta.Icon size={28} /></div>
        <p className="form-intro">{existing ? '修改这条学习记录' : `记下新学会的${meta.title}内容`}</p>
        {draft.category === 'chinese' && <>
          <Field label="汉字或词语" required value={draft.text} onChange={(v) => setField('text', v)} placeholder="例如：苹果" autoFocus />
          <Field label="拼音" value={draft.pinyin} onChange={(v) => setField('pinyin', v)} placeholder="例如：píng guǒ" />
          <Field label="含义或例句" value={draft.note} onChange={(v) => setField('note', v)} placeholder="可以写解释，也可以写一句话" multiline />
        </>}
        {draft.category === 'english' && <>
          <Field label="单词或短语" required value={draft.term} onChange={(v) => setField('term', v)} placeholder="例如：good morning" autoFocus />
          <Field label="中文释义" value={draft.meaning} onChange={(v) => setField('meaning', v)} placeholder="例如：早上好" />
          <Field label="英文例句" value={draft.example} onChange={(v) => setField('example', v)} placeholder="例如：Good morning, Mom!" multiline />
        </>}
        {draft.category === 'math' && <Field label="阿拉伯数字" required value={draft.numeral} onChange={(v) => setField('numeral', v)} placeholder="例如：8" inputMode="numeric" autoFocus />}
        {error && <div className="form-error" role="alert">{error}</div>}
        {!existing && <div className="date-hint"><CalendarDays size={17} /><span>首次学习日期将自动记录为今天</span></div>}
        <button className="primary-button form-save" disabled={saving}><Check size={19} /> {saving ? '正在保存…' : '保存记录'}</button>
      </form>
    </div>
  )
}

function Field({ label, required, value, onChange, placeholder, multiline, autoFocus, inputMode }: {
  label: string; required?: boolean; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean; autoFocus?: boolean; inputMode?: 'numeric'
}) {
  return <label className="field"><span>{label}{required && <b>必填</b>}</span>{multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} /> : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} inputMode={inputMode} />}</label>
}

function ConfirmDialog({ record, onCancel, onConfirm }: { record: LearningRecord; onCancel: () => void; onConfirm: () => void }) {
  return <div className="notice-backdrop"><section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="delete-icon"><Trash2 size={22} /></div><h2 id="delete-title">删除这条记录？</h2><p>“{primaryValue(record)}”删除后将无法恢复。</p><div className="dialog-actions"><button className="secondary-button" onClick={onCancel}>取消</button><button className="delete-button" onClick={onConfirm}>确认删除</button></div></section></div>
}

function recordToDraft(record: LearningRecord): DraftRecord {
  if (record.category === 'chinese') return { category: 'chinese', text: record.text, pinyin: record.pinyin, note: record.note }
  if (record.category === 'english') return { category: 'english', term: record.term, meaning: record.meaning, example: record.example }
  return { category: 'math', numeral: record.numeral }
}

function trimDraft(draft: DraftRecord): DraftRecord {
  if (draft.category === 'chinese') return { ...draft, text: draft.text.trim(), pinyin: draft.pinyin.trim(), note: draft.note.trim() }
  if (draft.category === 'english') return { ...draft, term: draft.term.trim(), meaning: draft.meaning.trim(), example: draft.example.trim() }
  return { ...draft, numeral: draft.numeral.trim() }
}
