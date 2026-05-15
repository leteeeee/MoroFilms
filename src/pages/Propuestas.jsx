import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, Clapperboard, Check, Film, User, ArrowLeft, Clock } from 'lucide-react'
import './Propuestas.css'

export default function Propuestas({ user }) {
  const [mode, setMode]         = useState('movie')   // 'movie' | 'director'
  const [q, setQ]               = useState('')
  const [results, setRes]       = useState([])
  const [loading, setLoad]      = useState(false)
  const [director, setDirector] = useState(null)      // director seleccionado
  const [dirFilms, setDirFilms] = useState([])
  const [loadingDir, setLoadDir]= useState(false)
  const [selected, setSelec]    = useState(null)
  const [saving, setSaving]     = useState(false)

  const fechaLimite = () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  }

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
    setDirector(person)
    setRes([])
    setLoadDir(true)
    try {
      const r = await fetch(`/api/tmdb-search?id=${person.id}`).then(r => r.json())
      setDirFilms(r.results || [])
    } catch (e) { console.error(e) }
    setLoadDir(false)
  }

  const resetDirector = () => {
    setDirector(null)
    setDirFilms([])
  }

  const switchMode = (m) => {
    setMode(m); setQ(''); setRes([])
    setDirector(null); setDirFilms([])
  }

  const handleActivar = async () => {
    if (!selected) return
    setSaving(true)

    const { data: pelActiva } = await supabase
      .from('peliculas').select('id').eq('activa', true).single()
    if (pelActiva) {
      const { data: resenas } = await supabase
        .from('resenas').select('id').eq('pelicula_id', pelActiva.id)
      if (resenas?.length === 0) {
        await supabase.from('peliculas').delete().eq('id', pelActiva.id)
      } else {
        await supabase.from('peliculas').update({ activa: false }).eq('id', pelActiva.id)
      }
    }

    await supabase.from('peliculas').insert({
      tmdb_id:         selected.id,
      titulo:          selected.title,
      titulo_original: selected.original_title,
      poster:          selected.poster_path,
      anio:            parseInt(selected.release_date?.slice(0, 4)),
      descripcion:     selected.overview,
      fecha_limite:    fechaLimite(),
      elegida_por:     user.id,
      activa:          true,
    })
    setSaving(false)
    setSelec(null); setQ(''); setRes([])
    setDirector(null); setDirFilms([])
  }

  return (
    <div className="prop-page">
      <div className="prop-header">
        <div>
          <h1 className="prop-title">Nueva película</h1>
          <p className="prop-sub">Elige la siguiente peli del club</p>
        </div>
      </div>

      {/* Toggle modo */}
      <div className="prop-mode-tabs">
        <button
          className={`prop-mode-tab ${mode === 'movie' ? 'active' : ''}`}
          onClick={() => switchMode('movie')}
        >
          <Film size={13}/> Película
        </button>
        <button
          className={`prop-mode-tab ${mode === 'director' ? 'active' : ''}`}
          onClick={() => switchMode('director')}
        >
          <User size={13}/> Director
        </button>
      </div>

      {/* Búsqueda */}
      {!director && (
        <div className="movie-search">
          <div className="movie-search-bar">
            <Search size={15} className="ms-icon"/>
            <input
              className="ms-input"
              placeholder={mode === 'director' ? 'Buscar director…' : 'Buscar película…'}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            {q && (
              <button className="ms-clear" onClick={() => { setQ(''); setRes([]) }}>
                <X size={14}/>
              </button>
            )}
            <button className="ms-btn" onClick={search}>Buscar</button>
          </div>

          {loading && <div className="ms-loading"><span className="spinner"/> Buscando…</div>}

          <div className="ms-results">
            {mode === 'movie' && results.map(m => (
              <div key={m.id} className="ms-result" onClick={() => { setSelec(m); setFecha(defaultFecha()) }}>
                {m.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title}/>
                  : <div className="ms-no-poster"><Clapperboard size={16}/></div>
                }
                <div className="ms-result-info">
                  <p className="ms-result-title">{m.title}</p>
                  <p className="ms-result-year">{m.release_date?.slice(0, 4)}</p>
                </div>
                <Film size={16} className="ms-add-icon"/>
              </div>
            ))}

            {mode === 'director' && results.map(p => (
              <div key={p.id} className="ms-result" onClick={() => selectDirector(p)}>
                {p.profile_path
                  ? <img src={`https://image.tmdb.org/t/p/w92${p.profile_path}`} alt={p.name}/>
                  : <div className="ms-no-poster"><User size={16}/></div>
                }
                <div className="ms-result-info">
                  <p className="ms-result-title">{p.name}</p>
                  <p className="ms-result-year">{p.known_for_department}</p>
                </div>
                <Film size={16} className="ms-add-icon"/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filmografía del director */}
      {director && (
        <div className="movie-search">
          <button className="prop-back-btn" onClick={resetDirector}>
            <ArrowLeft size={14}/> {director.name}
          </button>
          {loadingDir
            ? <div className="ms-loading"><span className="spinner"/> Cargando filmografía…</div>
            : (
              <div className="ms-results">
                {dirFilms.map(m => (
                  <div key={m.id} className="ms-result" onClick={() => { setSelec(m); setFecha(defaultFecha()) }}>
                    {m.poster_path
                      ? <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title}/>
                      : <div className="ms-no-poster"><Clapperboard size={16}/></div>
                    }
                    <div className="ms-result-info">
                      <p className="ms-result-title">{m.title}</p>
                      <p className="ms-result-year">{m.release_date?.slice(0, 4)}</p>
                    </div>
                    <Film size={16} className="ms-add-icon"/>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Info vacía */}
      {!loading && results.length === 0 && !q && !director && (
        <div className="prop-empty">
          <Clapperboard size={40} strokeWidth={1}/>
          <p>Busca una película o director para elegir la siguiente.</p>
        </div>
      )}

      {/* Modal confirmar */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelec(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Poner como siguiente: <em>{selected.title}</em></h3>
            <div className="modal-date-row">
              <Clock size={16}/>
              <span style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                Plazo: <strong>3 días</strong> para verla
              </span>
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setSelec(null)}>Cancelar</button>
              <button className="modal-confirm" onClick={handleActivar} disabled={saving}>
                {saving ? <span className="spinner"/> : <Check size={15}/>}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
