import random
import io
import logging
import math
from pathlib import Path
from typing import List, Set, Tuple, Dict, Optional
from collections import defaultdict

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===== Plain-language helpers =====

def to_percent(value: float) -> int:
    """Round half up, matching JavaScript Math.round for positive values."""
    return int(math.floor(value * 100 + 0.5))


def join_products(items) -> str:
    items = list(items)
    if len(items) <= 2:
        return ' and '.join(items)
    return ', '.join(items[:-1]) + ' and ' + items[-1]


def confidence_sentence(antecedent, consequent, confidence: float) -> str:
    """'{conf}% of baskets that contain {A} also contain {B}' - always uses confidence."""
    return (f"{to_percent(confidence)}% of baskets that contain {join_products(antecedent)} "
            f"also contain {join_products(consequent)}")


def bundle_id(items) -> str:
    return '|'.join(sorted(items)).lower().replace(' ', '-')


# ===== Apriori Algorithm (Pure Python, Level-wise, Max Size 3) =====

def apriori(
    transactions: List[Set[str]],
    min_support: float,
    min_confidence: float,
    max_itemset_size: int = 3
) -> Dict:
    """
    Level-wise Apriori algorithm implementation with complete output.
    Returns a dict with item_supports, itemsets, rules, and bundles.
    """
    n_transactions = len(transactions)
    min_count = min_support * n_transactions

    # Count single items
    item_counts = defaultdict(int)
    for trans in transactions:
        for item in trans:
            item_counts[frozenset([item])] += 1

    # Filter by support for L1
    L1 = {itemset: count for itemset, count in item_counts.items() if count >= min_count}
    frequent_itemsets = L1.copy()

    # Generate candidates of size 2
    L2 = {}
    if len(L1) >= 2:
        items = list(set().union(*L1.keys()))
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                candidate = frozenset([items[i], items[j]])
                count = sum(1 for trans in transactions if candidate.issubset(trans))
                if count >= min_count:
                    L2[candidate] = count
        frequent_itemsets.update(L2)

    # Generate candidates of size 3
    L3 = {}
    if len(L2) >= 2 and max_itemset_size >= 3:
        l2_keys = list(L2.keys())
        for i in range(len(l2_keys)):
            for j in range(i + 1, len(l2_keys)):
                set1 = l2_keys[i]
                set2 = l2_keys[j]
                union = set1 | set2
                if len(union) == 3:
                    count = sum(1 for trans in transactions if union.issubset(trans))
                    if count >= min_count:
                        L3[frozenset(union)] = count
        frequent_itemsets.update(L3)

    # Build item_supports (single items only)
    item_supports = []
    for itemset, count in L1.items():
        item = list(itemset)[0]
        item_supports.append({
            'item': item,
            'count': int(count),
            'support': float(count / n_transactions)
        })
    item_supports.sort(key=lambda x: x['support'], reverse=True)

    # Build itemsets (all frequent itemsets, up to 300)
    itemsets_list = []
    for itemset, count in frequent_itemsets.items():
        itemsets_list.append({
            'items': tuple(sorted(itemset)),
            'size': len(itemset),
            'count': int(count),
            'support': float(count / n_transactions)
        })
    itemsets_list.sort(key=lambda x: (-x['support'], x['size'], x['items']))
    itemsets_list = itemsets_list[:300]

    # Generate rules with complete metrics
    rules = []
    for itemset, count_ab in frequent_itemsets.items():
        if len(itemset) < 2:
            continue
        support_ab = count_ab / n_transactions
        items = list(itemset)
        for i in range(1, len(items)):
            for antecedent_tuple in combinations(items, i):
                antecedent = frozenset(antecedent_tuple)
                consequent = itemset - antecedent
                count_a = sum(1 for trans in transactions if antecedent.issubset(trans))
                if count_a == 0:
                    continue
                support_a = count_a / n_transactions
                confidence = support_ab / support_a
                count_b = sum(1 for trans in transactions if consequent.issubset(trans))
                support_b = count_b / n_transactions
                if support_b == 0:
                    continue
                lift = support_ab / (support_a * support_b)
                leverage = support_ab - support_a * support_b
                expected_support = support_a * support_b

                # Conviction: (1 - support_b) / (1 - confidence) if confidence < 1, else null
                conviction = None
                if confidence < 1:
                    if (1 - confidence) > 0:
                        conviction = (1 - support_b) / (1 - confidence)
                    else:
                        conviction = float('inf')
                if conviction is not None and (math.isinf(conviction) or math.isnan(conviction)):
                    conviction = None

                rules.append({
                    'antecedent': tuple(sorted(antecedent)),
                    'consequent': tuple(sorted(consequent)),
                    'support': float(support_ab),
                    'confidence': float(confidence),
                    'lift': float(lift),
                    'leverage': float(leverage),
                    'conviction': conviction,
                    'antecedent_support': float(support_a),
                    'consequent_support': float(support_b),
                    'expected_support': float(expected_support),
                    'count': int(count_ab)
                })

    # Build bundles (unique itemsets size >= 2, with all directions)
    bundles_dict = {}  # key: frozenset of items
    for itemset, count in frequent_itemsets.items():
        if len(itemset) < 2:
            continue
        if count < 5:
            continue

        items_tuple = tuple(sorted(itemset))
        items_set = frozenset(items_tuple)

        # Get all rules for this itemset
        itemset_rules = []
        for r in rules:
            antec_set = set(r["antecedent"])
            conseq_set = set(r["consequent"])
            if antec_set | conseq_set == items_set:
                itemset_rules.append(r)

        # Check if at least one direction has lift > 1
        has_lift_gt_1 = any(r['lift'] > 1 for r in itemset_rules)
        if not has_lift_gt_1:
            continue

        # Get all directions (splits of the itemset)
        directions = []
        for rule in itemset_rules:
            directions.append({
                'antecedent': rule['antecedent'],
                'consequent': rule['consequent'],
                'support': rule['support'],
                'count': rule['count'],
                'confidence': rule['confidence'],
                'lift': rule['lift'],
                'leverage': rule['leverage'],
                'conviction': rule['conviction'],
                'antecedent_support': rule['antecedent_support'],
                'consequent_support': rule['consequent_support'],
                'expected_support': rule['expected_support'],
                'below_threshold': rule['confidence'] < min_confidence,
                'sentence': confidence_sentence(rule['antecedent'], rule['consequent'], rule['confidence'])
            })
        directions.sort(key=lambda d: (len(d['antecedent']), d['antecedent']))

        # Find best direction by leverage
        best_direction = max(directions, key=lambda d: d['leverage'])
        score = best_direction['leverage']

        # Determine strength
        if best_direction['lift'] >= 2:
            strength = 'Strong'
        elif best_direction['lift'] >= 1.5:
            strength = 'Good'
        else:
            strength = 'Mild'

        bundles_dict[items_set] = {
            'id': bundle_id(items_tuple),
            'items': items_tuple,
            'size': len(itemset),
            'count': int(count),
            'support': float(count / n_transactions),
            'score': float(score),
            'strength': strength,
            'best_rule': best_direction,
            'headline': best_direction['sentence'],
            'directions': directions
        }

    # Convert to list and sort by score
    bundles = list(bundles_dict.values())
    bundles.sort(key=lambda x: (-x['score'], x['items']))
    bundles = bundles[:60]

    # Convert to native types and ensure no NaN/Infinity
    for r in rules:
        r['support'] = float(r['support'])
        r['confidence'] = float(r['confidence'])
        r['lift'] = float(r['lift'])
        r['leverage'] = float(r['leverage'])
        r['antecedent_support'] = float(r['antecedent_support'])
        r['consequent_support'] = float(r['consequent_support'])
        r['expected_support'] = float(r['expected_support'])
        r['count'] = int(r['count'])
        if r['conviction'] is not None:
            r['conviction'] = float(r['conviction'])

    for b in bundles:
        b['support'] = float(b['support'])
        b['score'] = float(b['score']) if b['score'] is not None else 0.0
        b['count'] = int(b['count'])
        for d in b['directions']:
            d['support'] = float(d['support'])
            d['confidence'] = float(d['confidence'])
            d['lift'] = float(d['lift'])
            d['leverage'] = float(d['leverage'])
            if d['conviction'] is not None:
                d['conviction'] = float(d['conviction'])

    return {
        'item_supports': item_supports,
        'itemsets': itemsets_list,
        'rules': rules,
        'bundles': bundles
    }


