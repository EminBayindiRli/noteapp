import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Plus, Receipt, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, CardHeader, DeleteButton, Empty, Field, Input, Modal, PageHeader, Segmented, Select, listItem } from '../components/ui'
import { EXPENSE_CATS, INCOME_CATS } from '../constants'
import { useStore } from '../store'
import { cn, fmtDate, fmtMoney, monthKey, monthLabel, shiftMonth, today } from '../utils'

const sum = (arr) => arr.reduce((s, x) => s + Number(x.amount || 0), 0)

export default function Finance() {
  const { data, add, remove } = useStore()
  const [mk, setMk] = useState(monthKey())
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ type: 'expense', amount: '', category: EXPENSE_CATS[0], note: '', date: today(), clientId: '' })

  const monthTx = useMemo(
    () => data.transactions.filter((x) => x.date?.startsWith(mk)).sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '')),
    [data.transactions, mk],
  )
  const income = sum(monthTx.filter((x) => x.type === 'income'))
  const expense = sum(monthTx.filter((x) => x.type === 'expense'))
  const balance = sum(data.transactions.filter((x) => x.type === 'income')) - sum(data.transactions.filter((x) => x.type === 'expense'))

  const byCat = useMemo(() => {
    const m = {}
    monthTx.filter((x) => x.type === 'expense').forEach((x) => (m[x.category] = (m[x.category] || 0) + Number(x.amount)))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [monthTx])

  const last6 = Array.from({ length: 6 }, (_, i) => shiftMonth(mk, i - 5)).map((k) => {
    const tx = data.transactions.filter((x) => x.date?.startsWith(k))
    return { k, inc: sum(tx.filter((x) => x.type === 'income')), exp: sum(tx.filter((x) => x.type === 'expense')) }
  })
  const max6 = Math.max(1, ...last6.flatMap((m) => [m.inc, m.exp]))

  const shown = filter === 'all' ? monthTx : monthTx.filter((x) => x.type === filter)
  const grouped = shown.reduce((acc, x) => {
    ;(acc[x.date] ||= []).push(x)
    return acc
  }, {})

  const openModal = (type) => {
    setForm({ type, amount: '', category: type === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0], note: '', date: today(), clientId: '' })
    setOpen(true)
  }
  const save = () => {
    if (!Number(form.amount)) return
    add('transactions', { ...form, amount: Number(form.amount) })
    setOpen(false)
  }
  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  return (
    <div className="px-10 pb-10 max-w-[1140px] mx-auto">
      <PageHeader
        title="Para"
        subtitle="Gelirlerin, harcamaların ve genel durumun."
        actions={
          <>
            <Button icon={ArrowDownLeft} onClick={() => openModal('income')}>Gelir</Button>
            <Button variant="primary" icon={ArrowUpRight} onClick={() => openModal('expense')}>Harcama</Button>
          </>
        }
      />

      {/* Ay seçici */}
      <div className="flex items-center gap-2 mb-4">
        <Button size="iconSm" variant="ghost" icon={ChevronLeft} onClick={() => setMk(shiftMonth(mk, -1))} aria-label="Önceki ay" />
        <AnimatePresence mode="wait">
          <motion.span key={mk} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="text-[14px] font-semibold capitalize w-36 text-center">
            {monthLabel(mk)}
          </motion.span>
        </AnimatePresence>
        <Button size="iconSm" variant="ghost" icon={ChevronRight} onClick={() => setMk(shiftMonth(mk, 1))} aria-label="Sonraki ay" />
        {mk !== monthKey() && <Button size="sm" variant="ghost" onClick={() => setMk(monthKey())}>Bu ay</Button>}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <Kpi label="Gelir" value={fmtMoney(income)} tone="ok" icon={ArrowDownLeft} />
        <Kpi label="Harcama" value={fmtMoney(expense)} tone="bad" icon={ArrowUpRight} />
        <Kpi label="Bu ay net" value={fmtMoney(income - expense)} tone={income - expense < 0 ? 'bad' : 'fg'} icon={Receipt} />
        <Kpi label="Toplam bakiye" value={fmtMoney(balance)} tone={balance < 0 ? 'bad' : 'fg'} icon={Wallet} hint="tüm kayıtlar" />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        <Card>
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <div className="text-[13px] font-semibold">Hareketler</div>
            <Segmented
              layoutId="fin-filter"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Tümü' },
                { value: 'income', label: 'Gelir' },
                { value: 'expense', label: 'Harcama' },
              ]}
            />
          </div>
          <div className="px-2 pb-2">
            {shown.length === 0 ? (
              <Empty icon={Receipt} title="Bu ay kayıt yok" text="Gelir ya da harcama ekleyerek başla." />
            ) : (
              Object.entries(grouped).map(([d, items]) => (
                <div key={d} className="mb-1">
                  <div className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-muted uppercase tracking-wide">
                    {d === today() ? 'Bugün' : fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <AnimatePresence initial={false}>
                    {items.map((x) => (
                      <motion.div key={x.id} {...listItem} className="group flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-2/60">
                        <div className={cn('size-8 rounded-lg grid place-items-center', x.type === 'income' ? 'bg-ok-soft text-ok' : 'bg-surface-2 text-fg-2')}>
                          {x.type === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{x.note || x.category}</div>
                          <div className="text-[11.5px] text-muted truncate">
                            {x.category}
                            {x.clientId && data.clients.find((c) => c.id === x.clientId) ? ` · ${data.clients.find((c) => c.id === x.clientId).name}` : ''}
                          </div>
                        </div>
                        <span className={cn('text-[13.5px] font-semibold tabular', x.type === 'income' ? 'text-ok' : 'text-fg')}>
                          {x.type === 'income' ? '+' : '−'}
                          {fmtMoney(x.amount)}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DeleteButton onConfirm={() => remove('transactions', x.id)} />
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Son 6 ay" />
            <div className="px-4 pb-4">
              <div className="flex items-end justify-between gap-2 h-36">
                {last6.map((m) => (
                  <button key={m.k} onClick={() => setMk(m.k)} className="flex-1 flex flex-col items-center gap-1.5 h-full group" title={`${monthLabel(m.k)}\nGelir: ${fmtMoney(m.inc)}\nHarcama: ${fmtMoney(m.exp)}`}>
                    <div className="flex-1 w-full flex items-end justify-center gap-[3px]">
                      <motion.div className="w-2.5 rounded-t-[3px] bg-ok" initial={{ height: 0 }} animate={{ height: `${(m.inc / max6) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                      <motion.div className="w-2.5 rounded-t-[3px] bg-bad/80" initial={{ height: 0 }} animate={{ height: `${(m.exp / max6) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.05 }} />
                    </div>
                    <span className={cn('text-[11px] capitalize', m.k === mk ? 'text-fg font-semibold' : 'text-muted group-hover:text-fg')}>
                      {monthLabel(m.k, { month: 'short' })}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-[11.5px] text-muted">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-ok" /> Gelir</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-bad/80" /> Harcama</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Harcama dağılımı" />
            <div className="px-4 pb-4 space-y-3">
              {byCat.length === 0 ? (
                <p className="text-[12.5px] text-muted">Bu ay harcama yok.</p>
              ) : (
                byCat.map(([cat, v]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span>{cat}</span>
                      <span className="tabular text-muted">
                        {fmtMoney(v)} · {Math.round((v / expense) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <motion.div className="h-full bg-fg-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${(v / byCat[0][1]) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 22 }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.type === 'income' ? 'Gelir ekle' : 'Harcama ekle'}
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button variant="primary" onClick={save} disabled={!Number(form.amount)}>Kaydet</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          className="space-y-3"
        >
          <Segmented
            layoutId="tx-type"
            value={form.type}
            onChange={(type) => setForm({ ...form, type, category: type === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0] })}
            options={[
              { value: 'expense', label: 'Harcama' },
              { value: 'income', label: 'Gelir' },
            ]}
          />
          <Field label="Tutar (₺)">
            <Input autoFocus type="number" min="0" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="text-[16px] h-11 font-semibold" placeholder="0" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Tarih"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
          <Field label="Açıklama"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={form.type === 'income' ? 'Örn. X firması web sitesi' : 'Örn. Figma aboneliği'} /></Field>
          {form.type === 'income' && (
            <Field label="Müşteri (isteğe bağlı)">
              <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">—</option>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          )}
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  )
}

function Kpi({ label, value, tone, icon: Icon, hint }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[12px] text-muted font-medium">
        <Icon size={14} />
        {label}
      </div>
      <div className={cn('text-[21px] font-semibold tracking-tight mt-1.5 tabular', tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : 'text-fg')}>{value}</div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </Card>
  )
}
