'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface QueueItem {
  id: string
  fileName: string
  addedAt: number
}

interface AnalysisState {
  isAnalyzing: boolean
  isCompleted: boolean
  resultId: string | null
  startedAt: number | null
  queue: QueueItem[]
  currentFileName: string | null
  completedIds: string[]
}

interface AnalysisContextType {
  state: AnalysisState
  startAnalysis: (fileName?: string) => void
  completeAnalysis: (resultId: string) => void
  clearAnalysis: () => void
  goToAnalysis: () => void
  addToQueue: (fileName: string) => string
  removeFromQueue: (id: string) => void
  processQueue: () => void
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

const STORAGE_KEY = 'jobizic_analysis_state'

// localStorage에서 초기 상태 읽기
const getInitialState = (): AnalysisState => {
  const defaultState: AnalysisState = {
    isAnalyzing: false,
    isCompleted: false,
    resultId: null,
    startedAt: null,
    queue: [],
    currentFileName: null,
    completedIds: [],
  }

  if (typeof window === 'undefined') {
    return defaultState
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 이전 버전 호환성: 필수 필드가 없으면 기본값 사용
      return {
        ...defaultState,
        ...parsed,
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      }
    }
  } catch (error) {
    console.error('Failed to load analysis state:', error)
    // 에러 발생 시 localStorage 초기화
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return defaultState
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

  // 완료 후 5초 뒤 자동으로 사라지게 (큐가 비어있을 때만)
  useEffect(() => {
    if (state.isCompleted && (!state.queue || state.queue.length === 0)) {
      const timer = setTimeout(() => {
        const clearedState: AnalysisState = {
          isAnalyzing: false,
          isCompleted: false,
          resultId: null,
          startedAt: null,
          queue: [],
          currentFileName: null,
          completedIds: [],
        }
        setState(clearedState)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY)
        }
      }, 5000) // 5초

      return () => clearTimeout(timer)
    }
  }, [state.isCompleted, state.queue.length])

  // 분석 완료 시 자동으로 다음 큐 처리
  useEffect(() => {
    if (state.isCompleted && state.queue && state.queue.length > 0) {
      // 잠시 후 다음 분석 시작
      const timer = setTimeout(() => {
        processQueue()
      }, 1000) // 1초 대기 후 다음 분석

      return () => clearTimeout(timer)
    }
  }, [state.isCompleted, state.queue.length])

  const addToQueue = (fileName: string): string => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newItem: QueueItem = {
      id,
      fileName,
      addedAt: Date.now(),
    }

    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, newItem],
    }))

    return id
  }

  const removeFromQueue = (id: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((item) => item.id !== id),
    }))
  }

  const processQueue = () => {
    setState((prev) => {
      if (prev.queue.length === 0) return prev

      const [nextItem, ...remainingQueue] = prev.queue

      return {
        ...prev,
        isAnalyzing: true,
        isCompleted: false,
        resultId: null,
        startedAt: Date.now(),
        queue: remainingQueue,
        currentFileName: nextItem.fileName,
      }
    })
  }

  const startAnalysis = (fileName?: string) => {
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      isCompleted: false,
      resultId: null,
      startedAt: Date.now(),
      currentFileName: fileName || null,
    }))
  }

  const completeAnalysis = (resultId: string) => {
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      isCompleted: true,
      resultId,
      completedIds: [...prev.completedIds, resultId],
    }))
  }

  const clearAnalysis = () => {
    setState({
      isAnalyzing: false,
      isCompleted: false,
      resultId: null,
      startedAt: null,
      queue: [],
      currentFileName: null,
      completedIds: [],
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
        addToQueue,
        removeFromQueue,
        processQueue,
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
