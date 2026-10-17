import { totals, formatMoney } from './calc.js'
import { PRESETS, makeState, clearMeal, uid } from './presets.js'

const KEY = 'sushi-otoko'
const $ = (sel) => document.querySelector(sel)

let state = load()
let editingExtra = null // 正在編輯的其他項目 id，null = 新增
const cells = new Map() // tier id → DOM 節點，點一下只更新那一個

/* ── 存檔 ───────────────────────────────── */

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const s = raw && JSON.parse(raw)
    if (s?.version === 1 && Array.isArray(s.tiers) && s.tiers.length) return s
  } catch {
    /* 壞掉的資料直接用預設覆蓋 */
  }
  return makeState(PRESETS[0])
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 無痕模式可能寫不進去，不影響當次使用 */
  }
}

/* ── 畫面 ───────────────────────────────── */

function renderAll() {
  $('#storeName').textContent = state.storeName
  renderTiers()
  renderExtras()
  renderTotals()
}

function renderTotals() {
  const t = totals(state)
  $('#totalValue').textContent = formatMoney(t.total)
  $('#subValue').textContent = formatMoney(t.subtotal)

  const pill = $('#svcBtn')
  const pct = state.serviceChargePct
  const on = state.serviceOn && pct > 0
  // 關掉時也要顯示費率，否則「預設關」等於使用者根本看不到這家店有服務費。
  pill.textContent = on
    ? `服務費 ${pct}% +${formatMoney(t.service)}`
    : pct > 0
      ? `服務費 ${pct}% 關閉`
      : '不收服務費'
  pill.classList.toggle('on', on)
}

function renderTiers() {
  const wrap = $('#tiers')
  wrap.textContent = ''
  cells.clear()
  for (const tier of state.tiers) {
    const node = $('#tierTpl').content.firstElementChild.cloneNode(true)
    node.dataset.id = tier.id
    node.style.borderLeftColor = state.showColors && tier.color ? tier.color : 'transparent'
    node.querySelector('.price').textContent = formatMoney(tier.price)
    node.querySelector('.lab').textContent = tier.label
    wrap.append(node)
    cells.set(tier.id, node)
    paintTier(tier)
  }
}

function paintTier(tier) {
  const node = cells.get(tier.id)
  if (!node) return
  node.querySelector('.count').textContent = '×' + tier.count
  node.querySelector('.sub').textContent = tier.count ? formatMoney(tier.price * tier.count) : ''
  node.classList.toggle('on', tier.count > 0)
}

function renderExtras() {
  const wrap = $('#extras')
  wrap.textContent = ''
  for (const e of state.extras) {
    const card = $('#extraTpl').content.firstElementChild.cloneNode(true)
    card.dataset.id = e.id
    card.querySelector('.elab').textContent = e.label || '項目'
    card.querySelector('.emeta').textContent = `${formatMoney(e.unitPrice)} × ${e.qty}`
    card.querySelector('.eamt').textContent = formatMoney(e.unitPrice * e.qty)
    wrap.append(card)
  }
}

/* ── 計數 ───────────────────────────────── */

function bump(id, delta) {
  const tier = state.tiers.find((t) => t.id === id)
  if (!tier || tier.count + delta < 0) return
  tier.count += delta
  paintTier(tier)
  renderTotals()
  save()
}

$('#tiers').addEventListener('click', (e) => {
  const tile = e.target.closest('.tier')
  if (!tile) return
  if (e.target.closest('.minus')) bump(tile.dataset.id, -1)
  else if (e.target.closest('.plus')) bump(tile.dataset.id, 1)
})

$('#svcBtn').addEventListener('click', () => {
  if (state.serviceChargePct <= 0) return // 沒費率就沒東西可切
  state.serviceOn = !state.serviceOn
  renderTotals()
  save()
})

$('#resetBtn').addEventListener('click', () => {
  if (!confirm('清空這一餐的數量？')) return
  state = clearMeal(state)
  renderAll()
  save()
})

/* ── 其他項目 ───────────────────────────── */

$('#extras').addEventListener('click', (e) => {
  const card = e.target.closest('.extra')
  if (!card) return
  if (e.target.closest('.e-minus')) bumpExtra(card.dataset.id, -1)
  else if (e.target.closest('.e-edit')) openExtra(card.dataset.id)
  else if (e.target.closest('.eplus')) bumpExtra(card.dataset.id, 1)
})

function bumpExtra(id, delta) {
  const e = state.extras.find((x) => x.id === id)
  if (!e) return
  // 1 再減就是要刪掉，先問一聲
  if (delta < 0 && e.qty <= 1) {
    if (!confirm(`刪除「${e.label || '項目'}」？`)) return
    state.extras = state.extras.filter((x) => x !== e)
  } else {
    e.qty += delta
  }
  renderExtras()
  renderTotals()
  save()
}

