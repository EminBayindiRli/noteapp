import { twMerge } from 'tailwind-merge'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const dayKey = (d = new Date()) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const today = () => dayKey()
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const parseDay = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const daysUntil = (k) => {
  if (!k) return null
  return Math.round((parseDay(k) - parseDay(today())) / 86400000)
}

const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
export const fmtMoney = (n) => money.format(Number(n) || 0)

export const fmtDate = (k, opts = { day: 'numeric', month: 'short' }) => {
  if (!k) return ''
  const d = k.length === 10 ? parseDay(k) : new Date(k)
  return d.toLocaleDateString('tr-TR', opts)
}
export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export const relDay = (k) => {
  const n = daysUntil(k)
  if (n === null) return ''
  if (n === 0) return 'Bugün'
  if (n === 1) return 'Yarın'
  if (n === -1) return 'Dün'
  if (n < 0) return `${-n} gün geçti`
  if (n < 7) return `${n} gün kaldı`
  return fmtDate(k)
}

export const monthKey = (d = new Date()) => dayKey(d).slice(0, 7)
export const monthLabel = (mk, opts = { month: 'long', year: 'numeric' }) => {
  const [y, m] = mk.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', opts)
}
export const shiftMonth = (mk, n) => {
  const [y, m] = mk.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + n, 1))
}

export const cn = (...a) => twMerge(a.filter(Boolean).join(' '))

export const toCSV = (rows, cols) => {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.map((c) => esc(c.label)).join(';'), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(';'))].join('\n')
}

export const greeting = () => {
  const h = new Date().getHours()
  if (h < 6) return 'İyi geceler'
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export const routineStreak = (log = {}) => {
  let n = 0
  let d = new Date()
  if (!log[dayKey(d)]) d = addDays(d, -1)
  while (log[dayKey(d)]) {
    n++
    d = addDays(d, -1)
  }
  return n
}
