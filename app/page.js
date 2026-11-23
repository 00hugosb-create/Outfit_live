'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CATS = { camiseta: 'Camisetas', sudadera: 'Sudaderas', pantalon: 'Pantalones', chaqueta: 'Chaquetas', calzado: 'Calzado' }
const COLORS = { negro: '#1e1e24', blanco: '#fafafa', gris: '#9a9aa5', beige: '#d9c7a7', denim: '#5b7ba6', marron: '#7a5338', rosa: '#ffa3da', lila: '#ab6cc4', verde: '#90d870', azul: '#3d63d6', rojo: '#d6403d', amarillo: '#f2d13b' }
const NEUTRAL = ['negro', 'blanco', 'gris', 'beige', 'denim', 'marron']
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HARMONY = [['rosa', 'lila'], ['lila', 'verde'], ['rosa', 'verde'], ['azul', 'amarillo']]
const SHOP = [
  ['pantalon', 'beige', 'Pantalón cargo oversize beige: base del look coreano, combina con todo.'],
  ['pantalon', 'negro', 'Pantalón ancho negro de pernera recta, estilo "wide fit".'],
  ['pantalon', 'denim', 'Vaquero baggy lavado claro.'],
  ['sudadera', 'gris', 'Sudadera oversize gris jaspeado, hombros caídos.'],
  ['sudadera', 'lila', 'Sudadera lila pastel: pieza de color que juega con tu paleta.'],
  ['camiseta', 'blanco', 'Camiseta blanca oversize de algodón grueso.'],
  ['camiseta', 'negro', 'Camiseta negra boxy-fit larga.'],
  ['chaqueta', 'negro', 'Bomber o chaqueta varsity negra.'],
  ['chaqueta', 'beige', 'Trench corto o chaqueta workwear beige.'],
  ['calzado', 'blanco', 'Zapatillas blancas chunky.'],
  ['calzado', 'negro', 'Zapatillas negras minimalistas o loafers.'],
  ['camiseta', 'verde', 'Camiseta verde lima: toque de color como acento.'],
]

const SLOT_OF = { camiseta: 'top', sudadera: 'top', pantalon: 'bot', calzado: 'shoe', chaqueta: 'out' }
const ORDER = ['out', 'top', 'bot', 'shoe']
const SLOT_NAME = { out: 'Chaqueta', top: 'Parte de arriba', bot: 'Pantalón', shoe: 'Calzado' }
const IC = {
  armario: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
  vestirme: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
  semana: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  favoritos: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
  comprar: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  plus: 'M12 5v14M5 12h14',
  swap: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  unlock: 'M7 11V7a5 5 0 0 1 9.9-1M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
}
const Ico = ({ n, s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[n]} /></svg>
)

const rnd = (a) => a[Math.floor(Math.random() * a.length)]
const photoUrl = (p) => supabase.storage.from('prendas').getPublicUrl(p).data.publicUrl

function score(set) {
  const non = [...new Set(set.map((i) => i.color).filter((c) => !NEUTRAL.includes(c)))].sort()
  let s = 0
  if (non.length === 0) s += 3
  else if (non.length === 1) s += 2
  else if (non.length === 2) { if (HARMONY.some((p) => [...p].sort().join() === non.join())) s += 1 }
  else s -= 2
  const by = {}
  set.forEach((i) => (by[i.category] = i.color))
  const top = by.sudadera || by.camiseta, bot = by.pantalon
  if (top && bot) s += top === bot && top !== 'negro' ? -2 : 1
  return s + Math.random()
}

function genOutfit(items, avoid = []) {
  const g = {}
  items.forEach((i) => (g[i.category] ??= []).push(i))
  const tops = [...(g.camiseta || []), ...(g.sudadera || [])]
  if (!g.pantalon || !tops.length) return null
  let best = null, bs = -99
  for (let n = 0; n < 150; n++) {
    const set = [rnd(tops), rnd(g.pantalon)]
    if (g.calzado) set.push(rnd(g.calzado))
    if (g.chaqueta && Math.random() < 0.34) set.push(rnd(g.chaqueta))
    const ids = set.map((i) => i.id).join(',')
    if (avoid.includes(ids)) continue
    const sc = score(set)
    if (sc > bs) { bs = sc; best = ids }
  }
  return best || (avoid.length ? genOutfit(items) : null)
}

