import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Boxes } from 'lucide-react'
import { ASSET_TYPES } from '../config/assets'
import { BILLING_TYPES } from '../config/billing'

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
  }`
}

export function Layout() {
  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-100/70 px-4 py-5">
        <div className="mb-7 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight text-slate-900">Northwind</p>
            <p className="text-xs leading-tight text-slate-500">Asset Management</p>
          </div>
        </div>

        <nav className="space-y-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <p className="px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Assets</p>
          {ASSET_TYPES.map((t) => {
            const Icon = t.icon
            return (
              <NavLink key={t.key} to={`/assets/${t.key}`} className={navClass}>
                <Icon size={18} />
                {t.label}
              </NavLink>
            )
          })}

          <p className="px-3 pb-1 pt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Billing</p>
          <NavLink to="/billing" end className={navClass}>
            <LayoutDashboard size={18} />
            Overview
          </NavLink>
          {BILLING_TYPES.map((t) => {
            const Icon = t.icon
            return (
              <NavLink key={t.key} to={`/billing/${t.key}`} className={navClass}>
                <Icon size={18} />
                {t.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto rounded-xl bg-gradient-to-br from-brand-50 to-white p-3 ring-1 ring-brand-100">
          <p className="text-xs font-semibold text-brand-700">Prototype</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Live data via the GLPI REST API. A modern take on IT asset management.
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
