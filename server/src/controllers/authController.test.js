// @vitest-environment node
import { describe, expect, test, vi } from 'vitest'
import { register, login } from './authController.js'
import { registerUser, loginUser } from '../services/authService.js'

vi.mock('../services/authService.js', () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}))

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

describe('authController', () => {
  test('register returns 201 on success', async () => {
    registerUser.mockResolvedValue({ ok: true })
    const req = { body: { name: 'John', email: 'john@example.com', password: 'secret12' } }
    const res = mockRes()
    const next = vi.fn()
    await register(req, res, next)
    expect(registerUser).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com', password: 'secret12' })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ ok: true })
    expect(next).not.toHaveBeenCalled()
  })

  test('register invalid body returns 400', async () => {
    const req = { body: { name: 'Jo', email: 'bad', password: '123' } }
    const res = mockRes()
    const next = vi.fn()
    await register(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid body' })
  })

  test('login returns data', async () => {
    loginUser.mockResolvedValue({ token: 't' })
    const req = { body: { name: 'ignored', email: 'john@example.com', password: 'secret12' } }
    const res = mockRes()
    const next = vi.fn()
    await login(req, res, next)
    expect(loginUser).toHaveBeenCalledWith({ email: 'john@example.com', password: 'secret12' })
    expect(res.json).toHaveBeenCalledWith({ token: 't' })
    expect(next).not.toHaveBeenCalled()
  })

  test('login invalid body returns 400', async () => {
    const req = { body: { email: 'bad', password: '123' } }
    const res = mockRes()
    const next = vi.fn()
    await login(req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' })
  })
})