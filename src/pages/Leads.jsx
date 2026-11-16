import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Download, Plus, Search, Target, UserCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, DeleteButton, Empty, Input, PageHeader, toneDot } from '../components/ui'
import { LEAD_SOURCES, LEAD_STATUS, byValue } from '../constants'
import { useStore } from '../store'
import { cn, today, toCSV, uid } from '../utils'

const COLS = [
  { key: 'name', label: 'İşletme / kişi', w: 200 },
  { key: 'sector', label: 'Sektör', w: 130 },
  { key: 'contact', label: 'Yetkili', w: 130 },
  { key: 'phone', label: 'Telefon / iletişim', w: 150 },
  { key: 'source', label: 'Kaynak', w: 120, type: 'source' },
  { key: 'status', label: 'Durum', w: 150, type: 'status' },
  { key: 'nextDate', label: 'Sonraki takip', w: 130, type: 'date' },
  { key: 'nextStep', label: 'Sonraki adım', w: 190 },
  { key: 'note', label: 'Not', w: 240 },
]

const statusCls = {
  gray: 'bg-surface-2 text-fg-2',
  blue: 'bg-accent-soft text-accent',
  violet: 'bg-violet-soft text-violet',
  amber: 'bg-warn-soft text-warn',
  green: 'bg-ok-soft text-ok',
  red: 'bg-bad-soft text-bad',
}