def combinations(iterable, r):
    """Simple combinations generator."""
    pool = tuple(iterable)
    n = len(pool)
    if r > n:
        return
    indices = list(range(r))
    yield tuple(pool[i] for i in indices)
    while True:
        for i in reversed(range(r)):
            if indices[i] != i + n - r:
                break
        else:
            return
        indices[i] += 1
        for j in range(i + 1, r):
            indices[j] = indices[j - 1] + 1
        yield tuple(pool[i] for i in indices)


# ===== Dataset Validation =====

def validate_dataset(file_content: bytes, filename: str) -> Dict:
    """
    Run all dataset checks. Returns either a success dict or raises HTTPException.
    """
    # Check 1: filename must end in .csv
    if not filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="The file must be a CSV with a .csv extension."
        )

    # Check 2: file not empty, under 10 MB, parse as CSV
    if len(file_content) == 0:
        raise HTTPException(
            status_code=400,
            detail="The file is empty. Please upload a CSV file with data."
        )
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="The file is too large. Please upload a file under 10 MB."
        )

    # Try reading as UTF-8 with BOM handling, fallback to latin-1
    try:
        text = file_content.decode('utf-8-sig')
    except UnicodeDecodeError:
        try:
            text = file_content.decode('latin-1')
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="This file could not be read as a comma-separated CSV."
            )

    # Parse with pandas
    try:
        df = pd.read_csv(io.StringIO(text), sep=',', dtype=str)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="This file could not be read as a comma-separated CSV."
        )

    # Check 3: exactly 2 columns with correct names
    if len(df.columns) != 2:
        raise HTTPException(
            status_code=400,
            detail="The CSV must have exactly 2 columns: transaction_id and item."
        )

    # Normalize column names for comparison
    expected_cols = ['transaction_id', 'item']
    actual_cols = [str(col).strip().lower() for col in df.columns]
    if actual_cols != expected_cols:
        raise HTTPException(
            status_code=400,
            detail="The CSV header must be exactly: transaction_id,item"
        )

    # Rename to standard names
    df.columns = ['transaction_id', 'item']

    # Check 4: drop blank rows, check remaining count
    blank_mask = (df['transaction_id'].isna() | (df['transaction_id'].astype(str).str.strip() == '') |
                  df['item'].isna() | (df['item'].astype(str).str.strip() == ''))
    blank_rows_removed = blank_mask.sum()
    df = df[~blank_mask].copy()

    if len(df) == 0:
        raise HTTPException(
            status_code=400,
            detail="The file contains no valid data rows after removing blank entries."
        )
    if len(df) > 500000:
        raise HTTPException(
            status_code=400,
            detail="The file has too many rows. Please limit to 500,000 rows."
        )

    # Check 5: normalize items, drop duplicates
    df['item'] = df['item'].astype(str).str.strip().str.title()
    initial_rows = len(df)
    df = df.drop_duplicates(subset=['transaction_id', 'item'], keep='first')
    duplicates_removed = initial_rows - len(df)

    # Check 6: item names must look like product names
    numeric_count = df['item'].str.match(r'^\d+$').sum()
    if numeric_count / len(df) > 0.5:
        raise HTTPException(
            status_code=400,
            detail="This file looks like numeric data, not product names. The item column must contain product names such as Bread or Milk."
        )
    if (df['item'].str.len() > 100).any():
        raise HTTPException(
            status_code=400,
            detail="Some item names are too long. Item names must be 100 characters or less."
        )

    # Check 7: at least 20 transactions
    transaction_count = df['transaction_id'].nunique()
    if transaction_count < 20:
        raise HTTPException(
            status_code=400,
            detail="The file must contain at least 20 transactions."
        )

    # Check 8: at least 5 unique products
    product_count = df['item'].nunique()
    if product_count < 5:
        raise HTTPException(
            status_code=400,
            detail="The file must contain at least 5 unique products."
        )

    # Check 9: at least 10 transactions with 2+ items
    basket_sizes = df.groupby('transaction_id').size()
    baskets_with_2plus = (basket_sizes >= 2).sum()
    if baskets_with_2plus < 10:
        raise HTTPException(
            status_code=400,
            detail="Most baskets contain only one item, so no bundles can be found. Bundles need baskets with multiple products."
        )

    # Check 10: average basket size at least 1.5
    avg_basket = basket_sizes.mean()
    if avg_basket < 1.5:
        raise HTTPException(
            status_code=400,
            detail="The average basket size is too small. Most baskets need multiple items to find bundles."
        )

    # Check 11: at most 5000 unique products
    if product_count > 5000:
        raise HTTPException(
            status_code=400,
            detail="The file has too many unique products. Please limit to 5,000 products."
        )

    return {
        'ok': True,
        'transactions': int(transaction_count),
        'products': int(product_count),
        'rows_used': int(len(df)),
        'duplicates_removed': int(duplicates_removed),
        'blank_rows_removed': int(blank_rows_removed),
        'avg_basket': float(round(avg_basket, 2)),
        'baskets_with_2plus_items': int(baskets_with_2plus),
        'df': df
    }


