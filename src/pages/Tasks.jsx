import { AnimatePresence, motion } from 'framer-motion'
import { CheckSquare, Flag, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Checkbox, DeleteButton, Empty, Input, PageHeader, Segmented, Select, inputCls, listItem } from '../components/ui'
import { PRIORITY, byValue } from '../constants'
import { useStore } from '../store'
import { addDays, cn, dayKey, relDay, today } from '../utils'

const prioOrder = { high: 0, med: 1, low: 2 }

export default function Tasks() {
  const { data, add, patch, remove } = useStore()
  const [tab, setTab] = useState('today')
  const [form, setForm] = useState({ title: '', priority: 'med', due: today(), clientId: '' })
  const t = today()

  const groups = useMemo(() => {
    const open = data.tasks.filter((x) => !x.done)
    const sorter = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || prioOrder[a.priority] - prioOrder[b.priority]
    return {
      today: open.filter((x) => x.due && x.due <= t).sort(sorter),
      upcoming: open.filter((x) => x.due && x.due > t).sort(sorter),
      nodate: open.filter((x) => !x.due).sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]),
      done: data.tasks.filter((x) => x.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')),
    }
  }, [data.tasks, t])

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    add('tasks', { ...form, title: form.title.trim(), done: false })
    setForm({ ...form, title: '' })
  }

  const items = tab === 'all' ? [...groups.today, ...groups.upcoming, ...groups.nodate] : groups[tab]
  const clientName = (id) => data.clients.find((c) => c.id === id)?.name

  return (
    <div className="px-10 pb-10 max-w-[960px] mx-auto">
      <PageHeader title="Görevler" subtitle="Genel yapılacaklar listen. Müşteriye bağlı işler de burada görünür." />

      <Card className="p-3 mb-5">
        <form onSubmit={submit} className="flex items-center gap-2">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Yeni görev yaz ve Enter'a bas…"
            className="flex-1 border-transparent bg-transparent focus:bg-surface"
          />
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-28">
            {PRIORITY.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
          <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className={cn(inputCls, 'w-36 px-2')} />
          <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-40">
            <option value="">Müşteri yok</option>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button type="submit" variant="primary" icon={Plus} disabled={!form.title.trim()}>Ekle</Button>
        </form>
        <div className="flex gap-1.5 mt-2 pl-3">
          {[
            ['Bugün', 0],
            ['Yarın', 1],
            ['Gelecek hafta', 7],
          ].map(([l, n]) => (
            <button key={l} type="button" onClick={() => setForm({ ...form, due: dayKey(addDays(new Date(), n)) })} className="text-[11.5px] text-muted hover:text-accent px-1.5 py-0.5 rounded">
              {l}
            </button>
          ))}
          <button type="button" onClick={() => setForm({ ...form, due: '' })} className="text-[11.5px] text-muted hover:text-accent px-1.5 py-0.5 rounded">
            Tarihsiz
          </button>
        </div>
      </Card>

      <Segmented
        layoutId="task-tab"
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          { value: 'today', label: 'Bugün', count: groups.today.length },
          { value: 'upcoming', label: 'Yaklaşan', count: groups.upcoming.length },
          { value: 'nodate', label: 'Tarihsiz', count: groups.nodate.length },
          { value: 'all', label: 'Tümü' },
          { value: 'done', label: 'Tamamlanan', count: groups.done.length },
        ]}
      />

      <Card className="p-1.5">
        {items.length === 0 ? (
          <Empty
            icon={CheckSquare}
            title={tab === 'done' ? 'Henüz tamamlanan yok' : 'Liste boş'}
            text={tab === 'today' ? 'Bugün için görev yok. Yukarıdan ekleyebilirsin.' : undefined}
          />
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((task) => (
              <TaskRow key={task.id} task={task} clientName={clientName(task.clientId)} patch={patch} remove={remove} t={t} />
            ))}
          </AnimatePresence>
        )}
      </Card>
    </div>
  )
}

function TaskRow({ task, clientName, patch, remove, t }) {
  const pr = byValue(PRIORITY, task.priority)
  const overdue = task.due && task.due < t && !task.done
  return (
    <motion.div {...listItem} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2/60">
      <Checkbox checked={task.done} onChange={(v) => patch('tasks', task.id, { done: v, doneAt: v ? new Date().toISOString() : null })} />
      <input
        value={task.title}
        onChange={(e) => patch('tasks', task.id, { title: e.target.value })}
        className={cn('flex-1 min-w-0 bg-transparent outline-none text-[13.5px] transition-colors', task.done && 'line-through text-muted')}
      />
      {clientName && <Badge tone="blue">{clientName}</Badge>}
      <button
        title="Önceliği değiştir"
        onClick={() => patch('tasks', task.id, { priority: task.priority === 'high' ? 'low' : task.priority === 'low' ? 'med' : 'high' })}
        className={cn('p-1 rounded', pr.tone === 'red' ? 'text-bad' : pr.tone === 'amber' ? 'text-warn' : 'text-muted/50')}
      >
        <Flag size={14} fill={task.priority === 'high' ? 'currentColor' : 'none'} />
      </button>
      <label className={cn('relative text-[12px] w-24 text-right tabular cursor-pointer', overdue ? 'text-bad font-medium' : 'text-muted')}>
        {task.due ? relDay(task.due) : 'Tarih ekle'}
        <input
          type="date"
          value={task.due || ''}
          onChange={(e) => patch('tasks', task.id, { due: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer"
          onClick={(e) => e.currentTarget.showPicker?.()}
        />
      </label>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DeleteButton onConfirm={() => remove('tasks', task.id)} />
      </span>
    </motion.div>
  )
}
