import { createTransfer, deleteTransfer, listTransfers } from '../services/transferService.js'

export async function createTransferHandler(req, res) {
  try {
    const userId = req.user.id
    const transfer = await createTransfer(userId, req.body)
    res.status(201).json(transfer)
  } catch (err) {
    console.error('❌ Create transfer error:', err.message)
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
  }
}

export async function deleteTransferHandler(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params
    await deleteTransfer(userId, id)
    res.status(204).end()
  } catch (err) {
    console.error('❌ Delete transfer error:', err.message)
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
  }
}

export async function listTransfersHandler(req, res) {
  try {
    const userId = req.user.id
    const transfers = await listTransfers(userId, req.query)
    res.status(200).json(transfers)
  } catch (err) {
    console.error('❌ List transfers error:', err.message)
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
  }
}
