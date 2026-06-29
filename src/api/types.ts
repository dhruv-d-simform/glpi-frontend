export interface Ref {
  id: number
  name?: string
}

export interface AssetRecord {
  id: number
  name: string
  serial?: string | null
  otherserial?: string | null
  comment?: string | null
  contact?: string | null
  contact_num?: string | null
  status?: Ref | null
  manufacturer?: Ref | null
  model?: Ref | null
  type?: Ref | null
  location?: Ref | null
  user?: Ref | null
  user_tech?: Ref | null
  date_creation?: string | null
  date_mod?: string | null
  // type-specific extras
  [key: string]: unknown
}

export interface DropdownRow {
  id: number
  name?: string
  username?: string
  realname?: string
  firstname?: string
  completename?: string
}
