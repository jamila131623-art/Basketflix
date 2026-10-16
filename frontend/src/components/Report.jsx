import { useMemo, useRef, useState } from 'react'
import { DownloadIcon } from '../icons'
import { StrengthBadge } from './BundleActions'
import {
  supportPct, pct, formatNumber, ruleLabel, rulesCsv, downloadText, joinProducts, getBundleTitle, LIFT_TOOLTIP
} from '../utils'

function SortableTable({ columns, rows, initialSort, rowKey, label }) {
  const [sort, setSort] = useState(initialSort)
  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sort.key)
    const value = col.sortValue || (r => r[col.key])
    return [...rows].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va ?? Infinity) - (vb ?? Infinity)
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const toggle = (key) => setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  return (
    <div className="table-scroll">
      <table className="data-table" aria-label={label}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} scope="col" className={c.num ? 'num' : ''}
                aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="sort-btn" onClick={() => toggle(c.key)}>
                  {c.label}<span className="sort-arrow" aria-hidden="true">{sort.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={rowKey(r)}>
              {columns.map(c => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="muted">Nothing matches your filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const ITEMSET_COLUMNS = [
  { key: 'size', label: 'Size', num: true },
  { key: 'items', label: 'Items', sortValue: r => r.items.join(' + '), render: r => r.items.join(' + ') },
  { key: 'count', label: 'Count', num: true, render: r => formatNumber(r.count) },
  { key: 'support', label: 'Support', num: true, render: r => `${supportPct(r.support)}%` }
]

const RULE_COLUMNS = [
  { key: 'rule', label: 'Rule', sortValue: r => ruleLabel(r), render: r => ruleLabel(r) },
  { key: 'support', label: 'Support', num: true, render: r => `${supportPct(r.support)}%` },
  { key: 'confidence', label: 'Confidence', num: true, render: r => `${pct(r.confidence)}%` },
  { key: 'lift', label: 'Lift', num: true, render: r => r.lift.toFixed(2) },
  { key: 'leverage', label: 'Leverage', num: true, render: r => r.leverage.toFixed(3) },
  { key: 'conviction', label: 'Conviction', num: true, render: r => (r.conviction === null ? 'Always together' : r.conviction.toFixed(2)) }
]

function ItemsetsTab({ itemsets }) {
  const [size, setSize] = useState('all')
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const rows = itemsets.filter(i =>
    (size === 'all' || i.size === Number(size)) && (!term || i.items.some(p => p.toLowerCase().includes(term))))
  return (
    <>
      <div className="table-tools">
        <label className="field">
          <span>Size</span>
          <select value={size} onChange={e => setSize(e.target.value)}>
            <option value="all">All sizes</option>
            <option value="1">1 item</option>
            <option value="2">2 items</option>
            <option value="3">3 items</option>
          </select>
        </label>
        <label className="field">
          <span>Search</span>
          <input type="search" placeholder="Product name" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <span className="muted tool-count">{rows.length} of {itemsets.length} itemsets</span>
      </div>
      <SortableTable label="Frequent itemsets" columns={ITEMSET_COLUMNS} rows={rows} initialSort={{ key: 'support', dir: 'desc' }} rowKey={r => r.items.join('|')} />
    </>
  )
}

function RulesTab({ rules }) {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const rows = rules.filter(r => !term || [...r.antecedent, ...r.consequent].some(p => p.toLowerCase().includes(term)))
  return (
    <>
      <div className="table-tools">
        <label className="field">
          <span>Search</span>
          <input type="search" placeholder="Product name" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <span className="muted tool-count">{rows.length} of {rules.length} rules</span>
        <button type="button" className="btn btn-white small push-right" onClick={() => downloadText('basketflix_rules.csv', rulesCsv(rows))}>
          <DownloadIcon size={18} /> Download rules CSV
        </button>
      </div>
      <SortableTable label="Association rules" columns={RULE_COLUMNS} rows={rows} initialSort={{ key: 'leverage', dir: 'desc' }} rowKey={r => ruleLabel(r)} />
    </>
  )
}

function liftColor(lift, maxLift) {
  const t = Math.max(0, Math.min(1, (lift - 1) / Math.max(0.01, maxLift - 1)))
  return `hsl(${45 + t * 90}, 75%, ${55 - t * 8}%)`
}

function ScatterPlot({ rules }) {
  const [tip, setTip] = useState(null)
  const wrapRef = useRef(null)
  const W = 720, H = 420, P = { l: 56, r: 20, t: 20, b: 48 }
  const maxX = Math.max(...rules.map(r => r.support), 0.01) * 1.1
  const maxLift = Math.max(...rules.map(r => r.lift), 1.01)
  const x = v => P.l + (v / maxX) * (W - P.l - P.r)
  const y = v => H - P.b - v * (H - P.t - P.b)
  const xTicks = Array.from({ length: 5 }, (_, i) => (maxX / 4) * i)
  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  const show = (r, cx, cy) => setTip({ r, left: `${(cx / W) * 100}%`, top: `${(cy / H) * 100}%` })

  return (
    <div className="scatter-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatter plot of rules: support on the horizontal axis, confidence on the vertical axis, colour and size show lift">
        {yTicks.map(t => (
          <g key={`y${t}`}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="grid-line" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="axis-text">{pct(t)}%</text>
          </g>
        ))}
        {xTicks.map(t => (
          <g key={`x${t}`}>
            <line x1={x(t)} x2={x(t)} y1={P.t} y2={H - P.b} className="grid-line" />
            <text x={x(t)} y={H - P.b + 18} textAnchor="middle" className="axis-text">{supportPct(t)}%</text>
          </g>
        ))}
        <text x={(W + P.l) / 2} y={H - 8} textAnchor="middle" className="axis-title">Support (share of all baskets)</text>
        <text transform={`translate(14 ${(H - P.b) / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">Confidence</text>
        {rules.map(r => {
          const cx = x(r.support), cy = y(r.confidence)
          return (
            <circle key={ruleLabel(r)} cx={cx} cy={cy} r={4 + Math.min(10, (r.lift - 1) * 3)} fill={liftColor(r.lift, maxLift)}
              className="dot" tabIndex={0} aria-label={`${ruleLabel(r)}: support ${supportPct(r.support)}%, confidence ${pct(r.confidence)}%, lift ${r.lift.toFixed(2)}`}
              onMouseEnter={() => show(r, cx, cy)} onMouseLeave={() => setTip(null)} onFocus={() => show(r, cx, cy)} onBlur={() => setTip(null)} />
          )
        })}
      </svg>
      {tip && (
        <div className="scatter-tip" style={{ left: tip.left, top: tip.top }}>
          <strong>{ruleLabel(tip.r)}</strong>
          <span>Support {supportPct(tip.r.support)}% · Confidence {pct(tip.r.confidence)}% · Lift {tip.r.lift.toFixed(2)}</span>
        </div>
      )}
      <div className="scatter-legend">
        <span>Lift:</span>
        <span className="legend-dot" style={{ background: liftColor(1, maxLift) }} /> near 1
        <span className="legend-dot big" style={{ background: liftColor(maxLift, maxLift) }} /> {maxLift.toFixed(1)} (larger dot = higher lift)
      </div>
    </div>
  )
}

function OverviewTab({ results }) {
  const { settings } = results
  const top = results.bundles[0]
  const b = top?.best_rule
  const A = b ? joinProducts(b.antecedent) : 'A'
  const B = b ? joinProducts(b.consequent) : 'B'
  const f = v => v.toFixed(3)
  return (
    <div className="overview">
      <section>
        <h3>Settings used</h3>
        <div className="settings-grid">
          <div className="setting"><span className="setting-value">{supportPct(settings.min_support)}%</span><span className="muted">Minimum support</span></div>
          <div className="setting"><span className="setting-value">{pct(settings.min_confidence)}%</span><span className="muted">Minimum confidence</span></div>
          <div className="setting"><span className="setting-value">{formatNumber(settings.transactions)}</span><span className="muted">Transactions (baskets)</span></div>
        </div>
      </section>
      <section>
        <h3>Glossary</h3>
        {top && <p className="muted">Worked examples use the top bundle, {getBundleTitle(top.items)}, with the rule {ruleLabel(b)}.</p>}
        <div className="glossary">
          <div className="gloss-card">
            <h4>Support</h4>
            <p>How often products appear together across all baskets.</p>
            <code className="formula">support(A and B) = baskets with A and B ÷ all baskets</code>
            {top && <code className="formula example">{formatNumber(top.count)} ÷ {formatNumber(settings.transactions)} = {f(b.support)} ({supportPct(b.support)}%)</code>}
          </div>
          <div className="gloss-card">
            <h4>Confidence</h4>
            <p>Of baskets with A, the share that also contain B.</p>
            <code className="formula">confidence = support(A and B) ÷ support(A)</code>
            {top && <code className="formula example">{f(b.support)} ÷ {f(b.antecedent_support)} = {f(b.confidence)} ({pct(b.confidence)}% of baskets with {A} also contain {B})</code>}
          </div>
          <div className="gloss-card">
            <h4>Lift</h4>
            <p>{LIFT_TOOLTIP}.</p>
            <code className="formula">lift = confidence ÷ support(B)</code>
            {top && <code className="formula example">{f(b.confidence)} ÷ {f(b.consequent_support)} = {b.lift.toFixed(2)}</code>}
          </div>
          <div className="gloss-card">
            <h4>Leverage</h4>
            <p>Extra share of baskets with both, compared with chance. Above 0 means more than chance.</p>
            <code className="formula">leverage = support(A and B) − support(A) × support(B)</code>
            {top && <code className="formula example">{f(b.support)} − {f(b.antecedent_support)} × {f(b.consequent_support)} = {f(b.leverage)}</code>}
          </div>
        </div>
        {top && <p className="muted strength-note">Top bundle strength: <StrengthBadge strength={top.strength} /></p>}
      </section>
      <section>
        <h3>Rules at a glance</h3>
        <ScatterPlot rules={results.rules} />
      </section>
    </div>
  )
}

const TABS = [['itemsets', 'Frequent itemsets'], ['rules', 'Association rules'], ['overview', 'Overview']]

export default function Report({ results }) {
  const [tab, setTab] = useState('itemsets')
  const tabRefs = useRef({})
  const onKey = (e) => {
    const i = TABS.findIndex(([id]) => id === tab)
    let next = null
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length][0]
    if (e.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length][0]
    if (next) {
      e.preventDefault()
      setTab(next)
      tabRefs.current[next]?.focus()
    }
  }
  return (
    <main className="report-page" id="report">
      <h1 className="page-title">Apriori report</h1>
      <p className="muted page-sub">Every frequent itemset and association rule found in your data.</p>
      <div className="tabs" role="tablist" aria-label="Report sections" onKeyDown={onKey}>
        {TABS.map(([id, label]) => (
          <button key={id} ref={el => { tabRefs.current[id] = el }} type="button" role="tab" id={`tab-${id}`}
            aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} className="tab" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-panel">
        {tab === 'itemsets' && <ItemsetsTab itemsets={results.itemsets} />}
        {tab === 'rules' && <RulesTab rules={results.rules} />}
        {tab === 'overview' && <OverviewTab results={results} />}
      </div>
    </main>
  )
}