function openExtra(id = null) {
  editingExtra = id
  const e = id ? state.extras.find((x) => x.id === id) : null
  $('#extraTitle').textContent = e ? '編輯項目' : '其他項目'
  $('#exLabel').value = e?.label ?? ''
  $('#exPrice').value = e?.unitPrice ?? ''
  $('#exDelete').classList.toggle('hidden', !e)
  $('#exOk').textContent = e ? '儲存' : '加入'
  $('#extraDlg').showModal()
}

$('#addExtraBtn').addEventListener('click', () => openExtra())
$('#exCancel').addEventListener('click', () => $('#extraDlg').close())

$('#exOk').addEventListener('click', () => {
  const priceEl = $('#exPrice')
  if (!$('#extraForm').reportValidity()) return
  const label = $('#exLabel').value.trim()
  const unitPrice = Math.round(Number(priceEl.value))

  if (editingExtra) {
    const e = state.extras.find((x) => x.id === editingExtra)
    Object.assign(e, { label, unitPrice }) // 數量只由卡片上的 +/− 調整
  } else {
    state.extras.push({ id: uid(), label, unitPrice, qty: 1 })
  }
  $('#extraDlg').close()
  renderExtras()
  renderTotals()
  save()
})

$('#exDelete').addEventListener('click', () => {
  state.extras = state.extras.filter((e) => e.id !== editingExtra)
  $('#extraDlg').close()
  renderExtras()
  renderTotals()
  save()
})

/* ── 店家設定 ───────────────────────────── */

function openSettings() {
  paintSettings()
  $('#settingsDlg').showModal()
}

function paintSettings() {
  const chips = $('#presetChips')
  chips.textContent = ''
  for (const p of PRESETS) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'chip' + (p.id === state.storeId ? ' on' : '')
    b.textContent = p.name
    b.addEventListener('click', () => applyPreset(p))
    chips.append(b)
  }
  $('#showColors').checked = state.showColors
  $('#svcPct').value = state.serviceChargePct
  paintTierEditor()
}

function applyPreset(preset) {
  if (!confirm(`套用「${preset.name}」的預設價位？這一餐的數量會清空。`)) return
  state = makeState(preset)
  save()
  renderAll()
  paintSettings()
}

// 設定改動後只重畫總額與價位按鈕，不重畫編輯器（否則打字時游標會跳掉）
function refreshFromSettings() {
  renderTiers()
  renderTotals()
  save()
}

function paintTierEditor() {
  const wrap = $('#tierEditor')
  wrap.textContent = ''
  for (const tier of state.tiers) {
    const row = $('#tierEditTpl').content.firstElementChild.cloneNode(true)
    const has = row.querySelector('.r-has')
    const col = row.querySelector('.r-color')
    const lab = row.querySelector('.r-name')
    const pri = row.querySelector('.r-price')

    has.checked = !!tier.color
    col.value = tier.color ?? '#888888'
    col.disabled = !tier.color
    lab.value = tier.label
    pri.value = tier.price

    has.addEventListener('change', () => {
      tier.color = has.checked ? col.value : null
      col.disabled = !has.checked
      refreshFromSettings()
    })
    col.addEventListener('input', () => {
      tier.color = col.value
      refreshFromSettings()
    })
    lab.addEventListener('input', () => {
      tier.label = lab.value
      refreshFromSettings()
    })
    pri.addEventListener('input', () => {
      tier.price = Math.max(0, Math.round(Number(pri.value) || 0))
      refreshFromSettings()
    })
    row.querySelector('.r-del').addEventListener('click', () => {
      if (state.tiers.length <= 1) {
        alert('至少要保留一個單價項目')
        return
      }
      state.tiers = state.tiers.filter((t) => t !== tier)
      paintTierEditor()
      refreshFromSettings()
    })

    wrap.append(row)
  }
}

$('#storeBtn').addEventListener('click', openSettings)
$('#settingsDone').addEventListener('click', () => $('#settingsDlg').close())

$('#showColors').addEventListener('change', (e) => {
  state.showColors = e.target.checked
  refreshFromSettings()
})

$('#svcPct').addEventListener('input', (e) => {
  const pct = Math.min(99, Math.max(0, Math.round(Number(e.target.value) || 0)))
  if (pct > 0 && state.serviceChargePct === 0) state.serviceOn = true // 0 → 有收，直接打開
  state.serviceChargePct = pct
  renderTotals()
  save()
})

$('#addTierBtn').addEventListener('click', () => {
  state.tiers.push({ id: uid(), price: 0, label: '', color: null, count: 0 })
  paintTierEditor()
  refreshFromSettings()
})

/* ── 啟動 ───────────────────────────────── */

renderAll()

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
