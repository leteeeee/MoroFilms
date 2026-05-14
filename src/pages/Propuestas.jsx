import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, ThumbsUp, Plus, X, Calendar, Clapperboard, Check } from 'lucide-react'
import './Propuestas.css'

function MovieSearch({ onSelect }) {
  const [q, setQ]           = useState('')
  const [results, setRes]   = useState([])
  const [loading, setLoad]  = useState(false)

  const search = async () => {
    if (!q.trim()) return
    setLoad(true)
    try {
      const resp = await fetch(`/api/tmdb-search?q=${encodeURIComponent(q)}`)
      const r = await resp.json()
      console.log('TMDB response:', r)
      setRes(r.results || [])
    } catch (e) {
      console.error('Search error:', e)
    }
    setLoad(false)
  }

  return (
    <div className="movie-search">
      <div className="movie-search-bar">
        <Search size={15} className="ms-icon"/>
        <input className="ms-input" placeholder="Buscar película…"
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}/>
        {q && <button className="ms-clear" onClick={() => { setQ(''); setRes([]) }}><X size={14}/></button>}
        <button className="ms-btn" onClick={search}>Buscar</button>
      </div>
      {loading && <div className="ms-loading"><span className="spinner"/> Buscando…</div>}
      <div className="ms-results">
        {results.map(m => (
          <div key={m.id} className="ms-result" onClick={() => { onSelect(m); setQ(''); setRes([]) }}>
            {m.poster_path
              ? <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title}/>
              : <div className="ms-no-poster"><Clapperboard size={16}/></div>}
            <div className="ms-result-info">
              <p className="ms-result-title">{m.title}</p>
              <p className="ms-result-year">{m.release_date?.slice(0,4)}</p>
            </div>
            <Plus size={16} className="ms-add-icon"/>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Propuestas({ user, profile, nombres }) {
  const [propuestas, setProp]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showSearch, setSearch] = useState(false)
  const [dateModal, setDateM]   = useState(null) // propuesta a activar
  const [fechaLimite, setFecha] = useState('')
  const [activating, setActiv]  = useState(false)

  useEffect(() => { loadPropuestas() }, [])

  const loadPropuestas = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('propuestas')
      .select('*, votos(*)')
      .order('created_at', { ascending: false })
    setProp(data || [])
    setLoading(false)
  }

  const handlePropose = async (movie) => {
    setSearch(false)
    const row = {
      tmdb_id:        movie.id,
      titulo:         movie.title,
      titulo_original: movie.original_title,
      poster:         movie.poster_path,
      anio:           parseInt(movie.release_date?.slice(0,4)),
      descripcion:    movie.overview,
      propuesta_por:  user.id,
    }
    await supabase.from('propuestas').insert(row)
    loadPropuestas()
  }

  const handleVote = async (propuesta) => {
    const yaVote = propuesta.votos?.some(v => v.usuario_id === user.id)
    if (yaVote) {
      await supabase.from('votos').delete()
        .eq('propuesta_id', propuesta.id).eq('usuario_id', user.id)
    } else {
      await supabase.from('votos').insert({ propuesta_id: propuesta.id, usuario_id: user.id })
    }
    loadPropuestas()
  }

  const handleActivar = async () => {
    if (!dateModal) return
    setActiv(true)
    // Desactivar película actual
    await supabase.from('peliculas').update({ activa: false }).eq('activa', true)
    // Insertar nueva película activa
    await supabase.from('peliculas').insert({
      tmdb_id:        dateModal.tmdb_id,
      titulo:         dateModal.titulo,
      titulo_original: dateModal.titulo_original,
      poster:         dateModal.poster,
      anio:           dateModal.anio,
      descripcion:    dateModal.descripcion,
      fecha_limite:   fechaLimite || null,
      elegida_por:    user.id,
      activa:         true,
    })
    // Borrar propuesta
    await supabase.from('propuestas').delete().eq('id', dateModal.id)
    setDateM(null); setFecha(''); setActiv(false)
    loadPropuestas()
  }

  const handleDelete = async (id) => {
    await supabase.from('propuestas').delete().eq('id', id)
    loadPropuestas()
  }

  return (
    <div className="prop-page">
      <div className="prop-header">
        <div>
          <h1 className="prop-title">Propuestas</h1>
          <p className="prop-sub">Proponed y votad la siguiente película</p>
        </div>
        <button className="prop-add-btn" onClick={() => setSearch(s => !s)}>
          {showSearch ? <X size={18}/> : <Plus size={18}/>}
        </button>
      </div>

      {showSearch && <MovieSearch onSelect={handlePropose}/>}

      {loading ? (
        <div className="prop-loading"><span className="spinner"/> Cargando…</div>
      ) : propuestas.length === 0 ? (
        <div className="prop-empty">
          <Clapperboard size={40} strokeWidth={1}/>
          <p>No hay propuestas aún. ¡Propón la primera!</p>
        </div>
      ) : (
        <div className="prop-list">
          {propuestas.map(p => {
            const yaVote = p.votos?.some(v => v.usuario_id === user.id)
            const votosN = p.votos?.length || 0
            const ambosVotan = votosN >= 2
            return (
              <div key={p.id} className={`prop-card ${ambosVotan ? 'ready' : ''}`}>
                {p.poster && (
                  <img src={`https://image.tmdb.org/t/p/w92${p.poster}`}
                    alt={p.titulo} className="prop-poster"/>
                )}
                <div className="prop-info">
                  <p className="prop-titulo">{p.titulo}</p>
                  {p.anio && <p className="prop-anio">{p.anio}</p>}
                  <p className="prop-by">
                    Propuesta por <strong>{nombres[p.propuesta_por] || '—'}</strong>
                  </p>
                </div>
                <div className="prop-actions">
                  <button
                    className={`prop-vote-btn ${yaVote ? 'voted' : ''}`}
                    onClick={() => handleVote(p)}>
                    <ThumbsUp size={15} fill={yaVote ? 'currentColor' : 'none'}/>
                    <span>{votosN}</span>
                  </button>
                  {ambosVotan && (
                    <button className="prop-activate-btn" onClick={() => setDateM(p)} title="¡Elegir esta!">
                      <Check size={15}/> Elegir
                    </button>
                  )}
                  {p.propuesta_por === user.id && (
                    <button className="prop-delete-btn" onClick={() => handleDelete(p.id)}>
                      <X size={14}/>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal fecha límite */}
      {dateModal && (
        <div className="modal-overlay" onClick={() => setDateM(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Elegir <em>{dateModal.titulo}</em></h3>
            <p className="modal-sub">¿Antes de qué fecha tenéis que verla?</p>
            <div className="modal-date-row">
              <Calendar size={16}/>
              <input type="date" className="modal-date-input"
                value={fechaLimite} onChange={e => setFecha(e.target.value)}
                min={new Date().toISOString().slice(0,10)}/>
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDateM(null)}>Cancelar</button>
              <button className="modal-confirm" onClick={handleActivar} disabled={activating}>
                {activating ? <span className="spinner"/> : <Check size={15}/>}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
