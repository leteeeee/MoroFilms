export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { q, type, id } = req.query
  const key = process.env.TMDB_KEY

  try {
    // Películas de un director por su ID
    if (id) {
      const url = `https://api.themoviedb.org/3/person/${id}/movie_credits?language=es-ES`
      const data = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` }
      }).then(r => r.json())
      const directed = (data.crew || [])
        .filter(m => m.job === 'Director')
        .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
      return res.status(200).json({ results: directed })
    }

    if (!q) return res.status(400).json({ error: 'Missing query' })

    // Búsqueda de persona (director)
    if (type === 'person') {
      const url = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(q)}&language=es-ES`
      const data = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` }
      }).then(r => r.json())
      const directors = (data.results || []).filter(p => p.known_for_department === 'Directing')
      return res.status(200).json({ results: directors })
    }

    // Créditos de película (para sacar director)
    if (type === 'credits') {
      const url = `https://api.themoviedb.org/3/movie/${q}/credits`
      const data = await fetch(url, { headers: { Authorization: `Bearer ${key}` } }).then(r => r.json())
      const director = (data.crew || []).find(c => c.job === 'Director')
      return res.status(200).json({ director: director?.name || null })
    }

    // Búsqueda de película en inglés y español combinados
    const headers = { Authorization: `Bearer ${key}` }
    const base = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&page=1`
    const [enData, esData] = await Promise.all([
      fetch(`${base}&language=en-US`, { headers }).then(r => r.json()),
      fetch(`${base}&language=es-ES`, { headers }).then(r => r.json()),
    ])
    const seen = new Set()
    const results = []
    for (const m of [...(enData.results || []), ...(esData.results || [])]) {
      if (!seen.has(m.id)) { seen.add(m.id); results.push(m) }
    }
    res.status(200).json({ results })

  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
