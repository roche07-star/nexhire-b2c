/**
 * 면접 가이드 HTML 템플릿 생성
 * 프로페셔널 다크 모드 디자인
 */

interface InterviewGuideResult {
  candidate_name?: string | null
  company?: string | null
  position?: string | null
  job_title?: string | null
  matching_scores?: Array<{ category: string; score: number; grade: string }>
  positioning_message: string
  self_intro: string
  qa_resign_reason: string
  qa_domain_gap: string
  qa_competency: string
  qa_project_experience: string
  qa_post_join: string
  qa_salary: string
  strengths: string[] | string
  risks?: Array<{ risk: string; response: string }>
  reverse_questions: string[] | string
  checklist: string[] | string
}

const toArr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return []
}

export function generateInterviewHTML(guide: InterviewGuideResult): string {
  const dateStr = new Date().toLocaleDateString('ko-KR')

  // 마크다운 제거 후 HTML 이스케이프
  const esc = (s: string) => {
    let clean = s
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/`(.+?)`/g, '$1')

    return clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  const lines = (s: string) => {
    return esc(s).split('\n').filter(l => l.trim()).map(l => `<p class="body">${l}</p>`).join('')
  }

  const candidateName = guide.job_title || guide.candidate_name || '후보자'
  const company = guide.company ?? '회사명'
  const position = guide.position ?? '포지션'

  // 강점 카드 HTML (최대 6개)
  const strengthCards = toArr(guide.strengths).slice(0, 6).map(s => `
    <div class="str-card">
      <div class="str-icon">⚙️</div>
      <div class="str-title">${esc(s).split(' ')[0]}</div>
      <div class="str-desc">${esc(s)}</div>
    </div>
  `).join('')

  // 리스크 테이블 HTML
  const riskRows = (guide.risks ?? []).map(r => `
    <tr>
      <td class="risk-label">${esc(r.risk)}</td>
      <td class="risk-counter">${esc(r.response)}</td>
    </tr>
  `).join('')

  // 역질문 카드 HTML
  const reverseQCards = toArr(guide.reverse_questions).map((q, i) => `
    <div class="q-card">
      <span class="q-num">Q${i + 1}</span>
      <div class="q-text">${esc(q)}</div>
    </div>
  `).join('')

  // 체크리스트 HTML
  const checklistItems = toArr(guide.checklist).map(c => `
    <li class="check-item" onclick="toggleCheck(this)">
      <input type="checkbox"> ${esc(c)}
    </li>
  `).join('')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>면접 가이드 — ${esc(candidateName)} / ${esc(company)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Noto+Sans+KR:wght@400;500;700&display=swap');

:root {
  --bg: #08090d;
  --bg2: #0d1117;
  --bg3: #111827;
  --border: #1a2230;
  --border2: #243040;
  --navy: #1e3a5f;
  --blue: #38bdf8;
  --blue2: #0ea5e9;
  --green: #4ade80;
  --amber: #fbbf24;
  --red: #f87171;
  --purple: #a78bfa;
  --text: #e2e8f0;
  --text2: #94a3b8;
  --text3: #64748b;
  --s-bg: #0c2a3d;
  --t-bg: #0a2a1a;
  --a-bg: #1a1040;
  --r-bg: #2a1505;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  line-height: 1.7;
}

/* ── 헤더 */
.header {
  background: linear-gradient(135deg, #070a12 0%, #0d1a2e 100%);
  border-bottom: 1px solid var(--border);
  padding: 28px 40px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.header-title { font-size: 24px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; }
.header-sub { font-size: 12px; color: var(--text3); font-family: 'DM Mono', monospace; margin-top: 4px; }
.header-badge {
  font-size: 10px; font-family: 'DM Mono', monospace;
  padding: 3px 10px; border-radius: 20px;
  background: var(--s-bg); color: var(--blue); border: 0.5px solid #38bdf833;
}

/* ── 탭 */
.tabs {
  display: flex; gap: 4px; flex-wrap: wrap;
}
.tab {
  font-size: 11px; font-family: 'DM Mono', monospace;
  padding: 5px 14px; border-radius: 20px; cursor: pointer;
  border: 0.5px solid var(--border2); color: var(--text3);
  background: transparent; transition: all .15s;
  white-space: nowrap;
}
.tab:hover { color: var(--text2); border-color: var(--blue); }
.tab.active { background: var(--s-bg); color: var(--blue); border-color: #38bdf855; }

/* ── 레이아웃 */
.layout { display: flex; min-height: calc(100vh - 110px); }
.sidebar {
  width: 200px; flex-shrink: 0;
  padding: 20px 0;
  border-right: 1px solid var(--border);
  position: sticky; top: 110px; height: calc(100vh - 110px); overflow-y: auto;
}
.sidebar-item {
  display: block; padding: 8px 20px;
  font-size: 11px; font-family: 'DM Mono', monospace;
  color: var(--text3); cursor: pointer; text-decoration: none;
  transition: all .15s; border-left: 2px solid transparent;
}
.sidebar-item:hover { color: var(--text2); background: var(--bg2); }
.sidebar-item.active { color: var(--blue); border-left-color: var(--blue); background: var(--s-bg)22; }
.sidebar-label { padding: 16px 20px 6px; font-size: 9px; color: var(--text3); letter-spacing: 1.5px; text-transform: uppercase; font-family: 'DM Mono', monospace; }

.main { flex: 1; padding: 32px 40px; max-width: 900px; overflow-x: hidden; }

/* ── 섹션 */
.section { margin-bottom: 52px; }
.sec-header {
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1.5px solid var(--navy);
  padding-bottom: 10px; margin-bottom: 20px;
}
.sec-num {
  font-family: 'DM Mono', monospace; font-size: 10px;
  color: var(--blue); background: var(--s-bg);
  padding: 2px 8px; border-radius: 4px;
  letter-spacing: 1px;
}
.sec-title { font-size: 18px; font-weight: 700; color: #f1f5f9; }

/* ── 서브 헤더 */
.sub { font-size: 14px; font-weight: 700; color: var(--blue); margin: 20px 0 10px; }
.sub.green { color: var(--green); }
.sub.amber { color: var(--amber); }
.sub.red { color: var(--red); }
.sub.purple { color: var(--purple); }

/* ── 본문 */
p.body { color: var(--text2); margin-bottom: 8px; font-size: 13px; }
.hint { font-size: 12px; color: var(--text3); font-style: italic; margin-top: 4px; }

/* ── 인용 박스 */
.quote-box {
  background: #070f1d;
  border: 0.5px solid #38bdf833;
  border-left: 3px solid var(--blue2);
  border-radius: 0 8px 8px 0;
  padding: 16px 20px;
  margin: 12px 0;
  font-size: 13px; color: #bfdbfe;
  line-height: 1.85;
}
.quote-box.amber { border-left-color: var(--amber); color: #fef3c7; background: #0d0a00; border-color: #fbbf2422; }
.quote-box.green { border-left-color: var(--green); color: #dcfce7; background: #00100a; border-color: #4ade8022; }

/* ── 금지 태그 */
.no-list { list-style: none; margin: 10px 0; }
.no-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 6px 0; font-size: 12px; color: #fca5a5;
}
.no-icon { color: var(--red); font-weight: 700; flex-shrink: 0; margin-top: 1px; }

/* ── 불릿 리스트 */
.bullet-list { list-style: none; margin: 10px 0; }
.bullet-item {
  display: flex; gap: 10px; padding: 5px 0;
  font-size: 13px; color: var(--text2);
}
.bullet-dot { color: var(--blue); flex-shrink: 0; margin-top: 1px; font-size: 10px; padding-top: 3px; }
.bullet-item.green .bullet-dot { color: var(--green); }
.bullet-item.blue .bullet-dot { color: var(--blue); }

/* ── 리스크 테이블 */
.risk-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.risk-table th {
  background: #1f1500; color: var(--amber); font-size: 12px;
  padding: 10px 14px; border: 0.5px solid #fbbf2422; text-align: left;
}
.risk-table td { padding: 12px 14px; border: 0.5px solid #1a2230; font-size: 13px; vertical-align: top; }
.risk-table tr:nth-child(even) td { background: #090d14; }
.risk-table tr:nth-child(odd) td { background: var(--bg2); }
.risk-label { color: var(--amber); font-weight: 500; }
.risk-counter { color: var(--text2); line-height: 1.7; }

/* ── 역질문 카드 */
.q-cards { display: flex; flex-direction: column; gap: 10px; margin: 12px 0; }
.q-card {
  background: var(--bg2); border: 0.5px solid var(--border2);
  border-radius: 8px; padding: 14px 16px;
}
.q-num {
  font-family: 'DM Mono', monospace; font-size: 10px;
  color: var(--blue); background: var(--s-bg);
  padding: 1px 7px; border-radius: 4px; margin-right: 8px;
}
.q-text { font-size: 13px; color: #bfdbfe; line-height: 1.8; margin-top: 8px; }

/* ── 체크리스트 */
.checklist { list-style: none; margin: 12px 0; }
.check-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 14px; border-radius: 6px;
  border: 0.5px solid var(--border);
  background: var(--bg2); margin-bottom: 6px;
  font-size: 13px; color: var(--text2);
  cursor: pointer; transition: background .15s;
}
.check-item:hover { background: var(--bg3); }
.check-item input[type=checkbox] { margin-top: 2px; accent-color: var(--green); flex-shrink: 0; }
.check-item.checked { color: var(--text3); text-decoration: line-through; }

/* ── 포지셔닝 메시지 박스 */
.positioning-box {
  background: linear-gradient(135deg, #070f1d 0%, #0a1525 100%);
  border: 1px solid #38bdf844;
  border-radius: 10px;
  padding: 22px 24px;
  margin: 14px 0;
  position: relative;
  overflow: hidden;
}
.positioning-box::before {
  content: '"';
  position: absolute; top: -10px; left: 16px;
  font-size: 80px; color: #38bdf808;
  font-family: Georgia, serif; line-height: 1;
}
.positioning-text {
  font-size: 15px; color: #bfdbfe;
  line-height: 2; font-weight: 500;
  position: relative; z-index: 1;
}
.positioning-text strong { color: var(--blue); }

/* ── 역량 카드 */
.strength-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 12px 0; }
.str-card {
  background: var(--t-bg); border: 0.5px solid #4ade8022;
  border-radius: 8px; padding: 12px;
}
.str-icon { font-size: 18px; margin-bottom: 6px; }
.str-title { font-size: 12px; font-weight: 700; color: var(--green); margin-bottom: 4px; }
.str-desc { font-size: 11px; color: var(--text2); line-height: 1.6; }
.str-num { font-family: 'DM Mono', monospace; font-size: 11px; color: #86efac; margin-top: 6px; }

/* ── 구분선 */
.divider { border: none; border-top: 0.5px solid var(--border); margin: 24px 0; }

/* ── 푸터 */
.footer {
  border-top: 1px solid var(--border); padding: 16px 40px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--text3); font-family: 'DM Mono', monospace;
}

/* ── @media print */
@media print {
  body { background: #fff; color: #111; }
  .header { position: static; background: #fff; border-bottom: 2px solid #1e3a5f; }
  .sidebar { display: none; }
  .main { padding: 20px; max-width: 100%; }
  .tab { display: none; }
  .section { page-break-inside: avoid; margin-bottom: 30px; }
  .quote-box { border-left: 3px solid #1e3a5f; background: #f0f7ff; color: #1e3a5f; }
  .positioning-box { background: #f0f7ff; border: 1px solid #1e3a5f; }
  .positioning-text { color: #1e3a5f; }
  .no-item { color: #dc2626; }
  .check-item { background: #f9f9f9; border: 1px solid #ddd; }
}

/* ── 섹션 표시/숨김 */
.section-panel { display: none; }
.section-panel.active { display: block; }
</style>
</head>
<body>

<!-- 헤더 -->
<div class="header">
  <div class="header-top">
    <div>
      <div class="header-title">면접 가이드 — ${esc(candidateName)}</div>
      <div class="header-sub">${esc(company)} · ${esc(position)} · ${dateStr} · JOBIZIC</div>
    </div>
    <span class="header-badge">JOBIZIC</span>
  </div>
  <div class="tabs">
    <div class="tab active" onclick="showSection('s1',this)">S1 포지셔닝</div>
    <div class="tab" onclick="showSection('s2',this)">S2 자기소개</div>
    <div class="tab" onclick="showSection('s3',this)">S3 예상질문</div>
    <div class="tab" onclick="showSection('s4',this)">S4 강점·리스크</div>
    <div class="tab" onclick="showSection('s5',this)">S5 역질문</div>
    <div class="tab" onclick="showSection('s6',this)">S6 체크리스트</div>
    <div class="tab" onclick="showSection('all',this)">전체보기</div>
  </div>
</div>

<div class="layout">
  <!-- 사이드바 -->
  <div class="sidebar">
    <div class="sidebar-label">SECTIONS</div>
    <a class="sidebar-item active" onclick="showSection('s1',null,this)" href="#">S1 핵심 포지셔닝</a>
    <a class="sidebar-item" onclick="showSection('s2',null,this)" href="#">S2 자기소개</a>
    <a class="sidebar-item" onclick="showSection('s3',null,this)" href="#">S3 예상 질문</a>
    <div class="sidebar-label" style="padding-top:4px">SECTION 3</div>
    <a class="sidebar-item" onclick="showSection('s3',null,this);setTimeout(()=>document.getElementById('qa').scrollIntoView({behavior:'smooth'}),100)" href="#">A. 이직 사유</a>
    <a class="sidebar-item" onclick="showSection('s3',null,this);setTimeout(()=>document.getElementById('qb').scrollIntoView({behavior:'smooth'}),100)" href="#">B. 도메인 갭</a>
    <a class="sidebar-item" onclick="showSection('s3',null,this);setTimeout(()=>document.getElementById('qc').scrollIntoView({behavior:'smooth'}),100)" href="#">C. 역량 검증</a>
    <a class="sidebar-item" onclick="showSection('s3',null,this);setTimeout(()=>document.getElementById('qd').scrollIntoView({behavior:'smooth'}),100)" href="#">D. 프로젝트 경험</a>
    <a class="sidebar-item" onclick="showSection('s3',null,this);setTimeout(()=>document.getElementById('qe').scrollIntoView({behavior:'smooth'}),100)" href="#">E. 입사 후 계획</a>
    <a class="sidebar-item" onclick="showSection('s3',null,this);setTimeout(()=>document.getElementById('qf').scrollIntoView({behavior:'smooth'}),100)" href="#">F. 희망 연봉</a>
    <div class="sidebar-label" style="padding-top:4px">더 보기</div>
    <a class="sidebar-item" onclick="showSection('s4',null,this)" href="#">S4 강점·리스크</a>
    <a class="sidebar-item" onclick="showSection('s5',null,this)" href="#">S5 역질문</a>
    <a class="sidebar-item" onclick="showSection('s6',null,this)" href="#">S6 체크리스트</a>
  </div>

  <!-- 메인 -->
  <div class="main" id="mainContent">

    <!-- ── SECTION 1 핵심 포지셔닝 -->
    <div class="section section-panel active" id="s1">
      <div class="sec-header">
        <span class="sec-num">SECTION 1</span>
        <span class="sec-title">핵심 포지셔닝 메시지</span>
      </div>
      <p class="body">면접 전체를 관통하는 핵심 메시지입니다. 자기소개부터 마무리까지 이 메시지로 수렴하십시오.</p>

      <div class="positioning-box">
        <div class="positioning-text">
          ${esc(guide.positioning_message)}
        </div>
      </div>

      <div class="quote-box" style="margin-top:16px">
        💡 이 메시지를 <strong>자기소개 첫 문장</strong> / <strong>역량 소개 마무리</strong> / <strong>면접 끝인사</strong> — 세 군데에서 반드시 느껴지도록 말하십시오.
      </div>
    </div>

    <!-- ── SECTION 2 자기소개 -->
    <div class="section section-panel" id="s2">
      <div class="sec-header">
        <span class="sec-num">SECTION 2</span>
        <span class="sec-title">자기소개 설계</span>
      </div>
      <p class="body">이력서를 순서대로 읽지 마십시오. <strong style="color:var(--blue)">2분 이내</strong>로 말하십시오.</p>

      ${lines(guide.self_intro)}
    </div>

    <!-- ── SECTION 3 예상 질문 -->
    <div class="section section-panel" id="s3">
      <div class="sec-header">
        <span class="sec-num">SECTION 3</span>
        <span class="sec-title">예상 질문 &amp; 답변 가이드</span>
      </div>

      <!-- A. 이직 사유 -->
      <div id="qa">
        <div class="sub">A. 이직 사유</div>
        <p class="body">면접관이 반드시 묻습니다. 아래 구조 그대로 준비하십시오.</p>
        ${lines(guide.qa_resign_reason)}
      </div>

      <hr class="divider">

      <!-- B. 도메인 갭 -->
      <div id="qb">
        <div class="sub">B. 도메인 갭 대응</div>
        ${lines(guide.qa_domain_gap)}
      </div>

      <hr class="divider">

      <!-- C. 역량 검증 -->
      <div id="qc">
        <div class="sub">C. 역량 검증 (STAR)</div>
        ${lines(guide.qa_competency)}
      </div>

      <hr class="divider">

      <!-- D. 프로젝트 경험 심화 질문 -->
      <div id="qd">
        <div class="sub">D. 프로젝트 경험 심화 질문</div>
        ${lines(guide.qa_project_experience)}
      </div>

      <hr class="divider">

      <!-- E. 입사 후 계획 -->
      <div id="qe">
        <div class="sub">E. 입사 후 계획</div>
        ${lines(guide.qa_post_join)}
      </div>

      <hr class="divider">

      <!-- F. 희망 연봉 -->
      <div id="qf">
        <div class="sub">F. 희망 연봉</div>
        ${lines(guide.qa_salary)}
      </div>
    </div>

    <!-- ── SECTION 4 강점 & 리스크 -->
    <div class="section section-panel" id="s4">
      <div class="sec-header">
        <span class="sec-num">SECTION 4</span>
        <span class="sec-title">강점 &amp; 리스크 정리</span>
      </div>

      <div class="sub green">✅ 면접에서 반드시 어필할 강점</div>
      <div class="strength-cards">
        ${strengthCards}
      </div>

      ${riskRows ? `
      <div class="sub amber" style="margin-top:24px">⚠️ 면접관이 우려할 리스크 &amp; 대응 멘트</div>
      <table class="risk-table">
        <tr><th>리스크</th><th>대응 멘트</th></tr>
        ${riskRows}
      </table>
      ` : ''}
    </div>

    <!-- ── SECTION 5 역질문 -->
    <div class="section section-panel" id="s5">
      <div class="sec-header">
        <span class="sec-num">SECTION 5</span>
        <span class="sec-title">역질문 추천</span>
      </div>
      <p class="body">면접 말미 "궁금한 점 있으신가요?"에 반드시 답하십시오. "없습니다"는 준비 안 된 인상입니다.</p>

      <div class="sub" style="margin-top:16px">권장 역질문</div>
      <div class="q-cards">
        ${reverseQCards}
      </div>
    </div>

    <!-- ── SECTION 6 체크리스트 -->
    <div class="section section-panel" id="s6">
      <div class="sec-header">
        <span class="sec-num">SECTION 6</span>
        <span class="sec-title">면접 전 체크리스트</span>
      </div>
      <p class="body">면접 당일 아침, 하나씩 클릭하며 확인하십시오.</p>

      <ul class="checklist" id="checklist">
        ${checklistItems}
      </ul>

      <div class="quote-box" style="margin-top:20px">
        ■ 면접 전후 궁금한 점은 언제든 연락 주세요.<br>
        &nbsp;&nbsp;Jobizic | 면접 가이드<br><br>
        &nbsp;&nbsp;<em style="color:#93c5fd">"채용은 사람이고, 사람은 맥락입니다. 끝까지 책임집니다."</em>
      </div>
    </div>

  </div><!-- /main -->
</div><!-- /layout -->

<div class="footer">
  <span>Jobizic · 면접 가이드</span>
  <span>${dateStr} · ${esc(candidateName)} / ${esc(company)}</span>
</div>

<script>
function showSection(id, tabEl, sideEl) {
  // 탭 활성화
  if (tabEl) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
  }
  // 사이드바 활성화
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  if (sideEl) sideEl.classList.add('active');

  const panels = document.querySelectorAll('.section-panel');
  if (id === 'all') {
    panels.forEach(p => p.classList.add('active'));
  } else {
    panels.forEach(p => {
      p.classList.remove('active');
      if (p.id === id) p.classList.add('active');
    });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleCheck(el) {
  const cb = el.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  el.classList.toggle('checked', cb.checked);
}
</script>
</body>
</html>`
}
