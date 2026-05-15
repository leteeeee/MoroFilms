import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Historial from './pages/Historial'
import Perfil from './pages/Perfil'
import BottomNav from './components/BottomNav'
import './App.css'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [nombres, setNombres] = useState({})
  const [avatares, setAvatares] = useState({})   // { [userId]: avatar_url }
  const [page, setPage]       = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfiles(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadProfiles(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfiles = async (userId) => {
    const { data } = await supabase.from('profiles').select('*')
    if (!data) return
    const nombres = {}, avs = {}
    data.forEach(p => {
      nombres[p.id] = p.nombre
      if (p.avatar_url) avs[p.id] = p.avatar_url
    })
    setNombres(nombres)
    setAvatares(avs)
    setProfile(data.find(p => p.id === userId) || null)
  }

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', gap:10, color:'var(--gray)' }}>
      <span className="spinner"/> Cargando…
    </div>
  )

  if (!session) return <Auth/>

  const props = { user: session.user, profile, nombres, avatares }

  return (
    <>
      <main className="main-content">
        {page === 'home'      && <Home      {...props}/>}
        {page === 'historial' && <Historial nombres={nombres} avatares={avatares}/>}
        {page === 'perfil'    && <Perfil    user={session.user} profile={profile} onProfileUpdate={() => loadProfiles(session.user.id)}/>}
      </main>
      <BottomNav page={page} setPage={setPage}/>
    </>
  )
}
