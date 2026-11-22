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

export default function Home() {
  const [sess, setSess] = useState(undefined)
  const [v, setV] = useState('semana')
  const [items, setItems] = useState([])
  const [wk, setWk] = useState({})
  const [favs, setFavs] = useState([])
  const [msg, setMsg] = useState('')

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

  const login = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.pw.value })
    setMsg(error ? 'Email o contraseña incorrectos.' : '')
  }
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
    f.reset(); setMsg(''); load()
  }
  const delItem = async (i) => {
    await supabase.storage.from('prendas').remove([i.photo])
    await supabase.from('items').delete().eq('id', i.id); load()
  }
  const addFav = async (e, ids) => {
    e.preventDefault()
    await supabase.from('favorites').insert({ name: e.target.nombre.value.trim() || 'Mi outfit', item_ids: ids })
    setV('favoritos'); load()
  }
  const delFav = async (id) => { await supabase.from('favorites').delete().eq('id', id); load() }

  const Outfit = ({ ids, d }) => (
    <div className="fit">
      {ids.split(',').map((id) => byId[id]).filter(Boolean).map((i) => (
        <figure key={i.id}>
          <img src={photoUrl(i.photo)} alt={i.name || CATS[i.category]} loading="lazy" />
          <figcaption>{i.name || CATS[i.category]}
            {d !== undefined && <button className="tiny" onClick={() => swap(d, i.id)}>Cambiar</button>}
          </figcaption>
        </figure>
      ))}
    </div>
  )

  if (sess === undefined) return null
  if (!sess) return (
    <main className="login">
      <img src="/logo.png" alt="Outfit Live" style={{ width: 190, borderRadius: 40 }} />
      <form onSubmit={login}>
        <p><input name="email" type="email" placeholder="Email" required autoFocus /></p>
        <p><input name="pw" type="password" placeholder="Contraseña" required /></p>
        {msg && <p className="err">{msg}</p>}
        <button>Entrar</button>
      </form>
    </main>
  )

  const tabs = { semana: 'Semana', armario: 'Mi armario', favoritos: 'Favoritos', comprar: 'Qué comprar' }
  return (
    <>
      <header>
        <img src="/logo.png" alt="" style={{ borderRadius: 12 }} /><b>Outfit <i>Live</i></b>
        <nav>
          {Object.entries(tabs).map(([k, l]) => (
            <a key={k} href="#" className={v === k ? 'on' : ''} onClick={(e) => { e.preventDefault(); setV(k); setMsg('') }}>{l}</a>
          ))}
          <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut() }}>Salir</a>
        </nav>
      </header>
      <main>
        {msg && <p className="msg">{msg}</p>}

        {v === 'semana' && (<>
          <h1>Tu semana</h1>
          <button className="ok" onClick={genWeek}>Generar semana nueva</button>
          {!Object.keys(wk).length && <p className="empty">Todavía no hay semana. Sube tu ropa y pulsa «Generar semana nueva».</p>}
          <div className="grid" style={{ marginTop: 16 }}>
            {DAYS.map((dn, d) => wk[d] && (
              <div className="card" key={d}>
                <h3>{dn}</h3>
                <Outfit ids={wk[d]} d={d} />
                <div className="acts">
                  <button onClick={() => { const o = genOutfit(items); if (o) save(d, o) }}>Otro outfit</button>
                  <form className="inl" onSubmit={(e) => addFav(e, wk[d])}>
                    <input name="nombre" placeholder="Nombre" style={{ width: 110 }} /> <button className="ok">♥ Guardar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {v === 'armario' && (<>
          <h1>Mi armario</h1>
          <form className="add" onSubmit={addItem}>
            <input type="file" name="foto" accept="image/*" required />
            <select name="cat" aria-label="Tipo">{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <select name="color" aria-label="Color">{Object.keys(COLORS).map((k) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}</select>
            <input name="nombre" placeholder="Nombre (ej. Hoodie oversize)" maxLength={80} />
            <button className="ok">Añadir prenda</button>
          </form>
          {!items.length && <p className="empty">Aún no hay prendas. Sube la primera foto de tu ropa.</p>}
          {Object.entries(CATS).map(([k, l]) => {
            const set = items.filter((i) => i.category === k)
            return set.length > 0 && (<div key={k}><h2>{l}</h2><div className="grid">
              {set.map((i) => (
                <div className="card" key={i.id}>
                  <div className="fit" style={{ gridTemplateColumns: '1fr' }}><figure><img src={photoUrl(i.photo)} alt="" loading="lazy" /></figure></div>
                  <p><span className="dot" style={{ background: COLORS[i.color] }} /> {i.name || i.color}</p>
                  <button onClick={() => delItem(i)}>Eliminar</button>
                </div>
              ))}
            </div></div>)
          })}
        </>)}

        {v === 'favoritos' && (<>
          <h1>Outfits guardados</h1>
          {!favs.length && <p className="empty">Guarda con ♥ los outfits que te gusten desde la semana.</p>}
          <div className="grid">
            {favs.map((f) => (
              <div className="card" key={f.id}>
                <h3>{f.name}</h3>
                <Outfit ids={f.item_ids} />
                <div className="acts">
                  <form className="inl" onSubmit={(e) => { e.preventDefault(); save(Number(e.target.d.value), f.item_ids); setV('semana') }}>
                    <select name="d" style={{ width: 'auto' }}>{DAYS.map((dn, n) => <option key={n} value={n}>{dn}</option>)}</select> <button className="ok">Poner en el día</button>
                  </form>
                  <button onClick={() => delFav(f.id)}>Quitar</button>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {v === 'comprar' && (<>
          <h1>Qué comprar</h1>
          <p>Huecos en tu armario para un estilo oversize coreano:</p>
          <div className="grid">
            {(() => {
              const out = SHOP.filter(([c, col]) => !items.some((i) => i.category === c && i.color === col)).slice(0, 6)
              return out.length ? out.map(([c, col, t]) => (
                <div className="card" key={c + col}>
                  <h3><span className="dot" style={{ background: COLORS[col] }} /> {CATS[c]} · {col[0].toUpperCase() + col.slice(1)}</h3>
                  <p>{t}</p>
                </div>
              )) : <p className="empty">Tu armario cubre todas las ideas base. ¡Bien!</p>
            })()}
          </div>
        </>)}
      </main>
    </>
  )
}
