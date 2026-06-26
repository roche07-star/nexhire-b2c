import Link from 'next/link'
import type { UserType } from '@/types/user'

export default function Cta({ userType }: { userType?: UserType | null }) {
  const content = {
    JOBSEEKER: {
      headline: <>지금 이력서를<br />업로드하세요</>,
      sub: <>3분이면 커리어 방향과 JD 전략이 명확해집니다.<br />첫 분석은 완전 무료입니다.</>,
      btnText: '무료 분석 시작하기 →',
    },
    HEADHUNTER: {
      headline: <>후보자 이력서로<br />제안서를 만드세요</>,
      sub: <>2분이면 후보자 분석부터 클라이언트 제안 전략까지 완성됩니다.<br />첫 분석은 완전 무료입니다.</>,
      btnText: '무료 분석 시작하기 →',
    },
    DEFAULT: {
      headline: <>지금 이력서를<br />업로드하세요</>,
      sub: <>3분이면 커리어 방향과 JD 전략이 명확해집니다.<br />첫 분석은 완전 무료입니다.</>,
      btnText: '무료 분석 시작하기 →',
    },
  }

  const selected = userType ? content[userType] : content.DEFAULT

  return (
    <div className="cta-section">
      <div className="cta-inner reveal">
        <h2>{selected.headline}</h2>
        <p>{selected.sub}</p>
        <Link href="/analyze">
          <button className="btn-hero">{selected.btnText}</button>
        </Link>
      </div>
    </div>
  )
}
