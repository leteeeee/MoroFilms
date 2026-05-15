import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Star, Film, Trash2, X } from 'lucide-react'
import './Historial.css'

export default function Historial({ nombres }) {
  const [peliculas, setPeliculas] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editMode, setEditMode]   = useState(false)

  const load = () => {
    supabase
      .from('peliculas')
      .select('*, resenas(*)')
      .eq('activa', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPeliculas(data || [])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    await supabase.from('resenas').delete().eq('pelicula_id', id)
    await supabase.from('peliculas').delete().eq('id', id)
    setPeliculas(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return (
    <div className="hist-loading"><span className="spinner"/> Cargando…</div>
  )

  return (
    <div className="hist-page">
      <div className="hist-header">
        <div>
          <h1 className="hist-title">Historial</h1>
          <p className="hist-sub">{peliculas.length} película{peliculas.length !== 1 ? 's' : ''} vistas</p>
        </div>
        {peliculas.length > 0 && (
          <button className={`hist-edit-btn ${editMode ? 'active' : ''}`} onClick={() => setEditMode(e => !e)}>
            {editMode ? <><X size={14}/> Listo</> : <><Trash2 size={14}/> Editar</>}
          </button>
        )}
      </div>

      {peliculas.length === 0 ? (
        <div className="hist-empty">
          <Film size={44} strokeWidth={1}/>
          <p>Aquí aparecerán las películas que hayáis visto.</p>
        </div>
      ) : (
        <div className="hist-list">
          {peliculas.map(p => {
            const resenas = p.resenas || []
            const media = resenas.length
              ? (resenas.reduce((s, r) => s + r.nota, 0) / resenas.length).toFixed(1)
              : null

            return (
              <div key={p.id} className={`hist-card ${editMode ? 'hist-card--edit' : ''}`}>
                {editMode && (
                  <button className="hist-delete-btn" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={16}/>
                  </button>
                )}
                {p.poster && (
                  <img src={`https://image.tmdb.org/t/p/w185${p.poster}`}
                    alt={p.titulo} className="hist-poster"/>
                )}
                <div className="hist-info">
                  <p className="hist-titulo">{p.titulo}</p>
                  {p.anio && <p className="hist-anio">{p.anio}</p>}

                  {media && (
                    <div className="hist-media">
                      <Star size={13} fill="currentColor"/>
                      <span>Media del club: <strong>{media}/10</strong></span>
                    </div>
                  )}

                  <div className="hist-resenas">
                    {resenas.map(r => (
                      <div key={r.id} className="hist-resena">
                        <div className="hist-resena-header">
                          <span className="hist-resena-nombre">{nombres[r.usuario_id] || '—'}</span>
                          <span className="hist-resena-nota">
                            <Star size={11} fill="currentColor"/> {r.nota % 2 === 0 ? r.nota/2 : (r.nota/2).toFixed(1)}/5
                          </span>
                        </div>
                        {r.texto && <p className="hist-resena-texto">{r.texto}</p>}
                      </div>
                    ))}
                    {resenas.length < 2 && (
                      <p className="hist-pending">Falta una reseña…</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
