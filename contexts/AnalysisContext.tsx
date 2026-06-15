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

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    isCompleted: false,
    resultId: null,
    startedAt: null,
  })

  // 완료 후 5초 뒤 자동으로 사라지게
  useEffect(() => {
    if (state.isCompleted) {
      const timer = setTimeout(() => {
        setState({
          isAnalyzing: false,
          isCompleted: false,
          resultId: null,
          startedAt: null,
        })
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
