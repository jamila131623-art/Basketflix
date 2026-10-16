import { useEffect, useRef } from 'react'
import { useBundles } from '../BundleContext'
import Poster from './Poster'
import BundleActions from './BundleActions'
import { getBundleTitle, boughtTogetherLabel } from '../utils'

const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

export default function BundleCard({ bundle, rank = null, variant = 'landscape' }) {
  const { openModal, showPreview, topRank } = useBundles()
  const ref = useRef(null)
  const timer = useRef(null)
  const title = getBundleTitle(bundle.items)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleEnter = () => {
    if (!canHover()) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (ref.current) showPreview({ bundle, el: ref.current, variant })
    }, 300)
  }

  return (
    <div
      ref={ref}
      className={`card card-${variant}`}
      onMouseEnter={handleEnter}
      onMouseLeave={() => clearTimeout(timer.current)}
      onClick={() => openModal(bundle)}
    >
      {variant === 'top10' && <span className="top10-number" aria-hidden="true">{rank}</span>}
      <div className="card-body">
        <button
          type="button"
          className="card-hit"
          aria-label={`${rank ? `Number ${rank}: ` : ''}${title}, ${boughtTogetherLabel(bundle)}. Open details`}
          onClick={(e) => {
            e.stopPropagation()
            openModal(bundle)
          }}
        >
          <Poster
            items={bundle.items}
            variant={variant === 'top10' ? 'portrait' : 'landscape'}
            topRank={topRank(bundle)}
            showTitle
          />
        </button>
        <div className="card-quick-actions">
          <BundleActions bundle={bundle} />
        </div>
      </div>
    </div>
  )
}
