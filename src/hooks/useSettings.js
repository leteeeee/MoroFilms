import { useState, useEffect } from 'react'

export const THEMES = [
  { id: 'rojo',    name: 'Rojo',    red: '#C41E3A', hover: '#E0253F', dim: 'rgba(196,30,58,.13)' },
  { id: 'dorado',  name: 'Dorado',  red: '#C8960C', hover: '#DFA80E', dim: 'rgba(200,150,12,.13)' },
  { id: 'verde',   name: 'Verde',   red: '#2D9E6B', hover: '#38B87D', dim: 'rgba(45,158,107,.13)' },
  { id: 'azul',    name: 'Azul',    red: '#2D7DD2', hover: '#3D8FE8', dim: 'rgba(45,125,210,.13)' },
  { id: 'morado',  name: 'Morado',  red: '#9B5DE5', hover: '#AC70F0', dim: 'rgba(155,93,229,.13)' },
  { id: 'naranja', name: 'Naranja', red: '#E07020', hover: '#F08030', dim: 'rgba(224,112,32,.13)' },
]

export const FONTS = [
  { id: 'clasica', name: 'Clásica', serif: "'Playfair Display', Georgia, serif",   sans: "'Inter', system-ui, sans-serif" },
  { id: 'moderna', name: 'Moderna', serif: "'Inter', system-ui, sans-serif",        sans: "'Inter', system-ui, sans-serif" },
  { id: 'retro',   name: 'Retro',   serif: "'Courier New', Courier, monospace",     sans: "'Courier New', Courier, monospace" },
]

function applySettings(themeId, fontId) {
  const t = THEMES.find(t => t.id === themeId) || THEMES[0]
  const f = FONTS.find(f => f.id === fontId)   || FONTS[0]
  const s = document.documentElement.style
  s.setProperty('--red',       t.red)
  s.setProperty('--red-hover', t.hover)
  s.setProperty('--red-dim',   t.dim)
  s.setProperty('--serif',     f.serif)
  s.setProperty('--sans',      f.sans)
}

export function useSettings() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('mf-theme') || 'rojo')
  const [font,  setFontState]  = useState(() => localStorage.getItem('mf-font')  || 'clasica')

  useEffect(() => { applySettings(theme, font) }, [theme, font])

  const setTheme = (id) => { localStorage.setItem('mf-theme', id); setThemeState(id) }
  const setFont  = (id) => { localStorage.setItem('mf-font',  id); setFontState(id) }

  return { theme, setTheme, font, setFont }
}

// Aplica ajustes guardados antes del primer render
applySettings(
  localStorage.getItem('mf-theme') || 'rojo',
  localStorage.getItem('mf-font')  || 'clasica'
)
