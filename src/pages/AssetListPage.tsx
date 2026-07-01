import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { resolveType, typeBase, type AssetType } from '../config/assets'
import { useAssets, useDeleteAsset } from '../lib/queries'
import type { AssetRecord, Ref } from '../api/types'
import { AssetForm } from '../components/AssetForm'
import { Modal, Spinner, StatusBadge, EmptyState } from '../components/ui'

function cell(record: AssetRecord, key: string) {
  const v = record[key]
  if (key === 'status') return <StatusBadge name={(v as Ref | null)?.name} />
  if (v && typeof v === 'object' && 'name' in (v as object)) {
    return <span className="text-slate-600">{(v as Ref).name || '—'}</span>
  }
  if (v === null || v === undefined || v === '') return <span className="text-slate-300">—</span>
  return <span className="text-slate-600">{String(v)}</span>
}

export function AssetListPage() {
  const { typeKey } = useParams()
  const type = resolveType(typeKey)
  if (!type) return <div className="p-8">Unknown asset type.</div>
  return <AssetList key={type.key} type={type} />
}

function AssetList({ type }: { type: AssetType }) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useAssets(type)
  const del = useDeleteAsset(type)
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AssetRecord | null>(null)
  const [confirm, setConfirm] = useState<AssetRecord | null>(null)

  const cols = type.fields.filter((f) => f.inTable)
  const Icon = type.icon

  const rows = useMemo(() => {
    const list = data ?? []
    if (!q.trim()) return list
    const needle = q.toLowerCase()
    return list.filter((r) =>
      [r.name, r.serial, r.otherserial, (r.user as Ref | null)?.name, (r.model as Ref | null)?.name]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle)),
    )
  }, [data, q])

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <Icon className={type.accent} size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{type.label}</h1>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Loading…' : `${rows.length} of ${data?.length ?? 0} ${type.label.toLowerCase()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input w-64 pl-9"
              placeholder={`Search ${type.label.toLowerCase()}…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> New {type.singular.toLowerCase()}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Failed to load: {(error as Error).message}</div>
      ) : isLoading ? (
        <div className="flex justify-center py-20 text-slate-400"><Spinner className="h-8 w-8" /></div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Icon size={40} />}
          title={q ? 'No matches' : `No ${type.label.toLowerCase()} yet`}
          hint={q ? 'Try a different search.' : `Create your first ${type.singular.toLowerCase()}.`}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {cols.map((c) => (
                  <th key={c.key} className="px-4 py-3">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="group cursor-pointer transition hover:bg-brand-50/40"
                  onClick={() => navigate(`/${typeBase(type)}/${type.key}/${r.id}`)}
                >
                  {cols.map((c, i) => (
                    <td key={c.key} className="px-4 py-3">
                      {i === 0 ? (
                        <span className="flex items-center gap-2 font-semibold text-slate-900">
                          {cell(r, c.key)}
                        </span>
                      ) : (
                        cell(r, c.key)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-brand-600 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setEditing(r) }}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setConfirm(r) }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                      <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <AssetForm type={type} onClose={() => setCreating(false)} />}
      {editing && <AssetForm type={type} record={editing} onClose={() => setEditing(null)} />}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Delete ${type.singular.toLowerCase()}?`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirm(null)} disabled={del.isPending}>Cancel</button>
            <button
              className="btn-danger"
              disabled={del.isPending}
              onClick={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null) } }}
            >
              {del.isPending && <Spinner className="h-4 w-4" />} Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This permanently removes <span className="font-semibold text-slate-900">{confirm?.name}</span> and its inventory
          links. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
