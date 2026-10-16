import pytest
import io
import math
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    """Test health endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_template_csv_download():
    """Test template.csv is downloadable."""
    response = client.get("/api/template.csv")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    content = response.text
    assert "transaction_id,item" in content
    assert "basketflix_template.csv" in response.headers["content-disposition"]


def test_sample_csv_download():
    """Test sample.csv is downloadable."""
    response = client.get("/api/sample.csv")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    content = response.text
    assert "transaction_id,item" in content
    assert "basketflix_sample.csv" in response.headers["content-disposition"]


def test_sample_csv_passes_validate():
    """Test sample.csv passes validation."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/validate",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] == True
    assert data["transactions"] >= 20
    assert data["products"] >= 5


def test_sample_csv_passes_analyze():
    """Test sample.csv passes analysis and contains Bread+Butter+Milk."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()
    assert "bundles" in data
    assert "rules" in data

    # Check if Bread+Butter+Milk appears in top results
    found_bread_butter_milk = False
    for bundle in data["bundles"]:
        items = set(bundle["items"])
        if {"Bread", "Butter", "Milk"}.issubset(items):
            found_bread_butter_milk = True
            break
    assert found_bread_butter_milk, "Bread+Butter+Milk should appear in top results"


def test_empty_file():
    """Test empty file returns readable error."""
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(b""), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert len(response.json()["detail"]) > 0
    assert "empty" in response.json()["detail"].lower()


def test_txt_file():
    """Test .txt file returns readable error."""
    response = client.post(
        "/api/validate",
        files={"file": ("test.txt", io.BytesIO(b"transaction_id,item\nT1,Bread"), "text/plain")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "csv" in response.json()["detail"].lower()


def test_wrong_header():
    """Test wrong header returns readable error."""
    content = b"id,name\nT1,Bread\nT1,Butter"
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "transaction_id,item" in response.json()["detail"]


def test_extra_columns():
    """Test extra columns returns readable error."""
    content = b"transaction_id,item,price\nT1,Bread,2.50\nT1,Butter,1.50"
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "exactly 2 columns" in response.json()["detail"].lower()


def test_one_column():
    """Test one column returns readable error."""
    content = b"transaction_id\nT1\nT2"
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "exactly 2 columns" in response.json()["detail"].lower()


def test_blank_items():
    """Test blank items returns readable error."""
    content = b"transaction_id,item\nT1,\nT2,Bread"
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()


def test_mostly_numeric_items():
    """Test mostly numeric items returns readable error."""
    content = b"transaction_id,item\nT1,123\nT2,456\nT3,789\nT4,Bread"
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "numeric" in response.json()["detail"].lower()


def test_fewer_than_20_transactions():
    """Test fewer than 20 transactions returns readable error."""
    rows = [b"transaction_id,item"] + [f"T{i},Bread".encode() for i in range(10)]
    content = b"\n".join(rows)
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "20 transactions" in response.json()["detail"].lower()


def test_fewer_than_5_products():
    """Test fewer than 5 products returns readable error."""
    rows = [b"transaction_id,item"] + [f"T{i},{['Bread','Milk','Eggs'][i%3]}".encode() for i in range(30)]
    content = b"\n".join(rows)
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "5 unique products" in response.json()["detail"].lower()


def test_all_single_item_baskets():
    """Test all single-item baskets returns readable error."""
    rows = [b"transaction_id,item"] + [f"T{i},{['Bread','Milk','Eggs','Cheese','Butter'][i%5]}".encode() for i in range(30)]
    content = b"\n".join(rows)
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "multiple products" in response.json()["detail"].lower()


def test_bad_slider_values():
    """Test bad slider values returns readable error."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    # Test min_support too high
    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.6, "min_confidence": 0.3}
    )
    assert response.status_code == 422
    assert "detail" in response.json()

    # Test min_confidence too low
    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.01}
    )
    assert response.status_code == 422
    assert "detail" in response.json()


