import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBundles } from '../BundleContext'
import Poster from './Poster'
import BundleActions, { StrengthBadge } from './BundleActions'
import { boughtTogetherLabel, supportPct, formatLift, LIFT_TOOLTIP } from '../utils'

export default function HoverPreview({ preview, onClose }) {
  const { openModal, topRank } = useBundles()
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!preview) return
    const r = preview.el.getBoundingClientRect()
    const width = Math.round(Math.max(r.width * 1.3, preview.variant === 'top10' ? 300 : 0))
    const artHeight = (width * 9) / 16
    const vw = document.documentElement.clientWidth
    const center = r.left + r.width / 2
    const left = Math.max(12, Math.min(center - width / 2, vw - width - 12))
    const anchorY = preview.variant === 'top10' ? r.top + r.height * 0.35 : r.top + r.height / 2
    setPos({
      left: left + window.scrollX,
      top: Math.max(anchorY - artHeight / 2, 76) + window.scrollY,
      width,
      origin: `${((center - left) / width) * 100}% 30%`
    })
  }, [preview])

  if (!preview || !pos) return null
  const { bundle } = preview
  const best = bundle.best_rule

  return createPortal(
    <div
      className="hover-preview"
      style={{ left: pos.left, top: pos.top, width: pos.width, transformOrigin: pos.origin }}
      onMouseLeave={onClose}
      onClick={() => openModal(bundle)}
    >
      <Poster items={bundle.items} variant="landscape" topRank={topRank(bundle)} showTitle />
      <div className="preview-panel">
        <BundleActions bundle={bundle} />
        <div className="meta-row compact">
          <span className="match">{boughtTogetherLabel(bundle)}</span>
          <StrengthBadge strength={bundle.strength} />
          <span className="meta-plain">{bundle.size} items</span>
        </div>
        <div className="meta-row compact muted">
          <span>in {supportPct(bundle.support)}% of baskets</span>
          <span className="has-tip" title={LIFT_TOOLTIP}>{formatLift(best.lift)} chance</span>
        </div>
        <div className="preview-products">
          {bundle.items.map((item, i) => (
            <span key={item}>{i > 0 && <span className="dot-sep" aria-hidden="true">•</span>}{item}</span>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
