import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, CalendarDays, Mail, MessageSquarePlus, Phone, Plus, Search, Wallet, CheckSquare } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, toneDot, Button, Card, Checkbox, DeleteButton, Empty, Field, Input, Modal, Progress, Select, Textarea, inputCls, listItem, spring } from '../components/ui'
import { CLIENT_STATUS, SERVICES, byValue } from '../constants'
import { useStore } from '../store'
import { cn, fmtDateTime, fmtMoney, relDay, today, uid, daysUntil } from '../utils'
import { Avatar } from './Dashboard'

const blank = { name: '', company: '', phone: '', email: '', service: SERVICES[0], status: 'teklif', budget: '', deadline: '' }

export default function Clients({ focus, clearFocus }) {
  const { data, add } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('active')
  const [selected, setSelected] = useState(focus || data.clients[0]?.id || null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)

  useEffect(() => {
    if (focus) {
      setSelected(focus)
      clearFocus()
    }
  }, [focus])

  const list = useMemo(() => {
    const s = q.toLocaleLowerCase('tr-TR')
    return data.clients
      .filter((c) => (filter === 'active' ? !['tamamlandi', 'iptal'].includes(c.status) : filter === 'done' ? ['tamamlandi', 'iptal'].includes(c.status) : true))
      .filter((c) => !s || [c.name, c.company, c.service, c.phone].join(' ').toLocaleLowerCase('tr-TR').includes(s))
  }, [data.clients, q, filter])

  const client = data.clients.find((c) => c.id === selected)

  const create = () => {
    if (!form.name.trim()) return
    const c = add('clients', { ...form, name: form.name.trim(), notes: [] })
    setSelected(c.id)
    setFilter('all')
    setModal(false)
    setForm(blank)
  }

  return (
    <div className="h-full flex">
      {/* Liste */}
      <div className="w-[300px] shrink-0 border-r border-line flex flex-col">
        <div className="px-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold tracking-tight">Müşteriler</h1>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setModal(true)}>
              Yeni
            </Button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Müşteri ara…" className="pl-8" />
          </div>
          <div className="flex gap-1">
            {[
              ['active', 'Aktif'],
              ['done', 'Biten'],
              ['all', 'Tümü'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={cn('h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors', filter === v ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {list.length === 0 ? (
            <Empty icon={Briefcase} title={data.clients.length ? 'Sonuç yok' : 'Henüz müşteri yok'} text={data.clients.length ? 'Filtreyi değiştirmeyi dene.' : 'İlk müşterini ekleyerek başla.'} />
          ) : (
            <AnimatePresence initial={false}>
              {list.map((c) => {
                const st = byValue(CLIENT_STATUS, c.status)
                const open = data.tasks.filter((t) => t.clientId === c.id && !t.done).length
                return (
                  <motion.button
                    key={c.id}
                    {...listItem}
                    onClick={() => setSelected(c.id)}
                    className={cn('relative w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors', selected === c.id ? '' : 'hover:bg-surface-2/60')}
                  >
                    {selected === c.id && <motion.span layoutId="client-sel" className="absolute inset-0 rounded-lg bg-surface border border-line shadow-card" transition={spring} />}
                    <span className="relative"><Avatar name={c.name} size={34} /></span>
                    <span className="relative flex-1 min-w-0">
                      <span className="block text-[13px] font-medium truncate">{c.name}</span>
                      <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                        <span className={cn('size-1.5 rounded-full', toneDot[st.tone])} />
                        <span className="truncate">{c.service || st.label}</span>
                      </span>
                    </span>
                    {open > 0 && <span className="relative text-[11px] text-muted tabular">{open} iş</span>}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Detay */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {client ? (
            <motion.div key={client.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <ClientDetail client={client} onDeleted={() => setSelected(null)} />
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full grid place-items-center">
              <Empty
                icon={Briefcase}
                title="Bir müşteri seç"
                text="Soldan bir müşteri seç ya da yeni bir müşteri ekle. Notlarını, işlerini ve ödemelerini buradan takip edersin."
                action={<Button variant="primary" icon={Plus} onClick={() => setModal(true)}>Müşteri ekle</Button>}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Yeni müşteri"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Vazgeç</Button>
            <Button variant="primary" onClick={create} disabled={!form.name.trim()}>Ekle</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create()
          }}
          className="grid grid-cols-2 gap-3"
        >
          <Field label="Müşteri / işletme adı *" className="col-span-2">
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn. Kahve Durağı" />
          </Field>
          <Field label="Yetkili kişi">
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Ad Soyad" />
          </Field>
          <Field label="Telefon">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xx xxx xx xx" />
          </Field>
          <Field label="E-posta" className="col-span-2">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ornek@mail.com" />
          </Field>
          <Field label="Hizmet">
            <Select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Durum">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {CLIENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Anlaşılan ücret (₺)">
            <Input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Teslim tarihi">
            <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  )
}

function ClientDetail({ client, onDeleted }) {
  const { data, patch, remove, add, update } = useStore()
  const [note, setNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [pay, setPay] = useState({ amount: '', note: '', date: today() })
  const noteRef = useRef()

  const set = (k) => (e) => patch('clients', client.id, { [k]: e.target.value })
  const tasks = data.tasks.filter((t) => t.clientId === client.id).sort((a, b) => a.done - b.done)
  const payments = data.transactions.filter((t) => t.clientId === client.id && t.type === 'income')
  const paid = payments.reduce((s, x) => s + Number(x.amount), 0)
  const budget = Number(client.budget) || 0
  const st = byValue(CLIENT_STATUS, client.status)
  const dl = daysUntil(client.deadline)

  const addNote = () => {
    if (!note.trim()) return
    patch('clients', client.id, (c) => ({ notes: [{ id: uid(), text: note.trim(), date: new Date().toISOString() }, ...(c.notes || [])] }))
    setNote('')
  }
  const addTask = () => {
    if (!taskTitle.trim()) return
    add('tasks', { title: taskTitle.trim(), done: false, priority: 'med', due: '', clientId: client.id })
    setTaskTitle('')
  }
  const addPayment = () => {
    if (!Number(pay.amount)) return
    add('transactions', { type: 'income', amount: Number(pay.amount), category: 'Proje ödemesi', note: pay.note || client.name, date: pay.date, clientId: client.id })
    setPay({ amount: '', note: '', date: today() })
    setPayOpen(false)
  }
  const del = () => {
    update((p) => ({
      ...p,
      clients: p.clients.filter((c) => c.id !== client.id),
      tasks: p.tasks.map((t) => (t.clientId === client.id ? { ...t, clientId: '' } : t)),
    }))
    onDeleted()
  }

  return (
    <div className="px-8 pb-10 max-w-[920px]">
      {/* Başlık */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar name={client.name} size={52} />
        <div className="flex-1 min-w-0">
          <input
            value={client.name}
            onChange={set('name')}
            className="w-full bg-transparent text-[22px] font-semibold tracking-tight outline-none rounded-md -mx-1 px-1 hover:bg-surface-2/60 focus:bg-surface-2/60"
          />
          <div className="flex items-center gap-2 mt-1">
            <select
              value={client.status}
              onChange={set('status')}
              className={cn('h-[24px] px-2 rounded-md text-[12px] font-medium outline-none cursor-pointer', { gray: 'bg-surface-2 text-fg-2', blue: 'bg-accent-soft text-accent', green: 'bg-ok-soft text-ok', amber: 'bg-warn-soft text-warn', violet: 'bg-violet-soft text-violet' }[st.tone])}
            >
              {CLIENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {client.deadline && (
              <Badge tone={dl < 0 ? 'red' : dl <= 3 ? 'amber' : 'gray'}>
                <CalendarDays size={12} /> {relDay(client.deadline)}
              </Badge>
            )}
          </div>
        </div>
        <DeleteButton onConfirm={del} label="Müşteriyi sil" size="icon" />
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">
        <div className="space-y-5">
          {/* Notlar */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold mb-3">
              <MessageSquarePlus size={15} className="text-muted" /> Notlar & görüşmeler
            </div>
            <Textarea
              ref={noteRef}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) addNote()
              }}
              placeholder="Görüşme notu, istekler, fikirler… (Ctrl+Enter ile kaydet)"
            />
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="dark" onClick={addNote} disabled={!note.trim()}>Not ekle</Button>
            </div>
            <div className="mt-3 space-y-1">
              <AnimatePresence initial={false}>
                {(client.notes || []).map((n) => (
                  <motion.div key={n.id} {...listItem} className="group relative pl-4 py-2 border-l-2 border-line">
                    <span className="absolute -left-[5px] top-3 size-2 rounded-full bg-surface-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] text-muted">{fmtDateTime(n.date)}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton onConfirm={() => patch('clients', client.id, (c) => ({ notes: c.notes.filter((x) => x.id !== n.id) }))} />
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap select-text">{n.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!client.notes?.length && <p className="text-[12.5px] text-muted py-2">Henüz not yok.</p>}
            </div>
          </Card>

          {/* Görevler */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold mb-3">
              <CheckSquare size={15} className="text-muted" /> Bu müşteri için yapılacaklar
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addTask()
              }}
              className="flex gap-2 mb-2"
            >
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Örn. Ana sayfa tasarımını gönder" />
              <Button type="submit" icon={Plus} disabled={!taskTitle.trim()}>Ekle</Button>
            </form>
            <AnimatePresence initial={false}>
              {tasks.map((t) => (
                <motion.div key={t.id} {...listItem} className="group flex items-center gap-3 px-1 py-1.5">
                  <Checkbox checked={t.done} onChange={(v) => patch('tasks', t.id, { done: v, doneAt: v ? new Date().toISOString() : null })} />
                  <span className={cn('flex-1 text-[13px]', t.done && 'line-through text-muted')}>{t.title}</span>
                  {t.due && <span className="text-[11.5px] text-muted">{relDay(t.due)}</span>}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteButton onConfirm={() => remove('tasks', t.id)} />
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </Card>
        </div>

        {/* Sağ sütun */}
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold"><Wallet size={15} className="text-muted" /> Ödeme</div>
              <Button size="sm" icon={Plus} onClick={() => setPayOpen(true)}>Tahsilat</Button>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[20px] font-semibold tabular">{fmtMoney(paid)}</span>
              <span className="text-[12px] text-muted tabular">/ {fmtMoney(budget)}</span>
            </div>
            <Progress value={budget ? paid / budget : 0} tone={budget && paid >= budget ? 'ok' : 'accent'} />
            <div className="text-[11.5px] text-muted mt-2">
              {budget ? (paid >= budget ? 'Ödeme tamamlandı' : `Kalan: ${fmtMoney(budget - paid)}`) : 'Ücret girilmedi'}
            </div>
            {payments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line space-y-1.5">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-[12px]">
                    <span className="text-muted">{relDay(p.date)}</span>
                    <span className="tabular text-ok font-medium">+{fmtMoney(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="text-[13px] font-semibold">Bilgiler</div>
            <Field label="Yetkili kişi"><Input value={client.company || ''} onChange={set('company')} /></Field>
            <Field label="Telefon">
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input value={client.phone || ''} onChange={set('phone')} className="pl-8" />
              </div>
            </Field>
            <Field label="E-posta">
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input value={client.email || ''} onChange={set('email')} className="pl-8" />
              </div>
            </Field>
            <Field label="Hizmet">
              <Select value={client.service || ''} onChange={set('service')}>
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Ücret (₺)"><Input type="number" min="0" value={client.budget || ''} onChange={set('budget')} /></Field>
              <Field label="Teslim"><input type="date" className={cn(inputCls, 'px-2')} value={client.deadline || ''} onChange={set('deadline')} /></Field>
            </div>
            <div className="text-[11px] text-muted pt-1">Eklendi: {fmtDateTime(client.createdAt)}</div>
          </Card>
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={`Tahsilat ekle · ${client.name}`}
        width={400}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>Vazgeç</Button>
            <Button variant="primary" onClick={addPayment} disabled={!Number(pay.amount)}>Kaydet</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addPayment()
          }}
          className="space-y-3"
        >
          <Field label="Tutar (₺)"><Input autoFocus type="number" min="0" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Tarih"><Input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
          <Field label="Açıklama"><Input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="Örn. Kapora" /></Field>
          <p className="text-[11.5px] text-muted">Bu tutar "Para" bölümüne gelir olarak da eklenir.</p>
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  )
}
