import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useBundles } from '../BundleContext'
import { useDialog } from '../hooks/useDialog'
import { ListToggleButton, StrengthBadge } from './BundleActions'
import { CloseIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons'
import {
  getBundleTitle, supportPct, pct, formatLift, formatNumber, ruleLabel, confidenceSentence,
  joinProducts, whatYouCanDo, LIFT_TOOLTIP
} from '../utils'

const STEPS = [
  'How common is each product?',
  'How often are they bought together?',
  'If someone buys A, how likely is B?',
  'Is it more than a coincidence?'
]

function Bar({ label, value, max, text, tone = 'red', marker, markerLabel, note }) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className={`bar-fill tone-${tone}`} style={{ width: `${width}%` }} />
        {marker !== undefined && (
          <span className="bar-marker" style={{ left: `${Math.min(100, (marker / max) * 100)}%` }} title={markerLabel}>
            <span className="bar-marker-label">{markerLabel}</span>
          </span>
        )}
      </div>
      <span className="bar-value">{text}{note && <span className="bar-note">{note}</span>}</span>
    </div>
  )
}

export default function Walkthrough({ bundle, onClose }) {
  const { results, total } = useBundles()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const go = (n) => {
    if (n < 0 || n >= STEPS.length) return
    setDir(n > step ? 1 : -1)
    setStep(n)
  }
  const ref = useDialog(onClose, {
    onKeyDown: (e) => {
      if (e.key === 'ArrowRight') go(step + 1)
      if (e.key === 'ArrowLeft') go(step - 1)
    }
  })

  const { min_support: minSupport, min_confidence: minConfidence } = results.settings
  const supports = new Map(results.item_supports.map(s => [s.item, s]))
  const best = bundle.best_rule
  const title = getBundleTitle(bundle.items)
  const itemMax = Math.max(...bundle.items.map(i => supports.get(i)?.support || 0)) * 1.1
  const togetherMax = Math.max(bundle.support, minSupport, best.expected_support) * 1.15

  let content
  if (step === 0) {
    content = (
      <>
        <p className="wt-lead">Apriori starts by counting how many baskets contain each product on its own. Products found in fewer than {supportPct(minSupport)}% of baskets (your minimum support) are dropped before any pairing.</p>
        {bundle.items.map(item => {
          const s = supports.get(item)
          return (
            <Bar key={item} label={item} value={s?.support || 0} max={itemMax}
              text={`${supportPct(s?.support || 0)}% of baskets`} note={`${formatNumber(s?.count || 0)} of ${formatNumber(total)}`} />
          )
        })}
      </>
    )
  } else if (step === 1) {
    content = (
      <>
        <p className="wt-lead">Next it counts the baskets that contain all {bundle.size} products together. Only combinations above your minimum support are kept.</p>
        <Bar label="Bought together" value={bundle.support} max={togetherMax} tone="green"
          text={`${supportPct(bundle.support)}% of baskets`} note={`${formatNumber(bundle.count)} of ${formatNumber(total)}`} />
        <Bar label="Your minimum support" value={minSupport} max={togetherMax} tone="grey" text={`${supportPct(minSupport)}%`} />
        <Bar label="Expected by chance" value={best.expected_support} max={togetherMax} tone="outline"
          text={`${supportPct(best.expected_support)}%`}
          note={`${supportPct(best.antecedent_support)}% × ${supportPct(best.consequent_support)}%`} />
        <p className={`wt-pass ${bundle.support >= minSupport ? 'ok' : ''}`}>
          <CheckIcon size={20} /> Passes your minimum support ({supportPct(minSupport)}%)
        </p>
        <p className="wt-small">Expected by chance = how often {joinProducts(best.antecedent)} and {joinProducts(best.consequent)} would land in the same basket if shoppers picked them independently ({supportPct(best.antecedent_support)}% × {supportPct(best.consequent_support)}%).</p>
      </>
    )
  } else if (step === 2) {
    content = (
      <>
        <p className="wt-lead">For every way of splitting the bundle, Apriori asks: of the baskets with the first part, how many also have the rest? That share is the confidence.</p>
        {bundle.directions.map(d => (
          <Bar key={ruleLabel(d)} label={ruleLabel(d)} value={d.confidence} max={1} tone={d.below_threshold ? 'grey' : 'red'}
            text={`${pct(d.confidence)}%`} marker={minConfidence} markerLabel={`Your setting ${pct(minConfidence)}%`}
            note={d.below_threshold ? 'below your confidence setting' : undefined} />
        ))}
        <p className="wt-small">Best direction: {confidenceSentence(best)}.</p>
      </>
    )
  } else {
    content = (
      <>
        <p className="wt-lead">Finally it checks whether the products meet more often than chance alone would predict.</p>
        <ul className="wt-lift-list">
          {bundle.directions.map(d => (
            <li key={ruleLabel(d)}>
              <strong>{ruleLabel(d)}</strong>
              <span>
                <span className="has-tip" title={LIFT_TOOLTIP}>Lift {d.lift.toFixed(2)}</span>: {joinProducts(d.consequent)} {d.consequent.length > 1 ? 'are' : 'is'} bought {formatLift(d.lift)} more often with {joinProducts(d.antecedent)} than chance would predict.
                {' '}Leverage {d.leverage.toFixed(3)}: about {(d.leverage * 100).toFixed(1)} extra baskets in every 100 contain {d.antecedent.length + d.consequent.length > 2 ? 'all of them' : 'both'} compared with chance.
              </span>
            </li>
          ))}
        </ul>
        <div className="wt-verdict">Overall strength <StrengthBadge strength={bundle.strength} /> <span className="muted">(best lift {formatLift(best.lift)})</span></div>
        <h3 className="wt-sub">What you can do (things to test, not guarantees)</h3>
        <ul className="ideas">
          {whatYouCanDo(bundle).map(idea => <li key={idea}>{idea}</li>)}
        </ul>
      </>
    )
  }

  return createPortal(
    <div className="wt-overlay" role="dialog" aria-modal="true" aria-labelledby="wt-title" ref={ref} tabIndex={-1}>
      <div className="wt-top">
        <div>
          <span className="wt-kicker">Apriori Walkthrough</span>
          <h2 id="wt-title" className="wt-bundle">{title}</h2>
        </div>
        <button type="button" className="round-close" aria-label="Close walkthrough" onClick={onClose} data-autofocus>
          <CloseIcon size={22} />
        </button>
      </div>
      <div className="wt-progress" aria-hidden="true">
        {STEPS.map((s, i) => <span key={s} className={`wt-seg ${i <= step ? 'done' : ''}`} />)}
      </div>
      <div className="wt-stage">
        <div key={step} className={`wt-step ${dir > 0 ? 'slide-next' : 'slide-prev'}`} aria-live="polite">
          <span className="wt-count">Step {step + 1} of {STEPS.length}</span>
          <h3 className="wt-title">{STEPS[step]}</h3>
          {content}
        </div>
      </div>
      <div className="wt-bottom">
        <button type="button" className="btn btn-grey" onClick={() => go(step - 1)} disabled={step === 0}>
          <ChevronLeftIcon /> Back
        </button>
        <ListToggleButton bundle={bundle} />
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-white" onClick={() => go(step + 1)}>
            Next <ChevronRightIcon />
          </button>
        ) : (
          <button type="button" className="btn btn-white" onClick={onClose}>Finish</button>
        )}
      </div>
    </div>,
    document.body
  )
}
