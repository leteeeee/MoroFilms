import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Star, Edit3, Check, Clock, Search, X, Clapperboard, User, ArrowLeft, Calendar, ChevronDown } from 'lucide-react'
import './Home.css'

function Countdown({ fechaLimite }) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    const calc = () => {
      const ms = new Date(fechaLimite) - new Date()
      if (ms <= 0) { setDiff(null); return }
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      setDiff({ d, h, m })
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [fechaLimite])

  if (!diff) return <span className="home-deadline-passed">¡Plazo cumplido!</span>
  return (
    <div className="home-countdown">
      <Clock size={13}/>
      {diff.d > 0 && <><strong>{diff.d}</strong>d </>}
      <strong>{diff.h}</strong>h <strong>{diff.m}</strong>m
    </div>
  )
}

function StarRating({ value, onChange }) {
  const [hov, setHov] = useState(0)
  const stars = [2, 4, 6, 8, 10]
  return (
    <div className="star-rating">
      {stars.map(v => (
        <button key={v} type="button"
          className={`star-btn ${(hov || value) >= v ? 'active' : ''}`}
          onMouseEnter={() => setHov(v)} onMouseLeave={() => setHov(0)}
          onClick={() => onChange(v)}>
          <Star size={22} fill={(hov || value) >= v ? 'currentColor' : 'none'} strokeWidth={1.5}/>
        </button>
      ))}
      {value > 0 && <span className="star-label">{value}/10</span>}
    </div>
  )
}

function MovieDetail({ pelicula, onClose }) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <div className="detail-handle"/>
        <div className="detail-content">
          {pelicula.poster && (
            <img src={`https://image.tmdb.org/t/p/w342${pelicula.poster}`}
              alt={pelicula.titulo} className="detail-poster"/>
          )}
          <div className="detail-info">
            <h2 className="detail-titulo">{pelicula.titulo}</h2>
            {pelicula.titulo_original && pelicula.titulo_original !== pelicula.titulo && (
              <p className="detail-titulo-orig">{pelicula.titulo_original}</p>
            )}
            <div className="detail-meta">
              {pelicula.anio && <span className="detail-anio">{pelicula.anio}</span>}
              {pelicula.director && <span className="detail-director">Dir. {pelicula.director}</span>}
            </div>
            {pelicula.fecha_limite && (
              <div className="detail-deadline">
                <Calendar size={13}/>
                <span>Ver antes del {new Date(pelicula.fecha_limite).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
              </div>
            )}
            {pelicula.descripcion && (
              <p className="detail-sinopsis">{pelicula.descripcion}</p>
            )}
          </div>
        </div>
        <button className="detail-close" onClick={onClose}>
          <ChevronDown size={20}/> Cerrar
        </button>
      </div>
    </div>
  )
}

