import { test, expect } from 'bun:test'
import { subtotal, serviceCharge, totals, formatMoney } from './calc.js'
import { PRESETS, makeState, clearMeal } from './presets.js'

const meal = (tiers, extras = [], rest = {}) => ({
  tiers: tiers.map(([price, count]) => ({ price, count })),
  extras,
  serviceChargePct: 10,
  serviceOn: true,
  ...rest,
})

test('subtotal 只算層級', () => {
  expect(subtotal(meal([[30, 3], [40, 5], [100, 1]]))).toBe(90 + 200 + 100)
})

test('subtotal 只算手動項目', () => {
  expect(subtotal(meal([], [{ label: '拉麵', unitPrice: 120, qty: 2 }]))).toBe(240)
})

test('subtotal 兩者相加，空的一餐是 0', () => {
  expect(subtotal(meal([[60, 2]], [{ unitPrice: 90, qty: 1 }]))).toBe(210)
  expect(subtotal(meal([]))).toBe(0)
})

test('數量 0 的層級不影響金額', () => {
  expect(subtotal(meal([[30, 0], [80, 2]]))).toBe(160)
})

test('服務費四捨五入到整數', () => {
  expect(serviceCharge(1240, 10)).toBe(124)
  expect(serviceCharge(1235, 10)).toBe(124) // 123.5 → 124
  expect(serviceCharge(1234, 10)).toBe(123) // 123.4 → 123
  expect(serviceCharge(1000, 0)).toBe(0)
})

test('totals 加總，serviceOn 關掉時不收服務費', () => {
  const on = totals(meal([[40, 25]])) // 小計 1000
  expect(on).toEqual({ subtotal: 1000, service: 100, total: 1100 })

  const off = totals(meal([[40, 25]], [], { serviceOn: false }))
  expect(off).toEqual({ subtotal: 1000, service: 0, total: 1000 })
})

test('totals 服務費設 0 的店家不會冒出服務費', () => {
  expect(totals(meal([[40, 25]], [], { serviceChargePct: 0 })).total).toBe(1000)
})

test('formatMoney 千分位', () => {
  expect(formatMoney(0)).toBe('$0')
  expect(formatMoney(1240)).toBe('$1,240')
  expect(formatMoney(12345)).toBe('$12,345')
})

test('預設資料每一家都至少一層，價錢都是正整數', () => {
  for (const p of PRESETS) {
    expect(p.tiers.length).toBeGreaterThan(0)
    for (const t of p.tiers) {
      expect(Number.isInteger(t.price)).toBe(true)
      expect(t.price).toBeGreaterThan(0)
    }
    const prices = p.tiers.map((t) => t.price)
    expect(new Set(prices).size).toBe(prices.length) // 沒有重複價位
  }
})

test('makeState 從空白開始', () => {
  const s = makeState(PRESETS[0])
  expect(s.tiers.length).toBe(7)
  expect(s.tiers.every((t) => t.count === 0)).toBe(true)
  expect(s.extras).toEqual([])
  expect(s.storeName).toBe('壽司郎')
})

test('clearMeal 歸零但保留店家設定', () => {
  const s = makeState(PRESETS[4])
  s.tiers[0].count = 5
  s.extras.push({ label: '甜點', unitPrice: 90, qty: 2 })
  const cleared = clearMeal(s)
  expect(cleared.tiers[0].price).toBe(40) // 設定還在
  expect(cleared.tiers[0].count).toBe(0)
  expect(cleared.extras).toEqual([])
  expect(cleared.storeName).toBe('自訂')
})
