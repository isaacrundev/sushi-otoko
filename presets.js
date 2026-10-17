// 店家預設價位。價格查證日：2026-10（見 PRD §7）。價格會變，改這裡就好。

export const uid = () =>
  crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)

export const PRESETS = [
  {
    id: 'sushiro',
    name: '壽司郎',
    serviceChargePct: 10,
    showColors: true,
    tiers: [
      { price: 30, label: '奶茶盤', color: '#cbb894' },
      { price: 40, label: '紅盤', color: '#e0483f' },
      { price: 50, label: '綠盤', color: '#3f9f5a' },
      { price: 60, label: '銀盤', color: '#a8adb5' },
      { price: 70, label: '藍盤', color: '#3b7fd4' },
      { price: 80, label: '金盤', color: '#c9a227' },
      { price: 100, label: '黑盤', color: '#5a5f68' },
    ],
  },
  {
    id: 'kura',
    name: '藏壽司',
    // 均一價：單純用盤數算，所以只有一層。甜點等雜項走「其他項目」。
    serviceChargePct: 10,
    showColors: false,
    tiers: [{ price: 20, label: '', color: null }],
  },
  {
    id: 'sushiexpress',
    name: '爭鮮',
    serviceChargePct: 0,
    showColors: true,
    tiers: [
      { price: 30, label: '粉盤', color: '#e59ab8' },
      { price: 40, label: '銀盤', color: '#a8adb5' },
      { price: 60, label: '黑盤', color: '#5a5f68' },
      { price: 100, label: '', color: null },
      { price: 150, label: '', color: null },
    ],
  },
  {
    id: 'custom',
    name: '自訂',
    serviceChargePct: 0,
    showColors: false,
    tiers: [
      { price: 40, label: '', color: null },
      { price: 80, label: '', color: null },
    ],
  },
]

export function makeState(preset) {
  return {
    version: 1,
    storeId: preset.id,
    storeName: preset.name,
    showColors: preset.showColors,
    serviceChargePct: preset.serviceChargePct,
    // 費率照店家預設帶入，但開關一律預設「關」。由使用者自己決定要不要算，
    // 不要還沒問就先幫他加一筆。
    serviceOn: false,
    tiers: preset.tiers.map((t) => ({ ...t, id: uid(), count: 0 })),
    extras: [],
  }
}

// 把目前為止的盤數歸零，但保留店家設定。
export function clearMeal(state) {
  return {
    ...state,
    tiers: state.tiers.map((t) => ({ ...t, count: 0 })),
    extras: [],
  }
}
