import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Propuestas from './pages/Propuestas'
import Historial from './pages/Historial'
import BottomNav from './components/BottomNav'
import './App.css'

// Nombres de los usuarios por su ID de Supabase Auth
// Se rellena automáticamente al cargar los perfiles
const NOMBRES_FIJOS = { 'izan': 'Izan', 'dani': 'Dani' }

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [profile, setProfile] = useState(null)
  const [nombres, setNombres] = useState({})         // { [userId]: nombre }
  const [page, setPage]       = useState('home')

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfiles(session.user.id)
    })
    // Cambios de sesión (magic link redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadProfiles(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfiles = async (userId) => {
    const { data } = await supabase.from('profiles').select('*')
    if (!data) return
    const map = {}
    data.forEach(p => { map[p.id] = p.nombre })
    setNombres(map)
    setProfile(data.find(p => p.id === userId) || null)
  }

  // Cargando sesión
  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', gap:10, color:'var(--gray)' }}>
      <span className="spinner"/> Cargando…
    </div>
  )

  // Sin sesión → login
  if (!session) return <Auth/>

  const props = { user: session.user, profile, nombres }

  return (
    <>
      <main className="main-content">
        {page === 'home'       && <Home       {...props}/>}
        {page === 'propuestas' && <Propuestas {...props}/>}
        {page === 'historial'  && <Historial  nombres={nombres}/>}
      </main>
      <BottomNav page={page} setPage={setPage}/>
    </>
  )
}
