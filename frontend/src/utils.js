// ===== Product emoji art =====

// Multi-word names checked first (most specific wins).
const PHRASES = [
  ['orange juice', '🧃'], ['apple juice', '🧃'], ['pasta sauce', '🥫'], ['tomato sauce', '🥫'],
  ['soy sauce', '🥫'], ['peanut butter', '🥜'], ['ice cream', '🍦'], ['hot dog', '🌭'],
  ['cream cheese', '🧀'], ['sour cream', '🥛'], ['olive oil', '🫒'], ['toilet paper', '🧻'],
  ['paper towel', '🧻'], ['dish soap', '🧼'], ['dog food', '🐶'], ['cat food', '🐱'],
  ['sweet potato', '🍠'], ['green tea', '🍵'], ['energy drink', '🥤'], ['sparkling water', '💧'],
  ['frozen pizza', '🍕'], ['baby food', '🍼'], ['corn flakes', '🥣'], ['french fries', '🍟']
]

// Single words. Keys are singular; plurals are normalised before lookup.
const WORDS = {
  bread: '🍞', loaf: '🍞', toast: '🍞', baguette: '🥖', bagel: '🥯', croissant: '🥐', bun: '🍞',
  butter: '🧈', margarine: '🧈', milk: '🥛', cream: '🥛', yogurt: '🍨', yoghurt: '🍨',
  cheese: '🧀', parmesan: '🧀', cheddar: '🧀', mozzarella: '🧀', brie: '🧀', feta: '🧀',
  egg: '🥚', bacon: '🥓', sausage: '🌭', ham: '🍖', chicken: '🍗', turkey: '🦃', beef: '🥩',
  steak: '🥩', meat: '🥩', pork: '🥓', mince: '🥩', fish: '🐟', salmon: '🍣', tuna: '🐟',
  shrimp: '🦐', prawn: '🦐', crab: '🦀', lobster: '🦞', sushi: '🍣', tofu: '🍱',
  apple: '🍎', banana: '🍌', orange: '🍊', lemon: '🍋', lime: '🍋', grape: '🍇',
  strawberry: '🍓', berry: '🍓', blueberry: '🫐', cherry: '🍒', peach: '🍑', pear: '🍐',
  pineapple: '🍍', mango: '🥭', watermelon: '🍉', melon: '🍈', kiwi: '🥝', coconut: '🥥',
  avocado: '🥑', tomato: '🍅', potato: '🥔', carrot: '🥕', onion: '🧅', garlic: '🧄',
  pepper: '🫑', chili: '🌶️', chilli: '🌶️', jalapeno: '🌶️', cucumber: '🥒', lettuce: '🥬',
  salad: '🥗', spinach: '🥬', cabbage: '🥬', kale: '🥬', broccoli: '🥦', corn: '🌽',
  mushroom: '🍄', eggplant: '🍆', aubergine: '🍆', bean: '🥫', pea: '🫛', peanut: '🥜',
  nut: '🥜', almond: '🥜', cashew: '🥜', walnut: '🥜', chestnut: '🌰',
  rice: '🍚', pasta: '🍝', spaghetti: '🍝', macaroni: '🍝', penne: '🍝', noodle: '🍜',
  ramen: '🍜', flour: '🌾', oat: '🌾', oatmeal: '🥣', cereal: '🥣', granola: '🥣', muesli: '🥣',
  sugar: '🍬', honey: '🍯', jam: '🍓', jelly: '🍇', syrup: '🍯', chocolate: '🍫', candy: '🍬',
  sweet: '🍬', cookie: '🍪', biscuit: '🍪', cake: '🍰', cupcake: '🧁', muffin: '🧁',
  donut: '🍩', doughnut: '🍩', pie: '🥧', pancake: '🥞', waffle: '🧇', popcorn: '🍿',
  chip: '🍟', crisp: '🍟', fries: '🍟', pretzel: '🥨', cracker: '🍘', salsa: '🌶️',
  dip: '🥣', hummus: '🥣', guacamole: '🥑', sauce: '🥫', ketchup: '🍅', mustard: '🌭',
  mayonnaise: '🥚', mayo: '🥚', soup: '🍲', stew: '🍲', can: '🥫', pizza: '🍕',
  burger: '🍔', sandwich: '🥪', taco: '🌮', tortilla: '🌮', burrito: '🌯', wrap: '🌯',
  coffee: '☕', espresso: '☕', tea: '🍵', juice: '🧃', soda: '🥤', cola: '🥤', pop: '🥤',
  lemonade: '🍋', water: '💧', beer: '🍺', ale: '🍺', lager: '🍺', wine: '🍷',
  champagne: '🍾', whiskey: '🥃', whisky: '🥃', vodka: '🥃', rum: '🥃', gin: '🥃',
  ice: '🧊', salt: '🧂', oil: '🫒', vinegar: '🍶', spice: '🌶️', herb: '🌿', basil: '🌿',
  diaper: '👶', nappy: '👶', baby: '🍼', soap: '🧼', shampoo: '🧴', lotion: '🧴',
  toothpaste: '🪥', toothbrush: '🪥', tissue: '🧻', napkin: '🧻', detergent: '🧺',
  battery: '🔋', candle: '🕯️', flower: '💐', pet: '🐾', dog: '🐶', cat: '🐱', snack: '🍿',
  dessert: '🍮', pudding: '🍮', smoothie: '🥤', frozen: '🧊', vegetable: '🥦', veg: '🥦',
  fruit: '🍎', drink: '🥤'
}

