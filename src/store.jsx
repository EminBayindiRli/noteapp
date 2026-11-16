import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { uid } from './utils'

export const emptyData = () => ({
  version: 1,
  clients: [],
  tasks: [],
  routines: [],
  transactions: [],
  leads: [],
  notes: [],
  settings: { theme: 'light', name: '' },
})

const StoreCtx = createContext(null)
const LS_KEY = 'noteapp-data'

const normalize = (loaded) => ({
  ...emptyData(),
  ...(loaded || {}),
  settings: { ...emptyData().settings, ...(loaded?.settings || {}) },
})

export function StoreProvider({ children }) {
  const [data, setData] = useState(null)
  const timer = useRef(null)
  const latest = useRef(null)

  useEffect(() => {
    ;(async () => {
      let loaded = null
      try {
        loaded = window.api ? await window.api.load() : JSON.parse(localStorage.getItem(LS_KEY) || 'null')
      } catch {}
      setData(normalize(loaded))
    })()
  }, [])

  const write = (d) => {
    if (window.api) window.api.save(d)
    else localStorage.setItem(LS_KEY, JSON.stringify(d))
  }

  const persist = useCallback((d) => {
    latest.current = d
    clearTimeout(timer.current)
    timer.current = setTimeout(() => write(d), 250)
  }, [])

  useEffect(() => {
    const flush = () => latest.current && write(latest.current)
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  const update = useCallback(
    (fn) =>
      setData((prev) => {
        const next = fn(prev)
        persist(next)
        return next
      }),
    [persist],
  )

  const api = {
    data,
    update,
    replaceAll: (d) => update(() => normalize(d)),
    add: (col, item) => {
      const it = { id: uid(), createdAt: new Date().toISOString(), ...item }
      update((p) => ({ ...p, [col]: [it, ...p[col]] }))
      return it
    },
    patch: (col, id, changes) =>
      update((p) => ({
        ...p,
        [col]: p[col].map((x) => (x.id === id ? { ...x, ...(typeof changes === 'function' ? changes(x) : changes) } : x)),
      })),
    remove: (col, id) => update((p) => ({ ...p, [col]: p[col].filter((x) => x.id !== id) })),
    setSetting: (k, v) => update((p) => ({ ...p, settings: { ...p.settings, [k]: v } })),
  }

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
