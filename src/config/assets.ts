import {
  Laptop, Monitor, Printer, Smartphone, Network, Mouse, Boxes,
  type LucideIcon,
} from 'lucide-react'
import { billingByKey } from './billing'

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'ref'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  refEndpoint?: string // required when type === 'ref'
  inTable?: boolean // show as a column in the list table
  required?: boolean
  placeholder?: string
  section?: string // grouping in the detail / form
}

export interface SubResourceDef {
  key: string // path segment, e.g. "Volume"
  label: string
  columns: { key: string; label: string; ref?: boolean }[]
}

export interface AssetType {
  key: string // route slug, e.g. "computers"
  endpoint: string // "/Assets/Computer"
  itemtype: string // "Computer"
  label: string // plural display
  singular: string
  icon: LucideIcon
  accent: string // tailwind text color class for the icon
  fields: FieldDef[]
  subResources?: SubResourceDef[]
  base?: 'assets' | 'billing' // route prefix; defaults to "assets"
}

// Common fields shared by every asset type.
function common(itemtype: string): FieldDef[] {
  return [
    { key: 'name', label: 'Name / Hostname', type: 'text', inTable: true, required: true, section: 'Identity' },
    { key: 'status', label: 'Status', type: 'ref', refEndpoint: '/Dropdowns/State', inTable: true, section: 'Identity' },
    { key: 'serial', label: 'Serial number', type: 'text', section: 'Identity' },
    { key: 'otherserial', label: 'Asset tag', type: 'text', section: 'Identity' },
    { key: 'type', label: 'Type', type: 'ref', refEndpoint: `/Dropdowns/${itemtype}Type`, inTable: true, section: 'Hardware' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'ref', refEndpoint: '/Dropdowns/Manufacturer', inTable: true, section: 'Hardware' },
    { key: 'model', label: 'Model', type: 'ref', refEndpoint: `/Dropdowns/${itemtype}Model`, section: 'Hardware' },
    { key: 'location', label: 'Location', type: 'ref', refEndpoint: '/Dropdowns/Location', inTable: true, section: 'Assignment' },
    { key: 'user', label: 'Assigned user', type: 'ref', refEndpoint: '/Administration/User', inTable: true, section: 'Assignment' },
    { key: 'user_tech', label: 'Technician', type: 'ref', refEndpoint: '/Administration/User', section: 'Assignment' },
    { key: 'contact', label: 'Contact', type: 'text', section: 'Assignment' },
    { key: 'comment', label: 'Notes / Inventory', type: 'textarea', section: 'Notes' },
  ]
}

// Contracts (support/maintenance/lease/telecom/subscription) linked to an asset.
// This sub-resource returns the junction row (Computer_Contract etc), which only
// nests the linked contract as a {id,name} ref — not the contract's own fields.
const contractSub: SubResourceDef = {
  key: 'Contract', label: 'Contracts & support',
  columns: [
    { key: 'contract', label: 'Contract', ref: true },
  ],
}

const computerSubs: SubResourceDef[] = [
  {
    key: 'OSInstallation', label: 'Operating system',
    columns: [
      { key: 'license_number', label: 'License' },
      { key: 'hostid', label: 'Host ID' },
      { key: 'company', label: 'Company' },
      { key: 'date_install', label: 'Installed' },
    ],
  },
  {
    key: 'Volume', label: 'Storage volumes',
    columns: [
      { key: 'name', label: 'Volume' },
      { key: 'filesystem', label: 'Filesystem', ref: true },
      { key: 'mount_point', label: 'Mount' },
      { key: 'total_size', label: 'Size (MB)' },
      { key: 'free_size', label: 'Free (MB)' },
      { key: 'encryption_tool', label: 'Encryption' },
    ],
  },
  {
    key: 'Antivirus', label: 'Security / antivirus',
    columns: [
      { key: 'name', label: 'Product' },
      { key: 'antivirus_version', label: 'Version' },
      { key: 'signature_version', label: 'Signatures' },
      { key: 'is_up_to_date', label: 'Up to date' },
    ],
  },
  {
    key: 'VirtualMachine', label: 'Virtual machines',
    columns: [
      { key: 'name', label: 'VM' },
      { key: 'vcpu', label: 'vCPU' },
      { key: 'ram', label: 'RAM (MB)' },
      { key: 'state', label: 'State', ref: true },
      { key: 'type', label: 'Type', ref: true },
    ],
  },
  {
    key: 'SoftwareInstallation', label: 'Installed software',
    columns: [
      { key: 'software', label: 'Software', ref: true },
      { key: 'softwareversion', label: 'Version', ref: true },
      { key: 'date_install', label: 'Installed' },
    ],
  },
  {
    key: 'RemoteManagement', label: 'Remote access',
    columns: [
      { key: 'type', label: 'Tool' },
      { key: 'remoteid', label: 'Remote ID' },
    ],
  },
]

