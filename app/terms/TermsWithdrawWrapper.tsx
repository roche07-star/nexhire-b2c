'use client'

import dynamic from 'next/dynamic'

const WithdrawSection = dynamic(() => import('./WithdrawSection'), { ssr: false })

export default function TermsWithdrawWrapper() {
  return <WithdrawSection />
}
