import {
  useQuery, useMutation, useQueryClient, useQueries,
} from '@tanstack/react-query'
import { api, ApiError } from '../api/client'
import type { AssetRecord, DropdownRow } from '../api/types'
import { ASSET_TYPES, type AssetType } from '../config/assets'
import { BILLING_TYPES } from '../config/billing'

export function useAssets(type: AssetType) {
  return useQuery({
    queryKey: ['assets', type.key],
    queryFn: () => api.list<AssetRecord>(type.endpoint),
  })
}

// Counts for every asset type at once (dashboard).
export function useAllCounts() {
  return useQueries({
    queries: ASSET_TYPES.map((t) => ({
      queryKey: ['assets', t.key],
      queryFn: () => api.list<AssetRecord>(t.endpoint),
      staleTime: 30_000,
    })),
    combine: (results) =>
      ASSET_TYPES.map((t, i) => ({
        type: t,
        count: results[i].data?.length ?? 0,
        rows: results[i].data ?? [],
        loading: results[i].isLoading,
      })),
  })
}

export function useAsset(type: AssetType, id: number) {
  return useQuery({
    queryKey: ['asset', type.key, id],
    queryFn: () => api.get<AssetRecord>(type.endpoint, id),
    enabled: Number.isFinite(id),
  })
}

export function useSubResource(endpoint: string, id: number, sub: string, enabled = true) {
  return useQuery({
    queryKey: ['sub', endpoint, id, sub],
    queryFn: () => api.list<Record<string, unknown>>(`${endpoint}/${id}/${sub}`),
    enabled: enabled && Number.isFinite(id),
    retry: false,
  })
}

// Dropdown options, cached aggressively (they rarely change).
export function useDropdown(endpoint?: string) {
  return useQuery({
    queryKey: ['dropdown', endpoint],
    queryFn: () => api.list<DropdownRow>(endpoint as string),
    enabled: !!endpoint,
    staleTime: 5 * 60_000,
  })
}

export function useCreateAsset(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.create<AssetRecord>(type.endpoint, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', type.key] }),
  })
}

export function useUpdateAsset(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api.update<AssetRecord>(type.endpoint, id, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['assets', type.key] })
      qc.invalidateQueries({ queryKey: ['asset', type.key, vars.id] })
    },
  })
}

export function useDeleteAsset(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.remove(type.endpoint, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets', type.key] }),
  })
}

// Infocom (purchase/warranty/financial info) is a per-asset SINGLETON — GET 404s
// when nothing has been recorded yet, which we treat as "no data" rather than an
// error. Saving POSTs the first time, PATCHes thereafter.
export function useInfocom(type: AssetType, id: number) {
  return useQuery({
    queryKey: ['infocom', type.key, id],
    queryFn: async () => {
      try {
        return await api.getPath<Record<string, unknown>>(`${type.endpoint}/${id}/Infocom`)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
    enabled: Number.isFinite(id),
    retry: false,
  })
}

export function useSaveInfocom(type: AssetType) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body, exists }: { id: number; body: Record<string, unknown>; exists: boolean }) => {
      const path = `${type.endpoint}/${id}/Infocom`
      return exists ? api.patchPath(path, body) : api.postPath(path, body)
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['infocom', type.key, vars.id] }),
  })
}

// Aggregate billing data for the overview dashboard: every contract plus its
// cost line items (fetched in parallel), and every budget/supplier.
export function useBillingSummary() {
  const contractType = BILLING_TYPES.find((t) => t.key === 'contracts')!
  const budgetType = BILLING_TYPES.find((t) => t.key === 'budgets')!
  const supplierType = BILLING_TYPES.find((t) => t.key === 'suppliers')!

  const contracts = useQuery({
    queryKey: ['assets', contractType.key],
    queryFn: () => api.list<AssetRecord>(contractType.endpoint),
  })
  const budgets = useQuery({
    queryKey: ['assets', budgetType.key],
    queryFn: () => api.list<AssetRecord>(budgetType.endpoint),
  })
  const suppliers = useQuery({
    queryKey: ['assets', supplierType.key],
    queryFn: () => api.list<AssetRecord>(supplierType.endpoint),
  })

  const contractIds = contracts.data?.map((c) => c.id) ?? []
  const costQueries = useQueries({
    queries: contractIds.map((id) => ({
      queryKey: ['sub', contractType.endpoint, id, 'Cost'],
      queryFn: () => api.list<Record<string, unknown>>(`${contractType.endpoint}/${id}/Cost`),
      staleTime: 30_000,
    })),
    combine: (results) => ({
      data: results.flatMap((r) => r.data ?? []),
      loading: results.some((r) => r.isLoading),
    }),
  })

  return {
    contracts: contracts.data ?? [],
    budgets: budgets.data ?? [],
    suppliers: suppliers.data ?? [],
    costs: costQueries.data,
    loading: contracts.isLoading || budgets.isLoading || costQueries.loading,
  }
}
