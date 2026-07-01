import { Truck, Wallet, FileText, type LucideIcon } from 'lucide-react'
import type { AssetType, FieldDef, SubResourceDef } from './assets'

// Financial / purchasing entities from GLPI's Management module. These reuse the
// exact same AssetType shape as ASSET_TYPES so the generic list/detail/form pages
// work unmodified — only the field definitions differ.

const contractCostSub: SubResourceDef = {
  key: 'Cost',
  label: 'Cost line items',
  columns: [
    { key: 'name', label: 'Description' },
    { key: 'cost', label: 'Amount ($)' },
    { key: 'date_begin', label: 'From' },
    { key: 'date_end', label: 'To' },
    { key: 'budget', label: 'Budget', ref: true },
  ],
}

export const BILLING_TYPES: AssetType[] = [
  {
    key: 'contracts', endpoint: '/Management/Contract', itemtype: 'Contract',
    label: 'Contracts', singular: 'Contract', icon: FileText, accent: 'text-orange-600', base: 'billing',
    fields: [
      { key: 'name', label: 'Name', type: 'text', inTable: true, required: true, section: 'Identity' },
      { key: 'number', label: 'Contract #', type: 'text', inTable: true, section: 'Identity' },
      { key: 'type', label: 'Type', type: 'ref', refEndpoint: '/Dropdowns/ContractType', inTable: true, section: 'Identity' },
      { key: 'status', label: 'Status', type: 'ref', refEndpoint: '/Dropdowns/State', inTable: true, section: 'Identity' },
      { key: 'date_begin', label: 'Start date', type: 'text', placeholder: 'YYYY-MM-DD', inTable: true, section: 'Terms' },
      { key: 'duration', label: 'Duration (months)', type: 'number', section: 'Terms' },
      { key: 'notice_period', label: 'Notice period (months)', type: 'number', section: 'Terms' },
      { key: 'invoice_period', label: 'Invoice period (months)', type: 'number', section: 'Terms' },
      { key: 'accounting_number', label: 'Accounting #', type: 'text', section: 'Terms' },
      { key: 'comment', label: 'Notes / Vendor', type: 'textarea', section: 'Notes' },
    ] as FieldDef[],
    subResources: [contractCostSub],
  },
  {
    key: 'suppliers', endpoint: '/Management/Supplier', itemtype: 'Supplier',
    label: 'Suppliers', singular: 'Supplier', icon: Truck, accent: 'text-teal-600', base: 'billing',
    fields: [
      { key: 'name', label: 'Name', type: 'text', inTable: true, required: true, section: 'Identity' },
      { key: 'type', label: 'Type', type: 'ref', refEndpoint: '/Dropdowns/SupplierType', inTable: true, section: 'Identity' },
      { key: 'comment', label: 'Notes', type: 'textarea', section: 'Notes' },
    ] as FieldDef[],
  },
  {
    key: 'budgets', endpoint: '/Management/Budget', itemtype: 'Budget',
    label: 'Budgets', singular: 'Budget', icon: Wallet, accent: 'text-indigo-600', base: 'billing',
    fields: [
      { key: 'name', label: 'Name', type: 'text', inTable: true, required: true, section: 'Identity' },
      { key: 'type', label: 'Type', type: 'ref', refEndpoint: '/Dropdowns/BudgetType', inTable: true, section: 'Identity' },
      { key: 'value', label: 'Allocated value ($)', type: 'number', inTable: true, section: 'Terms' },
      { key: 'date_begin', label: 'Start date', type: 'text', placeholder: 'YYYY-MM-DD', section: 'Terms' },
      { key: 'date_end', label: 'End date', type: 'text', placeholder: 'YYYY-MM-DD', section: 'Terms' },
      { key: 'comment', label: 'Notes', type: 'textarea', section: 'Notes' },
    ] as FieldDef[],
  },
]

export const BILLING_ICON: LucideIcon = Wallet

export function billingByKey(key: string | undefined): AssetType | undefined {
  return BILLING_TYPES.find((b) => b.key === key)
}
