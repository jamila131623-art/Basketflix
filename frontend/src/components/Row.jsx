import { useEffect, useRef, useState } from 'react'
import { useBundles } from '../BundleContext'
import BundleCard from './BundleCard'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import { bundleKey } from '../utils'

export default function Row({ id, title, bundles, variant = 'landscape', emptyText }) {
  const { hidePreview } = useBundles()
  const track = useRef(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const update = () => {
    const el = track.current
    if (!el) return
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    })
  }

  useEffect(() => {
    if (track.current) track.current.scrollLeft = 0
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [bundles])

  const scroll = (dir) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className={`row row-${variant}`} id={id} aria-label={title}>
      <h2 className="row-title">{title}</h2>
      {bundles.length === 0 ? (
        <p className="row-empty">{emptyText || 'No bundles match your filters.'}</p>
      ) : (
        <div className={`row-viewport ${edges.left ? 'fade-left' : ''} ${edges.right ? 'fade-right' : ''}`}>
          {edges.left && (
            <button type="button" className="row-arrow left" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)}>
              <ChevronLeftIcon size={34} />
            </button>
          )}
          <div className="row-track" ref={track} onScroll={() => { update(); hidePreview() }}>
            {bundles.map((b, i) => (
              <BundleCard key={bundleKey(b.items)} bundle={b} rank={variant === 'top10' ? i + 1 : null} variant={variant} />
            ))}
          </div>
          {edges.right && (
            <button type="button" className="row-arrow right" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)}>
              <ChevronRightIcon size={34} />
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export function SizeChips({ value, onChange }) {
  const options = [['all', 'All'], ['2', '2 items'], ['3', '3 items']]
  return (
    <div className="size-chips" role="group" aria-label="Filter bundles by size">
      <span className="chips-label">Bundle size</span>
      {options.map(([v, label]) => (
        <button key={v} type="button" className="chip" aria-pressed={value === v} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}
