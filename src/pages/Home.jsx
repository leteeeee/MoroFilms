import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Star, Calendar, Edit3, Check, Clock } from 'lucide-react'
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
          onMouseEnter={() => setHov(v)}
          onMouseLeave={() => setHov(0)}
          onClick={() => onChange(v)}>
          <Star size={22} fill={(hov || value) >= v ? 'currentColor' : 'none'} strokeWidth={1.5}/>
        </button>
      ))}
      {value > 0 && <span className="star-label">{value}/10</span>}
    </div>
  )
}

export default function Home({ user, profile, nombres }) {
  const [pelicula, setPelicula]   = useState(null)
  const [resenas, setResenas]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [nota, setNota]           = useState(0)
  const [texto, setTexto]         = useState('')
  const [saving, setSaving]       = useState(false)

  const miResena = resenas.find(r => r.usuario_id === user.id)
  const otraResena = resenas.find(r => r.usuario_id !== user.id)

  useEffect(() => {
    loadPelicula()
  }, [])

  const loadPelicula = async () => {
    setLoading(true)
    const { data: pel } = await supabase
      .from('peliculas')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pel) {
      setPelicula(pel)
      const { data: res } = await supabase
        .from('resenas')
        .select('*')
        .eq('pelicula_id', pel.id)
      setResenas(res || [])
    }
    setLoading(false)
  }

  const handleSubmitResena = async (e) => {
    e.preventDefault()
    if (!nota) return
    setSaving(true)
    const row = {
      pelicula_id: pelicula.id,
      usuario_id: user.id,
      nota,
      texto: texto.trim() || null,
    }
    await supabase.from('resenas').upsert(row, { onConflict: 'pelicula_id,usuario_id' })
    await loadPelicula()
    setShowForm(false); setNota(0); setTexto('')
    setSaving(false)
  }

  if (loading) return (
    <div className="home-loading">
      <span className="spinner"/> Cargando…
    </div>
  )

  if (!pelicula) return (
    <div className="home-empty">
      <Film size={48} strokeWidth={1}/>
      <p>No hay ninguna película activa.</p>
      <p className="home-empty-sub">Ve a Propuestas para elegir la siguiente.</p>
    </div>
  )

  const ambosResenaron = resenas.length >= 2

  return (
    <div className="home-page">
      {/* Cabecera */}
      <div className="home-header">
        <p className="home-label">🎬 Película del momento</p>
        {pelicula.fecha_limite && (
          <Countdown fechaLimite={pelicula.fecha_limite}/>
        )}
      </div>

      {/* Card de la película */}
      <div className="home-card">
        {pelicula.poster && (
          <img src={`https://image.tmdb.org/t/p/w342${pelicula.poster}`}
            alt={pelicula.titulo} className="home-poster"/>
        )}
        <div className="home-card-info">
          <h2 className="home-titulo">{pelicula.titulo}</h2>
          {pelicula.titulo_original && pelicula.titulo_original !== pelicula.titulo && (
            <p className="home-titulo-orig">{pelicula.titulo_original}</p>
          )}
          {pelicula.anio && <p className="home-anio">{pelicula.anio}</p>}
          {pelicula.descripcion && (
            <p className="home-descripcion">{pelicula.descripcion}</p>
          )}
          {pelicula.fecha_limite && (
            <div className="home-deadline-row">
              <Calendar size={13}/>
              <span>Ver antes del {new Date(pelicula.fecha_limite).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reseñas */}
      <div className="home-resenas">
        <h3 className="home-resenas-title">Reseñas</h3>

        {/* Mi reseña o formulario */}
        {miResena ? (
          <div className="home-resena-card mine">
            <div className="home-resena-header">
              <span className="home-resena-nombre">{profile?.nombre || 'Tú'}</span>
              <span className="home-resena-nota">
                <Star size={13} fill="currentColor"/> {miResena.nota}/10
              </span>
            </div>
            {miResena.texto && <p className="home-resena-texto">{miResena.texto}</p>}
            <button className="home-edit-btn" onClick={() => {
              setNota(miResena.nota); setTexto(miResena.texto || ''); setShowForm(true)
            }}>
              <Edit3 size={13}/> Editar
            </button>
          </div>
        ) : showForm ? (
          <form className="home-resena-form" onSubmit={handleSubmitResena}>
            <p className="home-form-label">Tu reseña de <strong>{pelicula.titulo}</strong></p>
            <StarRating value={nota} onChange={setNota}/>
            <textarea
              className="home-textarea"
              placeholder="¿Qué te pareció? (opcional)"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={4}
            />
            <div className="home-form-actions">
              <button type="button" className="home-btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="home-btn-submit" disabled={!nota || saving}>
                {saving ? <span className="spinner"/> : <Check size={15}/>}
                Guardar reseña
              </button>
            </div>
          </form>
        ) : (
          <button className="home-add-resena" onClick={() => setShowForm(true)}>
            <Star size={16}/> Escribir mi reseña
          </button>
        )}

        {/* Reseña del otro */}
        {otraResena ? (
          <div className="home-resena-card other">
            <div className="home-resena-header">
              <span className="home-resena-nombre">{nombres[otraResena.usuario_id] || 'El otro'}</span>
              <span className="home-resena-nota">
                <Star size={13} fill="currentColor"/> {otraResena.nota}/10
              </span>
            </div>
            {otraResena.texto && <p className="home-resena-texto">{otraResena.texto}</p>}
          </div>
        ) : (
          <div className="home-resena-pending">
            <span>{resenas.length === 0 || !miResena
              ? (otraResena === undefined ? 'El otro aún no ha reseñado' : '')
              : 'Esperando la reseña del otro…'
            }</span>
          </div>
        )}

        {/* Media si ambos reseñaron */}
        {ambosResenaron && (
          <div className="home-media">
            <Star size={18} fill="currentColor"/>
            <span>Media del club: <strong>{((resenas[0].nota + resenas[1].nota) / 2).toFixed(1)}/10</strong></span>
          </div>
        )}
      </div>
    </div>
  )
}
