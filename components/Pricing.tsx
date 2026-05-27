import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '??',
    desc: '?쒖옉?섎뒗 援ъ쭅?먮? ?꾪빐',
    features: ['?대젰??遺꾩꽍 1????, '湲곕낯 ?먯닔 由ы룷??, '而ㅻ━??諛⑺뼢 1媛吏 ?쒖븞'],
    disabled: ['JD ?곹빀??遺꾩꽍', '臾댁젣??遺꾩꽍', 'HTML 由ы룷???ㅼ슫濡쒕뱶'],
    btnClass: 'btn-plan-outline',
    btnText: '臾대즺濡??쒖옉',
    featured: false,
  },
  {
    name: 'Pro',
    price: '??9,900',
    desc: '吏꾩??섍쾶 ?댁쭅??以鍮꾪븯??遺?,
    features: ['?대젰??遺꾩꽍 10????, 'JD ?곹빀??遺꾩꽍 15????, '?ъ링 ?먯닔 由ы룷??, '而ㅻ━??諛⑺뼢 3媛吏 ?쒖븞', '遺꾩꽍 寃곌낵 10?????, 'HTML 由ы룷???ㅼ슫濡쒕뱶'],
    disabled: ['?대젰??由щ씪?댄똿 (以鍮꾩쨷)'],
    btnClass: 'btn-plan-fill',
    btnText: 'Pro ?쒖옉?섍린',
    featured: true,
  },
  {
    name: 'Expert',
    price: '??9,900',
    desc: '理쒖긽??而ㅻ━?대? ?먰븯??遺?,
    features: ['Pro??紐⑤뱺 湲곕뒫', '?대젰??遺꾩꽍 30????, 'JD ?곹빀??遺꾩꽍 30????, '?대젰??由щ씪?댄똿 (異쒖떆 ???곗꽑 ?쒓났)', '?꾨떞 而ㅻ━??留ㅻ땲?'],
    disabled: [],
    btnClass: 'btn-plan-outline',
    btnText: 'Expert ?좎껌',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing">
      <div className="reveal" style={{ textAlign: 'center' }}>
        <div className="section-label">Pricing</div>
        <div className="section-title">?⑸━?곸씤 媛寃⑹쑝濡?br />而ㅻ━?대? ?ㅺ퀎?섏꽭??/div>
        <p className="section-sub" style={{ margin: '0 auto' }}>泥?遺꾩꽍? 臾대즺. 遺???놁씠 ?쒖옉?대낫?몄슂.</p>
      </div>
      <div className="pricing-grid reveal">
        {plans.map((plan) => (
          <div key={plan.name} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
            {plan.featured && <div className="featured-badge">媛???멸린</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">{plan.price} <span>/ ??/span></div>
            <div className="plan-desc">{plan.desc}</div>
            <ul className="plan-features">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
              {plan.disabled.map((f) => <li key={f} className="disabled">{f}</li>)}
            </ul>
            <Link href="/analyze">
              <button className={`btn-plan ${plan.btnClass}`}>{plan.btnText}</button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