function singular(word) {
  if (WORDS[word]) return word
  if (word.endsWith('ies') && WORDS[word.slice(0, -3) + 'y']) return word.slice(0, -3) + 'y'
  if (word.endsWith('oes') && WORDS[word.slice(0, -2)]) return word.slice(0, -2)
  if (word.endsWith('es') && WORDS[word.slice(0, -2)]) return word.slice(0, -2)
  if (word.endsWith('s') && WORDS[word.slice(0, -1)]) return word.slice(0, -1)
  return word
}

// Returns an emoji for a product name, or null when nothing sensible matches.
export function getProductEmoji(productName) {
  const name = String(productName || '').toLowerCase().trim()
  if (!name) return null
  for (const [phrase, emoji] of PHRASES) {
    if (name.includes(phrase)) return emoji
  }
  const words = name.split(/[^a-z]+/).filter(Boolean).map(singular)
  // The last word is usually the product type ("Pasta Sauce" -> sauce, "Goat Cheese" -> cheese).
  for (let i = words.length - 1; i >= 0; i--) {
    if (WORDS[words[i]]) return WORDS[words[i]]
  }
  // Prefix match for compound words, e.g. "Cornflakes" -> corn, "Cheeseburger" -> cheese.
  for (const word of words) {
    const key = Object.keys(WORDS).find(k => k.length >= 4 && word.startsWith(k))
    if (key) return WORDS[key]
  }
  return null
}

export function productInitial(productName) {
  const match = String(productName || '').match(/[A-Za-z0-9]/)
  return match ? match[0].toUpperCase() : '?'
}

// ===== Colour =====

export function stringToHue(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash % 360)
}

export function getGradientForItems(items) {
  const hue = stringToHue(items.join('|'))
  const hue2 = (hue + 35) % 360
  return `radial-gradient(120% 90% at 85% 15%, hsla(${hue2}, 75%, 45%, 0.55) 0%, transparent 60%), linear-gradient(135deg, hsl(${hue}, 62%, 26%) 0%, hsl(${hue2}, 55%, 16%) 55%, hsl(${hue}, 45%, 8%) 100%)`
}

// ===== Number formatting =====

export function pct(value) {
  return Math.round(value * 100)
}

// Whole percent, with one decimal for small values so 0.4% does not show as 0%.
export function supportPct(value) {
  const v = value * 100
  if (v >= 10 || Number.isInteger(Math.round(v * 10) / 10)) return String(Math.round(v))
  return v.toFixed(1)
}

export function formatLift(lift) {
  return `${lift.toFixed(1)}x`
}

export function formatNumber(num) {
  return Number(num).toLocaleString('en-US')
}

export function formatDecimal(value, digits = 3) {
  return value === null || value === undefined ? '' : Number(value).toFixed(digits)
}

// ===== Plain-language wording (the only templates used in the UI) =====

export const LIFT_TOOLTIP = 'Lift above 1 means the products sell together more than random chance would predict'