def test_settings_produce_no_bundles():
    """Test settings that produce no bundles returns readable error."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.5, "min_confidence": 0.99}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "no bundles" in response.json()["detail"].lower()


def test_binary_file_renamed():
    """Test binary file renamed to .csv returns readable error."""
    # Create a fake binary file
    content = b"\x00\x01\x02\x03\x04\x05" * 100
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()


def test_duplicate_rows():
    """Test file with duplicate rows works and reports duplicates_removed."""
    # Create a file with 20 transactions and some duplicates
    products = ['Bread', 'Butter', 'Milk', 'Eggs', 'Cheese']
    rows = [b"transaction_id,item"]
    for i in range(20):
        tid = f"T{i}"
        for j, product in enumerate(products):
            rows.append(f"{tid},{product}".encode())
            if i < 5 and j == 0:  # Add some duplicates for first product
                rows.append(f"{tid},{product}".encode())
    content = b"\n".join(rows)
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["duplicates_removed"] >= 1


def test_wide_format_rejected():
    """Test old wide format (single items column) is rejected."""
    content = b"transaction_id,items\nT1,Bread,Butter,Milk\nT2,Eggs,Cheese"
    response = client.post(
        "/api/validate",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "transaction_id,item" in response.json()["detail"]


def test_no_500_errors():
    """Ensure all error cases return 400/422, not 500."""
    error_cases = [
        ("empty.csv", b""),
        ("test.txt", b"transaction_id,item\nT1,Bread"),
        ("wrong_header.csv", b"id,name\nT1,Bread"),
        ("extra_cols.csv", b"transaction_id,item,price\nT1,Bread,2.50"),
        ("one_col.csv", b"transaction_id\nT1"),
        ("numeric.csv", b"transaction_id,item\nT1,123\nT2,456\nT3,789"),
    ]

    for filename, content in error_cases:
        response = client.post(
            "/api/validate",
            files={"file": (filename, io.BytesIO(content), "text/csv")}
        )
        assert response.status_code in [400, 422], f"Expected 400/422 for {filename}, got {response.status_code}"


def test_analyze_response_has_new_fields():
    """Test that analyze response includes new fields."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()

    # Check new fields exist
    assert "item_supports" in data
    assert "itemsets" in data
    assert "settings" in data
    assert "bundles" in data
    assert "rules" in data

    # Check settings structure
    assert "min_support" in data["settings"]
    assert "min_confidence" in data["settings"]
    assert "transactions" in data["settings"]


def test_no_infinity_or_nan():
    """Test that no Infinity or NaN appears in any response."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()

    def check_no_inf_nan(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                check_no_inf_nan(v)
        elif isinstance(obj, list):
            for item in obj:
                check_no_inf_nan(item)
        elif isinstance(obj, float):
            assert not math.isinf(obj), f"Found Infinity in response: {obj}"
            assert not math.isnan(obj), f"Found NaN in response: {obj}"

    check_no_inf_nan(data)


def test_bundles_unique_by_item_set():
    """Test that bundles are unique by unordered item set."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()

    # Extract item sets
    item_sets = [frozenset(b['items']) for b in data['bundles']]
    # Check no duplicates
    assert len(item_sets) == len(set(item_sets)), "Bundles should be unique by item set"


def test_every_bundle_has_all_directions():
    """Test that every bundle has directions for all splits."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()

    for bundle in data['bundles']:
        assert 'directions' in bundle
        assert len(bundle['directions']) > 0

        # For size 2, should have 2 directions (A->B and B->A)
        # For size 3, should have multiple directions
        items = bundle['items']
        expected_min_directions = 2 if len(items) == 2 else 3
        assert len(bundle['directions']) >= expected_min_directions


def test_conviction_null_when_confidence_1():
    """Test that conviction is null when confidence is 1."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()

    # Check rules with confidence = 1 have null conviction
    for rule in data['rules']:
        if rule['confidence'] == 1.0:
            assert rule['conviction'] is None, f"Conviction should be null when confidence is 1"


