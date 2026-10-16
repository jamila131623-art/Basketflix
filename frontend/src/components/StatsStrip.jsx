import { formatNumber } from '../utils';

export default function StatsStrip({ report, summary }) {
  return (
    <div className="stats-strip">
      <div className="stat-item">
        <span className="stat-value">{formatNumber(report.transactions)}</span>
        <span className="stat-label">Transactions</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{formatNumber(report.products)}</span>
        <span className="stat-label">Products</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{report.avg_basket}</span>
        <span className="stat-label">Avg basket</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{formatNumber(summary.frequent_itemsets)}</span>
        <span className="stat-label">Frequent sets</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{formatNumber(summary.rules)}</span>
        <span className="stat-label">Rules</span>
      </div>
    </div>
  );
}
