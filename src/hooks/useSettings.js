import { useState, useEffect } from 'react'

export const THEMES = [
  { id: 'rojo',     name: 'Rojo',     red: '#C41E3A', hover: '#E0253F', dim: 'rgba(196,30,58,.13)' },
  { id: 'coral',    name: 'Coral',    red: '#E8533A', hover: '#F26550', dim: 'rgba(232,83,58,.13)' },
  { id: 'naranja',  name: 'Naranja',  red: '#E07020', hover: '#F08030', dim: 'rgba(224,112,32,.13)' },
  { id: 'ambar',    name: 'Ámbar',    red: '#D4900A', hover: '#E8A510', dim: 'rgba(212,144,10,.13)' },
  { id: 'dorado',   name: 'Dorado',   red: '#C8960C', hover: '#DFA80E', dim: 'rgba(200,150,12,.13)' },
  { id: 'lima',     name: 'Lima',     red: '#6AAE2A', hover: '#7DC535', dim: 'rgba(106,174,42,.13)' },
  { id: 'verde',    name: 'Verde',    red: '#2D9E6B', hover: '#38B87D', dim: 'rgba(45,158,107,.13)' },
  { id: 'cian',     name: 'Cian',     red: '#0E9DB5', hover: '#15B5D0', dim: 'rgba(14,157,181,.13)' },
  { id: 'azul',     name: 'Azul',     red: '#2D7DD2', hover: '#3D8FE8', dim: 'rgba(45,125,210,.13)' },
  { id: 'indigo',   name: 'Índigo',   red: '#4A5BD4', hover: '#5D6FE8', dim: 'rgba(74,91,212,.13)' },
  { id: 'morado',   name: 'Morado',   red: '#9B5DE5', hover: '#AC70F0', dim: 'rgba(155,93,229,.13)' },
  { id: 'rosa',     name: 'Rosa',     red: '#D4378A', hover: '#E84DA0', dim: 'rgba(212,55,138,.13)' },
]

export const BACKGROUNDS = [
  { id: 'carbon',     name: 'Carbón',      bg: '#0D0A0A', card: '#130D0D', card2: '#1A1010', border: '#2A1A1A' },
  { id: 'negro',      name: 'Negro',       bg: '#000000', card: '#0C0C0C', card2: '#131313', border: '#202020' },
  { id: 'medianoche', name: 'Medianoche',  bg: '#05080F', card: '#0A0D18', card2: '#101525', border: '#1A2038' },
  { id: 'bosque',     name: 'Bosque',      bg: '#050A07', card: '#091210', card2: '#0F1A14', border: '#1A2A1E' },
  { id: 'vino',       name: 'Vino',        bg: '#0C0508', card: '#140A10', card2: '#1C1018', border: '#2C1822' },
  { id: 'pizarra',    name: 'Pizarra',     bg: '#0A0C10', card: '#111520', card2: '#181D2C', border: '#252D40' },
]

export const FONTS = [
  { id: 'clasica',      name: 'Clásica',      serif: "'Playfair Display', Georgia, serif",   sans: "'Inter', system-ui, sans-serif" },
  { id: 'literaria',    name: 'Literaria',    serif: "'Lora', Georgia, serif",               sans: "'Lora', Georgia, serif" },
  { id: 'crimson',      name: 'Crimson',      serif: "'Crimson Text', Georgia, serif",       sans: "'Crimson Text', Georgia, serif" },
  { id: 'elegante',     name: 'Elegante',     serif: "'DM Serif Display', Georgia, serif",   sans: "'Inter', system-ui, sans-serif" },
  { id: 'cinematica',   name: 'Cinematográfica', serif: "'Bebas Neue', Impact, sans-serif",  sans: "'Inter', system-ui, sans-serif" },
  { id: 'artdeco',      name: 'Art Déco',     serif: "'Josefin Sans', system-ui, sans-serif", sans: "'Josefin Sans', system-ui, sans-serif" },
  { id: 'moderna',      name: 'Moderna',      serif: "system-ui, -apple-system, sans-serif", sans: "system-ui, -apple-system, sans-serif" },
  { id: 'mono',         name: 'Mono',         serif: "'Space Mono', 'Courier New', monospace", sans: "'Space Mono', 'Courier New', monospace" },
  { id: 'retro',        name: 'Retro',        serif: "'Courier New', Courier, monospace",    sans: "'Courier New', Courier, monospace" },
]

function applySettings(themeId, bgId, fontId) {
  const t = THEMES.find(t => t.id === themeId)      || THEMES[0]
  const b = BACKGROUNDS.find(b => b.id === bgId)    || BACKGROUNDS[0]
  const f = FONTS.find(f => f.id === fontId)         || FONTS[0]
  const s = document.documentElement.style
  s.setProperty('--red',       t.red)
  s.setProperty('--red-hover', t.hover)
  s.setProperty('--red-dim',   t.dim)
  s.setProperty('--bg',        b.bg)
  s.setProperty('--card',      b.card)
  s.setProperty('--card2',     b.card2)
  s.setProperty('--border',    b.border)
  s.setProperty('--serif',     f.serif)
  s.setProperty('--sans',      f.sans)
}

export function useSettings() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('mf-theme') || 'rojo')
  const [bg,    setBgState]    = useState(() => localStorage.getItem('mf-bg')    || 'carbon')
  const [font,  setFontState]  = useState(() => localStorage.getItem('mf-font')  || 'clasica')

  useEffect(() => { applySettings(theme, bg, font) }, [theme, bg, font])

  const setTheme = (id) => { localStorage.setItem('mf-theme', id); setThemeState(id) }
  const setBg    = (id) => { localStorage.setItem('mf-bg',    id); setBgState(id) }
  const setFont  = (id) => { localStorage.setItem('mf-font',  id); setFontState(id) }

  return { theme, setTheme, bg, setBg, font, setFont }
}

// Aplica ajustes guardados antes del primer render
applySettings(
  localStorage.getItem('mf-theme') || 'rojo',
  localStorage.getItem('mf-bg')    || 'carbon',
  localStorage.getItem('mf-font')  || 'clasica'
)
