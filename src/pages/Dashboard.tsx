import { Link } from 'react-router-dom'
import { ArrowUpRight, Boxes, MapPin } from 'lucide-react'
import { useAllCounts } from '../lib/queries'
import { statusTone } from '../config/assets'
import { Spinner } from '../components/ui'

export function Dashboard() {
  const data = useAllCounts()
  const total = data.reduce((s, d) => s + d.count, 0)
  const loading = data.some((d) => d.loading)

  // status + location breakdown across every asset
  const allRows = data.flatMap((d) => d.rows)
  const byStatus = tally(allRows.map((r) => (r.status as any)?.name ?? 'Unspecified'))
  const byLocation = tally(allRows.map((r) => (r.location as any)?.name ?? 'Unspecified')).slice(0, 6)

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Everything Northwind Technologies owns, in one place.</p>
      </header>

      {/* hero */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <div className="absolute -right-6 -top-6 opacity-20">
            <Boxes size={120} />
          </div>
          <p className="text-sm font-medium text-brand-100">Total assets under management</p>
          <p className="mt-3 text-5xl font-extrabold tabular-nums">
            {loading ? <Spinner className="h-8 w-8" /> : total}
          </p>
          <p className="mt-2 text-sm text-brand-100">across {data.length} categories</p>
        </div>

        <div className="card p-6 lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-slate-700">By status</p>
          <div className="space-y-3">
            {byStatus.map(([name, n]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-slate-600">{name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${statusTone(name).split(' ')[0].replace('50', '400').replace('100', '400')}`}
                    style={{ width: `${total ? (n / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-700">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* category cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {data.map(({ type, count, loading }) => {
          const Icon = type.icon
          return (
            <Link
              key={type.key}
              to={`/assets/${type.key}`}
              className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="mb-3 flex items-center justify-between">
                <Icon className={type.accent} size={22} />
                <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-brand-500" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-slate-900">
                {loading ? '·' : count}
              </p>
              <p className="text-sm text-slate-500">{type.label}</p>
            </Link>
          )
        })}
      </div>

      {/* locations */}
      <div className="card p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin size={16} className="text-slate-400" /> Top locations
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {byLocation.map(([name, n]) => (
            <div key={name} className="rounded-xl bg-slate-50 p-3">
              <p className="text-lg font-bold tabular-nums text-slate-800">{n}</p>
              <p className="truncate text-xs text-slate-500" title={name}>{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function tally(items: string[]): [string, number][] {
  const m = new Map<string, number>()
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
