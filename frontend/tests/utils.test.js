import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getProductEmoji, confidenceSentence, supportSentence, liftSentence, dedupeBundles, relatedBundles,
  hiddenGems, getSuggestions, filterBundles, bundleListCsv
} from '../src/utils.js'

const mk = (items, o = {}) => ({
  id: items.join('|'), items, size: items.length, count: o.count ?? 10, support: o.support ?? 0.1, score: o.score ?? 0.01,
  best_rule: { antecedent: [items[0]], consequent: items.slice(1), confidence: o.conf ?? 0.8, lift: o.lift ?? 2 }
})

test('emoji map covers sample products and never returns bare letters', () => {
  for (const p of ['Parmesan', 'Cheese', 'Pasta Sauce', 'Salsa', 'Sugar', 'Cookies', 'Orange Juice', 'Onions', 'Rice',
    'Yogurt', 'Apples', 'Bananas', 'Coffee', 'Soda', 'Chips', 'Eggs', 'Bacon', 'Butter', 'Milk', 'Bread', 'Pasta', 'Cereal']) {
    const e = getProductEmoji(p)
    assert.ok(e && !/^[A-Za-z]$/.test(e), `${p} -> ${e}`)
  }
  assert.equal(getProductEmoji('Goat Cheese'), getProductEmoji('Cheese'))
  assert.equal(getProductEmoji('Xyzzy'), null)
})

test('sentences use confidence, support and lift templates', () => {
  const d = { antecedent: ['Bread'], consequent: ['Butter'], confidence: 0.92 }
  assert.equal(confidenceSentence(d), '92% of baskets that contain Bread also contain Butter')
  assert.equal(supportSentence({ support: 0.25, count: 100 }, 400), 'Found together in 25% of all baskets (100 of 400)')
  assert.equal(liftSentence(2.345), '2.3x more often than chance')
})

test('dedupe and related bundles by unordered product set', () => {
  const list = [mk(['Bread', 'Milk']), mk(['Milk', 'Bread']), mk(['Bread', 'Butter', 'Milk'])]
  assert.equal(dedupeBundles(list).length, 2)
  const rel = relatedBundles(list[0], list)
  assert.deepEqual(rel.map(b => b.items.join('+')), ['Bread+Butter+Milk'])
})

test('hidden gems need lift >= 1.5, count >= 5 and below-median support', () => {
  const list = [mk(['A', 'B'], { support: 0.3 }), mk(['C', 'D'], { support: 0.045, lift: 3 }),
    mk(['E', 'F'], { support: 0.05, lift: 1.2 }), mk(['G', 'H'], { support: 0.04, lift: 4, count: 3 })]
  assert.deepEqual(hiddenGems(list).map(b => b.id), ['C|D'])
})

test('suggestions use rules whose antecedent is inside the selection', () => {
  const rules = [
    { antecedent: ['Bread'], consequent: ['Butter'], confidence: 0.9, lift: 2 },
    { antecedent: ['Bread', 'Milk'], consequent: ['Butter'], confidence: 0.95, lift: 2.1 },
    { antecedent: ['Eggs'], consequent: ['Bacon'], confidence: 0.9, lift: 2 },
    { antecedent: ['Bread'], consequent: ['Milk'], confidence: 0.5, lift: 1.4 }
  ]
  const s = getSuggestions(['Bread'], rules)
  assert.deepEqual(s.map(r => r.consequent[0]), ['Butter', 'Milk'])
  assert.equal(getSuggestions(['Bread', 'Milk'], rules)[0].confidence, 0.95)
})

test('size filter, search and list CSV', () => {
  const list = [mk(['Bread', 'Milk']), mk(['Bread', 'Butter', 'Milk'])]
  assert.equal(filterBundles(list, { size: '3' }).length, 1)
  assert.equal(filterBundles(list, { search: 'butt' }).length, 1)
  assert.match(bundleListCsv(list), /^items,support,confidence,lift\nBread \+ Milk,0\.1000,0\.8000,2\.0000\n/)
})
