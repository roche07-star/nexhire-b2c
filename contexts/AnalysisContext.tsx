'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface QueueItem {
  id: string
  fileName: string
  addedAt: number
}

interface TaskState {
  isAnalyzing: boolean
  isCompleted: boolean
  resultId: string | null
  startedAt: number | null
}

interface AnalysisState {
  // 이력서 분석
  resume: TaskState & {
    queue: QueueItem[]
    currentFileName: string | null
    completedIds: string[]
  }
  // JD 분석
  jd: TaskState
  // 이력서 생성
  rewrite: TaskState
}

interface AnalysisContextType {
  state: AnalysisState
  // 이력서 분석
  startAnalysis: (fileName?: string) => void
  completeAnalysis: (resultId: string) => void
  clearAnalysis: () => void
  goToAnalysis: () => void
  addToQueue: (fileName: string) => string
  removeFromQueue: (id: string) => void
  processQueue: () => void
  // JD 분석
  startJdAnalysis: () => void
  completeJdAnalysis: (resultId: string) => void
  clearJdAnalysis: () => void
  // 이력서 생성
  startRewrite: () => void
  completeRewrite: (resultId: string) => void
  clearRewrite: () => void
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

const STORAGE_KEY = 'jobizic_analysis_state'

// localStorage에서 초기 상태 읽기
const getInitialState = (): AnalysisState => {
  const defaultState: AnalysisState = {
    resume: {
      isAnalyzing: false,
      isCompleted: false,
      resultId: null,
      startedAt: null,
      queue: [],
      currentFileName: null,
      completedIds: [],
    },
    jd: {
      isAnalyzing: false,
      isCompleted: false,
      resultId: null,
      startedAt: null,
    },
    rewrite: {
      isAnalyzing: false,
      isCompleted: false,
      resultId: null,
      startedAt: null,
    },
  }

  if (typeof window === 'undefined') {
    return defaultState
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)

      // 이전 버전 호환성 처리
      if (parsed.isAnalyzing !== undefined) {
        // 이전 단일 구조 → 새 구조로 변환
        return {
          resume: {
            isAnalyzing: parsed.isAnalyzing || false,
            isCompleted: parsed.isCompleted || false,
            resultId: parsed.resultId || null,
            startedAt: parsed.startedAt || null,
            queue: Array.isArray(parsed.queue) ? parsed.queue : [],
            currentFileName: parsed.currentFileName || null,
            completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
          },
          jd: defaultState.jd,
          rewrite: defaultState.rewrite,
        }
      }

      // 새 구조
      return {
        resume: {
          ...defaultState.resume,
          ...(parsed.resume || {}),
          queue: Array.isArray(parsed.resume?.queue) ? parsed.resume.queue : [],
          completedIds: Array.isArray(parsed.resume?.completedIds) ? parsed.resume.completedIds : [],
        },
        jd: {
          ...defaultState.jd,
          ...(parsed.jd || {}),
        },
        rewrite: {
          ...defaultState.rewrite,
          ...(parsed.rewrite || {}),
        },
      }
    }
  } catch (error) {
    console.error('Failed to load analysis state:', error)
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

  // 완료 후 5초 뒤 자동으로 사라지게 (큐가 비어있을 때만) - 이력서 분석만
  useEffect(() => {
    if (state.resume.isCompleted && state.resume.queue.length === 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          resume: {
            ...prev.resume,
            isAnalyzing: false,
            isCompleted: false,
            resultId: null,
            startedAt: null,
            currentFileName: null,
          },
        }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.resume.isCompleted, state.resume.queue.length])

  // JD 분석 완료 후 5초 뒤 자동으로 사라지게
  useEffect(() => {
    if (state.jd.isCompleted) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          jd: {
            isAnalyzing: false,
            isCompleted: false,
            resultId: null,
            startedAt: null,
          },
        }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.jd.isCompleted])

  // 이력서 생성 완료 후 5초 뒤 자동으로 사라지게
  useEffect(() => {
    if (state.rewrite.isCompleted) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          rewrite: {
            isAnalyzing: false,
            isCompleted: false,
            resultId: null,
            startedAt: null,
          },
        }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.rewrite.isCompleted])

  // 분석 완료 시 자동으로 다음 큐 처리 - 이력서 분석만
  useEffect(() => {
    if (state.resume.isCompleted && state.resume.queue.length > 0) {
      const timer = setTimeout(() => {
        processQueue()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.resume.isCompleted, state.resume.queue.length])

  // 이력서 분석 함수들
  const addToQueue = (fileName: string): string => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newItem: QueueItem = {
      id,
      fileName,
      addedAt: Date.now(),
    }

    setState((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        queue: [...prev.resume.queue, newItem],
      },
    }))

    return id
  }

  const removeFromQueue = (id: string) => {
    setState((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        queue: prev.resume.queue.filter((item) => item.id !== id),
      },
    }))
  }

  const processQueue = () => {
    setState((prev) => {
      if (prev.resume.queue.length === 0) return prev

      const [nextItem, ...remainingQueue] = prev.resume.queue

      return {
        ...prev,
        resume: {
          ...prev.resume,
          isAnalyzing: true,
          isCompleted: false,
          resultId: null,
          startedAt: Date.now(),
          queue: remainingQueue,
          currentFileName: nextItem.fileName,
        },
      }
    })
  }

  const startAnalysis = (fileName?: string) => {
    setState((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        isAnalyzing: true,
        isCompleted: false,
        resultId: null,
        startedAt: Date.now(),
        currentFileName: fileName || null,
      },
    }))
  }

  const completeAnalysis = (resultId: string) => {
    setState((prev) => ({
      ...prev,
      resume: {
        ...prev.resume,
        isAnalyzing: false,
        isCompleted: true,
        resultId,
        completedIds: [...prev.resume.completedIds, resultId],
      },
    }))
  }

  const clearAnalysis = () => {
    setState((prev) => ({
      ...prev,
      resume: {
        isAnalyzing: false,
        isCompleted: false,
        resultId: null,
        startedAt: null,
        queue: [],
        currentFileName: null,
        completedIds: [],
      },
    }))
  }

  const goToAnalysis = () => {
    if (state.resume.isAnalyzing) {
      window.location.href = '/analyze'
    } else if (state.resume.resultId) {
      window.location.href = `/result/${state.resume.resultId}`
    }
  }

  // JD 분석 함수들
  const startJdAnalysis = () => {
    setState((prev) => ({
      ...prev,
      jd: {
        isAnalyzing: true,
        isCompleted: false,
        resultId: null,
        startedAt: Date.now(),
      },
    }))
  }

  const completeJdAnalysis = (resultId: string) => {
    setState((prev) => ({
      ...prev,
      jd: {
        isAnalyzing: false,
        isCompleted: true,
        resultId,
        startedAt: prev.jd.startedAt,
      },
    }))
  }

  const clearJdAnalysis = () => {
    setState((prev) => ({
      ...prev,
      jd: {
        isAnalyzing: false,
        isCompleted: false,
        resultId: null,
        startedAt: null,
      },
    }))
  }

  // 이력서 생성 함수들
  const startRewrite = () => {
    setState((prev) => ({
      ...prev,
      rewrite: {
        isAnalyzing: true,
        isCompleted: false,
        resultId: null,
        startedAt: Date.now(),
      },
    }))
  }

  const completeRewrite = (resultId: string) => {
    setState((prev) => ({
      ...prev,
      rewrite: {
        isAnalyzing: false,
        isCompleted: true,
        resultId,
        startedAt: prev.rewrite.startedAt,
      },
    }))
  }

  const clearRewrite = () => {
    setState((prev) => ({
      ...prev,
      rewrite: {
        isAnalyzing: false,
        isCompleted: false,
        resultId: null,
        startedAt: null,
      },
    }))
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
        startJdAnalysis,
        completeJdAnalysis,
        clearJdAnalysis,
        startRewrite,
        completeRewrite,
        clearRewrite,
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
