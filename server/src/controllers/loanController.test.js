// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  createLoanController,
  getUserLoansController,
  getLoanDetailsController,
  simulateLoanPayoffController,
  recordLoanPaymentController,
  updateLoanController,
  deleteLoanController
} from './loanController.js'
import {
  createLoan,
  getUserLoans,
  getLoanDetails,
  simulateLoanPayoff,
  recordLoanPayment,
  updateLoan,
  deleteLoan
} from '../services/loanService.js'

// Mock del loan service
vi.mock('../services/loanService.js', () => ({
  createLoan: vi.fn(),
  getUserLoans: vi.fn(),
  getLoanDetails: vi.fn(),
  simulateLoanPayoff: vi.fn(),
  recordLoanPayment: vi.fn(),
  updateLoan: vi.fn(),
  deleteLoan: vi.fn(),
}))

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 'test-user-id' },
    ...overrides
  }
}

describe('loanController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLoanController', () => {
    test('creates loan successfully', async () => {
      const mockLoanData = {
        name: 'Test Loan',
        loanType: 'PERSONAL_LOAN',
        lenderName: 'Test Bank',
        principalAmount: 10000,
        interestRate: 0.05,
        durationMonths: 12,
        firstPaymentDate: '2025-01-01'
      }

      const mockResult = {
        loan: { id: 'loan-id', ...mockLoanData },
        amortization: { monthlyPayment: 856.07 },
        schedule: []
      }

      createLoan.mockResolvedValue(mockResult)

      const req = mockReq({ body: mockLoanData })
      const res = mockRes()
      const next = vi.fn()

      await createLoanController(req, res, next)

      expect(createLoan).toHaveBeenCalledWith('test-user-id', mockLoanData)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockResult)
      expect(next).not.toHaveBeenCalled()
    })

    test('returns 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Nome vuoto
        principalAmount: -100 // Importo negativo
      }

      const req = mockReq({ body: invalidData })
      const res = mockRes()
      const next = vi.fn()

      await createLoanController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid loan data' })
    })

    test('handles service errors', async () => {
      createLoan.mockRejectedValue(new Error('Database error'))

      const req = mockReq({ body: { name: 'Test' } })
      const res = mockRes()
      const next = vi.fn()

      await createLoanController(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('getUserLoansController', () => {
    test('returns user loans successfully', async () => {
      const mockLoans = [
        {
          id: 'loan-1',
          name: 'Loan 1',
          currentBalance: 5000,
          progress: { percentageComplete: 50 }
        }
      ]

      getUserLoans.mockResolvedValue(mockLoans)

      const req = mockReq()
      const res = mockRes()
      const next = vi.fn()

      await getUserLoansController(req, res, next)

      expect(getUserLoans).toHaveBeenCalledWith('test-user-id')
      expect(res.json).toHaveBeenCalledWith(mockLoans)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('getLoanDetailsController', () => {
    test('returns loan details successfully', async () => {
      const mockLoanDetails = {
        id: 'loan-1',
        name: 'Test Loan',
        statistics: { totalPaid: 1000 },
        schedule: []
      }

      getLoanDetails.mockResolvedValue(mockLoanDetails)

      const req = mockReq({ params: { loanId: 'loan-1' } })
      const res = mockRes()
      const next = vi.fn()

      await getLoanDetailsController(req, res, next)

      expect(getLoanDetails).toHaveBeenCalledWith('test-user-id', 'loan-1')
      expect(res.json).toHaveBeenCalledWith(mockLoanDetails)
    })

    test('returns 404 for non-existent loan', async () => {
      getLoanDetails.mockRejectedValue(new Error('Loan not found'))

      const req = mockReq({ params: { loanId: 'non-existent' } })
      const res = mockRes()
      const next = vi.fn()

      await getLoanDetailsController(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('recordLoanPaymentController', () => {
    test('records payment successfully', async () => {
      const paymentData = {
        paymentNumber: 1,
        actualAmount: 856.07,
        paidDate: '2025-01-01'
      }

      const mockResult = {
        payment: { id: 'payment-1', status: 'PAID' },
        loan: { currentBalance: 9143.93 }
      }

      recordLoanPayment.mockResolvedValue(mockResult)

      const req = mockReq({
        params: { loanId: 'loan-1' },
        body: paymentData
      })
      const res = mockRes()
      const next = vi.fn()

      await recordLoanPaymentController(req, res, next)

      expect(recordLoanPayment).toHaveBeenCalledWith('test-user-id', 'loan-1', paymentData)
      expect(res.json).toHaveBeenCalledWith(mockResult)
    })

    test('returns 400 for invalid payment data', async () => {
      const invalidData = {
        paymentNumber: 'not-a-number',
        actualAmount: -100
      }

      const req = mockReq({
        params: { loanId: 'loan-1' },
        body: invalidData
      })
      const res = mockRes()
      const next = vi.fn()

      await recordLoanPaymentController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payment data' })
    })
  })

  describe('simulateLoanPayoffController', () => {
    test('returns payoff simulations', async () => {
      const mockSimulation = {
        loanId: 'loan-1',
        currentStatus: { remainingBalance: 5000 },
        simulations: [
          { targetMonth: 6, totalPayment: 5200, interestSaved: 300 }
        ]
      }

      simulateLoanPayoff.mockResolvedValue(mockSimulation)

      const req = mockReq({
        params: { loanId: 'loan-1' },
        query: { months: '6,12' }
      })
      const res = mockRes()
      const next = vi.fn()

      await simulateLoanPayoffController(req, res, next)

      expect(simulateLoanPayoff).toHaveBeenCalledWith('test-user-id', 'loan-1', [6, 12])
      expect(res.json).toHaveBeenCalledWith(mockSimulation)
    })

    test('handles invalid month parameters', async () => {
      const req = mockReq({
        params: { loanId: 'loan-1' },
        query: { months: 'invalid,not-number' }
      })
      const res = mockRes()
      const next = vi.fn()

      await simulateLoanPayoffController(req, res, next)

      // Dovrebbe passare array vuoto e usare default
      expect(simulateLoanPayoff).toHaveBeenCalledWith('test-user-id', 'loan-1', [])
    })
  })

  describe('updateLoanController', () => {
    test('updates loan successfully', async () => {
      const updateData = {
        name: 'Updated Loan Name',
        description: 'Updated description'
      }

      const mockUpdatedLoan = {
        id: 'loan-1',
        ...updateData
      }

      updateLoan.mockResolvedValue(mockUpdatedLoan)

      const req = mockReq({
        params: { loanId: 'loan-1' },
        body: updateData
      })
      const res = mockRes()
      const next = vi.fn()

      await updateLoanController(req, res, next)

      expect(updateLoan).toHaveBeenCalledWith('test-user-id', 'loan-1', updateData)
      expect(res.json).toHaveBeenCalledWith(mockUpdatedLoan)
    })
  })

  describe('deleteLoanController', () => {
    test('deletes loan successfully', async () => {
      const mockResult = { success: true }
      deleteLoan.mockResolvedValue(mockResult)

      const req = mockReq({ params: { loanId: 'loan-1' } })
      const res = mockRes()
      const next = vi.fn()

      await deleteLoanController(req, res, next)

      expect(deleteLoan).toHaveBeenCalledWith('test-user-id', 'loan-1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockResult)
    })

    test('handles deletion errors', async () => {
      deleteLoan.mockRejectedValue(new Error('Cannot delete loan with pending payments'))

      const req = mockReq({ params: { loanId: 'loan-1' } })
      const res = mockRes()
      const next = vi.fn()

      await deleteLoanController(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
