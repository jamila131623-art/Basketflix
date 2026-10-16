export default function Skeleton({ className = '', style }) {
  return (
    <div className={`skeleton ${className}`} style={style}>
      <div className="skeleton-shimmer"></div>
    </div>
  )
}

export function ResultsSkeleton() {
  return (
    <div className="results-skeleton" aria-busy="true" aria-label="Analysing your data">
      <Skeleton className="skeleton-hero" />
      {[0, 1, 2].map(r => (
        <div key={r} className="skeleton-row-wrap">
          <Skeleton className="skeleton-title" />
          <div className="skeleton-row">
            {[0, 1, 2, 3, 4, 5].map(c => <Skeleton key={c} className="skeleton-card" />)}
          </div>
        </div>
      ))}
      <p className="skeleton-note">Running Apriori on your baskets...</p>
    </div>
  )
}
