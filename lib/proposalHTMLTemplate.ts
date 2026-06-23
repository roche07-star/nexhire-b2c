export function generateProposalHTML(proposal: any, resumeAnalysis: any, jdAnalysis: any): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '. ')

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
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${proposal.title || '후보자 추천 요약'}</h1>
      <div class="meta">
        <span>${proposal.company || jdAnalysis.company}</span>
        <span class="divider">|</span>
        <span>${proposal.position || jdAnalysis.position}</span>
        <span class="divider">|</span>
        <span>${proposal.date || date}</span>
      </div>
    </div>

    <div class="content">
      <!-- 추천 요약 -->
      <div class="section">
        <div class="section-title">01 후보자 추천 요약</div>
        <div class="summary">${proposal.summary || '추천 요약이 생성되지 않았습니다.'}</div>
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
            `<li class="strength-item">${s}</li>`
          ).join('')}
        </ul>
      </div>

      <!-- 적합성 분석 -->
      <div class="section">
        <div class="section-title">04 적합성 분석</div>
        <div class="fit-grid">
          <div class="fit-card">
            <div class="fit-title">기술적 적합성</div>
            <div class="fit-value">${proposal.fit_analysis?.technical_fit || `JD 적합도 ${jdAnalysis.fit_score}점`}</div>
          </div>
          <div class="fit-card">
            <div class="fit-title">문화적 적합성</div>
            <div class="fit-value">${proposal.fit_analysis?.cultural_fit || '면접 시 확인 필요'}</div>
          </div>
          <div class="fit-card">
            <div class="fit-title">성장 가능성</div>
            <div class="fit-value">${proposal.fit_analysis?.growth_potential || `${resumeAnalysis.scores?.growth_potential || 0}점`}</div>
          </div>
        </div>
      </div>

      <!-- 제안 다음 단계 -->
      <div class="section">
        <div class="section-title">05 제안 다음 단계</div>
        <div class="next-steps">
          ${proposal.next_steps || '면접 일정 조율 후 후보자 추천 진행을 제안드립니다.'}
        </div>
      </div>
    </div>

    <div class="footer">
      <div>본 추천서는 JOBIZIC AI 헤드헌터 시스템으로 생성되었습니다.</div>
      <div>생성일시: ${new Date().toLocaleString('ko-KR')}</div>
    </div>
  </div>
</body>
</html>`
}
