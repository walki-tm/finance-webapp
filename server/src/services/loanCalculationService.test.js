// @vitest-environment node
import { describe, expect, test } from 'vitest'
import {
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  simulateEarlyPayoff,
  recalculateAfterPayment,
  validateLoanParameters
} from './loanCalculationService.js'

describe('loanCalculationService', () => {
  describe('calculateMonthlyPayment', () => {
    test('calculates correct monthly payment for standard loan', () => {
      const result = calculateMonthlyPayment(10000, 0.05, 12)
      
      // Per un prestito di 10,000€ al 5% annuo per 12 mesi
      // La rata dovrebbe essere circa 856.07€
      expect(result).toBeCloseTo(856.07, 2)
    })

    test('calculates correct payment for mortgage', () => {
      const result = calculateMonthlyPayment(200000, 0.03, 360)
      
      // Mutuo di 200,000€ al 3% per 30 anni
      expect(result).toBeCloseTo(843.21, 2)
    })

    test('handles zero interest rate', () => {
      const result = calculateMonthlyPayment(12000, 0, 12)
      
      // Senza interessi, dovrebbe essere capitale / mesi
      expect(result).toBe(1000)
    })

    test('throws error for invalid parameters', () => {
      expect(() => {
        calculateMonthlyPayment(-1000, 0.05, 12)
      }).toThrow('Principal amount and duration must be positive')
    })
  })

  describe('calculateAmortizationSchedule', () => {
    test('generates correct amortization schedule', () => {
      const result = calculateAmortizationSchedule({
        principal: 10000,
        annualRate: 0.06, // 6% annuo
        durationMonths: 12,
        firstPaymentDate: '2025-01-01'
      })

      // Verifica struttura del risultato
      expect(result).toHaveProperty('monthlyPayment')
      expect(result).toHaveProperty('totalInterest')
      expect(result).toHaveProperty('schedule')
      expect(result.schedule).toHaveLength(12)

      // Verifica prima rata
      const firstPayment = result.schedule[0]
      expect(firstPayment).toHaveProperty('paymentNumber', 1)
      expect(firstPayment).toHaveProperty('dueDate')
      expect(firstPayment).toHaveProperty('scheduledAmount')
      expect(firstPayment).toHaveProperty('principalAmount')
      expect(firstPayment).toHaveProperty('interestAmount')
      expect(firstPayment).toHaveProperty('remainingBalance')

      // Verifica che il debito residuo dell'ultima rata sia 0
      const lastPayment = result.schedule[11]
      expect(lastPayment.remainingBalance).toBeCloseTo(0, 2)

      // Verifica che la somma dei pagamenti capitale sia uguale al principale
      const totalPrincipal = result.schedule.reduce(
        (sum, payment) => sum + payment.principalAmount, 
        0
      )
      expect(totalPrincipal).toBeCloseTo(10000, 1)
    })

    test('handles monthly frequency correctly', () => {
      const result = calculateAmortizationSchedule({
        principal: 5000,
        annualRate: 0.12,
        durationMonths: 6,
        firstPaymentDate: '2025-01-15'
      })

      // Verifica date consecutive
      const dates = result.schedule.map(p => new Date(p.dueDate))
      for (let i = 1; i < dates.length; i++) {
        const prevMonth = dates[i - 1].getMonth()
        const currMonth = dates[i].getMonth()
        const monthDiff = (currMonth - prevMonth + 12) % 12
        expect(monthDiff).toBe(1) // Ogni mese successivo
      }
    })
  })

  describe('simulateEarlyPayoff', () => {
    test('calculates early payoff correctly', () => {
      const loanData = {
        principal: 10000,
        annualRate: 0.06,
        durationMonths: 24,
        firstPaymentDate: '2025-01-01'
      }

      const result = simulateEarlyPayoff(loanData, 12) // Estinguere in 12 mesi

      expect(result).toHaveProperty('targetMonth', 12)
      expect(result).toHaveProperty('earlyPayoffAmount')
      expect(result).toHaveProperty('interestSaved')
      expect(result).toHaveProperty('monthlyPaymentSaved')
      
      // L'importo totale dovrebbe essere maggiore della rata normale
      // ma il risparmio di interessi dovrebbe essere positivo
      expect(result.interestSaved).toBeGreaterThan(0)
      expect(result.earlyPayoffAmount).toBeGreaterThan(0)
    })

    test('throws error for invalid target month', () => {
      const loanData = {
        principal: 10000,
        annualRate: 0.06,
        durationMonths: 24,
        firstPaymentDate: '2025-01-01'
      }

      expect(() => {
        simulateEarlyPayoff(loanData, 0) // Mese invalido
      }).toThrow('Target month must be within loan duration')

      expect(() => {
        simulateEarlyPayoff(loanData, 25) // Oltre la durata
      }).toThrow('Target month must be within loan duration')
    })
  })

  describe('recalculateAfterPayment', () => {
    test('recalculates loan after standard payment', () => {
      const loanStatus = {
        currentBalance: 10000,
        annualRate: 0.06,
        remainingMonths: 12,
        monthlyPayment: 856.07
      }

      const paymentInfo = {
        actualAmount: 900, // Pagamento leggermente diverso per forzare ricalcolo
        paymentNumber: 1
      }

      const result = recalculateAfterPayment(loanStatus, paymentInfo)

      expect(result).toHaveProperty('newBalance')
      expect(result).toHaveProperty('remainingMonths', 11)
      expect(result).toHaveProperty('monthlyPayment')
      expect(result.newBalance).toBeLessThan(10000)
    })

    test('handles overpayment correctly', () => {
      const loanStatus = {
        currentBalance: 1000,
        annualRate: 0.06,
        remainingMonths: 2,
        monthlyPayment: 500
      }

      const paymentInfo = {
        actualAmount: 1200, // Pagamento superiore al debito
        paymentNumber: 1
      }

      const result = recalculateAfterPayment(loanStatus, paymentInfo)

      expect(result.newBalance).toBe(0)
      expect(result.status).toBe('PAID_OFF')
      expect(result.remainingMonths).toBe(0)
    })

    test('handles partial payment', () => {
      const loanStatus = {
        currentBalance: 10000,
        annualRate: 0.06,
        remainingMonths: 12,
        monthlyPayment: 856.07
      }

      const paymentInfo = {
        actualAmount: 400, // Pagamento parziale
        paymentNumber: 1
      }

      const result = recalculateAfterPayment(loanStatus, paymentInfo)

      // Il debito dovrebbe diminuire ma rimanere significativo
      expect(result.newBalance).toBeGreaterThan(9500)
      expect(result.newBalance).toBeLessThan(10000)
    })
  })

  describe('validateLoanParameters', () => {
    test('validates correct parameters', () => {
      const validData = {
        principal: 10000,
        annualRate: 0.05,
        durationMonths: 12,
        firstPaymentDate: '2025-12-01' // Data futura
      }

      const result = validateLoanParameters(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('identifies missing required fields', () => {
      const invalidData = {
        principal: null, // Principal mancante
        annualRate: 0.05,
        // mancano altri campi obbligatori
      }

      const result = validateLoanParameters(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('Principal'))).toBe(true)
    })

    test('validates numeric constraints', () => {
      const invalidData = {
        principal: -1000, // Negativo
        annualRate: -0.01, // Negativo
        durationMonths: 0, // Zero
        firstPaymentDate: '2025-01-01'
      }

      const result = validateLoanParameters(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('Principal'))).toBe(true)
      expect(result.errors.some(error => error.includes('interest'))).toBe(true)
      expect(result.errors.some(error => error.includes('Duration'))).toBe(true)
    })

    test('validates rate constraints', () => {
      const invalidData = {
        principal: 10000,
        annualRate: 2.5, // Oltre 100% (2.5 = 250%)
        durationMonths: 12,
        firstPaymentDate: '2025-12-01'
      }

      const result = validateLoanParameters(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('interest'))).toBe(true)
    })

    test('validates date format', () => {
      const invalidData = {
        principal: 10000,
        annualRate: 0.05,
        durationMonths: 12,
        firstPaymentDate: '2020-01-01' // Data nel passato
      }

      const result = validateLoanParameters(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('date'))).toBe(true)
    })
  })
})
