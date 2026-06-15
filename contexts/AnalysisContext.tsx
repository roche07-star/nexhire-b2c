'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AnalysisState {
  isAnalyzing: boolean
  isCompleted: boolean
  resultId: string | null
  startedAt: number | null
}

interface AnalysisContextType {
  state: AnalysisState
  startAnalysis: () => void
  completeAnalysis: (resultId: string) => void
  clearAnalysis: () => void
  goToAnalysis: () => void
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

const STORAGE_KEY = 'jobizic_analysis_state'

// localStorage에서 초기 상태 읽기
const getInitialState = (): AnalysisState => {
  if (typeof window === 'undefined') {
    return {
      isAnalyzing: false,
      isCompleted: false,
      resultId: null,
      startedAt: null,
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load analysis state:', error)
  }

  return {
    isAnalyzing: false,
    isCompleted: false,
    resultId: null,
    startedAt: null,
  }
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AnalysisState>(getInitialState)

  // 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save analysis state:', error)
      }
    }
  }, [state])

  // 완료 후 5초 뒤 자동으로 사라지게
  useEffect(() => {
    if (state.isCompleted) {
      const timer = setTimeout(() => {
        const clearedState = {
          isAnalyzing: false,
          isCompleted: false,
          resultId: null,
          startedAt: null,
        }
        setState(clearedState)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY)
        }
      }, 5000) // 5초

      return () => clearTimeout(timer)
    }
  }, [state.isCompleted])

  const startAnalysis = () => {
    setState({
      isAnalyzing: true,
      isCompleted: false,
      resultId: null,
      startedAt: Date.now(),
    })
  }

  const completeAnalysis = (resultId: string) => {
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      isCompleted: true,
      resultId,
    }))
  }

  const clearAnalysis = () => {
    setState({
      isAnalyzing: false,
      isCompleted: false,
      resultId: null,
      startedAt: null,
    })
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const goToAnalysis = () => {
    if (state.isAnalyzing) {
      window.location.href = '/analyze'
    } else if (state.resultId) {
      window.location.href = `/result/${state.resultId}`
    }
  }

  return (
    <AnalysisContext.Provider
      value={{
        state,
        startAnalysis,
        completeAnalysis,
        clearAnalysis,
        goToAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider')
  }
  return context
}
