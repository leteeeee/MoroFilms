export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { q, type, id } = req.query
  const key = process.env.TMDB_KEY

  try {
    // Películas de un director por su ID
    if (id) {
      const url = `https://api.themoviedb.org/3/person/${id}/movie_credits`
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
      return res.status(200).json({ results: data.results || [] })
    }

    // Búsqueda de película (por defecto)
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&language=es-ES&page=1`
    const data = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` }
    }).then(r => r.json())
    res.status(200).json({ results: data.results || [] })

  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