export function joinProducts(items) {
  const list = [...items]
  if (list.length <= 2) return list.join(' and ')
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

// Always confidence: "{conf}% of baskets that contain {A} also contain {B}"
export function confidenceSentence(direction) {
  return `${pct(direction.confidence)}% of baskets that contain ${joinProducts(direction.antecedent)} also contain ${joinProducts(direction.consequent)}`
}

export function supportSentence(bundle, total) {
  return `Found together in ${supportPct(bundle.support)}% of all baskets (${formatNumber(bundle.count)} of ${formatNumber(total)})`
}

export function liftSentence(lift) {
  return `${formatLift(lift)} more often than chance`
}

export function boughtTogetherLabel(bundle) {
  return `${pct(bundle.best_rule.confidence)}% bought together`
}

export function ruleLabel(rule) {
  return `${rule.antecedent.join(' + ')} → ${rule.consequent.join(' + ')}`
}

export function getStrength(lift) {
  if (lift >= 2) return 'Strong'
  if (lift >= 1.5) return 'Good'
  return 'Mild'
}

export const STRENGTH_HELP = {
  Strong: 'Strong: bought together at least 2x more often than chance',
  Good: 'Good: bought together 1.5x to 2x more often than chance',
  Mild: 'Mild: bought together a little more often than chance (under 1.5x)'
}

export function getBundleTitle(items) {
  return items.join(' + ')
}

export function whatYouCanDo(bundle) {
  const best = bundle.best_rule
  const a = best.antecedent.join(' + ')
  const b = best.consequent.join(' + ')
  return [
    `Test placing ${b} next to ${a} for two weeks and compare sales of ${b} with the two weeks before.`,
    `Try a small "${getBundleTitle(bundle.items)}" combo price in one store or time slot and check whether basket value goes up.`,
    `Trial a prompt at checkout for shoppers buying ${a}: "Add ${b}?" and track how often it is accepted.`
  ]
}

// ===== Bundle selection =====

export function bundleKey(items) {
  return [...items].map(i => String(i).toLowerCase()).sort().join('|')
}

export function dedupeBundles(bundles) {
  const seen = new Set()
  return bundles.filter(b => {
    const key = bundleKey(b.items)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function filterBundles(bundles, { size = 'all', search = '' } = {}) {
  const term = search.trim().toLowerCase()
  return dedupeBundles(bundles).filter(b =>
    (size === 'all' || b.size === Number(size)) &&
    (!term || b.items.some(item => item.toLowerCase().includes(term)))
  )
}

export const topBundles = (bundles, n = 10) =>
  [...bundles].sort((a, b) => b.score - a.score).slice(0, n)

export const popularBundles = (bundles, n = 20) =>
  [...bundles].sort((a, b) => b.support - a.support || b.score - a.score).slice(0, n)

// Strong associations (lift >= 1.5) seen in at least 5 baskets but less often than the median bundle.
export function hiddenGems(bundles, allBundles = bundles, n = 20) {
  const cutoff = median(allBundles.map(b => b.support))
  return bundles
    .filter(b => b.best_rule.lift >= 1.5 && b.count >= 5 && b.support < cutoff)
    .sort((a, b) => b.best_rule.lift - a.best_rule.lift)
    .slice(0, n)
}

export function bundlesWithProduct(bundles, product, n = 20) {
  return bundles.filter(b => b.items.includes(product)).slice(0, n)
}

export function relatedBundles(bundle, bundles, n = 6) {
  const items = new Set(bundle.items)
  const key = bundleKey(bundle.items)
  return dedupeBundles(bundles)
    .filter(b => bundleKey(b.items) !== key && b.items.some(i => items.has(i)))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

// Rules whose antecedent is fully inside the selection, suggesting products not yet selected.
export function getSuggestions(selected, rules, n = 6) {
  if (!selected.length) return []
  const chosen = new Set(selected)
  const best = new Map()
  for (const rule of rules) {
    if (!rule.antecedent.every(p => chosen.has(p))) continue
    if (rule.consequent.some(p => chosen.has(p))) continue
    const key = bundleKey(rule.consequent)
    const current = best.get(key)
    if (!current || rule.confidence > current.confidence ||
        (rule.confidence === current.confidence && rule.lift > current.lift)) {
      best.set(key, rule)
    }
  }
  return [...best.values()]
    .sort((a, b) => b.confidence - a.confidence || b.lift - a.lift)
    .slice(0, n)
}

export function getAllProducts(results) {
  if (!results) return []
  return [...new Set(results.item_supports.map(s => s.item))].sort()
}

// ===== CSV / download =====

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n') + '\n'
}

export function downloadText(filename, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function bundleListCsv(bundles) {
  return toCsv(
    ['items', 'support', 'confidence', 'lift'],
    bundles.map(b => [b.items.join(' + '), b.support.toFixed(4), b.best_rule.confidence.toFixed(4), b.best_rule.lift.toFixed(4)])
  )
}

export function rulesCsv(rules) {
  return toCsv(
    ['antecedent', 'consequent', 'support', 'confidence', 'lift', 'leverage', 'conviction'],
    rules.map(r => [
      r.antecedent.join(' + '), r.consequent.join(' + '), r.support.toFixed(4), r.confidence.toFixed(4),
      r.lift.toFixed(4), r.leverage.toFixed(4), r.conviction === null ? 'always together' : r.conviction.toFixed(4)
    ])
  )
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}
