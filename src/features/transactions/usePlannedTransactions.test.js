/**
 * 📄 TEST USE PLANNED TRANSACTIONS: Test per la funzionalità di auto-materializzazione
 * 
 * 🎯 Scopo: Verifica che la logica di auto-materializzazione funzioni correttamente
 * 
 * @author Finance WebApp Team
 * @modified 25 Agosto 2025 - Test per auto-materializzazione
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePlannedTransactions from './usePlannedTransactions.js'

// Mock del modulo API
vi.mock('../../lib/api.js', () => ({
  api: {
    listPlannedTransactions: vi.fn(),
    listTransactionGroups: vi.fn(),
    getPlannedTransactionsDue: vi.fn(),
    materializePlannedTransaction: vi.fn()
  }
}))

// Mock dei moduli di budgeting
vi.mock('./lib/budgetingIntegration.js', () => ({
  applyMonthlyTransactionToBudget: vi.fn(() => []),
  applyYearlyTransactionToBudget: vi.fn(() => []),
  applyOneTimeTransactionToBudget: vi.fn(() => []),
  applyGroupToBudget: vi.fn(() => []),
  removeTransactionFromBudget: vi.fn(() => [])
}))

import { api } from '../../lib/api.js'

describe('usePlannedTransactions - Auto-materializzazione', () => {
  const mockToken = 'test-token'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock base per i dati
    api.listPlannedTransactions.mockResolvedValue([])
    api.listTransactionGroups.mockResolvedValue([])
    api.getPlannedTransactionsDue.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('dovrebbe auto-materializzare transazioni AUTOMATIC scadute', async () => {
    // Arrange: Crea transazioni scadute con conferma automatica
    const dueTransactions = [
      {
        id: '1',
        title: 'Pagamento Automatico',
        confirmationMode: 'AUTOMATIC',
        isActive: true,
        nextDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ieri
        amount: 100
      },
      {
        id: '2', 
        title: 'Pagamento Manuale',
        confirmationMode: 'MANUAL',
        isActive: true,
        nextDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ieri
        amount: 50
      },
      {
        id: '3',
        title: 'Pagamento Auto Futuro',
        confirmationMode: 'AUTOMATIC',
        isActive: true,
        nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Domani
        amount: 75
      }
    ]

    api.getPlannedTransactionsDue.mockResolvedValue(dueTransactions)
    api.materializePlannedTransaction.mockResolvedValue({ success: true })

    // Act: Render hook e aspetta che l'effetto si esegua
    const { result } = renderHook(() => usePlannedTransactions(mockToken))
    
    // Wait for effects to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Assert: Verifica che solo la transazione AUTOMATIC scaduta sia stata materializzata
    expect(api.materializePlannedTransaction).toHaveBeenCalledTimes(1)
    expect(api.materializePlannedTransaction).toHaveBeenCalledWith(mockToken, '1')
    
    // Le transazioni MANUAL o future non dovrebbero essere materializzate
    expect(api.materializePlannedTransaction).not.toHaveBeenCalledWith(mockToken, '2')
    expect(api.materializePlannedTransaction).not.toHaveBeenCalledWith(mockToken, '3')
  })

  test('dovrebbe chiamare refreshTransactions dopo auto-materializzazione', async () => {
    // Arrange: Mock refreshTransactions function
    const mockRefreshTransactions = vi.fn()
    
    const dueTransactions = [
      {
        id: '1',
        title: 'Pagamento Automatico',
        confirmationMode: 'AUTOMATIC',
        isActive: true,
        nextDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        amount: 100
      }
    ]

    api.getPlannedTransactionsDue.mockResolvedValue(dueTransactions)
    api.materializePlannedTransaction.mockResolvedValue({ success: true })

    // Act: Render hook con refreshTransactions
    const { result } = renderHook(() => usePlannedTransactions(mockToken, { refreshTransactions: mockRefreshTransactions }))
    
    // Wait for effects and refresh callback to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600)) // Aspetta anche il timeout del refresh
    })

    // Assert: Verifica che refreshTransactions sia stata chiamata
    expect(api.materializePlannedTransaction).toHaveBeenCalledTimes(1)
    expect(mockRefreshTransactions).toHaveBeenCalledTimes(1)
  })

  test('non dovrebbe auto-materializzare transazioni inattive', async () => {
    // Arrange: Transazione AUTOMATIC scaduta ma inattiva
    const dueTransactions = [
      {
        id: '1',
        title: 'Pagamento Inattivo',
        confirmationMode: 'AUTOMATIC',
        isActive: false, // Inattiva
        nextDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        amount: 100
      }
    ]

    api.getPlannedTransactionsDue.mockResolvedValue(dueTransactions)

    // Act
    const { result } = renderHook(() => usePlannedTransactions(mockToken))
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Assert: Non dovrebbe essere materializzata
    expect(api.materializePlannedTransaction).not.toHaveBeenCalled()
  })

  test('dovrebbe gestire errori di materializzazione senza bloccare altre transazioni', async () => {
    // Arrange: Multiple transazioni automatiche, una fallisce
    const dueTransactions = [
      {
        id: '1',
        title: 'Pagamento 1',
        confirmationMode: 'AUTOMATIC',
        isActive: true,
        nextDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        amount: 100
      },
      {
        id: '2',
        title: 'Pagamento 2',
        confirmationMode: 'AUTOMATIC',
        isActive: true,
        nextDueDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 ore fa
        amount: 50
      }
    ]

    api.getPlannedTransactionsDue.mockResolvedValue(dueTransactions)
    
    // Prima chiamata fallisce, seconda riesce
    api.materializePlannedTransaction
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Act
    const { result } = renderHook(() => usePlannedTransactions(mockToken))
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Assert: Entrambe le chiamate dovrebbero essere tentate
    expect(api.materializePlannedTransaction).toHaveBeenCalledTimes(2)
    expect(api.materializePlannedTransaction).toHaveBeenCalledWith(mockToken, '1')
    expect(api.materializePlannedTransaction).toHaveBeenCalledWith(mockToken, '2')
    
    // L'errore dovrebbe essere loggato
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Errore auto-materializzazione transazione Pagamento 1:'),
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  test('non dovrebbe eseguire auto-materializzazione se non ci sono transazioni scadute', async () => {
    // Arrange: Nessuna transazione scaduta
    api.getPlannedTransactionsDue.mockResolvedValue([])

    // Act
    const { result } = renderHook(() => usePlannedTransactions(mockToken))
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Assert
    expect(api.materializePlannedTransaction).not.toHaveBeenCalled()
  })

  test('non dovrebbe eseguire auto-materializzazione se non c\'è token', async () => {
    // Act: Render hook senza token
    const { result } = renderHook(() => usePlannedTransactions(null))
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Assert
    expect(api.materializePlannedTransaction).not.toHaveBeenCalled()
    expect(api.getPlannedTransactionsDue).not.toHaveBeenCalled()
  })
})
