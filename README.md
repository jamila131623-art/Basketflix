# BasketFlix

**Live demo: https://basketflix.onrender.com**

A Netflix-themed market basket analysis app that recommends product bundles from supermarket transaction data using the Apriori algorithm. The app features a premium, cinematic UI with emoji-based product visualization, plain-language insights for store owners, and interactive bundle building tools.

## Features

- **Upload CSV transaction data** with strict validation and clear error messages
- **Apriori algorithm** (pure Python implementation) for discovering frequent itemsets and association rules
- **Netflix-inspired premium UI** with dark theme, cinematic gradients, and smooth animations
- **Emoji-based product visualization** - no external images needed
- **Plain-language insights** designed for non-technical store owners
- **Interactive Bundle Builder** - select products and see suggestions from your data
- **Multiple view modes**: Top 10, Most Popular, Hidden Gems, and personalized "Because you picked" rows
- **Responsive design** that works on desktop, tablet, and mobile
- **Accessibility features**: keyboard navigation, ARIA labels, reduced motion support

## Project Structure

```
basketflix/
  backend/
    main.py          # FastAPI backend with Apriori implementation
    requirements.txt # Python dependencies
    test_api.py      # Acceptance tests
  frontend/
    index.html       # HTML entry point
    package.json     # Node dependencies
    vite.config.js   # Vite configuration with API proxy
    src/
      main.jsx       # React entry point
      App.jsx        # Main React component
      sound.js       # Audio handling with Web Audio API fallback
      styles.css     # Netflix-style CSS with design system
      utils.js       # Emoji map, color generation, text helpers
      components/
        Navbar.jsx           # Navigation with scroll effects
        Hero.jsx             # Billboard hero section
        Row.jsx              # Netflix-style carousel rows
        BundleCard.jsx       # Individual bundle poster cards
        BundleModal.jsx      # Detail modal with plain language
        BundleBuilder.jsx    # Interactive bundle building tool
        Explainer.jsx        # How-to guide modal
        UploadPage.jsx       # Upload interface with poster background
        DataCheck.jsx        # Validation result display
        StatsStrip.jsx       # Statistics display
        Skeleton.jsx         # Loading skeleton components
  README.md
```

## Running the Project

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8000
```

The backend will be available at `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown by Vite)

## Live Deployment

The app is live at https://basketflix.onrender.com (Render free plan, redeploys automatically on every push to `main`; the first visit after idle can take up to a minute).

The `Dockerfile` builds the React frontend and serves it from the FastAPI backend as one web service. `render.yaml` deploys it on Render's free plan. To run the same container locally:

```bash
docker build -t basketflix .
docker run -p 8000:8000 basketflix
```

Then open http://localhost:8000.

## Accepted CSV Format

The app accepts only one strict CSV format:

- **Header must be exactly**: `transaction_id,item`
- **One row per item**: The same transaction_id repeats for each item in that basket
- **Example**:
  ```
  transaction_id,item
  T0001,Bread
  T0001,Butter
  T0002,Milk
  ```
- **Requirements**:
  - At least 20 transactions
  - At least 5 unique products
  - At least 10 transactions with 2+ items
  - Item names must be product names (not numbers)
  - File must be .csv under 10 MB

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/template.csv` - Download template CSV
- `GET /api/sample.csv` - Download sample dataset with planted patterns (Bread+Butter+Milk, etc.)
- `POST /api/validate` - Validate CSV without running analysis
- `POST /api/analyze` - Run Apriori analysis on CSV with customizable support/confidence thresholds

## UI Features

### Results Page

- **Hero Billboard**: Full-width gradient display of the #1 bundle with emoji art
- **Stats Strip**: Transaction count, products, average basket size, frequent sets, rules
- **Top 10 Bundles**: Netflix-style with large outlined numbers
- **Most Popular Combos**: Sorted by basket frequency
- **Hidden Gems**: Strong associations (high lift) that appear in fewer baskets
- **Because you picked [Product]**: Personalized recommendations based on search or bundle builder selection
- **Bundle Builder**: Interactive tool to build custom bundles with product suggestions

### Bundle Detail Modal

- Plain-language descriptions (e.g., "Shoppers who buy Bread also add Butter in 92% of baskets")
- Strength badges (Strong/Good/Mild) with tooltips
- Actionable suggestions for store owners
- "More like this" related bundles
- Technical details (Support, Confidence, Lift) in collapsible section

### Accessibility

- Full keyboard navigation
- ARIA labels on all interactive elements
- Escape key closes modals
- Reduced motion support
- Visible focus indicators
- Responsive breakpoints for mobile (375px+)

## Running Tests

```bash
cd backend
pytest test_api.py
```

All backend acceptance tests pass, covering:
- Sample dataset validation and analysis
- Error handling for invalid formats
- Edge cases (empty files, wrong headers, numeric data, etc.)
- No 500 errors for user-facing issues

## Building for Production

```bash
cd frontend
npm run build
```

The production build outputs to `dist/` with optimized CSS and JS.

## Design System

- **Colors**: Background #141414, Deep black #000, Surface #181818/#2f2f2f, Red #e50914, Green #46d369
- **Fonts**: Bebas Neue (wordmark only), Inter for body text
- **Motion**: 300ms ease-out transitions, respects prefers-reduced-motion
- **Responsive**: Desktop (1024px+), Tablet (768px-1023px), Mobile (375px-767px)

## Notes

- The app uses a Web Audio API synthesized sound for the intro (no external audio files required)
- Emoji mapping covers ~60 common grocery products; others show first letter
- All gradients are generated algorithmically from product names
- No external images, icons, or libraries beyond React and Vite
