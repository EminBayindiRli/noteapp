import { AnimatePresence, motion } from 'framer-motion'
import { NotebookPen, Pin, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, DeleteButton, Empty, Input, spring } from '../components/ui'
import { useStore } from '../store'
import { cn, fmtDateTime } from '../utils'

export default function Notes() {
  const { data, add, patch, remove } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)

  const list = useMemo(() => {
    const s = q.toLocaleLowerCase('tr-TR')
    return data.notes
      .filter((n) => !s || (n.title + ' ' + n.body).toLocaleLowerCase('tr-TR').includes(s))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [data.notes, q])

  useEffect(() => {
    if (!sel && list[0]) setSel(list[0].id)
  }, [list, sel])

  const note = data.notes.find((n) => n.id === sel)
  const create = () => {
    const n = add('notes', { title: '', body: '', pinned: false, updatedAt: new Date().toISOString() })
    setSel(n.id)
  }
  const edit = (changes) => patch('notes', note.id, { ...changes, updatedAt: new Date().toISOString() })

  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        create()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  return (
    <div className="h-full flex">
      <div className="w-[290px] shrink-0 border-r border-line flex flex-col">
        <div className="px-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold tracking-tight">Notlar</h1>
            <Button variant="primary" size="sm" icon={Plus} onClick={create} title="Ctrl+N">Yeni</Button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Notlarda ara…" className="pl-8" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {list.length === 0 && <Empty icon={NotebookPen} title={data.notes.length ? 'Sonuç yok' : 'Not yok'} text={data.notes.length ? undefined : 'Fikirler, planlar, toplantı notları… (Ctrl+N)'} />}
          <AnimatePresence initial={false}>
            {list.map((n) => (
              <motion.button
                key={n.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSel(n.id)}
                className={cn('relative w-full text-left p-3 rounded-lg', sel !== n.id && 'hover:bg-surface-2/60')}
              >
                {sel === n.id && <motion.span layoutId="note-sel" className="absolute inset-0 rounded-lg bg-surface border border-line shadow-card" transition={spring} />}
                <span className="relative flex items-center gap-1.5">
                  {n.pinned && <Pin size={12} className="text-accent shrink-0" fill="currentColor" />}
                  <span className="text-[13px] font-medium truncate">{n.title || 'Başlıksız not'}</span>
                </span>
                <span className="relative block text-[12px] text-muted truncate mt-0.5">{n.body?.split('\n')[0] || 'Boş'}</span>
                <span className="relative block text-[10.5px] text-muted/80 mt-1">{fmtDateTime(n.updatedAt || n.createdAt)}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {note ? (
          <motion.div key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col px-10 pb-6 max-w-[860px] w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11.5px] text-muted">Son düzenleme: {fmtDateTime(note.updatedAt || note.createdAt)}</span>
              <div className="ml-auto flex items-center gap-1">
                <Button size="sm" variant={note.pinned ? 'subtle' : 'ghost'} icon={Pin} onClick={() => edit({ pinned: !note.pinned })}>
                  {note.pinned ? 'Sabitlendi' : 'Sabitle'}
                </Button>
                <DeleteButton
                  onConfirm={() => {
                    remove('notes', note.id)
                    setSel(null)
                  }}
                />
              </div>
            </div>
            <input
              autoFocus={!note.title}
              value={note.title}
              onChange={(e) => edit({ title: e.target.value })}
              placeholder="Başlık"
              className="bg-transparent outline-none text-[26px] font-semibold tracking-tight placeholder:text-muted/50 mb-3"
            />
            <textarea
              value={note.body}
              onChange={(e) => edit({ body: e.target.value })}
              placeholder="Yazmaya başla…"
              className="flex-1 bg-transparent outline-none resize-none text-[14.5px] leading-[1.75] text-fg-2 placeholder:text-muted/50"
            />
          </motion.div>
        ) : (
          <div className="flex-1 grid place-items-center">
            <Empty icon={NotebookPen} title="Not seçilmedi" text="Genel notların, fikirlerin ve planların için." action={<Button variant="primary" icon={Plus} onClick={create}>Yeni not</Button>} />
          </div>
        )}
      </div>
    </div>
  )
}
