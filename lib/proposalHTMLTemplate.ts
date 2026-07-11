export function generateProposalHTML(proposal: any, resumeAnalysis: any, jdAnalysis: any): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '. ')

  // "·" 문자를 ","로 변환하는 헬퍼 함수
  const replaceDot = (text: string | undefined | null): string => {
    if (!text) return ''
    return String(text).replace(/·/g, ', ')
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>후보자 추천서 - ${proposal.candidate_info?.name || '미상'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; padding: 40px 20px; }
    .container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; color: #fff; text-align: center; border-bottom: 4px solid #6d28d9; }
    .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 16px; }
    .header .meta { font-size: 16px; opacity: 0.95; }
    .header .meta .divider { margin: 0 12px; opacity: 0.5; }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 20px; font-weight: 700; color: #7c3aed; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e9d5ff; }
    .summary { background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%); border: 2px solid #e9d5ff; border-radius: 12px; padding: 24px; line-height: 1.8; color: #333; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .info-item { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .info-label { font-size: 12px; color: #666; margin-bottom: 6px; font-weight: 600; }
    .info-value { font-size: 16px; color: #1a1a1a; font-weight: 600; }
    .strength-list { list-style: none; }
    .strength-item { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0; }
    .strength-item::before { content: '✓'; color: #22c55e; font-weight: 700; margin-right: 8px; }
    .fit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
    .fit-card { background: #fafafa; border: 2px solid #e9d5ff; border-radius: 12px; padding: 20px; text-align: center; }
    .fit-title { font-size: 14px; color: #7c3aed; font-weight: 700; margin-bottom: 8px; }
    .fit-value { font-size: 16px; color: #333; line-height: 1.6; }
    .recommendation { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; }
    .recommendation-label { font-size: 14px; color: #92400e; margin-bottom: 8px; }
    .recommendation-value { font-size: 28px; font-weight: 700; color: #92400e; }
    .next-steps { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; color: #1e40af; }
    .footer { background: #fafafa; padding: 24px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; }

    /* 수정 가능한 필드 스타일 */
    .editable {
      cursor: text;
      transition: all 0.2s ease;
      border-radius: 4px;
      padding: 4px 8px;
      margin: -4px -8px;
    }
    .editable:hover {
      background: #fef3c7;
      box-shadow: 0 0 0 2px #fbbf24;
    }
    .editable:focus {
      outline: none;
      background: #fef3c7;
      box-shadow: 0 0 0 3px #f59e0b;
    }
    .editable:empty:before {
      content: attr(data-placeholder);
      color: #999;
      font-style: italic;
    }

    /* 수정 안내 메시지 */
    .edit-hint {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      text-align: center;
      color: #1e40af;
      font-size: 13px;
      font-weight: 600;
    }
    .edit-hint::before {
      content: '✏️ ';
    }

    @media print {
      body { padding: 0; background: #fff; }
      .container { box-shadow: none; }
      .edit-hint { display: none; }
      .editable { box-shadow: none !important; background: transparent !important; }
      .save-btn { display: none; }
    }

    /* 저장 버튼 스타일 */
    .save-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: all 0.2s ease;
      z-index: 1000;
    }
    .save-btn:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
      transform: translateY(-2px);
    }
    .save-btn:active {
      transform: translateY(0);
    }
  </style>

  <script>
    // 수정본 저장 기능
    function saveModifiedProposal() {
      try {
        // 저장 버튼 임시 숨김
        const saveBtn = document.querySelector('.save-btn')
        const originalDisplay = saveBtn ? saveBtn.style.display : ''
        if (saveBtn) saveBtn.style.display = 'none'

        // 현재 HTML 전체 가져오기
        const htmlContent = document.documentElement.outerHTML

        // 저장 버튼 다시 표시
        if (saveBtn) saveBtn.style.display = originalDisplay

        // Blob 생성
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })

        // 다운로드 링크 생성
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        // 파일명 생성 (날짜 + 시간)
        const now = new Date()
        const dateStr = now.toISOString().slice(0, 10)
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '')
        const candidateName = document.querySelector('.info-value')?.textContent?.trim() || '미상'

        a.download = \`후보자제안서_수정본_\${candidateName}_\${dateStr}_\${timeStr}.html\`

        // 다운로드 실행
        a.click()

        // 메모리 정리
        URL.revokeObjectURL(url)

        // 성공 메시지
        alert('✅ 수정본이 저장되었습니다!')
      } catch (error) {
        console.error('저장 실패:', error)
        alert('❌ 저장에 실패했습니다. Ctrl+S를 사용해주세요.')
      }
    }
  </script>
</head>
<body>
  <!-- 수정본 저장 버튼 -->
  <button class="save-btn" onclick="saveModifiedProposal()">💾 수정본 저장</button>

  <div class="container">
    <div class="header">
      <h1>${proposal.title || '후보자 추천 요약'}</h1>
      <div class="meta">
        <span>${proposal.company || jdAnalysis.company}</span>
        <span class="divider">/</span>
        <span>${proposal.position || jdAnalysis.position}</span>
        <span class="divider">/</span>
        <span>${proposal.date || date}</span>
      </div>
    </div>

    <div class="content">
      <!-- 추천 요약 -->
      <div class="section">
        <div class="section-title">01 후보자 추천 요약</div>
        <div class="summary editable" contenteditable="true" data-placeholder="추천 요약을 입력하세요">${replaceDot(proposal.summary) || '추천 요약이 생성되지 않았습니다.'}</div>
      </div>

      <!-- 후보자 정보 -->
      <div class="section">
        <div class="section-title">02 후보자 기본 정보</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">추천 포지션</div>
            <div class="info-value">${proposal.candidate_info?.current_position || resumeAnalysis.job_title || '미상'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">성명</div>
            <div class="info-value">${proposal.candidate_info?.name || resumeAnalysis.candidate_name || '○○○'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">경력</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="경력을 입력하세요">${proposal.candidate_info?.experience || '미상'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">최종 학력</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="학력을 입력하세요">${proposal.candidate_info?.education || '미상'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">현재 연봉</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="연봉을 입력하세요">${proposal.candidate_info?.current_salary || '협의 필요'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">출근 가능</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="입사 가능일을 입력하세요">${proposal.candidate_info?.availability || '협의 후 결정'}</div>
          </div>
        </div>
      </div>

      <!-- 핵심 강점 -->
      <div class="section">
        <div class="section-title">03 핵심 강점</div>
        <ul class="strength-list">
          ${(proposal.strengths || resumeAnalysis.strengths || []).map((s: string) =>
            `<li class="strength-item editable" contenteditable="true" data-placeholder="강점을 입력하세요">${replaceDot(s)}</li>`
          ).join('')}
        </ul>
      </div>

      <!-- 적합성 분석 -->
      <div class="section">
        <div class="section-title">04 적합성 분석</div>
        <div class="fit-grid">
          <div class="fit-card">
            <div class="fit-title">기술적 적합성</div>
            <div class="fit-value editable" contenteditable="true" data-placeholder="기술적 적합성을 입력하세요">${replaceDot(proposal.fit_analysis?.technical_fit) || '기술적 요구사항을 충족합니다.'}</div>
          </div>
          <div class="fit-card">
            <div class="fit-title">문화적 적합성</div>
            <div class="fit-value editable" contenteditable="true" data-placeholder="문화적 적합성을 입력하세요">${replaceDot(proposal.fit_analysis?.cultural_fit) || '조직 문화에 잘 적응할 것으로 예상됩니다.'}</div>
          </div>
          <div class="fit-card">
            <div class="fit-title">성장 가능성</div>
            <div class="fit-value editable" contenteditable="true" data-placeholder="성장 가능성을 입력하세요">${replaceDot(proposal.fit_analysis?.growth_potential) || '장기적인 발전 가능성이 높습니다.'}</div>
          </div>
        </div>
      </div>

      <!-- 추천인 정보 -->
      <div class="section">
        <div class="section-title">05 추천인 정보</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">써치펌 (회사명)</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="써치펌 회사명을 입력하세요">${proposal.referrer_info?.company || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">담당자 성명</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="담당자 성명을 입력하세요">${proposal.referrer_info?.name || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">연락처</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="전화번호를 입력하세요">${proposal.referrer_info?.phone || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">이메일</div>
            <div class="info-value editable" contenteditable="true" data-placeholder="이메일을 입력하세요">${proposal.referrer_info?.email || ''}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>© 2026 Jobizic. All rights reserved.</div>
      <div>생성일시: ${new Date().toLocaleString('ko-KR')}</div>
    </div>
  </div>
</body>
</html>`
}
