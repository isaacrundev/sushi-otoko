// 純函式：所有金額計算都在這裡。這是整個 app 唯一有邏輯的地方。

export function subtotal(state) {
  let sum = 0
  for (const t of state.tiers) sum += t.price * t.count
  for (const e of state.extras) sum += e.unitPrice * e.qty
  return sum
}

// 服務費四捨五入到整數（見 PRD §6）
export function serviceCharge(sub, pct) {
  return Math.round((sub * pct) / 100)
}

export function totals(state) {
  const sub = subtotal(state)
  const pct = state.serviceOn ? state.serviceChargePct : 0
  const svc = serviceCharge(sub, pct)
  return { subtotal: sub, service: svc, total: sub + svc }
}

export function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('zh-TW')
}