def test_rules_have_all_new_fields():
    """Test that rules have all new fields."""
    response = client.get("/api/sample.csv")
    sample_content = response.content

    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample_content), "text/csv")},
        data={"min_support": 0.02, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    data = response.json()

    if data['rules']:
        rule = data['rules'][0]
        assert 'antecedent_support' in rule
        assert 'consequent_support' in rule
        assert 'expected_support' in rule
        assert 'leverage' in rule
        assert 'conviction' in rule


# ===== Complete Apriori output, bundles and plain-language tests =====

from itertools import combinations as _combinations


def _sample_analysis(min_support=0.02, min_confidence=0.3):
    sample = client.get("/api/sample.csv").content
    response = client.post(
        "/api/analyze",
        files={"file": ("sample.csv", io.BytesIO(sample), "text/csv")},
        data={"min_support": min_support, "min_confidence": min_confidence}
    )
    assert response.status_code == 200
    return response.json()


def _always_together_csv():
    """Every basket with Salt also has Pepper, so Salt -> Pepper has confidence 1."""
    rows = ["transaction_id,item"]
    for i in range(30):
        tid = f"T{i:03d}"
        basket = ["Salt", "Pepper"] if i < 12 else ["Pepper"] if i < 18 else []
        basket += [["Bread", "Milk"], ["Eggs", "Bacon"], ["Rice", "Beans"]][i % 3]
        rows += [f"{tid},{item}" for item in basket]
    return "\n".join(rows).encode()


def _pct(value):
    return int(math.floor(value * 100 + 0.5))


def _walk_floats(obj):
    if isinstance(obj, dict):
        for v in obj.values():
            yield from _walk_floats(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _walk_floats(v)
    elif isinstance(obj, float):
        yield obj


def test_item_supports_complete_and_sorted():
    data = _sample_analysis()
    supports = data["item_supports"]
    assert supports, "Expected item supports"
    total = data["settings"]["transactions"]
    for s in supports:
        assert set(s) >= {"item", "count", "support"}
        assert s["support"] >= data["settings"]["min_support"]
        assert abs(s["support"] - s["count"] / total) < 1e-9
    assert [s["support"] for s in supports] == sorted((s["support"] for s in supports), reverse=True)
    assert len({s["item"] for s in supports}) == len(supports)


def test_itemsets_cover_sizes_1_to_3():
    data = _sample_analysis()
    itemsets = data["itemsets"]
    assert 0 < len(itemsets) <= 300
    sizes = {i["size"] for i in itemsets}
    assert sizes <= {1, 2, 3}
    assert {1, 2, 3} <= sizes
    for i in itemsets:
        assert len(i["items"]) == i["size"]
        assert abs(i["support"] - i["count"] / data["settings"]["transactions"]) < 1e-9
    assert ("Bread", "Butter", "Milk") in {tuple(i["items"]) for i in itemsets}


def test_rule_metrics_are_consistent():
    data = _sample_analysis()
    rules = data["rules"]
    assert 0 < len(rules) <= 100
    leverages = [r["leverage"] for r in rules]
    assert leverages == sorted(leverages, reverse=True)
    for r in rules:
        assert r["confidence"] >= data["settings"]["min_confidence"]
        assert r["lift"] > 1
        assert abs(r["expected_support"] - r["antecedent_support"] * r["consequent_support"]) < 1e-9
        assert abs(r["leverage"] - (r["support"] - r["expected_support"])) < 1e-9
        assert abs(r["confidence"] - r["support"] / r["antecedent_support"]) < 1e-9
        assert abs(r["lift"] - r["confidence"] / r["consequent_support"]) < 1e-9
        if r["confidence"] < 1:
            expected = (1 - r["consequent_support"]) / (1 - r["confidence"])
            assert abs(r["conviction"] - expected) < 1e-9


def test_bundle_shape_eligibility_and_ranking():
    data = _sample_analysis()
    bundles = data["bundles"]
    assert 0 < len(bundles) <= 60
    keys = {"id", "items", "size", "count", "support", "score", "strength", "best_rule", "directions"}
    for b in bundles:
        assert keys <= set(b)
        assert b["size"] == len(b["items"]) >= 2
        assert b["count"] >= 5
        assert any(d["lift"] > 1 for d in b["directions"])
        best = max(b["directions"], key=lambda d: d["leverage"])
        assert b["best_rule"]["leverage"] == best["leverage"]
        assert b["score"] == best["leverage"]
        lift = b["best_rule"]["lift"]
        expected = "Strong" if lift >= 2 else "Good" if lift >= 1.5 else "Mild"
        assert b["strength"] == expected
    scores = [b["score"] for b in bundles]
    assert scores == sorted(scores, reverse=True)
    assert len({b["id"] for b in bundles}) == len(bundles)
    assert ("Bread", "Butter", "Milk") in {tuple(b["items"]) for b in bundles}


def test_bundle_directions_are_every_split_exactly_once():
    data = _sample_analysis()
    for b in data["bundles"]:
        items = set(b["items"])
        expected = set()
        for k in range(1, len(items)):
            for antecedent in _combinations(sorted(items), k):
                expected.add((antecedent, tuple(sorted(items - set(antecedent)))))
        actual = [(tuple(d["antecedent"]), tuple(d["consequent"])) for d in b["directions"]]
        assert len(actual) == len(set(actual))
        assert set(actual) == expected
        assert len(actual) == (2 if len(items) == 2 else 6)


def test_below_threshold_directions_are_flagged_not_dropped():
    data = _sample_analysis(min_confidence=0.6)
    flagged = 0
    for b in data["bundles"]:
        for d in b["directions"]:
            assert d["below_threshold"] == (d["confidence"] < 0.6)
            flagged += d["below_threshold"]
    assert flagged > 0, "Expected some directions below a 60% confidence setting"


def test_settings_echo_request():
    data = _sample_analysis(min_support=0.03, min_confidence=0.4)
    assert data["settings"]["min_support"] == 0.03
    assert data["settings"]["min_confidence"] == 0.4
    assert data["settings"]["transactions"] == data["report"]["transactions"]


def test_hero_and_modal_sentence_uses_confidence_not_support():
    data = _sample_analysis()
    differing = 0
    for b in data["bundles"]:
        best = b["best_rule"]
        conf, sup = _pct(best["confidence"]), _pct(b["support"])
        assert b["headline"] == best["sentence"]
        assert b["headline"].startswith(f"{conf}% of baskets that contain ")
        for item in best["antecedent"] + best["consequent"]:
            assert item in b["headline"]
        for d in b["directions"]:
            assert d["sentence"].startswith(f"{_pct(d['confidence'])}% of baskets that contain ")
        if conf != sup:
            differing += 1
            assert not b["headline"].startswith(f"{sup}% ")
    assert differing > 0, "Sample should include bundles where confidence and support differ"


def test_always_together_conviction_null_and_json_safe():
    response = client.post(
        "/api/analyze",
        files={"file": ("always.csv", io.BytesIO(_always_together_csv()), "text/csv")},
        data={"min_support": 0.1, "min_confidence": 0.3}
    )
    assert response.status_code == 200
    assert "Infinity" not in response.text and "NaN" not in response.text
    data = response.json()
    for value in _walk_floats(data):
        assert not math.isinf(value) and not math.isnan(value)

    salt_rules = [r for r in data["rules"] if r["antecedent"] == ["Salt"] and r["consequent"] == ["Pepper"]]
    assert salt_rules and salt_rules[0]["confidence"] == 1.0
    assert salt_rules[0]["conviction"] is None

    bundle = next(b for b in data["bundles"] if b["items"] == ["Pepper", "Salt"])
    direction = next(d for d in bundle["directions"] if d["antecedent"] == ["Salt"])
    assert direction["confidence"] == 1.0
    assert direction["conviction"] is None
    for b in data["bundles"]:
        for d in b["directions"]:
            if d["confidence"] == 1.0:
                assert d["conviction"] is None
