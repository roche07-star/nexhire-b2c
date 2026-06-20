'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { UserType } from '@/types/user'

interface Props {
  onSelect: (userType: UserType) => Promise<void>
}

export default function UserTypeSelectionModal({ onSelect }: Props) {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  async function handleSelect(userType: UserType) {
    setLoading(true)
    try {
      await onSelect(userType)
    } catch (err) {
      console.error('User type selection error:', err)
      alert('설정 중 오류가 발생했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-10 relative animate-fadeIn">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-400 to-lime-400 rounded-full mb-4">
            <span className="text-xl font-black">JOBIZIC</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            환영합니다! 👋
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            JOBIZIC을 어떻게 사용하실 계획인가요?
          </p>
          <p className="text-sm text-orange-600 font-semibold">
            ⚠️ 선택 후 변경할 수 없으니 신중히 선택해주세요
          </p>
        </div>

        {/* 선택 카드 - 클릭 즉시 처리 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 개인 구직자 */}
          <button
            onClick={() => handleSelect('INDIVIDUAL')}
            disabled={loading}
            className="group relative p-8 rounded-2xl border-3 border-blue-500
                     hover:border-blue-600 bg-gradient-to-br from-blue-50 to-white
                     hover:shadow-2xl transition-all duration-300 text-left
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-105"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl">🎯</span>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">
                  개인 구직자
                </h3>
                <p className="text-sm text-blue-600 font-semibold">
                  내 이력서 분석 & 취업 준비
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-gray-700 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>내 이력서 강점/약점 분석</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>채용공고 적합도 자동 매칭</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>면접 준비 & 자소서 가이드</span>
              </li>
            </ul>

            <div className="pt-4 border-t-2 border-blue-200">
              <p className="text-sm font-bold text-blue-600">
                PRO 플랜: 월 9,900원 (30회)
              </p>
            </div>

            <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              인기
            </div>
          </button>

          {/* 헤드헌터 */}
          <button
            onClick={() => handleSelect('HEADHUNTER')}
            disabled={loading}
            className="group relative p-8 rounded-2xl border-3 border-purple-500
                     hover:border-purple-600 bg-gradient-to-br from-purple-50 to-white
                     hover:shadow-2xl transition-all duration-300 text-left
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-105"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl">💼</span>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">
                  헤드헌터
                </h3>
                <p className="text-sm text-purple-600 font-semibold">
                  후보자 분석 & 클라이언트 제안
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-gray-700 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>후보자 이력서 대량 분석</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>JD 매칭 & 클라이언트 리포트</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>Eve (B2B 플랫폼) 연동</span>
              </li>
            </ul>

            <div className="pt-4 border-t-2 border-purple-200">
              <p className="text-sm font-bold text-purple-600">
                PRO 플랜: 월 19,900원 (100회)
              </p>
            </div>

            <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              PRO
            </div>
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/90 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xl font-bold text-gray-700">설정 중...</p>
            </div>
          </div>
        )}

        {/* 안내 문구 */}
        <p className="text-sm text-gray-500 text-center mt-8">
          💡 선택한 유형에 따라 맞춤형 기능과 UI가 제공됩니다
        </p>
      </div>
    </div>,
    document.body
  )
}
