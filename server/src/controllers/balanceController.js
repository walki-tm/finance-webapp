import { getCurrentBalance } from '../services/balanceService.js'

export async function fetchBalance(req, res, next) {
  try {
    const data = await getCurrentBalance(req.user.id)
    res.json(data)
  } catch (e) { next(e) }
}
