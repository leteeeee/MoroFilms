import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Star, Film, Trash2, X, User, Trophy, ChevronDown } from 'lucide-react'
import './Historial.css'

function CompeticionPanel({ peliculas, nombres, avatares, onClose }) {
  const ids = Object.keys(nombres)

  const stats = ids.map(uid => {
    const misPelis = peliculas.filter(p => p.elegida_por === uid)
    const todasResenas = misPelis.flatMap(p => p.resenas || [])
    const media = todasResenas.length
      ? todasResenas.reduce((s, r) => s + r.nota, 0) / todasResenas.length
      : null
    return { uid, pelis: misPelis.length, media }
  })

  const [a, b] = stats
  const hayGanador = a?.media != null && b?.media != null
  const ganador = hayGanador ? (a.media >= b.media ? a : b) : null
  const empate  = hayGanador && a.media === b.media

  const fmtMedia = n => n != null ? `${(n/2).toFixed(2)}/5` : '—'

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <div className="detail-handle"/>
        <div className="comp-header">
          <Trophy size={18} style={{ color: 'var(--gold)' }}/>
          <h3 className="comp-title">Competición</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--gray)', marginLeft:'auto' }}>
            <X size={18}/>
          </button>
        </div>

        <div className="comp-versus">
          {stats.map((s, i) => {
            const esGanador = !empate && ganador?.uid === s.uid
            return (
              <div key={s.uid} className={`comp-player ${esGanador ? 'comp-player--winner' : ''}`}>
                {avatares[s.uid]
                  ? <img src={avatares[s.uid]} alt="" className="comp-avatar"/>
                  : <div className="comp-avatar-placeholder"><User size={22}/></div>
                }
                <p className="comp-nombre">{nombres[s.uid] || '—'}</p>
                <p className="comp-media">{fmtMedia(s.media)}</p>
                <p className="comp-pelis">{s.pelis} peli{s.pelis !== 1 ? 's' : ''}</p>
                {esGanador && <span className="comp-crown">👑</span>}
              </div>
            )
          })}
        </div>

        {hayGanador && (
          <p className="comp-resultado">
            {empate
              ? '¡Empate perfecto!'
              : `${nombres[ganador.uid]} lleva la delantera con una media de ${fmtMedia(ganador.media)}`}
          </p>
        )}

        {!hayGanador && (
          <p className="comp-resultado">Reseñad más películas para ver la clasificación.</p>
        )}

        <div className="comp-detalle">
          {stats.map(s => {
            const misPelis = peliculas.filter(p => p.elegida_por === s.uid)
            return (
              <div key={s.uid} className="comp-detalle-user">
                <p className="comp-detalle-nombre">{nombres[s.uid]}</p>
                {misPelis.map(p => {
                  const resenas = p.resenas || []
                  const media = resenas.length
                    ? resenas.reduce((sum, r) => sum + r.nota, 0) / resenas.length
                    : null
                  return (
                    <div key={p.id} className="comp-detalle-row">
                      <span className="comp-detalle-titulo">{p.titulo}</span>
                      <span className="comp-detalle-nota">
                        {media != null ? fmtMedia(media) : '—'}
                      </span>
                    </div>
                  )
                })}
                {misPelis.length === 0 && <p className="comp-sin-pelis">Sin películas aún</p>}
              </div>
            )
          })}
        </div>

        <button className="detail-close" onClick={onClose}>
          <ChevronDown size={20}/> Cerrar
        </button>
      </div>
    </div>
  )
}

export default function Historial({ nombres, avatares = {} }) {
  const [peliculas, setPeliculas]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [editMode, setEditMode]       = useState(false)
  const [showComp, setShowComp]       = useState(false)

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
    <>
    <div className="hist-page">
      <div className="hist-header">
        <div>
          <h1 className="hist-title">Historial</h1>
          <p className="hist-sub">{peliculas.length} película{peliculas.length !== 1 ? 's' : ''} vistas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {peliculas.length > 0 && (
            <button className="hist-edit-btn" onClick={() => setShowComp(true)}>
              <Trophy size={14}/> Competición
            </button>
          )}
          {peliculas.length > 0 && (
            <button className={`hist-edit-btn ${editMode ? 'active' : ''}`} onClick={() => setEditMode(e => !e)}>
              {editMode ? <><X size={14}/> Listo</> : <><Trash2 size={14}/> Editar</>}
            </button>
          )}
        </div>
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
              ? (resenas.reduce((s, r) => s + r.nota, 0) / resenas.length)
              : null
            const fmtMedia = n => n % 2 === 0 ? n/2 : (n/2).toFixed(1)

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

                  {/* Badge recomendador */}
                  {p.elegida_por && (
                    <div className="hist-recomendada">
                      {avatares[p.elegida_por]
                        ? <img src={avatares[p.elegida_por]} alt="" className="hist-rec-avatar"/>
                        : <div className="hist-rec-avatar-placeholder"><User size={9}/></div>
                      }
                      <span>Rec. por <strong>{nombres[p.elegida_por] || '—'}</strong></span>
                    </div>
                  )}

                  {media != null && (
                    <div className="hist-media">
                      <Star size={13} fill="currentColor"/>
                      <span>Media: <strong>{fmtMedia(media)}/5</strong></span>
                    </div>
                  )}

                  <div className="hist-resenas">
                    {resenas.map(r => (
                      <div key={r.id} className="hist-resena">
                        <div className="hist-resena-header">
                          <div className="hist-resena-user">
                            {avatares[r.usuario_id]
                              ? <img src={avatares[r.usuario_id]} alt="" className="hist-resena-avatar"/>
                              : <div className="hist-resena-avatar-placeholder"><User size={10}/></div>
                            }
                            <span className="hist-resena-nombre">{nombres[r.usuario_id] || '—'}</span>
                          </div>
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

    {showComp && (
      <CompeticionPanel
        peliculas={peliculas}
        nombres={nombres}
        avatares={avatares}
        onClose={() => setShowComp(false)}
      />
    )}
    </>
  )
}
