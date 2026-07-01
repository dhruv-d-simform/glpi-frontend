import { useState } from 'react'
import { DollarSign, Pencil } from 'lucide-react'
import { Modal, Spinner } from './ui'
import { RefSelect } from './RefSelect'
import type { AssetType, FieldDef } from '../config/assets'
import type { Ref } from '../api/types'
import { useInfocom, useSaveInfocom } from '../lib/queries'

const FIELDS: FieldDef[] = [
  { key: 'value', label: 'Purchase price ($)', type: 'number', section: 'Purchase' },
  { key: 'supplier', label: 'Supplier', type: 'ref', refEndpoint: '/Management/Supplier', section: 'Purchase' },
  { key: 'budget', label: 'Budget', type: 'ref', refEndpoint: '/Management/Budget', section: 'Purchase' },
  { key: 'business_criticity', label: 'Business criticality', type: 'ref', refEndpoint: '/Dropdowns/BusinessCriticity', section: 'Purchase' },
  { key: 'order_number', label: 'Order #', type: 'text', section: 'Order' },
  { key: 'invoice_number', label: 'Invoice #', type: 'text', section: 'Order' },
  { key: 'delivery_number', label: 'Delivery #', type: 'text', section: 'Order' },
  { key: 'date_order', label: 'Order date', type: 'text', placeholder: 'YYYY-MM-DD', section: 'Order' },
  { key: 'date_buy', label: 'Purchase date', type: 'text', placeholder: 'YYYY-MM-DD', section: 'Order' },
  { key: 'date_delivery', label: 'Delivery date', type: 'text', placeholder: 'YYYY-MM-DD', section: 'Order' },
  { key: 'date_use', label: 'Put into service', type: 'text', placeholder: 'YYYY-MM-DD', section: 'Order' },
  { key: 'warranty_duration', label: 'Warranty (months)', type: 'number', section: 'Warranty' },
  { key: 'warranty_info', label: 'Warranty details', type: 'text', section: 'Warranty' },
  { key: 'amortization_time', label: 'Amortization (years)', type: 'number', section: 'Amortization' },
]

type Value = string | number | null

function refName(v: unknown): string | null {
  if (v && typeof v === 'object' && 'name' in (v as object)) return (v as Ref).name ?? null
  return null
}

function display(f: FieldDef, raw: unknown): React.ReactNode {
  if (f.type === 'ref') return refName(raw) ?? <span className="text-slate-300">—</span>
  if (f.key === 'value' && raw != null && raw !== '') return `$${Number(raw).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  return raw != null && raw !== '' ? String(raw) : <span className="text-slate-300">—</span>
}

export function InfocomPanel({ type, id }: { type: AssetType; id: number }) {
  const { data, isLoading } = useInfocom(type, id)
  const save = useSaveInfocom(type)
  const [editing, setEditing] = useState(false)

  if (isLoading) return null

  const sections = Array.from(new Set(FIELDS.map((f) => f.section!)))

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        <DollarSign size={16} className="text-slate-400" />
        <h3 className="text-sm font-bold text-slate-700">Purchase &amp; financial info</h3>
        <button className="ml-auto btn-ghost !px-2 !py-1 text-xs" onClick={() => setEditing(true)}>
          <Pencil size={13} /> {data ? 'Edit' : 'Add'}
        </button>
      </div>
      {data ? (
        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {sections.map((section) => (
            <div key={section} className="px-5 py-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{section}</h4>
              <dl className="space-y-2.5">
                {FIELDS.filter((f) => f.section === section).map((f) => (
                  <div key={f.key} className="flex items-baseline justify-between gap-4">
                    <dt className="shrink-0 text-sm text-slate-500">{f.label}</dt>
                    <dd className="text-right text-sm font-medium text-slate-800">{display(f, data[f.key])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-slate-400">No purchase information recorded yet.</p>
      )}

      {editing && (
        <InfocomForm type={type} id={id} record={data} exists={!!data} busy={save.isPending}
          onClose={() => setEditing(false)}
          onSave={async (body) => { await save.mutateAsync({ id, body, exists: !!data }); setEditing(false) }}
        />
      )}
    </section>
  )
}

function InfocomForm({
  type, id, record, exists, busy, onClose, onSave,
}: {
  type: AssetType
  id: number
  record?: Record<string, unknown> | null
  exists: boolean
  busy: boolean
  onClose: () => void
  onSave: (body: Record<string, unknown>) => Promise<void>
}) {
  const [values, setValues] = useState<Record<string, Value>>(() => {
    const v: Record<string, Value> = {}
    for (const f of FIELDS) {
      const raw = record?.[f.key]
      v[f.key] = f.type === 'ref' ? ((raw as Ref | null)?.id ?? null) : ((raw as Value) ?? null)
    }
    return v
  })
  const [error, setError] = useState<string | null>(null)
  const sections = Array.from(new Set(FIELDS.map((f) => f.section!)))

  async function submit() {
    setError(null)
    const body: Record<string, unknown> = {}
    for (const f of FIELDS) {
      const v = values[f.key]
      if (f.type === 'ref') { if (v != null) body[f.key] = { id: Number(v) } }
      else if (f.type === 'number') { if (v !== null && v !== '') body[f.key] = Number(v) }
      else if (v !== null && v !== '') body[f.key] = String(v)
    }
    try {
      await onSave(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`${exists ? 'Edit' : 'Add'} purchase & financial info`}
      subtitle={`${type.singular} #${id}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Save
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
          {error}
        </div>
      )}
      <div className="space-y-6">
        {sections.map((section) => (
          <fieldset key={section}>
            <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{section}</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FIELDS.filter((f) => f.section === section).map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  {f.type === 'ref' ? (
                    <RefSelect
                      endpoint={f.refEndpoint!}
                      value={values[f.key] as number | null}
                      onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                    />
                  ) : (
                    <input
                      className="input"
                      type={f.type === 'number' ? 'number' : 'text'}
                      placeholder={f.placeholder}
                      value={(values[f.key] as string) ?? ''}
                      onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </Modal>
  )
}
