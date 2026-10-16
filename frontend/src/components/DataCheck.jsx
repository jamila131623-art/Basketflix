export default function DataCheck({ result, error }) {
  if (error) {
    return (
      <div className="data-check-card error">
        <div className="data-check-icon">⚠️</div>
        <h3>Data check failed</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="data-check-card success">
        <div className="data-check-icon">✓</div>
        <h3>Data check passed</h3>
        <div className="data-check-stats">
          <div className="check-stat">
            <span className="stat-label">Transactions</span>
            <span className="stat-value">{result.transactions}</span>
          </div>
          <div className="check-stat">
            <span className="stat-label">Products</span>
            <span className="stat-value">{result.products}</span>
          </div>
          <div className="check-stat">
            <span className="stat-label">Avg basket</span>
            <span className="stat-value">{result.avg_basket}</span>
          </div>
          <div className="check-stat">
            <span className="stat-label">Rows used</span>
            <span className="stat-value">{result.rows_used}</span>
          </div>
          {result.duplicates_removed > 0 && (
            <div className="check-stat">
              <span className="stat-label">Duplicates removed</span>
              <span className="stat-value">{result.duplicates_removed}</span>
            </div>
          )}
        </div>
        <p className="success-message">This file is ready for analysis</p>
      </div>
    );
  }

  return null;
}
