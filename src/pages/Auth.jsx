import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Film, Lock, LogIn } from 'lucide-react'
import './Auth.css'

export default function Auth() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('password') // 'password' | 'magic'
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handlePassword = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false) }
  }

  const handleMagic = async (e) => {
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
          <>
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'password' ? 'active' : ''}`}
                onClick={() => { setMode('password'); setError('') }}
                type="button"
              >
                <Lock size={13}/> Contraseña
              </button>
              <button
                className={`auth-tab ${mode === 'magic' ? 'active' : ''}`}
                onClick={() => { setMode('magic'); setError('') }}
                type="button"
              >
                <Mail size={13}/> Enlace mágico
              </button>
            </div>

            {mode === 'password' ? (
              <form className="auth-form" onSubmit={handlePassword}>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Tu email…"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Contraseña…"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                {error && <p className="auth-error">{error}</p>}
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? <span className="spinner"/> : <LogIn size={16}/>}
                  {loading ? 'Entrando…' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleMagic}>
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
          </>
        )}
      </div>
    </div>
  )
}