function SearchPanel({ user, onClose, onActivated }) {
  const [mode, setMode]         = useState('movie')
  const [q, setQ]               = useState('')
  const [results, setRes]       = useState([])
  const [loading, setLoad]      = useState(false)
  const [director, setDirector] = useState(null)
  const [dirFilms, setDirFilms] = useState([])
  const [loadingDir, setLoadDir]= useState(false)
  const [saving, setSaving]     = useState(false)

  const search = async () => {
    if (!q.trim()) return
    setLoad(true)
    try {
      const url = mode === 'director'
        ? `/api/tmdb-search?q=${encodeURIComponent(q)}&type=person`
        : `/api/tmdb-search?q=${encodeURIComponent(q)}`
      const r = await fetch(url).then(r => r.json())
      setRes(r.results || [])
    } catch (e) { console.error(e) }
    setLoad(false)
  }

  const selectDirector = async (person) => {
    setDirector(person); setRes([])
    setLoadDir(true)
    try {
      const r = await fetch(`/api/tmdb-search?id=${person.id}`).then(r => r.json())
      setDirFilms(r.results || [])
    } catch (e) { console.error(e) }
    setLoadDir(false)
  }

  const activar = async (movie) => {
    setSaving(true)
    const d = new Date(); d.setDate(d.getDate() + 3)

    // Buscar director de la película
    let directorNombre = director?.name || null
    if (!directorNombre) {
      try {
        const cr = await fetch(`/api/tmdb-search?q=${movie.id}&type=credits`).then(r => r.json())
        directorNombre = cr.director || null
      } catch {}
    }

    // Si la peli activa no tiene reseñas, borrarla
    const { data: pelActiva } = await supabase.from('peliculas').select('id').eq('activa', true).single()
    if (pelActiva) {
      const { data: resenas } = await supabase.from('resenas').select('id').eq('pelicula_id', pelActiva.id)
      if (resenas?.length === 0) {
        await supabase.from('peliculas').delete().eq('id', pelActiva.id)
      } else {
        await supabase.from('peliculas').update({ activa: false }).eq('id', pelActiva.id)
      }
    }

    await supabase.from('peliculas').insert({
      tmdb_id: movie.id, titulo: movie.title,
      titulo_original: movie.original_title,
      poster: movie.poster_path,
      anio: parseInt(movie.release_date?.slice(0, 4)),
      descripcion: movie.overview,
      director: directorNombre,
      fecha_limite: d.toISOString().slice(0, 10),
      elegida_por: user.id, activa: true,
    })
    setSaving(false)
    onActivated()
    onClose()
  }

  const switchMode = (m) => { setMode(m); setQ(''); setRes([]); setDirector(null); setDirFilms([]) }
  const films = director ? dirFilms : results

  return (
    <div className="search-overlay">
      <div className="search-panel">
        <div className="search-handle"/>
        <div className="search-panel-header">
          <div className="search-panel-tabs">
            <button className={`search-panel-tab ${mode === 'movie' ? 'active' : ''}`} onClick={() => switchMode('movie')}>
              <Film size={13}/> Película
            </button>
            <button className={`search-panel-tab ${mode === 'director' ? 'active' : ''}`} onClick={() => switchMode('director')}>
              <User size={13}/> Director
            </button>
          </div>
          <button className="search-panel-close" onClick={onClose}><X size={20}/></button>
        </div>

        {!director && (
          <div className="search-panel-bar">
            <Search size={15} className="ms-icon"/>
            <input className="ms-input"
              placeholder={mode === 'director' ? 'Buscar director…' : 'Buscar película…'}
              value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()} autoFocus/>
            {q && <button className="ms-clear" onClick={() => { setQ(''); setRes([]) }}><X size={14}/></button>}
            <button className="ms-btn" onClick={search}>Buscar</button>
          </div>
        )}

        {director && (
          <button className="search-back-btn" onClick={() => { setDirector(null); setDirFilms([]) }}>
            <ArrowLeft size={14}/> {director.name}
          </button>
        )}

        <div className="search-panel-results">
          {(loading || loadingDir) && <div className="ms-loading"><span className="spinner"/> Buscando…</div>}

          {!director && mode === 'director' && results.map(p => (
            <div key={p.id} className="ms-result" onClick={() => selectDirector(p)}>
              {p.profile_path
                ? <img src={`https://image.tmdb.org/t/p/w92${p.profile_path}`} alt={p.name}/>
                : <div className="ms-no-poster"><User size={16}/></div>}
              <div className="ms-result-info">
                <p className="ms-result-title">{p.name}</p>
                <p className="ms-result-year">{p.known_for_department}</p>
              </div>
              <ArrowLeft size={16} className="ms-add-icon" style={{ transform: 'rotate(180deg)' }}/>
            </div>
          ))}

          {(mode === 'movie' || director) && films.map(m => (
            <div key={m.id} className="ms-result" onClick={() => !saving && activar(m)}>
              {m.poster_path
                ? <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title}/>
                : <div className="ms-no-poster"><Clapperboard size={16}/></div>}
              <div className="ms-result-info">
                <p className="ms-result-title">{m.title}</p>
                <p className="ms-result-year">{m.release_date?.slice(0, 4)}</p>
              </div>
              {saving ? <span className="spinner"/> : <Check size={16} className="ms-add-icon"/>}
            </div>
          ))}

          {!loading && !loadingDir && films.length === 0 && !q && !director && (
            <div className="search-panel-empty">
              <Clapperboard size={36} strokeWidth={1}/>
              <p>Busca para elegir la siguiente película</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home({ user, profile, nombres, avatares }) {
  const [pelicula, setPelicula]     = useState(null)
  const [resenas, setResenas]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [nota, setNota]             = useState(0)
  const [texto, setTexto]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showResenaPanel, setShowResenaPanel] = useState(false)

  const miResena   = resenas.find(r => r.usuario_id === user.id)
  const otraResena = resenas.find(r => r.usuario_id !== user.id)

  useEffect(() => { loadPelicula() }, [])

  const loadPelicula = async () => {
    setLoading(true)
    const { data: pel } = await supabase.from('peliculas').select('*')
      .eq('activa', true).order('created_at', { ascending: false }).limit(1).single()
    if (pel) {
      setPelicula(pel)
      const { data: res } = await supabase.from('resenas').select('*').eq('pelicula_id', pel.id)
      setResenas(res || [])
    } else {
      setPelicula(null)
    }
    setLoading(false)
  }

  const handleSubmitResena = async (e) => {
    e.preventDefault()
    if (!nota) return
    setSaving(true)
    await supabase.from('resenas').upsert(
      { pelicula_id: pelicula.id, usuario_id: user.id, nota, texto: texto.trim() || null },
      { onConflict: 'pelicula_id,usuario_id' }
    )
    await loadPelicula()
    setShowForm(false); setNota(0); setTexto(''); setSaving(false)
  }

  if (loading) return <div className="home-loading"><span className="spinner"/> Cargando…</div>

  const ambosResenaron = resenas.length >= 2
  const plazoAcabado = !pelicula?.fecha_limite || new Date(pelicula.fecha_limite) <= new Date()
  const yoElegí = pelicula?.elegida_por === user.id
  const esMiTurno = !pelicula || (pelicula.elegida_por !== user.id && plazoAcabado)
  const puedoCambiar = yoElegí
  const otroNombre = nombres[Object.keys(nombres).find(k => k !== user.id)] || 'el otro'

  return (
    <>
      <div className="home-page" style={{ paddingBottom: '110px' }}>
        {pelicula ? (
          <>
            {/* Card principal */}
            <div className="home-card-hero" onClick={() => setShowDetail(true)}>
              {pelicula.poster && (
                <img src={`https://image.tmdb.org/t/p/w500${pelicula.poster}`}
                  alt={pelicula.titulo} className="home-hero-poster"/>
              )}
              <div className="home-hero-overlay">
                <div className="home-hero-label">
                  <span>EN CARTELERA</span>
                  {pelicula.fecha_limite && <Countdown fechaLimite={pelicula.fecha_limite}/>}
                </div>
                <h2 className="home-hero-titulo">{pelicula.titulo}</h2>
                <div className="home-hero-meta">
                  {pelicula.anio && <span>{pelicula.anio}</span>}
                  {pelicula.director && <><span className="home-hero-dot">·</span><span>{pelicula.director}</span></>}
                </div>
                <div className="home-hero-hint">
                  <ChevronDown size={12}/> Ver sinopsis
                </div>
              </div>
            </div>

            {/* Reseñas */}
            <div className="home-resenas">
              <h3 className="home-resenas-title">Reseñas</h3>

              {miResena ? (
                <div className="home-resena-card mine">
                  <div className="home-resena-header">
                    <div className="home-resena-user">
                      {avatares[user.id]
                        ? <img src={avatares[user.id]} alt="" className="home-resena-avatar"/>
                        : <div className="home-resena-avatar-placeholder"/>
                      }
                      <span className="home-resena-nombre">{profile?.nombre || 'Tú'}</span>
                    </div>
                    <span className="home-resena-nota"><Star size={13} fill="currentColor"/> {miResena.nota}/10</span>
                  </div>
                  {miResena.texto && <p className="home-resena-texto">{miResena.texto}</p>}
                  <button className="home-edit-btn" onClick={() => {
                    setNota(miResena.nota); setTexto(miResena.texto || ''); setShowResenaPanel(true)
                  }}>
                    <Edit3 size={13}/> Editar
                  </button>
                </div>
              ) : (
                <button className="home-add-resena" onClick={() => setShowResenaPanel(true)}>
                  <Star size={16}/> Escribir mi reseña
                </button>
              )}

              {otraResena ? (
                <div className="home-resena-card">
                  <div className="home-resena-header">
                    <div className="home-resena-user">
                      {avatares[otraResena.usuario_id]
                        ? <img src={avatares[otraResena.usuario_id]} alt="" className="home-resena-avatar"/>
                        : <div className="home-resena-avatar-placeholder"/>
                      }
                      <span className="home-resena-nombre">{nombres[otraResena.usuario_id] || 'El otro'}</span>
                    </div>
                    <span className="home-resena-nota"><Star size={13} fill="currentColor"/> {otraResena.nota}/10</span>
                  </div>
                  {otraResena.texto && <p className="home-resena-texto">{otraResena.texto}</p>}
                </div>
              ) : (
                <div className="home-resena-pending">
                  Esperando la reseña de {otroNombre}…
                </div>
              )}

              {ambosResenaron && (
                <div className="home-media">
                  <Star size={18} fill="currentColor"/>
                  <span>Media del club: <strong>{((resenas[0].nota + resenas[1].nota) / 2).toFixed(1)}/10</strong></span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="home-empty">
            <Film size={48} strokeWidth={1}/>
            <p>No hay ninguna película activa.</p>
            <p className="home-empty-sub">Usa el buscador de abajo para elegir la primera.</p>
          </div>
        )}
      </div>

      {/* Barra búsqueda fija */}
      {(esMiTurno || puedoCambiar) ? (
        <div className="home-search-bar" onClick={() => setShowSearch(true)}>
          <Search size={17} className="home-search-bar-icon"/>
          <span>{puedoCambiar && !esMiTurno ? 'Cambiar película…' : 'Buscar siguiente película…'}</span>
        </div>
      ) : (
        <div className="home-search-bar home-search-bar--disabled">
          <Clock size={17} className="home-search-bar-icon"/>
          <span>
            {!plazoAcabado
              ? `Turno de ${otroNombre} cuando acabe el plazo`
              : `Es el turno de ${otroNombre}`}
          </span>
        </div>
      )}

      {showSearch && (
        <SearchPanel user={user} onClose={() => setShowSearch(false)} onActivated={loadPelicula}/>
      )}

      {showDetail && pelicula && (
        <MovieDetail pelicula={pelicula} onClose={() => setShowDetail(false)}/>
      )}

      {showResenaPanel && pelicula && (
        <div className="detail-overlay" onClick={() => setShowResenaPanel(false)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-handle"/>
            <form className="home-resena-form" style={{ border: 'none', padding: 0, background: 'none' }}
              onSubmit={handleSubmitResena}>
              <p className="home-form-label">Tu reseña de <strong>{pelicula.titulo}</strong></p>
              <StarRating value={nota} onChange={setNota}/>
              <textarea className="home-textarea"
                placeholder="¿Qué te pareció? (opcional)"
                value={texto} onChange={e => setTexto(e.target.value)} rows={4}/>
              <div className="home-form-actions">
                <button type="button" className="home-btn-cancel"
                  onClick={() => setShowResenaPanel(false)}>Cancelar</button>
                <button type="submit" className="home-btn-submit" disabled={!nota || saving}>
                  {saving ? <span className="spinner"/> : <Check size={15}/>}
                  Guardar reseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
