import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Film } from 'lucide-react'
import './Auth.css'

export default function Auth() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Film size={36} strokeWidth={1.5}/>
        </div>
        <h1 className="auth-title">MoroccanFilms</h1>
        <p className="auth-sub">El club de cine de Dani e Izan</p>

        {sent ? (
          <div className="auth-sent">
            <Mail size={32} strokeWidth={1.5}/>
            <p>Revisa tu email — te hemos enviado un enlace mágico para entrar.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSend}>
            <input
              className="auth-input"
              type="email"
              placeholder="Tu email…"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : <Mail size={16}/>}
              {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
