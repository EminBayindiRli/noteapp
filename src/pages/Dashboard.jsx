import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Briefcase, CalendarClock, CheckSquare, Phone, Repeat, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Badge, Card, CardHeader, Checkbox, Empty, Ring, listItem } from '../components/ui'
import { CLIENT_STATUS, LEAD_STATUS, PRIORITY, byValue } from '../constants'
import { useStore } from '../store'
import { cn, daysUntil, fmtMoney, greeting, monthKey, relDay, today } from '../utils'

const container = { animate: { transition: { staggerChildren: 0.04 } } }
const child = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

export default function Dashboard({ go }) {
  const { data, patch } = useStore()
  const t = today()
  const mk = monthKey()

  const routinesDone = data.routines.filter((r) => r.log?.[t]).length
  const openTasks = data.tasks.filter((x) => !x.done)
  const todayTasks = openTasks
    .filter((x) => (x.due && x.due <= t) || (!x.due && x.priority === 'high'))
    .sort((a, b) => (a.due || '9') .localeCompare(b.due || '9'))
  const monthTx = data.transactions.filter((x) => x.date?.startsWith(mk))
  const income = monthTx.filter((x) => x.type === 'income').reduce((s, x) => s + Number(x.amount), 0)
  const expense = monthTx.filter((x) => x.type === 'expense').reduce((s, x) => s + Number(x.amount), 0)
  const activeClients = data.clients.filter((c) => c.status === 'devam' || c.status === 'teklif')
  const deadlines = data.clients
    .filter((c) => c.deadline && !['tamamlandi', 'iptal'].includes(c.status) && daysUntil(c.deadline) <= 14)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
  const followUps = data.leads
    .filter((l) => l.nextDate && l.nextDate <= t && !['kazanildi', 'kaybedildi'].includes(l.status))
    .slice(0, 6)
  const clientName = (id) => data.clients.find((c) => c.id === id)?.name

  const toggleTask = (task, done) => patch('tasks', task.id, { done, doneAt: done ? new Date().toISOString() : null })
  const toggleRoutine = (r) =>
    patch('routines', r.id, (x) => {
      const log = { ...(x.log || {}) }
      if (log[t]) delete log[t]
      else log[t] = true
      return { log }
    })

  const name = data.settings.name

  return (
    <motion.div variants={container} initial="initial" animate="animate" className="px-10 pb-10 max-w-[1240px] mx-auto">
      <motion.div variants={child} className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight">
          {greeting()}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="text-[13.5px] text-muted mt-1">
          {todayTasks.length ? `Bugün ${todayTasks.length} görevin var` : 'Bugün için bekleyen görev yok'}
          {data.routines.length ? ` · rutinlerin ${routinesDone}/${data.routines.length}` : ''}
        </p>
      </motion.div>

      {/* Özet kartları */}
      <motion.div variants={child} className="grid grid-cols-4 gap-4 mb-5">
        <Stat
          icon={Repeat}
          label="Bugünkü rutin"
          value={`${routinesDone}/${data.routines.length}`}
          onClick={() => go('routines')}
          extra={<Ring value={data.routines.length ? routinesDone / data.routines.length : 0} size={38} stroke={4} />}
        />
        <Stat icon={CheckSquare} label="Açık görev" value={openTasks.length} hint={`${todayTasks.length} tanesi bugün`} onClick={() => go('tasks')} />
        <Stat
          icon={Wallet}
          label="Bu ay net"
          value={fmtMoney(income - expense)}
          valueClass={income - expense < 0 ? 'text-bad' : ''}
          hint={
            <span className="flex gap-3">
              <span className="flex items-center gap-1 text-ok"><TrendingUp size={12} />{fmtMoney(income)}</span>
              <span className="flex items-center gap-1 text-bad"><TrendingDown size={12} />{fmtMoney(expense)}</span>
            </span>
          }
          onClick={() => go('finance')}
        />
        <Stat icon={Briefcase} label="Aktif müşteri" value={activeClients.length} hint={`${data.clients.length} toplam`} onClick={() => go('clients')} />
      </motion.div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          <motion.div variants={child}>
            <Card>
              <CardHeader title="Bugün yapılacaklar" icon={CheckSquare} action={<Link onClick={() => go('tasks')}>Tümü</Link>} />
              <div className="px-2 pb-2">
                {todayTasks.length === 0 ? (
                  <Empty title="Her şey yolunda" text="Bugüne ait ya da gecikmiş görev yok." className="py-8" />
                ) : (
                  <AnimatePresence initial={false}>
                    {todayTasks.slice(0, 8).map((task) => (
                      <motion.div key={task.id} {...listItem} className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-2/60">
                        <Checkbox checked={task.done} onChange={(v) => toggleTask(task, v)} />
                        <span className="flex-1 text-[13px] truncate">{task.title}</span>
                        {task.clientId && <span className="text-[11.5px] text-muted truncate max-w-32">{clientName(task.clientId)}</span>}
                        {task.priority === 'high' && <Badge tone="red">{byValue(PRIORITY, 'high').label}</Badge>}
                        {task.due && <span className={cn('text-[11.5px] tabular', task.due < t ? 'text-bad' : 'text-muted')}>{relDay(task.due)}</span>}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={child}>
            <Card>
              <CardHeader title="Yaklaşan teslimler" icon={CalendarClock} action={<Link onClick={() => go('clients')}>Müşteriler</Link>} />
              <div className="px-2 pb-2">
                {deadlines.length === 0 ? (
                  <Empty title="Yakın teslim yok" text="Önümüzdeki 14 günde teslim tarihi olan iş yok." className="py-8" />
                ) : (
                  deadlines.map((c) => {
                    const st = byValue(CLIENT_STATUS, c.status)
                    const n = daysUntil(c.deadline)
                    return (
                      <button
                        key={c.id}
                        onClick={() => go('clients', c.id)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-2/60 text-left"
                      >
                        <Avatar name={c.name} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{c.name}</div>
                          <div className="text-[11.5px] text-muted truncate">{c.service || c.company}</div>
                        </div>
                        <Badge tone={st.tone} dot>{st.label}</Badge>
                        <span className={cn('text-[12px] w-24 text-right tabular', n < 0 ? 'text-bad' : n <= 3 ? 'text-warn' : 'text-muted')}>
                          {relDay(c.deadline)}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-5">
          <motion.div variants={child}>
            <Card>
              <CardHeader title="Günlük rutin" icon={Repeat} action={<Link onClick={() => go('routines')}>Düzenle</Link>} />
              <div className="px-2 pb-2">
                {data.routines.length === 0 ? (
                  <Empty title="Rutin eklenmemiş" text="Spor, okuma, e-posta kontrolü gibi her gün yaptıklarını ekle." className="py-8" />
                ) : (
                  data.routines.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => toggleRoutine(r)}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-2/60 cursor-pointer"
                    >
                      <Checkbox checked={!!r.log?.[t]} onChange={() => toggleRoutine(r)} />
                      <span className={cn('text-[13px] transition-colors', r.log?.[t] && 'text-muted line-through')}>{r.title}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={child}>
            <Card>
              <CardHeader title="Takip edilecek adaylar" icon={Phone} action={<Link onClick={() => go('leads')}>Liste</Link>} />
              <div className="px-2 pb-2">
                {followUps.length === 0 ? (
                  <Empty title="Bugün takip yok" text="Aday listesinde 'Sonraki takip' tarihi gelenler burada görünür." className="py-8" />
                ) : (
                  followUps.map((l) => {
                    const st = byValue(LEAD_STATUS, l.status)
                    return (
                      <div key={l.id} className="flex items-center gap-3 px-2.5 py-2 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{l.name || 'İsimsiz'}</div>
                          <div className="text-[11.5px] text-muted truncate">{l.nextStep || l.sector}</div>
                        </div>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

function Stat({ icon: Icon, label, value, hint, extra, onClick, valueClass }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="text-left rounded-xl bg-surface border border-line shadow-card p-4 hover:border-surface-3 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-[12px] text-muted font-medium">
          <Icon size={14} />
          {label}
        </div>
        {extra}
      </div>
      <div className={cn('text-[22px] font-semibold tracking-tight mt-1.5 tabular', valueClass)}>{value}</div>
      {hint && <div className="text-[11.5px] text-muted mt-0.5">{hint}</div>}
    </motion.button>
  )
}

function Link({ children, onClick }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-1 text-[12px] text-muted hover:text-accent transition-colors">
      {children}
      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

const avatarColors = ['bg-accent-soft text-accent', 'bg-violet-soft text-violet', 'bg-ok-soft text-ok', 'bg-warn-soft text-warn', 'bg-bad-soft text-bad']
export function Avatar({ name = '?', size = 32 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr-TR'))
    .join('')
  const idx = [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % avatarColors.length
  return (
    <div className={cn('shrink-0 rounded-lg grid place-items-center font-semibold', avatarColors[idx])} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials || '?'}
    </div>
  )
}
