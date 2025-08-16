import jwt from 'jsonwebtoken'

export function authRequired(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    req.user = { id: payload.uid, email: payload.email }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Allows anonymous for now; if no token, req.user stays undefined.
// But we’ll still scope queries by user when needed (most routes will call authRequired).
export function authOptional(req, res, next) {
  const h = req.headers.authorization || ''
  if (h.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET || 'dev')
      req.user = { id: payload.uid, email: payload.email }
    } catch {}
  }
  next()
}
