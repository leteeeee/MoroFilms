import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Camera, LogOut, User } from 'lucide-react'
import './Perfil.css'

export default function Perfil({ user, profile, onProfileUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const fileRef = useRef(null)

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      onProfileUpdate()
    }
    setUploading(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
  }

  const avatar = profile?.avatar_url

  return (
    <div className="perfil-page">
      <h1 className="perfil-title">Perfil</h1>

      <div className="perfil-avatar-section">
        <div className="perfil-avatar-wrap" onClick={() => fileRef.current?.click()}>
          {avatar
            ? <img src={avatar} alt="avatar" className="perfil-avatar"/>
            : <div className="perfil-avatar-placeholder"><User size={40} strokeWidth={1.5}/></div>
          }
          <div className="perfil-avatar-overlay">
            {uploading ? <span className="spinner"/> : <Camera size={18}/>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar}/>
        <p className="perfil-name">{profile?.nombre || '—'}</p>
        <p className="perfil-email">{user.email}</p>
      </div>

      <button className="perfil-logout-btn" onClick={handleLogout} disabled={loggingOut}>
        <LogOut size={16}/>
        {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </div>
  )
}