export const ASSET_TYPES: AssetType[] = [
  {
    key: 'computers', endpoint: '/Assets/Computer', itemtype: 'Computer',
    label: 'Computers', singular: 'Computer', icon: Laptop, accent: 'text-brand-600',
    fields: common('Computer'),
    subResources: [...computerSubs, contractSub],
  },
  {
    key: 'monitors', endpoint: '/Assets/Monitor', itemtype: 'Monitor',
    label: 'Monitors', singular: 'Monitor', icon: Monitor, accent: 'text-sky-600',
    fields: [
      ...common('Monitor'),
      { key: 'size', label: 'Size (inch)', type: 'number', section: 'Hardware' },
      { key: 'has_hdmi', label: 'HDMI', type: 'boolean', section: 'Ports' },
      { key: 'has_displayport', label: 'DisplayPort', type: 'boolean', section: 'Ports' },
      { key: 'has_speaker', label: 'Speakers', type: 'boolean', section: 'Ports' },
      { key: 'has_pivot', label: 'Pivot / rotate', type: 'boolean', section: 'Ports' },
    ],
    subResources: [contractSub],
  },
  {
    key: 'printers', endpoint: '/Assets/Printer', itemtype: 'Printer',
    label: 'Printers', singular: 'Printer', icon: Printer, accent: 'text-amber-600',
    fields: [
      ...common('Printer'),
      { key: 'sysdescr', label: 'System description', type: 'text', section: 'Hardware' },
      { key: 'has_ethernet', label: 'Ethernet', type: 'boolean', section: 'Ports' },
      { key: 'has_wifi', label: 'Wi-Fi', type: 'boolean', section: 'Ports' },
      { key: 'has_usb', label: 'USB', type: 'boolean', section: 'Ports' },
    ],
    subResources: [contractSub],
  },
  {
    key: 'phones', endpoint: '/Assets/Phone', itemtype: 'Phone',
    label: 'Phones', singular: 'Phone', icon: Smartphone, accent: 'text-emerald-600',
    fields: [
      ...common('Phone'),
      { key: 'brand', label: 'Brand', type: 'text', section: 'Hardware' },
      { key: 'number_line', label: 'Phone number', type: 'text', section: 'Hardware' },
      { key: 'have_headset', label: 'Headset', type: 'boolean', section: 'Features' },
      { key: 'have_hp', label: 'Speakerphone', type: 'boolean', section: 'Features' },
    ],
    subResources: [contractSub],
  },
  {
    key: 'network', endpoint: '/Assets/NetworkEquipment', itemtype: 'NetworkEquipment',
    label: 'Network', singular: 'Network device', icon: Network, accent: 'text-violet-600',
    fields: [
      ...common('NetworkEquipment'),
      { key: 'cpu', label: 'CPU cores', type: 'number', section: 'Hardware' },
      { key: 'ram', label: 'RAM (MB)', type: 'number', section: 'Hardware' },
      { key: 'sysdescr', label: 'System description', type: 'text', section: 'Hardware' },
    ],
    subResources: [contractSub],
  },
  {
    key: 'peripherals', endpoint: '/Assets/Peripheral', itemtype: 'Peripheral',
    label: 'Peripherals', singular: 'Peripheral', icon: Mouse, accent: 'text-rose-600',
    fields: [
      ...common('Peripheral'),
      { key: 'brand', label: 'Brand', type: 'text', section: 'Hardware' },
    ],
    subResources: [contractSub],
  },
]

export const ALL_ICON = Boxes

export function assetByKey(key: string | undefined): AssetType | undefined {
  return ASSET_TYPES.find((a) => a.key === key)
}

// Resolves a route type-key against both physical assets and billing/management
// entities (Suppliers, Budgets, Contracts) — lets the generic list/detail/form
// pages serve both without knowing which registry a key came from.
export function resolveType(key: string | undefined): AssetType | undefined {
  return assetByKey(key) ?? billingByKey(key)
}

// Route prefix ("assets" or "billing") a given type's list/detail pages live under.
export function typeBase(type: AssetType): string {
  return type.base ?? 'assets'
}

// Map a GLPI State name to a badge palette.
export function statusTone(name?: string): string {
  const n = (name || '').toLowerCase()
  if (n.includes('use')) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  if (n.includes('stock')) return 'bg-slate-100 text-slate-600 ring-slate-500/20'
  if (n.includes('maint')) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  if (n.includes('retir')) return 'bg-rose-50 text-rose-700 ring-rose-600/20'
  if (n.includes('loan')) return 'bg-violet-50 text-violet-700 ring-violet-600/20'
  return 'bg-slate-100 text-slate-600 ring-slate-500/20'
}
