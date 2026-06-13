'use client'

import { useState } from 'react'
import type { UserType } from '@/types/user'

/**
 * 사용자 유형 선택 모달
 *
 * 첫 로그인 시 표시되는 필수 선택 팝업
 * - 개인 구직자 vs 헤드헌터 선택
 * - 닫기 버튼 없음 (선택 강제)
 * - 선택 후 영구 고정 (변경 불가)
 *
 * 작성자: 디아 (MIR Team)
 * 작성일: 2026-06-13
 */

interface Props {
  onSelect: (userType: UserType) => Promise<void>
}

export default function UserTypeSelectionModal({ onSelect }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<UserType | null>(null)

  async function handleConfirm() {
    if (!selectedType) return
    setLoading(true)
    try {
      await onSelect(selectedType)
    } catch (err) {
      console.error('User type selection error:', err)
      alert('설정 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop - 클릭해도 닫히지 않음 */}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
          {/* 닫기 버튼 없음 (선택 강제) */}

          {/* 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              환영합니다! 👋
            </h2>
            <p className="text-lg text-gray-600">
              Adam을 어떻게 사용하실 계획인가요?
            </p>
            <p className="text-sm text-orange-600 mt-2 font-medium">
              ⚠️ 선택 후 변경할 수 없으니 신중히 선택해주세요
            </p>
          </div>

          {/* 선택 카드 */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* 개인 구직자 */}
            <button
              onClick={() => setSelectedType('INDIVIDUAL')}
              disabled={loading}
              className={`
                p-6 rounded-xl border-2 transition-all text-left
                hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedType === 'INDIVIDUAL'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300'
                }
              `}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    개인 구직자
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    내 이력서 분석 & 취업 준비
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>내 이력서 강점/약점 분석</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>채용공고 적합도 자동 매칭</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>면접 준비 & 자소서 가이드</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>추천 커리어 경로 제시</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <strong>PRO 플랜:</strong> 월 9,900원 (30회)
                </p>
              </div>
            </button>

            {/* 헤드헌터 */}
            <button
              onClick={() => setSelectedType('HEADHUNTER')}
              disabled={loading}
              className={`
                p-6 rounded-xl border-2 transition-all text-left
                hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedType === 'HEADHUNTER'
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300'
                }
              `}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">💼</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    헤드헌터
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    후보자 분석 & 클라이언트 제안
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>후보자 이력서 대량 분석</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>JD 매칭 & 클라이언트 리포트</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>분석 결과 공유 & 프레젠테이션</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Eve (B2B 플랫폼) 연동</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <strong>PRO 플랜:</strong> 월 19,900원 (100회)
                </p>
              </div>
            </button>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={handleConfirm}
            disabled={!selectedType || loading}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${selectedType === 'INDIVIDUAL'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : selectedType === 'HEADHUNTER'
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading
              ? '설정 중...'
              : selectedType
              ? `${selectedType === 'INDIVIDUAL' ? '개인 구직자' : '헤드헌터'}로 시작하기 →`
              : '위에서 선택해주세요'
            }
          </button>

          {/* 안내 문구 */}
          <p className="text-xs text-gray-400 text-center mt-4">
            선택한 유형에 따라 맞춤형 기능과 UI가 제공됩니다.
          </p>
        </div>
      </div>
    </>
  )
}
