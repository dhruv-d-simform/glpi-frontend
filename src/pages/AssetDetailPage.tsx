import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Cpu } from 'lucide-react'
import { assetByKey, type AssetType, type SubResourceDef } from '../config/assets'
import { useAsset, useSubResource, useDeleteAsset } from '../lib/queries'
import type { AssetRecord, Ref } from '../api/types'
import { AssetForm } from '../components/AssetForm'
import { Modal, Spinner, StatusBadge } from '../components/ui'

export function AssetDetailPage() {
  const { typeKey, id } = useParams()
  const type = assetByKey(typeKey)
  const navigate = useNavigate()
  const numId = Number(id)
  const { data, isLoading } = useAsset(type!, numId)
  const del = useDeleteAsset(type!)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  if (!type) return <div className="p-8">Unknown asset type.</div>
  if (isLoading) return <div className="flex justify-center py-24 text-slate-400"><Spinner className="h-8 w-8" /></div>
  if (!data) return <div className="p-8">Not found.</div>

  const Icon = type.icon

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <Link to={`/assets/${type.key}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={16} /> Back to {type.label}
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Icon className={type.accent} size={26} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{data.name}</h1>
              <StatusBadge name={(data.status as Ref | null)?.name} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[(data.manufacturer as Ref | null)?.name, (data.model as Ref | null)?.name, data.serial]
                .filter(Boolean).join(' · ') || type.singular}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>
          <button className="btn-danger" onClick={() => setConfirm(true)}><Trash2 size={15} /> Delete</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Facts type={type} record={data} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          {data.comment && (
            <section className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                <Cpu size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700">Inventory snapshot</h3>
                <span className="ml-auto text-xs text-slate-400">collected by agent</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-relaxed text-slate-600">
                {String(data.comment)}
              </pre>
            </section>
          )}

          {type.subResources?.map((sub) => (
            <SubPanel key={sub.key} type={type} id={numId} sub={sub} />
          ))}
        </div>
      </div>

      {editing && <AssetForm type={type} record={data} onClose={() => setEditing(false)} />}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Delete ${type.singular.toLowerCase()}?`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirm(false)} disabled={del.isPending}>Cancel</button>
            <button className="btn-danger" disabled={del.isPending}
              onClick={async () => { await del.mutateAsync(numId); navigate(`/assets/${type.key}`) }}>
              {del.isPending && <Spinner className="h-4 w-4" />} Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This permanently removes <span className="font-semibold text-slate-900">{data.name}</span>. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

function refName(v: unknown): string | null {
  if (v && typeof v === 'object' && 'name' in (v as object)) return (v as Ref).name ?? null
  return null
}

function Facts({ type, record }: { type: AssetType; record: AssetRecord }) {
  const sections = Array.from(new Set(type.fields.filter((f) => f.key !== 'comment').map((f) => f.section ?? 'Details')))
  return (
    <div className="card divide-y divide-slate-100">
      {sections.map((section) => {
        const fields = type.fields.filter((f) => (f.section ?? 'Details') === section && f.key !== 'comment')
        return (
          <div key={section} className="px-5 py-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{section}</h3>
            <dl className="space-y-2.5">
              {fields.map((f) => {
                const raw = record[f.key]
                let display: React.ReactNode
                if (f.key === 'status') display = <StatusBadge name={refName(raw) ?? undefined} />
                else if (f.type === 'ref') display = refName(raw) ?? <span className="text-slate-300">—</span>
                else if (f.type === 'boolean') display = raw ? 'Yes' : 'No'
                else display = raw != null && raw !== '' ? String(raw) : <span className="text-slate-300">—</span>
                return (
                  <div key={f.key} className="flex items-baseline justify-between gap-4">
                    <dt className="shrink-0 text-sm text-slate-500">{f.label}</dt>
                    <dd className="text-right text-sm font-medium text-slate-800">{display}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        )
      })}
    </div>
  )
}

function SubPanel({ type, id, sub }: { type: AssetType; id: number; sub: SubResourceDef }) {
  const { data, isLoading } = useSubResource(type.endpoint, id, sub.key)
  const rows = Array.isArray(data) ? data : data ? [data] : []
  if (isLoading) return null
  if (rows.length === 0) return null

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-bold text-slate-700">{sub.label}</h3>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              {sub.columns.map((c) => <th key={c.key} className="px-5 py-2.5">{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                {sub.columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-5 py-2.5 text-slate-600">
                    {renderSubCell(r[c.key], c.ref)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function renderSubCell(v: unknown, isRef?: boolean): React.ReactNode {
  if (isRef) return refName(v) ?? <span className="text-slate-300">—</span>
  if (typeof v === 'boolean') return v ? '✓' : '—'
  if (v === null || v === undefined || v === '') return <span className="text-slate-300">—</span>
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10)
  return String(v)
}
