import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import TermsWithdrawWrapper from './TermsWithdrawWrapper'

export const metadata = {
  title: '이용약관 — Jobizic',
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="privacy-page">
        <div className="privacy-container">
          <h1 className="privacy-title">이용약관</h1>
          <p className="privacy-date">시행일: 2026년 7월 1일</p>

          <div className="privacy-section">
            <h2>제1조 (목적)</h2>
            <p>이 약관은 Jobizic(이하 "회사")가 제공하는 AI 이력서 분석 및 커리어 방향 제시 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리/의무를 규정함을 목적으로 합니다.</p>
          </div>

          <div className="privacy-section">
            <h2>제2조 (서비스 내용)</h2>
            <p>회사는 다음의 서비스를 제공합니다.</p>

            <h3 style={{ marginTop: 16, fontSize: '16px', fontWeight: 600 }}>2.1 기본 서비스 (모든 회원)</h3>
            <ul>
              <li>이력서 파일(PDF, DOCX) 업로드 및 AI 기반 분석</li>
              <li>직무 적합도, 시장 경쟁력, 성장 가능성 점수 산출</li>
              <li>강점/개선점/추천 커리어 방향 제시</li>
            </ul>
            <p style={{ marginTop: 12 }}>분석 결과는 참고용 정보이며, 전문 커리어 상담을 대체하지 않습니다. 취업/이직 결과를 보장하지 않습니다.</p>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>2.2 헤드헌터 추천 서비스 (선택적 동의)</h3>
            <ul>
              <li>회원가입 시 동의한 회원에 한해, 이력서 분석 결과를 협력 헤드헌터에게 자동으로 공유합니다.</li>
              <li>헤드헌터는 회원의 경력과 역량을 검토하여 적합한 포지션을 제안합니다.</li>
              <li>회원은 설정에서 언제든지 동의를 철회할 수 있으며, 철회 시 공유된 정보는 즉시 삭제됩니다.</li>
              <li>헤드헌터 추천 서비스는 선택사항이며, 동의하지 않아도 기본 서비스 이용에 제한이 없습니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제3조 (베타 서비스 안내)</h2>
            <p>현재 서비스는 오픈 베타 단계로 운영됩니다. 베타 기간 중에는 기능, 정책, UI 등이 사전 공지 없이 변경될 수 있으며, 일부 기능이 불안정하게 동작할 수 있습니다. 이로 인한 불편에 대해 회사는 최선을 다해 개선하겠습니다.</p>
          </div>

          <div className="privacy-section">
            <h2>제4조 (이용자 의무)</h2>
            <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ul>
              <li>타인의 이력서를 본인 동의 없이 업로드하는 행위</li>
              <li>허위/조작된 정보가 담긴 이력서를 업로드하는 행위</li>
              <li>서비스를 자동화된 방법(크롤링, 봇 등)으로 접근하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>회사의 지식재산권을 침해하는 행위</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제4조의2 (헤드헌터 회원의 추가 의무)</h2>
            <p>헤드헌터 회원은 다음의 의무를 준수해야 합니다.</p>

            <h3 style={{ marginTop: 16, fontSize: '16px', fontWeight: 600 }}>4.2.1 개인정보 보호</h3>
            <ul>
              <li>후보자 관리 시 이름을 제외한 개인정보(이메일, 전화번호 등)는 저장하지 않습니다.</li>
              <li>이름은 파일명에서 자동 추출되며, 후보자 식별 목적으로만 사용됩니다.</li>
              <li>저장된 후보자 정보는 등록 후 1년이 경과하면 자동으로 삭제됩니다.</li>
              <li>후보자가 정보 삭제를 요청할 경우 즉시 삭제해야 합니다.</li>
            </ul>

            <h3 style={{ marginTop: 16, fontSize: '16px', fontWeight: 600 }}>4.2.2 채용 프로세스 관리</h3>
            <ul>
              <li>후보자의 이력서는 채용 목적으로만 사용해야 하며, 다른 목적으로 사용해서는 안 됩니다.</li>
              <li>후보자에게 연락 시 반드시 채용 제안 목적임을 명시해야 합니다.</li>
              <li>후보자가 연락을 원하지 않을 경우 즉시 중단해야 합니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제5조 (지식재산권)</h2>
            <ul>
              <li>이용자가 업로드한 이력서의 저작권은 이용자에게 있습니다.</li>
              <li>서비스가 생성한 분석 결과는 이용자의 개인적 용도에 한해 사용할 수 있습니다.</li>
              <li>서비스의 로고, UI, 소프트웨어, 분석 알고리즘 등의 지식재산권은 회사에 귀속됩니다.</li>
              <li>이용자는 회사의 사전 동의 없이 서비스의 전부 또는 일부를 상업적으로 이용할 수 없습니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제6조 (면책 조항)</h2>
            <ul>
              <li>AI 분석 결과는 통계적 모델에 기반한 참고 정보이며, 정확성/완전성을 보증하지 않습니다.</li>
              <li>분석 결과를 기반으로 한 이용자의 결정(이직, 진로 변경 등)에 대해 회사는 법적 책임을 지지 않습니다.</li>
              <li>천재지변, 서비스 장애, 제3자 사정 등 불가항력으로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
              <li>이용자가 제공한 이력서 정보의 진위 여부에 대해 회사는 책임을 지지 않습니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제7조 (서비스 변경 및 중단)</h2>
            <p>회사는 운영상/기술상 필요에 따라 서비스를 변경하거나 중단할 수 있습니다. 중단 시에는 가능한 한 사전에 공지하며, 베타 기간 중에는 예고 없이 변경될 수 있습니다.</p>
          </div>

          <div className="privacy-section">
            <h2>제8조 (약관 변경)</h2>
            <p>회사는 약관을 변경할 경우 시행일 7일 전 서비스 내 공지합니다. 변경 후 계속 서비스를 이용하면 변경 약관에 동의한 것으로 간주합니다.</p>
          </div>

          <div className="privacy-section">
            <h2>제9조 (준거법 및 분쟁 해결)</h2>
            <p>이 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁은 서울중앙지방법원을 제1심 관할 법원으로 합니다.</p>
          </div>

          <div className="privacy-section">
            <h2>문의</h2>
            <p>약관 관련 문의는 아래 이메일로 연락해 주세요.</p>
            <p><strong>privacy@jobizic.io</strong></p>
          </div>

          <TermsWithdrawWrapper />
        </div>
      </main>
      <Footer />
    </>
  )
}
