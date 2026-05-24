import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: '개인정보처리방침 — Nexhire',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="privacy-page">
        <div className="privacy-container">
          <h1 className="privacy-title">개인정보처리방침</h1>
          <p className="privacy-date">시행일: 2026년 5월 24일</p>

          <section className="privacy-section">
            <h2>1. 수집하는 개인정보 항목</h2>
            <p>Nexhire(이하 "회사")는 AI 커리어 분석 서비스 제공을 위해 아래 정보를 수집합니다.</p>
            <ul>
              <li>이력서 파일 내 경력, 학력, 보유 기술, 자기소개 등 직무 관련 정보</li>
              <li>성명, 연락처, 이메일 등 식별 정보 (분석 전 자동 마스킹 처리)</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>2. 개인정보 수집 목적</h2>
            <ul>
              <li>AI 기반 이력서 분석 및 커리어 방향 제시</li>
              <li>서비스 품질 개선</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. 개인정보 보유 및 이용 기간</h2>
            <p>업로드된 이력서 파일 및 추출된 텍스트는 분석 완료 즉시 삭제됩니다. 별도로 저장되는 개인정보는 없습니다.</p>
          </section>

          <section className="privacy-section">
            <h2>4. 개인정보 처리 위탁</h2>
            <p>회사는 AI 분석 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>수탁업체</th>
                  <th>위탁 목적</th>
                  <th>위탁 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Anthropic, Inc. (미국)</td>
                  <td>AI 언어모델을 통한 이력서 분석</td>
                  <td>마스킹 처리된 이력서 내용 (경력, 학력, 기술 등)</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 12 }}>성명, 연락처, 이메일 등 식별 정보는 위탁 전 자동으로 마스킹 처리되어 수탁업체에 전달되지 않습니다.</p>
          </section>

          <section className="privacy-section">
            <h2>5. 국외 이전</h2>
            <p>이력서 분석을 위해 마스킹 처리된 직무 정보가 미국(Anthropic, Inc.)으로 이전될 수 있습니다. 식별 가능한 개인정보는 국외로 이전되지 않습니다.</p>
          </section>

          <section className="privacy-section">
            <h2>6. 정보주체의 권리</h2>
            <p>이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
            <ul>
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정·삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
            </ul>
            <p>권리 행사는 아래 이메일로 요청하시면 10일 이내에 처리합니다.</p>
            <p><strong>privacy@nexhire.co</strong></p>
          </section>

          <section className="privacy-section">
            <h2>7. 안전성 확보 조치</h2>
            <ul>
              <li>이력서 파일은 전송 중 TLS 암호화 적용</li>
              <li>분석 완료 후 서버 내 데이터 즉시 삭제</li>
              <li>식별 정보 자동 마스킹으로 외부 AI 전송 차단</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>8. 개인정보 보호책임자</h2>
            <p>개인정보 관련 문의, 불만 처리, 피해 구제 등은 아래로 연락하시기 바랍니다.</p>
            <ul>
              <li>이메일: <strong>privacy@nexhire.co</strong></li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>9. 방침 변경</h2>
            <p>이 개인정보처리방침은 법령 또는 서비스 변경에 따라 개정될 수 있으며, 변경 시 시행일 7일 전 공지합니다.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
