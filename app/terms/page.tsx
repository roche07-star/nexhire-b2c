import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import TermsWithdrawWrapper from './TermsWithdrawWrapper'

export const metadata = {
  title: '이용약관 — Jobizic',
}

// ISR: 1시간마다 재생성
export const revalidate = 3600

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="privacy-page">
        <div className="privacy-container">
          <h1 className="privacy-title">이용약관</h1>
          <p className="privacy-date">시행일: 2026년 7월 7일</p>

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
            <h2>제7조의2 (회원 탈퇴 및 데이터 보존)</h2>

            <h3 style={{ marginTop: 16, fontSize: '16px', fontWeight: 600 }}>7.2.1 탈퇴 처리</h3>
            <ul>
              <li>유료 플랜 이용자가 탈퇴 신청 시, 플랜 종료일까지 정상적으로 서비스를 이용할 수 있습니다.</li>
              <li>FREE 플랜 이용자의 탈퇴는 즉시 처리됩니다.</li>
              <li>탈퇴 시 회사는 이용자에게 플랜 종료일 및 데이터 보존 기간을 안내합니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.2.2 데이터 보존</h3>
            <ul>
              <li>탈퇴 후 개인정보 및 서비스 이용 기록은 6개월간 보존됩니다.</li>
              <li>보존 기간 내 재가입 시 기존 데이터를 복원할 수 있습니다.</li>
              <li>보존 기간 경과 후 모든 데이터는 영구 삭제되며 복구할 수 없습니다.</li>
              <li>데이터 보존 목적: 재가입 시 서비스 연속성 제공</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.2.3 재가입 및 데이터 복원</h3>
            <ul>
              <li>재가입 시 FREE 플랜으로 시작합니다.</li>
              <li>이용자는 "내 정보" 메뉴에서 기존 데이터 복원을 선택할 수 있습니다.</li>
              <li>복원 시 이전 분석 결과, 저장된 이력서, 미사용 쿠폰, 사용 횟수가 복원됩니다.</li>
              <li>복원 후에는 되돌릴 수 없으며, 복원하지 않을 경우 새로운 데이터만 보존됩니다.</li>
              <li>복원된 사용 횟수는 다음 월간 리셋일에 초기화됩니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.2.4 재탈퇴 시 데이터 처리</h3>
            <ul>
              <li>재가입 후 데이터를 복원한 경우: 복원된 데이터와 신규 데이터 모두 보존됩니다.</li>
              <li>재가입 후 데이터를 복원하지 않은 경우: 최신 데이터만 보존되며, 이전 보존 데이터는 삭제됩니다.</li>
              <li>이는 이용자의 최종 활동 기록을 우선적으로 보존하기 위함입니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.2.5 플랜 다운그레이드</h3>
            <ul>
              <li>유료 플랜 이용자가 하위 플랜으로 변경 시, 플랜 종료일까지 기존 플랜을 이용할 수 있습니다.</li>
              <li>플랜 종료일 이후 자동으로 새 플랜으로 변경됩니다.</li>
              <li>FREE 플랜으로 다운그레이드 시 사용량은 FREE 플랜 한도(월 3회)로 설정됩니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.2.6 플랜 만료 및 재가입</h3>
            <ul>
              <li><strong>플랜 만료 시 미사용 횟수는 소멸되며, 환불되지 않습니다.</strong></li>
              <li>예: PRO 플랜 (월 20회) 중 10회만 사용하고 만료된 경우, 남은 10회는 자동 소멸됩니다.</li>
              <li>플랜 재가입 시 사용 횟수는 0부터 새롭게 시작되며, 해당 플랜의 기본 횟수가 제공됩니다.</li>
              <li>플랜 갱신 시 이전 미사용 횟수는 이월되지 않으며, 갱신된 주기의 기본 횟수가 새롭게 제공됩니다.</li>
              <li>보너스 횟수는 프로모션 또는 특별 이벤트 시 추가 제공되는 무료 횟수이며, 동일하게 만료 시 소멸됩니다.</li>
              <li>보너스 횟수는 일반 재가입 시 자동으로 제공되지 않으며, 프로모션 기간에만 별도 제공됩니다.</li>
              <li>플랜 기간 내 제공된 모든 횟수를 최대한 활용하시기를 권장드립니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제7조의3 (환불 및 청약철회)</h2>

            <h3 style={{ marginTop: 16, fontSize: '16px', fontWeight: 600 }}>7.3.1 환불 가능 조건</h3>
            <p>다음 조건을 <strong>모두 충족</strong>하는 경우 전액 환불이 가능합니다.</p>
            <ul>
              <li>구매 후 7일 이내</li>
              <li>서비스 사용 5회 미만 (이력서 분석, JD 분석, 면접 가이드, 이력서 생성 합산)</li>
              <li>환불 신청서 제출 (고객센터 또는 내 정보 메뉴)</li>
            </ul>
            <p style={{ marginTop: 12, fontSize: '14px', color: 'var(--muted)' }}>
              환불 처리는 영업일 기준 3-5일 소요되며, 결제 수단으로 환불됩니다.
            </p>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.3.2 환불 불가 조건</h3>
            <p>다음 경우에는 환불이 불가능합니다.</p>
            <ul>
              <li>서비스 사용 5회 이상 (부분 환불 불가)</li>
              <li>구매 후 7일 경과</li>
              <li>3개월권의 경우 1개월 이용 후 환불 불가 (남은 기간 부분 환불 불가)</li>
              <li>쿠폰 또는 할인 이벤트로 구매한 경우 (약관 별도 명시)</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.3.3 부정 환불 방지</h3>
            <ul>
              <li>카드사 Chargeback(결제 취소)을 통한 부정 환불 시도 시, 사용 내역이 확인될 경우 법적 조치를 취할 수 있습니다.</li>
              <li>부정 환불 이력이 있는 사용자는 재가입이 영구적으로 제한됩니다.</li>
              <li>정당한 환불 사유가 있는 경우 반드시 고객센터를 통해 정상 절차로 신청해주시기 바랍니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.3.4 플랜 변경 시 환불</h3>
            <ul>
              <li>유료 플랜 구매 후 상위 플랜으로 변경 시: 차액만 결제 (환불 없음)</li>
              <li>유료 플랜 구매 후 하위 플랜으로 변경 시: 환불 불가, 현재 플랜 종료일까지 이용 후 변경</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.3.5 쿠폰 환불</h3>
            <ul>
              <li>쿠폰으로 획득한 무료 크레딧은 환불 대상이 아닙니다.</li>
              <li>쿠폰 유효기간 만료 시 자동 소멸되며, 연장 또는 환급되지 않습니다.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>제7조의4 (쿠폰 사용 정책)</h2>

            <h3 style={{ marginTop: 16, fontSize: '16px', fontWeight: 600 }}>7.4.1 사용 순서</h3>
            <ul>
              <li><strong>서비스 이용 시 플랜 횟수를 먼저 사용하며, 쿠폰은 플랜 횟수 소진 후 자동으로 사용됩니다.</strong></li>
              <li>예: PRO 플랜 (20회) + 쿠폰 (5회) 보유 시 → 플랜 20회를 먼저 사용 → 이후 쿠폰 5회 사용</li>
              <li>쿠폰 우선 사용을 원하시는 경우, 쿠폰 만료 전 플랜 횟수를 먼저 소진하시기를 권장합니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.4.2 쿠폰 유효기간</h3>
            <ul>
              <li>쿠폰 유효기간은 구매 시점으로부터 3개월입니다.</li>
              <li>유효기간 만료 시 미사용 쿠폰은 자동 소멸되며, 환불되지 않습니다.</li>
              <li>플랜 횟수가 남은 상태에서 쿠폰이 만료될 수 있으므로, 유효기간을 확인하시기 바랍니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.4.3 쿠폰 확인</h3>
            <ul>
              <li>보유 중인 쿠폰은 '내 정보' 메뉴에서 확인할 수 있습니다.</li>
              <li>쿠폰 잔여 횟수 및 유효기간이 표시됩니다.</li>
            </ul>

            <h3 style={{ marginTop: 20, fontSize: '16px', fontWeight: 600 }}>7.4.4 플랜 변경 시 쿠폰 유지</h3>
            <ul>
              <li><strong>플랜 다운그레이드 또는 만료 시에도 보유 중인 쿠폰은 유효기간 내에 계속 사용할 수 있습니다.</strong></li>
              <li>예: PRO 플랜에서 쿠폰 5개 구매 후 FREE 플랜으로 변경 → 쿠폰 5개는 유효기간 내 사용 가능</li>
              <li>FREE 플랜 한도(3회) 소진 후에도 쿠폰을 사용하여 서비스를 이용할 수 있습니다.</li>
              <li>쿠폰은 탈퇴 후 30일 경과 시 데이터 완전 삭제와 함께 소멸됩니다.</li>
            </ul>
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
            <p>약관 관련 문의는 <a href="/support" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>고객센터</a>로 연락해 주세요.</p>
          </div>

          <TermsWithdrawWrapper />
        </div>
      </main>
      <Footer />
    </>
  )
}
