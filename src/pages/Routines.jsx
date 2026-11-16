import { AnimatePresence, motion } from 'framer-motion'
import { Flame, GripVertical, Plus, Repeat } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, DeleteButton, Empty, Input, PageHeader, Ring, listItem, spring } from '../components/ui'
import { useStore } from '../store'
import { addDays, cn, dayKey, routineStreak, today } from '../utils'

const DAYS = 14

export default function Routines() {
  const { data, add, patch, remove } = useStore()
  const [title, setTitle] = useState('')
  const t = today()
  const days = Array.from({ length: DAYS }, (_, i) => addDays(new Date(), i - DAYS + 1))
  const doneToday = data.routines.filter((r) => r.log?.[t]).length
  const total = data.routines.length

  const toggle = (r, k) =>
    patch('routines', r.id, (x) => {
      const log = { ...(x.log || {}) }
      if (log[k]) delete log[k]
      else log[k] = true
      return { log }
    })

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    add('routines', { title: title.trim(), log: {} })
    setTitle('')
  }

  // Son 14 günün tamamlanma oranı
  const rate = total
    ? days.reduce((s, d) => s + data.routines.filter((r) => r.log?.[dayKey(d)]).length, 0) / (total * DAYS)
    : 0

  return (
    <div className="px-10 pb-10 max-w-[1100px] mx-auto">
      <PageHeader title="Rutinler" subtitle="Her gün yapmak istediğin şeyler. Bugünün kutusuna tıkla, seriyi bozma." />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="p-4 flex items-center gap-4">
          <Ring value={total ? doneToday / total : 0} size={60} stroke={6}>
            <span className="text-[13px] font-semibold tabular">{total ? Math.round((doneToday / total) * 100) : 0}%</span>
          </Ring>
          <div>
            <div className="text-[12px] text-muted font-medium">Bugün</div>
            <div className="text-[20px] font-semibold tabular">{doneToday} / {total}</div>
            <div className="text-[11.5px] text-muted">{total && doneToday === total ? 'Hepsi tamam, harika!' : 'rutin tamamlandı'}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] text-muted font-medium">Son 14 gün</div>
          <div className="text-[20px] font-semibold tabular mt-1">{Math.round(rate * 100)}%</div>
          <div className="text-[11.5px] text-muted">ortalama tamamlama</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] text-muted font-medium">En uzun aktif seri</div>
          <div className="text-[20px] font-semibold tabular mt-1 flex items-center gap-1.5">
            <Flame size={18} className="text-warn" />
            {Math.max(0, ...data.routines.map((r) => routineStreak(r.log)))} gün
          </div>
          <div className="text-[11.5px] text-muted">üst üste</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <form onSubmit={submit} className="flex gap-2 p-3 border-b border-line">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Yeni rutin: örn. 30 dk yürüyüş, e-postaları kontrol et, 20 sayfa kitap…" />
          <Button type="submit" variant="primary" icon={Plus} disabled={!title.trim()}>Ekle</Button>
        </form>

        {total === 0 ? (
          <Empty icon={Repeat} title="Henüz rutin yok" text="Günlük alışkanlıklarını ekle; her gün işaretledikçe serin büyür." />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid items-end px-3 pt-3 pb-1 text-[11px] text-muted" style={{ gridTemplateColumns: `minmax(200px,1fr) repeat(${DAYS}, 34px) 64px 36px` }}>
                <span className="pl-6">Rutin</span>
                {days.map((d) => {
                  const k = dayKey(d)
                  return (
                    <span key={k} className={cn('text-center leading-tight', k === t && 'text-accent font-semibold')}>
                      {d.toLocaleDateString('tr-TR', { weekday: 'short' }).slice(0, 2)}
                      <br />
                      <span className="tabular">{d.getDate()}</span>
                    </span>
                  )
                })}
                <span className="text-center">Seri</span>
                <span />
              </div>
              <AnimatePresence initial={false}>
                {data.routines.map((r) => (
                  <motion.div
                    key={r.id}
                    {...listItem}
                    className="group grid items-center px-3 py-1.5 hover:bg-surface-2/50"
                    style={{ gridTemplateColumns: `minmax(200px,1fr) repeat(${DAYS}, 34px) 64px 36px` }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical size={14} className="text-muted/30 shrink-0" />
                      <input
                        value={r.title}
                        onChange={(e) => patch('routines', r.id, { title: e.target.value })}
                        className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px]"
                      />
                    </div>
                    {days.map((d) => {
                      const k = dayKey(d)
                      const on = !!r.log?.[k]
                      const isToday = k === t
                      return (
                        <div key={k} className="grid place-items-center">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => toggle(r, k)}
                            aria-label={`${r.title} ${k}`}
                            className={cn(
                              'rounded-md transition-colors duration-150',
                              isToday ? 'size-7' : 'size-6',
                              on ? 'bg-ok' : isToday ? 'bg-surface border-2 border-dashed border-accent/50 hover:border-accent' : 'bg-surface-2 hover:bg-surface-3',
                            )}
                          >
                            <AnimatePresence>
                              {on && (
                                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} viewBox="0 0 24 24" className="size-full p-1.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12l5 5L20 7" />
                                </motion.svg>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-center gap-1 text-[12.5px] font-medium tabular">
                      {routineStreak(r.log) > 0 && <Flame size={13} className="text-warn" />}
                      {routineStreak(r.log)}
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteButton onConfirm={() => remove('routines', r.id)} />
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="h-2" />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
