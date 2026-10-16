import { useState } from 'react'
import { ProductBadge } from './Poster'
import { PlusIcon, CloseIcon, CopyIcon } from '../icons'
import { getSuggestions, pct, formatLift, joinProducts, copyText, LIFT_TOOLTIP } from '../utils'

export default function BundleBuilder({ rules, allProducts, onProductSelect, onToast }) {
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')

  const filtered = allProducts.filter(p => p.toLowerCase().includes(search.toLowerCase()))
  const suggestions = getSuggestions(selected, rules)

  const toggle = (product) => {
    if (selected.includes(product)) {
      setSelected(selected.filter(p => p !== product))
    } else {
      setSelected([...selected, product])
      onProductSelect?.(product)
    }
  }
  const addAll = (products) => setSelected(s => [...s, ...products.filter(p => !s.includes(p))])
  const copy = async () => {
    const ok = await copyText(selected.join(' + '))
    onToast?.(ok ? 'Bundle copied to clipboard' : 'Could not copy the bundle')
  }

  return (
    <section className="bundle-builder" id="builder" aria-labelledby="builder-title">
      <h2 id="builder-title" className="row-title">Bundle Builder</h2>
      <p className="muted builder-sub">Pick products. Suggestions come from association rules found in your data.</p>
      <div className="builder-layout">
        <div className="builder-main">
          <input className="text-input" type="search" placeholder="Search products..." aria-label="Search products" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="product-chips">
            {filtered.map(product => (
              <button key={product} type="button" className="product-chip" aria-pressed={selected.includes(product)} onClick={() => toggle(product)}>
                <ProductBadge name={product} className="chip-art" />
                {product}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="suggestions">
              <h3>Suggested from your data</h3>
              {suggestions.length > 0 ? (
                <div className="suggestion-cards">
                  {suggestions.map(rule => (
                    <div key={rule.consequent.join('|')} className="suggestion-card">
                      <div className="suggestion-art">
                        {rule.consequent.map(p => <ProductBadge key={p} name={p} className="chip-art big" />)}
                      </div>
                      <div className="suggestion-info">
                        <span className="suggestion-product">{rule.consequent.join(' + ')}</span>
                        <span className="suggestion-text">{pct(rule.confidence)}% of baskets that contain {joinProducts(rule.antecedent)} also contain {joinProducts(rule.consequent)}</span>
                        <span className="suggestion-stats">
                          <span className="match">{pct(rule.confidence)}% confidence</span>
                          <span className="has-tip" title={LIFT_TOOLTIP}>{formatLift(rule.lift)} chance</span>
                        </span>
                      </div>
                      <button type="button" className="icon-btn" aria-label={`Add ${rule.consequent.join(' and ')} to your bundle`} title="Add to your bundle" onClick={() => addAll(rule.consequent)}>
                        <PlusIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No rules start from this selection. Try a different product.</p>
              )}
            </div>
          )}
        </div>
        <aside className="builder-panel">
          <h3>Your bundle</h3>
          {selected.length > 0 ? (
            <>
              <ul className="selected-list">
                {selected.map(p => (
                  <li key={p}>
                    <ProductBadge name={p} className="chip-art" />
                    <span>{p}</span>
                    <button type="button" className="nav-icon small" aria-label={`Remove ${p}`} onClick={() => toggle(p)}><CloseIcon size={16} /></button>
                  </li>
                ))}
              </ul>
              <div className="builder-actions">
                <button type="button" className="btn btn-white small" onClick={copy}><CopyIcon size={18} /> Copy bundle</button>
                <button type="button" className="btn btn-grey small" onClick={() => setSelected([])}>Clear</button>
              </div>
            </>
          ) : (
            <p className="muted">Select products to start a bundle.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
