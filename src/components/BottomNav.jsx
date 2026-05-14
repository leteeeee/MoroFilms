import { Home, Clapperboard, BookOpen } from 'lucide-react'
import './BottomNav.css'

const TABS = [
  { id: 'home',      label: 'Inicio',    Icon: Home         },
  { id: 'propuestas',label: 'Propuestas',Icon: Clapperboard },
  { id: 'historial', label: 'Historial', Icon: BookOpen     },
]

export default function BottomNav({ page, setPage }) {
  return (
    <nav className="bnav">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`bnav-tab ${page === id ? 'active' : ''}`}
          onClick={() => setPage(id)}
        >
          <Icon size={22} strokeWidth={1.8}/>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
