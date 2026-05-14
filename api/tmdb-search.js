export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query' })

  const key = process.env.TMDB_KEY
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&language=es-ES&page=1`

  try {
    const data = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
    }).then(r => r.json())
    res.status(200).json({ results: data.results || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
