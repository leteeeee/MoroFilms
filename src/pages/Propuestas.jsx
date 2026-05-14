import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, Calendar, Clapperboard, Check, Film } from 'lucide-react'
import './Propuestas.css'

export default function Propuestas({ user }) {
  const [q, setQ]             = useState('')
  const [results, setRes]     = useState([])
  const [loading, setLoad]    = useState(false)
  const [selected, setSelec]  = useState(null)
  const [fecha, setFecha]     = useState('')
  const [saving, setSaving]   = useState(false)

  const search = async () => {
    if (!q.trim()) return
    setLoad(true)
    try {
      const resp = await fetch(`/api/tmdb-search?q=${encodeURIComponent(q)}`)
      const r = await resp.json()
      setRes(r.results || [])
    } catch (e) {
      console.error('Search error:', e)
    }
    setLoad(false)
  }

  const handleActivar = async () => {
    if (!selected) return
    setSaving(true)
    await supabase.from('peliculas').update({ activa: false }).eq('activa', true)
    await supabase.from('peliculas').insert({
      tmdb_id:         selected.id,
      titulo:          selected.title,
      titulo_original: selected.original_title,
      poster:          selected.poster_path,
      anio:            parseInt(selected.release_date?.slice(0, 4)),
      descripcion:     selected.overview,
      fecha_limite:    fecha || null,
      elegida_por:     user.id,
      activa:          true,
    })
    setSaving(false)
    setSelec(null)
    setFecha('')
    setQ('')
    setRes([])
  }

  return (
    <div className="prop-page">
      <div className="prop-header">
        <div>
          <h1 className="prop-title">Nueva película</h1>
          <p className="prop-sub">Elige la siguiente peli del club</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="movie-search">
        <div className="movie-search-bar">
          <Search size={15} className="ms-icon"/>
          <input
            className="ms-input"
            placeholder="Buscar película…"
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
          {results.map(m => (
            <div key={m.id} className="ms-result" onClick={() => setSelec(m)}>
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
      </div>

      {/* Info vacía */}
      {!loading && results.length === 0 && !q && (
        <div className="prop-empty">
          <Clapperboard size={40} strokeWidth={1}/>
          <p>Busca una película para ponerla como siguiente.</p>
        </div>
      )}

      {/* Modal confirmar */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelec(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Poner como siguiente: <em>{selected.title}</em></h3>
            <p className="modal-sub">¿Antes de qué fecha tenéis que verla?</p>
            <div className="modal-date-row">
              <Calendar size={16}/>
              <input
                type="date"
                className="modal-date-input"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
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
