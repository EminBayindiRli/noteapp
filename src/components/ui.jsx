import { AnimatePresence, motion } from 'framer-motion'
import { Check, Trash2, X } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { cn } from '../utils'

export const spring = { type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 select-none disabled:opacity-50 whitespace-nowrap'
const btnVariants = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 shadow-card',
  dark: 'bg-fg text-bg hover:opacity-90',
  subtle: 'bg-surface border border-line text-fg-2 hover:bg-surface-2 hover:text-fg shadow-card',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-bad-soft text-bad hover:brightness-95',
}
const btnSizes = { sm: 'h-7 px-2.5 text-xs', md: 'h-9 px-3.5 text-[13px]', icon: 'h-8 w-8', iconSm: 'h-7 w-7' }

export const Button = forwardRef(function Button(
  { variant = 'subtle', size = 'md', icon: Icon, className, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.08 }}
      className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' || size === 'iconSm' ? 14 : 16} strokeWidth={2} />}
      {children}
    </motion.button>
  )
})

export const inputCls =
  'w-full h-9 rounded-lg bg-surface border border-line px-3 text-[13px] text-fg placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-3 focus:ring-accent/15 outline-none'

export const Input = forwardRef(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(inputCls, className)} {...p} />
})

export const Textarea = forwardRef(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(inputCls, 'h-auto py-2 resize-none leading-relaxed', className)} {...p} />
})

export function Select({ className, children, ...p }) {
  return (
    <select className={cn(inputCls, 'pr-8 cursor-pointer appearance-none bg-no-repeat', className)} style={chev} {...p}>
      {children}
    </select>
  )
}
const chev = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 10px center',
}

export function Field({ label, children, className }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

export function Card({ className, children, ...p }) {
  return (
    <div className={cn('rounded-xl bg-surface border border-line shadow-card', className)} {...p}>
      {children}
    </div>
  )
}

export function CardHeader({ title, icon: Icon, action, className }) {
  return (
    <div className={cn('flex items-center justify-between px-4 pt-3.5 pb-2', className)}>
      <div className="flex items-center gap-2 text-[13px] font-semibold text-fg">
        {Icon && <Icon size={15} className="text-muted" />}
        {title}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

const tones = {
  gray: 'bg-surface-2 text-fg-2',
  blue: 'bg-accent-soft text-accent',
  green: 'bg-ok-soft text-ok',
  red: 'bg-bad-soft text-bad',
  amber: 'bg-warn-soft text-warn',
  violet: 'bg-violet-soft text-violet',
}
export const toneDot = {
  gray: 'bg-muted',
  blue: 'bg-accent',
  green: 'bg-ok',
  red: 'bg-bad',
  amber: 'bg-warn',
  violet: 'bg-violet',
}
export function Badge({ tone = 'gray', dot, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md text-[11.5px] font-medium', tones[tone], className)}>
      {dot && <span className={cn('size-1.5 rounded-full', toneDot[tone])} />}
      {children}
    </span>
  )
}

export function Checkbox({ checked, onChange, size = 18, className, label }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || 'İşaretle'}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      whileTap={{ scale: 0.85 }}
      className={cn(
        'shrink-0 grid place-items-center rounded-[6px] border transition-colors duration-150',
        checked ? 'bg-accent border-accent text-white' : 'border-surface-3 hover:border-muted bg-surface',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={spring}>
            <Check size={size - 6} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function Modal({ open, onClose, title, children, footer, width = 480 }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full rounded-2xl bg-surface border border-line shadow-pop"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-1">
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <Button variant="ghost" size="iconSm" icon={X} onClick={onClose} aria-label="Kapat" />
            </div>
            <div className="px-5 py-3">{children}</div>
            {footer && <div className="flex justify-end gap-2 px-5 pb-4 pt-1">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Empty({ icon: Icon, title, text, action, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}
    >
      {Icon && (
        <div className="size-11 rounded-xl bg-surface-2 grid place-items-center text-muted mb-3">
          <Icon size={20} />
        </div>
      )}
      <div className="text-[13.5px] font-medium text-fg">{title}</div>
      {text && <div className="text-[12.5px] text-muted mt-1 max-w-xs">{text}</div>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}

/** İki tıklamayla silme: ilk tık "emin misin" moduna geçer */
export function DeleteButton({ onConfirm, size = 'iconSm', className, label = 'Sil' }) {
  const [armed, setArmed] = useState(false)
  const t = useRef()
  useEffect(() => () => clearTimeout(t.current), [])
  return (
    <motion.button
      type="button"
      layout
      aria-label={label}
      title={armed ? 'Silmek için tekrar tıkla' : label}
      onClick={(e) => {
        e.stopPropagation()
        if (armed) {
          clearTimeout(t.current)
          onConfirm()
        } else {
          setArmed(true)
          t.current = setTimeout(() => setArmed(false), 2500)
        }
      }}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-lg transition-colors duration-150',
        armed ? 'bg-bad text-white px-2 h-7 text-xs font-medium' : 'text-muted hover:text-bad hover:bg-bad-soft',
        !armed && (size === 'iconSm' ? 'size-7' : 'size-8'),
        className,
      )}
    >
      <Trash2 size={14} />
      {armed && <span>Emin misin?</span>}
    </motion.button>
  )
}

export function Segmented({ value, onChange, options, layoutId, className }) {
  return (
    <div className={cn('inline-flex p-0.5 rounded-lg bg-surface-2 border border-line', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'relative h-7 px-3 text-[12.5px] font-medium rounded-md transition-colors duration-150',
            value === o.value ? 'text-fg' : 'text-muted hover:text-fg',
          )}
        >
          {value === o.value && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-md bg-surface shadow-card border border-line" transition={spring} />
          )}
          <span className="relative flex items-center gap-1.5">
            {o.label}
            {o.count !== undefined && <span className="text-[11px] text-muted tabular">{o.count}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Progress({ value, tone = 'accent', className }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div className={cn('h-1.5 rounded-full bg-surface-2 overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full', tone === 'ok' ? 'bg-ok' : tone === 'bad' ? 'bg-bad' : 'bg-accent')}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      />
    </div>
  )
}

export function Ring({ value, size = 56, stroke = 5, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={value >= 1 ? 'var(--ok)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/** Sayfa içi liste animasyonu için ortak prop'lar */
export const listItem = {
  layout: true,
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
  transition: spring,
}

export function SearchInput({ value, onChange, placeholder = 'Ara…', className, icon: Icon }) {
  return (
    <div className={cn('relative', className)}>
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />}
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={Icon ? 'pl-8' : ''} />
    </div>
  )
}
