import { useEffect, useMemo, useRef, useState } from 'react'

const CATS = ['Personal', 'Trabajo', 'Compras', 'Casa']
const KEY = 'pendientes-v2'
const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) }
const fmt = s => new Date(s + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '')
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }

const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const P = {
  sun: 'M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  del: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  check: 'M5 13l4 4L19 7',
}

export default function App() {
  const [items, setItems] = useState(load)
  const [text, setText] = useState('')
  const [prio, setPrio] = useState('baja')
  const [cat, setCat] = useState(CATS[0])
  const [due, setDue] = useState(todayStr())
  const [q, setQ] = useState('')
  const [fs, setFs] = useState('all')
  const [fp, setFp] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [undo, setUndo] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const timer = useRef()

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#0a0e14' : '#f3f5fa')
  }, [theme])

  const add = e => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setItems([{ id: Date.now(), text: t, done: false, prio, cat, due, created: Date.now() }, ...items])
    setText('')
  }
  const toggle = id => setItems(items.map(i => (i.id === id ? { ...i, done: !i.done } : i)))
  const togglePrio = id => setItems(items.map(i => (i.id === id ? { ...i, prio: i.prio === 'alta' ? 'baja' : 'alta' } : i)))
  const saveEdit = id => {
    const t = editText.trim()
    if (t) setItems(items.map(i => (i.id === id ? { ...i, text: t } : i)))
    setEditId(null)
  }
  const remove = id => {
    const idx = items.findIndex(i => i.id === id)
    clearTimeout(timer.current)
    setUndo({ item: items[idx], idx })
    setItems(items.filter(i => i.id !== id))
    timer.current = setTimeout(() => setUndo(null), 5000)
  }
  const restore = () => {
    const next = [...items]
    next.splice(undo.idx, 0, undo.item)
    setItems(next)
    setUndo(null)
  }

  const total = items.length
  const doneN = items.filter(i => i.done).length
  const pct = total ? Math.round((doneN / total) * 100) : 0

  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return items
      .filter(i => (fs === 'all' || (fs === 'done') === i.done) && (fp === 'all' || i.prio === fp) && (!k || i.text.toLowerCase().includes(k)))
      .sort((a, b) =>
        a.done - b.done ||
        (a.prio === b.prio ? 0 : a.prio === 'alta' ? -1 : 1) ||
        (a.due || '9').localeCompare(b.due || '9') ||
        b.created - a.created)
  }, [items, q, fs, fp])

  const dueTag = i => {
    if (i.done || !i.due) return null
    const t = todayStr()
    return i.due < t ? 'vencido' : i.due === t ? 'hoy' : null
  }

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand">
          <img src="/logo-u4.png" alt="Logo" className="logo" />
          <div>
            <span className="eyebrow">Mi lista</span>
            <h1>Pendientes</h1>
          </div>
        </div>
        <button className="icon-btn round" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Cambiar tema">
          <Ico d={theme === 'dark' ? P.sun : P.moon} />
        </button>
      </header>

      <section className="card stats">
        <div><b>{total - doneN}</b><span>Pendientes</span></div>
        <div><b className="ok">{doneN}</b><span>Hechos</span></div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
        <small>{pct}% completado</small>
      </section>

      <form className="card add" onSubmit={add}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Nuevo pendiente..." maxLength={120} />
        <div className="row">
          <div className="seg">
            <button type="button" className={prio === 'baja' ? 'on' : ''} onClick={() => setPrio('baja')}>Baja</button>
            <button type="button" className={prio === 'alta' ? 'on hi' : ''} onClick={() => setPrio('alta')}>Alta</button>
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
          <input type="date" value={due} onChange={e => setDue(e.target.value)} />
          <button className="primary" type="submit">Agregar</button>
        </div>
      </form>

      <input className="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." />
      <div className="chips">
        {[['all', 'Todos'], ['pend', 'Pendientes'], ['done', 'Hechos']].map(([v, l]) => (
          <button key={v} className={fs === v ? 'on' : ''} onClick={() => setFs(v)}>{l}</button>
        ))}
        <span className="gap" />
        {[['all', 'Toda prioridad'], ['alta', 'Alta'], ['baja', 'Baja']].map(([v, l]) => (
          <button key={v} className={fp === v ? 'on' : ''} onClick={() => setFp(v)}>{l}</button>
        ))}
      </div>

      <ul className="list">
        {list.map(i => (
          <li key={i.id} className={'card item' + (i.done ? ' done' : '')}>
            <button className={'check' + (i.done ? ' on' : '')} onClick={() => toggle(i.id)} aria-label="Marcar">
              {i.done && <Ico d={P.check} size={16} />}
            </button>
            <div className="body">
              {editId === i.id ? (
                <input autoFocus className="edit" value={editText} onChange={e => setEditText(e.target.value)}
                  onBlur={() => saveEdit(i.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(i.id)} />
              ) : (
                <strong>{i.text}</strong>
              )}
              <div className="tags">
                <button className={'tag ' + (i.prio === 'alta' ? 'hi' : '')} onClick={() => togglePrio(i.id)}>{i.prio === 'alta' ? 'Alta' : 'Baja'}</button>
                <span className="tag">{i.cat}</span>
                {i.due && <span className={'tag ' + (dueTag(i) ? 'warn' : '')}>{dueTag(i) === 'hoy' ? 'Hoy' : dueTag(i) === 'vencido' ? 'Vencido · ' + fmt(i.due) : fmt(i.due)}</span>}
              </div>
            </div>
            <button className="icon-btn" onClick={() => { setEditId(i.id); setEditText(i.text) }} aria-label="Editar"><Ico d={P.edit} /></button>
            <button className="icon-btn" onClick={() => remove(i.id)} aria-label="Eliminar"><Ico d={P.del} /></button>
          </li>
        ))}
      </ul>
      {!list.length && <p className="empty">{total ? 'Nada con esos filtros' : 'Sin pendientes. ¡Agrega el primero!'}</p>}
      {doneN > 0 && <button className="link" onClick={() => setItems(items.filter(i => !i.done))}>Limpiar realizados</button>}

      {undo && (
        <div className="toast">Pendiente eliminado <button onClick={restore}>Deshacer</button></div>
      )}
    </main>
  )
}