# ===== Endpoints =====

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/template.csv")
def get_template():
    """Download a small template CSV."""
    content = """transaction_id,item
T0001,Bread
T0001,Butter
T0002,Milk
T0002,Eggs
T0003,Coffee
T0003,Sugar
T0004,Pasta
T0004,Pasta Sauce
"""
    return StreamingResponse(
        io.BytesIO(content.encode('utf-8')),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="basketflix_template.csv"'}
    )


@app.get("/api/sample.csv")
def get_sample():
    """Generate a seeded sample dataset with planted combos."""
    rng = random.Random(42)
    items = [
        'Bread', 'Butter', 'Milk', 'Eggs', 'Bacon', 'Orange Juice',
        'Pasta', 'Pasta Sauce', 'Parmesan', 'Chips', 'Soda', 'Salsa',
        'Coffee', 'Sugar', 'Cookies', 'Yogurt', 'Cereal', 'Bananas',
        'Apples', 'Cheese'
    ]

    combos = [
        ['Bread', 'Butter', 'Milk'],
        ['Pasta', 'Pasta Sauce', 'Parmesan'],
        ['Chips', 'Soda', 'Salsa'],
        ['Coffee', 'Sugar', 'Cookies'],
        ['Eggs', 'Bacon', 'Orange Juice']
    ]

    rows = []
    for combo in combos:
        for i in range(20):
            tid = f'T{i:04d}_{combos.index(combo)}'
            for item in combo:
                rows.append([tid, item])

    start_idx = len(rows)
    for i in range(start_idx, 400):
        tid = f'T{i:04d}'
        basket_size = rng.randint(1, 4)
        basket = rng.sample(items, basket_size)
        for item in basket:
            rows.append([tid, item])

    tids = list(set(r[0] for r in rows))
    rng.shuffle(tids)
    tid_map = {old: f'T{i:04d}' for i, old in enumerate(tids)}

    final_rows = []
    for tid, item in rows:
        final_rows.append([tid_map[tid], item])

    final_rows.sort(key=lambda x: x[0])

    content = 'transaction_id,item\n' + '\n'.join(f'{tid},{item}' for tid, item in final_rows)
    return StreamingResponse(
        io.BytesIO(content.encode('utf-8')),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="basketflix_sample.csv"'}
    )


