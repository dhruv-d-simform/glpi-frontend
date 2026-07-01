import { Link } from 'react-router-dom'
import { ArrowUpRight, Wallet, Truck, FileText, AlertTriangle } from 'lucide-react'
import { useBillingSummary } from '../lib/queries'
import { StatusBadge, Spinner } from '../components/ui'
import type { Ref } from '../api/types'

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Contracts within this many months of their renewal/notice date surface as
// "upcoming" — cheap approximation of GLPI's own contract alerting.
const UPCOMING_MONTHS = 6

function monthsUntilEnd(dateBegin?: string | null, durationMonths?: number | null): number | null {
  if (!dateBegin || !durationMonths) return null
  const begin = new Date(dateBegin)
  if (Number.isNaN(begin.getTime())) return null
  const end = new Date(begin)
  end.setMonth(end.getMonth() + Number(durationMonths))
  return Math.round((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
}

export function BillingDashboard() {
  const { contracts, budgets, suppliers, costs, loading } = useBillingSummary()

  const costsByContract = new Map<number, number>()
  for (const c of costs) {
    const cid = (c.contract as Ref | null)?.id
    if (cid == null) continue
    costsByContract.set(cid, (costsByContract.get(cid) ?? 0) + Number(c.cost ?? 0))
  }
  const totalAnnualSpend = [...costsByContract.values()].reduce((s, v) => s + v, 0)
  const totalBudgetAllocated = budgets.reduce((s, b) => s + Number(b.value ?? 0), 0)

  const upcoming = contracts
    .map((c) => ({ contract: c, monthsLeft: monthsUntilEnd(c.date_begin as string, c.duration as number) }))
    .filter((c) => c.monthsLeft != null && c.monthsLeft <= UPCOMING_MONTHS)
    .sort((a, b) => (a.monthsLeft ?? 0) - (b.monthsLeft ?? 0))

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Billing overview</h1>
        <p className="mt-1 text-sm text-slate-500">Contracts, budgets and suppliers behind Northwind's asset spend.</p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <div className="absolute -right-6 -top-6 opacity-20"><Wallet size={120} /></div>
          <p className="text-sm font-medium text-brand-100">Contracted annual spend</p>
          <p className="mt-3 text-4xl font-extrabold tabular-nums">
            {loading ? <Spinner className="h-8 w-8" /> : money(totalAnnualSpend)}
          </p>
          <p className="mt-2 text-sm text-brand-100">across {contracts.length} active contracts</p>
        </div>

        <div className="card p-6">
          <p className="mb-1 text-sm font-semibold text-slate-700">Budget allocated (FY)</p>
          <p className="text-3xl font-extrabold tabular-nums text-slate-900">
            {loading ? '·' : money(totalBudgetAllocated)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{budgets.length} budgets tracked</p>
        </div>

        <div className="card p-6">
          <p className="mb-1 text-sm font-semibold text-slate-700">Suppliers on file</p>
          <p className="text-3xl font-extrabold tabular-nums text-slate-900">{loading ? '·' : suppliers.length}</p>
          <p className="mt-1 text-sm text-slate-500">vendors across hardware, telecom & software</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { key: 'contracts', label: 'Contracts', icon: FileText, count: contracts.length, accent: 'text-orange-600' },
          { key: 'budgets', label: 'Budgets', icon: Wallet, count: budgets.length, accent: 'text-indigo-600' },
          { key: 'suppliers', label: 'Suppliers', icon: Truck, count: suppliers.length, accent: 'text-teal-600' },
        ].map(({ key, label, icon: Icon, count, accent }) => (
          <Link key={key} to={`/billing/${key}`} className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <Icon className={accent} size={22} />
              <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-brand-500" />
            </div>
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">{loading ? '·' : count}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="mb-6 card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700">Renewals due within {UPCOMING_MONTHS} months</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {upcoming.map(({ contract, monthsLeft }) => (
              <Link
                key={contract.id}
                to={`/billing/contracts/${contract.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50/60"
              >
                <span className="font-medium text-slate-800">{contract.name}</span>
                <span className={`font-semibold ${monthsLeft! < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {monthsLeft! < 0 ? `Expired ${Math.abs(monthsLeft!)} mo ago` : `${monthsLeft} mo left`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-700">Contracts</h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{contracts.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Annual cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <Link to={`/billing/contracts/${c.id}`}>{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(c.type as Ref | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge name={(c.status as Ref | null)?.name} /></td>
                  <td className="px-4 py-3 text-slate-600">{(c.date_begin as string) ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {money(costsByContract.get(c.id) ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
