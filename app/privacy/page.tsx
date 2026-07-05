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
          <p className="privacy-date">시행일: 2026년 7월 1일</p>

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
            <p>회사는 법령에 따른 개인정보 보유/이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유/이용기간 내에서 개인정보를 처리/보유합니다.</p>
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

            <div className="privacy-subsection" style={{ marginTop: '20px', padding: '16px', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '8px' }}>
              <h3 style={{ color: '#1e40af', marginBottom: '12px' }}>💼 헤드헌터 추천 서비스 (선택적 동의)</h3>
              <p>회원가입 시 "헤드헌터 추천 서비스"에 동의하신 경우, 다음과 같이 개인정보가 제3자에게 제공됩니다:</p>

              <table className="privacy-table" style={{ marginTop: '12px' }}>
                <thead>
                  <tr>
                    <th>제공받는 자</th>
                    <th>제공 항목</th>
                    <th>제공 목적</th>
                    <th>보유·이용 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>협력 헤드헌터</td>
                    <td>이름, 이메일, 전화번호(선택), 이력서 분석 결과</td>
                    <td>채용 제안 및 커리어 상담</td>
                    <td>1년 또는 동의 철회 시까지</td>
                  </tr>
                </tbody>
              </table>

              <ul style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.8' }}>
                <li><strong>동의 거부권:</strong> 헤드헌터 추천 서비스는 선택사항이며, 동의하지 않아도 서비스 이용이 가능합니다.</li>
                <li><strong>동의 철회:</strong> 설정 &gt; 개인정보 및 공유에서 언제든지 동의를 철회할 수 있습니다.</li>
                <li><strong>철회 시 조치:</strong> 동의 철회 시 이미 제공된 개인정보는 즉시 삭제됩니다.</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>4-1. 헤드헌터 회원의 후보자 개인정보 처리</h2>

            <div className="privacy-subsection" style={{ marginTop: '20px', padding: '20px', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px' }}>
              <h3 style={{ color: '#991b1b', marginBottom: '16px', fontSize: '18px' }}>🛡️ 법적 책임 구조</h3>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#7f1d1d' }}>1. 법적 관계</h4>
                <table className="privacy-table" style={{ marginTop: '8px' }}>
                  <thead>
                    <tr>
                      <th>주체</th>
                      <th>법적 역할</th>
                      <th>책임 범위</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Jobizic (회사)</strong></td>
                      <td>개인정보 처리자 (Controller)</td>
                      <td>
                        • 후보자로부터 직접 동의 획득<br />
                        • 시스템 보안 및 기술 지원<br />
                        • 헤드헌터 관리 감독
                      </td>
                    </tr>
                    <tr>
                      <td><strong>헤드헌터 회원</strong></td>
                      <td>개인정보 수탁자 (Processor)</td>
                      <td>
                        • 제공받은 정보의 목적 내 사용<br />
                        • 보안 유지 의무<br />
                        • 재위탁 금지
                      </td>
                    </tr>
                    <tr>
                      <td><strong>후보자 (개인 구직자)</strong></td>
                      <td>정보주체</td>
                      <td>
                        • 동의권 및 동의 철회권<br />
                        • 열람/정정/삭제 요구권
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#7f1d1d' }}>2. 헤드헌터의 의무</h4>
                <ul style={{ lineHeight: '1.8', fontSize: '14px' }}>
                  <li><strong>목적 제한:</strong> 후보자 정보는 채용 중개 목적으로만 이용하며, 마케팅, 영업, 제3자 제공 등 목적 외 사용을 금지합니다.</li>
                  <li><strong>재위탁 금지:</strong> 제공받은 후보자 정보를 타인에게 재위탁하거나 계정을 공유할 수 없습니다.</li>
                  <li><strong>보안 유지:</strong> 개인정보보호법 등 관련 법령을 준수하고, 정보 유출을 방지하기 위한 적절한 조치를 취합니다.</li>
                  <li><strong>즉시 통보:</strong> 보안 사고 발생 시 즉시 회사에 통보합니다.</li>
                  <li><strong>동의 철회 협조:</strong> 후보자가 동의 철회 시 제공받은 정보를 즉시 파기합니다.</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#7f1d1d' }}>3. 회사의 관리 감독</h4>
                <ul style={{ lineHeight: '1.8', fontSize: '14px' }}>
                  <li><strong>접근 로그 기록:</strong> 헤드헌터의 후보자 정보 접근 내역을 기록하고 모니터링합니다.</li>
                  <li><strong>부적절한 사용 제재:</strong> 목적 외 사용 적발 시 서비스 이용을 즉시 정지하고 법적 조치를 취합니다.</li>
                  <li><strong>정기 점검:</strong> 연 1회 이상 보안 교육 및 감사를 실시합니다 (향후 계획).</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#7f1d1d' }}>4. 후보자의 권리</h4>
                <ul style={{ lineHeight: '1.8', fontSize: '14px' }}>
                  <li><strong>동의 철회:</strong> "내 정보" 설정에서 언제든지 헤드헌터 공유 동의를 철회할 수 있습니다.</li>
                  <li><strong>자동 삭제:</strong> 동의 철회 시 모든 헤드헌터에게 공유된 정보가 즉시 삭제됩니다.</li>
                  <li><strong>특정 차단:</strong> 특정 헤드헌터에 대한 정보 제공을 거부할 수 있습니다 (향후 기능 추가 예정).</li>
                </ul>
              </div>

              <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.8', color: '#7f1d1d' }}>
                  <strong>⚠️ 법적 책임:</strong> 헤드헌터가 후보자 정보를 유출하거나 목적 외로 사용할 경우,
                  개인정보보호법 제71조에 따라 <strong>5년 이하의 징역 또는 5천만원 이하의 벌금</strong>에 처해질 수 있으며,
                  민사상 손해배상 책임도 부담합니다.
                </p>
              </div>
            </div>
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
                  <td>JOBIZIC 이력서 분석<br /><span style={{ fontSize: '13px', color: '#666' }}>(성명/연락처/이메일은 자동 마스킹되어 전송되지 않음)</span></td>
                  <td className="highlight">즉시 삭제 (미저장 보장)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="privacy-section">
            <h2>6. 정보주체의 권리/의무 및 행사방법</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul>
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정/삭제 요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>
            <p className="privacy-contact">
              권리 행사는 <a href="/support" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>고객센터</a>를 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
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
              <li>개인정보를 저장하는 데이터베이스 시스템에 대한 접근권한의 부여/변경/말소</li>
              <li>개인정보의 암호화 (TLS/SSL 적용)</li>
              <li>접속기록의 보관 및 위/변조 방지</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>9. 개인정보 보호책임자</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및
              피해구제 등을 위하여 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <p className="privacy-contact">
              <strong>문의:</strong> <a href="/support" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>고객센터</a>
            </p>
            <p>
              정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한
              사항을 고객센터를 통해 문의하실 수 있습니다.
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
