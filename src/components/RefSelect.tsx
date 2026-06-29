import { useDropdown } from '../lib/queries'
import type { DropdownRow } from '../api/types'

export function rowLabel(r: DropdownRow): string {
  if (r.realname || r.firstname) return `${r.firstname ?? ''} ${r.realname ?? ''}`.trim() || r.username || `#${r.id}`
  return r.completename || r.name || r.username || `#${r.id}`
}

export function RefSelect({
  endpoint, value, onChange, placeholder = 'Select…',
}: {
  endpoint: string
  value?: number | null
  onChange: (id: number | null) => void
  placeholder?: string
}) {
  const { data, isLoading } = useDropdown(endpoint)
  const options = (data ?? []).slice().sort((a, b) => rowLabel(a).localeCompare(rowLabel(b)))

  return (
    <select
      className="input appearance-none bg-[length:1.1em] pr-9"
      value={value ?? ''}
      disabled={isLoading}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.6rem center',
      }}
    >
      <option value="">{isLoading ? 'Loading…' : placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {rowLabel(o)}
        </option>
      ))}
    </select>
  )
}
