import { getProductEmoji, productInitial, getGradientForItems, getBundleTitle } from '../utils'

export function ProductBadge({ name, className = '' }) {
  const emoji = getProductEmoji(name)
  if (emoji) {
    return <span className={`product-emoji ${className}`} role="img" aria-label={name}>{emoji}</span>
  }
  return (
    <span className={`product-letter ${className}`} role="img" aria-label={name}>
      <span>{productInitial(name)}</span>
    </span>
  )
}

export default function Poster({ items, variant = 'landscape', topRank = null, showTitle = false }) {
  const shown = items.slice(0, 3)
  return (
    <div className={`poster poster-${variant}`} style={{ background: getGradientForItems(items) }}>
      <span className="poster-watermark" aria-hidden="true">{items[0]}</span>
      <span className="poster-mark" aria-hidden="true">B</span>
      {topRank && (
        <span className="poster-ribbon" aria-hidden="true">
          <span className="ribbon-top">TOP</span>
          <span className="ribbon-ten">10</span>
        </span>
      )}
      <div className={`poster-stickers count-${shown.length}`} aria-hidden="true">
        {shown.map((item, i) => (
          <ProductBadge key={item} name={item} className={`sticker sticker-${i}`} />
        ))}
      </div>
      {showTitle && <div className="poster-title">{getBundleTitle(items)}</div>}
    </div>
  )
}
