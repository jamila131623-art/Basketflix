import { useRef } from 'react';
import DataCheck from './DataCheck';
import Skeleton from './Skeleton';

export default function UploadPage({
  serverStatus,
  file,
  validationResult,
  validationError,
  loading,
  minSupport,
  minConfidence,
  onFileSelect,
  onUseSample,
  onDownloadTemplate,
  onDownloadSample,
  onAnalyze,
  onMinSupportChange,
  onMinConfidenceChange
}) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-background">
        <div className="poster-grid">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="poster-tile">
              <span className="poster-emoji">{['🍞', '🥛', '🥚', '🧀', '🍎', '🍌', '☕', '🥤', '🍪', '🥬'][i % 10]}</span>
            </div>
          ))}
        </div>
        <div className="upload-overlay"></div>
      </div>

      <div className="upload-container">
        <div className="upload-card">
          <h1>Market Basket Analysis</h1>
          <p className="subtitle">Upload your supermarket transaction data to discover product bundles</p>

          <div className={`status-dot status-${serverStatus}`} />

          <div className="format-section">
            <h2>Your CSV must look exactly like this</h2>
            <table className="example-table">
              <thead>
                <tr>
                  <th>transaction_id</th>
                  <th>item</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>T0001</td>
                  <td>Bread</td>
                </tr>
                <tr>
                  <td>T0001</td>
                  <td>Butter</td>
                </tr>
                <tr>
                  <td>T0002</td>
                  <td>Milk</td>
                </tr>
              </tbody>
            </table>
            <ul className="format-rules">
              <li>Header must be exactly: transaction_id,item</li>
              <li>One row per item (same transaction_id repeats)</li>
              <li>At least 20 transactions</li>
              <li>Item names must be product names, not numbers</li>
              <li>File must be .csv under 10 MB</li>
            </ul>
            <div className="download-links">
              <button onClick={onDownloadTemplate} disabled={loading}>
                Download template
              </button>
              <button onClick={onDownloadSample} disabled={loading}>
                Download sample dataset
              </button>
            </div>
          </div>

          <div
            className={`upload-zone ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  onFileSelect(e.target.files[0]);
                }
              }}
              accept=".csv"
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="upload-prompt">
                <p>Drag and drop your CSV here, or click to browse</p>
              </div>
            )}
          </div>

          <button
            className="sample-button"
            onClick={onUseSample}
            disabled={loading}
          >
            Use sample dataset
          </button>

          <DataCheck result={validationResult} error={validationError} />

          <div className="sliders">
            <div className="slider-group">
              <label>
                Minimum support: {minSupport}%
                <span className="slider-description">Higher = fewer, more common bundles</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={minSupport}
                onChange={(e) => onMinSupportChange(parseFloat(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="slider-group">
              <label>
                Minimum confidence: {minConfidence}%
                <span className="slider-description">Higher = stronger, more reliable rules</span>
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={minConfidence}
                onChange={(e) => onMinConfidenceChange(parseFloat(e.target.value))}
                disabled={loading}
              />
            </div>
          </div>

          {!loading && (
            <button
              className="analyze-button"
              onClick={onAnalyze}
              disabled={!validationResult}
            >
              Analyse
            </button>
          )}

          {loading && (
            <div className="loading-skeleton">
              <Skeleton className="skeleton" style={{ height: '200px', marginBottom: '24px' }} />
              <Skeleton className="skeleton" style={{ height: '60px', marginBottom: '24px' }} />
              <Skeleton className="skeleton" style={{ height: '60px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