export default function Leads({ go }) {
  const { data, add, patch, remove, update } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ key: null, dir: 1 })

  const rows = useMemo(() => {
    const s = q.toLocaleLowerCase('tr-TR')
    let r = data.leads.filter((l) => (status === 'all' ? true : l.status === status))
    if (s) r = r.filter((l) => COLS.map((c) => l[c.key]).join(' ').toLocaleLowerCase('tr-TR').includes(s))
    if (sort.key) {
      const order = LEAD_STATUS.map((x) => x.value)
      r = [...r].sort((a, b) => {
        const av = sort.key === 'status' ? order.indexOf(a.status) : String(a[sort.key] || '￿')
        const bv = sort.key === 'status' ? order.indexOf(b.status) : String(b[sort.key] || '￿')
        return (typeof av === 'number' ? av - bv : av.localeCompare(bv, 'tr')) * sort.dir
      })
    }
    return r
  }, [data.leads, q, status, sort])

  const addRow = () => add('leads', { name: '', sector: '', contact: '', phone: '', source: '', status: 'yeni', nextDate: '', nextStep: '', note: '' })

  const toClient = (l) => {
    const id = uid()
    update((p) => ({
      ...p,
      leads: p.leads.map((x) => (x.id === l.id ? { ...x, status: 'kazanildi' } : x)),
      clients: [
        {
          id,
          createdAt: new Date().toISOString(),
          name: l.name || 'Yeni müşteri',
          company: l.contact || '',
          phone: l.phone || '',
          email: '',
          service: 'Web sitesi',
          status: 'teklif',
          budget: '',
          deadline: '',
          notes: l.note ? [{ id: 'n' + Date.now(), text: `Aday listesinden aktarıldı: ${l.note}`, date: new Date().toISOString() }] : [],
        },
        ...p.clients,
      ],
    }))
    go('clients', id)
  }

  const exportCSV = async () => {
    const content = toCSV(
      rows.map((r) => ({ ...r, status: byValue(LEAD_STATUS, r.status).label })),
      COLS,
    )
    const name = `musteri-arayisi-${today()}.csv`
    if (window.api) window.api.saveText(name, content)
    else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv' }))
      a.download = name
      a.click()
    }
  }

  const counts = Object.fromEntries(LEAD_STATUS.map((s) => [s.value, data.leads.filter((l) => l.status === s.value).length]))
  const toggleSort = (key) => setSort((s) => (s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 }))

  return (
    <div className="px-10 pb-10">
      <PageHeader
        title="Müşteri arayışı"
        subtitle="Potansiyel müşteri listen. Excel gibi doğrudan hücreye yaz; her şey otomatik kaydedilir."
        actions={
          <>
            <Button icon={Download} onClick={exportCSV} disabled={!data.leads.length}>Excel'e aktar</Button>
            <Button variant="primary" icon={Plus} onClick={addRow}>Satır ekle</Button>
          </>
        }
      />

      {/* Durum hunisi */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        {LEAD_STATUS.map((s) => (
          <motion.button
            key={s.value}
            whileHover={{ y: -2 }}
            onClick={() => setStatus(status === s.value ? 'all' : s.value)}
            className={cn(
              'text-left rounded-xl border p-3 transition-colors',
              status === s.value ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface hover:border-surface-3',
            )}
          >
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted font-medium">
              <span className={cn('size-1.5 rounded-full', toneDot[s.tone])} />
              {s.label}
            </div>
            <div className="text-[20px] font-semibold tabular mt-0.5">{counts[s.value]}</div>
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Listede ara…" className="pl-8" />
        </div>
        {status !== 'all' && (
          <Button size="sm" variant="ghost" onClick={() => setStatus('all')}>
            Filtreyi temizle
          </Button>
        )}
        <span className="ml-auto text-[12px] text-muted tabular">{rows.length} kayıt</span>
      </div>

      <Card className="overflow-hidden">
        {data.leads.length === 0 ? (
          <Empty
            icon={Target}
            title="Liste boş"
            text="Ulaşmak istediğin işletmeleri ekle: kafeler, klinikler, mağazalar… Durumlarını ve takip tarihlerini buradan yönet."
            action={<Button variant="primary" icon={Plus} onClick={addRow}>İlk satırı ekle</Button>}
          />
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-330px)]">
            <table className="border-collapse text-[13px]" style={{ minWidth: COLS.reduce((s, c) => s + c.w, 0) + 120 }}>
              <thead className="sticky top-0 z-10 bg-surface-2">
                <tr>
                  <th className="w-10 border-b border-line text-[11px] text-muted font-medium">#</th>
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      style={{ width: c.w }}
                      onClick={() => toggleSort(c.key)}
                      className="text-left px-3 h-9 border-b border-l border-line text-[11.5px] font-semibold text-fg-2 cursor-pointer select-none hover:text-fg"
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sort.key === c.key && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                      </span>
                    </th>
                  ))}
                  <th className="w-20 border-b border-l border-line" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="group hover:bg-surface-2/40"
                    >
                      <td className="text-center text-[11px] text-muted tabular border-b border-line">{i + 1}</td>
                      {COLS.map((c) => (
                        <td key={c.key} className="border-b border-l border-line p-0 h-9">
                          <Cell col={c} lead={l} onChange={(v) => patch('leads', l.id, { [c.key]: v })} />
                        </td>
                      ))}
                      <td className="border-b border-l border-line px-1">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Müşteriye çevir"
                            onClick={() => toClient(l)}
                            className="size-7 grid place-items-center rounded-lg text-muted hover:text-ok hover:bg-ok-soft"
                          >
                            <UserCheck size={14} />
                          </button>
                          <DeleteButton onConfirm={() => remove('leads', l.id)} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <button onClick={addRow} className="w-full h-9 flex items-center gap-2 px-4 text-[12.5px] text-muted hover:text-accent hover:bg-surface-2/40 transition-colors">
              <Plus size={14} /> Yeni satır
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

const cellInput = 'w-full h-9 px-3 bg-transparent outline-none focus:bg-accent-soft/40 focus:shadow-[inset_0_0_0_2px_var(--accent)] transition-colors'

function Cell({ col, lead, onChange }) {
  const v = lead[col.key] || ''
  if (col.type === 'status') {
    const st = byValue(LEAD_STATUS, v)
    return (
      <div className="px-2">
        <select value={v || 'yeni'} onChange={(e) => onChange(e.target.value)} className={cn('h-6 px-2 rounded-md text-[12px] font-medium outline-none cursor-pointer', statusCls[st.tone])}>
          {LEAD_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    )
  }
  if (col.type === 'source') {
    return (
      <select value={v} onChange={(e) => onChange(e.target.value)} className={cn(cellInput, 'cursor-pointer', !v && 'text-muted')}>
        <option value="">—</option>
        {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
      </select>
    )
  }
  if (col.type === 'date') {
    const overdue = v && v <= today()
    return <input type="date" value={v} onChange={(e) => onChange(e.target.value)} className={cn(cellInput, 'text-[12.5px] tabular', overdue && 'text-bad font-medium', !v && 'text-muted')} />
  }
  return <input value={v} onChange={(e) => onChange(e.target.value)} className={cn(cellInput, col.key === 'name' && 'font-medium')} />
}
