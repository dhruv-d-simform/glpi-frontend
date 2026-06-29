import { useState } from 'react'
import { Modal, Spinner } from './ui'
import { RefSelect } from './RefSelect'
import type { AssetType, FieldDef } from '../config/assets'
import type { AssetRecord, Ref } from '../api/types'
import { useCreateAsset, useUpdateAsset } from '../lib/queries'

type Value = string | number | boolean | null

function initialValue(field: FieldDef, record?: AssetRecord | null): Value {
  if (!record) return field.type === 'boolean' ? false : null
  const raw = record[field.key]
  if (field.type === 'ref') return (raw as Ref | null)?.id ?? null
  if (field.type === 'boolean') return Boolean(raw)
  return (raw as Value) ?? null
}

export function AssetForm({
  type, record, onClose,
}: {
  type: AssetType
  record?: AssetRecord | null
  onClose: () => void
}) {
  const editing = !!record
  const create = useCreateAsset(type)
  const update = useUpdateAsset(type)
  const busy = create.isPending || update.isPending

  const [values, setValues] = useState<Record<string, Value>>(() => {
    const v: Record<string, Value> = {}
    for (const f of type.fields) v[f.key] = initialValue(f, record)
    return v
  })
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: Value) => setValues((p) => ({ ...p, [k]: v }))

  const sections = Array.from(new Set(type.fields.map((f) => f.section ?? 'Details')))

  async function submit() {
    setError(null)
    const body: Record<string, unknown> = {}
    for (const f of type.fields) {
      const v = values[f.key]
      if (f.type === 'ref') {
        if (v != null) body[f.key] = { id: Number(v) }
      } else if (f.type === 'boolean') {
        body[f.key] = Boolean(v)
      } else if (f.type === 'number') {
        if (v !== null && v !== '') body[f.key] = Number(v)
      } else {
        if (v !== null && v !== '') body[f.key] = String(v)
      }
    }
    if (!body.name) {
      setError('A name is required.')
      return
    }
    try {
      if (editing && record) await update.mutateAsync({ id: record.id, body })
      else await create.mutateAsync(body)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={editing ? `Edit ${type.singular}` : `New ${type.singular}`}
      subtitle={editing ? record?.name : `Add a ${type.singular.toLowerCase()} to the inventory`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            {editing ? 'Save changes' : 'Create'}
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
              {type.fields
                .filter((f) => (f.section ?? 'Details') === section)
                .map((f) => (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="label">
                      {f.label}
                      {f.required && <span className="text-rose-500"> *</span>}
                    </label>
                    {f.type === 'ref' ? (
                      <RefSelect
                        endpoint={f.refEndpoint!}
                        value={values[f.key] as number | null}
                        onChange={(id) => set(f.key, id)}
                      />
                    ) : f.type === 'textarea' ? (
                      <textarea
                        className="input min-h-[96px] font-mono text-xs leading-relaxed"
                        value={(values[f.key] as string) ?? ''}
                        onChange={(e) => set(f.key, e.target.value)}
                      />
                    ) : f.type === 'boolean' ? (
                      <button
                        type="button"
                        onClick={() => set(f.key, !values[f.key])}
                        className={`flex h-[38px] w-full items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                          values[f.key]
                            ? 'border-brand-200 bg-brand-50 text-brand-700'
                            : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                            values[f.key] ? 'bg-brand-600' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`h-4 w-4 rounded-full bg-white transition ${values[f.key] ? 'translate-x-4' : ''}`} />
                        </span>
                        {values[f.key] ? 'Yes' : 'No'}
                      </button>
                    ) : (
                      <input
                        className="input"
                        type={f.type === 'number' ? 'number' : 'text'}
                        placeholder={f.placeholder}
                        value={(values[f.key] as string) ?? ''}
                        onChange={(e) => set(f.key, e.target.value)}
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
