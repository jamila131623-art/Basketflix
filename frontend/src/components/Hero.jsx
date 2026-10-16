import { useEffect, useRef, useState } from 'react'
import { useBundles } from '../BundleContext'
import { ProductBadge } from './Poster'
import { ListToggleButton, StrengthBadge } from './BundleActions'
import { PlayIcon, InfoIcon } from '../icons'
import { getGradientForItems, getBundleTitle, boughtTogetherLabel, formatLift, formatNumber, LIFT_TOOLTIP } from '../utils'

const ROTATE_MS = 8000
const TICK_MS = 100

export default function Hero({ bundles }) {
  const { openWalkthrough, openModal } = useBundles()
  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const rootRef = useRef(null)
  const keys = bundles.map(b => b.id).join(',')
  const paused = hovered || focused

  useEffect(() => {
    setIndex(0)
    setElapsed(0)
  }, [keys])

  useEffect(() => {
    if (paused || bundles.length < 2) return
    const t = setInterval(() => {
      setElapsed(e => {
        if (e + TICK_MS >= ROTATE_MS) {
          setIndex(i => (i + 1) % bundles.length)
          return 0
        }
        return e + TICK_MS
      })
    }, TICK_MS)
    return () => clearInterval(t)
  }, [paused, bundles.length])

  if (!bundles.length) {
    return <section className="hero hero-empty" id="home"><p>No bundles match your filters.</p></section>
  }

  const bundle = bundles[Math.min(index, bundles.length - 1)]
  const best = bundle.best_rule
  const title = getBundleTitle(bundle.items)

  return (
    <section
      className="hero"
      id="home"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Top bundles"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!rootRef.current?.contains(e.relatedTarget)) setFocused(false) }}
    >
      <div key={bundle.id} className="hero-slide">
        <div className="hero-bg" style={{ background: getGradientForItems(bundle.items) }} />
        <div className="hero-art" aria-hidden="true">
          <span className="hero-watermark">{bundle.items[0]}</span>
          {bundle.items.slice(0, 3).map((item, i) => (
            <ProductBadge key={item} name={item} className={`hero-sticker hero-sticker-${i}`} />
          ))}
        </div>
        <div className="hero-vignette" />
        <div className="hero-fade" />
        <div className="hero-content">
          <span className="hero-tag"><span className="hero-tag-mark">B</span> #{index + 1} Bundle in your data</span>
          <h1 className="hero-title">{title}</h1>
          <div className="meta-row">
            <span className="match">{boughtTogetherLabel(bundle)}</span>
            <StrengthBadge strength={bundle.strength} />
            <span className="meta-plain">{bundle.size} items</span>
            <span className="meta-plain">{formatNumber(bundle.count)} baskets</span>
            <span className="meta-plain has-tip" title={LIFT_TOOLTIP}>{formatLift(best.lift)} chance</span>
          </div>
          <p className="hero-headline">{bundle.headline}.</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-white" onClick={() => openWalkthrough(bundle)}>
              <PlayIcon size={24} /> Play
            </button>
            <button type="button" className="btn btn-grey" onClick={() => openModal(bundle)}>
              <InfoIcon size={24} /> More Info
            </button>
            <ListToggleButton bundle={bundle} />
          </div>
        </div>
      </div>
      {bundles.length > 1 && (
        <div className="hero-dots">
          {bundles.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className={`hero-dot ${i === index ? 'active' : ''}`}
              aria-label={`Show bundle ${i + 1} of ${bundles.length}: ${getBundleTitle(b.items)}`}
              aria-current={i === index}
              onClick={() => { setIndex(i); setElapsed(0) }}
            >
              <span className="hero-dot-fill" style={{ width: i === index ? `${(elapsed / ROTATE_MS) * 100}%` : i < index ? '100%' : '0%' }} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
