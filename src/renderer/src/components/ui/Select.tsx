import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Search } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export default function Select({ value, onChange, options, placeholder = 'Select…', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const openDropdown = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
    setQuery('')
    setOpen(true)
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5
                    bg-bg-surface border rounded-md text-sm text-left cursor-pointer
                    focus:outline-none transition-colors
                    ${open ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border-subtle hover:border-border-default'}`}
      >
        <span className={selected ? 'text-text-primary' : 'text-text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-bg-elevated border border-border-default rounded-lg
                     shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border-subtle">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted
                         focus:outline-none"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-40 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted">No results</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2
                              text-sm text-left cursor-pointer transition-colors
                              ${opt.value === value
                                ? 'text-accent bg-accent/8'
                                : 'text-text-primary hover:bg-white/6'
                              }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3 h-3 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