function genLook(items, look, locked) {
  const g = {}
  items.forEach((i) => (g[SLOT_OF[i.category]] ??= []).push(i))
  if (!g.top || !g.bot) return null
  const byId = Object.fromEntries(items.map((i) => [i.id, i]))
  let best = null, bs = -99
  for (let n = 0; n < 120; n++) {
    const c = {}
    ORDER.forEach((s) => {
      if (locked[s]) c[s] = look?.[s]
      else if (g[s] && (s !== 'out' || Math.random() < 0.34)) c[s] = rnd(g[s]).id
    })
    const sc = score(Object.values(c).map((id) => byId[id]).filter(Boolean))
    if (sc > bs) { bs = sc; best = c }
  }
  return best
}

export default function Home() {
  const [sess, setSess] = useState(undefined)
  const [v, setV] = useState('armario')
  const [items, setItems] = useState([])
  const [wk, setWk] = useState({})
  const [favs, setFavs] = useState([])
  const [msg, setMsg] = useState('')
  const [cat, setCat] = useState('todo')
  const [sheet, setSheet] = useState(null)
  const [look, setLook] = useState(null)
  const [locked, setLocked] = useState({})

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('items').select('*').order('id', { ascending: false }),
      supabase.from('week_plan').select('*'),
      supabase.from('favorites').select('*').order('id', { ascending: false }),
    ])
    if (a.error) setMsg('No se pueden leer las prendas: ' + a.error.message)
    setItems(a.data || [])
    setWk(Object.fromEntries((b.data || []).map((r) => [r.day, r.item_ids])))
    setFavs(c.data || [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSess(data.session))
    const { data: l } = supabase.auth.onAuthStateChange((_, s) => setSess(s))
    return () => l.subscription.unsubscribe()
  }, [])
  useEffect(() => { if (sess) load() }, [sess, load])

  const byId = Object.fromEntries(items.map((i) => [i.id, i]))

  // look inicial de "Vestirme" (y se rehace si se borra alguna prenda usada)
  useEffect(() => {
    if (!items.length) return
    const ok = look && Object.values(look).every((id) => !id || byId[id])
    if (!ok) { const l = genLook(items, null, {}); if (l) setLook(l) }
  }, [items]) // eslint-disable-line

  const login = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.pw.value })
    setMsg(error ? 'Email o contraseña incorrectos.' : '')
  }
  const go = (k) => { setV(k); setMsg('') }
  const save = async (day, ids) => { await supabase.from('week_plan').upsert({ day, item_ids: ids }); load() }
  const genWeek = async () => {
    const used = [], rows = []
    for (let d = 0; d < 7; d++) {
      const o = genOutfit(items, used)
      if (!o) return setMsg('Necesitas al menos 1 pantalón y 1 camiseta o sudadera.')
      used.push(o); rows.push({ day: d, item_ids: o })
    }
    setMsg('')
    await supabase.from('week_plan').upsert(rows); load()
  }
  const swap = (d, old) => {
    const ids = wk[d].split(',').map(Number)
    const alt = items.filter((i) => i.category === byId[old].category && !ids.includes(i.id))
    if (!alt.length) return
    ids[ids.indexOf(old)] = rnd(alt).id
    save(d, ids.join(','))
  }
  const addItem = async (e) => {
    e.preventDefault()
    const f = e.target, file = f.foto.files[0]
    if (!file || file.size > 8e6) return setMsg('Elige una foto de máximo 8 MB.')
    const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const path = `${crypto.randomUUID()}.${ext}`
    const up = await supabase.storage.from('prendas').upload(path, file, { contentType: file.type })
    if (up.error) return setMsg(up.error.message)
    const ins = await supabase.from('items').insert({ category: f.cat.value, color: f.color.value, name: f.nombre.value.slice(0, 80), photo: path })
    if (ins.error) {
      await supabase.storage.from('prendas').remove([path])
      return setMsg('No se pudo guardar la prenda: ' + ins.error.message)
    }
    setSheet(null); setMsg(''); load()
  }
  const delItem = async (i) => {
    if (!window.confirm('¿Eliminar esta prenda?')) return
    await supabase.storage.from('prendas').remove([i.photo])
    await supabase.from('items').delete().eq('id', i.id); setSheet(null); load()
  }
  const addFav = async (name, ids) => {
    await supabase.from('favorites').insert({ name: name || 'Mi outfit', item_ids: ids })
    setMsg('Guardado en favoritos ♥'); load()
  }
  const delFav = async (id) => { await supabase.from('favorites').delete().eq('id', id); load() }
  const lookIds = () => ORDER.map((s) => look?.[s]).filter(Boolean).join(',')

  const Strip = ({ ids, d }) => (
    <div className="strip">
      {ids.split(',').map((id) => byId[id]).filter(Boolean).map((i) => (
        <div className="pc" key={i.id}>
          <img src={photoUrl(i.photo)} alt={i.name || CATS[i.category]} loading="lazy" />
          {d !== undefined && <button className="sw" aria-label={'Cambiar ' + (i.name || CATS[i.category])} onClick={() => swap(d, i.id)}><Ico n="swap" s={15} /></button>}
        </div>
      ))}
    </div>
  )

  if (sess === undefined) return null
  if (!sess) return (
    <main className="login">
      <img src="/logo.png" alt="Outfit Live" />
      <form onSubmit={login}>
        <input name="email" type="email" placeholder="Email" required autoFocus />
        <input name="pw" type="password" placeholder="Contraseña" required />
        {msg && <p className="err">{msg}</p>}
        <button>Entrar</button>
      </form>
    </main>
  )

  const tabs = { armario: 'Armario', vestirme: 'Vestirme', semana: 'Semana', favoritos: 'Favoritos', comprar: 'Comprar' }
  const shown = items.filter((i) => cat === 'todo' || i.category === cat)

  return (
    <div className="app">
      <header>
        <img src="/logo.png" alt="" /><b>Outfit <i>Live</i></b><span className="sp" />
        <button className="salir" onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>
      <main>
        {msg && <p className="msg">{msg}</p>}

        {v === 'armario' && (<>
          <h1>Mi armario</h1>
          <div className="stats">
            <div className="stat"><b>{items.length}</b><span>prendas</span></div>
            <div className="stat"><b>{favs.length}</b><span>outfits guardados</span></div>
            <div className="stat"><b>{Object.keys(wk).length}/7</b><span>días planificados</span></div>
          </div>
          <div className="chips">
            {['todo', ...Object.keys(CATS)].map((k) => (
              <button key={k} className={'chip' + (cat === k ? ' on' : '')} onClick={() => setCat(k)}>{k === 'todo' ? 'Todo' : CATS[k]}</button>
            ))}
          </div>
          <div className="tiles">
            <button className="tile add" onClick={() => { setMsg(''); setSheet('add') }}><Ico n="plus" s={26} />Añadir foto</button>
            {shown.map((i) => (
              <button className="tile" key={i.id} onClick={() => setSheet(i)} aria-label={i.name || CATS[i.category]}>
                <img src={photoUrl(i.photo)} alt="" loading="lazy" />
                <span className="dot" style={{ background: COLORS[i.color] }} />
              </button>
            ))}
          </div>
          {!items.length && <p className="empty" style={{ marginTop: 14 }}>Aún no hay prendas. Sube la primera foto de tu ropa.</p>}
        </>)}

        {v === 'vestirme' && (<>
          <h1>Vístete hoy</h1>
          <p className="sub">Fija con el candado lo que ya tienes claro y mezcla el resto.</p>
          {!look ? <p className="empty">Necesitas al menos 1 pantalón y 1 camiseta o sudadera.</p> : (<>
            <div className="stage">
              {ORDER.map((s) => {
                const it = byId[look[s]]
                return (
                  <div className="slot" key={s}>
                    {it ? <img src={photoUrl(it.photo)} alt={it.name || CATS[it.category]} /> : <div className="vacio">Sin {SLOT_NAME[s].toLowerCase()}</div>}
                    <button className={'lock' + (locked[s] ? ' on' : '')} aria-label={(locked[s] ? 'Soltar ' : 'Fijar ') + SLOT_NAME[s]} onClick={() => setLocked({ ...locked, [s]: !locked[s] })}><Ico n={locked[s] ? 'lock' : 'unlock'} s={16} /></button>
                    <span>{it ? (it.name || CATS[it.category]) : SLOT_NAME[s]}</span>
                  </div>
                )
              })}
            </div>
            <div className="acts">
              <button className="ok" style={{ flex: 1 }} onClick={() => { const l = genLook(items, look, locked); if (l) setLook(l) }}>Mezclar</button>
              <button style={{ flex: 1 }} onClick={() => addFav('Look de hoy', lookIds())}>♥ Guardar</button>
            </div>
            <form className="acts" onSubmit={(e) => { e.preventDefault(); save(Number(e.target.d.value), lookIds()); go('semana') }}>
              <select name="d" aria-label="Día" defaultValue={(new Date().getDay() + 6) % 7}>{DAYS.map((dn, n) => <option key={n} value={n}>{dn}</option>)}</select>
              <button className="ghost">Poner en este día</button>
            </form>
          </>)}
        </>)}

        {v === 'semana' && (<>
          <h1>Tu semana</h1>
          <p className="sub">Toca <b>↻</b> en una prenda para cambiarla.</p>
          <button className="ok" onClick={genWeek} style={{ marginBottom: 14 }}>Generar semana nueva</button>
          {!Object.keys(wk).length && <p className="empty">Todavía no hay semana. Sube tu ropa y pulsa «Generar semana nueva».</p>}
          {DAYS.map((dn, d) => wk[d] && (
            <div className="card" key={d}>
              <h3>{dn}</h3>
              <Strip ids={wk[d]} d={d} />
              <div className="acts">
                <button className="ghost" onClick={() => { const o = genOutfit(items); if (o) save(d, o) }}>Otro outfit</button>
                <button className="ok" onClick={() => addFav(dn, wk[d])}>♥ Guardar</button>
              </div>
            </div>
          ))}
        </>)}

        {v === 'favoritos' && (<>
          <h1>Outfits guardados</h1>
          {!favs.length && <p className="empty">Guarda con ♥ los outfits que te gusten.</p>}
          {favs.map((f) => (
            <div className="card" key={f.id}>
              <h3>{f.name}</h3>
              <Strip ids={f.item_ids} />
              <form className="acts" onSubmit={(e) => { e.preventDefault(); save(Number(e.target.d.value), f.item_ids); go('semana') }}>
                <select name="d" aria-label="Día">{DAYS.map((dn, n) => <option key={n} value={n}>{dn}</option>)}</select>
                <button className="ok">Poner en el día</button>
                <button type="button" className="ghost" onClick={() => delFav(f.id)}>Quitar</button>
              </form>
            </div>
          ))}
        </>)}

        {v === 'comprar' && (<>
          <h1>Qué comprar</h1>
          <p className="sub">Huecos en tu armario para un estilo oversize coreano.</p>
          {(() => {
            const out = SHOP.filter(([c, col]) => !items.some((i) => i.category === c && i.color === col)).slice(0, 6)
            return out.length ? out.map(([c, col, t]) => (
              <div className="card shop" key={c + col}>
                <span className="dot" style={{ background: COLORS[col] }} />
                <div><h3>{CATS[c]} · {col[0].toUpperCase() + col.slice(1)}</h3><p>{t}</p></div>
              </div>
            )) : <p className="empty">Tu armario cubre todas las ideas base. ¡Bien!</p>
          })()}
        </>)}
      </main>

      <nav className="tabbar" aria-label="Secciones"><div>
        {Object.entries(tabs).map(([k, l]) => (
          <button key={k} className={v === k ? 'on' : ''} onClick={() => go(k)}><span><Ico n={k} /></span>{l}</button>
        ))}
      </div></nav>

      {sheet && (
        <div className="veil" onClick={() => setSheet(null)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {sheet === 'add' ? (<>
              <h2>Añadir prenda</h2>
              <form onSubmit={addItem}>
                <input type="file" name="foto" accept="image/*" required />
                <select name="cat" aria-label="Tipo">{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <select name="color" aria-label="Color">{Object.keys(COLORS).map((k) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}</select>
                <input name="nombre" placeholder="Nombre (ej. Hoodie oversize)" maxLength={80} />
                {msg && <p className="err">{msg}</p>}
                <button className="ok">Añadir prenda</button>
              </form>
            </>) : (<>
              <img className="big" src={photoUrl(sheet.photo)} alt={sheet.name || CATS[sheet.category]} />
              <h2><span className="dot" style={{ background: COLORS[sheet.color] }} /> {sheet.name || CATS[sheet.category]}</h2>
              <p className="sub">{CATS[sheet.category]} · {sheet.color}</p>
              <div className="acts"><button className="ghost" onClick={() => setSheet(null)}>Cerrar</button><button onClick={() => delItem(sheet)}>Eliminar</button></div>
            </>)}
          </div>
        </div>
      )}
    </div>
  )
}