@app.post("/api/validate")
async def validate(file: UploadFile = File(...)):
    """Validate dataset without running Apriori."""
    try:
        content = await file.read()
        result = validate_dataset(content, file.filename)
        df = result.pop('df')
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in validate: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while analysing this file. Please check it matches the template."
        )


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    min_support: float = Form(0.02),
    min_confidence: float = Form(0.3)
):
    """Validate dataset and run Apriori analysis."""
    try:
        if not (0.001 <= min_support <= 0.5):
            raise HTTPException(
                status_code=422,
                detail="Minimum support must be between 0.001 and 0.5."
            )
        if not (0.05 <= min_confidence <= 1.0):
            raise HTTPException(
                status_code=422,
                detail="Minimum confidence must be between 0.05 and 1.0."
            )

        content = await file.read()
        result = validate_dataset(content, file.filename)
        df = result.pop('df')

        transactions = df.groupby('transaction_id')['item'].apply(set).tolist()

        apriori_result = apriori(transactions, min_support, min_confidence, max_itemset_size=3)

        # Check: too many products pass support
        items_passing_support = set()
        for itemset in apriori_result['itemsets']:
            items_passing_support.update(itemset['items'])
        if len(items_passing_support) > 300:
            raise HTTPException(
                status_code=400,
                detail="Too many products pass this support level. Raise the minimum support."
            )

        # Filter rules by min_confidence and lift > 1
        filtered_rules = [
            r for r in apriori_result['rules']
            if r['confidence'] >= min_confidence and r['lift'] > 1
        ]

        if not filtered_rules:
            raise HTTPException(
                status_code=400,
                detail="No bundles were found at these settings. Try lowering minimum support or confidence."
            )

        # Rank rules by leverage, max 100
        filtered_rules.sort(key=lambda x: x['leverage'], reverse=True)
        filtered_rules = filtered_rules[:100]

        return {
            'report': result,
            'summary': {
                'frequent_itemsets': len(apriori_result['itemsets']),
                'rules': len(filtered_rules)
            },
            'item_supports': apriori_result['item_supports'],
            'itemsets': apriori_result['itemsets'],
            'rules': filtered_rules,
            'bundles': apriori_result['bundles'],
            'settings': {
                'min_support': float(min_support),
                'min_confidence': float(min_confidence),
                'transactions': int(result['transactions'])
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while analysing this file. Please check it matches the template."
        )


# Serve the built frontend (single-service deploy). Must stay after the API routes.
FRONTEND_DIST = Path(__file__).resolve().parent.parent / 'frontend' / 'dist'
if FRONTEND_DIST.is_dir():
    app.mount('/', StaticFiles(directory=FRONTEND_DIST, html=True), name='frontend')
