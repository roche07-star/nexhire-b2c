import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: '개인정보처리방침 — Jobizic',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="privacy-page">
        <div className="privacy-container">
          <h1 className="privacy-title">개인정보처리방침</h1>
          <p className="privacy-date">시행일: 2026년 6월 13일</p>

          <div className="privacy-intro">
            <p>
              Jobizic(이하 "회사")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여,
              적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.
            </p>
          </div>

          <div className="privacy-section">
            <h2>1. 개인정보의 처리 목적</h2>
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            <ul>
              <li>회원 가입 및 관리</li>
              <li>AI 이력서 분석 서비스 제공</li>
              <li>JD(직무기술서) 적합도 분석 서비스 제공</li>
              <li>이력서 생성 및 다운로드 서비스 제공</li>
              <li>유료 서비스 이용에 따른 요금 결제 및 정산</li>
              <li>고객 문의 대응 및 서비스 개선</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>2. 개인정보의 처리 및 보유 기간</h2>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <ul>
              <li><strong>회원 정보:</strong> 회원 탈퇴 시까지</li>
              <li><strong>이력서 정보:</strong> 회원 탈퇴 시까지</li>
              <li><strong>결제 정보:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li><strong>접속 로그 기록:</strong> 3개월 (통신비밀보호법)</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>3. 처리하는 개인정보의 항목</h2>
            <div className="privacy-subsection">
              <h3>[필수 항목]</h3>
              <ul>
                <li>이메일 주소</li>
                <li>이름 (이력서 내)</li>
                <li>학력, 경력, 기술스택, 자격증 (이력서 내)</li>
              </ul>
            </div>
            <div className="privacy-subsection">
              <h3>[선택 항목]</h3>
              <ul>
                <li>전화번호 (이력서 내)</li>
                <li>주소 (이력서 내)</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>4. 개인정보의 제3자 제공</h2>
            <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우는 예외로 합니다.</p>
            <ul>
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>5. 개인정보 처리의 위탁</h2>
            <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>수탁업체</th>
                  <th>위탁 업무</th>
                  <th>보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supabase Inc.</td>
                  <td>데이터베이스 및 스토리지 관리</td>
                  <td>회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                </tr>
                <tr>
                  <td>Anthropic PBC</td>
                  <td>AI 이력서 분석</td>
                  <td className="highlight">즉시 삭제 (미저장 보장)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="privacy-section">
            <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul>
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정·삭제 요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>
            <p className="privacy-contact">
              권리 행사는 이메일(<strong>roche07he@gmail.com</strong>)을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </div>

          <div className="privacy-section">
            <h2>7. 개인정보의 파기</h2>
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
            <ul>
              <li><strong>파기절차:</strong> 이용목적이 달성된 개인정보는 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 영구 삭제합니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>8. 개인정보의 안전성 확보 조치</h2>
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보에 대한 접근 제한</li>
              <li>개인정보를 저장하는 데이터베이스 시스템에 대한 접근권한의 부여·변경·말소</li>
              <li>개인정보의 암호화 (TLS/SSL 적용)</li>
              <li>접속기록의 보관 및 위·변조 방지</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>9. 개인정보 보호책임자</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및
              피해구제 등을 위하여 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <p className="privacy-contact">
              <strong>이메일:</strong> roche07he@gmail.com
            </p>
            <p>
              정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한
              사항을 개인정보 보호책임자에게 문의하실 수 있습니다.
            </p>
          </div>

          <div className="privacy-section">
            <h2>10. 개인정보처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </div>

          <div className="privacy-footer">
            <p><strong>본 방침은 2026년 6월 13일부터 시행됩니다.</strong></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
