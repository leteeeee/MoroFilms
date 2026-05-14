import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Star, Film } from 'lucide-react'
import './Historial.css'

export default function Historial({ nombres }) {
  const [peliculas, setPeliculas] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase
      .from('peliculas')
      .select('*, resenas(*)')
      .eq('activa', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPeliculas(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="hist-loading"><span className="spinner"/> Cargando…</div>
  )

  return (
    <div className="hist-page">
      <div className="hist-header">
        <h1 className="hist-title">Historial</h1>
        <p className="hist-sub">{peliculas.length} película{peliculas.length !== 1 ? 's' : ''} vistas</p>
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
              <div key={p.id} className="hist-card">
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

                  {/* Reseñas individuales */}
                  <div className="hist-resenas">
                    {resenas.map(r => (
                      <div key={r.id} className="hist-resena">
                        <div className="hist-resena-header">
                          <span className="hist-resena-nombre">{nombres[r.usuario_id] || '—'}</span>
                          <span className="hist-resena-nota">
                            <Star size={11} fill="currentColor"/> {r.nota}/10
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
