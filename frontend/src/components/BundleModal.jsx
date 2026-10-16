import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useBundles } from '../BundleContext'
import { useDialog } from '../hooks/useDialog'
import Poster, { ProductBadge } from './Poster'
import { ListToggleButton, StrengthBadge } from './BundleActions'
import { CloseIcon, PlayIcon } from '../icons'
import {
  getBundleTitle, boughtTogetherLabel, supportSentence, liftSentence, supportPct, pct, formatLift,
  formatNumber, ruleLabel, relatedBundles, whatYouCanDo, STRENGTH_HELP, LIFT_TOOLTIP
} from '../utils'

export default function BundleModal({ bundle, onClose }) {
  const { results, total, openModal, openWalkthrough, topRank } = useBundles()
  const ref = useDialog(onClose)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [bundle.id])

  const best = bundle.best_rule
  const supports = new Map(results.item_supports.map(s => [s.item, s]))
  const related = relatedBundles(bundle, results.bundles)
  const title = getBundleTitle(bundle.items)

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} tabIndex={-1}>
        <div className="modal-scroll" ref={scrollRef}>
          <div className="modal-close-bar">
            <button type="button" className="modal-close" aria-label="Close details" onClick={onClose}>
              <CloseIcon size={22} />
            </button>
          </div>
          <header className="modal-hero">
            <Poster items={bundle.items} variant="header" topRank={topRank(bundle)} />
            <div className="modal-hero-fade" />
            <div className="modal-hero-text">
              <h2 id="modal-title">{title}</h2>
              <div className="modal-hero-actions">
                <button type="button" className="btn btn-white" onClick={() => openWalkthrough(bundle)}>
                  <PlayIcon size={22} /> Play analysis
                </button>
                <ListToggleButton bundle={bundle} />
              </div>
            </div>
          </header>

          <div className="modal-body">
            <div className="meta-row">
              <span className="match">{boughtTogetherLabel(bundle)}</span>
              <StrengthBadge strength={bundle.strength} />
              <span className="meta-plain">{bundle.size} items</span>
              <span className="meta-plain">{formatNumber(bundle.count)} baskets</span>
            </div>

            <section className="about-grid" aria-label="About this bundle">
              <div className="about-main">
                <h3>About this bundle</h3>
                <p className="about-lead">{bundle.headline}.</p>
                <p>{supportSentence(bundle, total)}.</p>
                <p><span className="has-tip" title={LIFT_TOOLTIP}>{liftSentence(best.lift)}</span>.</p>
              </div>
              <aside className="about-side">
                <div>
                  <span className="side-label">Products:</span>
                  <ul className="product-pills">
                    {bundle.items.map(item => (
                      <li key={item} className="product-pill">
                        <ProductBadge name={item} className="pill-art" />
                        <span>{item}</span>
                        <span className="pill-support">in {supportPct(supports.get(item)?.support || 0)}% of baskets</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="side-label">Strength:</span>
                  <div className="strength-line"><StrengthBadge strength={bundle.strength} /> <span className="muted">{STRENGTH_HELP[bundle.strength]}</span></div>
                </div>
              </aside>
            </section>

            <section className="modal-section">
              <h3>Apriori analysis</h3>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Rule (A → B)</th>
                      <th scope="col" className="num">Support</th>
                      <th scope="col" className="num">Confidence</th>
                      <th scope="col" className="num">Lift</th>
                      <th scope="col" className="num">Leverage</th>
                      <th scope="col" className="num">Conviction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.directions.map(d => (
                      <tr key={ruleLabel(d)} className={d.below_threshold ? 'is-below' : ''}>
                        <td>
                          {ruleLabel(d)}
                          {d.below_threshold && <span className="below-tag">below your confidence setting</span>}
                        </td>
                        <td className="num">{supportPct(d.support)}%</td>
                        <td className="num">{pct(d.confidence)}%</td>
                        <td className="num">{d.lift.toFixed(2)}</td>
                        <td className="num">{d.leverage.toFixed(3)}</td>
                        <td className="num">{d.conviction === null ? 'Always together' : d.conviction.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl className="definitions">
                <div><dt>Support</dt><dd>share of all baskets that contain every product in the rule.</dd></div>
                <div><dt>Confidence</dt><dd>of the baskets with A, the share that also contain B.</dd></div>
                <div><dt>Lift</dt><dd>confidence divided by how common B is on its own; above 1 means more than chance.</dd></div>
                <div><dt>Leverage</dt><dd>support minus the support expected by chance; above 0 means more than chance.</dd></div>
                <div><dt>Conviction</dt><dd>how much less often A appears without B than chance predicts; "Always together" means B was in every basket with A.</dd></div>
              </dl>
            </section>

            <section className="modal-section">
              <h3>What you can do</h3>
              <ul className="ideas">
                {whatYouCanDo(bundle).map(idea => <li key={idea}>{idea}</li>)}
              </ul>
            </section>

            {related.length > 0 && (
              <section className="modal-section">
                <h3>More like this</h3>
                <div className="more-grid">
                  {related.map(r => (
                    <button key={r.id} type="button" className="more-card" onClick={() => openModal(r)} aria-label={`Open ${getBundleTitle(r.items)}`}>
                      <Poster items={r.items} variant="landscape" topRank={topRank(r)} />
                      <span className="more-info">
                        <span className="more-title">{getBundleTitle(r.items)}</span>
                        <span className="more-stats">
                          <span className="match">{pct(r.best_rule.confidence)}% bought together</span>
                          <span className="has-tip" title={LIFT_TOOLTIP}>{formatLift(r.best_rule.lift)} chance</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
