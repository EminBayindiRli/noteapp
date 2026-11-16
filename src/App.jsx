import { AnimatePresence, motion } from 'framer-motion'
import {
  Briefcase,
  CheckSquare,
  LayoutDashboard,
  Moon,
  NotebookPen,
  Repeat,
  Settings as SettingsIcon,
  Sun,
  Target,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { spring } from './components/ui'
import { useStore } from './store'
import { cn, today } from './utils'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Tasks from './pages/Tasks'
import Routines from './pages/Routines'
import Finance from './pages/Finance'
import Leads from './pages/Leads'
import Notes from './pages/Notes'
import Settings from './pages/Settings'

const PAGES = [
  { id: 'dashboard', label: 'Genel bakış', icon: LayoutDashboard, el: Dashboard },
  { id: 'clients', label: 'Müşteriler', icon: Briefcase, el: Clients },
  { id: 'tasks', label: 'Görevler', icon: CheckSquare, el: Tasks },
  { id: 'routines', label: 'Rutinler', icon: Repeat, el: Routines },
  { id: 'finance', label: 'Para', icon: Wallet, el: Finance },
  { id: 'leads', label: 'Müşteri arayışı', icon: Target, el: Leads },
  { id: 'notes', label: 'Notlar', icon: NotebookPen, el: Notes },
]

export default function App() {
  const { data, setSetting } = useStore()
  const [page, setPage] = useState(() => {
    const h = window.location.hash.slice(1)
    return PAGES.some((p) => p.id === h) || h === 'settings' ? h : 'dashboard'
  })
  const [focus, setFocus] = useState(null) // başka sayfadan belirli bir kayda gitmek için

  const dark = data?.settings.theme === 'dark'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    window.api?.setTheme(dark)
  }, [dark])

  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey && /^[1-8]$/.test(e.key)) {
        e.preventDefault()
        const all = [...PAGES, { id: 'settings' }]
        setPage(all[Number(e.key) - 1].id)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (!data) return <div className="h-full bg-bg" />

  const go = (id, f = null) => {
    setFocus(f)
    setPage(id)
  }

  const counts = {
    clients: data.clients.filter((c) => c.status === 'devam' || c.status === 'teklif').length,
    tasks: data.tasks.filter((t) => !t.done && t.due && t.due <= today()).length,
    routines: data.routines.filter((r) => !r.log?.[today()]).length,
    leads: data.leads.filter((l) => l.nextDate && l.nextDate <= today() && !['kazanildi', 'kaybedildi'].includes(l.status)).length,
  }

  const Current = page === 'settings' ? Settings : PAGES.find((p) => p.id === page).el

  return (
    <div className="h-full flex bg-bg text-fg">
      {/* Kenar çubuğu */}
      <aside className="w-[232px] shrink-0 flex flex-col border-r border-line bg-bg">
        <div className="drag h-10 shrink-0" />
        <div className="px-4 pb-5 flex items-center gap-2.5">
          <div className="size-8 rounded-[10px] bg-fg text-bg grid place-items-center">
            <NotebookPen size={16} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight">noteapp</div>
            <div className="text-[11px] text-muted">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </div>

        <nav className="flex-1 px-2.5 space-y-0.5">
          {PAGES.map((p, i) => (
            <NavItem key={p.id} item={p} active={page === p.id} count={counts[p.id]} onClick={() => go(p.id)} shortcut={i + 1} />
          ))}
        </nav>

        <div className="p-2.5 space-y-0.5 border-t border-line">
          <NavItem item={{ id: 'settings', label: 'Ayarlar & yedek', icon: SettingsIcon }} active={page === 'settings'} onClick={() => go('settings')} />
          <button
            onClick={() => setSetting('theme', dark ? 'light' : 'dark')}
            className="w-full h-9 px-2.5 flex items-center gap-2.5 rounded-lg text-[13px] text-muted hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={dark ? 'm' : 's'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </AnimatePresence>
            {dark ? 'Açık tema' : 'Koyu tema'}
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="drag h-10 shrink-0" />
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 overflow-y-auto"
            >
              <Current go={go} focus={focus} clearFocus={() => setFocus(null)} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function NavItem({ item, active, count, onClick, shortcut }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      title={shortcut ? `Ctrl+${shortcut}` : undefined}
      className={cn(
        'relative w-full h-9 px-2.5 flex items-center gap-2.5 rounded-lg text-[13px] transition-colors duration-150',
        active ? 'text-fg font-medium' : 'text-muted hover:text-fg hover:bg-surface-2/70',
      )}
    >
      {active && (
        <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-surface border border-line shadow-card" transition={spring} />
      )}
      <Icon size={16} className={cn('relative', active && 'text-accent')} />
      <span className="relative flex-1 text-left">{item.label}</span>
      {count > 0 && (
        <span className="relative min-w-5 h-5 px-1.5 rounded-md bg-accent-soft text-accent text-[11px] font-semibold grid place-items-center tabular">
          {count}
        </span>
      )}
    </button>
  )
}
